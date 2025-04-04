const fs = require("fs");
const path = require("path");
const pool = require("./db");

const sqlPath = path.join(__dirname, "sql", "02-create-tables.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

const statements = sqlContent
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

(async () => {
  try {
    for (const stmt of statements) {
      console.log(`▶ Running: ${stmt.split("\n")[0]}...`);
      await pool.query(stmt);
    }
    console.log("✅ All tables created successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    pool.end();
  }
})();
