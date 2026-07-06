import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BackSide, CatmullRomCurve3, Color, DoubleSide, Object3D, Vector2, Vector3 } from "three";
import { DESK_TOP_Y } from "../../../../constants/deskConstants";
import { getLampTargetStrength } from "../../utils/lampSchedule";

// isOn: null = automatic (follows sunset/sunrise), true/false = user override.
export function DeskLamp({ isOn = null, sceneQuality, worldHourRef }) {
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
  const baseBulbColor = useMemo(() => new Color("#ddd8ce"), []);
  const litBulbColor = useMemo(() => new Color("#ffe3b0"), []);
  const initialLampStrength = isOn ? 1 : 0;
  const lampPointLightEnabled = sceneQuality?.enableLampPointLight ?? true;
  const lampStrengthRef = useRef(initialLampStrength);
  const bulbMaterialRef = useRef(null);
  const shadeInnerMaterialRef = useRef(null);
  const lampPointLightRef = useRef(null);
  const lightConeMeshRef = useRef(null);
  const lightConeMaterialRef = useRef(null);

  // The shade group sits at the bulb-socket end and its lathe flares 1.35
  // units along the opening direction (√2/2, -√2/2, 0) to the rim. The
  // spotlight sits at the bulb just inside the shade; the visible beam starts
  // at the rim and widens until it reaches the desk surface at local y = 0.
  const lightCone = useMemo(() => {
    const socket = new Vector3(
      headPoint.x + shadeOffsetX,
      headPoint.y + shadeOffsetY,
      headPoint.z,
    );
    const direction = new Vector3(Math.SQRT1_2, -Math.SQRT1_2, 0);
    const rimOffset = 1.35;
    const totalLength = socket.y / -direction.y;
    const beamLength = totalLength - rimOffset;
    const rim = socket.clone().addScaledVector(direction, rimOffset);
    const bulb = socket.clone().addScaledVector(direction, 1.18);
    const center = rim.clone().addScaledVector(direction, beamLength * 0.5);
    const landing = socket.clone().addScaledVector(direction, totalLength);
    const spotTarget = new Object3D();
    spotTarget.position.copy(landing);
    return { beamLength, bulb, center, spotTarget };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const targetStrength = isOn != null
      ? (isOn ? 1 : 0)
      : worldHourRef?.current != null
        ? getLampTargetStrength(worldHourRef.current)
        : 0;
    lampStrengthRef.current += (targetStrength - lampStrengthRef.current) * Math.min(1, delta * 2.1);
    const lampStrength = lampStrengthRef.current;

    if (bulbMaterialRef.current) {
      bulbMaterialRef.current.color.copy(baseBulbColor).lerp(litBulbColor, lampStrength);
      bulbMaterialRef.current.emissiveIntensity = lampStrength * 2.8;
    }
    if (shadeInnerMaterialRef.current) {
      shadeInnerMaterialRef.current.emissiveIntensity = lampStrength * 0.65;
    }
    if (lampPointLightRef.current) {
      lampPointLightRef.current.intensity = lampPointLightEnabled ? lampStrength * 3.2 : 0;
    }
    if (lightConeMeshRef.current && lightConeMaterialRef.current) {
      lightConeMeshRef.current.visible = lampStrength > 0.02;
      lightConeMaterialRef.current.opacity = lampStrength * 0.02;
    }
  });

  return (
    <group
      position={[-0.9, DESK_TOP_Y + 0.04, -0.4]}
      rotation={[0, 0.24 - Math.PI / 6, 0]}
      scale={[0.15, 0.15, 0.15]}
    >
      <mesh name="desk-lamp-hitbox" position={[0.2, 1.8, 0]}>
        <cylinderGeometry args={[1.5, 1.2, 3.9, 12]} />
        <meshBasicMaterial color="#000000" colorWrite={false} depthWrite={false} opacity={0} transparent />
      </mesh>

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
          <meshStandardMaterial
            ref={shadeInnerMaterialRef}
            color="#efe9cd"
            emissive="#ff9d4f"
            emissiveIntensity={0}
            roughness={0.84}
            metalness={0}
            side={BackSide}
          />
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

        {/* Screw-base neck connecting the socket to the glass envelope. */}
        <mesh castShadow position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.075, 0.068, 0.52, 16]} />
          <meshStandardMaterial color="#9a9186" roughness={0.4} metalness={0.75} />
        </mesh>

        {/* The bulb itself: a frosted glass envelope hanging into the shade
            with its glowing lower half visible at the opening. */}
        <mesh position={[0, 1.18, 0]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial
            color={initialLampStrength > 0 ? "#ffe3b0" : "#ddd8ce"}
            emissive="#ffb45f"
            emissiveIntensity={initialLampStrength * 2.8}
            roughness={0.3}
            metalness={0}
            ref={bulbMaterialRef}
          />
        </mesh>

      </group>

      <mesh
        ref={lightConeMeshRef}
        position={[lightCone.center.x, lightCone.center.y, lightCone.center.z]}
        rotation={[0, 0, -(Math.PI * 0.75)]}
        visible={false}
      >
        <cylinderGeometry args={[0.85, 1.2, lightCone.beamLength, 20, 1, true]} />
        <meshBasicMaterial
          ref={lightConeMaterialRef}
          blending={AdditiveBlending}
          color="#ffd9a0"
          depthWrite={false}
          opacity={0}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <primitive object={lightCone.spotTarget} />
      <spotLight
        angle={0.42}
        castShadow={(sceneQuality?.enableShadows ?? false) && lampPointLightEnabled}
        color="#ffbe80"
        decay={0}
        distance={1.6}
        intensity={initialLampStrength * 3.2}
        penumbra={0.5}
        position={[lightCone.bulb.x, lightCone.bulb.y, lightCone.bulb.z]}
        ref={lampPointLightRef}
        shadow-bias={-0.0003}
        shadow-camera-near={0.05}
        shadow-mapSize={[512, 512]}
        shadow-normalBias={0.015}
        target={lightCone.spotTarget}
        visible={lampPointLightEnabled}
      />

      <mesh castShadow receiveShadow position={[-0.62, 0.06, 0]}>
        <boxGeometry args={[0.18, 0.06, 0.09]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.45} metalness={0.38} />
      </mesh>
    </group>
  );
}
