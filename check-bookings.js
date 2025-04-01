const pool = require("./db");

(async () => {
  try {
    const res = await pool.query("SELECT * FROM hotelbooking.booking ORDER BY b_ref DESC LIMIT 5;");
    console.log("📦 Recent Bookings:");
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error checking bookings:", err.message);
  } finally {
    pool.end();
  }
})();
