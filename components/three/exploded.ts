import { CASE } from "./watchGeometry";

/*
 * ─── EXPLODED VIEW DATA ───────────────────────────────────────────────────────
 * How far each part travels (x, y, z in the watch's own space) when the watch
 * is fully exploded. Because the parts live inside the rotating group, they
 * separate along the watch's own axes, whichever way it's turned.
 * Front layers fly forward in order, the back sensor drops back, the crown and
 * button slide out sideways, and the straps pull apart.
 */
export const EXPLODE = {
  glass: [0, 0, 1.2],
  screen: [0, 0, 0.9],
  board: [0, 0, 0.6],
  battery: [0, 0, 0.32],
  crown: [0.42, 0, 0],
  button: [0.3, 0, 0],
  sensor: [0, 0, -0.42],
  strapTop: [0, 0.22, -0.1],
  strapBottom: [0, -0.22, -0.1],
} as const;
export type PartName = keyof typeof EXPLODE;

/*
 * ─── HOTSPOTS ─────────────────────────────────────────────────────────────────
 * Labels pinned to parts of the watch, shown while it's exploded.
 *
 * Each label is a normal HTML element (crisp text, easy to style). Every frame,
 * Watch.tsx takes the label's 3D point, moves it with its part, and converts
 * ("projects") it to a pixel position on screen. That's how a flat HTML label
 * can follow a spinning 3D object.
 *
 *   position → point on the part, in the watch's own space (before exploding)
 *   side     → label above or below the point
 *   lift     → leader-line length in px (staggered so neighbours don't collide)
 */
export type Hotspot = {
  id: string;
  label: string;
  part: PartName;
  position: [number, number, number];
  side: "above" | "below";
  lift: number;
};

const FRONT = CASE.d / 2;

export const HOTSPOTS: Hotspot[] = [
  { id: "glass", label: "Sapphire crystal", part: "glass", position: [0, 0.6, FRONT + 0.02], side: "above", lift: 64 },
  { id: "screen", label: "Micro-LED display", part: "screen", position: [0, -0.53, FRONT + 0.016], side: "below", lift: 56 },
  { id: "board", label: "E1 processor", part: "board", position: [0, 0.5, 0.02], side: "above", lift: 24 },
  { id: "battery", label: "72h battery", part: "battery", position: [0, -0.46, 0.035], side: "below", lift: 20 },
  { id: "crown", label: "Crown", part: "crown", position: [0.67, 0.2, 0], side: "above", lift: 36 },
];

/**
 * The label elements, registered by HotspotLabels.tsx and positioned by
 * Watch.tsx. A plain object (not React state), so moving labels 60×/s
 * never re-renders anything.
 */
export const hotspotElements: Record<string, HTMLDivElement | null> = {};
