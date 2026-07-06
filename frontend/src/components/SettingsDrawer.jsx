import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_MUSIC_SLOTS } from "../constants/musicConstants";
import { useAuth } from "../store/AuthStore";
import { normalizeMusicUrls } from "../utils/music";
import "./SettingsDrawer.css";

const DEFAULT_FOCUS_SLOT_INDEX = 0;
const DEFAULT_BREAK_SLOT_INDEX = Math.min(1, MAX_MUSIC_SLOTS - 1);

function clampSlotIndex(value, fallbackIndex = DEFAULT_FOCUS_SLOT_INDEX) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallbackIndex;
  return Math.max(0, Math.min(MAX_MUSIC_SLOTS - 1, parsed));
}

export function SettingsDrawer({ isOpen, onClose }) {
  const { user, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [calendarEmbed, setCalendarEmbed] = useState(user?.calendar_embed || "");
  const [musicUrls, setMusicUrls] = useState(() => normalizeMusicUrls(user?.music_urls));
  const [radioSyncEnabled, setRadioSyncEnabled] = useState(Boolean(user?.radio_sync_enabled));
  const [focusModeSlot, setFocusModeSlot] = useState(() =>
    clampSlotIndex(user?.radio_focus_slot, DEFAULT_FOCUS_SLOT_INDEX),
  );
  const [breakModeSlot, setBreakModeSlot] = useState(() =>
    clampSlotIndex(user?.radio_break_slot, DEFAULT_BREAK_SLOT_INDEX),
  );
  const [saving, setSaving] = useState(false);
  const [saveBannerState, setSaveBannerState] = useState("hidden");
  const calendarEmbedRef = useRef(null);
  const saveBannerExitTimerRef = useRef(null);
  const saveBannerHideTimerRef = useRef(null);

  useEffect(() => {
    setDisplayName(user?.display_name || "");
    setCalendarEmbed(user?.calendar_embed || "");
    setMusicUrls(normalizeMusicUrls(user?.music_urls));
    setRadioSyncEnabled(Boolean(user?.radio_sync_enabled));
    setFocusModeSlot(clampSlotIndex(user?.radio_focus_slot, DEFAULT_FOCUS_SLOT_INDEX));
    setBreakModeSlot(clampSlotIndex(user?.radio_break_slot, DEFAULT_BREAK_SLOT_INDEX));
  }, [user]);

  const clearSaveBannerTimers = useCallback(() => {
    if (saveBannerExitTimerRef.current) {
      clearTimeout(saveBannerExitTimerRef.current);
      saveBannerExitTimerRef.current = null;
    }
    if (saveBannerHideTimerRef.current) {
      clearTimeout(saveBannerHideTimerRef.current);
      saveBannerHideTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearSaveBannerTimers, [clearSaveBannerTimers]);

  useEffect(() => {
    if (isOpen) return;
    clearSaveBannerTimers();
    setSaveBannerState("hidden");
  }, [clearSaveBannerTimers, isOpen]);

  useEffect(() => {
    const input = calendarEmbedRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.max(88, input.scrollHeight)}px`;
  }, [calendarEmbed, isOpen]);

  if (!isOpen) return null;

  const trimmedCalendarEmbed = calendarEmbed.trim();
  const calendarSrc = trimmedCalendarEmbed.startsWith("<iframe")
    ? (trimmedCalendarEmbed.match(/src=["']([^"']+)["']/i)?.[1] ?? "")
    : trimmedCalendarEmbed;
  const calendarLooksWrong =
    trimmedCalendarEmbed.length > 0 &&
    !calendarSrc.includes("calendar.google.com/calendar/embed");

  const showSaveBanner = () => {
    clearSaveBannerTimers();
    setSaveBannerState("visible");
    saveBannerExitTimerRef.current = setTimeout(() => {
      setSaveBannerState("exiting");
    }, 1700);
    saveBannerHideTimerRef.current = setTimeout(() => {
      setSaveBannerState("hidden");
    }, 2100);
  };

  const handleMusicUrlChange = (index, value) => {
    setMusicUrls((prev) => {
      const next = normalizeMusicUrls(prev);
      next[index] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(
        displayName,
        calendarEmbed,
        musicUrls,
        radioSyncEnabled,
        focusModeSlot,
        breakModeSlot,
      );
      showSaveBanner();
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-drawer-backdrop">
      <div className="settings-drawer">
        <div
          className={`settings-save-banner ${
            saveBannerState === "hidden" ? "" : "is-visible"
          } ${saveBannerState === "exiting" ? "is-exiting" : ""}`}
          role="status"
          aria-live="polite"
        >
          <span className="settings-save-check" aria-hidden="true">✓</span>
          <span>Settings Saved!</span>
        </div>
        <div className="settings-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h3>Welcome back, {displayName || user?.username || "friend"}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="settings-body">
          <label>
            <span>Name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label>
            <span>Google Calendar embed</span>
            <textarea
              ref={calendarEmbedRef}
              value={calendarEmbed}
              onChange={(e) => setCalendarEmbed(e.target.value)}
              rows={3}
              placeholder='Paste the embed code (or URL) from Google Calendar — e.g. <iframe src="https://calendar.google.com/calendar/embed?src=...">'
            />
            {calendarLooksWrong ? (
              <p className="settings-field-warning">
                That doesn&apos;t look like a Google Calendar embed link — expected a
                calendar.google.com/calendar/embed URL or its &lt;iframe&gt; code.
              </p>
            ) : null}
            <p className="settings-field-hint">
              Google Calendar &rarr; gear &rarr; Settings &rarr; pick your calendar &rarr;
              &quot;Integrate calendar&quot; &rarr; copy the embed code. The calendar must be
              public for the embed to display.
            </p>
          </label>
          <div className="music-url-group">
            <div className="radio-sync-group">
              <label className="radio-sync-toggle">
                <input
                  type="checkbox"
                  checked={radioSyncEnabled}
                  onChange={(event) => setRadioSyncEnabled(event.target.checked)}
                />
                <span>Sync radio with Pomodoro timer</span>
              </label>
              <p className="radio-sync-hint">
                Auto-switch songs by timer mode when Pomodoro is running.
              </p>
              {radioSyncEnabled ? (
                <div className="radio-sync-slot-grid">
                  <label>
                    <span>Focus mode song slot</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_MUSIC_SLOTS}
                      step={1}
                      value={focusModeSlot + 1}
                      onChange={(event) => setFocusModeSlot(
                        clampSlotIndex(Number(event.target.value) - 1, DEFAULT_FOCUS_SLOT_INDEX),
                      )}
                    />
                  </label>
                  <label>
                    <span>Break mode song slot</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_MUSIC_SLOTS}
                      step={1}
                      value={breakModeSlot + 1}
                      onChange={(event) => setBreakModeSlot(
                        clampSlotIndex(Number(event.target.value) - 1, DEFAULT_BREAK_SLOT_INDEX),
                      )}
                    />
                  </label>
                </div>
              ) : null}
            </div>
            <span className="music-url-title">Radio song URLs (keys 1-5)</span>
            <div className="music-url-grid">
              {Array.from({ length: MAX_MUSIC_SLOTS }, (_, index) => (
                <label key={index} className="music-url-slot">
                  <span>Song {index + 1}</span>
                  <input
                    type="url"
                    value={musicUrls[index] || ""}
                    onChange={(event) => handleMusicUrlChange(index, event.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="settings-actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="logout-btn" onClick={logout}>Log out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
