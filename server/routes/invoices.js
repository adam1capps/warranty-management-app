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

export default router;
