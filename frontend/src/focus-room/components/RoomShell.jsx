import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, DoubleSide, MeshBasicMaterial } from "three";

const CITY_BUILDINGS = [
  { accent: "#93a6bc", antenna: 0.2, color: "#d85f5f", depth: 0.68, height: 0.92, id: "b1", roof: 0.08, width: 0.34, x: -0.82, z: 0.1 },
  { accent: "#a1b1c3", color: "#e0873d", depth: 0.72, height: 1.24, id: "b2", roof: 0.1, width: 0.4, x: -0.18, z: 0.1 },
  { accent: "#8a9caf", color: "#d2b44b", depth: 0.42, height: 1.56, id: "b3", roof: 0.06, width: 0.32, x: 0.46, z: 0.1 },
  { accent: "#9eb0c4", antenna: 0.15, color: "#7ca54a", depth: 0.48, height: 2.48, id: "b4", roof: 0.12, width: 0.4, x: -0.82, z: 0.56 },
  { accent: "#92a5bc", color: "#4f9d67", depth: 0.4, height: 1.22, id: "b5", roof: 0.08, width: 0.33, x: 0.46, z: 0.56 },
  { accent: "#9eb2c7", color: "#3d9ea4", depth: 0.45, height: 2.02, id: "b6", roof: 0.08, width: 0.36, x: -0.82, z: 1.02 },
  { accent: "#8ca0b6", antenna: 0.22, color: "#4d7dcb", depth: 0.53, height: 2.08, id: "b7", roof: 0.14, width: 0.42, x: -0.18, z: 1.02 },
  { accent: "#8da2b9", color: "#6b63d4", depth: 0.56, height: 2.64, id: "b8", roof: 0.16, width: 0.45, x: 0.46, z: 1.02 },
  { accent: "#9bb0c5", color: "#8b5ad8", depth: 0.52, height: 2.2, id: "b9", roof: 0.12, width: 0.41, x: -0.82, z: 1.48 },
  { accent: "#8b9db4", color: "#b85ac7", depth: 0.49, height: 1.18, id: "b10", roof: 0.1, width: 0.39, x: -0.18, z: 1.48 },
  { accent: "#96a9bf", color: "#d45f8b", depth: 0.66, height: 1.72, id: "b11", roof: 0.08, width: 0.39, x: -0.18, z: 0.56 },
  { accent: "#9caec4", color: "#8d6e63", depth: 0.48, height: 1.31, id: "b12", roof: 0.06, width: 0.37, x: 0.46, z: 1.48 },
  { accent: "#9bb1c9", color: "#3f6a9b", depth: 0.52, height: 2.5, id: "b13", roof: 0.12, width: 0.4, x: 0.66, z: 1.42 },
  { accent: "#9eb5cc", color: "#5a8f4e", depth: 0.46, height: 1.58, id: "b14", roof: 0.08, width: 0.36, x: 0.84, z: 1.54 },
  { accent: "#9cb2c7", color: "#6f64c8", depth: 0.5, height: 2.18, id: "b15", roof: 0.1, width: 0.38, x: 1.02, z: 1.66 },
  { accent: "#99afc5", antenna: 0.16, color: "#4f7b86", depth: 0.44, height: 1.42, id: "b16", roof: 0.08, width: 0.35, x: 0.68, z: 1.72 },
];

const LEFT_WALL_X = -4.0;
const RIGHT_WALL_X = 1.6;
const WINDOW_CENTER_Y = 1.445;
const WINDOW_CENTER_Z = -0.79;
const WINDOW_HEIGHT = 1.15;
const WINDOW_WIDTH = 1.75;
const WINDOW_GLASS_X = LEFT_WALL_X + 0.12;
const WINDOW_FRAME_X = LEFT_WALL_X + 0.18;
const WINDOW_SILL_X = LEFT_WALL_X + 0.21;
const OUTSIDE_SCENE_X = LEFT_WALL_X - 1.4;
const OUTSIDE_CLUSTER_Z_SHIFT = -0.92;
const BUILDING_HEIGHT_SCALE = 0.75;
const MIN_BUILDING_WIDTH = 0.38;
const MIN_BUILDING_DEPTH = 0.48;
const FRONT_WINDOW_INSET = 0.0036;
const SIDE_WINDOW_INSET = 0.0036;
const SUN_RAY_LAYER_COUNT = 32;
const SUN_RAY_RANDOM_SEED = 42891;
const SUN_X = 0.46;
const SUN_Z = 1.48;
const SUN_Y = WINDOW_CENTER_Y + 1.02;

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return (min = 0, max = 1) => {
    state = (1664525 * state + 1013904223) >>> 0;
    return min + ((state / 4294967296) * (max - min));
  };
}

