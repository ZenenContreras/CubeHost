const app = require('./app');
const config = require('./config');
const { getDb } = require('./db');

// Inicializar DB al arrancar
getDb();

app.listen(config.port, () => {
  console.log(`[api] Running on port ${config.port} (${config.nodeEnv})`);
});
