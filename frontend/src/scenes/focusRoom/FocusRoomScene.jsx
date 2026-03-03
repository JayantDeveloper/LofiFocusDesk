import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Color, Raycaster, Vector2 } from "three";
import { DeskSetup } from "./components/DeskSetup";
import { RoomShell } from "./components/RoomShell";
import { SceneCss3DRenderer } from "./components/Css3DLayer";
import { SeatedCameraControls } from "./components/SeatedCameraControls";
import { WallDecor } from "./components/WallDecor";
import { useFocusTextures } from "../../hooks/useFocusTextures";

const DAY_CYCLE_MINUTES = Number(import.meta.env.VITE_DAY_CYCLE_MINUTES);
const SIMULATED_DAY_CYCLE_SECONDS = Number.isFinite(DAY_CYCLE_MINUTES) && DAY_CYCLE_MINUTES > 0
  ? DAY_CYCLE_MINUTES * 60
  : 0;

function getCurrentLocalHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

function normalizeHour(hour) {
  return ((hour % 24) + 24) % 24;
}

function getWorldHour(elapsedSeconds, initialWorldHour) {
  if (SIMULATED_DAY_CYCLE_SECONDS > 0) {
    const simulatedHours = (elapsedSeconds / SIMULATED_DAY_CYCLE_SECONDS) * 24;
    return normalizeHour(initialWorldHour + simulatedHours);
  }
  return normalizeHour(initialWorldHour + elapsedSeconds / 3600);
}

