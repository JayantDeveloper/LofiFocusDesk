import { useEffect, useRef, useState } from "react";
import "./CurrentlyPlaying.css";

const bars = [3, 6, 8, 5, 9, 6, 4, 8, 6, 5, 7, 4];

function PlayIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export default function CurrentlyPlaying({
  title = "Golden Hour",
  artist = "JVKE",
  playing = true,
  onTogglePlay = undefined,
}) {
  const [hue, setHue] = useState(0);
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    const animate = (ts) => {
      if (lastRef.current === null) lastRef.current = ts;
      const delta = ts - lastRef.current;
      lastRef.current = ts;
      setHue(h => (h + (delta / 10000) * 360) % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [playing]);

  const color = "hsl(" + hue.toFixed(1) + ",90%,62%)";
  const colorFade = "hsl(" + hue.toFixed(1) + ",90%,62%,0.25)";
  const colorMid = "hsl(" + hue.toFixed(1) + ",90%,62%,0.72)";
  const glow1 = "hsl(" + hue.toFixed(1) + ",90%,62%,0.32)";
  const glow2 = "hsl(" + hue.toFixed(1) + ",90%,62%,0.6)";

  return (
    <div className="player-card">
      <div className="label-row">
        <span className="label-text">Currently Playing</span>
      </div>
      <div className="track-title">{title}</div>
      <div className="track-artist">{artist}</div>
      <div className="waveform">
        {bars.map((h, i) => (
          <div
            key={i}
            className={"bar" + (playing ? "" : " paused")}
            style={{
              minHeight: Math.max(5, h * 1.6) + "px",
              height: h * 4.6 + "px",
              background: "linear-gradient(to top, " + colorFade + " 0%, " + colorMid + " 40%, " + color + " 100%)",
              boxShadow: "0 0 6px 1px " + glow1 + ", 0 0 2px " + glow2,
              animationDuration: (0.34 + (h / 10) * 0.56).toFixed(2) + "s",
              animationDelay: "-" + (i * 0.068).toFixed(3) + "s",
            }}
          />
        ))}
      </div>
      <div className="bottom-row">
        <button className="play-btn" onClick={onTogglePlay} type="button">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
}
