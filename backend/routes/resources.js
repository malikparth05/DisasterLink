const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/summary', async (req, res) => {
  try {
    const disasterId = Number(req.query.disaster_id);
    const hasFilter = Number.isInteger(disasterId);
    const [rows] = await db.query(`
      SELECT
        r.category,
        ROUND(SUM(ci.quantity_available), 2) AS total_quantity
      FROM CAMP_INVENTORY ci
      JOIN RESOURCE r ON ci.resource_id = r.resource_id
      JOIN RELIEF_CAMP c ON ci.camp_id = c.camp_id
      ${hasFilter ? 'WHERE c.disaster_id = ?' : ''}
      GROUP BY r.category
      ORDER BY total_quantity DESC
    `, hasFilter ? [disasterId] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
