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

async function getUserProfile(req, res) {
  try {
    const user = await findUserById(req.userId);

    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ user: userJson(user) });
  } catch (error) {
    console.error("[user] getProfile error", error);
    res.status(500).json({ error: "Unable to load account profile" });
  }
}

async function updateUserProfileHandler(req, res) {
  try {
    const body = req.body || {};

    const displayName = Object.prototype.hasOwnProperty.call(body, "display_name")
      ? String(body.display_name || "").trim()
      : null;
    const calendarEmbed = Object.prototype.hasOwnProperty.call(body, "calendar_embed")
      ? body.calendar_embed || ""
      : null;

    const hasMusicUrls = Object.prototype.hasOwnProperty.call(body, "music_urls");
    const hasRadioSyncEnabled = Object.prototype.hasOwnProperty.call(body, "radio_sync_enabled");
    const hasRadioFocusSlot = Object.prototype.hasOwnProperty.call(body, "radio_focus_slot");
    const hasRadioBreakSlot = Object.prototype.hasOwnProperty.call(body, "radio_break_slot");

    const musicUrls = hasMusicUrls ? parseMusicUrls(body.music_urls) : null;
    const radioSyncEnabled = hasRadioSyncEnabled
      ? normalizeRadioSyncEnabled(body.radio_sync_enabled)
      : null;
    const radioFocusSlot = hasRadioFocusSlot
      ? normalizeMusicSlot(body.radio_focus_slot, DEFAULT_RADIO_FOCUS_SLOT)
      : null;
    const radioBreakSlot = hasRadioBreakSlot
      ? normalizeMusicSlot(body.radio_break_slot, DEFAULT_RADIO_BREAK_SLOT)
      : null;

    const updatedUser = await updateUserProfile(req.userId, {
      displayName,
      calendarEmbed,
      musicUrls: musicUrls ? serializeMusicUrls(musicUrls) : null,
      radioSyncEnabled: radioSyncEnabled === null ? null : (radioSyncEnabled ? 1 : 0),
      radioFocusSlot,
      radioBreakSlot,
    });

    if (!updatedUser) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ user: userJson(updatedUser) });
  } catch (error) {
    console.error("[user] updateProfile error", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfileHandler,
};
