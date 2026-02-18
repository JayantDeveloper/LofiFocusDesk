import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, Raycaster, Vector2 } from "three";
import { DeskSetup } from "./components/DeskSetup";
import { RoomShell } from "./components/RoomShell";
import { SceneCss3DRenderer } from "./components/Css3DLayer";
import { SeatedCameraControls } from "./components/SeatedCameraControls";
import { WallDecor } from "./components/WallDecor";
import { useFocusTextures } from "./useFocusTextures";

const WORLD_DAY_CYCLE_SECONDS = 60 * 60;

function getCurrentLocalHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

function getWorldHour(startHour, elapsedSeconds) {
  const advancedHours = (elapsedSeconds / WORLD_DAY_CYCLE_SECONDS) * 24;
  return (startHour + advancedHours) % 24;
}

function toClockDisplay(worldHour) {
  const hour24 = ((Math.floor(worldHour) % 24) + 24) % 24;
  const hour12 = hour24 % 12 || 12;
  return {
    ampm: hour24 >= 12 ? "PM" : "AM",
    hour24,
    time: `${String(hour12).padStart(2, "0")}:00`,
  };
}

function getTwilightFactor(sunHeight) {
  const horizonBand = 0.5;
  const normalized = Math.max(0, 1 - Math.abs(sunHeight) / horizonBand);
  return normalized * normalized * (3 - 2 * normalized);
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const editableTags = ["INPUT", "TEXTAREA", "SELECT"];
  if (editableTags.includes(target.tagName)) return true;
  return target.isContentEditable;
}

