const pool = require("./db");

const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW();");
    console.log("Database Connected Successfully:", result.rows[0]);
  } catch (err) {
    console.error("Database Connection Failed:", err);
  } finally {
    pool.end();
  }
};

testConnection();
