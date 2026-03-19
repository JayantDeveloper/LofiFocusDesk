import "./CurrentlyPlaying.css";

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
  return (
    <div className="player-card">
      <div className="label-row">
        <span className="label-text">Currently Playing</span>
      </div>
      <div className="track-meta">
        <div className="track-title">{title}</div>
        <div className="track-artist">{artist}</div>
      </div>
      <div className="track-controls">
        <button className="play-btn" onClick={onTogglePlay} type="button">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
}
