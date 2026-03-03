const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), override: true });

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev-secret-change-me";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || "365d";
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "focusdesk_token";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE || (IS_PROD ? "none" : "lax")).toLowerCase();
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? String(process.env.COOKIE_SECURE).toLowerCase() === "true"
  : COOKIE_SAME_SITE === "none";

const DEV_FRONTEND_ORIGINS = Object.freeze([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function normalizeOrigin(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

const configuredFrontendOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN
      .split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean)
  : [];

const allowedFrontendOrigins = IS_PROD
  ? configuredFrontendOrigins
  : Array.from(new Set([...configuredFrontendOrigins, ...DEV_FRONTEND_ORIGINS]));

module.exports = {
  allowedFrontendOrigins,
  AUTH_COOKIE_NAME,
  COOKIE_DOMAIN,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
  JWT_SECRET,
  PORT,
  REMEMBER_EXPIRES_IN,
  TOKEN_EXPIRES_IN,
  normalizeOrigin,
};
