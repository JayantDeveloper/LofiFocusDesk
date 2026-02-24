import { DESK_TOP_Y } from "./constants";

export function PapersAndNotebook({ textures }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0.54, DESK_TOP_Y + 0.02, 0.16]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.35, 0.02, 0.24]} />
        <meshStandardMaterial color="#f1ece2" map={textures.paper} roughness={0.88} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.62, DESK_TOP_Y + 0.032, 0.22]} rotation={[0, 0.16, 0]}>
        <boxGeometry args={[0.35, 0.02, 0.24]} />
        <meshStandardMaterial color="#ece6db" map={textures.paper} roughness={0.86} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.72, DESK_TOP_Y + 0.03, -0.04]}>
        <boxGeometry args={[0.35, 0.03, 0.25]} />
        <meshStandardMaterial color="#2f4858" roughness={0.74} />
      </mesh>
    </group>
  );
}
