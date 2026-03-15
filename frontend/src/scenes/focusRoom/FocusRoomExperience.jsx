import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { FocusRoomScene } from "./FocusRoomScene";

const AA_DPR_RANGE = [1, 1.5];

function getMaxDpr() {
  if (typeof window === "undefined") return AA_DPR_RANGE[1];
  const ratio = window.devicePixelRatio;
  if (!ratio || !Number.isFinite(ratio)) return AA_DPR_RANGE[0];
  return Math.max(AA_DPR_RANGE[0], Math.min(AA_DPR_RANGE[1], ratio));
}

function SceneReadySignal({ onSceneReady, sceneSession }) {
  const hasSignaledReadyRef = useRef(false);

  useEffect(() => {
    hasSignaledReadyRef.current = false;
  }, [sceneSession]);

  useFrame(() => {
    if (!onSceneReady || hasSignaledReadyRef.current) return;
    hasSignaledReadyRef.current = true;
    onSceneReady();
  });

  return null;
}

export default function FocusRoomExperience({
  boardPomodoro,
  boardTodo,
  isCameraLocked,
  hotkeysEnabled,
  isInteractable,
  isMusicPlaying,
  onOpenCalendarPopup,
  onOpenBoardPopup,
  onOpenStatsPopup,
  onToggleBoardPopup,
  onToggleCalendarPopup,
  onToggleMusic,
  onToggleStatsPopup,
  onSelectMusicSlot,
  onWorldClockDisplayChange,
  onSceneReady,
  sceneSession,
  focusScore,
  taskScore,
}) {
  const maxDpr = useMemo(() => getMaxDpr(), []);

  return (
    <Canvas
      dpr={[AA_DPR_RANGE[0], maxDpr]}
      gl={{
        alpha: false,
        antialias: true,
        depth: true,
        powerPreference: "high-performance",
        precision: "mediump",
        preserveDrawingBuffer: false,
        stencil: false,
      }}
      performance={{ min: 0.5, debounce: 220 }}
      camera={{
        position: [-2.02, 1.42, -0.79],
        fov: 46,
        near: 0.1,
        far: 40,
      }}
    >
      <SceneReadySignal onSceneReady={onSceneReady} sceneSession={sceneSession} />
      <FocusRoomScene
        boardPomodoro={boardPomodoro}
        boardTodo={boardTodo}
        focusScore={focusScore}
        hotkeysEnabled={hotkeysEnabled}
        isCameraLocked={isCameraLocked}
        isInteractable={isInteractable}
        isMusicPlaying={isMusicPlaying}
        onOpenBoardPopup={onOpenBoardPopup}
        onOpenCalendarPopup={onOpenCalendarPopup}
        onOpenStatsPopup={onOpenStatsPopup}
        onSelectMusicSlot={onSelectMusicSlot}
        onToggleBoardPopup={onToggleBoardPopup}
        onToggleCalendarPopup={onToggleCalendarPopup}
        onToggleMusic={onToggleMusic}
        onToggleStatsPopup={onToggleStatsPopup}
        onWorldClockDisplayChange={onWorldClockDisplayChange}
        taskScore={taskScore}
      />
    </Canvas>
  );
}
