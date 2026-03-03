const { DEFAULT_RADIO_BREAK_SLOT, DEFAULT_RADIO_FOCUS_SLOT } = require("../constants/musicConstants");
const {
  normalizeMusicSlot,
  normalizeRadioSyncEnabled,
  parseMusicUrls,
} = require("./musicPreferenceUtils");

function userJson(row) {
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name || "",
    calendar_embed: row.calendar_embed || "",
    music_urls: parseMusicUrls(row.music_urls),
    radio_sync_enabled: normalizeRadioSyncEnabled(row.radio_sync_enabled),
    radio_focus_slot: normalizeMusicSlot(row.radio_focus_slot, DEFAULT_RADIO_FOCUS_SLOT),
    radio_break_slot: normalizeMusicSlot(row.radio_break_slot, DEFAULT_RADIO_BREAK_SLOT),
  };
}

module.exports = {
  userJson,
};
