import "./SettingsButton.css";

export function SettingsButton({ onClick }) {
  return (
    <button className="settings-gear" onClick={onClick} title="Settings">
      <span role="img" aria-label="settings">⚙️</span>
    </button>
  );
}
