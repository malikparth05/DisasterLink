-- Phase 1: DQL Script (Basic Queries)
-- Execute in SQL Workbench to test basic data retrieval

USE DisasterLink;

-- 1. Basic Select: View all active disasters
SELECT name, type, severity_level, start_date 
FROM DISASTER 
WHERE status = 'Active';

-- 2. Data Filtering: Find camps with capacity over 1000
SELECT name, district, state, total_capacity, current_occupancy 
FROM RELIEF_CAMP 
WHERE total_capacity >= 1000;

-- 3. Basic Join: List all volunteers and the organization they belong to
SELECT v.full_name, v.specialization, o.org_name 
FROM VOLUNTEER v
JOIN ORGANIZATION o ON v.org_id = o.org_id;

-- 4. Aggregation: Count exactly how many families are in each camp
SELECT c.name AS Camp_Name, COUNT(f.family_id) AS Total_Families_Registered
FROM RELIEF_CAMP c
LEFT JOIN AFFECTED_FAMILY f ON c.camp_id = f.camp_id
GROUP BY c.name;

-- 5. Filtering with Booleans: Find families with vulnerable members (Elderly or children < 5)
SELECT head_of_family_name, total_members, contact_phone 
FROM AFFECTED_FAMILY 
WHERE has_elderly = TRUE OR has_children_under_5 = TRUE;

-- 6. Three-Table Join: See which volunteer gave what resource to which family
SELECT
    f.head_of_family_name AS Beneficiary,
    r.name AS Resource,
    ad.quantity_given,
    v.full_name AS Distributed_By,
    ad.distribution_date
FROM AID_DISTRIBUTION ad
JOIN AFFECTED_FAMILY f ON ad.family_id = f.family_id
JOIN RESOURCE r ON ad.resource_id = r.resource_id
JOIN VOLUNTEER v ON ad.volunteer_id = v.volunteer_id;

-- 7. Ordering: List relief camps sorted by occupancy rate (highest first)
SELECT
    name AS Camp_Name,
    state,
    total_capacity,
    current_occupancy,
    ROUND((current_occupancy / total_capacity) * 100, 2) AS Occupancy_Percentage
FROM RELIEF_CAMP
ORDER BY current_occupancy DESC;

-- 8. Aggregation with HAVING: Find resource categories where total distributed exceeds 100 units
SELECT
    r.category AS Resource_Category,
    COUNT(DISTINCT ad.distribution_id) AS Total_Distributions,
    SUM(ad.quantity_given) AS Total_Quantity_Distributed
FROM AID_DISTRIBUTION ad
JOIN RESOURCE r ON ad.resource_id = r.resource_id
GROUP BY r.category
HAVING SUM(ad.quantity_given) > 50
ORDER BY Total_Quantity_Distributed DESC;

-- 9. DISTINCT: Find all unique specializations among volunteers
SELECT DISTINCT specialization
FROM VOLUNTEER
WHERE specialization IS NOT NULL
ORDER BY specialization;

-- 10. Subquery: Find all resources that have been distributed to families
SELECT
    resource_id,
    name,
    category
FROM RESOURCE
WHERE resource_id IN (
    SELECT DISTINCT resource_id
    FROM AID_DISTRIBUTION
)
ORDER BY name;

-- 11. Complex Subquery: Find camps that have distributed aid to more than 1 family
SELECT
    c.name AS Camp_Name,
    c.district,
    c.current_occupancy,
    COUNT(DISTINCT f.family_id) AS Families_Served
FROM RELIEF_CAMP c
LEFT JOIN AFFECTED_FAMILY f ON c.camp_id = f.camp_id
WHERE c.camp_id IN (
    SELECT DISTINCT c2.camp_id
    FROM RELIEF_CAMP c2
    JOIN AFFECTED_FAMILY f2 ON c2.camp_id = f2.camp_id
)
GROUP BY c.camp_id, c.name, c.district, c.current_occupancy
ORDER BY Families_Served DESC;

-- ============================================================================
-- 12. ELITE ANALYTICS & STRATEGIC REPORTING (Phase II Upgrades)
-- ============================================================================

-- A. High-Risk Hotspot Discovery
-- Uses the elite view to find camps requiring immediate volunteer reinforcement
SELECT * FROM vw_regional_risk_analysis 
WHERE operational_risk_status = 'HIGH RISK';

-- B. Resource Distribution Efficiency Analysis
-- Calculates the average units of aid given per family member across different camps
SELECT 
    c.name AS camp_name,
    COUNT(ad.distribution_id) AS total_distributions,
    ROUND(SUM(ad.quantity_given) / SUM(f.total_members), 2) AS aid_units_per_person
FROM RELIEF_CAMP c
JOIN AFFECTED_FAMILY f ON c.camp_id = f.camp_id
JOIN AID_DISTRIBUTION ad ON f.family_id = ad.family_id
GROUP BY c.camp_id, c.name
ORDER BY aid_units_per_person DESC;

-- C. Volunteer Specialization Gap Analysis
-- Compares the current volunteer headcount against the camp occupancy to identify staffing gaps
SELECT
    c.name AS camp_name,
    c.current_occupancy,
    (SELECT COUNT(*) FROM VOLUNTEER v WHERE v.deployed_camp_id = c.camp_id) AS volunteer_count,
    ROUND(c.current_occupancy / (SELECT COUNT(*) FROM VOLUNTEER v WHERE v.deployed_camp_id = c.camp_id), 1) AS refugees_per_volunteer
FROM RELIEF_CAMP c
HAVING volunteer_count > 0
ORDER BY refugees_per_volunteer DESC;

-- ============================================================================
-- 13. SCALAR FUNCTION DEMONSTRATIONS
-- ============================================================================

-- D. UDF Call: Camp Fill Rate using fn_GetCampFillRate()
-- Uses our custom scalar function to get occupancy % for every camp in one clean query
SELECT
    camp_id,
    name AS camp_name,
    total_capacity,
    current_occupancy,
    fn_GetCampFillRate(camp_id) AS fill_rate_percent
FROM RELIEF_CAMP
ORDER BY fill_rate_percent DESC;

-- E. Date Scalar Functions: Days Active Per Disaster
-- DATEDIFF calculates how long each disaster has been ongoing
SELECT
    name AS disaster_name,
    type,
    severity_level,
    start_date,
    DATEDIFF(IFNULL(end_date, CURDATE()), start_date) AS days_active,
    DATE_FORMAT(start_date, '%d %M %Y') AS formatted_start_date
FROM DISASTER
ORDER BY days_active DESC;

-- F. String Scalar Functions: Volunteer Contact Directory
-- UPPER() normalizes names; LENGTH() flags unusually short entries
SELECT
    UPPER(full_name) AS volunteer_name_upper,
    specialization,
    phone,
    LENGTH(full_name) AS name_length,
    availability_status
FROM VOLUNTEER
ORDER BY full_name;
