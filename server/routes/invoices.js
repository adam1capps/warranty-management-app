import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/invoices
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM invoices ORDER BY date DESC");
    res.json(rows.map(r => ({
      id: r.id,
      roofId: r.roof_id,
      vendor: r.vendor,
      date: r.date,
      amount: parseFloat(r.amount),
      desc: r.description,
      flagged: r.flagged,
      flagReason: r.flag_reason,
      status: r.status,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices — create a new invoice
router.post("/", async (req, res) => {
  try {
    const { roofId, vendor, date, amount, description, flagged, flagReason } = req.body;
    if (!roofId || !vendor) return res.status(400).json({ error: "roofId and vendor are required" });

    const invId = `inv-${Date.now()}`;
    await pool.query(
      "INSERT INTO invoices (id, roof_id, vendor, date, amount, description, flagged, flag_reason, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [invId, roofId, vendor, date || new Date().toISOString().split("T")[0], amount || 0, description || null, flagged || false, flagReason || null, "review"]
    );

    res.json({ success: true, id: invId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/invoices/:id — update invoice status or flag
router.put("/:id", async (req, res) => {
  try {
    const { status, flagged, flagReason } = req.body;
    const fields = [];
    const params = [];
    let idx = 1;

    if (status !== undefined) { fields.push(`status = $${idx++}`); params.push(status); }
    if (flagged !== undefined) { fields.push(`flagged = $${idx++}`); params.push(flagged); }
    if (flagReason !== undefined) { fields.push(`flag_reason = $${idx++}`); params.push(flagReason); }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    params.push(req.params.id);
    await pool.query(`UPDATE invoices SET ${fields.join(", ")} WHERE id = $${idx}`, params);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
