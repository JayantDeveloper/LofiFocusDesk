const {
  AUTH_COOKIE_NAME,
  COOKIE_DOMAIN,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
  REMEMBER_EXPIRES_IN,
  TOKEN_EXPIRES_IN,
} = require("../constants/serverConfig");
const { durationToMs } = require("./timeUtils");

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  if (!cookieHeader) return {};

  const pairs = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const cookies = {};

  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex <= 0) continue;

    const name = pair.slice(0, eqIndex).trim();
    const rawValue = pair.slice(eqIndex + 1).trim();

    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }

  return cookies;
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7);
  }

  const cookies = parseCookies(req);
  return cookies[AUTH_COOKIE_NAME] || null;
}

function getCookieOptions(maxAge) {
  const options = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
  };

  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  if (Number.isFinite(maxAge) && maxAge > 0) {
    options.maxAge = maxAge;
  }

  return options;
}

function setAuthCookie(res, token, remember) {
  const expiresIn = remember ? REMEMBER_EXPIRES_IN : TOKEN_EXPIRES_IN;
  const maxAge = durationToMs(expiresIn);
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(maxAge));
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
}

module.exports = {
  clearAuthCookie,
  getTokenFromRequest,
  setAuthCookie,
};
