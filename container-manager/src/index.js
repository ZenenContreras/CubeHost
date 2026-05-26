const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const { getDb } = require('./db');
const containerRoutes = require('./routes/containers');
const proxy = require('./proxy');
const monitor = require('./monitor');

// Initialize DB
getDb();

// Internal REST API (called only by the api service)
const app = express();
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/containers', containerRoutes);

app.use((err, req, res, next) => {
  console.error('[api]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(config.apiPort, () => {
  console.log(`[api] Container manager API on port ${config.apiPort}`);
});

// Reverse proxy server (handles *.localhost user traffic)
proxy.start();

// Inactivity monitor
monitor.start();
