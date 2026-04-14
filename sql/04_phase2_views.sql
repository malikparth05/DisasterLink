-- DisasterLink: Phase II - Advanced Views
-- Focused on reporting, real-time metrics, and auditing.
-- Part of the Enterprise DRMS Suite.

USE DisasterLink;

-- View 1: Real-time Camp Metrics
CREATE OR REPLACE VIEW vw_camp_realtime_metrics AS
SELECT 
    c.name AS camp_name,
    c.district,
    o.org_name AS managing_organization,
    c.total_capacity,
    c.current_occupancy,
    (c.total_capacity - c.current_occupancy) AS available_beds,
    ROUND((c.current_occupancy / c.total_capacity) * 100, 2) AS occupancy_percentage
FROM RELIEF_CAMP c
JOIN ORGANIZATION o ON c.managing_org_id = o.org_id;

-- View 2: Critical Supply Shortages
CREATE OR REPLACE VIEW vw_critical_shortages AS
SELECT 
    c.name AS camp_name,
    r.name AS resource_name,
    r.category,
    ci.quantity_available,
    ci.minimum_threshold,
    (ci.minimum_threshold - ci.quantity_available) AS shortage_amount
FROM CAMP_INVENTORY ci
JOIN RELIEF_CAMP c ON ci.camp_id = c.camp_id
JOIN RESOURCE r ON ci.resource_id = r.resource_id
WHERE ci.quantity_available < ci.minimum_threshold;

-- View 3: Family Aid History
CREATE OR REPLACE VIEW vw_family_aid_history AS
SELECT 
    f.head_of_family_name,
    f.total_members,
    r.name AS resource_given,
    ad.quantity_given,
    r.unit_of_measure,
    ad.distribution_date,
    v.full_name AS distributed_by
FROM AID_DISTRIBUTION ad
JOIN AFFECTED_FAMILY f ON ad.family_id = f.family_id
JOIN RESOURCE r ON ad.resource_id = r.resource_id
JOIN VOLUNTEER v ON ad.volunteer_id = v.volunteer_id
ORDER BY ad.distribution_date DESC;

-- View 4: Volunteer Performance Dashboard
CREATE OR REPLACE VIEW vw_volunteer_performance AS
SELECT 
    v.full_name,
    v.specialization,
    COUNT(ad.distribution_id) AS total_distributions_handled,
    ROUND(SUM(ad.quantity_given), 2) AS units_distributed
FROM VOLUNTEER v
LEFT JOIN AID_DISTRIBUTION ad ON v.volunteer_id = ad.volunteer_id
GROUP BY v.volunteer_id, v.full_name, v.specialization
ORDER BY total_distributions_handled DESC;

-- View 5: Camp Activity Audit Logs
CREATE OR REPLACE VIEW vw_camp_activity_audit AS
SELECT 
    l.log_timestamp,
    c.name AS camp_name,
    l.event_type,
    l.description
FROM CAMP_LOGS l
JOIN RELIEF_CAMP c ON l.camp_id = c.camp_id
ORDER BY l.log_timestamp DESC;

-- View 6: Regional Risk Hotspots (Elite Analytics)
-- Identifies camps with high disaster severity but low specialized volunteer count
CREATE OR REPLACE VIEW vw_regional_risk_analysis AS
SELECT 
    c.name AS camp_name,
    c.district,
    d.name AS disaster_event,
    d.severity_level,
    (SELECT COUNT(*) FROM VOLUNTEER v WHERE v.deployed_camp_id = c.camp_id) AS total_volunteers,
    (SELECT COUNT(*) FROM VOLUNTEER v WHERE v.deployed_camp_id = c.camp_id AND v.specialization = 'Medical Aid') AS medical_staff,
    CASE 
        WHEN d.severity_level = 'Critical' AND (SELECT COUNT(*) FROM VOLUNTEER v WHERE v.deployed_camp_id = c.camp_id) < 5 THEN 'HIGH RISK'
        WHEN d.severity_level = 'High' AND (SELECT COUNT(*) FROM VOLUNTEER v WHERE v.deployed_camp_id = c.camp_id) < 3 THEN 'RISK'
        ELSE 'STABLE'
    END AS operational_risk_status
FROM RELIEF_CAMP c
JOIN DISASTER d ON c.disaster_id = d.disaster_id
WHERE d.status = 'Active';
