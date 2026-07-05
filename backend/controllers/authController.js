const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  JWT_SECRET,
  REMEMBER_EXPIRES_IN,
  TOKEN_EXPIRES_IN,
} = require("../constants/serverConfig");
const { clearAuthCookie, setAuthCookie } = require("../utils/cookieUtils");
const { normalizeUsername } = require("../utils/normalizeUtils");
const {
  createUser,
  findUserById,
  findUserByUsername,
  userExistsByUsername,
} = require("../utils/repositories/userRepository");
const { userJson } = require("../utils/userResponseUtils");

const DEFAULT_BCRYPT_SALT_ROUNDS = 10;
const USERNAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 8;
const DUPLICATE_USERNAME_ERROR = "An account with this username already exists.";

function getBcryptSaltRounds() {
  const configuredRounds = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "", 10);
  if (!Number.isInteger(configuredRounds)) return DEFAULT_BCRYPT_SALT_ROUNDS;
  return Math.min(14, Math.max(8, configuredRounds));
}

const BCRYPT_SALT_ROUNDS = getBcryptSaltRounds();

function signToken(userId, remember) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: remember ? REMEMBER_EXPIRES_IN : TOKEN_EXPIRES_IN,
  });
}

function isDuplicateUserError(error) {
  return error && error.code === "23505";
}

async function register(req, res) {
  const { username = "", password = "", remember = false } = req.body || {};
  const normalizedUsername = normalizeUsername(username);
  const passwordString = typeof password === "string" ? password : "";
  const shouldRemember = remember === true;

  if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    res.status(400).json({ error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` });
    return;
  }

  if (passwordString.length < PASSWORD_MIN_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
    return;
  }

  try {
    const exists = await userExistsByUsername(normalizedUsername);
    if (exists) {
      res.status(409).json({ error: DUPLICATE_USERNAME_ERROR });
      return;
    }

    const passwordHash = await bcrypt.hash(passwordString, BCRYPT_SALT_ROUNDS);
    const user = await createUser({ username: normalizedUsername, passwordHash });

    if (!user) {
      res.status(500).json({ error: "Failed to create account" });
      return;
    }

    const token = signToken(user.id, shouldRemember);
    setAuthCookie(res, token, shouldRemember);

    res.status(201).json({ user: userJson(user) });
  } catch (error) {
    if (isDuplicateUserError(error)) {
      res.status(409).json({ error: DUPLICATE_USERNAME_ERROR });
      return;
    }

    console.error("[auth] register error", error);
    res.status(500).json({ error: "Failed to create account" });
  }
}

async function login(req, res) {
  const { username = "", password = "", remember = false } = req.body || {};
  const normalizedUsername = normalizeUsername(username);
  const passwordString = typeof password === "string" ? password : "";
  const shouldRemember = remember === true;

  if (!normalizedUsername || !passwordString) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  try {
    const user = await findUserByUsername(normalizedUsername);

    if (!user) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const matches = await bcrypt.compare(passwordString, user.password_hash);
    if (!matches) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const token = signToken(user.id, shouldRemember);
    setAuthCookie(res, token, shouldRemember);

    res.json({ user: userJson(user) });
  } catch (error) {
    console.error("[auth] login error", error);
    res.status(500).json({ error: "Login failed" });
  }
}

function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

async function getCurrentUser(req, res) {
  if (!req.userId) {
    res.json({ user: null });
    return;
  }

  try {
    const user = await findUserById(req.userId);
    if (!user) {
      res.status(401).json({ user: null });
      return;
    }

    res.json({ user: userJson(user) });
  } catch (error) {
    console.error("[auth] getCurrentUser error", error);
    res.status(500).json({ error: "Unable to retrieve account" });
  }
}

module.exports = {
  getCurrentUser,
  login,
  logout,
  register,
};
