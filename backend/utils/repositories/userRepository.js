const db = require("../db");

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
const PUBLIC_USER_CACHE_LIMIT = 1000;
// Keep the auth/profile read path hot; writes in this repository refresh the cached row.
const publicUserCache = new Map();

const stmtUsernameExists = db.prepare(`
  SELECT 1
  FROM users
  WHERE username = ? COLLATE NOCASE
  LIMIT 1
`);

const stmtFindUserByUsername = db.prepare(`
  SELECT ${AUTH_USER_COLUMNS}
  FROM users
  WHERE username = ? COLLATE NOCASE
  LIMIT 1
`);

const stmtFindUserById = db.prepare(`
  SELECT ${PUBLIC_USER_COLUMNS}
  FROM users
  WHERE id = ?
`);

const stmtInsertUserReturning = db.prepare(`
  INSERT INTO users (
    username,
    password_hash
  )
  VALUES (?, ?)
  RETURNING ${PUBLIC_USER_COLUMNS}
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
  RETURNING ${PUBLIC_USER_COLUMNS}
`);

function toPublicUserRow(row) {
  if (!row) return null;

  return PUBLIC_USER_FIELDS.reduce((publicRow, field) => {
    publicRow[field] = row[field];
    return publicRow;
  }, {});
}

function cachePublicUser(row) {
  const publicRow = toPublicUserRow(row);
  if (!publicRow || publicRow.id === undefined || publicRow.id === null) {
    return row;
  }

  const cacheKey = String(publicRow.id);

  if (publicUserCache.has(cacheKey)) {
    publicUserCache.delete(cacheKey);
  } else if (publicUserCache.size >= PUBLIC_USER_CACHE_LIMIT) {
    const oldestKey = publicUserCache.keys().next().value;
    if (oldestKey !== undefined) {
      publicUserCache.delete(oldestKey);
    }
  }

  publicUserCache.set(cacheKey, publicRow);
  return row;
}

function getCachedPublicUser(userId) {
  const cacheKey = String(userId);
  const cached = publicUserCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  publicUserCache.delete(cacheKey);
  publicUserCache.set(cacheKey, cached);
  return { ...cached };
}

function userExistsByUsername(username) {
  return Boolean(stmtUsernameExists.get(username));
}

function findUserByUsername(username) {
  const user = stmtFindUserByUsername.get(username);
  cachePublicUser(user);
  return user;
}

function findUserById(userId) {
  const cachedUser = getCachedPublicUser(userId);
  if (cachedUser) {
    return cachedUser;
  }

  const user = stmtFindUserById.get(userId);
  cachePublicUser(user);
  return user;
}

function createUser({
  username,
  passwordHash,
}) {
  const user = stmtInsertUserReturning.get(username, passwordHash);
  cachePublicUser(user);
  return user;
}

function updateUserProfile(userId, {
  displayName,
  calendarEmbed,
  musicUrls,
  radioSyncEnabled,
  radioFocusSlot,
  radioBreakSlot,
}) {
  const user = stmtUpdateUserProfile.get(
    displayName,
    calendarEmbed,
    musicUrls,
    radioSyncEnabled,
    radioFocusSlot,
    radioBreakSlot,
    userId,
  );
  cachePublicUser(user);
  return user;
}

module.exports = {
  createUser,
  findUserById,
  findUserByUsername,
  userExistsByUsername,
  updateUserProfile,
};
