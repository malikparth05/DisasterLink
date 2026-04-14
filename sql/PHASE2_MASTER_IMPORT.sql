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
-- DisasterLink: Phase II - Advanced Stored Procedures & Functions
-- Mission-critical business logic for automated relief management.
-- Standardized for production schema (VARCHAR(20) phone support).

USE DisasterLink;

DELIMITER //

-- Procedure 1: Smart Family Registration
DROP PROCEDURE IF EXISTS sp_RegisterFamilyWithAutoCamp //
CREATE PROCEDURE sp_RegisterFamilyWithAutoCamp(
    IN p_head_of_family VARCHAR(100),
    IN p_total_members INT,
    IN p_disability_count INT,
    IN p_under_5 BOOLEAN,
    IN p_has_elderly BOOLEAN,
    IN p_phone VARCHAR(20)
)
BEGIN
    DECLARE v_best_camp_id INT;
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction Failed: Registration rolled back.';
    END;

    IF p_total_members <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Family size must be positive.';
    END IF;

    -- Look for a camp that is Operational and has the most spare capacity
    SELECT camp_id INTO v_best_camp_id FROM RELIEF_CAMP
    WHERE status = 'Operational' AND (total_capacity - current_occupancy) >= p_total_members
    ORDER BY (total_capacity - current_occupancy) DESC LIMIT 1;
    
    IF v_best_camp_id IS NOT NULL THEN
        START TRANSACTION;
            -- Insert into family table
            INSERT INTO AFFECTED_FAMILY (camp_id, head_of_family_name, total_members, members_with_disability, has_children_under_5, has_elderly, contact_phone, registration_date, verification_status)
            VALUES (v_best_camp_id, p_head_of_family, p_total_members, p_disability_count, p_under_5, p_has_elderly, p_phone, CURDATE(), 'Verified');
            
            -- Automatic logging
            INSERT INTO CAMP_LOGS (camp_id, event_type, description)
            VALUES (v_best_camp_id, 'Registration', CONCAT('Assigned family: ', p_head_of_family, ' (Size: ', p_total_members, ')'));
        COMMIT;
        
        SELECT CONCAT('Success! Family assigned to: ', (SELECT name FROM RELIEF_CAMP WHERE camp_id = v_best_camp_id)) AS result;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: No operational camp found with sufficient capacity.';
    END IF;
END //

