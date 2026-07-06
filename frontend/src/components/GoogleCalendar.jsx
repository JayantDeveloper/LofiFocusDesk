function extractSrc(urlOrIframe) {
  if (!urlOrIframe) return null;
  const trimmed = urlOrIframe.trim();
  if (trimmed.startsWith("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }
  return trimmed;
}

const CONNECT_STEPS = [
  "Open Google Calendar on the web and click the gear, then Settings.",
  "Under \"Settings for my calendars\", pick the calendar to show here.",
  "Scroll to \"Integrate calendar\" and copy the embed code (or public URL).",
  "Paste it into Settings here and hit Save.",
];

export default function GoogleCalendar({ embedUrl, onOpenSettings }) {
  const src = extractSrc(embedUrl);

  if (!src) {
    return (
      <div className="calendar-connect">
        <h3>Connect your Google Calendar</h3>
        <p className="calendar-connect-sub">
          Your schedule shows up right here once you link it.
        </p>
        <ol>
          {CONNECT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {onOpenSettings ? (
          <button className="calendar-connect-button" onClick={onOpenSettings} type="button">
            Open Settings
          </button>
        ) : null}
        <p className="calendar-connect-hint">
          Tip: the calendar must be public (or "See only free/busy") for embeds to work.
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title="Google Calendar"
      style={{ border: 0, width: "100%", height: "clamp(400px, 70vh, 700px)" }}
      frameBorder="0"
      scrolling="no"
    />
  );
}
