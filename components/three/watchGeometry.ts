import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/*
 * All the shapes that make up the watch, generated in code.
 * Kept separate from Watch.tsx so that file can focus on behaviour
 * (scroll, mouse, clock) and this one on "what the watch looks like".
 */

// Case size in 3D units. Everything else is positioned relative to this.
export const CASE = { w: 1.1, h: 1.32, d: 0.36, corner: 0.3 };

/** A 2D rectangle with rounded corners (outline for the case, glass and strap cross-section). */
export function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Extrude a rounded rectangle into a soft "pillow" with rounded edges.
 * `smoothness` = number of steps around the rounded edge. More looks smoother
 * but costs build time, so thin edges (the glass) get fewer.
 */
function pillow(w: number, h: number, corner: number, depth: number, bevel: number, smoothness: number) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, corner - bevel), {
    depth: Math.max(depth - bevel * 2, 0.001),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: smoothness,
    curveSegments: 24,
  });
  g.center();
  // ExtrudeGeometry has hard, faceted normals. Merging duplicate vertices and
  // recomputing normals smooths them, so reflections flow over the metal.
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const smooth = mergeVertices(g, 1e-4);
  smooth.computeVertexNormals();
  return smooth;
}

/**
 * The digital crown, with grip ridges ("knurling") like a real crown.
 * We take a plain cylinder and push one column of vertices outward every few
 * columns, which turns the smooth side into a ring of ridges.
 */
