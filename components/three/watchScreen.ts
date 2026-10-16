import * as THREE from "three";
import type { SectionId } from "@/lib/poses";

/*
 * The watch screen: a 2D <canvas> drawn with the regular Canvas API, then used
 * as a texture on the 3D screen. Each page section shows a different "face".
 *
 * Re-uploading a texture to the GPU has a cost, so Watch.tsx only redraws when
 * something changed: ~30×/s while a face animates (ECG, crossfade), otherwise
 * once a minute for the clock.
 */

export type Face = "clock" | "finish" | "health" | "battery" | "order";

/** Which face each section shows. */
export const FACE_BY_SECTION: Record<SectionId, Face> = {
  hero: "clock",
  design: "clock",
  health: "health",
  finish: "finish",
  specs: "battery",
  order: "order",
};

/** Faces that move every frame (others only change once a minute). */
export const ANIMATED_FACES: Face[] = ["health"];

export const SCREEN_W = 512;
export const SCREEN_H = 632; // same aspect ratio as the 0.86 × 1.06 screen plane

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const INK = "#eef1f7";
const MUTED = "#8b93a7";
const ACCENT = "#00e0c6";
const HEART = "#ff4d6d"; // health red, only used on the watch screen

export function createScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { ctx: canvas.getContext("2d")!, texture };
}

/** Live data the faces can show. */
export type ScreenInfo = {
  now: Date;
  time: number; // seconds since start, drives the animations
  finishName: string;
};

/**
 * Draw the screen. While `fade` < 1 we are switching faces: the old face is
 * drawn first, then the new one on top at `fade` opacity, which gives a crossfade.
 */
export function drawScreen(ctx: CanvasRenderingContext2D, face: Face, previous: Face, fade: number, info: ScreenInfo) {
  ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.save();
  // Rounded corners: clip, so everything outside stays transparent.
  ctx.beginPath();
  ctx.roundRect(0, 0, SCREEN_W, SCREEN_H, 110);
  ctx.clip();

  if (fade < 1) {
    ctx.globalAlpha = 1;
    FACES[previous](ctx, info);
  }
  ctx.globalAlpha = fade;
  FACES[face](ctx, info);

  ctx.restore();
}

// ─── Faces ──────────────────────────────────────────────────────────────────────
// Every face starts by painting the screen black (like an OLED), so a face
// drawn at partial opacity on top of another blends smoothly.

const FACES: Record<Face, (ctx: CanvasRenderingContext2D, info: ScreenInfo) => void> = {
  clock: (ctx, { now }) => clockFace(ctx, now, formatDate(now)),
  finish: (ctx, { now, finishName }) => clockFace(ctx, now, finishName.toUpperCase()),
  health: healthFace,
  battery: batteryFace,
  order: orderFace,
};

function clockFace(ctx: CanvasRenderingContext2D, now: Date, subtitle: string) {
  const w = SCREEN_W;
  const h = SCREEN_H;
  blank(ctx);

  ctx.fillStyle = INK;
  ctx.font = `700 150px ${FONT}`;
  ctx.fillText(`${pad(now.getHours())}:${pad(now.getMinutes())}`, w / 2, h * 0.46);

  // Shrink the subtitle until it fits ("GRAPHITE TITANIUM" is long).
  ctx.fillStyle = MUTED;
  let size = 30;
  ctx.letterSpacing = "6px";
  do {
    ctx.font = `600 ${size}px ${FONT}`;
    size -= 2;
  } while (ctx.measureText(subtitle).width > w * 0.78 && size > 16);
  ctx.fillText(subtitle, w / 2, h * 0.55);
  ctx.letterSpacing = "0px";

  ring(ctx, w / 2, h * 0.76, 58, 14, 0.72);
  ctx.fillStyle = ACCENT;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText("72", w / 2, h * 0.76 + 14);
}

