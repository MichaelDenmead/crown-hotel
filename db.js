// db.js - PostgreSQL Connection Pool with Cloud + Local Fallback
require('dotenv').config(); // Load environment variables
const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  // 🌐 Use Render-hosted database
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Render SSL
    },
  });
  console.log('🔗 Connected to Render PostgreSQL database');
} else {
  // 💻 Fallback to local database
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crown_hotel',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
  });
  console.log('💻 Connected to local PostgreSQL database');
}

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