function knurledCylinder(radius: number, height: number, ridges: number) {
  const g = new THREE.CylinderGeometry(radius, radius, height, ridges * 4, 1);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (Math.hypot(v.x, v.z) < radius * 0.99) continue; // skip the cap centers
    const angle = Math.atan2(v.z, v.x);
    const push = 1 + 0.07 * Math.max(0, Math.cos(angle * ridges));
    pos.setXYZ(i, v.x * push, v.y, v.z * push);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * One strap that curves smoothly back around the wrist.
 *
 * Built like a pipe, except the cross-section is a flat rounded rectangle
 * instead of a circle. We walk along a curved path and place a ring of
 * vertices (the cross-section) at each step, then stitch neighbouring rings
 * together with triangles. The strap narrows slightly, then rounds off at the tip.
 *
 * side = 1 → top strap, side = -1 → bottom strap (mirrored).
 * Returns the strap and, for the bottom strap, its buckle holes.
 */
function strap(side: 1 | -1) {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.45, -0.05), // starts inside the case
    new THREE.Vector3(0, 0.78, -0.06),
    new THREE.Vector3(0, 1.05, -0.15),
    new THREE.Vector3(0, 1.27, -0.36),
    new THREE.Vector3(0, 1.42, -0.66), // curls back, around the wrist
  ]);

  const WIDTH = 0.78;
  const THICK = 0.09;
  const ALONG = 90; // rings along the strap
  const AROUND = 48; // points around each ring
  const TIP = 0.14; // last 14% of the length rounds off into the tip

  // Cross-section outline, sampled once. getSpacedPoints returns AROUND + 1
  // points, the last equal to the first, which closes the ring.
  const profile = roundedRect(WIDTH, THICK, 0.04).getSpacedPoints(AROUND);

  const positions: number[] = [];
  const indices: number[] = [];
  const p = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3(); // points away from the wrist
  const X = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i <= ALONG; i++) {
    const t = i / ALONG;
    path.getPointAt(t, p);
    path.getTangentAt(t, tangent);
    normal.crossVectors(X, tangent).normalize();

    // Taper from 100% to 88% width, then a rounded (elliptical) tip.
    let widthScale = THREE.MathUtils.lerp(1, 0.88, t);
    if (t > 1 - TIP) {
      const k = (t - (1 - TIP)) / TIP; // 0 → 1 across the tip
      widthScale *= Math.sqrt(Math.max(0, 1 - k * k));
    }

    for (const pt of profile) {
      const x = pt.x * widthScale;
      const n = pt.y; // offset along the normal (strap thickness)
      positions.push(p.x + x, side * (p.y + normal.y * n), p.z + normal.z * n);
    }
  }

  // Stitch ring i to ring i+1 with two triangles per square.
  const ring = AROUND + 1;
  for (let i = 0; i < ALONG; i++) {
    for (let j = 0; j < AROUND; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      const c = a + 1;
      const d = b + 1;
      // Mirroring the bottom strap flips the triangles inside-out,
      // so we reverse their winding to keep them facing outward.
      if (side === 1) indices.push(a, b, c, c, b, d);
      else indices.push(a, c, b, c, d, b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Buckle holes: small dark ovals on the outer face of the bottom strap.
  let holes: THREE.BufferGeometry | null = null;
  if (side === -1) {
    const parts: THREE.BufferGeometry[] = [];
    const basis = new THREE.Matrix4();
    for (let h = 0; h < 5; h++) {
      const t = 0.4 + h * 0.085;
      path.getPointAt(t, p);
      path.getTangentAt(t, tangent);
      normal.crossVectors(X, tangent).normalize();
      const surface = p.clone().addScaledVector(normal, THICK / 2 + 0.003);
      surface.y *= side;
      const hole = new THREE.CircleGeometry(0.018, 20);
      hole.scale(1, 1.3, 1); // oval, stretched along the strap
      // Orient the hole: x across the strap, y along it, z out of the surface.
      const along = new THREE.Vector3(tangent.x, tangent.y * side, tangent.z);
      const out = new THREE.Vector3(normal.x, normal.y * side, normal.z);
      basis.makeBasis(X, along, out).setPosition(surface);
      hole.applyMatrix4(basis);
      parts.push(hole);
    }
    holes = mergeGeometries(parts);
  }

  return { geometry, holes };
}

/**
 * Internal components, only seen in the exploded view (Design section).
 * While the watch is assembled they sit hidden inside the closed case.
 */
function internals() {
  // Small chips scattered on the logic board, merged into ONE geometry so the
  // GPU draws them all in a single call instead of one call per chip.
  const chipLayout: [w: number, h: number, x: number, y: number][] = [
    [0.14, 0.09, -0.24, -0.18],
    [0.1, 0.1, 0.24, -0.16],
    [0.2, 0.07, 0, -0.34],
    [0.08, 0.12, -0.27, 0.3],
    [0.12, 0.06, 0.22, 0.36],
    [0.06, 0.06, 0.28, 0.05],
  ];
  const chips = mergeGeometries(
    chipLayout.map(([w, h, x, y]) => {
      const chip = new RoundedBoxGeometry(w, h, 0.02, 2, 0.005);
      chip.translate(x, y, 0.025);
      return chip;
    })
  );

  return {
    board: new RoundedBoxGeometry(0.8, 1.0, 0.03, 2, 0.012), // logic board (PCB)
    chips,
    soc: new RoundedBoxGeometry(0.3, 0.3, 0.035, 3, 0.015), // main processor, metal lid
    battery: new RoundedBoxGeometry(0.74, 0.92, 0.07, 4, 0.03),
    batteryBand: new THREE.BoxGeometry(0.745, 0.03, 0.072), // accent label stripe
    displayPanel: new RoundedBoxGeometry(0.88, 1.08, 0.02, 2, 0.008), // backing behind the screen
  };
}

/** Hand control back to the browser for a moment (lets it paint and handle input). */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Builds every shape of the watch.
 *
 * It's async and pauses between the heavier pieces. Building everything in one
 * go is a single ~0.2 s (≈1 s on a slow phone) freeze; split up, the browser
 * can keep scrolling and responding to taps in between.
 */
export async function buildGeometries() {
  const caseBody = pillow(CASE.w, CASE.h, CASE.corner, CASE.d, 0.13, 10);
  await yieldToMain();
  const glass = pillow(1.0, 1.22, 0.26, 0.05, 0.022, 5);
  await yieldToMain();
  const top = strap(1);
  await yieldToMain();
  const bottom = strap(-1);
  await yieldToMain();
  const inside = internals();
  await yieldToMain();

  return {
    caseBody,
    glass,
    // Flat front of the glass, used for the reflection-only cover layer.
    cover: new THREE.ShapeGeometry(roundedRect(0.94, 1.16, 0.22), 24),
    screen: new THREE.PlaneGeometry(0.86, 1.06),
    crown: knurledCylinder(0.085, 0.13, 30),
    crownRing: new THREE.TorusGeometry(0.087, 0.01, 8, 48),
    button: new RoundedBoxGeometry(0.06, 0.24, 0.09, 4, 0.028),
    sensorDome: new THREE.CylinderGeometry(0.34, 0.37, 0.04, 64),
    sensorRing: new THREE.RingGeometry(0.2, 0.215, 64),
    led: new THREE.CircleGeometry(0.025, 16),
    strapTop: top.geometry,
    strapBottom: bottom.geometry,
    strapHoles: bottom.holes!,
    glowPlane: new THREE.PlaneGeometry(3.4, 3.4),
    ...inside,
  };
}

export type WatchGeometries = Awaited<ReturnType<typeof buildGeometries>>;
