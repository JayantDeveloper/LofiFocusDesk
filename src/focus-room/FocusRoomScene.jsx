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

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const editableTags = ["INPUT", "TEXTAREA", "SELECT"];
  if (editableTags.includes(target.tagName)) {
    return true;
  }

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
      if (event.defaultPrevented) {
        return;
      }

      if (
        event.target instanceof Element &&
        event.target.closest(".focus-board-popup-backdrop")
      ) {
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.set(x, y);
      raycaster.setFromCamera(pointer, camera);

      const plantHitbox = scene.getObjectByName("desk-plant-hitbox");
      if (plantHitbox && onToggleBoardPopup) {
        const plantHits = raycaster.intersectObject(plantHitbox, true);
        if (plantHits.length > 0) {
          onToggleBoardPopup();
          return;
        }
      }

      const radioHitbox = scene.getObjectByName("desk-radio-hitbox");
      if (radioHitbox && onToggleMusic) {
        const hits = raycaster.intersectObject(radioHitbox, true);
        if (hits.length > 0) {
          onToggleMusic();
          return;
        }
      }

      const calendarHitbox = scene.getObjectByName("wall-calendar-hitbox");
      if (calendarHitbox && onOpenCalendarPopup) {
        const hits = raycaster.intersectObject(calendarHitbox, true);
        if (hits.length > 0) {
          onOpenCalendarPopup();
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "r" && onToggleMusic) {
        event.preventDefault();
        onToggleMusic();
        return;
      }
      if (key === "t" && onToggleBoardPopup) {
        event.preventDefault();
        onToggleBoardPopup();
        return;
      }
      if (key === "c" && onToggleCalendarPopup) {
        event.preventDefault();
        onToggleCalendarPopup();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    camera,
    gl.domElement,
    onOpenCalendarPopup,
    onToggleBoardPopup,
    onToggleCalendarPopup,
    onToggleMusic,
    pointer,
    raycaster,
    scene,
  ]);

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
  onToggleMusic,
}) {
  const textures = useFocusTextures();
  const initialWorldHour = useMemo(() => getCurrentLocalHour(), []);
  const initialLampOn = initialWorldHour >= 18 || initialWorldHour < 6;
  const simulationStartHourRef = useRef(initialWorldHour);
  const worldHourRef = useRef(initialWorldHour);
  const lastDisplayedHourRef = useRef(Math.floor(initialWorldHour) % 24);
  const lampOnRef = useRef(initialLampOn);
  const [clockDisplay, setClockDisplay] = useState(() =>
    toClockDisplay(initialWorldHour),
  );
  const [isLampOn, setIsLampOn] = useState(initialLampOn);

  const ambientLightRef = useRef(null);
  const hemisphereLightRef = useRef(null);
  const sunlightRef = useRef(null);
  const moonlightRef = useRef(null);

  const ambientNightColor = useMemo(() => new Color("#e8ddd1"), []);
  const ambientDayColor = useMemo(() => new Color("#f3e7d3"), []);
  const hemisphereNightColor = useMemo(() => new Color("#ccd7ea"), []);
  const hemisphereDayColor = useMemo(() => new Color("#f4ebdf"), []);
  const groundNightColor = useMemo(() => new Color("#4e4339"), []);
  const groundDayColor = useMemo(() => new Color("#5f4f42"), []);
  const sunlightWarmColor = useMemo(() => new Color("#ffe5c4"), []);
  const moonCoolColor = useMemo(() => new Color("#97b6ea"), []);

  useFrame((state) => {
    const worldHour = getWorldHour(
      simulationStartHourRef.current,
      state.clock.getElapsedTime(),
    );
    worldHourRef.current = worldHour;

    const solarPhase = ((worldHour - 6) / 24) * Math.PI * 2;
    const dayFactor = Math.max(0, Math.sin(solarPhase));
    const nightFactor = Math.max(0, -Math.sin(solarPhase));

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.26 + dayFactor * 0.13 + nightFactor * 0.03;
      ambientLightRef.current.color.copy(ambientNightColor).lerp(ambientDayColor, dayFactor);
    }

    if (hemisphereLightRef.current) {
      hemisphereLightRef.current.intensity = 0.28 + dayFactor * 0.14 + nightFactor * 0.03;
      hemisphereLightRef.current.color
        .copy(hemisphereNightColor)
        .lerp(hemisphereDayColor, dayFactor);
      hemisphereLightRef.current.groundColor
        .copy(groundNightColor)
        .lerp(groundDayColor, dayFactor);
    }

    if (sunlightRef.current) {
      sunlightRef.current.intensity = 0.08 + dayFactor * 0.82;
      sunlightRef.current.color.copy(moonCoolColor).lerp(sunlightWarmColor, dayFactor);
    }

    if (moonlightRef.current) {
      moonlightRef.current.intensity = 0.04 + nightFactor * 0.22;
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
      Object.values(textures).forEach((texture) => {
        texture.dispose();
      });
    };
  }, [textures]);

  return (
    <>
      <color attach="background" args={["#e8ddd1"]} />
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
        textures={textures}
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
