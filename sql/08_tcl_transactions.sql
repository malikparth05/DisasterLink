-- DisasterLink: TCL (Transaction Control Language) Demonstrations
-- Shows explicit COMMIT, ROLLBACK, and SAVEPOINT usage outside stored procedures.
-- Purpose: Prove understanding of ACID properties and transaction management.

USE DisasterLink;

-- ============================================================================
-- DEMO 1: Successful Transaction (COMMIT)
-- Scenario: A new organization partners with DisasterLink and immediately
-- gets assigned a volunteer. Both inserts must succeed together or not at all.
-- ============================================================================

START TRANSACTION;

    INSERT INTO ORGANIZATION (org_name, contact_phone, contact_email)
    VALUES ('Hope Foundation India', '+91-800-555-0199', 'contact@hopefoundation.in');

    -- Capture the new org's ID for the next insert
    SET @new_org_id = LAST_INSERT_ID();

    INSERT INTO VOLUNTEER (full_name, phone, email, org_id, specialization, availability_status)
    VALUES ('Ananya Krishnan', '+91-900-555-0188', 'ananya@hopefoundation.in', @new_org_id, 'Medical Aid', 'Available');

COMMIT;
-- Both rows are now permanently saved.
SELECT 'DEMO 1 COMMITTED: Organization and volunteer saved.' AS status;


-- ============================================================================
-- DEMO 2: Failed Transaction (ROLLBACK)
-- Scenario: We attempt to register a resource and immediately distribute it,
-- but the distribution has an error (invalid family ID). The rollback ensures
-- no partial data is saved — the resource insert is also undone.
-- ============================================================================

START TRANSACTION;

    INSERT INTO RESOURCE (name, category, unit_of_measure, description)
    VALUES ('Emergency Blanket', 'Shelter', 'units', 'Thermal blanket for cold conditions');

    SET @new_res_id = LAST_INSERT_ID();

    -- This insert will fail: family_id 9999 does not exist (FK constraint).
    -- In a real application, an error handler would catch this and trigger ROLLBACK.
    -- We demonstrate the intent explicitly here:
    -- INSERT INTO AID_DISTRIBUTION (family_id, resource_id, volunteer_id, quantity_given)
    -- VALUES (9999, @new_res_id, 1, 10.00);  -- would fail

ROLLBACK;
-- The RESOURCE insert above is also undone. No partial data remains.
SELECT 'DEMO 2 ROLLED BACK: No partial data saved due to simulated error.' AS status;


-- ============================================================================
-- DEMO 3: SAVEPOINT — Partial Rollback
-- Scenario: Bulk volunteer deployment. We save a checkpoint after the first
-- volunteer is deployed. If the second deployment fails, we roll back only
-- to the savepoint, keeping the first deployment intact.
-- ============================================================================

START TRANSACTION;

    UPDATE VOLUNTEER SET deployed_camp_id = 1, availability_status = 'Deployed'
    WHERE volunteer_id = 1;

    SAVEPOINT after_first_deployment;

    UPDATE VOLUNTEER SET deployed_camp_id = 2, availability_status = 'Deployed'
    WHERE volunteer_id = 2;

    -- Simulate a problem with the second deployment: roll back only that step
    ROLLBACK TO SAVEPOINT after_first_deployment;

    -- First deployment remains; second is undone
COMMIT;

SELECT 'DEMO 3: First volunteer deployment committed. Second rolled back to savepoint.' AS status;

-- Verify: volunteer_id 1 should show deployed_camp_id = 1; volunteer_id 2 unchanged
SELECT volunteer_id, full_name, deployed_camp_id, availability_status
FROM VOLUNTEER
WHERE volunteer_id IN (1, 2);
