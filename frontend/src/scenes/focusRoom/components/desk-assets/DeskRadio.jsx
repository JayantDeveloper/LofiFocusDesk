import { DESK_TOP_Y } from "../../../../constants/deskConstants";

export function DeskRadio({ isOn = false }) {
  return (
    <group name="desk-radio" position={[0.95, DESK_TOP_Y + 0.1, 0.36]} rotation={[-0.09, -0.24, -0.03]}>
      <mesh name="desk-radio-hitbox" position={[0, 0.01, 0]}>
        <boxGeometry args={[0.42, 0.27, 0.24]} />
        <meshBasicMaterial color="#000000" colorWrite={false} depthWrite={false} opacity={0} transparent />
      </mesh>

      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.18, 0.14]} />
        <meshPhysicalMaterial
          clearcoat={0.26}
          clearcoatRoughness={0.72}
          color="#3f4a5c"
          metalness={0.08}
          roughness={0.56}
        />
      </mesh>

      <mesh castShadow position={[0, 0.058, 0.071]}>
        <boxGeometry args={[0.28, 0.038, 0.012]} />
        <meshPhysicalMaterial
          clearcoat={0.33}
          clearcoatRoughness={0.5}
          color="#2b3340"
          metalness={0.14}
          roughness={0.44}
        />
      </mesh>

      <mesh castShadow position={[0.025, 0.06, 0.078]}>
        <sphereGeometry args={[0.009, 14, 14]} />
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.08}
          color={isOn ? "#ff5d42" : "#3d2520"}
          emissive={isOn ? "#ff2a20" : "#000000"}
          emissiveIntensity={isOn ? 3.1 : 0}
          ior={1.38}
          metalness={0.05}
          roughness={0.12}
        />
      </mesh>

      {isOn ? (
        <pointLight color="#ff4335" decay={2} distance={0.3} intensity={0.35} position={[0.025, 0.06, 0.082]} />
      ) : null}

      <mesh castShadow position={[-0.095, -0.006, 0.074]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.01, 24]} />
        <meshStandardMaterial color="#111722" metalness={0.06} roughness={0.82} />
      </mesh>

      <mesh castShadow position={[0.095, -0.006, 0.074]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.01, 24]} />
        <meshStandardMaterial color="#111722" metalness={0.06} roughness={0.82} />
      </mesh>

      <mesh castShadow position={[-0.13, 0.062, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.014, 16]} />
        <meshPhysicalMaterial
          clearcoat={0.3}
          clearcoatRoughness={0.24}
          color="#c9ac7f"
          metalness={0.56}
          roughness={0.3}
        />
      </mesh>

      <mesh castShadow position={[-0.09, 0.062, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.014, 16]} />
        <meshPhysicalMaterial
          clearcoat={0.3}
          clearcoatRoughness={0.24}
          color="#c9ac7f"
          metalness={0.56}
          roughness={0.3}
        />
      </mesh>

      <mesh castShadow position={[0.15, 0.12, -0.02]} rotation={[0.25, 0, -0.15]}>
        <cylinderGeometry args={[0.004, 0.004, 0.22, 10]} />
        <meshPhysicalMaterial
          clearcoat={0.2}
          clearcoatRoughness={0.2}
          color="#c6ceda"
          metalness={0.9}
          roughness={0.18}
        />
      </mesh>
    </group>
  );
}
