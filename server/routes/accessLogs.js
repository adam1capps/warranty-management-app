import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/access-logs
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM access_logs ORDER BY date DESC");
    res.json(rows.map(r => ({
      id: r.id,
      roofId: r.roof_id,
      person: r.person,
      company: r.company,
      purpose: r.purpose,
      date: r.date,
      duration: r.duration,
      notes: r.notes,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/access-logs — log a new roof access entry
router.post("/", async (req, res) => {
  try {
    const { roofId, person, company, purpose, date, duration, notes } = req.body;
    if (!roofId || !person) return res.status(400).json({ error: "roofId and person are required" });

    const logId = `log-${Date.now()}`;
    await pool.query(
      "INSERT INTO access_logs (id, roof_id, person, company, purpose, date, duration, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [logId, roofId, person, company || null, purpose || null, date || new Date().toISOString(), duration || null, notes || null]
    );

    res.json({ success: true, id: logId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