function toClockDisplay(worldHour) {
  const hour24 = normalizeHour(Math.floor(worldHour));
  const hour12 = hour24 % 12 || 12;
  const minute = Math.floor((worldHour - Math.floor(worldHour)) * 60);
  return {
    ampm: hour24 >= 12 ? "PM" : "AM",
    hour24,
    minute,
    time: `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smooth01(value) {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function getTwilightFactor(sunHeight) {
  const horizonBand = 0.9;
  const normalized = 1 - Math.abs(sunHeight) / horizonBand;
  return smooth01(normalized);
}

function getDayBlend(worldHour, startHour, endHour) {
  const hour = ((worldHour % 24) + 24) % 24;
  if (hour <= startHour || hour >= endHour) return 0;
  const midpoint = (startHour + endHour) * 0.5;
  if (hour <= midpoint) {
    return smooth01((hour - startHour) / Math.max(0.001, midpoint - startHour));
  }
  return smooth01((endHour - hour) / Math.max(0.001, endHour - midpoint));
}

function getMoonPhaseFactor(now = new Date()) {
  const synodicMonthDays = 29.530588;
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSinceKnownNewMoon = (now.getTime() - knownNewMoonUtc) / 86400000;
  const cycleDay = ((daysSinceKnownNewMoon % synodicMonthDays) + synodicMonthDays) % synodicMonthDays;
  const normalizedPhase = cycleDay / synodicMonthDays;
  const illumination = 0.5 - 0.5 * Math.cos(normalizedPhase * Math.PI * 2);
  return 0.35 + illumination * 0.65;
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const editableTags = ["INPUT", "TEXTAREA", "SELECT"];
  if (editableTags.includes(target.tagName)) return true;
  return target.isContentEditable;
}

function getMusicSlotFromKeyboardEvent(event) {
  const key = typeof event.key === "string" ? event.key : "";
  const code = typeof event.code === "string" ? event.code : "";

  if (key >= "1" && key <= "5") {
    return Number(key) - 1;
  }

  if (code.startsWith("Digit")) {
    const value = Number(code.slice(5));
    if (Number.isInteger(value) && value >= 1 && value <= 5) {
      return value - 1;
    }
  }

  if (code.startsWith("Numpad")) {
    const value = Number(code.slice(6));
    if (Number.isInteger(value) && value >= 1 && value <= 5) {
      return value - 1;
    }
  }

  return null;
}

function RoomInteractionHotkeys({
  onOpenStatsPopup,
  onOpenCalendarPopup,
  onToggleBoardPopup,
  onToggleCalendarPopup,
  onToggleStatsPopup,
  onToggleMusic,
  onSelectMusicSlot,
  keybindsEnabled = true,
  pointerEnabled = true,
}) {
  const { camera, gl, scene } = useThree();
  const pointer = useMemo(() => new Vector2(), []);
  const raycaster = useMemo(() => new Raycaster(), []);

  useEffect(() => {
    if (!pointerEnabled) return undefined;
    if (
      !onToggleBoardPopup &&
      !onToggleCalendarPopup &&
      !onToggleStatsPopup &&
      !onToggleMusic &&
      !onOpenCalendarPopup &&
      !onOpenStatsPopup
    ) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest(".focus-board-popup-backdrop")) return;

      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.set(x, y);
      raycaster.setFromCamera(pointer, camera);

      const plantHitbox = scene.getObjectByName("desk-plant-hitbox");
      if (plantHitbox && onToggleBoardPopup) {
        if (raycaster.intersectObject(plantHitbox, true).length > 0) {
          onToggleBoardPopup();
          return;
        }
      }

      const radioHitbox = scene.getObjectByName("desk-radio-hitbox");
      if (radioHitbox && onToggleMusic) {
        if (raycaster.intersectObject(radioHitbox, true).length > 0) {
          onToggleMusic();
          return;
        }
      }

      const statsFocusHitbox = scene.getObjectByName("wall-stats-focus-hitbox");
      if (statsFocusHitbox && onOpenStatsPopup) {
        if (raycaster.intersectObject(statsFocusHitbox, true).length > 0) {
          onOpenStatsPopup();
          return;
        }
      }

      const statsTaskHitbox = scene.getObjectByName("wall-stats-task-hitbox");
      if (statsTaskHitbox && onOpenStatsPopup) {
        if (raycaster.intersectObject(statsTaskHitbox, true).length > 0) {
          onOpenStatsPopup();
          return;
        }
      }

      const calendarHitbox = scene.getObjectByName("wall-calendar-hitbox");
      if (calendarHitbox && onOpenCalendarPopup) {
        if (raycaster.intersectObject(calendarHitbox, true).length > 0) {
          onOpenCalendarPopup();
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [
    camera,
    gl.domElement,
    pointerEnabled,
    onOpenCalendarPopup,
    onOpenStatsPopup,
    onToggleBoardPopup,
    onToggleMusic,
    pointer,
    raycaster,
    scene,
  ]);

  useEffect(() => {
    if (!keybindsEnabled) return undefined;
    if (
      !onToggleBoardPopup &&
      !onToggleCalendarPopup &&
      !onToggleStatsPopup &&
      !onToggleMusic &&
      !onSelectMusicSlot
    ) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat) return;
      if (isEditableTarget(event.target)) return;
      const slot = getMusicSlotFromKeyboardEvent(event);
      if (slot !== null && onSelectMusicSlot) {
        event.preventDefault();
        onSelectMusicSlot(slot);
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "r" && onToggleMusic) { event.preventDefault(); onToggleMusic(); return; }
      if (key === "t" && onToggleBoardPopup) { event.preventDefault(); onToggleBoardPopup(); return; }
      if (key === "s" && onToggleStatsPopup) { event.preventDefault(); onToggleStatsPopup(); return; }
      if (key === "c" && onToggleCalendarPopup) { event.preventDefault(); onToggleCalendarPopup(); }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    keybindsEnabled,
    onToggleBoardPopup,
    onToggleCalendarPopup,
    onToggleStatsPopup,
    onToggleMusic,
    onSelectMusicSlot,
  ]);

  return null;
}

export function FocusRoomScene({
  boardPomodoro,
  boardTodo,
  focusScore,
  hotkeysEnabled = true,
  isCameraLocked,
  isMusicPlaying,
  isInteractable = true,
  onOpenCalendarPopup,
  onOpenBoardPopup,
  onOpenStatsPopup,
  onToggleBoardPopup,
  onToggleCalendarPopup,
  onToggleStatsPopup,
  onWorldClockDisplayChange,
  taskScore,
  onToggleMusic,
  onSelectMusicSlot,
}) {
  const { scene } = useThree();
  const textures = useFocusTextures();
  const initialWorldHour = useMemo(() => getCurrentLocalHour(), []);
  const worldHourRef = useRef(initialWorldHour);
  const lastDisplayedHourRef = useRef(Math.floor(initialWorldHour) % 24);
  const lastDisplayedMinuteRef = useRef(Math.floor((initialWorldHour - Math.floor(initialWorldHour)) * 60));
  const [clockDisplay, setClockDisplay] = useState(() => toClockDisplay(initialWorldHour));
  const moonPhaseFactor = useMemo(() => getMoonPhaseFactor(), []);

  const ambientLightRef = useRef(null);
  const hemisphereLightRef = useRef(null);
  const sunlightRef = useRef(null);
  const skyFillRef = useRef(null);
  const moonlightRef = useRef(null);

  const ambientNightColor     = useMemo(() => new Color("#b7c8e1"), []);
  const ambientTwilightColor  = useMemo(() => new Color("#dfc0ba"), []);
  const ambientDayColor       = useMemo(() => new Color("#f6e2c6"), []);

  const hemisphereNightColor  = useMemo(() => new Color("#97afcf"), []);
  const hemisphereTwilightColor = useMemo(() => new Color("#efb0be"), []);
  const hemisphereDayColor    = useMemo(() => new Color("#ffe1bf"), []);
  const groundNightColor      = useMemo(() => new Color("#323a48"), []);
  const groundTwilightColor   = useMemo(() => new Color("#5d4b4c"), []);
  const groundDayColor        = useMemo(() => new Color("#705743"), []);

  const skyNightColor         = useMemo(() => new Color("#080d16"), []);
  const skyTwilightColor      = useMemo(() => new Color("#f5a2b7"), []);
  const skySunriseColor       = useMemo(() => new Color("#f6ccb0"), []);
  const skySunsetColor        = useMemo(() => new Color("#cf7fae"), []);
  const skyDayColor           = useMemo(() => new Color("#cce9ff"), []);
  const fogNightColor         = useMemo(() => new Color("#1a1c25"), []);
  const fogTwilightColor      = useMemo(() => new Color("#d39ea6"), []);
  const fogSunriseColor       = useMemo(() => new Color("#e4bea9"), []);
  const fogSunsetColor        = useMemo(() => new Color("#aa6f89"), []);
  const fogDayColor           = useMemo(() => new Color("#e4d8cb"), []);

  const sunNoonColor          = useMemo(() => new Color("#fff4d6"), []);
  const sunMorningColor       = useMemo(() => new Color("#ffc87a"), []);
  const sunLowColor           = useMemo(() => new Color("#ff8c42"), []);
  const sunTwilightColor      = useMemo(() => new Color("#ff5e30"), []);
  const sunSunriseColor       = useMemo(() => new Color("#ffcfa0"), []);
  const sunSunsetColor        = useMemo(() => new Color("#ff6e3e"), []);
  const skyFillNightColor     = useMemo(() => new Color("#7f9fcb"), []);
  const skyFillDayColor       = useMemo(() => new Color("#c6dcff"), []);
  const skyFillTwilightColor  = useMemo(() => new Color("#f0b8c8"), []);
  const skyFillSunriseColor   = useMemo(() => new Color("#f5d2bf"), []);
  const skyFillSunsetColor    = useMemo(() => new Color("#d8a0bf"), []);

  const scratchColor          = useMemo(() => new Color(), []);
  const skyFillScratchColor   = useMemo(() => new Color(), []);
  const twilightSkyScratchColor = useMemo(() => new Color(), []);
  const twilightFogScratchColor = useMemo(() => new Color(), []);
  const twilightSunScratchColor = useMemo(() => new Color(), []);
  const twilightSkyFillScratchColor = useMemo(() => new Color(), []);
  const targetSkyColorRef     = useRef(new Color());
  const targetFogColorRef     = useRef(new Color());

  useFrame((state, delta) => {
    const elapsedSeconds = state.clock.getElapsedTime();
    const worldHour = getWorldHour(elapsedSeconds, initialWorldHour);
    worldHourRef.current = worldHour;

    const solarPhase = ((worldHour - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(solarPhase);
    const dayFactor = Math.max(0, sunHeight);
    const nightFactor = Math.max(0, -sunHeight);
    const twilightFactor = getTwilightFactor(sunHeight);
    const sunriseBlend = getDayBlend(worldHour, 5, 8);
    const sunsetBlend = getDayBlend(worldHour, 17, 20);
    const isSunActive = sunHeight >= 0;

    twilightSkyScratchColor
      .copy(skyTwilightColor)
      .lerp(skySunriseColor, sunriseBlend)
      .lerp(skySunsetColor, sunsetBlend);

    if (scene.background instanceof Color) {
      targetSkyColorRef.current
        .copy(skyNightColor)
        .lerp(twilightSkyScratchColor, twilightFactor)
        .lerp(skyDayColor, dayFactor);
      scene.background.lerp(targetSkyColorRef.current, Math.min(1, delta * 0.55));
    }

    twilightFogScratchColor
      .copy(fogTwilightColor)
      .lerp(fogSunriseColor, sunriseBlend)
      .lerp(fogSunsetColor, sunsetBlend);

    if (scene.fog && "color" in scene.fog) {
      targetFogColorRef.current
        .copy(fogNightColor)
        .lerp(twilightFogScratchColor, twilightFactor)
        .lerp(fogDayColor, dayFactor);
      scene.fog.color.lerp(targetFogColorRef.current, Math.min(1, delta * 0.6));
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity =
        0.23 + dayFactor * 0.15 + twilightFactor * 0.06 + nightFactor * 0.04;
      ambientLightRef.current.color
        .copy(ambientNightColor)
        .lerp(ambientTwilightColor, twilightFactor)
        .lerp(ambientDayColor, dayFactor);
    }

    if (hemisphereLightRef.current) {
      hemisphereLightRef.current.intensity =
        0.25 + dayFactor * 0.17 + twilightFactor * 0.08 + nightFactor * 0.03;
      hemisphereLightRef.current.color
        .copy(hemisphereNightColor)
        .lerp(hemisphereTwilightColor, twilightFactor)
        .lerp(hemisphereDayColor, dayFactor);
      hemisphereLightRef.current.groundColor
        .copy(groundNightColor)
        .lerp(groundTwilightColor, twilightFactor)
        .lerp(groundDayColor, dayFactor);
    }

    if (sunlightRef.current) {
      const flicker = 1 + Math.sin(elapsedSeconds * 1.7) * 0.006 + Math.sin(elapsedSeconds * 3.1) * 0.003;
      sunlightRef.current.intensity =
        isSunActive
          ? (dayFactor * 1.05 + twilightFactor * 0.35) * flicker
          : 0;

      const lowBand  = Math.min(1, dayFactor / 0.18);
      const midBand  = Math.max(0, Math.min(1, (dayFactor - 0.18) / 0.25));
      const highBand = Math.max(0, Math.min(1, (dayFactor - 0.42) / 0.3));

      twilightSunScratchColor
        .copy(sunTwilightColor)
        .lerp(sunSunriseColor, sunriseBlend)
        .lerp(sunSunsetColor, sunsetBlend);

      scratchColor
        .copy(twilightSunScratchColor)
        .lerp(sunLowColor,   lowBand)
        .lerp(sunMorningColor, midBand)
        .lerp(sunNoonColor,  highBand);

      scratchColor.lerp(twilightSunScratchColor, twilightFactor * 0.55);

      sunlightRef.current.color.lerp(scratchColor, Math.min(1, delta * 1.5));

      const sunAngle = solarPhase;
      const cosElev = Math.cos(sunAngle);
      const sinElev = Math.sin(sunAngle);
      sunlightRef.current.position.set(
        cosElev * 3.5,
        Math.max(0.3, sinElev * 6.0),
        2.5 + sinElev * 1.2
      );
    }

    twilightSkyFillScratchColor
      .copy(skyFillTwilightColor)
      .lerp(skyFillSunriseColor, sunriseBlend)
      .lerp(skyFillSunsetColor, sunsetBlend);

    if (skyFillRef.current) {
      skyFillRef.current.intensity =
        isSunActive
          ? dayFactor * 0.22 + twilightFactor * 0.12
          : nightFactor * 0.07;
      skyFillScratchColor
        .copy(skyFillNightColor)
        .lerp(twilightSkyFillScratchColor, twilightFactor)
        .lerp(skyFillDayColor, dayFactor);
      skyFillRef.current.color.lerp(skyFillScratchColor, Math.min(1, delta * 1.2));
    }

    const moonAngle = solarPhase + Math.PI;
    const moonCos = Math.cos(moonAngle);
    const moonSin = Math.sin(moonAngle);
    const moonArcFactor = Math.pow(Math.max(0, moonSin), 0.82);

    if (moonlightRef.current) {
      moonlightRef.current.intensity =
        isSunActive
          ? 0
          : moonArcFactor * (0.08 + moonPhaseFactor * 0.26) + twilightFactor * 0.05;
      moonlightRef.current.position.set(
        -moonCos * 3.2 + Math.sin(elapsedSeconds * 0.07) * 0.22,
        Math.max(0.35, moonSin * 4.8 + 0.6),
        2.2 + moonSin * 1.1
      );
    }

    const nextDisplay = toClockDisplay(worldHour);
    if (
      nextDisplay.hour24 !== lastDisplayedHourRef.current ||
      nextDisplay.minute !== lastDisplayedMinuteRef.current
    ) {
      lastDisplayedHourRef.current = nextDisplay.hour24;
      lastDisplayedMinuteRef.current = nextDisplay.minute;
      setClockDisplay(nextDisplay);
    }
  });

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((texture) => texture.dispose());
    };
  }, [textures]);

  useEffect(() => {
    if (onWorldClockDisplayChange) {
      onWorldClockDisplayChange(clockDisplay);
    }
  }, [clockDisplay, onWorldClockDisplayChange]);

  return (
    <>
      <color attach="background" args={["#cce9ff"]} />
      <fog attach="fog" args={["#e4d8cb", 8, 18]} />

      <ambientLight ref={ambientLightRef} color="#f3e7d3" intensity={0.35} />
      <hemisphereLight
        ref={hemisphereLightRef}
        color="#f4ebdf"
        groundColor="#5f4f42"
        intensity={0.38}
      />

      <directionalLight
        ref={sunlightRef}
        color="#ffe5c4"
        intensity={0.72}
        position={[2.8, 4.6, 2.4]}
      />

      <directionalLight
        ref={skyFillRef}
        color="#add6f7"
        intensity={0.28}
        position={[0, 2.4, 5.5]}
      />

      <directionalLight
        ref={moonlightRef}
        color="#9abcf2"
        intensity={0.05}
        position={[-2.4, 3.8, 2.1]}
      />

      <RoomShell textures={textures} worldHourRef={worldHourRef} />
      <Suspense fallback={null}>
        <DeskSetup
          clockAmpm={clockDisplay.ampm}
          clockTime={clockDisplay.time}
          isRadioOn={isMusicPlaying}
          worldHourRef={worldHourRef}
        />
      </Suspense>
      <Suspense fallback={null}>
        <WallDecor
          boardPomodoro={boardPomodoro}
          boardTodo={boardTodo}
          focusScore={focusScore}
          onOpenBoardPopup={onOpenBoardPopup}
          taskScore={taskScore}
          textures={textures}
        />
      </Suspense>
      <SceneCss3DRenderer enabled={isInteractable} />
      <RoomInteractionHotkeys
        onOpenCalendarPopup={onOpenCalendarPopup}
        onOpenStatsPopup={onOpenStatsPopup}
        onToggleBoardPopup={onToggleBoardPopup}
        onToggleCalendarPopup={onToggleCalendarPopup}
        onToggleStatsPopup={onToggleStatsPopup}
        onToggleMusic={onToggleMusic}
        onSelectMusicSlot={onSelectMusicSlot}
        keybindsEnabled={hotkeysEnabled}
        pointerEnabled={isInteractable}
      />
      <SeatedCameraControls enabled={!isCameraLocked && isInteractable} />
    </>
  );
}
