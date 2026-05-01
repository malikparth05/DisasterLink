const express = require('express');
const cors = require('cors');
require('dotenv').config();

const statsRouter     = require('./routes/stats');
const campsRouter     = require('./routes/camps');
const inventoryRouter = require('./routes/inventory');
const volunteersRouter = require('./routes/volunteers');
const registerRouter  = require('./routes/register');
const auditRouter     = require('./routes/audit');
const familiesRouter  = require('./routes/families');
const resourcesRouter = require('./routes/resources');
const disastersRouter = require('./routes/disasters');

const app = express();
const PORT = process.env.PORT || 3001;
const db = require('./db');

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/stats',      statsRouter);
app.use('/api/camps',      campsRouter);
app.use('/api/inventory',  inventoryRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/register',   registerRouter);
app.use('/api/audit',      auditRouter);
app.use('/api/families',   familiesRouter);
app.use('/api/resources',  resourcesRouter);
app.use('/api/disasters',  disastersRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), db: 'connected' });
});

// Test DB Connection and Start
(async () => {
  try {
    console.log('Testing database connection...');
    await db.query('SELECT 1');
    console.log('✅ Database connected successfully.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 DisasterLink API running on http://localhost:${PORT}`);
      console.log(`📡 Access via http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Database connection failed!');
    console.error(err.message);
    process.exit(1);
  }
})();
