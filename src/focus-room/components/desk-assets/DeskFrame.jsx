import { DESK_TOP_Y } from "./constants";

export function DeskFrame({ textures }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, DESK_TOP_Y, 0]}>
        <boxGeometry args={[2.35, 0.08, 1.14]} />
        <meshStandardMaterial color="#80583c" map={textures.wood} roughness={0.68} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.88, 0.4, -0.34]}>
        <boxGeometry args={[0.55, 0.72, 0.42]} />
        <meshStandardMaterial color="#6c4932" map={textures.wood} roughness={0.72} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.98, 0.38, -0.46]}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color="#5e402d" roughness={0.75} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.98, 0.38, 0.42]}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color="#5e402d" roughness={0.75} />
      </mesh>

      <mesh castShadow receiveShadow position={[1.02, 0.38, 0.42]}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color="#5e402d" roughness={0.75} />
      </mesh>
    </group>
  );
}
