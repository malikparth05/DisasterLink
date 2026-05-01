const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const disasterId = Number(req.query.disaster_id);
    const hasFilter = Number.isInteger(disasterId);
    const campWhere = hasFilter ? 'WHERE c.disaster_id = ?' : '';
    const campParams = hasFilter ? [disasterId] : [];

    const [[campStats]] = await db.query(`
      SELECT
        COUNT(*)                                                              AS total_camps,
        SUM(current_occupancy)                                                AS total_occupancy,
        SUM(total_capacity)                                                   AS total_capacity,
        ROUND(SUM(current_occupancy) / NULLIF(SUM(total_capacity), 0) * 100, 1) AS global_occupancy_pct,
        SUM(CASE WHEN status = 'Operational' THEN 1 ELSE 0 END)             AS operational_camps
      FROM RELIEF_CAMP c
      ${campWhere}
    `, campParams);

    const [[disasterStats]] = await db.query(`
      SELECT COUNT(*) AS active_disasters
      FROM DISASTER d
      ${hasFilter ? 'WHERE d.disaster_id = ? AND d.status = \'Active\'' : 'WHERE d.status = \'Active\''}
    `, hasFilter ? [disasterId] : []);

    const [[shortageCount]] = await db.query(`
      SELECT COUNT(*) AS critical_shortages
      FROM CAMP_INVENTORY ci
      JOIN RELIEF_CAMP c ON ci.camp_id = c.camp_id
      WHERE ci.quantity_available < ci.minimum_threshold
      ${hasFilter ? 'AND c.disaster_id = ?' : ''}
    `, hasFilter ? [disasterId] : []);

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
