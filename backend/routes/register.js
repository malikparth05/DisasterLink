const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const {
    head_of_family,
    total_members,
    disability_count,
    under_5,
    has_elderly,
    phone,
  } = req.body;

  if (!head_of_family || !total_members) {
    return res.status(400).json({
      success: false,
      error: 'head_of_family and total_members are required.',
    });
  }

  if (typeof total_members !== 'number' || total_members <= 0) {
    return res.status(400).json({
      success: false,
      error: 'total_members must be a positive integer.',
    });
  }

  try {
    const [rows] = await db.query('CALL sp_RegisterFamilyWithAutoCamp(?, ?, ?, ?, ?, ?)', [
      head_of_family,
      total_members,
      disability_count || 0,
      under_5 ? 1 : 0,
      has_elderly ? 1 : 0,
      phone || '',
    ]);

    const message = rows[0]?.[0]?.result || 'Family registered successfully.';
    res.json({ success: true, message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
