export function FocusRoomPopup({ children, contentClassName = "", isOpen, onClose }) {
  const backdropClassName = `focus-board-popup-backdrop ${isOpen ? "is-open" : "is-closed"}`;
  const panelContentClassName = ["focus-board-popup-content", contentClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div aria-hidden={!isOpen} className={backdropClassName} onClick={onClose}>
      <div className="focus-board-popup-panel" onClick={(event) => event.stopPropagation()}>
        <button className="focus-board-popup-close" onClick={onClose} type="button">
          Close
        </button>
        <div className={panelContentClassName}>{children}</div>
      </div>
    </div>
  );
}