function createSunRayLayers() {
  const random = createSeededRandom(SUN_RAY_RANDOM_SEED);
  return Array.from({ length: SUN_RAY_LAYER_COUNT }, (_, index) => {
    const t = index / Math.max(1, SUN_RAY_LAYER_COUNT - 1);
    const inverseT = 1 - t;
    return {
      baseOpacity: (0.013 + inverseT * 0.01) * random(0.86, 1.14),
      driftX: random(0.004, 0.016),
      driftY: random(0.002, 0.01),
      driftZ: random(0.001, 0.008),
      height: 0.14 + t * 0.64 + random(-0.02, 0.03),
      phase: random(0, Math.PI * 2),
      position: [
        WINDOW_FRAME_X + 0.18 + t * 0.95 + random(-0.04, 0.04),
        WINDOW_CENTER_Y + 0.26 - t * 0.22 + random(-0.05, 0.05),
        WINDOW_CENTER_Z + random(-0.24, 0.24),
      ],
      rotation: [0.02 + random(-0.06, 0.06), -0.28 + random(-0.15, 0.15), random(-0.15, 0.15)],
      width: 0.52 + t * 3.2 + random(-0.08, 0.08),
    };
  });
}

function getTwilightFactor(sunHeight) {
  const horizonBand = 0.5;
  const normalized = Math.max(0, 1 - Math.abs(sunHeight) / horizonBand);
  return normalized * normalized * (3 - 2 * normalized);
}