/** Heart rate: pulsing heart, live BPM, scrolling ECG trace, SpO₂ + HRV. */
function healthFace(ctx: CanvasRenderingContext2D, { time }: ScreenInfo) {
  const w = SCREEN_W;
  const h = SCREEN_H;
  blank(ctx);

  const BEATS_PER_SECOND = 1.2; // 72 BPM
  const beat = (time * BEATS_PER_SECOND) % 1; // 0 → 1 through each heartbeat
  const bpm = Math.round(72 + Math.sin(time * 0.35) * 2.5); // drifts gently, like a real reading

  // Heart icon, pulsing on the "R" spike of each beat.
  const pulse = 1 + 0.18 * bump(beat, 0.31, 0.06);
  heart(ctx, w / 2 - 92, h * 0.2, 26 * pulse);
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${FONT}`;
  ctx.letterSpacing = "5px";
  ctx.fillText("HEART", w / 2 - 50, h * 0.2 + 9);
  ctx.letterSpacing = "0px";

  // Big BPM number
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = `700 128px ${FONT}`;
  ctx.fillText(String(bpm), w / 2 - 34, h * 0.42);
  ctx.fillStyle = HEART;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText("BPM", w / 2 + 112, h * 0.42);

  // ECG trace: the waveform scrolls right-to-left, fading out at the left edge.
  const left = 52;
  const right = w - 52;
  const mid = h * 0.6;
  const amp = 62;
  const gradient = ctx.createLinearGradient(left, 0, right, 0);
  gradient.addColorStop(0, "rgba(0,224,198,0)");
  gradient.addColorStop(0.35, "rgba(0,224,198,0.9)");
  gradient.addColorStop(1, ACCENT);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let x = left; x <= right; x += 3) {
    const phase = (x - right) / 150 + time * BEATS_PER_SECOND; // 150px per heartbeat
    const y = mid - ecg(phase - Math.floor(phase)) * amp;
    if (x === left) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Glowing dot at the "write head" on the right
  const headPhase = time * BEATS_PER_SECOND;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(right, mid - ecg(headPhase - Math.floor(headPhase)) * amp, 7, 0, Math.PI * 2);
  ctx.fill();

  // Secondary stats
  stat(ctx, w * 0.32, h * 0.83, "98%", "SpO₂");
  stat(ctx, w * 0.68, h * 0.83, "64ms", "HRV");
}

/** Battery (Specs section). */
function batteryFace(ctx: CanvasRenderingContext2D) {
  const w = SCREEN_W;
  const h = SCREEN_H;
  blank(ctx);
  ring(ctx, w / 2, h * 0.45, 150, 22, 0.86);
  ctx.fillStyle = INK;
  ctx.font = `700 110px ${FONT}`;
  ctx.fillText("72h", w / 2, h * 0.45 + 38);
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${FONT}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("REMAINING", w / 2, h * 0.8);
  ctx.letterSpacing = "0px";
}

/** Founder's edition badge (Order section). */
function orderFace(ctx: CanvasRenderingContext2D) {
  const w = SCREEN_W;
  const h = SCREEN_H;
  blank(ctx);

  ctx.font = `700 60px ${FONT}`;
  ctx.letterSpacing = "18px";
  // Draw "ECLIPSE" with a teal "I", like the logo: measure each part to place it.
  const parts: [string, string][] = [["ECL", INK], ["I", ACCENT], ["PSE", INK]];
  const total = parts.reduce((sum, [t]) => sum + ctx.measureText(t).width, 0);
  let x = w / 2 - total / 2 + 9; // +9: letter-spacing adds trailing space after the last letter
  ctx.textAlign = "left";
  for (const [text, color] of parts) {
    ctx.fillStyle = color;
    ctx.fillText(text, x, h * 0.36);
    x += ctx.measureText(text).width;
  }
  ctx.textAlign = "center";

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.46);
  ctx.lineTo(w * 0.7, h * 0.46);
  ctx.stroke();

  ctx.letterSpacing = "6px";
  ctx.fillStyle = MUTED;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText("FOUNDER'S EDITION", w / 2, h * 0.56);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = ACCENT;
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText("No. 0427", w / 2, h * 0.7);
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText("of 2,000", w / 2, h * 0.78);
}

// ─── Drawing helpers ────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

/** e.g. "THU 16 OCT" */
function formatDate(now: Date) {
  return now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }).replace(/,/g, "").toUpperCase();
}

/** Paint the screen black and reset text alignment. */
function blank(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.textAlign = "center";
}

/** Progress ring: faint full circle + accent arc from 12 o'clock. */
function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, width: number, amount: number) {
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
  ctx.stroke();
}

function stat(ctx: CanvasRenderingContext2D, x: number, y: number, value: string, label: string) {
  ctx.fillStyle = INK;
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(value, x, y);
  ctx.fillStyle = MUTED;
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(label, x, y + 34);
}

/** A heart shape centered at (x, y), built from two curves. */
function heart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = HEART;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.6, y - size * 0.1, x - size * 0.6, y - size * 1.2, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.6, y - size * 1.2, x + size * 1.6, y - size * 0.1, x, y + size * 0.9);
  ctx.fill();
}

/** A smooth bump (bell curve) centered at c with width w, peaking at 1. */
function bump(t: number, c: number, w: number) {
  return Math.exp(-(((t - c) / w) ** 2));
}

/**
 * One heartbeat of an ECG, t from 0 to 1. A real ECG is a series of named
 * waves (P, Q, R, S, T); each one here is a bump of the right size and spot.
 */
function ecg(t: number) {
  return (
    0.12 * bump(t, 0.15, 0.025) - // P: small hump
    0.15 * bump(t, 0.28, 0.012) + //  Q: small dip
    1.0 * bump(t, 0.31, 0.012) - //   R: the tall spike
    0.28 * bump(t, 0.34, 0.012) + //  S: dip after the spike
    0.28 * bump(t, 0.55, 0.045) //    T: wide hump
  );
}
