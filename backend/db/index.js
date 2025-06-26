const { Pool } = require('pg');
const config = require('../config');


const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
  // Configuraciones adicionales del pool
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
});

// Evento para logging de conexiones
pool.on('connect', (client) => {
  console.log('📡 Nueva conexión a la base de datos establecida');
});

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el pool de base de datos:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool // Exportar el pool para poder cerrarlo si es necesario
};

