import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { FocusRoomScene } from "./FocusRoomScene";
import {
  detectFocusRoomQualityKey,
  getFocusRoomQualityProfile,
} from "./performanceProfile";

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

function SceneRenderLoop({ sceneQuality }) {
  const invalidate = useThree((state) => state.invalidate);
  const interactionBoostDeadlineRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const boost = () => {
      interactionBoostDeadlineRef.current = window.performance.now() + 700;
      invalidate();
    };

    const handlePointerMove = (event) => {
      if (event.buttons !== 0) {
        boost();
      }
    };

    window.addEventListener("pointerdown", boost, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("wheel", boost, { passive: true });
    window.addEventListener("keydown", boost);
    window.addEventListener("resize", boost);
    document.addEventListener("visibilitychange", boost);

    return () => {
      window.removeEventListener("pointerdown", boost);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("wheel", boost);
      window.removeEventListener("keydown", boost);
      window.removeEventListener("resize", boost);
      document.removeEventListener("visibilitychange", boost);
    };
  }, [invalidate]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let timeoutId = 0;
    let rafId = 0;
    let cancelled = false;

    const queueNextFrame = (delayMs) => {
      timeoutId = window.setTimeout(() => {
        rafId = window.requestAnimationFrame(tick);
      }, delayMs);
    };

    const tick = () => {
      if (cancelled) {
        return;
      }

      invalidate();

      const now = window.performance.now();
      const boosted = now < interactionBoostDeadlineRef.current;
      const targetFps = document.hidden
        ? sceneQuality.hiddenFps
        : boosted
          ? sceneQuality.interactionFps
          : sceneQuality.idleFps;

      queueNextFrame(1000 / Math.max(1, targetFps));
    };

    interactionBoostDeadlineRef.current = window.performance.now() + 1200;
    tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(rafId);
    };
  }, [
    invalidate,
    sceneQuality.hiddenFps,
    sceneQuality.idleFps,
    sceneQuality.interactionFps,
  ]);

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
  const sceneQuality = useMemo(
    () => getFocusRoomQualityProfile(detectFocusRoomQualityKey()),
    [],
  );

  return (
    <Canvas
      dpr={sceneQuality.dpr}
      frameloop="demand"
      gl={{
        alpha: false,
        antialias: sceneQuality.antialias,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "high-performance",
        precision: "mediump",
        preserveDrawingBuffer: false,
        stencil: false,
      }}
      camera={{
        position: [-2.02, 1.42, -0.79],
        fov: 46,
        near: 0.1,
        far: sceneQuality.cameraFar,
      }}
    >
      <SceneRenderLoop sceneQuality={sceneQuality} />
      <SceneReadySignal onSceneReady={onSceneReady} sceneSession={sceneSession} />
      <Suspense fallback={null}>
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
          sceneQuality={sceneQuality}
          taskScore={taskScore}
        />
      </Suspense>
    </Canvas>
  );
}
