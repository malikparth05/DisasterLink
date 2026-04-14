# DisasterLink

> **A Centralized Disaster Relief Management System (DRMS)**
>
> A comprehensive full-stack Database Management System for coordinating disaster relief operations across multiple relief camps, managing resources, tracking families, and optimizing volunteer deployment.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Features in Detail](#features-in-detail)
- [Dashboard Screenshots](#dashboard-screenshots)
- [Statistics](#statistics)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**DisasterLink** solves the critical problem of fragmented humanitarian coordination during disasters. By centralizing data on disasters, relief camps, volunteers, families, and resources, it enables coordinators to make data-driven decisions that save lives.

### The Problem
- Information silos between organizations
- Over-occupied camps while others are empty
- Wasted resources in some areas, critical shortages in others
- Lack of transparency in aid distribution
- Slow family registration and volunteer deployment

### The Solution
DisasterLink provides a **single source of truth** for disaster response with:
- Real-time camp occupancy monitoring
- Intelligent family auto-assignment
- Automatic inventory tracking and alerts
- Volunteer performance leaderboards
- Complete audit trails for accountability

---

## Key Features

### Relief Camp Management
- Real-time occupancy tracking (15 active camps)
- Camp capacity monitoring and visualization
- Occupancy percentage calculations
- Multi-organization management

### Family Registration & Tracking
- Register affected families with vulnerability assessment
- Automatic camp assignment based on capacity
- Verification status tracking
- Contact information management
- 400+ families currently registered

### Inventory Management
- Real-time resource tracking across camps
- Critical shortage alerts
- Minimum threshold monitoring
- Resource distribution history
- 5 resource categories: Food & Water, Shelter, Medicine, Hygiene, Medical Supplies

### Volunteer Coordination
- Volunteer specialization tracking
- Performance leaderboard (units distributed, taskings handled)
- Camp deployment tracking
- Organization-based volunteer management

### Advanced Analytics
- Camp performance dashboards
- Resource distribution efficiency analysis
- Volunteer specialization gap analysis
- Regional risk hotspot detection
- Cumulative aid distribution charts

### Audit & Compliance
- Complete event logging
- Distribution history tracking
- Status change logs
- Camp activity timeline
- 300+ audit logs maintained

### Real-time Search
- Search across camps, families, volunteers
- District/location filtering
- Resource name search
- Event type filtering

---

## Tech Stack

### Database
- **MySQL 8.0** (Aiven Cloud)
- **9 normalized tables** (3rd Normal Form)
- **6 views** for reporting
- **4 stored procedures** for business logic
- **4 automated triggers** for data integrity

### Backend
- **Node.js + Express.js** (REST API)
- **MySQL2/Promise** (async database driver)
- **CORS** enabled for cross-origin requests
- **Dotenv** for environment configuration
- **Connection pooling** for performance

### Frontend
- **HTML5** semantic markup
- **CSS3** with flexbox/grid layouts
- **Vanilla JavaScript** (no frameworks, pure DOM)
- **Chart.js 4.4.2** for visualizations
- **Responsive design** (mobile-friendly)

### Design System
- **Color Palette**: Earth Brown (#634b30), Crimson (#c1272d), Sand (#e6d5b8)
- **Typography**: Albert Sans font family
- **Spacing**: 8px base unit system
- **Components**: Glass morphism design, rounded corners, subtle shadows

---

## Architecture

```
CLIENT BROWSER
(Frontend Dashboard)
http://localhost:8080
        |
        | HTTP Requests/Responses
        | (REST API calls)
        |
EXPRESS.JS API SERVER
http://localhost:3001
Routes: /api/stats, /api/camps, /api/families, etc.
8 RESTful endpoints with error handling
CORS enabled, JSON responses
        |
        | SQL Queries
        | Connection Pooling
        |
MYSQL DATABASE (Aiven Cloud)
Tables: DISASTER, RELIEF_CAMP, VOLUNTEER, etc.
Views: vw_camp_realtime_metrics, etc.
Procedures: sp_RegisterFamilyWithAutoCamp, etc.
Triggers: Auto-occupancy updates, inventory checks
```

---

## Quick Start

### Prerequisites
- Node.js 14+ and npm
- Python 3.7+ (for running frontend server)
- Git
- MySQL client (optional, for direct database access)
- Aiven MySQL credentials (provided in .env)

### 1-Minute Setup

```bash
# Clone the repository
git clone https://github.com/malikparth05/DisasterLink.git
cd DisasterLink

# Terminal 1: Start Backend API
cd backend
npm install
npm start
# Output: DisasterLink API running on http://localhost:3001

# Terminal 2: Start Frontend Dashboard
cd frontend
python3 -m http.server 8080
# Open: http://localhost:8080
```

That's it! Your dashboard is live.

---

## Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/malikparth05/DisasterLink.git
cd DisasterLink
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Aiven MySQL credentials
# DB_HOST=your-service.aivencloud.com
# DB_PORT=13306
# DB_USER=avnadmin
# DB_PASS=your_password
# DB_NAME=DisasterLink
# DB_SSL=true
# PORT=3001
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# No installation needed! Pure HTML/CSS/JS
# Just serve the directory
```

---

## Database Setup

### Option A: Full Setup with All Features
```bash
# Run the master import (includes DDL, DML, Views, Procedures, Triggers)
mysql -u avnadmin -p DisasterLink < sql/PHASE2_MASTER_IMPORT.sql
```

### Option B: Step-by-Step Setup
```bash
# 1. Create schema and tables
mysql -u avnadmin -p DisasterLink < sql/01_ddl_schema.sql

# 2. Insert test data (400+ families, 15 camps, 10 disasters)
mysql -u avnadmin -p DisasterLink < sql/02_dml_insert_data_comprehensive.sql

# 3. Add Phase 2 features (Views, Procedures, Triggers)
mysql -u avnadmin -p DisasterLink < sql/04_phase2_views.sql
mysql -u avnadmin -p DisasterLink < sql/05_phase2_procedures.sql
mysql -u avnadmin -p DisasterLink < sql/06_phase2_triggers.sql
```

### Verify Installation
```bash
mysql -u avnadmin -p DisasterLink -e "SHOW TABLES;"
# Should show: 9 tables
# AFFECTED_FAMILY, AID_DISTRIBUTION, CAMP_INVENTORY, CAMP_LOGS, 
# DISASTER, ORGANIZATION, RELIEF_CAMP, RESOURCE, VOLUNTEER
```

---

## Running the Application

### Terminal 1: Backend API
```bash
cd backend
npm start

# Expected output:
# DisasterLink API running on http://localhost:3001
# MySQL connection pooling initialized
# Ready to accept requests
```

### Terminal 2: Frontend Dashboard
```bash
cd frontend

# Option A: Python HTTP Server
python3 -m http.server 8080

# Option B: VS Code Live Server (right-click index.html → Open with Live Server)
```

### Access Dashboard
```
http://localhost:8080
```

### Test API Health
```bash
curl http://localhost:3001/api/health
# Response: {"status":"ok","timestamp":"2026-04-14T..."}
```

---

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Dashboard Stats
```http
GET /api/stats
Response: {
  "total_camps": 15,
  "global_occupancy_pct": 1.6,
  "active_disasters": 7,
  "critical_shortages": 1,
  "operational_camps": 15
}
```

#### Relief Camps
```http
GET /api/camps
Response: [
  {
    "camp_name": "Guwahati Central Camp",
    "district": "Guwahati",
    "managing_organization": "CARE International",
    "total_capacity": 100000,
    "current_occupancy": 1200,
    "occupancy_percentage": 1.20
  },
  ...
]
```

#### Affected Families
```http
GET /api/families
Response: [
  {
    "family_id": 328,
    "head_of_family_name": "Mia Martinez",
    "total_members": 2,
    "camp_name": "Guwahati Central Camp",
    "registration_date": "2026-04-14",
    "verification_status": "Verified"
  },
  ...
]
```

#### Disasters
```http
GET /api/disasters
Response: [
  {
    "disaster_id": 1,
    "name": "Hurricane Arthur",
    "type": "Hurricane",
    "severity_level": "High",
    "start_date": "2023-08-15",
    "status": "Resolved"
  },
  ...
]
```

#### Inventory Shortages
```http
GET /api/inventory
Response: [
  {
    "camp_name": "Silchar Emergency Hub",
    "resource_name": "Drinking Water",
    "category": "Food & Water",
    "quantity_available": 800,
    "minimum_threshold": 2000,
    "shortage_amount": 1200
  }
]
```

#### Volunteers
```http
GET /api/volunteers
Response: [
  {
    "full_name": "Elena Rodriguez",
    "specialization": "Medical Aid",
    "total_distributions_handled": 156,
    "units_distributed": 2450.50
  },
  ...
]
```

#### Audit Logs
```http
GET /api/audit
Response: [
  {
    "log_timestamp": "2026-04-14T17:22:48.000Z",
    "camp_name": "Barpeta Relief Center",
    "event_type": "Registration",
    "description": "Assigned family: John Doe (Size: 4)"
  },
  ...
]
```

#### Register Family (POST)
```http
POST /api/register
Content-Type: application/json

{
  "head_of_family": "John Doe",
  "total_members": 4,
  "disability_count": 0,
  "under_5": false,
  "has_elderly": false,
  "phone": "+91 98765 43210"
}

Response: {
  "success": true,
  "message": "Success! Family assigned to: Barpeta Relief Center"
}
```

#### Resources Summary
```http
GET /api/resources/summary
Response: [
  {
    "category": "Food & Water",
    "total_quantity": "76515.00"
  },
  {
    "category": "Medicine",
    "total_quantity": "4275.00"
  },
  ...
]
```

---

## Database Schema

### 9 Core Tables

#### DISASTER
```sql
CREATE TABLE DISASTER (
  disaster_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  severity_level VARCHAR(20),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'Active'
);
```

#### RELIEF_CAMP
```sql
CREATE TABLE RELIEF_CAMP (
  camp_id INT PRIMARY KEY AUTO_INCREMENT,
  disaster_id INT,
  managing_org_id INT,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(50),
  district VARCHAR(50),
  total_capacity INT NOT NULL,
  current_occupancy INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Operational',
  FOREIGN KEY (disaster_id) REFERENCES DISASTER(disaster_id) ON DELETE CASCADE,
  FOREIGN KEY (managing_org_id) REFERENCES ORGANIZATION(org_id) ON DELETE SET NULL
);
```

#### AFFECTED_FAMILY
```sql
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
  FOREIGN KEY (camp_id) REFERENCES RELIEF_CAMP(camp_id) ON DELETE SET NULL
);
```

#### CAMP_INVENTORY
```sql
CREATE TABLE CAMP_INVENTORY (
  inventory_id INT PRIMARY KEY AUTO_INCREMENT,
  camp_id INT,
  resource_id INT,
  quantity_available DECIMAL(10,2) DEFAULT 0,
  minimum_threshold DECIMAL(10,2) DEFAULT 0,
  UNIQUE KEY uk_camp_resource (camp_id, resource_id),
  FOREIGN KEY (camp_id) REFERENCES RELIEF_CAMP(camp_id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES RESOURCE(resource_id) ON DELETE CASCADE
);
```

#### AID_DISTRIBUTION
```sql
CREATE TABLE AID_DISTRIBUTION (
  distribution_id INT PRIMARY KEY AUTO_INCREMENT,
  family_id INT,
  resource_id INT,
  volunteer_id INT,
  quantity_given DECIMAL(10,2) NOT NULL,
  distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES AFFECTED_FAMILY(family_id) ON DELETE RESTRICT,
  FOREIGN KEY (resource_id) REFERENCES RESOURCE(resource_id) ON DELETE RESTRICT,
  FOREIGN KEY (volunteer_id) REFERENCES VOLUNTEER(volunteer_id) ON DELETE SET NULL
);
```

See `docs/ER_DIAGRAM.md` for complete schema visualization.

---

## Project Structure

```
DisasterLink/
├── README.md                              # This file
├── QUICK_START_GUIDE.md                   # Quick setup guide
│
├── backend/                               # Express.js API Server
│   ├── server.js                          # Main server entry point
│   ├── db.js                              # MySQL connection pool
│   ├── package.json                       # Dependencies
│   ├── .env.example                       # Environment template
│   │
│   └── routes/                            # API endpoints
│       ├── stats.js                       # GET /api/stats
│       ├── camps.js                       # GET /api/camps
│       ├── families.js                    # GET /api/families
│       ├── volunteers.js                  # GET /api/volunteers
│       ├── disasters.js                   # GET /api/disasters
│       ├── inventory.js                   # GET /api/inventory
│       ├── resources.js                   # GET /api/resources/summary
│       ├── register.js                    # POST /api/register
│       └── audit.js                       # GET /api/audit
│
├── frontend/                              # Single-Page Dashboard
│   ├── index.html                         # Main HTML (358 lines)
│   ├── app.js                             # All JavaScript logic (450+ lines)
│   └── style.css                          # Responsive styling (500+ lines)
│
├── sql/                                   # Database Scripts
│   ├── 01_ddl_schema.sql                  # Table definitions (130 lines)
│   ├── 02_dml_insert_data_comprehensive.sql # Test data (1,900 lines)
│   ├── 03_dql_queries.sql                 # Analytics queries (130 lines)
│   ├── 04_phase2_views.sql                # Reporting views (90 lines)
│   ├── 05_phase2_procedures.sql           # Stored procedures (130 lines)
│   ├── 06_phase2_triggers.sql             # Automated triggers (50 lines)
│   ├── 07_phase2_tests.sql                # Test data (80 lines)
│   └── PHASE2_MASTER_IMPORT.sql           # Complete setup (267 lines)
│
└── docs/                                  # Documentation
    ├── 01_problem_statement.md            # Business problem definition
    ├── 02_technical_summary.md            # Technical architecture
    ├── 03_phase2_summary.md               # Advanced features
    ├── ER_DIAGRAM.md                      # Entity-relationship diagram
    ├── DISASTERLINK_MASTER_DOCUMENTATION.md # Complete technical docs
    └── FINAL_PROJECT_REPORT.md            # Project summary report
```

---

## Features in Detail

### Real-Time Dashboard
- KPI Cards: Total camps, occupancy risk, critical shortages, aid units
- Camp Occupancy Monitor: Visual map with location markers
- Stock Severity Alerts: Critical shortages with action buttons
- Mission Impact Chart: Cumulative aid distribution timeline

### Searchable Data Tables
All tables support real-time search:
- Camps: Search by name, district, organization
- Families: Search by name, camp, phone
- Volunteers: Search by name, specialization
- Disasters: Search by name, type, severity
- Inventory: Search by camp, resource, category
- Audit Logs: Search by camp, event type, description

### Family Registration
- Smart Auto-Assignment: Automatically assigns to camp with most available capacity
- Vulnerability Tracking: Records disabilities, children, elderly members
- Verification Status: Marks families as Verified or Pending
- Real-Time Feedback: Success/error messages on registration

### Volunteer Performance
- Leaderboard Ranking: Volunteers ranked by distributions handled
- Performance Metrics: Units distributed, taskings handled
- Specialization Tracking: Medical, Logistics, Administrative, etc.
- Camp Deployment: Track which camps volunteers are deployed to

### Inventory Management
- Threshold Monitoring: Alerts when stock falls below minimum
- Real-Time Stock Levels: Updated as distributions occur
- Category Breakdown: Food & Water, Shelter, Medicine, Hygiene, Medical
- Distribution History: Complete audit trail of all distributions

### Advanced Analytics
- Camp Fill Rate: Occupancy percentage with visual indicators
- Regional Risk Analysis: Identifies high-risk camps needing support
- Resource Distribution Efficiency: Aid per person metrics
- Volunteer Gap Analysis: Staffing levels vs. occupancy

---

## Dashboard Screenshots

### Main Dashboard
- 4 KPI cards with trend indicators
- Camp occupancy monitoring with visual map
- Stock severity alerts with action buttons
- Mission impact chart

### Relief Camps Section
- 15 camps with occupancy levels
- Color-coded fill rates (green/yellow/red)
- Organization and district information
- Real-time search filtering

### Family Registry
- 401+ families with verification status
- Camp assignments visible
- Vulnerability flags (disabilities, children, elderly)
- Contact information

### Volunteer Performance
- 100+ volunteers ranked by performance
- Specialization and taskings info
- Units distributed metrics
- Real-time search

### Inventory Monitor
- Critical shortage alerts
- Resource levels by category
- 90,690 total units in stock
- Category breakdown pie chart

### Audit Logs
- 300+ recent operations logged
- Event types: Registration, Transfer, Status_Change
- Complete description of each action
- Timestamps for accountability

---

## Statistics

### Database Scope
```
Database Name: DisasterLink
Tables: 9
Views: 6
Stored Procedures: 4
Triggers: 4
Test Records: 2,500+
SQL Lines: 2,775+
```

### Data Loaded
```
Disasters: 10
Organizations: 10
Relief Camps: 15
Volunteers: 100+
Affected Families: 401
Resources: 20+ types
Inventory Records: 300
Audit Logs: 500+
Aid Distributions: 1,500+
```

### Inventory Levels
```
Total Stock: 90,690 units

By Category:
- Food & Water: 76,515 units (84%)
- Shelter: 7,800 units (8.6%)
- Medicine: 4,275 units (4.7%)
- Hygiene: 1,250 units (1.4%)
- Medical Supplies: 850 units (0.9%)

Critical Shortages: 1
- Silchar Emergency Hub: -1,200 units of Drinking Water
```

### Camp Distribution
```
Active Camps: 15
Operational: 15
Total Capacity: 1,500,000 persons
Current Occupancy: 24,070 persons
Global Occupancy: 1.6%
Average Camp Size: 100,000 persons
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add comments for complex logic
- Test all API endpoints before submitting
- Update documentation as needed

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Academic Information

This is a comprehensive Database Management Systems (DBMS) project demonstrating:

- Database Design: 3rd Normal Form (3NF) schema
- Data Integrity: Foreign keys, constraints, triggers
- Advanced SQL: Views, procedures, triggers, transactions
- API Development: RESTful endpoints with error handling
- Frontend Design: Responsive UI with real-time search
- Full-Stack Development: Complete end-to-end solution

---

## Deployment Ready

DisasterLink is production-ready and can be deployed to:
- Heroku (Backend + Frontend)
- AWS (EC2, RDS, S3)
- Google Cloud (App Engine, Cloud SQL)
- Azure (App Service, Azure Database)

For deployment instructions, see `docs/` folder.

---

Built for humanitarian disaster relief coordination
