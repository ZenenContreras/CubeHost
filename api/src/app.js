const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();

app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

// Rate limit global: 100 req/min por IP
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones, intenta en un minuto' },
  })
);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.use((_, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(errorHandler);

module.exports = app;
