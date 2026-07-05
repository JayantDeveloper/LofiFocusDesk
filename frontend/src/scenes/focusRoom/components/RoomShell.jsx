import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  Object3D,
  RepeatWrapping,
} from "three";
import {
  clamp01,
  getDayBlend,
  getMoonPhaseFactor,
  getTwilightFactor,
  smooth01,
} from "../utils/lightingMath";

const CITY_BUILDINGS = [
  {
    accent: "#93a6bc",
    antenna: 0.1,
    color: "#d85f5f",
    depth: 1.6,
    height: 1.62,
    id: "b1",
    roof: 0.08,
    width: 0.3,
    x: -1.2,
    z: 0.1,
  },
  {
    accent: "#a1b1c3",
    color: "#e0873d",
    depth: 0.72,
    height: 1.24,
    id: "b2",
    roof: 0.03,
    width: 0.4,
    x: -0.18,
    z: 0.1,
  },
  {
    accent: "#8a9caf",
    color: "#d2b44b",
    depth: 0.42,
    height: 1.56,
    id: "b3",
    roof: 0.06,
    width: 0.32,
    x: 0.46,
    z: -0.05,
  },
  {
    accent: "#9eb0c4",
    antenna: 0.15,
    color: "#7ca54a",
    depth: 0.48,
    height: 2.48,
    id: "b4",
    roof: 0.12,
    width: 0.4,
    x: -0.82,
    z: 0.56,
  },
  {
    accent: "#92a5bc",
    color: "#4f9d67",
    depth: 0.4,
    height: 1.22,
    id: "b5",
    roof: 0.08,
    width: 0.43,
    x: 0.46,
    z: 0.56,
  },
  {
    accent: "#9eb2c7",
    color: "#3d9ea4",
    depth: 0.45,
    height: 2.02,
    id: "b6",
    roof: 0.08,
    width: 0.36,
    x: -0.82,
    z: 1.02,
  },
  {
    accent: "#8ca0b6",
    antenna: 0.22,
    color: "#4d7dcb",
    depth: 0.53,
    height: 2.08,
    id: "b7",
    roof: 0.14,
    width: 0.42,
    x: -0.18,
    z: 1.02,
  },
  {
    accent: "#8da2b9",
    color: "#6b63d4",
    depth: 0.56,
    height: 2.64,
    id: "b8",
    roof: 0.08,
    width: 0.45,
    x: 0.46,
    z: 1.02,
  },
  {
    accent: "#9bb0c5",
    antenna: 0.16,
    color: "#8b5ad8",
    depth: 0.52,
    height: 2.2,
    id: "b9",
    roof: 0.07,
    width: 0.36,
    x: -0.82,
    z: 1.48,
  },
  {
    accent: "#8b9db4",
    color: "#b85ac7",
    depth: 0.49,
    height: 1.18,
    id: "b10",
    roof: 0.03,
    width: 0.39,
    x: -0.18,
    z: 1.48,
  },
  {
    accent: "#96a9bf",
    color: "#d45f8b",
    depth: 0.66,
    height: 1.72,
    id: "b11",
    roof: 0.08,
    width: 0.39,
    x: -0.18,
    z: 0.56,
  },
  {
    accent: "#9caec4",
    color: "#8d6e63",
    depth: 0.48,
    height: 1.31,
    id: "b12",
    roof: 0.06,
    width: 0.37,
    x: 0.46,
    z: 1.48,
  },
  {
    accent: "#9bb1c9",
    color: "#3f6a9b",
    depth: 0.52,
    height: 2.5,
    id: "b13",
    roof: 0.06,
    width: 0.4,
    x: 0.66,
    z: 1.42,
  },
  {
    accent: "#9eb5cc",
    color: "#5a8f4e",
    depth: 0.46,
    height: 1.58,
    id: "b14",
    roof: 0.08,
    width: 0.5,
    x: 1.0,
    z: 1.24,
  },
  {
    accent: "#9cb2c7",
    color: "#6f64c8",
    depth: 0.5,
    height: 1.48,
    id: "b15",
    roof: 0.1,
    width: 0.32,
    x: 1.02,
    z: 1.76,
  },
  {
    accent: "#99afc5",
    color: "#4f7b86",
    depth: 0.44,
    height: 1.82,
    id: "b16",
    roof: 0.08,
    width: 0.35,
    x: 0.82,
    z: 1.72,
  },
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
const BUILDING_WINDOW_DENSITY_BOOST = 1.3;
const FRONT_WINDOW_INSET = 0.0036;
const SIDE_WINDOW_INSET = 0.0036;
const MAX_SUN_RAY_LAYER_COUNT = 20;
const SUN_RAY_RANDOM_SEED = 42891;
const SUN_X = 0.46;
const SUN_Z = 1.48;
const SUN_Y = WINDOW_CENTER_Y + 1.02;
const SKY_BACKDROP_X = -1.4;
const FAR_CLOUD_X = -1.3;
const NEAR_CLOUD_X = -1.18;
const SKY_PLANE_WIDTH = 4.8;
const SKY_PLANE_HEIGHT = 3.6;
const ORBIT_CENTER_Y = WINDOW_CENTER_Y + 1.4;
const ORBIT_RADIUS_Y = 1.1;
const SHOW_SKY_BODIES = import.meta.env.VITE_SHOW_SKY_BODIES === "1";
const SHOW_CLOUDS = import.meta.env.VITE_SHOW_CLOUDS === "1";
const SHOW_STARS = import.meta.env.VITE_SHOW_STARS === "1";
const SHOW_RAIN = import.meta.env.VITE_SHOW_RAIN === "1";

const RAIN_DROP_COUNT = 130;
const RAIN_SEED = 47021;
const RAIN_MIN_Y = WINDOW_CENTER_Y - 0.62;
const RAIN_MAX_Y = WINDOW_CENTER_Y + 0.78;
const RAIN_RIPPLE_COUNT = 7;
const RAIN_RIPPLE_PERIOD_S = 0.9;
const SILL_TOP_Y = WINDOW_CENTER_Y - 0.65 + 0.031;

// Rain streaks just outside the glass: LineSegments with one short vertical
// segment per drop, falling and wrapping inside the window bounds.
function createRainDrops() {
  const random = createSeededRandom(RAIN_SEED);
  const positions = new Float32Array(RAIN_DROP_COUNT * 6);
  const drops = [];
  for (let index = 0; index < RAIN_DROP_COUNT; index += 1) {
    const x = WINDOW_GLASS_X - 0.06 + random(-0.025, 0.02);
    const y = random(RAIN_MIN_Y, RAIN_MAX_Y);
    const z = WINDOW_CENTER_Z + random(-1.0, 1.0);
    const length = 0.05 + random(0, 0.04);
    positions.set([x, y, z, x, y + length, z], index * 6);
    drops.push({ length, speed: random(1.1, 2.1) });
  }
  return { positions, drops };
}

function createRainRipples() {
  const random = createSeededRandom(RAIN_SEED + 991);
  return Array.from({ length: RAIN_RIPPLE_COUNT }, () => ({
    phase: random(0, 1),
    x: WINDOW_SILL_X + random(-0.14, 0.14),
    z: WINDOW_CENTER_Z + random(-0.95, 0.95),
  }));
}

const STAR_FIELD_SEED = 90217;
// Three layers so stars can twinkle out of phase and vary in size without a
// per-star shader; sizes/opacities also read as brightness variety.
const STAR_LAYERS = [
  { count: 70, size: 0.034, baseOpacity: 0.6, twinkleSpeed: 0.9, phase: 0 },
  { count: 55, size: 0.05, baseOpacity: 0.75, twinkleSpeed: 1.5, phase: 2.1 },
  { count: 30, size: 0.072, baseOpacity: 0.9, twinkleSpeed: 0.6, phase: 4.2 },
];

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return (min = 0, max = 1) => {
    state = (1664525 * state + 1013904223) >>> 0;
    return min + (state / 4294967296) * (max - min);
  };
}

