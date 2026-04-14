# DisasterLink — Quick Start Guide

## Project Structure

```
dbms project/
├── backend/
│   ├── server.js          # Express entry point
│   ├── db.js              # MySQL connection pool (Aiven)
│   ├── .env               # ← YOU MUST CREATE THIS (see below)
│   ├── .env.example       # Template
│   ├── package.json
│   └── routes/
│       ├── stats.js       # GET /api/stats
│       ├── camps.js       # GET /api/camps
│       ├── inventory.js   # GET /api/inventory
│       ├── volunteers.js  # GET /api/volunteers
│       ├── register.js    # POST /api/register
│       ├── audit.js       # GET /api/audit
│       ├── families.js    # GET /api/families
│       └── resources.js   # GET /api/resources/summary
├── frontend/
│   ├── index.html         # Single-page dashboard
│   ├── style.css          # Flat design stylesheet
│   └── app.js             # All frontend logic
└── sql/                   # Database scripts (Phase 1 & 2)
```

---

## Step 1 — Configure Your Database Credentials

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your Aiven MySQL details:

```
DB_HOST=your-service-name.aivencloud.com
DB_PORT=13306
DB_USER=avnadmin
DB_PASS=your_password_here
DB_NAME=DisasterLink
DB_SSL=true
PORT=3001
```

> **Aiven Note:** Always use `DB_SSL=true`. The default port for Aiven MySQL is **13306**, not 3306.

---

## Step 2 — Install Dependencies & Start the API

```bash
cd backend
npm install
npm start
```

Verify the API is running:
```
http://localhost:3001/api/health
```

Expected response: `{ "status": "ok", "timestamp": "..." }`

---

## Step 3 — Open the Dashboard

Open `frontend/index.html` directly in your browser, or serve it with any static file server:

```bash
# Option A: Python (no install needed)
cd frontend
python3 -m http.server 8080
# Open: http://localhost:8080

# Option B: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

> The frontend calls `http://localhost:3001/api/...` — the backend must be running first.

---

## API Reference

| Method | Endpoint                  | Source                       | Description                      |
|--------|---------------------------|------------------------------|----------------------------------|
| GET    | `/api/stats`              | Direct queries               | KPI metrics for dashboard cards  |
| GET    | `/api/camps`              | `vw_camp_realtime_metrics`   | All camp metrics                 |
| GET    | `/api/inventory`          | `vw_critical_shortages`      | Items below minimum threshold    |
| GET    | `/api/volunteers`         | `vw_volunteer_performance`   | Volunteer rankings               |
| POST   | `/api/register`           | `sp_RegisterFamilyWithAutoCamp` | Auto-assign family to camp    |
| GET    | `/api/audit`              | `vw_camp_activity_audit`     | Event log (latest 300)           |
| GET    | `/api/families`           | `AFFECTED_FAMILY` join       | Full family registry             |
| GET    | `/api/resources/summary`  | `CAMP_INVENTORY` + `RESOURCE`| Category totals for pie chart    |

### POST /api/register — Request Body

```json
{
  "head_of_family":   "John Doe",
  "total_members":    4,
  "disability_count": 1,
  "under_5":          true,
  "has_elderly":      false,
  "phone":            "+91 98765 43210"
}
```

---

## Dashboard Features

- **Dashboard** — KPI cards + Bar chart (occupancy %) + Doughnut chart (resource breakdown)
- **Relief Camps** — Searchable table with visual fill-rate bars
- **Shortages** — Critical inventory items sorted by severity
- **Volunteers** — Performance rankings with gold/silver/bronze badges
- **Family Registry** — Searchable + filterable by verification status
- **Register Family** — Form with real-time success/error feedback from stored procedure
- **Audit Logs** — Filterable by event type (Registration, Transfer, Status Change)
