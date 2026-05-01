const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const disasterId = Number(req.query.disaster_id);
    const hasFilter = Number.isInteger(disasterId);
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
      ${hasFilter ? 'WHERE c.disaster_id = ?' : ''}
      ORDER BY f.registration_date DESC
    `, hasFilter ? [disasterId] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { camp_id, head_of_family_name, total_members, members_with_disability, has_children_under_5, has_elderly, contact_phone, registration_date, verification_status } = req.body;
    await db.query(
      'INSERT INTO AFFECTED_FAMILY (camp_id, head_of_family_name, total_members, members_with_disability, has_children_under_5, has_elderly, contact_phone, registration_date, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [camp_id, head_of_family_name, total_members, members_with_disability || 0, has_children_under_5 ? 1 : 0, has_elderly ? 1 : 0, contact_phone, registration_date || new Date(), verification_status || 'Pending']
    );
    res.json({ success: true, message: 'Family registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
