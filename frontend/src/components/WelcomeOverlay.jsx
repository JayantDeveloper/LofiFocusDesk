import { useEffect, useState } from "react";
import "./WelcomeOverlay.css";

const WELCOME_OVERLAY_DURATION_MS = 2500;
const EXIT_ANIMATION_MS = 700;
const PROGRESS_DURATION_MS = WELCOME_OVERLAY_DURATION_MS - 600;

export function WelcomeOverlay({ canDismiss = false, onComplete }) {
  const [phase, setPhase] = useState("visible");
  const [fullDurationReached, setFullDurationReached] = useState(false);
  const isReadyToDismiss = canDismiss && fullDurationReached;

  useEffect(() => {
    const durationId = window.setTimeout(() => {
      setFullDurationReached(true);
    }, WELCOME_OVERLAY_DURATION_MS);
    return () => {
      window.clearTimeout(durationId);
    };
  }, []);

  useEffect(() => {
    if (!isReadyToDismiss || phase !== "visible") return;
    setPhase("exiting");
  }, [isReadyToDismiss, phase]);

  useEffect(() => {
    if (phase !== "exiting") return undefined;
    const goneId = window.setTimeout(() => setPhase("gone"), EXIT_ANIMATION_MS);
    return () => {
      window.clearTimeout(goneId);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "gone" || typeof onComplete !== "function") return;
    onComplete();
  }, [onComplete, phase]);

  if (phase === "gone") return null;

  return (
    <div
      aria-live="polite"
      className={`wo-root${phase === "exiting" ? " wo-exit" : ""}`}
      role="status"
      style={{ "--wo-progress-duration": `${PROGRESS_DURATION_MS}ms` }}
    >
      <div className="wo-grain" />
      <div className="wo-leak" />

      <div className="wo-corner wo-corner--tl" />
      <div className="wo-corner wo-corner--tr" />
      <div className="wo-corner wo-corner--bl" />
      <div className="wo-corner wo-corner--br" />

      <div className="wo-content">
        <p className="wo-eyebrow">Focus &mdash; Flow &mdash; Achieve</p>
        <p className="wo-prefix">Lofi</p>
        <h1 className="wo-title">
          Focus<em>Desk</em>
        </h1>
        <p className="wo-subtitle">
          {isReadyToDismiss ? "Opening..." : "Preparing your desk..."}
        </p>
      </div>

      <div className="wo-progress-track">
        <div className="wo-progress-bar" />
      </div>
    </div>
  );
}
