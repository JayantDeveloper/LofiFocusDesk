import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide } from "three";

const STICKY_NOTE_COLORS = [
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#fde84e",
  "#ff9f6b",
  "#a8e6cf",
  "#ffb3c6",
];
const STICKY_NOTE_WIDTH = 0.14;
const STICKY_NOTE_DEPTH = 0.14;
const STICKY_NOTE_HEIGHT = 0.0022;

function stickyLayerOffset(index) {
  const phase = index * 0.73;
  return {
    x: Math.sin(phase) * 0.0012,
    z: Math.cos(phase * 0.85) * 0.0011,
    rotation: Math.sin(phase * 1.3) * 0.01,
  };
}

export function StickyNoteStack({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const peelGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    const halfWidth = STICKY_NOTE_WIDTH / 2;
    const halfDepth = STICKY_NOTE_DEPTH / 2;
    const peelSize = STICKY_NOTE_WIDTH * 0.2;
    const lift = 0.006;

    const vertices = new Float32Array([
      halfWidth,
      0,
      halfDepth,
      halfWidth - peelSize,
      0,
      halfDepth,
      halfWidth,
      0,
      halfDepth - peelSize,
      halfWidth,
      lift,
      halfDepth,
      halfWidth - peelSize,
      0,
      halfDepth,
      halfWidth,
      0,
      halfDepth - peelSize,
    ]);

    geometry.setAttribute("position", new BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  useEffect(() => {
    return () => peelGeometry.dispose();
  }, [peelGeometry]);

  return (
    <group position={position} rotation={rotation}>
      {STICKY_NOTE_COLORS.map((color, index) => {
        const offset = stickyLayerOffset(index);
        const y = index * STICKY_NOTE_HEIGHT + STICKY_NOTE_HEIGHT * 0.5;

        return (
          <mesh
            key={`sticky-layer-${index}`}
            castShadow
            receiveShadow
            position={[offset.x, y, offset.z]}
            rotation={[0, offset.rotation, 0]}
          >
            <boxGeometry args={[STICKY_NOTE_WIDTH, STICKY_NOTE_HEIGHT, STICKY_NOTE_DEPTH]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        );
      })}

      <mesh
        castShadow
        receiveShadow
        geometry={peelGeometry}
        position={[0, STICKY_NOTE_COLORS.length * STICKY_NOTE_HEIGHT + STICKY_NOTE_HEIGHT * 0.25, 0]}
      >
        <meshStandardMaterial color="#f5d800" roughness={0.9} side={DoubleSide} />
      </mesh>
    </group>
  );
}
