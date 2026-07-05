export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function smooth01(value) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function getTwilightFactor(sunHeight) {
  const horizonBand = 0.9;
  const normalized = 1 - Math.abs(sunHeight) / horizonBand;
  return smooth01(normalized);
}

export function getDayBlend(worldHour, startHour, endHour) {
  const hour = ((worldHour % 24) + 24) % 24;
  if (hour <= startHour || hour >= endHour) return 0;
  const midpoint = (startHour + endHour) * 0.5;
  if (hour <= midpoint) {
    return smooth01((hour - startHour) / Math.max(0.001, midpoint - startHour));
  }
  return smooth01((endHour - hour) / Math.max(0.001, endHour - midpoint));
}

export function getMoonPhaseFactor(now = new Date()) {
  const synodicMonthDays = 29.530588;
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSinceKnownNewMoon = (now.getTime() - knownNewMoonUtc) / 86400000;
  const cycleDay =
    ((daysSinceKnownNewMoon % synodicMonthDays) + synodicMonthDays) %
    synodicMonthDays;
  const normalizedPhase = cycleDay / synodicMonthDays;
  const illumination = 0.5 - 0.5 * Math.cos(normalizedPhase * Math.PI * 2);
  return 0.35 + illumination * 0.65;
}
