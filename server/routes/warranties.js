import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/warranties — the full warranty options database (37 items)
router.get("/", async (req, res) => {
  try {
    const { category, membrane } = req.query;
    let query = "SELECT * FROM warranty_db";
    const params = [];
    const conditions = [];
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (membrane) {
      params.push(membrane);
      conditions.push(`membranes @> $${params.length}::jsonb`);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY rating DESC, name";

    const { rows } = await pool.query(query, params);

    const result = rows.map(w => ({
      id: w.id,
      category: w.category,
      manufacturer: w.manufacturer,
      name: w.name,
      membranes: w.membranes || [],
      term: w.term,
      laborCovered: w.labor_covered,
      materialCovered: w.material_covered,
      consequential: w.consequential,
      dollarCap: w.dollar_cap,
      inspFreq: w.insp_freq,
      inspBy: w.insp_by,
      transferable: w.transferable,
      pondingExcluded: w.ponding_excluded,
      windLimit: w.wind_limit,
      strengths: w.strengths || [],
      weaknesses: w.weaknesses || [],
      bestFor: w.best_for,
      rating: w.rating,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warranties/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM warranty_db WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const w = rows[0];
    res.json({
      id: w.id, category: w.category, manufacturer: w.manufacturer, name: w.name,
      membranes: w.membranes || [], term: w.term,
      laborCovered: w.labor_covered, materialCovered: w.material_covered,
      consequential: w.consequential, dollarCap: w.dollar_cap,
      inspFreq: w.insp_freq, inspBy: w.insp_by, transferable: w.transferable,
      pondingExcluded: w.ponding_excluded, windLimit: w.wind_limit,
      strengths: w.strengths || [], weaknesses: w.weaknesses || [],
      bestFor: w.best_for, rating: w.rating,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
