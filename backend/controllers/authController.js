const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  DEFAULT_MUSIC_URLS,
  DEFAULT_RADIO_BREAK_SLOT,
  DEFAULT_RADIO_FOCUS_SLOT,
  DEFAULT_RADIO_SYNC_ENABLED,
} = require("../constants/musicConstants");
const {
  JWT_SECRET,
  REMEMBER_EXPIRES_IN,
  TOKEN_EXPIRES_IN,
} = require("../constants/serverConfig");
const { clearAuthCookie, setAuthCookie } = require("../utils/cookieUtils");
const { serializeMusicUrls } = require("../utils/musicPreferenceUtils");
const { normalizeUsername } = require("../utils/normalizeUtils");
const {
  createUser,
  findUserById,
  findUserByUsername,
} = require("../utils/repositories/userRepository");
const { userJson } = require("../utils/userResponseUtils");
const DEFAULT_BCRYPT_SALT_ROUNDS = 10;

function getBcryptSaltRounds() {
  const configuredRounds = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "", 10);
  if (!Number.isInteger(configuredRounds)) return DEFAULT_BCRYPT_SALT_ROUNDS;
  return Math.min(14, Math.max(8, configuredRounds));
}

function signToken(userId, remember) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: remember ? REMEMBER_EXPIRES_IN : TOKEN_EXPIRES_IN,
  });
}

async function register(req, res) {
  const { username = "", password = "", remember = false } = req.body || {};
  const normalizedUsername = normalizeUsername(username);

  if (normalizedUsername.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  if (findUserByUsername(normalizedUsername)) {
    res.status(409).json({ error: "An account with this username already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, getBcryptSaltRounds());
  const user = createUser({
    username: normalizedUsername,
    passwordHash,
    displayName: normalizedUsername,
    calendarEmbed: "",
    musicUrls: serializeMusicUrls(DEFAULT_MUSIC_URLS),
    radioSyncEnabled: DEFAULT_RADIO_SYNC_ENABLED ? 1 : 0,
    radioFocusSlot: DEFAULT_RADIO_FOCUS_SLOT,
    radioBreakSlot: DEFAULT_RADIO_BREAK_SLOT,
  });

  if (!user) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  const shouldRemember = remember === true;
  const token = signToken(user.id, shouldRemember);
  setAuthCookie(res, token, shouldRemember);

  res.json({ user: userJson(user), token });
}

async function login(req, res) {
  const { username = "", password = "", remember = false } = req.body || {};
  const normalizedUsername = normalizeUsername(username);
  const user = findUserByUsername(normalizedUsername);

  if (!user) {
    res.status(404).json({ error: "No account found with that username." });
    return;
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  const shouldRemember = remember === true;
  const token = signToken(user.id, shouldRemember);
  setAuthCookie(res, token, shouldRemember);

  res.json({ user: userJson(user), token });
}

function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

function getCurrentUser(req, res) {
  if (!req.userId) {
    res.json({ user: null });
    return;
  }

  const user = findUserById(req.userId);
  res.json({ user: userJson(user) });
}

module.exports = {
  getCurrentUser,
  login,
  logout,
  register,
};
