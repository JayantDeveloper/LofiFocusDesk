import { Center, Text3D } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { CanvasTexture } from "three";
import helvetikerBold from "three/examples/fonts/helvetiker_bold.typeface.json";
import { DESK_TOP_Y } from "../../../../constants/deskConstants";

const NOTEBOOK_WIDTH = 0.52 * 0.7;
const NOTEBOOK_HEIGHT = 0.042;
const NOTEBOOK_DEPTH = 0.68 * 0.7;

function createCoverTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1400;
  const context = canvas.getContext("2d");

  const gradient = context.createLinearGradient(0, 0, 1024, 1400);
  gradient.addColorStop(0, "#f9efbd");
  gradient.addColorStop(0.45, "#f1e3a5");
  gradient.addColorStop(1, "#e5d083");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 1400);

  for (let index = 0; index < 6500; index += 1) {
    context.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
    context.fillRect(Math.random() * 1024, Math.random() * 1400, 1, 1);
  }

  context.strokeStyle = "rgba(120,98,45,0.18)";
  context.lineWidth = 3;
  context.strokeRect(55, 18, 914, 1364);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createPaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1400;
  const context = canvas.getContext("2d");

  context.fillStyle = "#faf6ee";
  context.fillRect(0, 0, 1024, 1400);

  context.strokeStyle = "#e07070";
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(160, 0);
  context.lineTo(160, 1400);
  context.stroke();

  context.strokeStyle = "#9ab4d8";
  context.lineWidth = 1.2;
  for (let y = 80; y < 1400; y += 38) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(1024, y);
    context.stroke();
  }

  context.strokeStyle = "#e07070";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, 56);
  context.lineTo(1024, 56);
  context.stroke();
  context.beginPath();
  context.moveTo(0, 62);
  context.lineTo(1024, 62);
  context.stroke();

  [220, 700, 1180].forEach((y) => {
    context.beginPath();
    context.arc(32, y, 18, 0, Math.PI * 2);
    context.fillStyle = "#e0d8cc";
    context.fill();
    context.strokeStyle = "#c8bfb0";
    context.lineWidth = 1;
    context.stroke();
  });

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function Notebook() {
  const coverTexture = useMemo(() => createCoverTexture(), []);
  const paperTexture = useMemo(() => createPaperTexture(), []);
  useEffect(() => {
    return () => {
      coverTexture.dispose();
      paperTexture.dispose();
    };
  }, [coverTexture, paperTexture]);

  return (
    <group
      name="desk-notebook"
      position={[0.02, DESK_TOP_Y + 0.036, 0.1]}
      rotation={[0, 0.18, 0.006]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[NOTEBOOK_WIDTH, NOTEBOOK_HEIGHT, NOTEBOOK_DEPTH]} />
        <meshStandardMaterial attach="material-0" color="#d8c068" roughness={0.72} />
        <meshStandardMaterial attach="material-1" color="#d8c068" roughness={0.72} />
        <meshStandardMaterial attach="material-2" map={coverTexture} roughness={0.52} metalness={0.02} />
        <meshStandardMaterial attach="material-3" map={paperTexture} roughness={0.92} />
        <meshStandardMaterial attach="material-4" color="#f0ece0" roughness={0.9} />
        <meshStandardMaterial attach="material-5" color="#f0ece0" roughness={0.9} />
      </mesh>

      {Array.from({ length: 22 }).map((_, index) => {
        const z =
          -NOTEBOOK_DEPTH * 0.5 +
          0.03 +
          (index * (NOTEBOOK_DEPTH - 0.06)) / 21;

        return (
          <mesh
            key={`notebook-ring-${index}`}
            castShadow
            receiveShadow
            position={[-NOTEBOOK_WIDTH * 0.5 - 0.004, 0.004, z]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <torusGeometry args={[0.02, 0.006, 8, 16]} />
            <meshStandardMaterial color="#8f8f8f" roughness={0.24} metalness={0.9} />
          </mesh>
        );
      })}

      <group
        position={[0, NOTEBOOK_HEIGHT * 0.5 + 0.0036, 0.01]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <Center position={[0, 0.12, 0]}>
          <Text3D
            bevelEnabled
            bevelSegments={4}
            bevelSize={0.0012}
            bevelThickness={0.0012}
            curveSegments={6}
            font={helvetikerBold}
            height={0.0048}
            size={0.036}
          >
            Made by
            <meshStandardMaterial color="#101010" roughness={0.3} metalness={0.15} />
          </Text3D>
        </Center>

        <Center position={[0, 0.0, 0]}>
          <Text3D
            bevelEnabled
            bevelSegments={4}
            bevelSize={0.0013}
            bevelThickness={0.0013}
            curveSegments={6}
            font={helvetikerBold}
            height={0.0052}
            size={0.036}
          >
            Jayant
            <meshStandardMaterial color="#0d0d0d" roughness={0.3} metalness={0.16} />
          </Text3D>
        </Center>

        <Center position={[0, -0.12, 0]}>
          <Text3D
            bevelEnabled
            bevelSegments={4}
            bevelSize={0.0011}
            bevelThickness={0.0011}
            curveSegments={6}
            font={helvetikerBold}
            height={0.0048}
            size={0.036}
          >
            Maheshwari
            <meshStandardMaterial color="#101010" roughness={0.3} metalness={0.15} />
          </Text3D>
        </Center>
      </group>
    </group>
  );
}
