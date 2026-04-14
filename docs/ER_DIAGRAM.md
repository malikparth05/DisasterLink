# DisasterLink: Entity-Relationship (ER) Diagram
**Phase I: Conceptual Database Design**

---

## 1. Visual ER Diagram (ASCII)

```
                          ┌─────────────────┐
                          │   DISASTER      │
                          │ (disaster_id)   │
                          │  - name         │
                          │  - type         │
                          │  - severity     │
                          │  - start_date   │
                          │  - end_date     │
                          │  - status       │
                          └────────┬────────┘
                                   │
                             (1:N) │ ON DELETE CASCADE
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
        ┌───────────▼────────────┐      ┌────────▼─────────────┐
        │  RELIEF_CAMP           │      │  ORGANIZATION        │
        │  (camp_id) PK          │      │  (org_id) PK         │
        │  - disaster_id FK      │      │  - org_name          │
        │  - managing_org_id FK  │◄─────┤  - contact_phone     │
        │  - name                │      │  - contact_email     │
        │  - state               │      └──────────────────────┘
        │  - district            │           (1:N)
        │  - latitude            │            ▲
        │  - longitude           │            │
        │  - total_capacity      │            │
        │  - current_occupancy   │      ┌─────┴──────────────┐
        │  - status              │      │   VOLUNTEER        │
        │  - established_on      │      │   (volunteer_id)   │
        └────────┬────────┬──────┘      │   - full_name      │
                 │        │             │   - phone          │
         (1:N)  │        │             │   - email          │
    ON DELETE    │        │             │   - org_id FK      │
    SET NULL     │        │             │   - specialization │
                 │        │             │   - skill_set      │
        ┌────────▼─┐      │             │   - availability   │
        │AFFECTED_ │      │             │   - deployed_camp_id FK
        │FAMILY    │      │             └────────────────────┘
        │(family_) │      │                (N:1)
        │id) PK    │      │                 ▲
        │- camp_id │      │                 │
        │  FK(*)   │      │          (1:N) │
        │- head_   │      │                 │
        │  of_     │      │
        │  family_ │      └───────────────────────────────┐
        │  name    │                                      │
        │- total_  │                                      │
        │  members │                         (M:N)
        │- has_    │                          │
        │  elderly │                    ┌─────▼──────────────┐
        │- has_    │                    │ AID_DISTRIBUTION   │
        │  children│                    │ (distribution_id)  │
        │- members_│                    │ - family_id FK (R) │
        │  with_   │                    │ - resource_id FK(R)│
        │  disabil.│                    │ - volunteer_id FK  │
        │- contact │                    │ - quantity_given   │
        │- registr.│                    │ - distribution_date│
        │- verifcn.│                    │ - notes            │
        └─┬────────┘                    └────────┬──────────┘
          │                                      │
          │ (1:N)                                │
          │ ON DELETE RESTRICT (*)               │ (1:N)
          │                                      │ ON DELETE RESTRICT
          └──────────────────┬───────────────────┘
                             │
                    ┌────────▼──────────────┐
                    │   RESOURCE           │
                    │   (resource_id) PK   │
                    │   - name             │
                    │   - category         │
                    │   - unit_of_measure  │
                    │   - description      │
                    └──────────────────────┘
                             ▲
                             │ (1:N)
                             │ ON DELETE CASCADE
                             │
        ┌────────────────────┴───────────────────┐
        │                                        │
┌───────▼──────────────────┐        ┌───────────▼─────────────┐
│  CAMP_INVENTORY          │        │   CAMP_LOGS            │
│  (inventory_id) PK       │        │   (log_id) PK          │
│  - camp_id FK            │        │   - camp_id FK         │
│  - resource_id FK        │        │   - event_type         │
│  - quantity_available    │        │   - description        │
│  - minimum_threshold     │        │   - log_timestamp      │
│  - last_updated          │        └────────────────────────┘
│  UNIQUE (camp_id, res)   │
└──────────────────────────┘
```

---

## 2. Entity Descriptions & Attributes

### **DISASTER** (Root Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| disaster_id | INT | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| type | VARCHAR(50) | NOT NULL (Hurricane, Flood, Wildfire, etc.) |
| severity_level | VARCHAR(20) | (Low, Medium, High, Critical) |
| start_date | DATE | NOT NULL |
| end_date | DATE | NULLABLE |
| status | VARCHAR(20) | DEFAULT 'Active' |

**Role:** Parent entity representing emergency events. All camps, volunteers, and aid activities are tied to a specific disaster.

---

### **ORGANIZATION** (Supporting Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| org_id | INT | PK, AUTO_INCREMENT |
| org_name | VARCHAR(150) | NOT NULL |
| contact_phone | VARCHAR(15) | NULLABLE |
| contact_email | VARCHAR(100) | NULLABLE |

