"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Watch from "./Watch";
import { buildGeometries, type WatchGeometries } from "./watchGeometry";
import HotspotLabels from "./HotspotLabels";
import { createStudioEnvironment } from "./studioEnvironment";

/*
 * The 3D layer. It is one full-screen <canvas> fixed BEHIND the page. The HTML
 * sections scroll on top of it, and the watch moves inside it to match.
 *
 * One canvas for the whole page (instead of one per section) means one WebGL
 * context and one render loop, which is much lighter on phones.
 */
export default function Experience() {
  // Phones/tablets (touch screens) get a lower pixel-ratio cap: they have
  // high-density screens but much weaker GPUs than laptops.
  const maxDpr = window.matchMedia("(pointer: coarse)").matches ? 1.5 : 1.75;

  // Don't draw a single frame until every shader is compiled (ShaderWarmup).
  // frameloop "never" = the render loop is paused; "always" = 60×/s.
  const [compiled, setCompiled] = useState(false);
  const markCompiled = useCallback(() => setCompiled(true), []); // stable, so the warm-up runs once

  // Build the watch's shapes in small steps (see buildGeometries), then mount it.
  const [geo, setGeo] = useState<WatchGeometries | null>(null);
  useEffect(() => {
    let cancelled = false;
    buildGeometries().then((g) => !cancelled && setGeo(g));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        // Device-pixel-ratio cap: crisp on retina, but never render at 3× on
        // phones (that would be 9× the pixels of 1× for little visible gain).
        dpr={[1, maxDpr]}
        frameloop={compiled ? "always" : "never"}
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          // "Neutral" tone mapping (Khronos PBR Neutral) was designed for product
          // renders: it keeps colors true, so Rose Gold looks like rose gold
          // instead of drifting orange or washing out like the default does.
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <StudioLighting />
        <AdaptiveQuality />
        {geo && (
          <>
            <Watch geo={geo} />
            <ShaderWarmup onDone={markCompiled} />
          </>
        )}
      </Canvas>
      <HotspotLabels />
    </div>
  );
}

/** Studio reflections (see studioEnvironment.ts) + two real lights. */
function StudioLighting() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const envMap = createStudioEnvironment(gl);
    scene.environment = envMap;
    return () => {
      scene.environment = null;
      envMap.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      {/* Key light: adds a little directional shading on the strap */}
      <directionalLight position={[3, 4, 5]} intensity={0.8} />
      {/* Teal rim light from behind, matching the brand accent */}
      <pointLight position={[-3, -1, -2]} color="#00e0c6" intensity={10} />
    </>
  );
}

/**
 * Safety net for slow devices: measure the real frame rate, and if it stays
 * below 45 fps, render at 1× pixel ratio. That's roughly half the pixels on a
 * retina screen, so it's much lighter while still looking sharp.
 * The first 3 seconds are ignored (the page is still loading and compiling).
 */
function AdaptiveQuality() {
  const setDpr = useThree((state) => state.setDpr);
  const stats = useRef({ elapsed: 0, time: 0, frames: 0, lowered: false });

  useFrame((_, delta) => {
    const s = stats.current;
    if (s.lowered) return;
    s.elapsed += delta;
    if (s.elapsed < 3) return; // warm-up
    s.time += delta;
    s.frames += 1;
    if (s.time >= 2) {
      if (s.frames / s.time < 45) {
        setDpr(1);
        s.lowered = true;
      }
      s.time = 0;
      s.frames = 0;
    }
  });

  return null;
}

/**
 * Shaders are the small programs the GPU runs to draw each material. They must
 * be compiled before first use, and by default that happens all at once on the
 * first frame, which freezes the page while it runs (it's slow on phones).
 *
 * compileAsync() compiles them in the background (using the browser's
 * parallel-compile extension where available) while the page stays responsive.
 * Only then does the render loop start.
 */
function ShaderWarmup({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    let cancelled = false;
    // Include parts that are hidden until later (the exploded view's internals),
    // so they don't cause a stutter the first time they appear.
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    gl.compileAsync(scene, camera).then(() => {
      hidden.forEach((o) => (o.visible = false));
      if (!cancelled) onDone();
    });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onDone]);

  return null;
}
