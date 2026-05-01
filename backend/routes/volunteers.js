const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const disasterId = Number(req.query.disaster_id);
    const hasFilter = Number.isInteger(disasterId);
    const [rows] = await db.query(
      `SELECT
        v.volunteer_id,
        v.full_name,
        v.specialization,
        COUNT(ad.distribution_id) AS total_distributions_handled,
        COALESCE(ROUND(SUM(ad.quantity_given), 2), 0) AS units_distributed
      FROM VOLUNTEER v
      LEFT JOIN AID_DISTRIBUTION ad ON v.volunteer_id = ad.volunteer_id
      LEFT JOIN RELIEF_CAMP c ON v.deployed_camp_id = c.camp_id
      ${hasFilter ? 'WHERE c.disaster_id = ?' : ''}
      GROUP BY v.volunteer_id, v.full_name, v.specialization
      ORDER BY units_distributed DESC, total_distributions_handled DESC`,
      hasFilter ? [disasterId] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { full_name, phone, email, specialization, deployed_camp_id } = req.body;
    await db.query(
      'INSERT INTO VOLUNTEER (full_name, phone, email, specialization, deployed_camp_id) VALUES (?, ?, ?, ?, ?)',
      [full_name, phone, email, specialization, deployed_camp_id]
    );
    res.json({ success: true, message: 'Volunteer registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
