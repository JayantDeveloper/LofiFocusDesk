import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { FocusTodoBoardApp } from "../todo-board/FocusTodoBoardApp";

export function SceneCss3DRenderer() {
  const { camera, gl, scene, size } = useThree();

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

  useFrame(() => {
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
    return () => {
      root.unmount();
      rootRef.current = null;
    };
  }, [element]);

  useEffect(() => {
    rootRef.current?.render(<FocusTodoBoardApp boardPomodoro={boardPomodoro} boardTodo={boardTodo} />);
  }, [boardPomodoro, boardTodo]);

  useEffect(() => {
    if (!onOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      onOpen();
    };

    element.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      element.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [element, onOpen]);

  return <primitive object={cssObject} position={position} scale={[scale, scale, scale]} />;
}
