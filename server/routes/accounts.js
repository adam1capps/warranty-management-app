import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/accounts — full nested hierarchy: owners → pms, properties → roofs → warranty
router.get("/", async (_req, res) => {
  try {
    const { rows: owners } = await pool.query("SELECT * FROM owners ORDER BY name");
    const { rows: pms } = await pool.query("SELECT * FROM property_managers ORDER BY name");
    const { rows: props } = await pool.query("SELECT * FROM properties ORDER BY name");
    const { rows: roofs } = await pool.query("SELECT r.*, rw.manufacturer, rw.w_type, rw.start_date, rw.end_date, rw.status AS w_status, rw.compliance, rw.next_insp, rw.last_insp, rw.coverage, rw.exclusions, rw.requirements FROM roofs r LEFT JOIN roof_warranties rw ON rw.roof_id = r.id ORDER BY r.section");

    const result = owners.map(o => ({
      id: o.id,
      name: o.name,
      contact: o.contact,
      email: o.email,
      phone: o.phone,
      notes: o.notes,
      pms: pms.filter(pm => pm.owner_id === o.id).map(pm => ({
        id: pm.id, name: pm.name, contact: pm.contact, email: pm.email, phone: pm.phone, notes: pm.notes,
      })),
      properties: props.filter(p => p.owner_id === o.id).map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        managedBy: p.managed_by,
        roofs: roofs.filter(r => r.property_id === p.id).map(r => ({
          id: r.id,
          section: r.section,
          sqFt: r.sq_ft,
          type: r.type,
          installed: r.installed,
          warranty: {
            manufacturer: r.manufacturer,
            wType: r.w_type,
            start: r.start_date,
            end: r.end_date,
            status: r.w_status,
            compliance: r.compliance,
            nextInsp: r.next_insp,
            lastInsp: r.last_insp,
            coverage: r.coverage || [],
            exclusions: r.exclusions || [],
            requirements: r.requirements || [],
          },
        })),
      })),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