-- Procedure 2: Secure Aid Distribution
DROP PROCEDURE IF EXISTS sp_SecureAidDistribution //
CREATE PROCEDURE sp_SecureAidDistribution(
    IN p_family_id INT, IN p_resource_id INT, IN p_volunteer_id INT, IN p_quantity DECIMAL(10,2)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM AFFECTED_FAMILY WHERE family_id = p_family_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Family ID not found.';
    END IF;

    INSERT INTO AID_DISTRIBUTION (family_id, resource_id, volunteer_id, quantity_given, distribution_date)
    VALUES (p_family_id, p_resource_id, p_volunteer_id, p_quantity, NOW());
    SELECT 'Distribution successful. Inventory automatically updated by trigger.' AS result;
END //

-- Procedure 3: Resource Transfer (Advanced Transactional Logic)
DROP PROCEDURE IF EXISTS sp_TransferResource //
CREATE PROCEDURE sp_TransferResource(
    IN p_from_camp_id INT, IN p_to_camp_id INT, IN p_resource_id INT, IN p_quantity DECIMAL(10,2)
)
BEGIN
    DECLARE v_from_stock DECIMAL(10,2);
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction Failed: Resource transfer rolled back to prevent stock inconsistency.';
    END;

    SELECT quantity_available INTO v_from_stock FROM CAMP_INVENTORY 
    WHERE camp_id = p_from_camp_id AND resource_id = p_resource_id;
    
    IF v_from_stock >= p_quantity THEN
        START TRANSACTION;
            UPDATE CAMP_INVENTORY SET quantity_available = quantity_available - p_quantity WHERE camp_id = p_from_camp_id AND resource_id = p_resource_id;
            INSERT INTO CAMP_INVENTORY (camp_id, resource_id, quantity_available) VALUES (p_to_camp_id, p_resource_id, p_quantity)
            ON DUPLICATE KEY UPDATE quantity_available = quantity_available + p_quantity;
            
            INSERT INTO CAMP_LOGS (camp_id, event_type, description) VALUES (p_from_camp_id, 'Transfer_Out', CONCAT('Sent ', p_quantity, ' units to camp ', p_to_camp_id));
            INSERT INTO CAMP_LOGS (camp_id, event_type, description) VALUES (p_to_camp_id, 'Transfer_In', CONCAT('Received ', p_quantity, ' units from camp ', p_from_camp_id));
        COMMIT;
        
        SELECT 'Resource transfer completed successfully.' AS Result;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Insufficient stock for transfer.';
    END IF;
END //

-- Procedure 4: Decommission Camp (Securely close a camp)
DROP PROCEDURE IF EXISTS sp_DecommissionCamp //
CREATE PROCEDURE sp_DecommissionCamp(IN p_camp_id INT)
BEGIN
    DECLARE v_occupancy INT;
    SELECT current_occupancy INTO v_occupancy FROM RELIEF_CAMP WHERE camp_id = p_camp_id;
    
    IF v_occupancy > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Cannot decommission camp with active occupancy. Relocate families first.';
    ELSE
        UPDATE RELIEF_CAMP SET status = 'Closed' WHERE camp_id = p_camp_id;
        INSERT INTO CAMP_LOGS (camp_id, event_type, description)
        VALUES (p_camp_id, 'Status_Change', 'Camp successfully decommissioned.');
        SELECT 'Camp status set to Closed.' AS Result;
    END IF;
END //

-- Function: Camp Fill Percentage
DROP FUNCTION IF EXISTS fn_GetCampFillRate //
CREATE FUNCTION fn_GetCampFillRate(p_camp_id INT) 
RETURNS DECIMAL(5,2) DETERMINISTIC
BEGIN
    DECLARE v_percent DECIMAL(5,2);
    SELECT (current_occupancy / total_capacity) * 100 INTO v_percent FROM RELIEF_CAMP WHERE camp_id = p_camp_id;
    RETURN IFNULL(v_percent, 0);
END //

DELIMITER ;
-- DisasterLink: Phase II - Safety & Auditing Triggers
-- Automated business rules to ensure data integrity and safety.

USE DisasterLink;

DELIMITER //

-- Trigger 1: Auto-Update Occupancy
DROP TRIGGER IF EXISTS tr_auto_update_occupancy //
CREATE TRIGGER tr_auto_update_occupancy AFTER INSERT ON AFFECTED_FAMILY FOR EACH ROW
BEGIN
    UPDATE RELIEF_CAMP SET current_occupancy = current_occupancy + NEW.total_members WHERE camp_id = NEW.camp_id;
END //

-- Trigger 2: Capacity Safety Check
DROP TRIGGER IF EXISTS tr_check_capacity_limit //
CREATE TRIGGER tr_check_capacity_limit BEFORE INSERT ON AFFECTED_FAMILY FOR EACH ROW
BEGIN
    DECLARE v_capacity INT; DECLARE v_occupancy INT;
    SELECT total_capacity, current_occupancy INTO v_capacity, v_occupancy FROM RELIEF_CAMP WHERE camp_id = NEW.camp_id;
    IF (v_occupancy + NEW.total_members) > v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Camp capacity exceeded.';
    END IF;
END //

-- Trigger 3: Inventory Deduction
DROP TRIGGER IF EXISTS tr_auto_deduct_inventory //
CREATE TRIGGER tr_auto_deduct_inventory BEFORE INSERT ON AID_DISTRIBUTION FOR EACH ROW
BEGIN
    DECLARE v_camp_id INT; DECLARE v_stock DECIMAL(10,2);
    SELECT camp_id INTO v_camp_id FROM AFFECTED_FAMILY WHERE family_id = NEW.family_id;
    SELECT quantity_available INTO v_stock FROM CAMP_INVENTORY WHERE camp_id = v_camp_id AND resource_id = NEW.resource_id;
    IF v_stock < NEW.quantity_given THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Insufficient inventory.';
    ELSE
        UPDATE CAMP_INVENTORY SET quantity_available = quantity_available - NEW.quantity_given WHERE camp_id = v_camp_id AND resource_id = NEW.resource_id;
    END IF;
END //

-- Trigger 4: Low Stock Alert
DROP TRIGGER IF EXISTS tr_log_low_stock_alert //
CREATE TRIGGER tr_log_low_stock_alert AFTER UPDATE ON CAMP_INVENTORY FOR EACH ROW
BEGIN
    IF NEW.quantity_available < NEW.minimum_threshold THEN
        INSERT INTO CAMP_LOGS (camp_id, event_type, description)
        VALUES (NEW.camp_id, 'Supply_Alert', CONCAT('CRITICAL: Resource ID ', NEW.resource_id, ' below threshold!'));
    END IF;
END //

DELIMITER ;
