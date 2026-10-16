import * as THREE from "three";
import gsap from "gsap";
import { FINISHES, type Finish } from "./finishes";

/*
 * ─── THE "INSTANT COLOR CHANGE" TRICK ─────────────────────────────────────────
 *
 * The naive React way to recolor a 3D model:
 *   const [color, setColor] = useState(...)
 *   <meshStandardMaterial color={color} />
 * Every click → setColor → React re-renders the whole 3D component tree →
 * visible lag on slower phones.
 *
 * What we do instead:
 *   1. Create each material ONCE, here, outside React.
 *   2. The 3D watch (components/three/Watch.tsx) uses these same objects.
 *   3. The configurator calls applyFinish(), which tweens the material's
 *      properties directly with GSAP.
 *
 * Three.js reads material.color on the next frame (~16 ms later). React never
 * re-renders the 3D scene, so the change is instant and can even animate
 * smoothly from one color to the next.
 */

const initial = FINISHES[0];

/**
 * Metal used for the case, crown and side button.
 * No clear-coat on purpose: a glossy lacquer layer on top of metal is what
 * makes 3D metal read as "plastic". Real titanium is bare metal, so its look
 * comes only from roughness and from what it reflects (see studioEnvironment.ts).
 */
export const caseMaterial = new THREE.MeshPhysicalMaterial({
  color: initial.caseColor,
  metalness: 1,
  roughness: initial.roughness,
});

/**
 * Soft-touch fluoroelastomer strap.
 * "Sheen" adds the soft, velvety brightening you see along the edges of
 * rubber and fabric, which a plain matte material lacks.
 */
export const strapMaterial = new THREE.MeshPhysicalMaterial({
  color: initial.strapColor,
  metalness: 0,
  roughness: 0.6,
  sheen: 1,
  sheenRoughness: 0.5,
  sheenColor: "#7a8294",
});

/** Black sapphire glass (front bezel + rear sensor dome). */
export const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#030406",
  metalness: 0,
  roughness: 0.05,
  ior: 1.77, // sapphire's real index of refraction, which sets how strongly it reflects
  clearcoat: 1,
  clearcoatRoughness: 0.02,
});

/**
 * The sapphire cover over the screen, as a "reflection-only" layer.
 * Its own color is black, and additive blending means black adds nothing.
 * So all you see is the reflection of the studio lights sliding across the
 * glass while the screen stays fully visible underneath. It's a cheap trick
 * that looks like real glass.
 */
export const coverGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#000000",
  metalness: 0,
  roughness: 0.03,
  ior: 1.77,
  // Physically correct glare can wash out the screen at some angles; 0.5
  // keeps a visible glint while the screen content stays readable.
  envMapIntensity: 0.5,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

/** Brand accent (#00e0c6). MeshBasicMaterial ignores lighting, so it reads as "glowing". */
export const accentMaterial = new THREE.MeshBasicMaterial({ color: "#00e0c6" });

/** Buckle holes in the strap: just near-black ovals. */
export const holeMaterial = new THREE.MeshBasicMaterial({ color: "#020203", side: THREE.DoubleSide });

/* Internal parts (exploded view only). Fixed colors: they don't change with the finish. */
export const boardMaterial = new THREE.MeshStandardMaterial({ color: "#0b1613", roughness: 0.55, metalness: 0.2 });
export const chipMaterial = new THREE.MeshStandardMaterial({ color: "#121418", roughness: 0.35, metalness: 0.4 });
export const socMaterial = new THREE.MeshStandardMaterial({ color: "#c9ced8", roughness: 0.22, metalness: 1 });
export const batteryMaterial = new THREE.MeshStandardMaterial({ color: "#2b2f37", roughness: 0.4, metalness: 0.55 });
/** The dark recess inside the case, visible once the glass lifts off. */
export const cavityMaterial = new THREE.MeshStandardMaterial({ color: "#050608", roughness: 0.9, metalness: 0 });

/**
 * What the watch screen shows that depends on the configurator.
 * Same idea as the materials: a plain object outside React. The screen
 * (components/three/watchScreen.ts) reads it the next time it redraws.
 */
export const watchDisplay = { finishName: initial.name };

/**
 * Tween the shared materials to a new finish.
 * Called straight from a click handler — no React state involved.
 */
export function applyFinish(finish: Finish) {
  // new THREE.Color("#hex") converts the hex into the r/g/b numbers (0–1)
  // that Three.js stores internally, so GSAP can animate each channel.
  const caseTarget = new THREE.Color(finish.caseColor);
  const strapTarget = new THREE.Color(finish.strapColor);
  watchDisplay.finishName = finish.name; // the Finish screen face shows this name

  // overwrite: true stops a half-finished tween if the user clicks quickly.
  gsap.to(caseMaterial.color, { r: caseTarget.r, g: caseTarget.g, b: caseTarget.b, duration: 0.6, ease: "power2.out", overwrite: true });
  gsap.to(caseMaterial, { roughness: finish.roughness, duration: 0.6, ease: "power2.out", overwrite: true });
  gsap.to(strapMaterial.color, { r: strapTarget.r, g: strapTarget.g, b: strapTarget.b, duration: 0.6, ease: "power2.out", overwrite: true });
}