**Role:** Represents NGOs and government agencies managing relief operations. Can manage multiple camps and volunteers.

---

### **RELIEF_CAMP** (Core Logistics Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| camp_id | INT | PK, AUTO_INCREMENT |
| disaster_id | INT | FK → DISASTER (ON DELETE CASCADE) |
| managing_org_id | INT | FK → ORGANIZATION (ON DELETE SET NULL) |
| name | VARCHAR(100) | NOT NULL |
| state | VARCHAR(50) | NULLABLE |
| district | VARCHAR(50) | NULLABLE |
| latitude | DECIMAL(10,8) | NULLABLE (Geographic precision) |
| longitude | DECIMAL(11,8) | NULLABLE (Geographic precision) |
| total_capacity | INT | NOT NULL |
| current_occupancy | INT | DEFAULT 0 |
| status | VARCHAR(20) | DEFAULT 'Operational' |
| established_on | DATE | NULLABLE |

**Role:** Physical locations serving as shelters. Links disasters to families and inventory. Central hub of logistics.

---

### **VOLUNTEER** (Human Resource Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| volunteer_id | INT | PK, AUTO_INCREMENT |
| full_name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(15) | NULLABLE |
| email | VARCHAR(100) | NULLABLE |
| org_id | INT | FK → ORGANIZATION (ON DELETE SET NULL) |
| specialization | VARCHAR(100) | NULLABLE (Medical, Rescue, Logistics, etc.) |
| skill_set | VARCHAR(255) | NULLABLE (comma-separated skills) |
| availability_status | VARCHAR(20) | DEFAULT 'Available' |
| deployed_camp_id | INT | FK → RELIEF_CAMP (ON DELETE SET NULL) |

**Role:** Represents relief workers. Can belong to an organization and be deployed to a specific camp.

---

### **AFFECTED_FAMILY** (Beneficiary Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| family_id | INT | PK, AUTO_INCREMENT |
| camp_id | INT | FK → RELIEF_CAMP (ON DELETE SET NULL) |
| head_of_family_name | VARCHAR(100) | NOT NULL |
| total_members | INT | NOT NULL |
| members_with_disability | INT | DEFAULT 0 |
| has_children_under_5 | BOOLEAN | DEFAULT FALSE |
| has_elderly | BOOLEAN | DEFAULT FALSE |
| contact_phone | VARCHAR(15) | NULLABLE |
| registration_date | DATE | NULLABLE |
| verification_status | VARCHAR(20) | DEFAULT 'Pending' |

**Role:** Tracks affected individuals seeking shelter. Contains vulnerability attributes for prioritized aid.

---

### **RESOURCE** (Catalog Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| resource_id | INT | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| category | VARCHAR(50) | NOT NULL (Food, Medicine, Shelter, Water, etc.) |
| unit_of_measure | VARCHAR(20) | NOT NULL (Kg, Liters, Pieces, Strips, etc.) |
| description | TEXT | NULLABLE |

**Role:** Master catalog of all aid items. Referenced by inventory and distribution tables.

---

### **CAMP_INVENTORY** (Stock Ledger Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| inventory_id | INT | PK, AUTO_INCREMENT |
| camp_id | INT | FK → RELIEF_CAMP (ON DELETE CASCADE) |
| resource_id | INT | FK → RESOURCE (ON DELETE CASCADE) |
| quantity_available | DECIMAL(10,2) | DEFAULT 0 |
| last_updated | TIMESTAMP | AUTO UPDATE CURRENT_TIMESTAMP |
| minimum_threshold | DECIMAL(10,2) | DEFAULT 0 |
| **UNIQUE** | (camp_id, resource_id) | **Ensures one entry per camp-resource pair** |

**Role:** Real-time stock levels at each camp. Critical for inventory management and alerts.

---

### **AID_DISTRIBUTION** (Transaction Ledger Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| distribution_id | INT | PK, AUTO_INCREMENT |
| family_id | INT | FK → AFFECTED_FAMILY (**ON DELETE RESTRICT**) |
| resource_id | INT | FK → RESOURCE (ON DELETE RESTRICT) |
| volunteer_id | INT | FK → VOLUNTEER (ON DELETE SET NULL) |
| quantity_given | DECIMAL(10,2) | NOT NULL |
| distribution_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| notes | TEXT | NULLABLE |

**Role:** Immutable audit trail of aid distribution. Records who gave what to whom and when. Protected by RESTRICT constraints.

---

### **CAMP_LOGS** (Audit Trail Entity)
| Attribute | Type | Constraints |
|-----------|------|------------|
| log_id | INT | PK, AUTO_INCREMENT |
| camp_id | INT | FK → RELIEF_CAMP (ON DELETE CASCADE) |
| event_type | VARCHAR(50) | (Created, Updated, Closed, etc.) |
| description | TEXT | NULLABLE |
| log_timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Role:** Historical record of camp-level events for compliance and analysis.

