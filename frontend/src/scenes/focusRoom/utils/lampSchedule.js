function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothStep(edge0, edge1, value) {
  const width = Math.max(0.0001, edge1 - edge0);
  const t = clamp01((value - edge0) / width);
  return t * t * (3 - 2 * t);
}

function normalizeHour(hour) {
  return ((hour % 24) + 24) % 24;
}

export function getLampTargetStrength(worldHour) {
  const hour = normalizeHour(worldHour);
  const sunsetFadeIn = smoothStep(17, 19.5, hour);
  const sunriseFadeOut = 1 - smoothStep(5, 7.5, hour);
  return Math.max(sunsetFadeIn, sunriseFadeOut);
}
