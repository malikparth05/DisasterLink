const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const disasterId = Number(req.query.disaster_id);
    const hasFilter = Number.isInteger(disasterId);
    const [rows] = await db.query(
      `SELECT
        c.camp_id,
        c.name AS camp_name,
        r.name AS resource_name,
        r.category,
        ci.quantity_available,
        ci.minimum_threshold,
        (ci.minimum_threshold - ci.quantity_available) AS shortage_amount
      FROM CAMP_INVENTORY ci
      JOIN RELIEF_CAMP c ON ci.camp_id = c.camp_id
      JOIN RESOURCE r ON ci.resource_id = r.resource_id
      WHERE ci.quantity_available < ci.minimum_threshold
      ${hasFilter ? 'AND c.disaster_id = ?' : ''}
      ORDER BY shortage_amount DESC`,
      hasFilter ? [disasterId] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { camp_id, resource_id, quantity_available, minimum_threshold } = req.body;
    await db.query(
      'INSERT INTO CAMP_INVENTORY (camp_id, resource_id, quantity_available, minimum_threshold) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity_available = quantity_available + VALUES(quantity_available), minimum_threshold = VALUES(minimum_threshold)',
      [camp_id, resource_id, quantity_available, minimum_threshold]
    );
    res.json({ success: true, message: 'Inventory updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