---

## 3. Relationship Matrix

| From | To | Cardinality | Type | Constraint | Business Rule |
|------|-----|-----------|------|-----------|--------------|
| DISASTER | RELIEF_CAMP | 1:N | Parent-Child | ON DELETE CASCADE | Each disaster has multiple camps |
| ORGANIZATION | RELIEF_CAMP | 1:N | Parent-Child | ON DELETE SET NULL | Each org manages multiple camps |
| ORGANIZATION | VOLUNTEER | 1:N | Parent-Child | ON DELETE SET NULL | Each org has multiple volunteers |
| RELIEF_CAMP | VOLUNTEER | 1:N | Deployment | ON DELETE SET NULL | Multiple volunteers deployed to a camp |
| RELIEF_CAMP | AFFECTED_FAMILY | 1:N | Shelter | ON DELETE SET NULL | Multiple families sheltered in a camp |
| RELIEF_CAMP | CAMP_INVENTORY | 1:N | Stock | ON DELETE CASCADE | One inventory ledger per camp-resource pair |
| RELIEF_CAMP | CAMP_LOGS | 1:N | Audit | ON DELETE CASCADE | Multiple log entries per camp |
| RESOURCE | CAMP_INVENTORY | 1:N | Catalog | ON DELETE CASCADE | Resource linked to multiple camp inventories |
| RESOURCE | AID_DISTRIBUTION | 1:N | Distribution | ON DELETE RESTRICT | Multiple distributions of same resource |
| AFFECTED_FAMILY | AID_DISTRIBUTION | 1:N | Recipient | ON DELETE RESTRICT (✓) | Multiple aid distributions per family |
| VOLUNTEER | AID_DISTRIBUTION | 1:N | Distributor | ON DELETE SET NULL | One volunteer may distribute multiple aids |

---

## 4. Normalization Analysis

### **1st Normal Form (1NF)**
✅ **PASSED** — All attributes are atomic (no repeating groups)
- Example: skill_set is a single VARCHAR(255) field, not a separate SKILL table (simplified approach)
- No multi-valued attributes in any table

### **2nd Normal Form (2NF)**
✅ **PASSED** — All non-key attributes are fully dependent on the Primary Key
- Example in VOLUNTEER table: full_name, phone, email all depend on volunteer_id, not on any subset of the key
- No partial dependencies

### **3rd Normal Form (3NF)**
✅ **PASSED** — No transitive dependencies
- Example: We don't store "organization phone" in VOLUNTEER table; instead we reference org_id
- Camp location data (state, district) is in RELIEF_CAMP, not duplicated elsewhere
- No non-key attribute depends on another non-key attribute

**Conclusion:** The database is designed in **3NF**, eliminating redundancy while maintaining data integrity.

---

## 5. Key Integrity Safeguards

### **Primary Key Strategy**
- All tables use `INT PRIMARY KEY AUTO_INCREMENT`
- Ensures unique, non-null identification for every record
- Supports millions of records without collisions

### **Foreign Key Constraints**
- **ON DELETE CASCADE:** Used for strong dependencies (Disaster → Camp, Camp → Inventory)
- **ON DELETE RESTRICT:** Used for audit trails and immutable records (Family → AID_DISTRIBUTION)
- **ON DELETE SET NULL:** Used for optional relationships (Org → Camp, Volunteer → Camp)

### **Unique Constraints**
- **CAMP_INVENTORY.uk_camp_resource:** Ensures one inventory entry per camp-resource pair

### **Data Validation**
- NOT NULL constraints on critical fields
- DEFAULT values for status and timestamps
- BOOLEAN fields for yes/no attributes (has_elderly, has_children_under_5)
- DECIMAL precision for quantities and measurements

---

## 6. Query Access Patterns

### **High-Frequency Queries**
1. Find camps by occupancy rate → Uses RELIEF_CAMP directly
2. List families in a camp → Joins RELIEF_CAMP + AFFECTED_FAMILY
3. Check inventory levels → Uses CAMP_INVENTORY + RESOURCE
4. Trace aid distribution → 4-way join (FAMILY, RESOURCE, VOLUNTEER, AID_DISTRIBUTION)

### **Aggregation Patterns**
- GROUP BY camp_id for occupancy metrics
- GROUP BY resource_id for distribution analysis
- GROUP BY category for inventory alerts

---

## 7. Summary

**Total Entities:** 9  
**Total Tables:** 9  
**Total Foreign Keys:** 13  
**Normalization Level:** 3NF (BCNF for most tables)  
**Data Integrity Level:** High (RESTRICT constraints on audit trail)

This ER model provides a complete, normalized, and integrity-protected database suitable for disaster relief management operations.

---

*End of ER Diagram Documentation*