function createSunRayLayers(layerCount = MAX_SUN_RAY_LAYER_COUNT) {
  const random = createSeededRandom(SUN_RAY_RANDOM_SEED);
  return Array.from({ length: layerCount }, (_, index) => {
    const t = index / Math.max(1, layerCount - 1);
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
      rotation: [
        0.02 + random(-0.06, 0.06),
        -0.28 + random(-0.15, 0.15),
        random(-0.15, 0.15),
      ],
      width: 0.52 + t * 3.2 + random(-0.08, 0.08),
    };
  });
}

function createCloudTexture(seed) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const random = createSeededRandom(seed);
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 34; index += 1) {
    const x = random(0, canvas.width);
    const y = random(8, canvas.height - 8);
    const radiusX = random(36, 96);
    const radiusY = random(12, 42);
    const gradient = context.createRadialGradient(x, y, 0, x, y, radiusX);
    gradient.addColorStop(
      0,
      `rgba(255,255,255,${random(0.2, 0.44).toFixed(3)})`,
    );
    gradient.addColorStop(
      0.72,
      `rgba(255,255,255,${random(0.06, 0.2).toFixed(3)})`,
    );
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(
      x,
      y,
      radiusX,
      radiusY,
      random(-0.25, 0.25),
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.needsUpdate = true;
  return texture;
}

const DUST_MOTE_COUNT = 80;
const DUST_MOTE_SEED = 61873;
const DUST_MIN_Y = WINDOW_CENTER_Y - 0.8;
const DUST_MAX_Y = WINDOW_CENTER_Y + 0.55;

// Floating dust in the daylight beam: seeded start positions plus per-mote
// drift parameters, all mutated in place each frame.
function createDustMotes() {
  const random = createSeededRandom(DUST_MOTE_SEED);
  const positions = new Float32Array(DUST_MOTE_COUNT * 3);
  const motes = [];
  for (let index = 0; index < DUST_MOTE_COUNT; index += 1) {
    const x = WINDOW_FRAME_X + random(0.12, 1.5);
    const y = random(DUST_MIN_Y, DUST_MAX_Y);
    const z = WINDOW_CENTER_Z + random(-0.62, 0.62);
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
    motes.push({
      x,
      z,
      riseSpeed: random(0.012, 0.045),
      swayAmp: random(0.01, 0.05),
      swayFreq: random(0.2, 0.7),
      phase: random(0, Math.PI * 2),
    });
  }
  return { positions, motes };
}

// Seeded star positions scattered in a band just in front of the sky backdrop
// plane, biased toward the upper sky, with x jitter for a little parallax.
function createStarPositions(seed, count) {
  const random = createSeededRandom(seed);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = SKY_BACKDROP_X + random(0.08, 0.55);
    positions[index * 3 + 1] =
      WINDOW_CENTER_Y - 0.9 + Math.pow(random(0, 1), 0.75) * 2.6;
    positions[index * 3 + 2] = random(-2.35, 2.35);
  }
  return positions;
}

