import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/dashboard/contractor — all customers with summary counts
router.get("/contractor", async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows: owners } = await pool.query("SELECT * FROM owners WHERE user_id = $1 ORDER BY name", [userId]);
    const { rows: props } = await pool.query("SELECT * FROM properties WHERE user_id = $1", [userId]);
    const { rows: roofs } = await pool.query(
      `SELECT r.*, rw.manufacturer, rw.status AS w_status, rw.end_date
       FROM roofs r LEFT JOIN roof_warranties rw ON rw.roof_id = r.id
       WHERE r.user_id = $1`, [userId]
    );
    const { rows: claimsData } = await pool.query("SELECT * FROM claims WHERE user_id = $1", [userId]);
    const { rows: invoicesData } = await pool.query("SELECT * FROM invoices WHERE user_id = $1", [userId]);

    const result = owners.map(o => {
      const ownerProps = props.filter(p => p.owner_id === o.id);
      const ownerPropIds = ownerProps.map(p => p.id);
      const ownerRoofs = roofs.filter(r => ownerPropIds.includes(r.property_id));
      const ownerRoofIds = ownerRoofs.map(r => r.id);
      const ownerClaims = claimsData.filter(c => ownerRoofIds.includes(c.roof_id));
      const ownerInvoices = invoicesData.filter(i => ownerRoofIds.includes(i.roof_id));

      return {
        id: o.id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        isDemo: o.is_demo,
        propertyCount: ownerProps.length,
        roofCount: ownerRoofs.length,
        activeWarranties: ownerRoofs.filter(r => r.w_status === "active").length,
        activeClaims: ownerClaims.filter(c => c.status === "in-progress").length,
        totalClaimed: ownerClaims.filter(c => c.status === "approved").reduce((s, c) => s + parseFloat(c.amount || 0), 0),
        totalInvoiced: ownerInvoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
      };
    });

    // Summary KPIs
    const kpis = {
      totalCustomers: owners.length,
      totalProperties: props.length,
      totalRoofs: roofs.length,
      activeWarranties: roofs.filter(r => r.w_status === "active").length,
      activeClaims: claimsData.filter(c => c.status === "in-progress").length,
      totalRecovered: claimsData.filter(c => c.status === "approved").reduce((s, c) => s + parseFloat(c.amount || 0), 0),
    };

    res.json({ kpis, customers: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/customer/:ownerId — single customer detail
router.get("/customer/:ownerId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { ownerId } = req.params;

    const { rows: ownerRows } = await pool.query("SELECT * FROM owners WHERE id = $1 AND user_id = $2", [ownerId, userId]);
    if (ownerRows.length === 0) return res.status(404).json({ error: "Owner not found" });
    const owner = ownerRows[0];

    const { rows: props } = await pool.query("SELECT * FROM properties WHERE owner_id = $1 AND user_id = $2 ORDER BY name", [ownerId, userId]);
    const propIds = props.map(p => p.id);

    let roofs = [];
    if (propIds.length > 0) {
      const { rows } = await pool.query(
        `SELECT r.*, rw.manufacturer, rw.w_type, rw.start_date, rw.end_date, rw.status AS w_status,
                rw.compliance, rw.next_insp, rw.maintenance_plan, rw.warranty_db_id
         FROM roofs r LEFT JOIN roof_warranties rw ON rw.roof_id = r.id
         WHERE r.property_id = ANY($1) AND r.user_id = $2 ORDER BY r.section`, [propIds, userId]
      );
      roofs = rows;
    }

    const roofIds = roofs.map(r => r.id);
    let recentInspections = [], recentInvoices = [], activeClaims = [];
    if (roofIds.length > 0) {
      const { rows: insp } = await pool.query(
        "SELECT * FROM inspections WHERE roof_id = ANY($1) AND user_id = $2 ORDER BY date DESC LIMIT 10", [roofIds, userId]);
      recentInspections = insp;
      const { rows: inv } = await pool.query(
        "SELECT * FROM invoices WHERE roof_id = ANY($1) AND user_id = $2 ORDER BY date DESC LIMIT 10", [roofIds, userId]);
      recentInvoices = inv;
      const { rows: cl } = await pool.query(
        "SELECT * FROM claims WHERE roof_id = ANY($1) AND user_id = $2 ORDER BY filed DESC", [roofIds, userId]);
      activeClaims = cl;
    }

    res.json({
      owner: { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone, contact: owner.contact, notes: owner.notes },
      properties: props.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        roofs: roofs.filter(r => r.property_id === p.id).map(r => ({
          id: r.id, section: r.section, sqFt: r.sq_ft, type: r.type, installed: r.installed, yearInstalled: r.year_installed,
          warranty: { manufacturer: r.manufacturer, wType: r.w_type, start: r.start_date, end: r.end_date, status: r.w_status, compliance: r.compliance, nextInsp: r.next_insp, maintenancePlan: r.maintenance_plan, warrantyDbId: r.warranty_db_id },
        })),
      })),
      recentInspections: recentInspections.map(i => ({ id: i.id, roofId: i.roof_id, date: i.date, inspector: i.inspector, company: i.company, type: i.type, status: i.status, score: i.score })),
      recentInvoices: recentInvoices.map(i => ({ id: i.id, roofId: i.roof_id, vendor: i.vendor, date: i.date, amount: parseFloat(i.amount || 0), description: i.description, status: i.status, flagged: i.flagged })),
      claims: activeClaims.map(c => ({ id: c.id, roofId: c.roof_id, manufacturer: c.manufacturer, filed: c.filed, amount: parseFloat(c.amount || 0), status: c.status, desc: c.description, invoiceId: c.invoice_id })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/property/:propertyId — single property detail
router.get("/property/:propertyId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    const { rows: propRows } = await pool.query("SELECT * FROM properties WHERE id = $1 AND user_id = $2", [propertyId, userId]);
    if (propRows.length === 0) return res.status(404).json({ error: "Property not found" });
    const prop = propRows[0];

    const { rows: ownerRows } = await pool.query("SELECT name FROM owners WHERE id = $1", [prop.owner_id]);
    const ownerName = ownerRows[0]?.name || "Unknown";

    const { rows: roofs } = await pool.query(
      `SELECT r.*, rw.manufacturer, rw.w_type, rw.start_date, rw.end_date, rw.status AS w_status,
              rw.compliance, rw.next_insp, rw.last_insp, rw.maintenance_plan, rw.warranty_db_id,
              rw.repair_spend_last_year, rw.covered_amount, rw.coverage, rw.exclusions, rw.requirements
       FROM roofs r LEFT JOIN roof_warranties rw ON rw.roof_id = r.id
       WHERE r.property_id = $1 AND r.user_id = $2 ORDER BY r.section`, [propertyId, userId]
    );

    const roofIds = roofs.map(r => r.id);
    let invoices = [], inspections = [], claims = [];
    if (roofIds.length > 0) {
      const { rows: inv } = await pool.query("SELECT * FROM invoices WHERE roof_id = ANY($1) AND user_id = $2 ORDER BY date DESC", [roofIds, userId]);
      invoices = inv;
      const { rows: insp } = await pool.query("SELECT * FROM inspections WHERE roof_id = ANY($1) AND user_id = $2 ORDER BY date DESC", [roofIds, userId]);
      inspections = insp;
      const { rows: cl } = await pool.query("SELECT * FROM claims WHERE roof_id = ANY($1) AND user_id = $2 ORDER BY filed DESC", [roofIds, userId]);
      claims = cl;
    }

    res.json({
      property: { id: prop.id, name: prop.name, address: prop.address, ownerName },
      roofs: roofs.map(r => ({
        id: r.id, section: r.section, sqFt: r.sq_ft, type: r.type, installed: r.installed, yearInstalled: r.year_installed,
        warranty: {
          manufacturer: r.manufacturer, wType: r.w_type, start: r.start_date, end: r.end_date, status: r.w_status,
          compliance: r.compliance, nextInsp: r.next_insp, lastInsp: r.last_insp, maintenancePlan: r.maintenance_plan,
          warrantyDbId: r.warranty_db_id, repairSpendLastYear: r.repair_spend_last_year ? parseFloat(r.repair_spend_last_year) : null,
          coveredAmount: r.covered_amount ? parseFloat(r.covered_amount) : null,
          coverage: r.coverage || [], exclusions: r.exclusions || [], requirements: r.requirements || [],
        },
      })),
      invoices: invoices.map(i => ({ id: i.id, roofId: i.roof_id, vendor: i.vendor, date: i.date, amount: parseFloat(i.amount || 0), description: i.description, status: i.status, flagged: i.flagged, flagReason: i.flag_reason })),
      inspections: inspections.map(i => ({ id: i.id, roofId: i.roof_id, date: i.date, inspector: i.inspector, company: i.company, type: i.type, status: i.status, score: i.score, photos: i.photos, moistureData: i.moisture_data, notes: i.notes })),
      claims: claims.map(c => ({ id: c.id, roofId: c.roof_id, manufacturer: c.manufacturer, filed: c.filed, amount: parseFloat(c.amount || 0), status: c.status, desc: c.description, invoiceId: c.invoice_id })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
