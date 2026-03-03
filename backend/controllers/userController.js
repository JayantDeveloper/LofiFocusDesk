const {
  DEFAULT_RADIO_BREAK_SLOT,
  DEFAULT_RADIO_FOCUS_SLOT,
} = require("../constants/musicConstants");
const {
  normalizeMusicSlot,
  normalizeRadioSyncEnabled,
  parseMusicUrls,
  serializeMusicUrls,
} = require("../utils/musicPreferenceUtils");
const {
  findUserById,
  updateUserProfile,
} = require("../utils/repositories/userRepository");
const { userJson } = require("../utils/userResponseUtils");

function getUserProfile(req, res) {
  const user = findUserById(req.userId);

  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ user: userJson(user) });
}

function updateUserProfileHandler(req, res) {
  const user = findUserById(req.userId);

  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const body = req.body || {};

  const displayName = (body.display_name || "").trim();
  const calendarEmbed = body.calendar_embed || "";

  const hasMusicUrls = Object.prototype.hasOwnProperty.call(body, "music_urls");
  const hasRadioSyncEnabled = Object.prototype.hasOwnProperty.call(body, "radio_sync_enabled");
  const hasRadioFocusSlot = Object.prototype.hasOwnProperty.call(body, "radio_focus_slot");
  const hasRadioBreakSlot = Object.prototype.hasOwnProperty.call(body, "radio_break_slot");

  const musicUrls = hasMusicUrls ? parseMusicUrls(body.music_urls) : parseMusicUrls(user.music_urls);
  const radioSyncEnabled = hasRadioSyncEnabled
    ? normalizeRadioSyncEnabled(body.radio_sync_enabled)
    : normalizeRadioSyncEnabled(user.radio_sync_enabled);
  const radioFocusSlot = hasRadioFocusSlot
    ? normalizeMusicSlot(body.radio_focus_slot, DEFAULT_RADIO_FOCUS_SLOT)
    : normalizeMusicSlot(user.radio_focus_slot, DEFAULT_RADIO_FOCUS_SLOT);
  const radioBreakSlot = hasRadioBreakSlot
    ? normalizeMusicSlot(body.radio_break_slot, DEFAULT_RADIO_BREAK_SLOT)
    : normalizeMusicSlot(user.radio_break_slot, DEFAULT_RADIO_BREAK_SLOT);

  const updatedUser = updateUserProfile(req.userId, {
    displayName,
    calendarEmbed,
    musicUrls: serializeMusicUrls(musicUrls),
    radioSyncEnabled: radioSyncEnabled ? 1 : 0,
    radioFocusSlot,
    radioBreakSlot,
  });

  res.json({ user: userJson(updatedUser) });
}

module.exports = {
  getUserProfile,
  updateUserProfileHandler,
};
