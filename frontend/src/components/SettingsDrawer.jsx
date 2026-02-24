import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { MAX_MUSIC_SLOTS, normalizeMusicUrls } from "../utils/music";
import "./SettingsDrawer.css";

export function SettingsDrawer({ isOpen, onClose, onPauseMusic, onResumeMusic }) {
  const { user, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [calendarEmbed, setCalendarEmbed] = useState(user?.calendar_embed || "");
  const [musicUrls, setMusicUrls] = useState(() => normalizeMusicUrls(user?.music_urls));
  const [saving, setSaving] = useState(false);
  const [saveBannerState, setSaveBannerState] = useState("hidden");
  const wasOpenRef = useRef(false);
  const calendarEmbedRef = useRef(null);
  const saveBannerExitTimerRef = useRef(null);
  const saveBannerHideTimerRef = useRef(null);

  useEffect(() => {
    setDisplayName(user?.display_name || "");
    setCalendarEmbed(user?.calendar_embed || "");
    setMusicUrls(normalizeMusicUrls(user?.music_urls));
  }, [user]);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    if (isOpen && !wasOpen && onPauseMusic) onPauseMusic();
    if (!isOpen && wasOpen && onResumeMusic) onResumeMusic();
    wasOpenRef.current = isOpen;
  }, [isOpen, onPauseMusic, onResumeMusic]);

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
      await updateProfile(displayName, calendarEmbed, musicUrls);
      showSaveBanner();
    } catch (error) {
      console.error(error);
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
            <span>Calendar embed URL</span>
            <textarea
              ref={calendarEmbedRef}
              value={calendarEmbed}
              onChange={(e) => setCalendarEmbed(e.target.value)}
              rows={3}
            />
          </label>
          <div className="music-url-group">
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
