# DisasterLink: Comprehensive Technical Project Report
**Course:** Database Management Systems (DBMS)  
**Project:** Disaster Relief Management System (DRMS)

---

## 1. Executive Summary
**DisasterLink** is a robust, automated database application designed to streamline disaster relief operations. The system coordinates the deployment of volunteers, tracks the occupancy of relief camps, and manages the real-time distribution of critical aid to families in need. This report provides a detailed technical explanation of the entire project lifecycle, from foundational schema design to advanced server-side automation.

---

## 2. Database Architectural Design

### 2.1 Entity-Relationship (ER) Overview
The system is built on **9 core tables** organized into three functional layers:

1.  **Core Entities Table Layer**:
    *   `DISASTER`: Records emergency event data (Hurricanes, Floods, etc.).
    *   `ORGANIZATION`: Stores NGOs and government agencies involved.
2.  **Logistics Layer**:
    *   `RELIEF_CAMP`: Tracks physical locations and live occupancy.
    *   `VOLUNTEER`: Manages helper data, skills, and current deployment.
    *   `RESOURCE`: A catalog of all aid items (Food, Medicine, Water).
3.  **Transaction & Integrity Layer**:
    *   `AFFECTED_FAMILY`: Tracks victims and their vulnerability status.
    *   `CAMP_INVENTORY`: The "Stock Ledger" for each camp.
    *   `AID_DISTRIBUTION`: The immutable record of aid handout.
    *   `CAMP_LOGS`: (New/Advanced) The audit trail for every camp-level event.

### 2.2 Normalization & Integrity
*   **Normalization Level:** The project strictly follows **3rd Normal Form (3NF)** and **BCNF** where appropriate. All transitive dependencies were eliminated to prevent data anomalies.
*   **Referential Integrity:** We used `ON DELETE CASCADE` for critical links (like deleting a camp and its inventory) and `ON DELETE SET NULL` for non-critical relationships to maintain data stability.

---

## 3. Advanced Logic & Automation (Phase II)

In Phase II, the database was "hardened" with server-side logic to automate complex business rules.

### 3.1 Specialized SQL Views (Reporting)
Views act as "Virtual Tables" for management.
*   **`vw_camp_realtime_metrics`**: Calculates the available beds and occupancy percentage dynamically.
*   **`vw_critical_shortages`**: Automates supply-chain monitoring by highlighting resources where `quantity_available < minimum_threshold`.

### 3.2 Stored Procedures (Macros)
Instead of executing multiple queries on the frontend, we use single calls to Procedures:
*   **`sp_RegisterFamilyWithAutoCamp`**: 
    *   *Logic:* It queries `RELIEF_CAMP` to find the camp with the **most available beds**, then inserts the family record into that specific camp automatically.
    *   *Benefit:* Prevents "camp fatigue" where some camps are overloaded while others are empty.
*   **`sp_SecureAidDistribution`**: 
    *   *Logic:* It acts as a wrapper for aid handouts. It validates credentials before inserting into the distribution log.

### 3.3 Data Integrity Triggers (The Guardrails)
Triggers are scripts that run automatically. Unlike procedures, they cannot be bypassed.
*   **`tr_auto_update_occupancy`**: Ensures that every time a family is registered, the `RELIEF_CAMP` occupancy count is updated **instantly**.
*   **`tr_check_capacity_limit`**: A `BEFORE INSERT` trigger that kills the transaction if the family size exceeds the remaining camp capacity.
*   **`tr_auto_deduct_inventory`**: The heart of our logistics. It performs an inventory check and deducts stock the moment aid is distributed.

### 3.4 User-Defined Functions (UDF)
*   **`fn_GetCampFillRate`**: A mathematical function that returns a single decimal value representing how full a camp is. This allows for clean, simple reporting in high-level SELECT statements.

---

## 4. Testing & Result Analysis
The project includes a comprehensive test suite (**`07_phase2_tests.sql`**) that validates three key areas:
1.  **Correctness:** Verifying that a family registration actually assigns them to the correct camp.
2.  **Safety:** Verifying that the triggers successfully block "over-occupancy" or "negative stock" scenarios.
3.  **Analysis:** Using **`GROUP BY`** and **`HAVING`** clauses to identify trends in aid distribution (e.g., identifying which resource categories are in highest demand).

---

## 5. End-Semester Conclusion
By integrating DDL/DML foundations with advanced server-side objects (Views, Procedures, Triggers, and Functions), **DisasterLink** serves as a complete, industry-standard mini project. It demonstrates technical proficiency in relational data modeling, data integrity enforcement, and SQL optimization.

---
*Submitted for DBMS Mid/End-Semester Project Evaluation.*
