function extractSrc(urlOrIframe) {
  if (!urlOrIframe) return null;
  const trimmed = urlOrIframe.trim();
  if (trimmed.startsWith("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }
  return trimmed;
}

export default function GoogleCalendar({ embedUrl }) {
  const parsed = extractSrc(embedUrl);
  const src = parsed && parsed.length > 0
    ? parsed
    : "https://calendar.google.com/calendar/embed?src=c_cf94d3rg0gddvea9j43t191a98%40group.calendar.google.com&ctz=America%2FNew_York";
  return (
    <iframe
      src={src}
      title="Google Calendar"
      style={{ border: 0, width: "100%", height: "600px" }}
      frameBorder="0"
      scrolling="no"
    />
  );
}
