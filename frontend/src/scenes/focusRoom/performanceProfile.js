const FOCUS_ROOM_QUALITY_PROFILES = Object.freeze({
  low: Object.freeze({
    antialias: false,
    cameraFar: 18,
    cssFps: 12,
    dpr: 1,
    enableClouds: false,
    enableLampPointLight: false,
    enableShadows: false,
    enableSkyBodies: false,
    enableStars: false,
    hiddenFps: 4,
    idleFps: 20,
    interactionFps: 40,
    shadowMapSize: 512,
    sunRayCount: 6,
  }),
  balanced: Object.freeze({
    antialias: true,
    cameraFar: 18,
    cssFps: 18,
    dpr: 1.15,
    enableClouds: true,
    enableLampPointLight: true,
    enableShadows: true,
    enableSkyBodies: true,
    enableStars: true,
    hiddenFps: 4,
    idleFps: 30,
    interactionFps: 60,
    shadowMapSize: 1024,
    sunRayCount: 10,
  }),
  high: Object.freeze({
    antialias: true,
    cameraFar: 20,
    cssFps: 28,
    dpr: 1.3,
    enableClouds: true,
    enableLampPointLight: true,
    enableShadows: true,
    enableSkyBodies: true,
    enableStars: true,
    hiddenFps: 4,
    idleFps: 45,
    interactionFps: 60,
    shadowMapSize: 2048,
    sunRayCount: 16,
  }),
});

export function getFocusRoomQualityProfile(qualityKey) {
  return FOCUS_ROOM_QUALITY_PROFILES[qualityKey] ?? FOCUS_ROOM_QUALITY_PROFILES.balanced;
}

export function detectFocusRoomQualityKey() {
  if (typeof window === "undefined") {
    return "balanced";
  }

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const viewportSmall = Math.min(window.innerWidth, window.innerHeight) < 820;
  const deviceMemory = Number(navigator.deviceMemory);
  const hardwareConcurrency = Number(navigator.hardwareConcurrency);
  const devicePixelRatio = Number(window.devicePixelRatio) || 1;

  if (prefersReducedMotion) {
    return "low";
  }

  if (
    (coarsePointer && viewportSmall) ||
    (Number.isFinite(deviceMemory) && deviceMemory > 0 && deviceMemory <= 4) ||
    (Number.isFinite(hardwareConcurrency) &&
      hardwareConcurrency > 0 &&
      hardwareConcurrency <= 4)
  ) {
    return "low";
  }

  if (
    viewportSmall ||
    devicePixelRatio >= 2.25 ||
    (Number.isFinite(deviceMemory) && deviceMemory > 0 && deviceMemory <= 8) ||
    (Number.isFinite(hardwareConcurrency) &&
      hardwareConcurrency > 0 &&
      hardwareConcurrency <= 8)
  ) {
    return "balanced";
  }

  return "high";
}
