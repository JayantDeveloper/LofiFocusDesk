import { useMemo } from "react";
import { BackSide, CatmullRomCurve3, Vector2, Vector3 } from "three";
import { DESK_TOP_Y } from "./constants";

export function DeskLamp({ isOn = false }) {
  const neckCurve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(0, 0.34, 0),
          new Vector3(-0.1, 0.75, 0),
          new Vector3(-0.19, 1.24, 0.01),
          new Vector3(-0.1, 1.75, 0.02),
          new Vector3(0.12, 2.25, 0.03),
        ],
        false,
        "centripetal",
      ),
    [],
  );

  const shadeProfile = useMemo(
    () => [
      new Vector2(0.08, 0),
      new Vector2(0.12, 0.1),
      new Vector2(0.22, 0.3),
      new Vector2(0.42, 0.65),
      new Vector2(0.62, 0.95),
      new Vector2(0.78, 1.18),
      new Vector2(0.85, 1.35),
    ],
    [],
  );

  const ridgeSteps = 30;
  const headPoint = neckCurve.getPointAt(1);
  const shadeOffsetX = 0.48;
  const shadeOffsetY = 0.62;

  return (
    <group
      position={[-0.9, DESK_TOP_Y + 0.04, -0.4]}
      rotation={[0, 0.24 - Math.PI / 6, 0]}
      scale={[0.15, 0.15, 0.15]}
    >
      <mesh castShadow receiveShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.88, 0.92, 0.18, 44]} />
        <meshStandardMaterial color="#cc1111" roughness={0.34} metalness={0.55} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.896, 0.04, 12, 40]} />
        <meshStandardMaterial color="#1d1d1d" roughness={0.55} metalness={0.38} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.56, 0.22, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.52} metalness={0.42} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.255, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.15, 24]} />
        <meshStandardMaterial color="#cc1111" roughness={0.34} metalness={0.55} />
      </mesh>

      <mesh castShadow receiveShadow>
        <tubeGeometry args={[neckCurve, 80, 0.09, 12, false]} />
        <meshStandardMaterial color="#121212" roughness={0.5} metalness={0.42} />
      </mesh>

      {Array.from({ length: ridgeSteps }).map((_, index) => {
        const t = index / (ridgeSteps - 1);
        const point = neckCurve.getPointAt(t);

        return (
          <mesh
            key={`lamp-ridge-${t.toFixed(4)}`}
            castShadow
            receiveShadow
            position={[point.x, point.y, point.z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.098, 0.022, 8, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.42} />
          </mesh>
        );
      })}

      <mesh castShadow receiveShadow position={[headPoint.x, headPoint.y, headPoint.z]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color="#dd1515" roughness={0.18} metalness={0.68} />
      </mesh>

      <mesh
        castShadow
        receiveShadow
        position={[headPoint.x + shadeOffsetX * 0.5, headPoint.y + shadeOffsetY * 0.5, headPoint.z]}
        rotation={[0, 0, -Math.atan2(shadeOffsetX, shadeOffsetY)]}
      >
        <cylinderGeometry args={[0.1, 0.1, Math.hypot(shadeOffsetX, shadeOffsetY), 16]} />
        <meshStandardMaterial color="#cc1111" roughness={0.34} metalness={0.55} />
      </mesh>

      <group
        position={[headPoint.x + shadeOffsetX, headPoint.y + shadeOffsetY, headPoint.z]}
        rotation={[0, 0, -(Math.PI * 0.75)]}
      >
        <mesh castShadow receiveShadow>
          <latheGeometry args={[shadeProfile, 48]} />
          <meshStandardMaterial color="#dd1515" roughness={0.16} metalness={0.7} />
        </mesh>

        <mesh castShadow receiveShadow>
          <latheGeometry args={[shadeProfile, 48]} />
          <meshStandardMaterial color="#efe9cd" roughness={0.84} metalness={0} side={BackSide} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.85, 0.035, 12, 48]} />
          <meshStandardMaterial color="#cc1111" roughness={0.32} metalness={0.55} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#dd1515" roughness={0.18} metalness={0.7} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.15, 16]} />
          <meshStandardMaterial color="#131313" roughness={0.52} metalness={0.42} />
        </mesh>

        <mesh position={[0, 0.24, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color={isOn ? "#ffd39a" : "#2a2a2a"}
            emissive={isOn ? "#ffbf7f" : "#000000"}
            emissiveIntensity={isOn ? 0.95 : 0}
            roughness={0.35}
            metalness={0}
          />
        </mesh>
      </group>

      <pointLight
        color="#ffcf9a"
        decay={2}
        distance={2.2}
        intensity={isOn ? 1.15 : 0}
        position={[headPoint.x + shadeOffsetX - 0.03, headPoint.y + shadeOffsetY + 0.2, headPoint.z]}
      />

      <mesh castShadow receiveShadow position={[-0.62, 0.06, 0]}>
        <boxGeometry args={[0.18, 0.06, 0.09]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.45} metalness={0.38} />
      </mesh>
    </group>
  );
}
