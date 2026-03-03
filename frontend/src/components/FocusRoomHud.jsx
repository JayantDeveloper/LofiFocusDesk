import { useEffect, useRef, useState } from "react";

const HUD_BINDS = [
  "T - Todo List / Plant",
  "C - Calendar / Wall Calendar",
  "S - Stats Card / Score Tiles",
  "R - Music / Radio",
  "1-5 - Select Radio Song",
];

export function FocusRoomHud() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hudRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!hudRef.current) return;
      if (hudRef.current.contains(event.target)) return;
      setIsCollapsed(true);
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);

  return (
    <div
      ref={hudRef}
      className={`focus-room-hud${isCollapsed ? " is-collapsed" : ""}`}
      aria-live="polite"
    >
      <button
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Show binds menu" : "Hide binds menu"}
        className="focus-room-hud-tab"
        onClick={() => setIsCollapsed((prev) => !prev)}
        type="button"
      >
        <span className="focus-room-hud-tab-label">BINDS</span>
      </button>
      <div className="focus-room-hud-content">
        <p className="focus-room-title">Binds</p>
        {HUD_BINDS.map((bind) => (
          <p key={bind} className="focus-room-hint">
            {bind}
          </p>
        ))}
      </div>
    </div>
  );
}
