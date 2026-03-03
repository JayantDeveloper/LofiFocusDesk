import { useEffect, useMemo } from "react";
import { CanvasTexture } from "three";
import { DESK_TOP_Y } from "../../../../constants/deskConstants";

const LAMP_X = -0.9;
const LAMP_Z = -0.4;
const DESK_WIDTH = 2.35;
const CLOCK_LAMP_GAP = DESK_WIDTH * 0.1;

function buildDisplayCanvas(time, ampm) {
  const GREEN = "#00ff44";
  const width = 1024;
  const height = 400;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);

  context.font = "bold 260px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(0,160,30,0.07)";
  context.fillText("88:88", width / 2, height / 2 + 10);

  const glowPasses = [
    { blur: 40, color: "rgba(0,255,68,0.3)" },
    { blur: 20, color: "rgba(0,255,68,0.6)" },
    { blur: 6, color: GREEN },
    { blur: 0, color: GREEN },
  ];

  glowPasses.forEach((pass) => {
    context.font = "bold 260px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = GREEN;
    context.shadowBlur = pass.blur;
    context.fillStyle = pass.color;
    context.fillText(time, width / 2, height / 2 + 10);
  });

  context.font = "bold 60px monospace";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.shadowColor = GREEN;
  context.shadowBlur = 16;
  context.fillStyle = GREEN;
  context.fillText(ampm, 40, 36);

  context.font = "bold 38px monospace";
  context.textBaseline = "bottom";
  context.shadowBlur = 10;
  context.fillStyle = "rgba(0,255,68,0.55)";
  context.fillText("AL", 40, height - 24);
  context.shadowBlur = 0;

  return canvas;
}

export function AlarmClock({ time = "12:00", ampm = "AM" }) {
  const displayTexture = useMemo(() => {
    const texture = new CanvasTexture(buildDisplayCanvas(time, ampm));
    texture.needsUpdate = true;
    return texture;
  }, [ampm, time]);

  useEffect(() => {
    return () => {
      displayTexture.dispose();
    };
  }, [displayTexture]);

  return (
    <group
      name="desk-alarm-clock"
      position={[LAMP_X, DESK_TOP_Y + 0.04, LAMP_Z + CLOCK_LAMP_GAP]}
      rotation={[0, Math.PI / 6, 0]}
      scale={[0.06, 0.06, 0.06]}
    >
      <mesh castShadow receiveShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[4.6, 2.3, 1.2]} />
        <meshStandardMaterial color="#0c0c0c" roughness={1} metalness={0} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 1.2, 0.62]}>
        <boxGeometry args={[3.95, 1.78, 0.08]} />
        <meshStandardMaterial color="#060606" roughness={1} metalness={0} />
      </mesh>

      <mesh position={[0, 1.2, 0.7]}>
        <planeGeometry args={[3.6, 1.58]} />
        <meshBasicMaterial map={displayTexture} toneMapped={false} />
      </mesh>

      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 5 }).map((__, column) => (
          <mesh key={`clock-dot-${row}-${column}`} position={[1.58 + column * 0.11, 0.84 + row * 0.13, 0.63]}>
            <circleGeometry args={[0.021, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={1} metalness={0} />
          </mesh>
        )),
      )}

      {[-1.2, 0, 1.2].map((x) => (
        <mesh key={`clock-button-${x}`} castShadow position={[x, 2.33, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.088, 0.088, 0.16, 16]} />
          <meshStandardMaterial color="#181818" roughness={1} metalness={0} />
        </mesh>
      ))}

      {[-1.65, 1.65].map((x) => (
        <mesh key={`clock-foot-${x}`} castShadow receiveShadow position={[x, 0.06, 0.06]}>
          <cylinderGeometry args={[0.075, 0.095, 0.07, 12]} />
          <meshStandardMaterial color="#080808" roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

export default AlarmClock;
