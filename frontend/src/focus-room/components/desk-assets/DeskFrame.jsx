import { useEffect, useMemo } from "react";
import { Color, ShaderMaterial, Vector3 } from "three";
import { DESK_TOP_Y } from "./constants";

const WOOD_VERTEX_SHADER = `
  varying vec3 vObjectPos;
  varying vec3 vNormalView;

  void main() {
    vObjectPos = position;
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WOOD_FRAGMENT_SHADER = `
  varying vec3 vObjectPos;
  varying vec3 vNormalView;

  uniform vec3 uLightWood;
  uniform vec3 uDarkWood;
  uniform vec3 uGrainDirection;
  uniform float uGrainFrequency;
  uniform float uWarpStrength;
  uniform float uFiberScale;
  uniform float uBrightness;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), u.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x),
        u.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x),
        u.y
      ),
      u.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave += 1) {
      value += noise(p) * amplitude;
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 grainPos = vec3(vObjectPos.x * 1.25, vObjectPos.y * 1.05, vObjectPos.z * 1.1);
    vec3 grainDir = normalize(uGrainDirection);

    float axisCoord = dot(grainPos, grainDir);
    float warpLow = (fbm(vec3(grainPos.x * 1.8, grainPos.y * 2.2, grainPos.z * 1.6)) - 0.5)
      * uWarpStrength;
    float warpHigh = (fbm(vec3(grainPos.x * 6.3, grainPos.y * 5.9, grainPos.z * 6.1)) - 0.5)
      * uWarpStrength
      * 0.26;

    float warpedAxis = axisCoord * uGrainFrequency + warpLow + warpHigh;

    float broadBands = 0.5 + 0.5 * sin(warpedAxis);
    broadBands = smoothstep(0.18, 0.86, broadBands);

    float fiberWarp = fbm(
      vec3(
        grainPos.x * 10.0,
        grainPos.y * (uFiberScale * 0.3),
        grainPos.z * 8.4
      )
    );
    float fineFibers = 0.5 + 0.5 * sin((warpedAxis + fiberWarp * 0.92) * (uFiberScale * 0.72));
    fineFibers = smoothstep(0.24, 0.9, fineFibers);

    float pores = fbm(vec3(grainPos.x * 18.0, grainPos.y * 9.0, grainPos.z * 18.0));
    float grain = clamp(broadBands * 0.58 + fineFibers * 0.32 + pores * 0.1, 0.0, 1.0);
    grain = smoothstep(0.12, 0.92, grain);

    vec3 woodColor = mix(uLightWood, uDarkWood, grain);

    vec3 normal = normalize(vNormalView);
    vec3 keyLightDir = normalize(vec3(0.38, 0.86, 0.34));
    float diffuse = max(dot(normal, keyLightDir), 0.0);
    float hemi = 0.5 + 0.5 * normal.y;
    float lighting = 0.36 + diffuse * 0.44 + hemi * 0.2;

    gl_FragColor = vec4(woodColor * lighting * uBrightness, 1.0);
  }
`;

function createWoodMaterial({
  brightness,
  darkWood,
  fiberScale,
  grainDirection,
  grainFrequency,
  lightWood,
  warpStrength,
}) {
  return new ShaderMaterial({
    fragmentShader: WOOD_FRAGMENT_SHADER,
    uniforms: {
      uBrightness: { value: brightness },
      uDarkWood: { value: new Color(darkWood) },
      uFiberScale: { value: fiberScale },
      uGrainDirection: { value: new Vector3(grainDirection[0], grainDirection[1], grainDirection[2]) },
      uGrainFrequency: { value: grainFrequency },
      uLightWood: { value: new Color(lightWood) },
      uWarpStrength: { value: warpStrength },
    },
    vertexShader: WOOD_VERTEX_SHADER,
  });
}

export function DeskFrame() {
  const topWoodMaterial = useMemo(
    () =>
      createWoodMaterial({
        brightness: 1.0,
        darkWood: "#794c27",
        fiberScale: 28,
        grainDirection: [1.0, 0.07, 0.2],
        grainFrequency: 10,
        lightWood: "#743e0b",
        warpStrength: 3.2,
      }),
    [],
  );
  const legWoodMaterial = useMemo(
    () =>
      createWoodMaterial({
        brightness: 0.98,
        darkWood: "#794c27",
        fiberScale: 24,
        grainDirection: [0.16, 1.0, 0.08],
        grainFrequency: 18,
        lightWood: "#99602b",
        warpStrength: 2.6,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      topWoodMaterial.dispose();
      legWoodMaterial.dispose();
    };
  }, [legWoodMaterial, topWoodMaterial]);

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, DESK_TOP_Y, 0]} material={topWoodMaterial}>
        <boxGeometry args={[2.35, 0.08, 1.14]} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.88, 0.4, -0.34]} material={legWoodMaterial}>
        <boxGeometry args={[0.55, 0.72, 0.42]} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.98, 0.38, -0.46]} material={legWoodMaterial}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.98, 0.38, 0.42]} material={legWoodMaterial}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
      </mesh>

      <mesh castShadow receiveShadow position={[1.02, 0.38, 0.42]} material={legWoodMaterial}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
      </mesh>
    </group>
  );
}
