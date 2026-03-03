import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { FocusRoomScene } from "./FocusRoomScene";

const AA_DPR_RANGE = [1, 1.5];

function SceneReadySignal({ onSceneReady }) {
  const hasSignaledReadyRef = useRef(false);

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
  onSelectMusicSlot,
  onToggleBoardPopup,
  onToggleCalendarPopup,
  onToggleMusic,
  onToggleStatsPopup,
  onWorldClockDisplayChange,
  onSceneReady,
  focusScore,
  taskScore,
}) {
  return (
    <Canvas
      dpr={AA_DPR_RANGE}
      gl={{
        alpha: false,
        antialias: true,
        depth: true,
        powerPreference: "high-performance",
        precision: "mediump",
        stencil: false,
      }}
      performance={{ min: 0.35, debounce: 180 }}
      camera={{
        position: [-2.02, 1.42, -0.79],
        fov: 46,
        near: 0.1,
        far: 40,
      }}
    >
      <SceneReadySignal onSceneReady={onSceneReady} />
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
