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

app.use(cors());
app.use(express.json());

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
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`DisasterLink API running on http://localhost:${PORT}`);
});
