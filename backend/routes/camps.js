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
        c.disaster_id,
        c.name AS camp_name,
        c.district,
        o.org_name AS managing_organization,
        c.total_capacity,
        c.current_occupancy,
        (c.total_capacity - c.current_occupancy) AS available_beds,
        ROUND((c.current_occupancy / c.total_capacity) * 100, 2) AS occupancy_percentage
      FROM RELIEF_CAMP c
      JOIN ORGANIZATION o ON c.managing_org_id = o.org_id
      ${hasFilter ? 'WHERE c.disaster_id = ?' : ''}
      ORDER BY c.current_occupancy DESC`,
      hasFilter ? [disasterId] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { disaster_id, managing_org_id, name, district, total_capacity } = req.body;
    await db.query(
      'INSERT INTO RELIEF_CAMP (disaster_id, managing_org_id, name, district, total_capacity) VALUES (?, ?, ?, ?, ?)',
      [disaster_id, managing_org_id, name, district, total_capacity]
    );
    res.json({ success: true, message: 'Camp created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
