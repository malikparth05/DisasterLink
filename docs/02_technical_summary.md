# Project DisasterLink: Technical Summary (Phase I)

## 1. Project Overview
**Project Name:** DisasterLink  
**Goal:** To provide a centralized, real-time coordination platform for disaster relief operations by bridging the gap between donors, volunteers, relief camps, and affected families.

## 2. Conceptual Design (ER Model)
Our database is structured around **8 core entities** that represent the entire relief lifecycle:

| Table Name | Description | Key Relationships |
| :--- | :--- | :--- |
| **`DISASTER`** | Stores emergency event details. | Parent to `RELIEF_CAMP`. |
| **`ORGANIZATION`** | Stores NGOs and government agencies. | Parent to `VOLUNTEER` & `RELIEF_CAMP`. |
| **`RELIEF_CAMP`** | Tracks shelter locations and live occupancy. | Hosted in a `DISASTER` area. |
| **`VOLUNTEER`** | Tracks helpers and their specific skills (Medical, Rescue). | Deployed to a `RELIEF_CAMP`. |
| **`AFFECTED_FAMILY`** | Tracks victims, specifically vulnerable members (Elderly, Kids). | Sheltered in a `RELIEF_CAMP`. |
| **`RESOURCE`** | Catalog of aid items (Food, Medicine, Water). | Catalog for `CAMP_INVENTORY`. |
| **`CAMP_INVENTORY`** | Live stock count at each individual camp. | Links `RELIEF_CAMP` to `RESOURCE`. |
| **`AID_DISTRIBUTION`** | The ledger recording exactly who got what and when. | Links `FAMILY`, `RESOURCE`, and `VOLUNTEER`. |

## 3. Relational Schema & Normalization
*   **Normalization:** The database is designed in **3rd Normal Form (3NF)** to eliminate data redundancy.
*   **Integrity Constraints:** 
    *   **Primary Keys (PK):** Every record has a unique ID for perfect tracking.
    *   **Foreign Keys (FK):** Strict referential integrity ensures, for example, that a family cannot be added to a camp that doesn't exist.

## 4. SQL Implementation
We have developed three primary SQL scripts for this phase:

1.  **`01_ddl_schema.sql`**: The blueprint. It defines the `DisasterLink` database and builds the table structures with zero errors.
2.  **`02_dml_insert_data.sql`**: The engine. It populates the system with realistic data, including 3 disasters (Hurricanes, Floods, Wildfires) and sample families to test the system.
3.  **`03_dql_queries.sql`**: The analysis. It contains 6 advanced queries, such as "Identify vulnerable families" and "Track resource distribution across multiple tables."

## 5. Current Project Status
As of the conclusion of Phase I, the **DisasterLink** project has successfully:
*   [x] Formulated its problem statement and requirements.
*   [x] Finalized the ER and Relational Models.
*   [x] Implemented the full schema on the host server.
*   [x] Verified all initial queries with live testing.

---
*This document serves as the official technical summary for the Mid-Semester Project Evaluation.*
