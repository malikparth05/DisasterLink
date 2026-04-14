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
