const pool = require("./db");
require("dotenv").config();

const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW();");

    if (process.env.DATABASE_URL) {
      console.log("🌐 Connected to Render database");
    } else {
      console.log("💻 Connected to local database");
    }

    console.log("📅 Server Time:", result.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  } finally {
    pool.end();
  }
};

testConnection();
