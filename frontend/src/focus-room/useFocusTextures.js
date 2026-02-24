import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const TEXTURE_SIZE = 256;

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

  for (let row = 0; row < 44; row += 1) {
    const y = row * 6;
    const alpha = 0.04 + ((row % 5) * 0.015);
    context.fillStyle = `rgba(45, 28, 16, ${alpha.toFixed(3)})`;
    context.fillRect(0, y, TEXTURE_SIZE, 2);
  }

  for (let knot = 0; knot < 20; knot += 1) {
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

  context.fillStyle = "#b98959";
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  for (let index = 0; index < 3600; index += 1) {
    const x = (index * 37) % TEXTURE_SIZE;
    const y = (index * 53) % TEXTURE_SIZE;
    const alpha = 0.09 + ((index % 5) * 0.03);
    const size = 1 + (index % 3);

    context.fillStyle = `rgba(101, 62, 32, ${alpha.toFixed(3)})`;
    context.fillRect(x, y, size, size);
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

  for (let row = 0; row < 46; row += 1) {
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

  for (let index = 0; index < 2400; index += 1) {
    const x = (index * 29) % TEXTURE_SIZE;
    const y = (index * 61) % TEXTURE_SIZE;
    const alpha = 0.035 + ((index % 4) * 0.012);

    context.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    context.fillRect(x, y, 1, 1);
  }

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

  for (let column = 0; column < 28; column += 1) {
    const x = column * 9;
    context.fillStyle = "rgba(241, 213, 178, 0.09)";
    context.fillRect(x, 0, 3, TEXTURE_SIZE);
  }

  for (let row = 0; row < 24; row += 1) {
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

  context.fillStyle = "rgba(248, 230, 185, 0.18)";
  context.beginPath();
  context.arc(190, 70, 24, 0, Math.PI * 2);
  context.fill();

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
