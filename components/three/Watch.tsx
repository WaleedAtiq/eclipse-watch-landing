"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  caseMaterial,
  strapMaterial,
  glassMaterial,
  coverGlassMaterial,
  accentMaterial,
  holeMaterial,
  boardMaterial,
  chipMaterial,
  socMaterial,
  batteryMaterial,
  cavityMaterial,
  watchDisplay,
} from "@/lib/watchMaterials";
import { CASE, type WatchGeometries } from "./watchGeometry";
import { EXPLODE, HOTSPOTS, hotspotElements, type PartName } from "./exploded";
import { watchDrag } from "@/lib/watchInteraction";
import { createScreen, drawScreen, ANIMATED_FACES, FACE_BY_SECTION, type Face } from "./watchScreen";
import {
  DESKTOP_POSES,
  MOBILE_POSES,
  DESKTOP_INNER_POSES,
  MOBILE_INNER_POSES,
  SECTION_IDS,
  type Pose,
} from "@/lib/poses";

/*
 * The ECLIPSE watch, built from code instead of a downloaded .glb file.
 *
 * Why procedural? The whole model is a few KB of JavaScript, so there is
 * nothing to download, and that is the biggest loading win available. To use a
 * real modelled watch instead, see "Using a real 3D model" in the README.
 *
 * Structure:
 *   outer group  → position + scale  (driven by scroll)
 *     glow plane → soft teal halo behind the watch
 *     inner group → rotation          (driven by scroll + mouse tilt + drag)
 *       case, glass, screen, cover glass, crown, button, sensor dome, straps
 *       + hidden internals (board, battery) for the exploded view
 *
 * The shapes live in watchGeometry.ts, the materials in lib/watchMaterials.ts,
 * the screen faces in watchScreen.ts, the exploded view + hotspot data in
 * exploded.ts, and the studio lighting in studioEnvironment.ts.
 */

const FACE_FADE = 0.35; // seconds to crossfade between screen faces
const ANIMATION_FPS = 30; // redraw rate for animated faces (the screen doesn't need 60)

const hotspotPoint = new THREE.Vector3(); // reused every frame (no garbage)

