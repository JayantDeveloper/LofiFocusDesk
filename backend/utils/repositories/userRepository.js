const pool = require("../db");

const PUBLIC_USER_FIELDS = [
  "id",
  "username",
  "display_name",
  "calendar_embed",
  "music_urls",
  "radio_sync_enabled",
  "radio_focus_slot",
  "radio_break_slot",
];
const PUBLIC_USER_COLUMNS = PUBLIC_USER_FIELDS.join(", ");
const AUTH_USER_COLUMNS = `${PUBLIC_USER_COLUMNS}, password_hash`;

async function userExistsByUsername(username) {
  const { rows } = await pool.query(
    "SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
    [username],
  );
  return rows.length > 0;
}

async function findUserByUsername(username) {
  const { rows } = await pool.query(
    `SELECT ${AUTH_USER_COLUMNS} FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],
  );
  return rows[0] ?? null;
}

async function findUserById(userId) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function createUser({ username, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING ${PUBLIC_USER_COLUMNS}`,
    [username, passwordHash],
  );
  return rows[0] ?? null;
}

async function updateUserProfile(userId, {
  displayName,
  calendarEmbed,
  musicUrls,
  radioSyncEnabled,
  radioFocusSlot,
  radioBreakSlot,
}) {
  const { rows } = await pool.query(
    `UPDATE users
     SET
       display_name = COALESCE($1, display_name),
       calendar_embed = COALESCE($2, calendar_embed),
       music_urls = COALESCE($3, music_urls),
       radio_sync_enabled = COALESCE($4, radio_sync_enabled),
       radio_focus_slot = COALESCE($5, radio_focus_slot),
       radio_break_slot = COALESCE($6, radio_break_slot)
     WHERE id = $7
     RETURNING ${PUBLIC_USER_COLUMNS}`,
    [displayName, calendarEmbed, musicUrls, radioSyncEnabled, radioFocusSlot, radioBreakSlot, userId],
  );
  return rows[0] ?? null;
}

module.exports = {
  createUser,
  findUserById,
  findUserByUsername,
  userExistsByUsername,
  updateUserProfile,
};
