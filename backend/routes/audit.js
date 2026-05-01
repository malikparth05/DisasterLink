const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const disasterId = Number(req.query.disaster_id);
    const hasFilter = Number.isInteger(disasterId);
    const [rows] = await db.query(
      `SELECT
        l.log_timestamp,
        c.name AS camp_name,
        l.event_type,
        l.description
      FROM CAMP_LOGS l
      JOIN RELIEF_CAMP c ON l.camp_id = c.camp_id
      ${hasFilter ? 'WHERE c.disaster_id = ?' : ''}
      ORDER BY l.log_timestamp DESC
      LIMIT 300`,
      hasFilter ? [disasterId] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { camp_id, event_type, description } = req.body;
    await db.query(
      "INSERT INTO CAMP_LOGS (camp_id, event_type, description) VALUES (?, ?, ?)",
      [camp_id, event_type, description]
    );
    res.json({ success: true, message: 'Log entry recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
