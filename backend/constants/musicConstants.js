const MAX_MUSIC_SLOTS = 5;
const DEFAULT_MUSIC_URLS = Object.freeze([
  "https://www.youtube.com/watch?v=6Wurxv2x9cA",
  "",
  "",
  "",
  "",
]);
const DEFAULT_RADIO_SYNC_ENABLED = false;
const DEFAULT_RADIO_FOCUS_SLOT = 0;
const DEFAULT_RADIO_BREAK_SLOT = Math.min(1, MAX_MUSIC_SLOTS - 1);

module.exports = {
  DEFAULT_MUSIC_URLS,
  DEFAULT_RADIO_BREAK_SLOT,
  DEFAULT_RADIO_FOCUS_SLOT,
  DEFAULT_RADIO_SYNC_ENABLED,
  MAX_MUSIC_SLOTS,
};
