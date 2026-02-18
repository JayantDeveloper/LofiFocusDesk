import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";

const CAMERA_POSITION = new Vector3(-2.02, 1.42, -0.79);
const BASE_LOOK_TARGET = new Vector3(-2.03, 1.04, -2.28);
const UP_VECTOR = new Vector3(0, 1, 0);
const MIN_YAW = -0.62;
const MAX_YAW = 1.22;
const MIN_PITCH = -0.12;
const MAX_PITCH = 0.32;
const YAW_SENSITIVITY = 0.004;
const PITCH_SENSITIVITY = 0.0028;

export function SeatedCameraControls({ enabled = true }) {
  const { camera } = useThree();

  const controlState = useRef({
    dragging: false,
    pointerId: null,
    currentYaw: 0,
    currentPitch: 0,
    lastX: 0,
    lastY: 0,
    targetYaw: 0,
    targetPitch: 0,
  });

  const baseDirection = useMemo(
    () => BASE_LOOK_TARGET.clone().sub(CAMERA_POSITION).normalize(),
    [],
  );

  const lookDirection = useRef(new Vector3());
  const rightAxis = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());

  useEffect(() => {
    camera.position.copy(CAMERA_POSITION);
    lookDirection.current.copy(baseDirection);
    lookTarget.current.copy(CAMERA_POSITION).add(lookDirection.current);
    camera.lookAt(lookTarget.current);
  }, [baseDirection, camera]);

  useEffect(() => {
    if (!enabled) {
      controlState.current.dragging = false;
      controlState.current.pointerId = null;
    }
  }, [enabled]);

  useEffect(() => {
    const shouldIgnorePointerTarget = (target) =>
      target instanceof Element &&
      Boolean(
        target.closest(".focus-board-screen-shell") ||
          target.closest(".focus-board-popup-backdrop"),
      );

    const handlePointerDown = (event) => {
      if (!enabled) {
        return;
      }
      if (event.defaultPrevented) {
        return;
      }

      if (shouldIgnorePointerTarget(event.target)) {
        return;
      }

      controlState.current.dragging = true;
      controlState.current.pointerId = event.pointerId;
      controlState.current.lastX = event.clientX;
      controlState.current.lastY = event.clientY;
    };

    const handlePointerMove = (event) => {
      if (!enabled) {
        return;
      }
      if (
        !controlState.current.dragging ||
        controlState.current.pointerId !== event.pointerId
      ) {
        return;
      }

      const deltaX = event.clientX - controlState.current.lastX;
      const deltaY = event.clientY - controlState.current.lastY;
      controlState.current.lastX = event.clientX;
      controlState.current.lastY = event.clientY;

      controlState.current.targetYaw = MathUtils.clamp(
        controlState.current.targetYaw - deltaX * YAW_SENSITIVITY,
        MIN_YAW,
        MAX_YAW,
      );

      controlState.current.targetPitch = MathUtils.clamp(
        controlState.current.targetPitch - deltaY * PITCH_SENSITIVITY,
        MIN_PITCH,
        MAX_PITCH,
      );
    };

    const handlePointerUp = (event) => {
      if (controlState.current.pointerId !== event.pointerId) {
        return;
      }

      controlState.current.dragging = false;
      controlState.current.pointerId = null;
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [enabled]);

  useFrame(() => {
    controlState.current.currentYaw = MathUtils.lerp(
      controlState.current.currentYaw,
      controlState.current.targetYaw,
      0.12,
    );
    controlState.current.currentPitch = MathUtils.lerp(
      controlState.current.currentPitch,
      controlState.current.targetPitch,
      0.12,
    );

    lookDirection.current
      .copy(baseDirection)
      .applyAxisAngle(UP_VECTOR, controlState.current.currentYaw);
    rightAxis.current.crossVectors(lookDirection.current, UP_VECTOR).normalize();
    lookDirection.current.applyAxisAngle(
      rightAxis.current,
      controlState.current.currentPitch,
    );

    lookTarget.current.copy(CAMERA_POSITION).add(lookDirection.current);

    camera.position.copy(CAMERA_POSITION);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
