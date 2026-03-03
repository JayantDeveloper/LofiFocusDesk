const {
  DEFAULT_MUSIC_URLS,
  DEFAULT_RADIO_BREAK_SLOT,
  DEFAULT_RADIO_FOCUS_SLOT,
  MAX_MUSIC_SLOTS,
} = require("../constants/musicConstants");

function normalizeMusicUrls(value) {
  const source = Array.isArray(value) ? value : [];
  const normalized = Array.from({ length: MAX_MUSIC_SLOTS }, (_, index) => {
    if (typeof source[index] !== "string") return "";
    return source[index].trim();
  });

  if (!normalized[0]) {
    normalized[0] = DEFAULT_MUSIC_URLS[0];
  }

  return normalized;
}

function parseMusicUrls(rawValue) {
  if (Array.isArray(rawValue)) {
    return normalizeMusicUrls(rawValue);
  }

  if (typeof rawValue === "string" && rawValue.trim()) {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return normalizeMusicUrls(parsed);
      }
    } catch {
      return normalizeMusicUrls(DEFAULT_MUSIC_URLS);
    }
  }

  return normalizeMusicUrls(DEFAULT_MUSIC_URLS);
}

function serializeMusicUrls(value) {
  return JSON.stringify(parseMusicUrls(value));
}

function normalizeRadioSyncEnabled(value) {
  return value === true || value === 1 || value === "1";
}

function normalizeMusicSlot(value, fallback = DEFAULT_RADIO_FOCUS_SLOT) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(MAX_MUSIC_SLOTS - 1, Math.max(0, parsed));
}

module.exports = {
  normalizeMusicSlot,
  normalizeMusicUrls,
  normalizeRadioSyncEnabled,
  parseMusicUrls,
  serializeMusicUrls,
  DEFAULT_RADIO_BREAK_SLOT,
  DEFAULT_RADIO_FOCUS_SLOT,
};
