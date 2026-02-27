import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/claims — includes timeline events
router.get("/", async (_req, res) => {
  try {
    const { rows: claims } = await pool.query("SELECT * FROM claims ORDER BY filed DESC");
    const { rows: events } = await pool.query("SELECT * FROM claim_events ORDER BY claim_id, sort_order");

    const eventMap = {};
    for (const e of events) {
      if (!eventMap[e.claim_id]) eventMap[e.claim_id] = [];
      eventMap[e.claim_id].push({ date: e.date, event: e.event });
    }

    res.json(claims.map(c => ({
      id: c.id,
      roofId: c.roof_id,
      manufacturer: c.manufacturer,
      filed: c.filed,
      amount: parseFloat(c.amount),
      status: c.status,
      desc: c.description,
      timeline: eventMap[c.id] || [],
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