function CityBuilding({ building, frontWindowMaterial, sideWindowMaterial }) {
  const scaledHeight = building.height * BUILDING_HEIGHT_SCALE;
  const scaledWidth = Math.max(building.width, MIN_BUILDING_WIDTH);
  const scaledDepth = Math.max(building.depth, MIN_BUILDING_DEPTH);
  const windowRows = Math.max(3, Math.floor(scaledHeight / 0.24));
  const windowColsFront = Math.max(2, Math.floor(scaledWidth / 0.1));
  const windowColsSide = Math.max(2, Math.floor(scaledDepth / 0.11));
  const yStep = windowRows > 1 ? (scaledHeight - 0.34) / (windowRows - 1) : 0;
  const zStepFront = windowColsFront > 1 ? (scaledWidth * 0.64) / (windowColsFront - 1) : 0;
  const xStepSide = windowColsSide > 1 ? (scaledDepth * 0.62) / (windowColsSide - 1) : 0;

  return (
    <group position={[building.x, 0, building.z]}>
      <mesh castShadow receiveShadow position={[0, scaledHeight * 0.5, 0]}>
        <boxGeometry args={[scaledDepth, scaledHeight, scaledWidth]} />
        <meshStandardMaterial color={building.color} roughness={0.88} />
        <group position={[0, -scaledHeight * 0.5, 0]}>
          {Array.from({ length: windowRows }).map((_, row) => (
            <group key={`${building.id}-row-${row}`}>
              {Array.from({ length: windowColsFront }).map((__, column) => (
                <mesh key={`${building.id}-front-${row}-${column}`} frustumCulled={false} material={frontWindowMaterial}
                  position={[scaledDepth * 0.5 + FRONT_WINDOW_INSET, 0.16 + row * yStep, -scaledWidth * 0.32 + column * zStepFront]}>
                  <boxGeometry args={[0.004, 0.048, 0.036]} />
                </mesh>
              ))}
              {Array.from({ length: windowColsSide }).map((__, column) => (
                <mesh key={`${building.id}-side-${row}-${column}`} frustumCulled={false} material={sideWindowMaterial}
                  position={[-scaledDepth * 0.31 + column * xStepSide, 0.16 + row * yStep, scaledWidth * 0.5 + SIDE_WINDOW_INSET]}>
                  <boxGeometry args={[0.032, 0.048, 0.004]} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      </mesh>
      <mesh castShadow receiveShadow position={[0, scaledHeight + building.roof * 0.5, 0]}>
        <boxGeometry args={[scaledDepth * 0.72, building.roof, scaledWidth * 0.72]} />
        <meshStandardMaterial color={building.accent} roughness={0.82} />
      </mesh>
      {building.antenna ? (
        <mesh castShadow position={[0, scaledHeight + building.roof + building.antenna * 0.5, 0]}>
          <cylinderGeometry args={[0.006, 0.006, building.antenna, 10]} />
          <meshStandardMaterial color="#b7bec8" roughness={0.4} metalness={0.7} />
        </mesh>
      ) : null}
    </group>
  );
}

export function RoomShell({ textures, worldHourRef }) {
  const skylineMaterialRef = useRef(null);
  const windowGlassMaterialRef = useRef(null);
  const skylineTargetColorRef = useRef(new Color());
  const glassTargetColorRef = useRef(new Color());
  const sunRef = useRef(null);
  const sunGlowMaterialRef = useRef(null);
  const sunLightRef = useRef(null);
  const moonRef = useRef(null);
  const moonGlowMaterialRef = useRef(null);
  const moonLightRef = useRef(null);
  const sunRayMeshRefs = useRef([]);
  const sunRayMaterialRefs = useRef([]);
  const daySkyColor = useMemo(() => new Color("#bfe4ff"), []);
  const twilightSkyColor = useMemo(() => new Color("#f6a2b4"), []);
  const nightSkyColor = useMemo(() => new Color("#010204"), []);
  const dayGlassColor = useMemo(() => new Color("#a5bfd6"), []);
  const nightGlassColor = useMemo(() => new Color("#223246"), []);
  const sunRayDayColor = useMemo(() => new Color("#ffe3b5"), []);
  const sunRayTwilightColor = useMemo(() => new Color("#ff9e5a"), []);
  const sunRayColorScratch = useMemo(() => new Color(), []);
  const sunRayLayers = useMemo(() => createSunRayLayers(), []);
  const frontWindowMaterial = useMemo(() => new MeshBasicMaterial({
    color: "#dcecff", depthWrite: false, polygonOffset: true,
    polygonOffsetFactor: -1, polygonOffsetUnits: -1, transparent: true, opacity: 0.56,
  }), []);
  const sideWindowMaterial = useMemo(() => new MeshBasicMaterial({
    color: "#d6e7fb", depthWrite: false, polygonOffset: true,
    polygonOffsetFactor: -1, polygonOffsetUnits: -1, transparent: true, opacity: 0.44,
  }), []);

  useEffect(() => {
    return () => { frontWindowMaterial.dispose(); sideWindowMaterial.dispose(); };
  }, [frontWindowMaterial, sideWindowMaterial]);

  useFrame((state, delta) => {
    const worldHour = worldHourRef?.current ?? 12;
    const solarAngle = ((worldHour - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(solarAngle);
    const dayFactor = Math.max(0, sunHeight);
    const nightFactor = Math.max(0, -sunHeight);
    const twilightFactor = getTwilightFactor(sunHeight);
    const isSunVisible = sunHeight >= 0;
    const isBuildingLightsOn = worldHour >= 18 || worldHour < 6;
    const elapsedSeconds = state.clock.getElapsedTime();

    const orbitX = SUN_X + Math.cos(solarAngle) * 0.82;
    const orbitY = WINDOW_CENTER_Y + 1.02 + Math.sin(solarAngle) * 0.98;
    const orbitZ = SUN_Z + Math.sin(solarAngle * 0.55) * 0.22;

    if (sunRef.current) {
      sunRef.current.position.set(orbitX, orbitY, orbitZ);
      sunRef.current.visible = isSunVisible;
      sunRef.current.material.emissiveIntensity = isSunVisible ? dayFactor * 2.8 + twilightFactor * 0.75 : 0;
    }
    if (sunGlowMaterialRef.current) sunGlowMaterialRef.current.setValues({ opacity: isSunVisible ? dayFactor * 0.27 + twilightFactor * 0.12 : 0 });
    if (sunLightRef.current) {
      sunLightRef.current.position.set(orbitX, orbitY, orbitZ);
      sunLightRef.current.intensity = isSunVisible ? dayFactor * 7.1 + twilightFactor * 1.2 : 0;
    }

    const moonAngle = solarAngle + Math.PI;
    const moonX = SUN_X + Math.cos(moonAngle) * 0.82;
    const moonY = WINDOW_CENTER_Y + 1.02 + Math.sin(moonAngle) * 0.98;
    const moonZ = SUN_Z + Math.sin(moonAngle * 0.55) * 0.22;

    if (moonRef.current) {
      moonRef.current.position.set(moonX, moonY, moonZ);
      moonRef.current.visible = !isSunVisible;
      moonRef.current.material.emissiveIntensity = !isSunVisible ? nightFactor * 0.34 + twilightFactor * 0.14 : 0;
    }
    if (moonGlowMaterialRef.current) moonGlowMaterialRef.current.setValues({ opacity: !isSunVisible ? nightFactor * 0.14 + twilightFactor * 0.06 : 0 });
    if (moonLightRef.current) {
      moonLightRef.current.position.set(moonX, moonY, moonZ);
      moonLightRef.current.intensity = !isSunVisible ? nightFactor * 1.6 + twilightFactor * 0.3 : 0;
    }

    if (skylineMaterialRef.current) {
      skylineTargetColorRef.current.copy(nightSkyColor).lerp(twilightSkyColor, twilightFactor).lerp(daySkyColor, dayFactor);
      skylineMaterialRef.current.color.lerp(skylineTargetColorRef.current, Math.min(1, delta * 0.55));
    }

    if (windowGlassMaterialRef.current) {
      glassTargetColorRef.current.copy(nightGlassColor).lerp(dayGlassColor, Math.min(1, dayFactor + twilightFactor * 0.2));
      windowGlassMaterialRef.current.color.lerp(glassTargetColorRef.current, Math.min(1, delta * 0.8));
      windowGlassMaterialRef.current.setValues({ opacity: 0.07 + dayFactor * 0.2 + twilightFactor * 0.04 });
    }

    const sunRayStrength = isSunVisible ? Math.min(1, Math.pow(dayFactor, 1.25) + twilightFactor * 0.38) : 0;
    sunRayColorScratch.copy(sunRayDayColor).lerp(sunRayTwilightColor, Math.min(1, twilightFactor * 0.75));

    sunRayLayers.forEach((layer, index) => {
      const mesh = sunRayMeshRefs.current[index];
      const material = sunRayMaterialRefs.current[index];
      if (!mesh || !material) return;
      if (sunRayStrength <= 0.001) { mesh.visible = false; return; }
      mesh.visible = true;
      const driftPhase = elapsedSeconds * 0.12 + layer.phase;
      mesh.position.set(
        layer.position[0] + Math.sin(driftPhase) * layer.driftX,
        layer.position[1] + Math.cos(driftPhase * 0.9) * layer.driftY,
        layer.position[2] + Math.sin(driftPhase * 0.7) * layer.driftZ,
      );
      mesh.rotation.set(
        layer.rotation[0] + Math.cos(driftPhase * 0.4) * 0.007,
        layer.rotation[1],
        layer.rotation[2] + Math.sin(driftPhase * 0.6) * 0.015,
      );
      material.opacity = layer.baseOpacity * sunRayStrength;
      material.color.copy(sunRayColorScratch);
    });

    if (isBuildingLightsOn) {
      frontWindowMaterial.color.set("#ffd86a");
      frontWindowMaterial.setValues({ opacity: 0.92 });
      sideWindowMaterial.color.set("#ffcc52");
      sideWindowMaterial.setValues({ opacity: 0.86 });
    } else {
      frontWindowMaterial.color.set("#dcecff");
      frontWindowMaterial.setValues({ opacity: 0.56 });
      sideWindowMaterial.color.set("#d6e7fb");
      sideWindowMaterial.setValues({ opacity: 0.44 });
    }
  });

  return (
    <group>
      <mesh receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry args={[8.6, 0.12, 7.4]} />
        <meshStandardMaterial color="#bda992" map={textures.wood} roughness={0.86} />
      </mesh>
      <mesh receiveShadow position={[0, 3.46, 0]}>
        <boxGeometry args={[8.6, 0.12, 7.4]} />
        <meshStandardMaterial color="#e4d7c8" map={textures.wall} roughness={0.94} />
      </mesh>
      <mesh receiveShadow position={[-1.4, 0.005, -1.5]}>
        <boxGeometry args={[3.4, 0.02, 2.4]} />
        <meshStandardMaterial color="#8b6750" map={textures.rug} roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[0, 1.7, -3.6]}>
        <boxGeometry args={[8.6, 3.4, 0.2]} />
        <meshStandardMaterial color="#dbcdbd" map={textures.wall} roughness={0.94} />
      </mesh>

      <group>
        <mesh receiveShadow position={[LEFT_WALL_X, 2.71, 0]}>
          <boxGeometry args={[0.2, 1.38, 7.4]} />
          <meshStandardMaterial color="#d8c9b8" map={textures.wall} roughness={0.94} />
        </mesh>
        <mesh receiveShadow position={[LEFT_WALL_X, 0.435, 0]}>
          <boxGeometry args={[0.2, 0.87, 7.4]} />
          <meshStandardMaterial color="#d8c9b8" map={textures.wall} roughness={0.94} />
        </mesh>
        <mesh receiveShadow position={[LEFT_WALL_X, WINDOW_CENTER_Y, -2.6825]}>
          <boxGeometry args={[0.2, WINDOW_HEIGHT, 2.035]} />
          <meshStandardMaterial color="#d8c9b8" map={textures.wall} roughness={0.94} />
        </mesh>
        <mesh receiveShadow position={[LEFT_WALL_X, WINDOW_CENTER_Y, 1.8925]}>
          <boxGeometry args={[0.2, WINDOW_HEIGHT, 3.615]} />
          <meshStandardMaterial color="#d8c9b8" map={textures.wall} roughness={0.94} />
        </mesh>
      </group>

      <mesh receiveShadow position={[RIGHT_WALL_X, 1.7, 0]}>
        <boxGeometry args={[0.2, 3.4, 7.4]} />
        <meshStandardMaterial color="#d8c9b8" map={textures.wall} roughness={0.94} />
      </mesh>

      <group>
        <mesh position={[WINDOW_GLASS_X, WINDOW_CENTER_Y, WINDOW_CENTER_Z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[WINDOW_WIDTH, WINDOW_HEIGHT]} />
          <meshStandardMaterial ref={windowGlassMaterialRef} color="#a5bfd6" metalness={0.1} roughness={0.08} transparent opacity={0.24} />
        </mesh>
        <mesh castShadow receiveShadow position={[WINDOW_FRAME_X, WINDOW_CENTER_Y + 0.62, WINDOW_CENTER_Z]}>
          <boxGeometry args={[0.12, 0.08, 1.88]} />
          <meshStandardMaterial color="#7a563d" map={textures.wood} roughness={0.72} />
        </mesh>
        <mesh castShadow receiveShadow position={[WINDOW_FRAME_X, WINDOW_CENTER_Y - 0.62, WINDOW_CENTER_Z]}>
          <boxGeometry args={[0.12, 0.08, 1.88]} />
          <meshStandardMaterial color="#7a563d" map={textures.wood} roughness={0.72} />
        </mesh>
        <mesh castShadow receiveShadow position={[WINDOW_FRAME_X, WINDOW_CENTER_Y, WINDOW_CENTER_Z - 0.93]}>
          <boxGeometry args={[0.12, 1.32, 0.08]} />
          <meshStandardMaterial color="#7a563d" map={textures.wood} roughness={0.72} />
        </mesh>
        <mesh castShadow receiveShadow position={[WINDOW_FRAME_X, WINDOW_CENTER_Y, WINDOW_CENTER_Z + 0.93]}>
          <boxGeometry args={[0.12, 1.32, 0.08]} />
          <meshStandardMaterial color="#7a563d" map={textures.wood} roughness={0.72} />
        </mesh>
        <mesh castShadow receiveShadow position={[WINDOW_SILL_X, WINDOW_CENTER_Y - 0.65, WINDOW_CENTER_Z]}>
          <boxGeometry args={[0.35, 0.06, 1.98]} />
          <meshStandardMaterial color="#6d4f3a" map={textures.wood} roughness={0.72} />
        </mesh>
      </group>

      <group position={[OUTSIDE_SCENE_X, 0, WINDOW_CENTER_Z]}>
        <mesh position={[0.01, WINDOW_CENTER_Y + 0.14, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[3.2, 2.5]} />
          <meshBasicMaterial ref={skylineMaterialRef} color="#c8dcf0" map={textures.skyline} />
        </mesh>

        <group position={[0, 0, OUTSIDE_CLUSTER_Z_SHIFT]}>
          <mesh ref={sunRef} position={[SUN_X, SUN_Y, SUN_Z]}>
            <sphereGeometry args={[0.31, 24, 24]} />
            <meshStandardMaterial color="#ffd25a" emissive="#ffc64a" emissiveIntensity={2.6} />
          </mesh>
          <mesh position={[SUN_X + 0.01, SUN_Y, SUN_Z - 0.02]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.16, 1.16]} />
            <meshBasicMaterial ref={sunGlowMaterialRef} color="#ffdca2" transparent opacity={0.24} side={DoubleSide} depthWrite={false} />
          </mesh>
          <pointLight ref={sunLightRef} color="#ffc977" intensity={6.8} distance={9.4} decay={2} position={[SUN_X, SUN_Y, SUN_Z]} />

          <mesh ref={moonRef} position={[SUN_X, SUN_Y, SUN_Z]}>
            <sphereGeometry args={[0.24, 20, 20]} />
            <meshStandardMaterial color="#92a7c2" emissive="#7f9bc3" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[SUN_X + 0.01, SUN_Y, SUN_Z - 0.02]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.92, 0.92]} />
            <meshBasicMaterial ref={moonGlowMaterialRef} color="#9db7e1" transparent opacity={0.12} side={DoubleSide} depthWrite={false} />
          </mesh>
          <pointLight ref={moonLightRef} color="#94b7f6" intensity={0.5} distance={7.6} decay={2} position={[SUN_X, SUN_Y, SUN_Z]} />

          {CITY_BUILDINGS.map((building) => (
            <CityBuilding key={building.id} building={building} frontWindowMaterial={frontWindowMaterial} sideWindowMaterial={sideWindowMaterial} />
          ))}

          <mesh receiveShadow position={[-0.38, 0.04, 0]}>
            <boxGeometry args={[0.54, 0.05, 2.9]} />
            <meshStandardMaterial color="#6b8f4a" roughness={0.96} />
          </mesh>
          <mesh receiveShadow position={[-0.22, 0.03, -0.1]}>
            <boxGeometry args={[0.85, 0.06, 2.8]} />
            <meshStandardMaterial color="#556270" roughness={0.98} />
          </mesh>
        </group>
      </group>

      <group>
        {sunRayLayers.map((layer, index) => (
          <mesh
            key={`sun-ray-layer-${index}`}
            frustumCulled={false}
            position={layer.position}
            ref={(mesh) => { sunRayMeshRefs.current[index] = mesh; }}
            renderOrder={12}
            rotation={layer.rotation}
          >
            <planeGeometry args={[layer.width, layer.height]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color="#ffe3b5"
              depthWrite={false}
              opacity={0}
              ref={(material) => { sunRayMaterialRefs.current[index] = material; }}
              side={DoubleSide}
              transparent
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
