import { DESK_TOP_Y } from "./constants";

const PLANT_SCALE = 0.086 * 1.5;
const BASE_RADIUS_SCALE = 0.5;

const STONE_CONFIGS = [
  { position: [-0.46, 0.6, 0.32], scale: [1.0, 0.55, 0.95] },
  { position: [0.5, 0.6, 0.2], scale: [1.0, 0.5, 1.1] },
  { position: [-0.62, 0.6, -0.22], scale: [1.0, 0.6, 0.85] },
  { position: [0.12, 0.6, -0.54], scale: [1.0, 0.45, 0.9] },
  { position: [0.72, 0.6, -0.06], scale: [1.0, 0.52, 1.0] },
];

const MOSS_CONFIGS = [
  { position: [-0.34, 0.59, 0.11], scale: [1.15, 0.24, 1.05], color: "#4a6e2a" },
  { position: [0.28, 0.59, 0.41], scale: [1.0, 0.22, 1.2], color: "#3d5c22" },
  { position: [0.44, 0.59, -0.3], scale: [1.25, 0.25, 0.95], color: "#567830" },
];

const BRANCH_CONFIGS = [
  { position: [0.03, 0.36, 0.03], rotation: [0.12, 0.0, 0.18], args: [0.16, 0.2, 0.72, 6], color: "#5c3a1e" },
  { position: [0.07, 0.9, -0.01], rotation: [0.22, -0.08, 0.1], args: [0.13, 0.16, 0.6, 6], color: "#5c3a1e" },
  { position: [0.02, 1.35, -0.02], rotation: [0.17, 0.06, -0.14], args: [0.1, 0.13, 0.5, 6], color: "#5c3a1e" },
  { position: [0.28, 1.12, 0.08], rotation: [0.32, 0.22, -0.68], args: [0.05, 0.08, 0.72, 6], color: "#5c3a1e" },
  { position: [-0.26, 1.2, -0.06], rotation: [-0.28, -0.3, 0.62], args: [0.048, 0.076, 0.68, 6], color: "#5c3a1e" },
  { position: [0.2, 1.55, -0.25], rotation: [0.58, 0.1, -0.4], args: [0.04, 0.06, 0.56, 6], color: "#4f3118" },
  { position: [-0.18, 1.62, 0.22], rotation: [-0.44, -0.18, 0.35], args: [0.038, 0.058, 0.5, 6], color: "#4f3118" },
  { position: [0.03, 1.92, 0.04], rotation: [0.2, 0.14, 0.22], args: [0.028, 0.04, 0.32, 5], color: "#3d2410" },
  { position: [-0.04, 2.0, -0.02], rotation: [-0.18, -0.16, -0.28], args: [0.026, 0.038, 0.3, 5], color: "#3d2410" },
];

const LEAF_CONFIGS = [
  { position: [0.36, 1.8, 0.18], scale: [0.7, 0.55, 0.62], color: "#2d6a2d" },
  { position: [0.1, 1.98, 0.34], scale: [0.76, 0.58, 0.68], color: "#3a7d3a" },
  { position: [-0.2, 1.92, 0.26], scale: [0.74, 0.55, 0.7], color: "#4a9040" },
  { position: [-0.35, 1.72, 0.06], scale: [0.72, 0.52, 0.66], color: "#558833" },
  { position: [0.02, 2.12, 0.0], scale: [0.84, 0.62, 0.75], color: "#2a5c25" },
  { position: [0.24, 2.03, -0.2], scale: [0.68, 0.5, 0.62], color: "#3a7d3a" },
  { position: [-0.08, 2.16, -0.24], scale: [0.72, 0.54, 0.64], color: "#4a9040" },
  { position: [-0.3, 1.95, -0.12], scale: [0.66, 0.48, 0.6], color: "#2d6a2d" },
  { position: [0.14, 2.22, 0.16], scale: [0.62, 0.46, 0.58], color: "#558833" },
];

const ROOT_CONFIGS = [
  { position: [0.13, 0.66, 0.03], rotation: [0.34, 0.62, -0.5], args: [0.01, 0.05, 0.28, 5] },
  { position: [-0.11, 0.65, -0.05], rotation: [-0.28, -0.52, 0.42], args: [0.01, 0.048, 0.26, 5] },
  { position: [0.03, 0.64, -0.12], rotation: [0.22, 0.06, -0.2], args: [0.009, 0.042, 0.22, 5] },
];

export function Plant() {
  return (
    <group name="desk-plant" position={[0.86, DESK_TOP_Y + 0.02, -0.28]}>
      <mesh name="desk-plant-hitbox" position={[0, 0.17, 0]}>
        <boxGeometry args={[0.36, 0.46, 0.36]} />
        <meshBasicMaterial color="#000000" colorWrite={false} depthWrite={false} opacity={0} transparent />
      </mesh>

      <group scale={PLANT_SCALE}>
        <mesh castShadow receiveShadow position={[0, 0.275, 0]}>
          <cylinderGeometry args={[1.35 * BASE_RADIUS_SCALE, 1.15 * BASE_RADIUS_SCALE, 0.55, 18]} />
          <meshStandardMaterial color="#8b6e52" roughness={0.62} metalness={0.04} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.38 * BASE_RADIUS_SCALE, 0.055 * BASE_RADIUS_SCALE, 8, 20]} />
          <meshStandardMaterial color="#7a5d44" roughness={0.55} metalness={0.08} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
          <cylinderGeometry args={[1.2 * BASE_RADIUS_SCALE, 1.0 * BASE_RADIUS_SCALE, 0.06, 18]} />
          <meshStandardMaterial color="#3d2410" roughness={0.95} />
        </mesh>

        <mesh receiveShadow position={[0, 0.57, 0]}>
          <cylinderGeometry args={[1.28 * BASE_RADIUS_SCALE, 1.28 * BASE_RADIUS_SCALE, 0.03, 18]} />
          <meshStandardMaterial color="#2c1a0e" roughness={1} />
        </mesh>

        {STONE_CONFIGS.map((stone, index) => (
          <mesh key={`stone-${index}`} castShadow receiveShadow position={stone.position} scale={stone.scale}>
            <sphereGeometry args={[0.065, 5, 4]} />
            <meshStandardMaterial color="#888070" roughness={0.9} />
          </mesh>
        ))}

        {MOSS_CONFIGS.map((moss, index) => (
          <mesh key={`moss-${index}`} castShadow receiveShadow position={moss.position} scale={moss.scale}>
            <sphereGeometry args={[0.16, 5, 4]} />
            <meshStandardMaterial color={moss.color} roughness={1} />
          </mesh>
        ))}

        <group position={[0, 0.58, 0]}>
          {BRANCH_CONFIGS.map((branch, index) => (
            <mesh key={`branch-${index}`} castShadow receiveShadow position={branch.position} rotation={branch.rotation}>
              <cylinderGeometry args={branch.args} />
              <meshStandardMaterial color={branch.color} roughness={0.92} />
            </mesh>
          ))}

          {LEAF_CONFIGS.map((leaf, index) => (
            <mesh key={`leaf-${index}`} castShadow position={leaf.position} scale={leaf.scale}>
              <sphereGeometry args={[1, 5, 4]} />
              <meshStandardMaterial color={leaf.color} roughness={0.72} />
            </mesh>
          ))}
        </group>

        {ROOT_CONFIGS.map((root, index) => (
          <mesh key={`root-${index}`} castShadow receiveShadow position={root.position} rotation={root.rotation}>
            <cylinderGeometry args={root.args} />
            <meshStandardMaterial color="#3d2410" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
