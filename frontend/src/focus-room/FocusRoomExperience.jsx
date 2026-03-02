import { Canvas } from "@react-three/fiber";
import { FocusRoomScene } from "./FocusRoomScene";

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
  focusScore,
  taskScore,
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.35]}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      performance={{ min: 0.65, debounce: 200 }}
      camera={{
        position: [-2.02, 1.42, -0.79],
        fov: 46,
        near: 0.1,
        far: 50,
      }}
    >
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
