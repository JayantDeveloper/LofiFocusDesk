const pool = require("../utils/db");

async function getHealth(_req, res) {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.json({ status: "ok", db: "unavailable" });
  }
}

module.exports = {
  getHealth,
};
