-- DISASTER RELIEF MANAGEMENT SYSTEM
-- Phase 1: DDL Script (Table Creation)
-- Execute this script in SQL Workbench

CREATE DATABASE IF NOT EXISTS DisasterLink;
USE DisasterLink;

-- CLEAN START: Remove existing tables with foreign key safety checks
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS CAMP_LOGS, AID_DISTRIBUTION, CAMP_INVENTORY, RESOURCE, 
                     AFFECTED_FAMILY, VOLUNTEER, RELIEF_CAMP, ORGANIZATION, DISASTER;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. DISASTER Table
CREATE TABLE DISASTER (
    disaster_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Active'
);

-- 2. ORGANIZATION Table
CREATE TABLE ORGANIZATION (
    org_id INT PRIMARY KEY AUTO_INCREMENT,
    org_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100)
);

-- 3. RELIEF_CAMP Table
CREATE TABLE RELIEF_CAMP (
    camp_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT,
    managing_org_id INT,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    district VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_capacity INT NOT NULL,
    current_occupancy INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Operational',
    established_on DATE,
    FOREIGN KEY (disaster_id) REFERENCES DISASTER(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (managing_org_id) REFERENCES ORGANIZATION(org_id) ON DELETE SET NULL
);

-- 4. VOLUNTEER Table
CREATE TABLE VOLUNTEER (
    volunteer_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    org_id INT,
    specialization VARCHAR(150),
    skill_set VARCHAR(500),
    availability_status VARCHAR(20) DEFAULT 'Available',
    deployed_camp_id INT,
    FOREIGN KEY (org_id) REFERENCES ORGANIZATION(org_id) ON DELETE SET NULL,
    FOREIGN KEY (deployed_camp_id) REFERENCES RELIEF_CAMP(camp_id) ON DELETE SET NULL,
    INDEX idx_vol_camp (deployed_camp_id)
);

-- 5. AFFECTED_FAMILY Table
CREATE TABLE AFFECTED_FAMILY (
    family_id INT PRIMARY KEY AUTO_INCREMENT,
    camp_id INT,
    head_of_family_name VARCHAR(100) NOT NULL,
    total_members INT NOT NULL,
    members_with_disability INT DEFAULT 0,
    has_children_under_5 BOOLEAN DEFAULT FALSE,
    has_elderly BOOLEAN DEFAULT FALSE,
    contact_phone VARCHAR(20),
    registration_date DATE,
    verification_status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (camp_id) REFERENCES RELIEF_CAMP(camp_id) ON DELETE SET NULL,
    INDEX idx_family_camp (camp_id),
    INDEX idx_reg_date (registration_date)
);

-- 6. RESOURCE Table
CREATE TABLE RESOURCE (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    unit_of_measure VARCHAR(20),
    description TEXT
);

-- 7. CAMP_INVENTORY Table
CREATE TABLE CAMP_INVENTORY (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    camp_id INT,
    resource_id INT,
    quantity_available DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    minimum_threshold DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (camp_id) REFERENCES RELIEF_CAMP(camp_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES RESOURCE(resource_id) ON DELETE CASCADE,
    UNIQUE KEY uk_camp_resource (camp_id, resource_id)
);

-- 8. AID_DISTRIBUTION Table
CREATE TABLE AID_DISTRIBUTION (
    distribution_id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT,
    resource_id INT,
    volunteer_id INT,
    quantity_given DECIMAL(10,2) NOT NULL,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (family_id) REFERENCES AFFECTED_FAMILY(family_id) ON DELETE RESTRICT,
    FOREIGN KEY (resource_id) REFERENCES RESOURCE(resource_id) ON DELETE RESTRICT,
    FOREIGN KEY (volunteer_id) REFERENCES VOLUNTEER(volunteer_id) ON DELETE SET NULL,
    INDEX idx_dist_family_res (family_id, resource_id)
);

-- ============================================================================
-- SECONDARY INDEXES (Non-FK search columns)
-- ============================================================================
-- Speeds up WHERE / ORDER BY queries filtering by disaster type or severity
CREATE INDEX idx_disaster_type     ON DISASTER (type);
CREATE INDEX idx_disaster_severity ON DISASTER (severity_level);
-- Speeds up volunteer lookups by availability status (frequent operational query)
CREATE INDEX idx_vol_availability  ON VOLUNTEER (availability_status);

-- 9. CAMP_LOGS Table (Schema Refinement)
-- Tracks the history of changes for accountability and audit trails.
CREATE TABLE CAMP_LOGS (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    camp_id INT,
    event_type VARCHAR(50),
    description TEXT,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camp_id) REFERENCES RELIEF_CAMP(camp_id) ON DELETE CASCADE
);
