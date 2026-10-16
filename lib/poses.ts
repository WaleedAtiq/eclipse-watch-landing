/*
 * ─── SCROLL CHOREOGRAPHY DATA ─────────────────────────────────────────────────
 *
 * One "pose" per page section: where the watch sits and how it is turned while
 * that section is on screen. GSAP blends from one pose to the next as you
 * scroll (see components/three/Watch.tsx).
 *
 * Rotation (ry) only ever increases down the page, so the watch always turns
 * the same way and never spins backwards between sections.
 *
 * Units:
 *   x, y   → fraction of the visible screen (0.25 = a quarter of the screen
 *            width right of center). Fractions keep the layout correct on any
 *            screen size, from a phone to an ultrawide monitor.
 *   z      → depth in 3D units (negative = further away)
 *   rx/ry/rz → rotation in radians (Math.PI = half a turn)
 *   s      → scale multiplier
 */
export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number };

/** Section ids, in page order. Each must exist as an id="" in the page. */
export const SECTION_IDS = ["hero", "design", "health", "finish", "specs", "order"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

const TURN = Math.PI * 2;

// Desktop: the watch moves side to side, opposite the text column.
export const DESKTOP_POSES: Pose[] = [
  /* hero   – right, slight 3/4 view   */ { x: 0.22, y: 0, z: 0, rx: 0.15, ry: -0.45, rz: 0.06, s: 1 },
  /* design – left, 3/4 angle so the exploded layers fan out */ { x: -0.15, y: -0.02, z: 0, rx: 0.25, ry: -0.85, rz: -0.1, s: 0.85 },
  /* health – right, sensor side shown */ { x: 0.22, y: 0, z: 0, rx: -0.15, ry: Math.PI + 0.4, rz: 0.1, s: 0.95 },
  /* finish – left, straight on        */ { x: -0.2, y: 0, z: 0.2, rx: 0.08, ry: TURN - 0.3, rz: 0, s: 1 },
  /* specs  – far back, full spin      */ { x: 0, y: 0, z: -6, rx: 0.3, ry: 2 * TURN - 0.3, rz: 0, s: 1 },
  /* order  – left, beside the CTA     */ { x: -0.22, y: 0, z: 0, rx: 0.15, ry: 2 * TURN - 0.4, rz: 0.06, s: 0.95 },
];

// Mobile: always centered, sitting in the top half above the text.
export const MOBILE_POSES: Pose[] = [
  { x: 0, y: 0.2, z: 0, rx: 0.15, ry: -0.4, rz: 0.06, s: 1 },
  { x: 0.06, y: 0.22, z: 0, rx: 0.25, ry: -0.85, rz: -0.1, s: 0.85 }, // nudged right: exploded layers fan out to the left
  { x: 0, y: 0.22, z: 0, rx: -0.15, ry: Math.PI + 0.4, rz: 0.1, s: 1 },
  { x: 0, y: 0.22, z: 0, rx: 0.08, ry: TURN - 0.3, rz: 0, s: 1 },
  { x: 0, y: 0.1, z: -6, rx: 0.3, ry: 2 * TURN - 0.3, rz: 0, s: 1 },
  { x: 0, y: 0.24, z: 0, rx: 0.2, ry: 2 * TURN - 0.15, rz: 0, s: 0.85 },
];

/*
 * "Inner" poses: a second pose that a section moves to WHILE you scroll
 * through it, not just when it arrives.
 *
 * Health: the watch arrives showing its sensors (the pose above), then turns
 * around to show the live heart-rate reading on its screen: sensor → result.
 */
export const DESKTOP_INNER_POSES: Partial<Record<SectionId, Pose>> = {
  health: { x: 0.22, y: 0, z: 0.2, rx: 0.1, ry: TURN - 0.45, rz: 0.04, s: 1 },
};
export const MOBILE_INNER_POSES: Partial<Record<SectionId, Pose>> = {
  health: { x: 0, y: 0.22, z: 0, rx: 0.1, ry: TURN - 0.4, rz: 0.04, s: 1 },
};
