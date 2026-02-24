const HUD_BINDS = [
  "T - Todo List / Plant",
  "C - Calendar / Wall Calendar",
  "S - Stats Card / Score Tiles",
  "R - Music / Radio",
  "1-5 - Select Radio Song",
];

export function FocusRoomHud() {
  return (
    <div className="focus-room-hud" aria-live="polite">
      <p className="focus-room-title">Binds</p>
      {HUD_BINDS.map((bind) => (
        <p key={bind} className="focus-room-hint">
          {bind}
        </p>
      ))}
    </div>
  );
}
