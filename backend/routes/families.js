const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        f.family_id,
        f.head_of_family_name,
        f.total_members,
        f.members_with_disability,
        f.has_children_under_5,
        f.has_elderly,
        f.contact_phone,
        f.registration_date,
        f.verification_status,
        c.name AS camp_name
      FROM AFFECTED_FAMILY f
      LEFT JOIN RELIEF_CAMP c ON f.camp_id = c.camp_id
      ORDER BY f.registration_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
