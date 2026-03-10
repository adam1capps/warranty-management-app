import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/photos?entityType=inspection&entityId=insp-123
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { entityType, entityId } = req.query;
    if (!entityType || !entityId) return res.status(400).json({ error: "entityType and entityId are required" });

    const { rows } = await pool.query(
      "SELECT * FROM photos WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 ORDER BY uploaded_at DESC",
      [userId, entityType, entityId]
    );
    res.json(rows.map(p => ({
      id: p.id,
      entityType: p.entity_type,
      entityId: p.entity_id,
      url: p.url,
      caption: p.caption,
      uploadedAt: p.uploaded_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/photos — upload a photo (base64 in JSON body)
router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { entityType, entityId, url, caption } = req.body;
    if (!entityType || !entityId || !url) return res.status(400).json({ error: "entityType, entityId, and url (base64 data) are required" });

    // Limit base64 size to ~5MB
    if (url.length > 7 * 1024 * 1024) return res.status(400).json({ error: "Photo too large (max 5MB)" });

    const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await pool.query(
      "INSERT INTO photos (id, user_id, entity_type, entity_id, url, caption) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, userId, entityType, entityId, url, caption || null]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/photos/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query("DELETE FROM photos WHERE id = $1 AND user_id = $2 RETURNING id", [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: "Photo not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
