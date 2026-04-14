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