/** `geo` = the watch's shapes, built (asynchronously) by Experience.tsx before the watch mounts. */
export default function Watch({ geo }: { geo: WatchGeometries }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);

  // GSAP writes the *target* pose here as you scroll. useFrame (below) then
  // eases the real 3D object toward it. Keeping it in a ref (not useState)
  // means scrolling never triggers a React re-render.
  const target = useRef<Pose>({ ...DESKTOP_POSES[0] });
  const pointer = useRef({ x: 0, y: 0 });

  // Accessibility: visitors who set "reduce motion" in their OS get no idle
  // float and no mouse tilt (scroll-driven motion stays, since they control it).
  const reducedMotion = useRef(false);
  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Exploded view: GSAP scrubs explodeTarget.value 0 → 1 → 0 through the
  // Design section; useFrame eases `explode` toward it (same pattern as the pose).
  const explodeTarget = useRef({ value: 0 });
  const explode = useRef(0);
  const parts = useRef<Partial<Record<PartName, THREE.Group | null>>>({});
  const internalsRef = useRef<THREE.Group>(null!);
  // Callback ref: <group ref={part("glass")}> stores that group under its name.
  const part = (name: PartName) => (el: THREE.Group | null) => {
    parts.current[name] = el;
  };

  const screen = useMemo(createScreen, []);
  const glow = useMemo(createGlow, []);

  // ── Live screen: which face to show ─────────────────────────────────────────
  // Plain ref (not state): changing faces must not re-render React.
  const face = useRef({
    current: "clock" as Face,
    previous: "clock" as Face,
    changedAt: -Infinity, // when the current face appeared (for the crossfade)
    lastDraw: -Infinity,
    drawnKey: "", // what's on screen now (minute + finish name), to skip identical redraws
  });

  // Switch faces as sections reach the middle of the screen.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const triggers = SECTION_IDS.map((id) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          const f = face.current;
          const next = FACE_BY_SECTION[id];
          if (self.isActive && next !== f.current) {
            f.previous = f.current;
            f.current = next;
            f.changedAt = -1; // "just changed": useFrame stamps the real time
          }
        },
      })
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  // ── Mouse tilt (subtle parallax) ────────────────────────────────────────────
  // We listen on window ourselves because the canvas has pointer-events: none
  // (so it never blocks clicks on the page content above it).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1; // -1 … 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // ── Scroll choreography ─────────────────────────────────────────────────────
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // gsap.matchMedia() runs a different setup per screen size, and undoes the
    // old one automatically when you resize across the 860px breakpoint.
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 861px)", mobile: "(max-width: 860px)" }, (ctx) => {
      const desktop = Boolean(ctx.conditions?.desktop);
      const poses = desktop ? DESKTOP_POSES : MOBILE_POSES;
      const innerPoses = desktop ? DESKTOP_INNER_POSES : MOBILE_INNER_POSES;
      Object.assign(target.current, poses[0]);

      // One tween per section: blend from the previous section's pose to this
      // one while this section scrolls into view.
      //
      // Why there are no jumps: every tween uses fromTo() with *explicit*
      // start values, and each tween's start pose is exactly the previous
      // tween's end pose. The scroll ranges never overlap, because each one
      // runs from "section top hits screen bottom" to "section top hits 25%"
      // and every section is at least one screen tall.
      let from = poses[0]; // the pose the next tween starts from
      for (let i = 1; i < SECTION_IDS.length; i++) {
        const id = SECTION_IDS[i];
        gsap.fromTo(target.current, { ...from }, {
          ...poses[i],
          ease: "power1.inOut",
          immediateRender: false, // don't apply this pose until its section is reached
          scrollTrigger: {
            trigger: `#${id}`,
            start: "top bottom",
            end: "top 25%",
            scrub: true, // progress follows the scrollbar exactly
          },
        });
        from = poses[i];

        // Sections with an "inner" pose (Health) then move to it while you
        // scroll THROUGH them: hold, turn (middle 60% of the scroll), hold.
        // Its range starts after the arrival tween ends and finishes before
        // the next section starts arriving, so the chain still never overlaps.
        //   Desktop: the whole tall section, while the text is pinned.
        //   Mobile: finish early ("top -10%"), while the text is still below
        //   the watch, so the reading is seen before the text scrolls over it.
        const innerPose = innerPoses[id];
        if (innerPose) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: `#${id}`,
                start: desktop ? "top top" : "top 25%",
                end: desktop ? "bottom bottom" : "top -10%",
                scrub: true,
              },
            })
            .fromTo(target.current, { ...from }, { ...innerPose, duration: 0.6, ease: "power2.inOut", immediateRender: false }, 0.2)
            .set({}, {}, 1); // pads the timeline to 1, leaving the final 20% as a hold
          from = innerPose;
        }
      }

      // Exploded view in the Design section: come apart (40% of the scroll),
      // hold (20%), snap back together (40%), before the watch flips to Health.
      // On desktop the Design section is extra-tall with sticky text (see
      // .section-tall in globals.css), so this whole sequence plays while you read.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: "#design",
            start: desktop ? "top top" : "top 60%",
            end: "bottom bottom",
            scrub: true,
          },
        })
        .to(explodeTarget.current, { value: 1, duration: 0.4, ease: "power2.inOut" })
        .to(explodeTarget.current, { value: 0, duration: 0.4, ease: "power2.inOut" }, "+=0.2");
    });

    return () => mm.revert(); // kill every tween + ScrollTrigger on unmount
  }, []);

  // ── Every frame (~60×/s): ease the watch toward the target pose ─────────────
  useFrame((state, rawDelta) => {
    // Cap the frame time: after a pause (background tab, first frame after
    // shader warm-up) one huge delta would make everything snap instead of glide.
    const delta = Math.min(rawDelta, 1 / 30);
    const { width, height } = state.viewport; // visible area at depth 0, in 3D units
    const t = target.current;
    const p = pointer.current;
    const o = outer.current;
    const r = inner.current;

    // Shrink on narrow screens so the watch always fits (phones ≈ 0.5).
    const fit = Math.min(1, width / 3.4);
    // Gentle idle hover so the watch never looks frozen.
    const still = reducedMotion.current;
    const float = still ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
    const tiltX = still ? 0 : p.x;
    const tiltY = still ? 0 : p.y;

    // damp() moves a value a fraction of the way to its target each frame,
    // which gives a smooth "follow" feel no matter the frame rate. Higher
    // SPEED = snappier.
    const damp = THREE.MathUtils.damp;
    const SPEED = 5;
    o.position.x = damp(o.position.x, t.x * width, SPEED, delta);
    o.position.y = damp(o.position.y, t.y * height + float, SPEED, delta);
    o.position.z = damp(o.position.z, t.z, SPEED, delta);
    o.scale.setScalar(damp(o.scale.x, t.s * fit, SPEED, delta));

    // Drag to rotate (Finish section): after release, the flick keeps
    // spinning and slows down, then the watch settles back to its pose.
    const d = watchDrag;
    if (!d.dragging) {
      d.offset += d.velocity * delta;
      d.velocity = damp(d.velocity, 0, 3, delta);
      if (Math.abs(d.velocity) < 0.5) {
        // Settle back the SHORT way: drop whole turns first. Removing a full
        // 360° from both the target and the current rotation looks identical,
        // so there's no visible jump, and it avoids unwinding several turns.
        const fullTurns = Math.round(d.offset / (Math.PI * 2)) * Math.PI * 2;
        d.offset -= fullTurns;
        r.rotation.y -= fullTurns;
        d.offset = damp(d.offset, 0, 1.5, delta);
      }
    }

    r.rotation.x = damp(r.rotation.x, t.rx + tiltY * 0.12, SPEED, delta);
    r.rotation.y = damp(r.rotation.y, t.ry + tiltX * 0.2 + d.offset, SPEED, delta);
    r.rotation.z = damp(r.rotation.z, t.rz, SPEED, delta);

    // Exploded view: move every part by (its travel distance × explode amount).
    const e = (explode.current = damp(explode.current, explodeTarget.current.value, SPEED, delta));
    for (const name of Object.keys(EXPLODE) as PartName[]) {
      const [x, y, z] = EXPLODE[name];
      parts.current[name]?.position.set(x * e, y * e, z * e);
    }
    // The internals are fully hidden inside the case when assembled, so skip
    // drawing them entirely until the watch starts to open.
    internalsRef.current.visible = e > 0.01;

    // ── Hotspot labels: follow their 3D points, visible while exploded ──
    const labelOpacity = THREE.MathUtils.clamp((e - 0.55) / 0.3, 0, 1);
    if (labelOpacity > 0) r.updateWorldMatrix(true, false); // use this frame's rotation
    for (const h of HOTSPOTS) {
      const el = hotspotElements[h.id];
      if (!el) continue;
      el.style.opacity = String(labelOpacity);
      if (labelOpacity === 0) continue; // hidden: skip the maths
      const [ox, oy, oz] = EXPLODE[h.part];
      // 3D point on the part (moved with the explosion) → world space → screen.
      hotspotPoint
        .set(h.position[0] + ox * e, h.position[1] + oy * e, h.position[2] + oz * e)
        .applyMatrix4(r.matrixWorld)
        .project(state.camera); // now x, y are -1…1 across the canvas
      const px = (hotspotPoint.x * 0.5 + 0.5) * state.size.width;
      const py = (-hotspotPoint.y * 0.5 + 0.5) * state.size.height;
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }

    // ── Screen: redraw only when something visible changed ──
    const f = face.current;
    const time = state.clock.elapsedTime;
    if (f.changedAt === -1) f.changedAt = time;
    const fade = Math.min(1, (time - f.changedAt) / FACE_FADE);
    const animating = fade < 1 || ANIMATED_FACES.includes(f.current);
    const now = new Date();
    const key = `${f.current}|${now.getHours()}:${now.getMinutes()}|${watchDisplay.finishName}`;
    // Animated: ~30×/s. Static: only when the minute, finish or face changes.
    const due = animating ? time - f.lastDraw >= 1 / ANIMATION_FPS : key !== f.drawnKey;
    if (due) {
      drawScreen(screen.ctx, f.current, f.previous, fade, { now, time, finishName: watchDisplay.finishName });
      screen.texture.needsUpdate = true; // tell Three.js to re-upload the canvas to the GPU
      f.lastDraw = time;
      f.drawnKey = fade < 1 ? "" : key; // mid-fade frames are never "final"
    }
  });

  return (
    // Starts tiny, so on load it "grows" into the hero pose.
    <group ref={outer} scale={0.001}>
      <mesh geometry={geo.glowPlane} material={glow} position-z={-1} />

      <group ref={inner}>
        {/* Titanium case, with the dark display cavity (only visible once the glass lifts off) */}
        <mesh geometry={geo.caseBody} material={caseMaterial} />
        <mesh geometry={geo.cover} material={cavityMaterial} position-z={CASE.d / 2 + 0.001} />

        {/* Black sapphire glass + reflection-only cover */}
        <group ref={part("glass")}>
          <mesh geometry={geo.glass} material={glassMaterial} position-z={CASE.d / 2 - 0.01} />
          <mesh geometry={geo.cover} material={coverGlassMaterial} position-z={CASE.d / 2 + 0.018} />
        </group>

        {/* Live screen on a thin display panel */}
        <group ref={part("screen")}>
          <mesh geometry={geo.displayPanel} material={chipMaterial} position-z={CASE.d / 2 + 0.005} />
          <mesh geometry={geo.screen} position-z={CASE.d / 2 + 0.016}>
            <meshBasicMaterial map={screen.texture} transparent toneMapped={false} />
          </mesh>
        </group>

        {/* Internals: hidden inside the case until the exploded view */}
        <group ref={internalsRef} visible={false}>
          <group ref={part("board")}>
            <mesh geometry={geo.board} material={boardMaterial} />
            <mesh geometry={geo.chips} material={chipMaterial} />
            <mesh geometry={geo.soc} material={socMaterial} position={[0, 0.1, 0.03]} />
          </group>
          <group ref={part("battery")}>
            <mesh geometry={geo.battery} material={batteryMaterial} />
            <mesh geometry={geo.batteryBand} material={accentMaterial} position-y={0.3} />
          </group>
        </group>

        {/* Ridged digital crown with a teal accent ring, and the side button */}
        <group ref={part("crown")}>
          <mesh geometry={geo.crown} material={caseMaterial} position={[0.6, 0.2, 0]} rotation-z={Math.PI / 2} />
          <mesh geometry={geo.crownRing} material={accentMaterial} position={[0.63, 0.2, 0]} rotation-y={Math.PI / 2} />
        </group>
        <group ref={part("button")}>
          <mesh geometry={geo.button} material={caseMaterial} position={[0.55, -0.2, 0]} />
        </group>

        {/* Back: sapphire sensor dome with a glowing ring + 4 LEDs (seen in the Health section) */}
        <group ref={part("sensor")}>
          <group position-z={-CASE.d / 2} rotation-y={Math.PI}>
            <mesh geometry={geo.sensorDome} material={glassMaterial} position-z={0.015} rotation-x={Math.PI / 2} />
            <mesh geometry={geo.sensorRing} material={accentMaterial} position-z={0.037} />
            {[0, 1, 2, 3].map((i) => {
              const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
              return <mesh key={i} geometry={geo.led} material={accentMaterial} position={[Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0.037]} />;
            })}
          </group>
        </group>

        {/* One continuous curved strap on each side; buckle holes on the bottom one */}
        <group ref={part("strapTop")}>
          <mesh geometry={geo.strapTop} material={strapMaterial} />
        </group>
        <group ref={part("strapBottom")}>
          <mesh geometry={geo.strapBottom} material={strapMaterial} />
          <mesh geometry={geo.strapHoles} material={holeMaterial} />
        </group>
      </group>
    </group>
  );
}

// ─── Glow texture ───────────────────────────────────────────────────────────────

/** A soft radial gradient used as a halo behind the watch. */
function createGlow() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const map = new THREE.CanvasTexture(canvas);
  return new THREE.MeshBasicMaterial({
    map,
    color: "#00e0c6",
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending, // adds light instead of covering what's behind
    depthWrite: false,
  });
}
