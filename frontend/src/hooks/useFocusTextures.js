import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const TEXTURE_SIZE = 128;

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  return canvas;
}

function finalizeTexture(canvas, repeatX = 1, repeatY = 1) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

function createWoodTexture() {
  const canvas = makeCanvas();
  const context = canvas.getContext("2d");

  if (!context) {
    return finalizeTexture(canvas, 2, 2);
  }

  const gradient = context.createLinearGradient(0, 0, TEXTURE_SIZE, 0);
  gradient.addColorStop(0, "#6d4a32");
  gradient.addColorStop(0.5, "#8a6042");
  gradient.addColorStop(1, "#6b4933");
  context.fillStyle = gradient;
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  for (let row = 0; row < 22; row += 1) {
    const y = row * 6;
    const alpha = 0.04 + ((row % 5) * 0.015);
    context.fillStyle = `rgba(45, 28, 16, ${alpha.toFixed(3)})`;
    context.fillRect(0, y, TEXTURE_SIZE, 2);
  }

  for (let knot = 0; knot < 10; knot += 1) {
    const x = 15 + ((knot * 31) % 210);
    const y = 20 + ((knot * 47) % 210);
    const radius = 3 + (knot % 6);

    context.strokeStyle = "rgba(60, 38, 22, 0.14)";
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(x, y, radius * 2, radius, 0, 0, Math.PI * 2);
    context.stroke();
  }

  return finalizeTexture(canvas, 3, 2);
}

function createCorkTexture() {
  const canvas = makeCanvas();
  const context = canvas.getContext("2d");

  if (!context) {
    return finalizeTexture(canvas, 2, 2);
  }

  // Base tan-brown fill
  context.fillStyle = "#c2935a";
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  // Horizontal grain bands — the primary fiber direction of cork/burlap
  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    const v = (y * 7 + 3) % 17;
    const lightDark = v < 8 ? -1 : 1;
    const shift = lightDark * (4 + (v % 5));
    context.strokeStyle = `rgba(${110 + shift},${68 + shift},${22 + shift},0.28)`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(TEXTURE_SIZE, y + 0.5);
    context.stroke();
  }

  // Short horizontal fiber strokes for variation
  for (let i = 0; i < 280; i += 1) {
    const x = (i * 43) % TEXTURE_SIZE;
    const y = (i * 31) % TEXTURE_SIZE;
    const len = 5 + (i % 14);
    const alpha = 0.07 + (i % 5) * 0.022;
    const isDark = i % 3 === 0;
    context.strokeStyle = isDark
      ? `rgba(95, 58, 18, ${alpha.toFixed(3)})`
      : `rgba(224, 178, 110, ${alpha.toFixed(3)})`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, y + 0.5);
    context.lineTo(Math.min(x + len, TEXTURE_SIZE), y + ((i % 3) - 1) * 0.4);
    context.stroke();
  }

  // Occasional dark grain flecks
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 71) % TEXTURE_SIZE;
    const y = (i * 53) % TEXTURE_SIZE;
    context.fillStyle = "rgba(105, 62, 18, 0.18)";
    context.fillRect(x, y, 2 + (i % 4), 1);
  }

  return finalizeTexture(canvas, 2, 2);
}

function createPaperTexture() {
  const canvas = makeCanvas();
  const context = canvas.getContext("2d");

  if (!context) {
    return finalizeTexture(canvas, 1, 1);
  }

  context.fillStyle = "#f2eee4";
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  for (let row = 0; row < 24; row += 1) {
    const y = 8 + row * 5;
    context.strokeStyle = "rgba(162, 167, 178, 0.11)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(TEXTURE_SIZE, y);
    context.stroke();
  }

  return finalizeTexture(canvas, 1, 1);
}

function createWallTexture() {
  const canvas = makeCanvas();
  const context = canvas.getContext("2d");

  if (!context) {
    return finalizeTexture(canvas, 3, 2);
  }

  context.fillStyle = "#dbcbb9";
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  return finalizeTexture(canvas, 3, 2);
}

function createRugTexture() {
  const canvas = makeCanvas();
  const context = canvas.getContext("2d");

  if (!context) {
    return finalizeTexture(canvas, 2, 2);
  }

  context.fillStyle = "#7d5e49";
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  for (let column = 0; column < 14; column += 1) {
    const x = column * 9;
    context.fillStyle = "rgba(241, 213, 178, 0.09)";
    context.fillRect(x, 0, 3, TEXTURE_SIZE);
  }

  for (let row = 0; row < 12; row += 1) {
    const y = row * 10;
    context.fillStyle = "rgba(95, 60, 39, 0.16)";
    context.fillRect(0, y, TEXTURE_SIZE, 2);
  }

  return finalizeTexture(canvas, 3, 2);
}

function createSkylineTexture() {
  const canvas = makeCanvas();
  const context = canvas.getContext("2d");

  if (!context) {
    return finalizeTexture(canvas, 1, 1);
  }

  const gradient = context.createLinearGradient(0, 0, 0, TEXTURE_SIZE);
  gradient.addColorStop(0, "#81acd2");
  gradient.addColorStop(0.6, "#9bc2e0");
  gradient.addColorStop(1, "#d4e0ea");
  context.fillStyle = gradient;
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  return finalizeTexture(canvas, 1, 1);
}

export function useFocusTextures() {
  return useMemo(
    () => ({
      cork: createCorkTexture(),
      paper: createPaperTexture(),
      rug: createRugTexture(),
      skyline: createSkylineTexture(),
      wall: createWallTexture(),
      wood: createWoodTexture(),
    }),
    [],
  );
}
