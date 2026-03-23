import "./CurrentlyPlaying.css";

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
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
  return (
    <div className="player-pill">
      <span className={`player-dot${playing ? " playing" : ""}`} />
      <span className="player-track">
        <span className="player-title">{title}</span>
        <span className="player-divider">·</span>
        <span className="player-artist">{artist}</span>
      </span>
      <button className="player-btn" onClick={onTogglePlay} type="button" aria-label={playing ? "Pause" : "Play"}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
    </div>
  );
}
