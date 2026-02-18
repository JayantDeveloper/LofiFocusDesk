import { useMemo } from "react";
import { BackSide } from "three";
import { DESK_TOP_Y } from "./constants";

const CUP_TOP_RADIUS = 0.07;
const CUP_BOTTOM_RADIUS = 0.061;
const CUP_RADIUS_SCALE = 0.8;
const CUP_HEIGHT = 0.15;
const CUP_INNER_FLOOR_Y = 0.01;

const PENCIL_BODY_RADIUS = 0.0075;
const PENCIL_DATA = [
  { color: "#e63c2f", length: 0.22, angle: 0 },
  { color: "#f5a623", length: 0.2, angle: 40 },
  { color: "#4caf50", length: 0.21, angle: 80 },
  { color: "#2196f3", length: 0.215, angle: 120 },
  { color: "#9c27b0", length: 0.205, angle: 160 },
  { color: "#ff5722", length: 0.212, angle: 200 },
  { color: "#00bcd4", length: 0.202, angle: 240 },
  { color: "#e91e63", length: 0.218, angle: 280 },
  { color: "#607d8b", length: 0.208, angle: 320 },
];

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return (min = 0, max = 1) => {
    state = (1664525 * state + 1013904223) >>> 0;
    return min + ((state / 4294967296) * (max - min));
  };
}

function Pencil({
  barrelColor,
  length,
  position,
  rotation,
  eraserColor,
}) {
  const barrelLength = length - 0.03;
  const ferruleHeight = 0.016;
  const eraserHeight = 0.014;

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, barrelLength / 2 + 0.015, 0]}>
        <cylinderGeometry args={[PENCIL_BODY_RADIUS, PENCIL_BODY_RADIUS, barrelLength, 6]} />
        <meshStandardMaterial color={barrelColor} roughness={0.55} />
      </mesh>

      <mesh castShadow position={[0, 0.007, 0]}>
        <cylinderGeometry args={[0, PENCIL_BODY_RADIUS, 0.014, 6]} />
        <meshStandardMaterial color="#d4a96a" roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0, 0.0027, 0.007, 6]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.3} metalness={0.4} />
      </mesh>

      <mesh castShadow position={[0, length - 0.02, 0]}>
        <cylinderGeometry args={[PENCIL_BODY_RADIUS + 0.0013, PENCIL_BODY_RADIUS + 0.0013, ferruleHeight, 12]} />
        <meshStandardMaterial color="#c8c0a8" roughness={0.25} metalness={0.82} />
      </mesh>

      <mesh castShadow position={[0, length - 0.007, 0]}>
        <cylinderGeometry args={[PENCIL_BODY_RADIUS - 0.0007, PENCIL_BODY_RADIUS - 0.0007, eraserHeight, 12]} />
        <meshStandardMaterial color={eraserColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function PenCup() {
  const pencils = useMemo(() => {
    const random = createSeededRandom(90217);
    const eraserColors = ["#f4a0a0", "#f0c0b0", "#d4a8b8", "#f5b8b8"];
    const maxRadius = 0.034 * CUP_RADIUS_SCALE;
    const maxLean = 0.19;

    return PENCIL_DATA.map((pencil, index) => {
      const angle = (pencil.angle * Math.PI) / 180 + random(-0.16, 0.16);
      const radialOffset = random(0.005, maxRadius);
      const position = [
        Math.cos(angle) * radialOffset,
        CUP_INNER_FLOOR_Y,
        Math.sin(angle) * radialOffset,
      ];
      const lean = random(0.04, maxLean);
      const rotation = [
        Math.cos(angle) * lean * random(-1, 1),
        random(0, Math.PI * 2),
        Math.sin(angle) * lean * random(-1, 1),
      ];

      return {
        key: `pencil-${index}`,
        barrelColor: pencil.color,
        length: pencil.length,
        position,
        rotation,
        eraserColor: eraserColors[Math.floor(random(0, eraserColors.length))],
      };
    });
  }, []);

  return (
    <group position={[0.62, DESK_TOP_Y + 0.08, -0.27]}>
      <mesh castShadow receiveShadow position={[0, CUP_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[CUP_TOP_RADIUS * CUP_RADIUS_SCALE, CUP_BOTTOM_RADIUS * CUP_RADIUS_SCALE, CUP_HEIGHT, 18, 1, true]} />
        <meshStandardMaterial color="#4a3728" roughness={0.82} />
      </mesh>

      <mesh position={[0, CUP_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[
            (CUP_TOP_RADIUS - 0.008) * CUP_RADIUS_SCALE,
            (CUP_BOTTOM_RADIUS - 0.005) * CUP_RADIUS_SCALE,
            CUP_HEIGHT - 0.004,
            14,
            1,
            true,
          ]}
        />
        <meshStandardMaterial color="#000000" roughness={1} side={BackSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CUP_INNER_FLOOR_Y, 0]}>
        <circleGeometry args={[(CUP_BOTTOM_RADIUS - 0.004) * CUP_RADIUS_SCALE, 18]} />
        <meshStandardMaterial color="#000000" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[CUP_BOTTOM_RADIUS * CUP_RADIUS_SCALE, 18]} />
        <meshStandardMaterial color="#4a3728" roughness={0.82} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CUP_HEIGHT + 0.001, 0]}>
        <torusGeometry args={[(CUP_TOP_RADIUS + 0.003) * CUP_RADIUS_SCALE, 0.005 * CUP_RADIUS_SCALE, 10, 20]} />
        <meshStandardMaterial color="#5a4535" roughness={0.72} />
      </mesh>

      {pencils.map((pencil) => (
        <Pencil
          key={pencil.key}
          barrelColor={pencil.barrelColor}
          eraserColor={pencil.eraserColor}
          length={pencil.length}
          position={pencil.position}
          rotation={pencil.rotation}
        />
      ))}
    </group>
  );
}
