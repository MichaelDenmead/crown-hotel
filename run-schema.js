const fs = require("fs");
const path = require("path");
const pool = require("./db"); // uses your existing db connection

// Load SQL from file
const sqlPath = path.join(__dirname, "sql", "01-create-schema.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

// Split into individual statements
const statements = sqlContent
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean); // remove empty lines

(async () => {
  try {
    for (const stmt of statements) {
      console.log(`▶ Running: ${stmt}`);
      await pool.query(stmt);
    }
    console.log("✅ Schema created successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    pool.end();
  }
})();
