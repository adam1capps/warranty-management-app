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

export default router;
