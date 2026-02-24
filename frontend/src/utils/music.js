export const MAX_MUSIC_SLOTS = 5;
export const DEFAULT_MUSIC_URL = "https://www.youtube.com/watch?v=6Wurxv2x9cA";
export const DEFAULT_MUSIC_URLS = Object.freeze([DEFAULT_MUSIC_URL, "", "", "", ""]);

function normalizeSlotValue(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeMusicUrls(input) {
  const source = Array.isArray(input) ? input : [];
  const normalized = Array.from({ length: MAX_MUSIC_SLOTS }, (_, index) =>
    normalizeSlotValue(source[index]),
  );
  if (!normalized[0]) {
    normalized[0] = DEFAULT_MUSIC_URL;
  }
  return normalized;
}

export function extractYouTubeVideoId(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(raw);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
  let candidate = null;

  if (host === "youtu.be") {
    candidate = parsedUrl.pathname.split("/").filter(Boolean)[0] || null;
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (parsedUrl.pathname === "/watch") {
      candidate = parsedUrl.searchParams.get("v");
    } else if (parsedUrl.pathname.startsWith("/embed/")) {
      candidate = parsedUrl.pathname.split("/")[2] || null;
    } else if (parsedUrl.pathname.startsWith("/shorts/")) {
      candidate = parsedUrl.pathname.split("/")[2] || null;
    } else if (parsedUrl.pathname.startsWith("/live/")) {
      candidate = parsedUrl.pathname.split("/")[2] || null;
    }
  }

  return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

export function hasPlayableMusicUrl(value) {
  return Boolean(extractYouTubeVideoId(value));
}

export function buildYouTubeEmbedUrl(value) {
  const videoId = extractYouTubeVideoId(value);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}&rel=0&modestbranding=1`;
}
