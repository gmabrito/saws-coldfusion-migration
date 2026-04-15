const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'SAWSMigration',
  user: process.env.DB_USER || 'saws_dev',
  password: process.env.DB_PASSWORD || 'SawsDev2026!',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getDb() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('[DB] Connected to SQL Server:', config.server, '/', config.database);
  }
  return pool;
}

async function closeDb() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('[DB] Connection closed');
  }
}

module.exports = { getDb, closeDb, sql };
