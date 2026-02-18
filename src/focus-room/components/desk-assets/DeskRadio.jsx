import { DESK_TOP_Y } from "./constants";

export function DeskRadio({ isOn = false }) {
  return (
    <group name="desk-radio" position={[0.95, DESK_TOP_Y + 0.1, 0.36]} rotation={[-0.09, -0.24, -0.03]}>
      <mesh name="desk-radio-hitbox" position={[0, 0.01, 0]}>
        <boxGeometry args={[0.46, 0.3, 0.28]} />
        <meshBasicMaterial color="#000000" colorWrite={false} depthWrite={false} opacity={0} transparent />
      </mesh>

      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.18, 0.14]} />
        <meshStandardMaterial color="#444f61" roughness={0.45} metalness={0.2} />
      </mesh>

      <mesh castShadow position={[0, 0.058, 0.071]}>
        <boxGeometry args={[0.28, 0.038, 0.012]} />
        <meshStandardMaterial color="#2e3643" roughness={0.4} metalness={0.18} />
      </mesh>

      <mesh castShadow position={[0.025, 0.06, 0.078]}>
        <sphereGeometry args={[0.009, 14, 14]} />
        <meshStandardMaterial
          color={isOn ? "#ff3d31" : "#4a2724"}
          emissive={isOn ? "#ff2a20" : "#000000"}
          emissiveIntensity={isOn ? 2.4 : 0}
          metalness={0.18}
          roughness={0.34}
        />
      </mesh>

      {isOn ? (
        <pointLight color="#ff4335" decay={2} distance={0.38} intensity={0.45} position={[0.025, 0.06, 0.082]} />
      ) : null}

      <mesh castShadow position={[-0.095, -0.006, 0.074]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.01, 24]} />
        <meshStandardMaterial color="#1f2732" roughness={0.55} />
      </mesh>

      <mesh castShadow position={[0.095, -0.006, 0.074]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.01, 24]} />
        <meshStandardMaterial color="#1f2732" roughness={0.55} />
      </mesh>

      <mesh castShadow position={[-0.13, 0.062, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.014, 16]} />
        <meshStandardMaterial color="#d3b486" roughness={0.42} metalness={0.36} />
      </mesh>

      <mesh castShadow position={[-0.09, 0.062, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.014, 16]} />
        <meshStandardMaterial color="#d3b486" roughness={0.42} metalness={0.36} />
      </mesh>

      <mesh castShadow position={[0.15, 0.12, -0.02]} rotation={[0.25, 0, -0.15]}>
        <cylinderGeometry args={[0.004, 0.004, 0.22, 10]} />
        <meshStandardMaterial color="#b9c0cc" roughness={0.34} metalness={0.7} />
      </mesh>
    </group>
  );
}
