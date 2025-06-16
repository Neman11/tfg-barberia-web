const { Pool } = require('pg');
require('dotenv').config();

// Esto es más eficiente que crear una conexión nueva para cada consulta.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Este método usará el pool para enviar consultas a la base de datos.
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
