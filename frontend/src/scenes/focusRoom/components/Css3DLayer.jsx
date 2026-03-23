import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Quaternion, Vector3 } from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { FocusTodoBoardApp } from "../todo-board/FocusTodoBoardApp";

export const SceneCss3DRenderer = memo(function SceneCss3DRenderer({
  enabled = true,
  sceneQuality,
}) {
  const { camera, gl, scene, size } = useThree();
  const cssFrameAccumulatorRef = useRef(0);
  const rendererRef = useRef(null);
  const lastCameraPositionRef = useRef(new Vector3());
  const lastCameraQuaternionRef = useRef(new Quaternion());
  const idleCssFps = sceneQuality?.cssFps ?? 18;

  if (rendererRef.current === null) {
    const renderer = new CSS3DRenderer();
    const layer = renderer.domElement;
    layer.className = "focus-room-css3d-layer";
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.pointerEvents = "auto";
    layer.style.background = "transparent";
    layer.style.backgroundColor = "transparent";
    layer.style.zIndex = "40";
    rendererRef.current = renderer;
  }

  function enableInternalPointerEvents(layerElement) {
    const viewElement = layerElement.firstElementChild;
    if (!(viewElement instanceof HTMLDivElement)) {
      return;
    }

    viewElement.style.pointerEvents = "auto";
    const cameraElement = viewElement.firstElementChild;
    if (cameraElement instanceof HTMLDivElement) {
      cameraElement.style.pointerEvents = "auto";
    }
  }

  useEffect(() => {
    const renderer = rendererRef.current;
    const parent =
      gl.domElement.closest(".focus-room-app") || gl.domElement.parentElement;
    if (!renderer || !parent) return undefined;
    parent.appendChild(renderer.domElement);
    enableInternalPointerEvents(renderer.domElement);
    cssFrameAccumulatorRef.current = 1; // force render on next frame
    return () => {
      if (renderer.domElement.parentElement === parent) {
        parent.removeChild(renderer.domElement);
      }
    };
  }, [gl.domElement]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return undefined;
    renderer.setSize(size.width, size.height);
    enableInternalPointerEvents(renderer.domElement);
    cssFrameAccumulatorRef.current = 1; // force render on next frame
    return undefined;
  }, [size.height, size.width]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return undefined;
    renderer.domElement.style.pointerEvents = enabled ? "auto" : "none";
    return undefined;
  }, [enabled]);

  useFrame((_, delta) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const cameraMoved =
      lastCameraPositionRef.current.distanceToSquared(camera.position) > 0.000001 ||
      1 - Math.abs(lastCameraQuaternionRef.current.dot(camera.quaternion)) > 0.000001;

    cssFrameAccumulatorRef.current += delta;
    if (!cameraMoved && cssFrameAccumulatorRef.current < 1 / Math.max(1, idleCssFps)) {
      return;
    }

    cssFrameAccumulatorRef.current = 0;
    renderer.render(scene, camera);
    lastCameraPositionRef.current.copy(camera.position);
    lastCameraQuaternionRef.current.copy(camera.quaternion);
  });

  return null;
});

export function BoardCss3DObject({
  boardPomodoro,
  boardTodo,
  className,
  heightPx,
  onOpen,
  position,
  worldWidth,
  widthPx,
}) {
  const element = useMemo(() => {
    const el = document.createElement("div");
    el.className = className ?? "focus-board-screen-shell bulletin-board-screen";
    el.style.width = `${widthPx}px`;
    el.style.height = `${heightPx}px`;
    el.style.pointerEvents = "auto";
    return el;
  }, [className, heightPx, widthPx]);

  const cssObject = useMemo(() => new CSS3DObject(element), [element]);
  const scale = worldWidth / widthPx;
  const rootRef = useRef(null);

  useEffect(() => {
    const root = createRoot(element);
    rootRef.current = root;
    root.render(
      boardPomodoro && boardTodo ? (
        <FocusTodoBoardApp boardPomodoro={boardPomodoro} boardTodo={boardTodo} />
      ) : (
        <div className="focus-board-screen-shell bulletin-board-screen" style={{ display: "grid", placeItems: "center", color: "#5a3b24", fontFamily: "Avenir Next, Trebuchet MS, sans-serif" }}>
          Loading board...
        </div>
      )
    );
    return () => {
      root.unmount();
      rootRef.current = null;
    };
    // Intentionally omit board* deps here; updates are handled in the next effect.
  }, [element]);

  useEffect(() => {
    rootRef.current?.render(
      boardPomodoro && boardTodo ? (
        <FocusTodoBoardApp boardPomodoro={boardPomodoro} boardTodo={boardTodo} />
      ) : (
        <div className="focus-board-screen-shell bulletin-board-screen" style={{ display: "grid", placeItems: "center", color: "#5a3b24", fontFamily: "Avenir Next, Trebuchet MS, sans-serif" }}>
          Loading board...
        </div>
      )
    );
  }, [boardPomodoro, boardTodo]);

  useEffect(() => {
    if (!onOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      // Only trigger open when clicking the board surface itself; allow inner UI to handle clicks.
      if (event.target === element) {
        onOpen();
      }
    };

    element.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      element.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [element, onOpen]);

  return <primitive object={cssObject} position={position} scale={[scale, scale, scale]} />;
}
