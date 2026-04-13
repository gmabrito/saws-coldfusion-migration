const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'SAWSMigration',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

const dbPool = new sql.ConnectionPool(dbConfig);

let dbReady = dbPool.connect().catch((err) => {
  console.warn('Database connection failed:', err.message);
  return null;
});

async function getDb() {
  const pool = await dbReady;
  if (!pool) throw new Error('Database not connected');
  return pool;
}

module.exports = { sql, getDb };