// Fog-and-droplets texture layered over the glass at night (condensation).
function createCondensationTexture(seed) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const random = createSeededRandom(seed);
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Fog band, heavier toward the bottom edge like breath on cold glass.
  const fog = context.createLinearGradient(0, 0, 0, canvas.height);
  fog.addColorStop(0, "rgba(255,255,255,0.10)");
  fog.addColorStop(0.55, "rgba(255,255,255,0.16)");
  fog.addColorStop(1, "rgba(255,255,255,0.34)");
  context.fillStyle = fog;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 90; index += 1) {
    const x = random(0, canvas.width);
    const y = random(0, canvas.height);
    const radius = random(1.2, 4.2);
    const droplet = context.createRadialGradient(x, y, 0, x, y, radius);
    droplet.addColorStop(0, `rgba(255,255,255,${random(0.16, 0.34).toFixed(3)})`);
    droplet.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = droplet;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function smoothStep(edge0, edge1, value) {
  const width = Math.max(0.0001, edge1 - edge0);
  return smooth01((value - edge0) / width);
}

function getNightLightingStrength(worldHour) {
  const hour = ((worldHour % 24) + 24) % 24;
  const sunsetFadeIn = smoothStep(17, 19.5, hour);
  const sunriseFadeOut = 1 - smoothStep(5, 7.5, hour);
  return clamp01(Math.max(sunsetFadeIn, sunriseFadeOut));
}

function increaseWindowCount(value) {
  return Math.round(value * BUILDING_WINDOW_DENSITY_BOOST);
}

function CityBuilding({ building, frontWindowMaterial, sideWindowMaterial }) {
  const scaledHeight = building.height * BUILDING_HEIGHT_SCALE;
  const scaledWidth = Math.max(building.width, MIN_BUILDING_WIDTH);
  const scaledDepth = Math.max(building.depth, MIN_BUILDING_DEPTH);
  const windowRows = Math.max(3, increaseWindowCount(scaledHeight / 0.29));
  const windowColsFront = Math.max(2, increaseWindowCount(scaledWidth / 0.14));
  const windowColsSide = Math.max(2, increaseWindowCount(scaledDepth / 0.15));
  const yStep = windowRows > 1 ? (scaledHeight - 0.34) / (windowRows - 1) : 0;
  const zStepFront =
    windowColsFront > 1 ? (scaledWidth * 0.64) / (windowColsFront - 1) : 0;
  const xStepSide =
    windowColsSide > 1 ? (scaledDepth * 0.62) / (windowColsSide - 1) : 0;
  const frontWindowRef = useRef(null);
  const sideWindowRef = useRef(null);
  const frontWindowOffsets = useMemo(() => {
    const offsets = [];
    for (let row = 0; row < windowRows; row += 1) {
      for (let column = 0; column < windowColsFront; column += 1) {
        offsets.push([
          scaledDepth * 0.5 + FRONT_WINDOW_INSET,
          0.16 + row * yStep,
          -scaledWidth * 0.32 + column * zStepFront,
        ]);
      }
    }
    return offsets;
  }, [scaledDepth, scaledWidth, windowColsFront, windowRows, yStep, zStepFront]);
  const sideWindowOffsets = useMemo(() => {
    const offsets = [];
    for (let row = 0; row < windowRows; row += 1) {
      for (let column = 0; column < windowColsSide; column += 1) {
        offsets.push([
          -scaledDepth * 0.31 + column * xStepSide,
          0.16 + row * yStep,
          scaledWidth * 0.5 + SIDE_WINDOW_INSET,
        ]);
      }
    }
    return offsets;
  }, [scaledDepth, scaledWidth, windowColsSide, windowRows, xStepSide, yStep]);

  useLayoutEffect(() => {
    if (!frontWindowRef.current) return;
    const matrixProxy = new Object3D();
    frontWindowOffsets.forEach((offset, index) => {
      matrixProxy.position.set(offset[0], offset[1], offset[2]);
      matrixProxy.updateMatrix();
      frontWindowRef.current.setMatrixAt(index, matrixProxy.matrix);
    });
    frontWindowRef.current.instanceMatrix.needsUpdate = true;
  }, [frontWindowOffsets]);

  useLayoutEffect(() => {
    if (!sideWindowRef.current) return;
    const matrixProxy = new Object3D();
    sideWindowOffsets.forEach((offset, index) => {
      matrixProxy.position.set(offset[0], offset[1], offset[2]);
      matrixProxy.updateMatrix();
      sideWindowRef.current.setMatrixAt(index, matrixProxy.matrix);
    });
    sideWindowRef.current.instanceMatrix.needsUpdate = true;
  }, [sideWindowOffsets]);

  return (
    <group position={[building.x, 0, building.z]}>
      <mesh castShadow receiveShadow position={[0, scaledHeight * 0.5, 0]}>
        <boxGeometry args={[scaledDepth, scaledHeight, scaledWidth]} />
        <meshLambertMaterial color={building.color} />
        <group position={[0, -scaledHeight * 0.5, 0]}>
          <instancedMesh
            ref={frontWindowRef}
            args={[null, null, frontWindowOffsets.length]}
            material={frontWindowMaterial}
          >
            <boxGeometry args={[0.004, 0.048, 0.036]} />
          </instancedMesh>
          <instancedMesh
            ref={sideWindowRef}
            args={[null, null, sideWindowOffsets.length]}
            material={sideWindowMaterial}
          >
            <boxGeometry args={[0.032, 0.048, 0.004]} />
          </instancedMesh>
        </group>
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[0, scaledHeight + building.roof * 0.5, 0]}
      >
        <boxGeometry
          args={[scaledDepth * 0.72, building.roof, scaledWidth * 0.72]}
        />
        <meshLambertMaterial color={building.accent} />
      </mesh>
      {building.antenna ? (
        <mesh
          castShadow
          position={[
            0,
            scaledHeight + building.roof + building.antenna * 0.5,
            0,
          ]}
        >
          <cylinderGeometry args={[0.006, 0.006, building.antenna, 10]} />
          <meshLambertMaterial color="#b7bec8" />
        </mesh>
      ) : null}
    </group>
  );
}

