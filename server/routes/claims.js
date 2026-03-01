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

// POST /api/claims — file a new warranty claim
router.post("/", async (req, res) => {
  try {
    const { roofId, manufacturer, amount, description } = req.body;
    if (!roofId || !manufacturer) return res.status(400).json({ error: "roofId and manufacturer are required" });

    const claimId = `claim-${Date.now()}`;
    const filed = new Date().toISOString().split("T")[0];

    await pool.query(
      "INSERT INTO claims (id, roof_id, manufacturer, filed, amount, status, description) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [claimId, roofId, manufacturer, filed, amount || 0, "in-progress", description || null]
    );

    // Create initial timeline event
    await pool.query(
      "INSERT INTO claim_events (claim_id, date, event, sort_order) VALUES ($1, $2, $3, $4)",
      [claimId, filed, "Claim filed", 0]
    );

    res.json({ success: true, id: claimId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/claims/:id/status — update claim status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });
    await pool.query("UPDATE claims SET status = $1 WHERE id = $2", [status, req.params.id]);

    // Add timeline event
    const date = new Date().toISOString().split("T")[0];
    const { rows } = await pool.query("SELECT MAX(sort_order) AS max_order FROM claim_events WHERE claim_id = $1", [req.params.id]);
    const nextOrder = (rows[0]?.max_order || 0) + 1;
    const eventText = status === "approved" ? "Claim approved" : status === "denied" ? "Claim denied" : `Status updated to ${status}`;
    await pool.query(
      "INSERT INTO claim_events (claim_id, date, event, sort_order) VALUES ($1, $2, $3, $4)",
      [req.params.id, date, eventText, nextOrder]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