function RoomInteractionHotkeys({
  onOpenCalendarPopup,
  onToggleBoardPopup,
  onToggleCalendarPopup,
  onToggleMusic,
}) {
  const { camera, gl, scene } = useThree();
  const pointer = useMemo(() => new Vector2(), []);
  const raycaster = useMemo(() => new Raycaster(), []);

  useEffect(() => {
    if (!onToggleBoardPopup && !onToggleCalendarPopup && !onToggleMusic && !onOpenCalendarPopup) {
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

      const calendarHitbox = scene.getObjectByName("wall-calendar-hitbox");
      if (calendarHitbox && onOpenCalendarPopup) {
        if (raycaster.intersectObject(calendarHitbox, true).length > 0) {
          onOpenCalendarPopup();
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat) return;
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "r" && onToggleMusic) { event.preventDefault(); onToggleMusic(); return; }
      if (key === "t" && onToggleBoardPopup) { event.preventDefault(); onToggleBoardPopup(); return; }
      if (key === "c" && onToggleCalendarPopup) { event.preventDefault(); onToggleCalendarPopup(); }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [camera, gl.domElement, onOpenCalendarPopup, onToggleBoardPopup, onToggleCalendarPopup, onToggleMusic, pointer, raycaster, scene]);

  return null;
}

export function FocusRoomScene({
  boardPomodoro,
  boardTodo,
  isCameraLocked,
  isMusicPlaying,
  onOpenCalendarPopup,
  onOpenBoardPopup,
  onToggleBoardPopup,
  onToggleCalendarPopup,
  onWorldClockDisplayChange,
  onToggleMusic,
}) {
  const { scene } = useThree();
  const textures = useFocusTextures();
  const initialWorldHour = useMemo(() => getCurrentLocalHour(), []);
  const initialLampOn = initialWorldHour >= 18 || initialWorldHour < 6;
  const simulationStartHourRef = useRef(initialWorldHour);
  const worldHourRef = useRef(initialWorldHour);
  const lastDisplayedHourRef = useRef(Math.floor(initialWorldHour) % 24);
  const lampOnRef = useRef(initialLampOn);
  const [clockDisplay, setClockDisplay] = useState(() => toClockDisplay(initialWorldHour));
  const [isLampOn, setIsLampOn] = useState(initialLampOn);

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
  const skyDayColor           = useMemo(() => new Color("#cce9ff"), []);
  const fogNightColor         = useMemo(() => new Color("#1a1c25"), []);
  const fogTwilightColor      = useMemo(() => new Color("#d39ea6"), []);
  const fogDayColor           = useMemo(() => new Color("#e4d8cb"), []);

  const sunNoonColor          = useMemo(() => new Color("#fff4d6"), []);
  const sunMorningColor       = useMemo(() => new Color("#ffc87a"), []);
  const sunLowColor           = useMemo(() => new Color("#ff8c42"), []);
  const sunTwilightColor      = useMemo(() => new Color("#ff5e30"), []);
  const skyFillNightColor     = useMemo(() => new Color("#7f9fcb"), []);
  const skyFillDayColor       = useMemo(() => new Color("#c6dcff"), []);
  const skyFillTwilightColor  = useMemo(() => new Color("#f0b8c8"), []);

  const scratchColor          = useMemo(() => new Color(), []);
  const skyFillScratchColor   = useMemo(() => new Color(), []);
  const targetSkyColorRef     = useRef(new Color());
  const targetFogColorRef     = useRef(new Color());

  useFrame((state, delta) => {
    const worldHour = getWorldHour(simulationStartHourRef.current, state.clock.getElapsedTime());
    worldHourRef.current = worldHour;

    const solarPhase = ((worldHour - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(solarPhase);
    const dayFactor = Math.max(0, sunHeight);
    const nightFactor = Math.max(0, -sunHeight);
    const twilightFactor = getTwilightFactor(sunHeight);
    const isSunActive = sunHeight >= 0;

    if (scene.background instanceof Color) {
      targetSkyColorRef.current
        .copy(skyNightColor)
        .lerp(skyTwilightColor, twilightFactor)
        .lerp(skyDayColor, dayFactor);
      scene.background.lerp(targetSkyColorRef.current, Math.min(1, delta * 0.55));
    }

    if (scene.fog && "color" in scene.fog) {
      targetFogColorRef.current
        .copy(fogNightColor)
        .lerp(fogTwilightColor, twilightFactor)
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
      const flicker = 1 + Math.sin(state.clock.getElapsedTime() * 1.7) * 0.006
                        + Math.sin(state.clock.getElapsedTime() * 3.1) * 0.003;
      sunlightRef.current.intensity =
        isSunActive
          ? (dayFactor * 1.05 + twilightFactor * 0.35) * flicker
          : 0;

      const lowBand  = Math.min(1, dayFactor / 0.18);
      const midBand  = Math.max(0, Math.min(1, (dayFactor - 0.18) / 0.25));
      const highBand = Math.max(0, Math.min(1, (dayFactor - 0.42) / 0.3));

      scratchColor
        .copy(sunTwilightColor)
        .lerp(sunLowColor,   lowBand)
        .lerp(sunMorningColor, midBand)
        .lerp(sunNoonColor,  highBand);

      scratchColor.lerp(sunTwilightColor, twilightFactor * 0.55);

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

    if (skyFillRef.current) {
      skyFillRef.current.intensity =
        isSunActive
          ? dayFactor * 0.22 + twilightFactor * 0.12
          : nightFactor * 0.07;
      skyFillScratchColor
        .copy(skyFillNightColor)
        .lerp(skyFillTwilightColor, twilightFactor)
        .lerp(skyFillDayColor, dayFactor);
      skyFillRef.current.color.lerp(skyFillScratchColor, Math.min(1, delta * 1.2));
    }

    if (moonlightRef.current) {
      moonlightRef.current.intensity =
        isSunActive ? 0 : nightFactor * 0.24 + twilightFactor * 0.06;
    }

    const nextDisplay = toClockDisplay(worldHour);
    if (nextDisplay.hour24 !== lastDisplayedHourRef.current) {
      lastDisplayedHourRef.current = nextDisplay.hour24;
      setClockDisplay(nextDisplay);
    }

    const lampOn = worldHour >= 18 || worldHour < 6;
    if (lampOn !== lampOnRef.current) {
      lampOnRef.current = lampOn;
      setIsLampOn(lampOn);
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
        castShadow
        color="#ffe5c4"
        intensity={0.72}
        position={[2.8, 4.6, 2.4]}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
        shadow-camera-bottom={-5}
        shadow-camera-far={14}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={5}
        shadow-bias={-0.0008}
        shadow-normalBias={0.015}
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
      <DeskSetup
        clockAmpm={clockDisplay.ampm}
        clockTime={clockDisplay.time}
        isLampOn={isLampOn}
        isRadioOn={isMusicPlaying}
      />
      <WallDecor
        boardPomodoro={boardPomodoro}
        boardTodo={boardTodo}
        onOpenBoardPopup={onOpenBoardPopup}
        textures={textures}
      />
      <SceneCss3DRenderer />
      <RoomInteractionHotkeys
        onOpenCalendarPopup={onOpenCalendarPopup}
        onToggleBoardPopup={onToggleBoardPopup}
        onToggleCalendarPopup={onToggleCalendarPopup}
        onToggleMusic={onToggleMusic}
      />
      <SeatedCameraControls enabled={!isCameraLocked} />
    </>
  );
}
