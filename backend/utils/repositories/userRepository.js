const db = require("../db");

const stmtFindUserByUsername = db.prepare(`
  SELECT * FROM users
  WHERE username = ? COLLATE NOCASE
  LIMIT 1
`);

const stmtFindUserById = db.prepare("SELECT * FROM users WHERE id = ?");

const stmtInsertUserReturning = db.prepare(`
  INSERT INTO users (
    username,
    password_hash
  )
  VALUES (?, ?)
  RETURNING *
`);

const stmtUpdateUserProfile = db.prepare(`
  UPDATE users
  SET
    display_name = COALESCE(?, display_name),
    calendar_embed = COALESCE(?, calendar_embed),
    music_urls = COALESCE(?, music_urls),
    radio_sync_enabled = COALESCE(?, radio_sync_enabled),
    radio_focus_slot = COALESCE(?, radio_focus_slot),
    radio_break_slot = COALESCE(?, radio_break_slot)
  WHERE id = ?
  RETURNING *
`);

function findUserByUsername(username) {
  return stmtFindUserByUsername.get(username);
}

function findUserById(userId) {
  return stmtFindUserById.get(userId);
}

function createUser({
  username,
  passwordHash,
}) {
  return stmtInsertUserReturning.get(username, passwordHash);
}

function updateUserProfile(userId, {
  displayName,
  calendarEmbed,
  musicUrls,
  radioSyncEnabled,
  radioFocusSlot,
  radioBreakSlot,
}) {
  return stmtUpdateUserProfile.get(
    displayName,
    calendarEmbed,
    musicUrls,
    radioSyncEnabled,
    radioFocusSlot,
    radioBreakSlot,
    userId,
  );
}

module.exports = {
  createUser,
  findUserById,
  findUserByUsername,
  updateUserProfile,
};
