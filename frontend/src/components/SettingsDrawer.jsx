import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./SettingsDrawer.css";

export function SettingsDrawer({ isOpen, onClose, onPauseMusic, onResumeMusic }) {
  const { user, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [calendarEmbed, setCalendarEmbed] = useState(user?.calendar_embed || "");
  const [saving, setSaving] = useState(false);
  const wasOpenRef = useRef(false);
  const calendarEmbedRef = useRef(null);

  useEffect(() => {
    setDisplayName(user?.display_name || "");
    setCalendarEmbed(user?.calendar_embed || "");
  }, [user]);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    if (isOpen && !wasOpen && onPauseMusic) onPauseMusic();
    if (!isOpen && wasOpen && onResumeMusic) onResumeMusic();
    wasOpenRef.current = isOpen;
  }, [isOpen, onPauseMusic, onResumeMusic]);

  useEffect(() => {
    const input = calendarEmbedRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.max(88, input.scrollHeight)}px`;
  }, [calendarEmbed, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(displayName, calendarEmbed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-drawer-backdrop">
      <div className="settings-drawer">
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