const RoomShellComponent = function RoomShell({
  sceneQuality,
  textures,
  worldHourRef,
}) {
  const skylineMaterialRef = useRef(null);
  const windowGlassMaterialRef = useRef(null);
  const skylineTargetColorRef = useRef(new Color());
  const glassTargetColorRef = useRef(new Color());
  const sunRef = useRef(null);
  const sunGlowMaterialRef = useRef(null);
  const moonRef = useRef(null);
  const moonGlowMaterialRef = useRef(null);
  const sunLightRef = useRef(null);
  const moonLightRef = useRef(null);
  const cityGlowRef = useRef(null);
  const nearCloudMaterialRef = useRef(null);
  const farCloudMaterialRef = useRef(null);
  const sunRayMeshRefs = useRef([]);
  const sunRayMaterialRefs = useRef([]);
  const moonPhaseFactor = useMemo(() => getMoonPhaseFactor(), []);
  const daySkyColor = useMemo(() => new Color("#bfe4ff"), []);
  const twilightSkyColor = useMemo(() => new Color("#f6a2b4"), []);
  const sunriseSkyColor = useMemo(() => new Color("#f6cdb1"), []);
  const sunsetSkyColor = useMemo(() => new Color("#ce7cae"), []);
  const nightSkyColor = useMemo(() => new Color("#010204"), []);
  const dayGlassColor = useMemo(() => new Color("#a5bfd6"), []);
  const nightGlassColor = useMemo(() => new Color("#223246"), []);
  const sunRayDayColor = useMemo(() => new Color("#ffe3b5"), []);
  const sunRayTwilightColor = useMemo(() => new Color("#ff9e5a"), []);
  const sunRaySunriseColor = useMemo(() => new Color("#ffdcb6"), []);
  const sunRaySunsetColor = useMemo(() => new Color("#ff8f52"), []);
  const sunRayColorScratch = useMemo(() => new Color(), []);
  const twilightSkyColorScratch = useMemo(() => new Color(), []);
  const twilightSunRayColorScratch = useMemo(() => new Color(), []);
  const frontWindowDayColor = useMemo(() => new Color("#dcecff"), []);
  const frontWindowNightColor = useMemo(() => new Color("#ffd86a"), []);
  const sideWindowDayColor = useMemo(() => new Color("#d6e7fb"), []);
  const sideWindowNightColor = useMemo(() => new Color("#ffcc52"), []);
  const frontWindowColorScratch = useMemo(() => new Color(), []);
  const sideWindowColorScratch = useMemo(() => new Color(), []);
  const cloudsEnabled = (sceneQuality?.enableClouds ?? true) && SHOW_CLOUDS;
  const skyBodiesEnabled = (sceneQuality?.enableSkyBodies ?? true) && SHOW_SKY_BODIES;
  const starsEnabled = (sceneQuality?.enableStars ?? true) && SHOW_STARS;
  const starMeshRefs = useRef([]);
  const starMaterialRefs = useRef([]);
  const dust = useMemo(() => createDustMotes(), []);
  const dustPointsRef = useRef(null);
  const dustMaterialRef = useRef(null);
  // Rain starts from the env flag and toggles at runtime with the W key.
  const [rainActive, setRainActive] = useState(SHOW_RAIN);
  const rain = useMemo(() => createRainDrops(), []);
  const rainRipples = useMemo(() => createRainRipples(), []);
  const rainGroupRef = useRef(null);
  const rainLinesRef = useRef(null);
  const rainRippleMeshRefs = useRef([]);
  const condensationTexture = useMemo(() => createCondensationTexture(15737), []);
  const condensationMaterialRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }
      if (event.key.toLowerCase() === "w") {
        setRainActive((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      condensationTexture?.dispose();
    };
  }, [condensationTexture]);
  const starPositionsByLayer = useMemo(
    () =>
      starsEnabled
        ? STAR_LAYERS.map((layer, index) =>
            createStarPositions(STAR_FIELD_SEED + index * 97, layer.count),
          )
        : [],
    [starsEnabled],
  );
  const nearCloudTexture = useMemo(
    () => (cloudsEnabled ? createCloudTexture(55711) : null),
    [cloudsEnabled],
  );
  const farCloudTexture = useMemo(
    () => (cloudsEnabled ? createCloudTexture(83217) : null),
    [cloudsEnabled],
  );
  const sunRayLayers = useMemo(
    () => createSunRayLayers(sceneQuality?.sunRayCount ?? MAX_SUN_RAY_LAYER_COUNT),
    [sceneQuality?.sunRayCount],
  );
  const frontWindowMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#dcecff",
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        transparent: true,
        opacity: 0.56,
      }),
    [],
  );
  const frontWindowMaterialRef = useRef(frontWindowMaterial);
  const sideWindowMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#d6e7fb",
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        transparent: true,
        opacity: 0.44,
      }),
    [],
  );
  const sideWindowMaterialRef = useRef(sideWindowMaterial);

  useEffect(() => {
    return () => {
      frontWindowMaterial.dispose();
      sideWindowMaterial.dispose();
    };
  }, [frontWindowMaterial, sideWindowMaterial]);

  useEffect(() => {
    return () => {
      nearCloudTexture?.dispose();
      farCloudTexture?.dispose();
    };
  }, [nearCloudTexture, farCloudTexture]);

  useFrame((state, delta) => {
    const worldHour = worldHourRef?.current ?? 12;
    const solarAngle = ((worldHour - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(solarAngle);
    const dayFactor = Math.max(0, sunHeight);
    const nightFactor = Math.max(0, -sunHeight);
    const twilightFactor = getTwilightFactor(sunHeight);
    const sunriseBlend = getDayBlend(worldHour, 5, 8);
    const sunsetBlend = getDayBlend(worldHour, 17, 20);
    const nightLightingStrength = getNightLightingStrength(worldHour);
    const isSunVisible = sunHeight >= 0;
    const isSunBodyVisible = dayFactor > 0.08;
    const isMoonBodyVisible = nightFactor > 0.08;
    const elapsedSeconds = state.clock.getElapsedTime();

    const orbitX = SUN_X + Math.cos(solarAngle) * 0.82;
    const orbitY = ORBIT_CENTER_Y + Math.sin(solarAngle) * ORBIT_RADIUS_Y;
    const orbitZ = SUN_Z + Math.sin(solarAngle * 0.55) * 0.22;

    if (sunRef.current) {
      sunRef.current.position.set(orbitX, orbitY, orbitZ);
      sunRef.current.visible = isSunBodyVisible;
      sunRef.current.material.emissiveIntensity = isSunBodyVisible
        ? 2.1 + dayFactor * 2.9 + twilightFactor * 0.65
        : 0;
    }
    if (sunGlowMaterialRef.current) {
      sunGlowMaterialRef.current.opacity = isSunBodyVisible
        ? 0.14 + dayFactor * 0.3 + twilightFactor * 0.08
        : 0;
    }
    if (sunLightRef.current) {
      sunLightRef.current.position.set(orbitX, orbitY, orbitZ);
      sunLightRef.current.intensity = isSunVisible
        ? dayFactor * 5.2 + twilightFactor * 1.0
        : 0;
    }

    const moonAngle = solarAngle + Math.PI;
    const moonHeight = Math.sin(moonAngle);
    const moonArcFactor = Math.pow(Math.max(0, moonHeight), 0.82);
    const moonX = SUN_X + Math.cos(moonAngle) * 0.82;
    const moonY = ORBIT_CENTER_Y + Math.sin(moonAngle) * ORBIT_RADIUS_Y;
    const moonZ = SUN_Z + Math.sin(moonAngle * 0.55) * 0.22;

    if (moonRef.current) {
      moonRef.current.position.set(moonX, moonY, moonZ);
      moonRef.current.visible = isMoonBodyVisible;
      moonRef.current.material.emissiveIntensity = isMoonBodyVisible
        ? 0.12 +
          moonArcFactor * (0.24 + moonPhaseFactor * 0.42) +
          twilightFactor * 0.05
        : 0;
    }
    if (moonGlowMaterialRef.current) {
      moonGlowMaterialRef.current.opacity = isMoonBodyVisible
        ? 0.03 +
          moonArcFactor * (0.08 + moonPhaseFactor * 0.08) +
          twilightFactor * 0.025
        : 0;
    }
    if (moonLightRef.current) {
      const moonDriftX = Math.sin(elapsedSeconds * 0.06) * 0.04;
      const moonDriftY = Math.cos(elapsedSeconds * 0.05) * 0.03;
      moonLightRef.current.position.set(
        moonX + moonDriftX,
        moonY + moonDriftY,
        moonZ,
      );
      moonLightRef.current.intensity = !isSunVisible
        ? moonArcFactor * (0.34 + moonPhaseFactor * 0.56) +
          nightFactor * 0.12 +
          twilightFactor * 0.07
        : 0;
    }
    if (cityGlowRef.current) {
      const pulse = 1 + Math.sin(elapsedSeconds * 0.3) * 0.08;
      cityGlowRef.current.intensity = nightLightingStrength * 0.4 * pulse;
    }
    // Dust motes drift up through the window light while the sun is out.
    const dustStrength = smoothStep(0.3, 0.55, dayFactor);
    if (dustPointsRef.current && dustMaterialRef.current) {
      if (dustStrength <= 0.001) {
        dustPointsRef.current.visible = false;
      } else {
        dustPointsRef.current.visible = true;
        dustMaterialRef.current.opacity = 0.16 * dustStrength;
        const attribute = dustPointsRef.current.geometry.attributes.position;
        const array = attribute.array;
        for (let index = 0; index < DUST_MOTE_COUNT; index += 1) {
          const mote = dust.motes[index];
          let y = array[index * 3 + 1] + mote.riseSpeed * delta;
          if (y > DUST_MAX_Y) y = DUST_MIN_Y;
          array[index * 3 + 1] = y;
          array[index * 3] =
            mote.x + Math.sin(elapsedSeconds * mote.swayFreq + mote.phase) * mote.swayAmp;
          array[index * 3 + 2] =
            mote.z +
            Math.cos(elapsedSeconds * mote.swayFreq * 0.8 + mote.phase) * mote.swayAmp;
        }
        attribute.needsUpdate = true;
      }
    }

    // Rain: advance each drop downward and wrap; pulse the sill ripples.
    if (rainGroupRef.current) {
      rainGroupRef.current.visible = rainActive;
      if (rainActive && rainLinesRef.current) {
        const attribute = rainLinesRef.current.geometry.attributes.position;
        const array = attribute.array;
        for (let index = 0; index < RAIN_DROP_COUNT; index += 1) {
          const drop = rain.drops[index];
          let bottom = array[index * 6 + 1] - drop.speed * delta;
          if (bottom < RAIN_MIN_Y) bottom = RAIN_MAX_Y - drop.length;
          array[index * 6 + 1] = bottom;
          array[index * 6 + 4] = bottom + drop.length;
        }
        attribute.needsUpdate = true;

        rainRipples.forEach((ripple, index) => {
          const mesh = rainRippleMeshRefs.current[index];
          if (!mesh) return;
          const t = (elapsedSeconds / RAIN_RIPPLE_PERIOD_S + ripple.phase) % 1;
          const scale = 0.25 + t * 1.4;
          mesh.scale.set(scale, scale, scale);
          mesh.material.opacity = 0.3 * (1 - t);
        });
      }
    }

    // Condensation fogs the glass as the night cools, drifting very slowly.
    if (condensationMaterialRef.current) {
      condensationMaterialRef.current.opacity =
        smoothStep(0.35, 0.75, nightFactor) * 0.22;
      if (condensationMaterialRef.current.map) {
        condensationMaterialRef.current.map.offset.y =
          (elapsedSeconds * 0.0015) % 1;
      }
    }

    // Stars fade in once night is properly underway and twinkle per layer.
    const starStrength = starsEnabled ? smoothStep(0.3, 0.6, nightFactor) : 0;
    STAR_LAYERS.forEach((layer, index) => {
      const mesh = starMeshRefs.current[index];
      const material = starMaterialRefs.current[index];
      if (!mesh || !material) return;
      if (starStrength <= 0.001) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      const twinkle =
        0.72 + 0.28 * Math.sin(elapsedSeconds * layer.twinkleSpeed + layer.phase);
      material.opacity = layer.baseOpacity * starStrength * twinkle;
    });

    if (nearCloudMaterialRef.current?.map) {
      nearCloudMaterialRef.current.map.offset.x =
        (nearCloudMaterialRef.current.map.offset.x + delta * 0.008) % 1;
      nearCloudMaterialRef.current.opacity =
        0.23 *
        clamp01(
          1 - (nightLightingStrength + twilightFactor * 0.45) * 1.4,
        );
    }
    if (farCloudMaterialRef.current?.map) {
      farCloudMaterialRef.current.map.offset.x =
        (farCloudMaterialRef.current.map.offset.x + delta * 0.013) % 1;
      farCloudMaterialRef.current.opacity =
        0.16 *
        clamp01(
          1 - (nightLightingStrength + twilightFactor * 0.45) * 1.5,
        );
    }

    twilightSkyColorScratch
      .copy(twilightSkyColor)
      .lerp(sunriseSkyColor, sunriseBlend)
      .lerp(sunsetSkyColor, sunsetBlend);

    if (skylineMaterialRef.current) {
      skylineTargetColorRef.current
        .copy(nightSkyColor)
        .lerp(twilightSkyColorScratch, twilightFactor)
        .lerp(daySkyColor, dayFactor);
      skylineMaterialRef.current.color.lerp(
        skylineTargetColorRef.current,
        Math.min(1, delta * 0.55),
      );
    }

    if (windowGlassMaterialRef.current) {
      glassTargetColorRef.current
        .copy(nightGlassColor)
        .lerp(dayGlassColor, Math.min(1, dayFactor + twilightFactor * 0.2));
      windowGlassMaterialRef.current.color.lerp(
        glassTargetColorRef.current,
        Math.min(1, delta * 0.8),
      );
      windowGlassMaterialRef.current.opacity =
        0.07 + dayFactor * 0.2 + twilightFactor * 0.04;
    }

    const sunRayStrength = isSunVisible
      ? Math.min(1, Math.pow(dayFactor, 1.25) + twilightFactor * 0.38)
      : 0;
    twilightSunRayColorScratch
      .copy(sunRayTwilightColor)
      .lerp(sunRaySunriseColor, sunriseBlend)
      .lerp(sunRaySunsetColor, sunsetBlend);
    sunRayColorScratch
      .copy(sunRayDayColor)
      .lerp(twilightSunRayColorScratch, Math.min(1, twilightFactor * 0.75));

    sunRayLayers.forEach((layer, index) => {
      const mesh = sunRayMeshRefs.current[index];
      const material = sunRayMaterialRefs.current[index];
      if (!mesh || !material) return;
      if (sunRayStrength <= 0.001) {
        mesh.visible = false;
        return;
      }
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

    frontWindowColorScratch
      .copy(frontWindowDayColor)
      .lerp(frontWindowNightColor, nightLightingStrength);
    if (frontWindowMaterialRef.current) {
      frontWindowMaterialRef.current.color.copy(frontWindowColorScratch);
      frontWindowMaterialRef.current.opacity = 0.56 + nightLightingStrength * 0.36;
    }

    sideWindowColorScratch
      .copy(sideWindowDayColor)
      .lerp(sideWindowNightColor, nightLightingStrength);
    if (sideWindowMaterialRef.current) {
      sideWindowMaterialRef.current.color.copy(sideWindowColorScratch);
      sideWindowMaterialRef.current.opacity = 0.44 + nightLightingStrength * 0.42;
    }
  });

  return (
    <group>
      <mesh receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry args={[8.6, 0.12, 7.4]} />
        <meshStandardMaterial
          color="#bda992"
          map={textures.wood}
          roughness={0.86}
        />
      </mesh>
      <mesh receiveShadow position={[0, 3.46, 0]}>
        <boxGeometry args={[8.6, 0.12, 7.4]} />
        <meshStandardMaterial
          color="#e4d7c8"
          map={textures.wall}
          roughness={0.94}
        />
      </mesh>
      <mesh receiveShadow position={[-1.4, 0.005, -1.5]}>
        <boxGeometry args={[3.4, 0.02, 2.4]} />
        <meshStandardMaterial
          color="#8b6750"
          map={textures.rug}
          roughness={0.92}
        />
      </mesh>
      <mesh receiveShadow position={[0, 1.7, -3.6]}>
        <boxGeometry args={[8.6, 3.4, 0.2]} />
        <meshStandardMaterial
          color="#dbcdbd"
          map={textures.wall}
          roughness={0.94}
        />
      </mesh>

      <group>
        <mesh receiveShadow position={[LEFT_WALL_X, 2.71, 0]}>
          <boxGeometry args={[0.2, 1.38, 7.4]} />
          <meshStandardMaterial
            color="#d8c9b8"
            map={textures.wall}
            roughness={0.94}
          />
        </mesh>
        <mesh receiveShadow position={[LEFT_WALL_X, 0.435, 0]}>
          <boxGeometry args={[0.2, 0.87, 7.4]} />
          <meshStandardMaterial
            color="#d8c9b8"
            map={textures.wall}
            roughness={0.94}
          />
        </mesh>
        <mesh receiveShadow position={[LEFT_WALL_X, WINDOW_CENTER_Y, -2.6825]}>
          <boxGeometry args={[0.2, WINDOW_HEIGHT, 2.035]} />
          <meshStandardMaterial
            color="#d8c9b8"
            map={textures.wall}
            roughness={0.94}
          />
        </mesh>
        <mesh receiveShadow position={[LEFT_WALL_X, WINDOW_CENTER_Y, 1.8925]}>
          <boxGeometry args={[0.2, WINDOW_HEIGHT, 3.615]} />
          <meshStandardMaterial
            color="#d8c9b8"
            map={textures.wall}
            roughness={0.94}
          />
        </mesh>
      </group>

      <mesh receiveShadow position={[RIGHT_WALL_X, 1.7, 0]}>
        <boxGeometry args={[0.2, 3.4, 7.4]} />
        <meshStandardMaterial
          color="#d8c9b8"
          map={textures.wall}
          roughness={0.94}
        />
      </mesh>

      <group>
        <mesh
          position={[WINDOW_GLASS_X, WINDOW_CENTER_Y, WINDOW_CENTER_Z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[WINDOW_WIDTH, WINDOW_HEIGHT]} />
          <meshStandardMaterial
            ref={windowGlassMaterialRef}
            color="#a5bfd6"
            metalness={0.1}
            roughness={0.08}
            transparent
            opacity={0.24}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[WINDOW_FRAME_X, WINDOW_CENTER_Y + 0.62, WINDOW_CENTER_Z]}
        >
          <boxGeometry args={[0.12, 0.08, 1.88]} />
          <meshStandardMaterial
            color="#7a563d"
            map={textures.wood}
            roughness={0.72}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[WINDOW_FRAME_X, WINDOW_CENTER_Y - 0.62, WINDOW_CENTER_Z]}
        >
          <boxGeometry args={[0.12, 0.08, 1.88]} />
          <meshStandardMaterial
            color="#7a563d"
            map={textures.wood}
            roughness={0.72}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[WINDOW_FRAME_X, WINDOW_CENTER_Y, WINDOW_CENTER_Z - 0.93]}
        >
          <boxGeometry args={[0.12, 1.32, 0.08]} />
          <meshStandardMaterial
            color="#7a563d"
            map={textures.wood}
            roughness={0.72}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[WINDOW_FRAME_X, WINDOW_CENTER_Y, WINDOW_CENTER_Z + 0.93]}
        >
          <boxGeometry args={[0.12, 1.32, 0.08]} />
          <meshStandardMaterial
            color="#7a563d"
            map={textures.wood}
            roughness={0.72}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[WINDOW_SILL_X, WINDOW_CENTER_Y - 0.65, WINDOW_CENTER_Z]}
        >
          <boxGeometry args={[0.35, 0.06, 1.98]} />
          <meshStandardMaterial
            color="#6d4f3a"
            map={textures.wood}
            roughness={0.72}
          />
        </mesh>
      </group>

      <group ref={rainGroupRef} visible={false}>
        <lineSegments ref={rainLinesRef} renderOrder={5}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[rain.positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#c3d8f2"
            depthWrite={false}
            opacity={0.6}
            transparent
          />
        </lineSegments>
        {rainRipples.map((ripple, index) => (
          <mesh
            key={`rain-ripple-${ripple.phase}`}
            ref={(node) => {
              rainRippleMeshRefs.current[index] = node;
            }}
            position={[ripple.x, SILL_TOP_Y, ripple.z]}
            renderOrder={5}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.008, 0.013, 16]} />
            <meshBasicMaterial
              color="#cfe2ff"
              depthWrite={false}
              opacity={0}
              side={DoubleSide}
              transparent
            />
          </mesh>
        ))}
      </group>

      {condensationTexture ? (
        <mesh
          position={[WINDOW_GLASS_X + 0.006, WINDOW_CENTER_Y, WINDOW_CENTER_Z]}
          renderOrder={6}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[WINDOW_WIDTH, WINDOW_HEIGHT]} />
          <meshBasicMaterial
            ref={condensationMaterialRef}
            depthWrite={false}
            map={condensationTexture}
            opacity={0}
            transparent
          />
        </mesh>
      ) : null}

      <points ref={dustPointsRef} renderOrder={4} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={dustMaterialRef}
          blending={AdditiveBlending}
          color="#ffe9c9"
          depthWrite={false}
          opacity={0}
          size={0.016}
          sizeAttenuation
          toneMapped={false}
          transparent
        />
      </points>

      <group position={[OUTSIDE_SCENE_X, 0, WINDOW_CENTER_Z]}>
        <mesh
          position={[SKY_BACKDROP_X, WINDOW_CENTER_Y + 0.14, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[SKY_PLANE_WIDTH, SKY_PLANE_HEIGHT]} />
          <meshBasicMaterial
            ref={skylineMaterialRef}
            color="#c8dcf0"
            map={textures.skyline}
          />
        </mesh>
        {starsEnabled
          ? STAR_LAYERS.map((layer, index) => (
              <points
                key={`star-layer-${layer.phase}`}
                ref={(node) => {
                  starMeshRefs.current[index] = node;
                }}
                renderOrder={1}
                visible={false}
              >
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[starPositionsByLayer[index], 3]}
                  />
                </bufferGeometry>
                <pointsMaterial
                  ref={(node) => {
                    starMaterialRefs.current[index] = node;
                  }}
                  blending={AdditiveBlending}
                  color="#dbe7ff"
                  depthWrite={false}
                  opacity={0}
                  size={layer.size}
                  sizeAttenuation
                  toneMapped={false}
                  transparent
                />
              </points>
            ))
          : null}
        {cloudsEnabled && farCloudTexture ? (
          <mesh
            position={[FAR_CLOUD_X, WINDOW_CENTER_Y + 0.76, -0.2]}
            rotation={[0, Math.PI / 2, 0]}
            renderOrder={2}
          >
            <planeGeometry args={[5.8, 1.9]} />
            <meshBasicMaterial
              ref={farCloudMaterialRef}
              alphaTest={0.03}
              color="#f4f7ff"
              depthWrite={false}
              map={farCloudTexture}
              opacity={0}
              transparent
            />
          </mesh>
        ) : null}
        {cloudsEnabled && nearCloudTexture ? (
          <mesh
            position={[NEAR_CLOUD_X, WINDOW_CENTER_Y + 0.56, 0.1]}
            rotation={[0, Math.PI / 2, 0]}
            renderOrder={3}
          >
            <planeGeometry args={[5.3, 1.72]} />
            <meshBasicMaterial
              ref={nearCloudMaterialRef}
              alphaTest={0.03}
              color="#ffffff"
              depthWrite={false}
              map={nearCloudTexture}
              opacity={0}
              transparent
            />
          </mesh>
        ) : null}

        <group position={[0, 0, OUTSIDE_CLUSTER_Z_SHIFT]}>
          {skyBodiesEnabled ? (
            <>
              <mesh
                ref={sunRef}
                position={[SUN_X, SUN_Y, SUN_Z]}
                renderOrder={10}
                visible={false}
              >
                <sphereGeometry args={[0.17, 14, 14]} />
                <meshStandardMaterial
                  color="#ffe8b2"
                  depthTest={false}
                  emissive="#ffd28a"
                  emissiveIntensity={3.2}
                  toneMapped={false}
                />
              </mesh>
              <mesh
                position={[SUN_X, SUN_Y, SUN_Z]}
                rotation={[0, Math.PI / 2, 0]}
                renderOrder={9}
              >
                <planeGeometry args={[1.02, 1.02]} />
                <meshBasicMaterial
                  blending={AdditiveBlending}
                  color="#ffd28d"
                  depthTest={false}
                  depthWrite={false}
                  opacity={0.28}
                  ref={sunGlowMaterialRef}
                  side={DoubleSide}
                  toneMapped={false}
                  transparent
                />
              </mesh>
              <mesh
                ref={moonRef}
                position={[SUN_X, SUN_Y, SUN_Z]}
                renderOrder={10}
                visible={false}
              >
                <sphereGeometry args={[0.13, 14, 14]} />
                <meshStandardMaterial
                  color="#f5f8ff"
                  depthTest={false}
                  emissive="#e6eeff"
                  emissiveIntensity={0.45}
                  toneMapped={false}
                />
              </mesh>
              <mesh
                position={[SUN_X, SUN_Y, SUN_Z]}
                rotation={[0, Math.PI / 2, 0]}
                renderOrder={9}
              >
                <planeGeometry args={[0.78, 0.78]} />
                <meshBasicMaterial
                  blending={AdditiveBlending}
                  color="#f0f5ff"
                  depthTest={false}
                  depthWrite={false}
                  opacity={0.12}
                  ref={moonGlowMaterialRef}
                  side={DoubleSide}
                  toneMapped={false}
                  transparent
                />
              </mesh>
            </>
          ) : null}
          <pointLight
            ref={sunLightRef}
            color="#ffd08a"
            intensity={6.8}
            distance={9.4}
            decay={2}
            position={[SUN_X, SUN_Y, SUN_Z]}
          />

          <pointLight
            ref={moonLightRef}
            color="#eef3ff"
            intensity={0.5}
            distance={7.6}
            decay={2}
            position={[SUN_X, SUN_Y, SUN_Z]}
          />
          <pointLight
            ref={cityGlowRef}
            color="#ff9944"
            intensity={0}
            distance={5}
            decay={2}
            position={[0, -0.2, 0]}
          />

          {CITY_BUILDINGS.map((building) => (
            <CityBuilding
              key={building.id}
              building={building}
              frontWindowMaterial={frontWindowMaterial}
              sideWindowMaterial={sideWindowMaterial}
            />
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
            ref={(mesh) => {
              sunRayMeshRefs.current[index] = mesh;
            }}
            renderOrder={12}
            rotation={layer.rotation}
          >
            <planeGeometry args={[layer.width, layer.height]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color="#ffe3b5"
              depthWrite={false}
              opacity={0}
              ref={(material) => {
                sunRayMaterialRefs.current[index] = material;
              }}
              side={DoubleSide}
              transparent
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const RoomShell = memo(RoomShellComponent);
