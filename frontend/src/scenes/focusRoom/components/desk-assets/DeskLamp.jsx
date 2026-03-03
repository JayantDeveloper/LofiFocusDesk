import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, CatmullRomCurve3, Color, Vector2, Vector3 } from "three";
import { DESK_TOP_Y } from "../../../../constants/deskConstants";

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothStep(edge0, edge1, value) {
  const width = Math.max(0.0001, edge1 - edge0);
  const t = clamp01((value - edge0) / width);
  return t * t * (3 - 2 * t);
}

function normalizeHour(hour) {
  return ((hour % 24) + 24) % 24;
}

function getLampTargetStrength(worldHour) {
  const hour = normalizeHour(worldHour);
  const sunsetFadeIn = smoothStep(17, 19.5, hour);
  const sunriseFadeOut = 1 - smoothStep(5, 7.5, hour);
  return Math.max(sunsetFadeIn, sunriseFadeOut);
}

export function DeskLamp({ isOn = false, worldHourRef }) {
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

  const ridgeSteps = 18;
  const headPoint = neckCurve.getPointAt(1);
  const shadeOffsetX = 0.48;
  const shadeOffsetY = 0.62;
  const baseBulbColor = useMemo(() => new Color("#2a2a2a"), []);
  const litBulbColor = useMemo(() => new Color("#ffd39a"), []);
  const litBulbEmissive = useMemo(() => new Color("#ffbf7f"), []);
  const initialLampStrength = useMemo(() => {
    if (worldHourRef?.current != null) return getLampTargetStrength(worldHourRef.current);
    return isOn ? 1 : 0;
  }, [isOn, worldHourRef]);
  const lampStrengthRef = useRef(initialLampStrength);
  const bulbMaterialRef = useRef(null);
  const lampPointLightRef = useRef(null);

  useFrame((_, delta) => {
    const targetStrength = worldHourRef?.current != null
      ? getLampTargetStrength(worldHourRef.current)
      : (isOn ? 1 : 0);
    lampStrengthRef.current += (targetStrength - lampStrengthRef.current) * Math.min(1, delta * 2.1);
    const lampStrength = lampStrengthRef.current;

    if (bulbMaterialRef.current) {
      bulbMaterialRef.current.color.copy(baseBulbColor).lerp(litBulbColor, lampStrength);
      bulbMaterialRef.current.emissive.copy(litBulbEmissive).multiplyScalar(lampStrength);
      bulbMaterialRef.current.emissiveIntensity = lampStrength * 0.95;
    }
    if (lampPointLightRef.current) {
      lampPointLightRef.current.intensity = lampStrength * 1.15;
    }
  });

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
        <tubeGeometry args={[neckCurve, 56, 0.09, 10, false]} />
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
            <torusGeometry args={[0.098, 0.022, 6, 12]} />
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
          <latheGeometry args={[shadeProfile, 32]} />
          <meshStandardMaterial color="#dd1515" roughness={0.16} metalness={0.7} />
        </mesh>

        <mesh castShadow receiveShadow>
          <latheGeometry args={[shadeProfile, 32]} />
          <meshStandardMaterial color="#efe9cd" roughness={0.84} metalness={0} side={BackSide} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.85, 0.035, 10, 28]} />
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
            color={initialLampStrength > 0 ? "#ffd39a" : "#2a2a2a"}
            emissive="#ffbf7f"
            emissiveIntensity={initialLampStrength * 0.95}
            roughness={0.35}
            metalness={0}
            ref={bulbMaterialRef}
          />
        </mesh>
      </group>

      <pointLight
        color="#ffcf9a"
        decay={2}
        distance={2.2}
        intensity={initialLampStrength * 1.15}
        position={[headPoint.x + shadeOffsetX - 0.03, headPoint.y + shadeOffsetY + 0.2, headPoint.z]}
        ref={lampPointLightRef}
      />

      <mesh castShadow receiveShadow position={[-0.62, 0.06, 0]}>
        <boxGeometry args={[0.18, 0.06, 0.09]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.45} metalness={0.38} />
      </mesh>
    </group>
  );
}
