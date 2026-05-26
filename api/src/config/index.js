require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  roble: {
    baseUrl: 'https://roble-api.openlab.uninorte.edu.co/auth',
    dbName: process.env.ROBLE_DB_NAME,
  },

  containerManager: {
    url: process.env.CONTAINER_MANAGER_URL || 'http://localhost:4001',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  dbPath: process.env.DB_PATH || './cubehost.db',
};
