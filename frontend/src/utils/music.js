import { DEFAULT_MUSIC_URL, MAX_MUSIC_SLOTS } from "../constants/musicConstants";

const YOUTUBE_METADATA_CACHE = new Map();

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

export function buildYouTubeEmbedUrl(value) {
  const videoId = extractYouTubeVideoId(value);
  if (!videoId) return null;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=0&loop=1&playlist=${videoId}&rel=0&modestbranding=1&enablejsapi=1${origin}`;
}

export async function fetchYouTubeVideoMetadata(videoId, { signal } = {}) {
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;
  const cached = YOUTUBE_METADATA_CACHE.get(videoId);
  if (cached) return cached;

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoints = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { signal });
      if (!response.ok) continue;
      const payload = await response.json();
      const title = typeof payload?.title === "string" ? payload.title.trim() : "";
      const channelName = typeof payload?.author_name === "string" ? payload.author_name.trim() : "";
      if (!title || !channelName) continue;
      const metadata = { title, channelName };
      YOUTUBE_METADATA_CACHE.set(videoId, metadata);
      return metadata;
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }

  return null;
}
