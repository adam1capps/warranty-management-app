import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/inspections
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM inspections ORDER BY date DESC");
    res.json(rows.map(r => ({
      id: r.id,
      roofId: r.roof_id,
      date: r.date,
      inspector: r.inspector,
      company: r.company,
      type: r.type,
      status: r.status,
      score: r.score,
      photos: r.photos,
      moistureData: r.moisture_data,
      notes: r.notes,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
