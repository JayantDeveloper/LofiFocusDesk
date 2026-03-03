const db = require("../db");

const stmtFindUserByUsername = db.prepare(`
  SELECT * FROM users
  WHERE lower(username) = lower(?)
  LIMIT 1
`);

const stmtFindUserById = db.prepare("SELECT * FROM users WHERE id = ?");

const stmtInsertUser = db.prepare(`
  INSERT INTO users (
    username,
    password_hash,
    display_name,
    calendar_embed,
    music_urls,
    radio_sync_enabled,
    radio_focus_slot,
    radio_break_slot
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtUpdateUser = db.prepare(`
  UPDATE users
  SET
    display_name = ?,
    calendar_embed = ?,
    music_urls = ?,
    radio_sync_enabled = ?,
    radio_focus_slot = ?,
    radio_break_slot = ?
  WHERE id = ?
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
  displayName,
  calendarEmbed,
  musicUrls,
  radioSyncEnabled,
  radioFocusSlot,
  radioBreakSlot,
}) {
  const info = stmtInsertUser.run(
    username,
    passwordHash,
    displayName,
    calendarEmbed,
    musicUrls,
    radioSyncEnabled,
    radioFocusSlot,
    radioBreakSlot,
  );

  return findUserById(info.lastInsertRowid);
}

function updateUserProfile(userId, {
  displayName,
  calendarEmbed,
  musicUrls,
  radioSyncEnabled,
  radioFocusSlot,
  radioBreakSlot,
}) {
  stmtUpdateUser.run(
    displayName,
    calendarEmbed,
    musicUrls,
    radioSyncEnabled,
    radioFocusSlot,
    radioBreakSlot,
    userId,
  );

  return findUserById(userId);
}

module.exports = {
  createUser,
  findUserById,
  findUserByUsername,
  updateUserProfile,
};
