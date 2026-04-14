const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        r.category,
        ROUND(SUM(ci.quantity_available), 2) AS total_quantity
      FROM CAMP_INVENTORY ci
      JOIN RESOURCE r ON ci.resource_id = r.resource_id
      GROUP BY r.category
      ORDER BY total_quantity DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
