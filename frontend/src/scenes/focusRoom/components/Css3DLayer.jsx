import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { FocusTodoBoardApp } from "../todo-board/FocusTodoBoardApp";

export function SceneCss3DRenderer({ enabled = true }) {
  const { camera, gl, scene, size } = useThree();
  const cssFrameAccumulatorRef = useRef(0);

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

  const renderer = useMemo(() => {
    const r = new CSS3DRenderer();
    const layer = r.domElement;
    layer.className = "focus-room-css3d-layer";
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.pointerEvents = "auto";
    layer.style.background = "transparent";
    layer.style.backgroundColor = "transparent";
    layer.style.zIndex = "40";
    return r;
  }, []);

  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return undefined;
    parent.appendChild(renderer.domElement);
    enableInternalPointerEvents(renderer.domElement);
    return () => {
      if (renderer.domElement.parentElement === parent) {
        parent.removeChild(renderer.domElement);
      }
    };
  }, [gl.domElement, renderer]);

  useEffect(() => {
    renderer.setSize(size.width, size.height);
    enableInternalPointerEvents(renderer.domElement);
  }, [renderer, size.height, size.width]);

  useEffect(() => {
    renderer.domElement.style.display = enabled ? "block" : "none";
    renderer.domElement.style.pointerEvents = enabled ? "auto" : "none";
  }, [enabled, renderer]);

  useFrame((_, delta) => {
    if (!enabled) return;
    cssFrameAccumulatorRef.current += delta;
    if (cssFrameAccumulatorRef.current < 1 / 40) return;
    cssFrameAccumulatorRef.current = 0;
    renderer.render(scene, camera);
  });

  return null;
}

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
    el.style.touchAction = "none";
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
