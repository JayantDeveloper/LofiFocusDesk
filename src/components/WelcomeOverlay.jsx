import { useEffect, useState } from "react";

const WELCOME_OVERLAY_DURATION_MS = 9000;

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, WELCOME_OVERLAY_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="welcome-overlay" aria-live="polite">
      <h1 className="welcome-overlay-title">Welcome to FocusDesk, Where Productivity is Enhanced.</h1>
      <p className="welcome-overlay-subtitle">Click and Swipe to get Started</p>
    </div>
  );
}
