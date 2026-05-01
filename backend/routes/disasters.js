const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM DISASTER ORDER BY start_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, severity_level, start_date, status } = req.body;
    await db.query(
      'INSERT INTO DISASTER (name, type, severity_level, start_date, status) VALUES (?, ?, ?, ?, ?)',
      [name, type, severity_level, start_date, status || 'Active']
    );
    res.json({ success: true, message: 'Disaster created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString().split('T')[0];
    await db.query(
      "UPDATE DISASTER SET status = 'Closed', end_date = ? WHERE disaster_id = ?",
      [now, id]
    );
    res.json({ success: true, message: 'Disaster marked as Closed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
