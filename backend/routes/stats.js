const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [[campStats]] = await db.query(`
      SELECT
        COUNT(*)                                                              AS total_camps,
        SUM(current_occupancy)                                                AS total_occupancy,
        SUM(total_capacity)                                                   AS total_capacity,
        ROUND(SUM(current_occupancy) / NULLIF(SUM(total_capacity), 0) * 100, 1) AS global_occupancy_pct,
        SUM(CASE WHEN status = 'Operational' THEN 1 ELSE 0 END)             AS operational_camps
      FROM RELIEF_CAMP
    `);

    const [[disasterStats]] = await db.query(`
      SELECT COUNT(*) AS active_disasters FROM DISASTER WHERE status = 'Active'
    `);

    const [[shortageCount]] = await db.query(`
      SELECT COUNT(*) AS critical_shortages FROM vw_critical_shortages
    `);

    res.json({
      total_camps:         campStats.total_camps,
      global_occupancy_pct: campStats.global_occupancy_pct,
      active_disasters:    disasterStats.active_disasters,
      critical_shortages:  shortageCount.critical_shortages,
      operational_camps:   campStats.operational_camps,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
