-- Phase II: Advanced Testing & Performance Validation
-- Execute this script in your Aiven Workbench connection to verify high-end DBMS features
USE DisasterLink;

-- 1. TEST: Verification of Automated Stored Procedure for Family Registration
-- We will call the procedure to add a new family.
-- Expected Result: The family should be automatically assigned to the camp with the most space.
CALL sp_RegisterFamilyWithAutoCamp('Sharma Global Family', 5, 0, TRUE, FALSE, '+91-555-0011');

-- Verification query for registration
SELECT * FROM AFFECTED_FAMILY WHERE head_of_family_name = 'Sharma Global Family';


-- 2. TEST: Resource Load Balancing (New Procedure)
-- We will move 100 units of "Drinking Water" from Guwahati Central (Camp 1) to Silchar Emergency (Camp 2).
-- Expected Result: Inventory updated in both records and two transfer logs created in CAMP_LOGS.
SELECT 'Stock Before' AS Info, camp_id, quantity_available FROM CAMP_INVENTORY WHERE camp_id IN (1, 2) AND resource_id = 1;

CALL sp_TransferResource(1, 2, 1, 100.00); 

SELECT 'Stock After' AS Info, camp_id, quantity_available FROM CAMP_INVENTORY WHERE camp_id IN (1, 2) AND resource_id = 1;

-- Verify Audit Logs for the transfer
SELECT * FROM vw_camp_activity_audit WHERE event_type = 'Transfer' LIMIT 2;


-- 3. TEST: Automated "Low Stock Alert" Trigger (Inventory Guardrails)
-- We will force stock below threshold in Camp 3 to trigger the "Supply_Alert" log entry.
-- Expected Result: An automated critical alert is inserted into CAMP_LOGS by the trigger.
UPDATE CAMP_INVENTORY SET quantity_available = 10.00 WHERE camp_id = 3 AND resource_id = 1;

SELECT 'Automated Alert:' AS Info, description, log_timestamp FROM CAMP_LOGS WHERE event_type = 'Supply_Alert' ORDER BY log_timestamp DESC LIMIT 1;


-- 4. TEST: Querying Extended Reporting Views (Dashboard Analysis)
-- Checking the Dashboard View with real-time percentages
SELECT * FROM vw_camp_realtime_metrics;

-- NEW Performance Hub: See our top performing Volunteers
SELECT * FROM vw_volunteer_performance;


-- 5. TEST: Advanced Analytical Reporting (Complex Logic Analysis)
-- Requirement: Result Analysis
-- Identify resource categories where we have given out more than 50 units total across the global mission.
SELECT 
    r.category, 
    SUM(ad.quantity_given) as total_distributed,
    COUNT(ad.distribution_id) as handouts_count
FROM AID_DISTRIBUTION ad
JOIN RESOURCE r ON ad.resource_id = r.resource_id
GROUP BY r.category
HAVING SUM(ad.quantity_given) > 50;


-- 6. TEST: Performance & Auditing (The "Professor Special")
-- Shows the database execution plan for auditing purposes.
-- This demonstrates knowledge of how the database internally optimizes these new views.
EXPLAIN SELECT * FROM vw_camp_activity_audit WHERE camp_name LIKE '%Guwahati%';


-- 7. TEST: Capacity Constraint (Final Guardrail Check)
-- Attempting to register a huge family in a small camp.
-- Expected Result: The 'tr_check_capacity_limit' trigger should block the insertion.
-- (Uncomment to test live error blocking in Workbench)
-- INSERT INTO AFFECTED_FAMILY (camp_id, head_of_family_name, total_members, registration_date) 
-- VALUES (2, 'Error Family', 500, CURDATE());

-- 8. TEST: Camp Decommissioning (New Enterprise Feature)
-- Expected Result 1: Error if camp is occupied (Camp 1 is occupied).
-- Expected Result 2: Success if camp is empty (We will create a temporary empty camp).
-- (Try calling this for occupied Camp 1 in Workbench to see the block)
-- CALL sp_DecommissionCamp(1);

-- Testing success on a new empty camp:
INSERT INTO RELIEF_CAMP (camp_id, name, total_capacity, status) VALUES (99, 'Decomm Test Camp', 100, 'Operational');
CALL sp_DecommissionCamp(99);
SELECT name, status FROM RELIEF_CAMP WHERE camp_id = 99;
DELETE FROM RELIEF_CAMP WHERE camp_id = 99; -- Cleanup


-- 9. TEST: Custom Scalar Function fn_GetCampFillRate()
-- Calls our UDF directly on every camp and ranks them by how full they are.
-- Expected Result: Each camp row shows a fill_rate_percent between 0 and 100.
SELECT
    camp_id,
    name AS camp_name,
    total_capacity,
    current_occupancy,
    fn_GetCampFillRate(camp_id) AS fill_rate_percent
FROM RELIEF_CAMP
ORDER BY fill_rate_percent DESC;
-- Expected: The most occupied camp appears first with the highest percentage.


-- 10. TEST: Explicit ROLLBACK Verification
-- Inserts a test resource, then immediately rolls back.
-- Expected Result: The row should NOT appear in RESOURCE after the rollback.
START TRANSACTION;
    INSERT INTO RESOURCE (name, category, unit_of_measure)
    VALUES ('ROLLBACK_TEST_ITEM', 'Test', 'units');
    SELECT 'Before rollback — row exists:' AS check_point, name FROM RESOURCE WHERE name = 'ROLLBACK_TEST_ITEM';
ROLLBACK;

SELECT 'After rollback — row should be gone:' AS check_point, COUNT(*) AS row_count
FROM RESOURCE WHERE name = 'ROLLBACK_TEST_ITEM';
-- Expected: row_count = 0, confirming the transaction was fully undone.


-- 11. TEST: Scalar Function Showcase (DATEDIFF + DATE_FORMAT + UPPER)
-- Expected Result: Each disaster shows days active, formatted date, and uppercased name.
SELECT
    UPPER(name) AS disaster_name_upper,
    severity_level,
    DATE_FORMAT(start_date, '%d %M %Y') AS formatted_start,
    DATEDIFF(IFNULL(end_date, CURDATE()), start_date) AS days_active
FROM DISASTER
ORDER BY days_active DESC;
-- Expected: Active disasters show a high days_active count; closed ones show exact duration.

