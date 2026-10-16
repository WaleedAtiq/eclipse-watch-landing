# ECLIPSE — 3D Titanium Smartwatch Landing Page

A premium, fully-responsive product landing page **concept** for a fictional titanium smartwatch.
A real-time 3D watch glides between poses as you scroll, flips to reveal its sensors, and changes
finish instantly in a live configurator.

**Built by Waleed Atiq.** Concept build to showcase front-end development.

**Built with:** Next.js · TypeScript · Tailwind CSS · Three.js (React Three Fiber) · GSAP ScrollTrigger · Lenis

---

## What makes it fast and smooth

### Performance (Lighthouse, production build)
| | Mobile | Desktop |
|---|---|---|
| Performance | 70–84 | 100 |
| Accessibility · Best Practices · SEO | 100 · 100 · 100 | — |
| Largest Contentful Paint | 2.5 s | 0.6 s |
| Layout shift | 0 | 0 |

How: no loading screen (text paints immediately, the watch grows in once ready); the 3D starts only
when the browser is idle; shapes are built in small async steps; shaders compile in the background
(`compileAsync`); slow frame rates drop to 1× pixel ratio; devices **without GPU acceleration** get a
static 8 KB image instead of 2 fps 3D (`failIfMajorPerformanceCaveat`). Lighthouse mobile varies
run to run, since it simulates a slow phone.

### 1. Fast loading: no model download
The watch is **built from code** (`components/three/watchGeometry.ts`): a rounded "pillow" case,
a ridged (knurled) crown, and straps made by sweeping a rounded cross-section along a curve (with a
rounded tip and buckle holes). A typical downloaded product model is 10–130 MB. This one is a few KB of JavaScript.

- Studio reflections come from a **virtual photo studio built in code** (`studioEnvironment.ts`):
  glowing softboxes and strip lights that the metal reflects. There's no multi-MB `.hdr` file.
- The 3D code loads as a separate chunk (`next/dynamic` with `ssr: false`), so text appears first.
- Pixel ratio is capped at 1.75 so phones don't render at 3×.
- The watch screen's canvas texture is re-uploaded once a minute, not every second.

### 2. Smooth scroll with no jumps
- **Lenis** turns stepped mouse-wheel scrolling into a glide (`components/SmoothScroll.tsx`).
- Lenis and **GSAP ScrollTrigger** share one clock (GSAP's ticker), so they never disagree about the scroll position.
- Each section has a **pose** (`lib/poses.ts`). One `fromTo` tween per section blends from the
  previous pose to the next. Each tween's start equals the previous tween's end, and the scroll ranges
  don't overlap, so there's nothing to jump between.
- GSAP writes a *target* pose. Every frame, `useFrame` eases the real model toward it with
  `MathUtils.damp`, which adds a final layer of smoothing.
- Nothing scroll-related uses React state, so scrolling causes **zero React re-renders**.

### 3. Instant color changes
The materials are created **once**, outside React (`lib/watchMaterials.ts`). The 3D model and the
configurator share those same objects. Clicking a swatch calls `applyFinish()`, which tweens
`material.color` and `material.roughness` directly with GSAP. React never re-renders the 3D
scene, so the change is instant and animates smoothly between finishes.

### 4. Looking real
What separates "3D model" from "product photo":
- **Bare metal, no clear-coat.** A lacquer layer on metal reads as plastic.
- **Studio reflections.** Metal is a mirror, so it needs crisp softbox highlights to look like metal.
- **Glass you can see.** The screen sits under a reflection-only sapphire layer (black + additive
  blending, real sapphire IOR 1.77). Reflections sweep across it while the screen stays readable.
- **OLED black screen** that blends into the bezel, like a real device.
- **Soft-touch strap** using `sheen` (the velvety edge glow of rubber/fabric), continuous curvature, and buckle holes.
- **Neutral tone mapping** (Khronos PBR Neutral), made for product renders, so finish colors stay true.

### 5. Exploded view
In the Design section the watch comes apart as you scroll: sapphire glass, display, logic board,
battery, case, and sensor separate in layers, the crown and button slide out, then everything snaps back.
- `EXPLODE` in `Watch.tsx` lists how far each part travels. One number (0 = assembled, 1 = exploded),
  scrubbed by a GSAP timeline, moves every part, so there's no per-part animation code.
- The board and battery stay hidden inside the case (and aren't drawn at all) until the watch opens.
- On desktop the section is 2.2 screens tall with `position: sticky` text, so the explosion plays
  while the copy stays readable. It's plain CSS, with no JavaScript pinning.

### 6. Drag to rotate & hotspots
- **Finish section:** drag (or swipe sideways on a phone) to spin the watch, with flick inertia, then it
  settles back. An invisible element over the watch (`DragToRotate.tsx`) writes to a shared object
  (`lib/watchInteraction.ts`) that the 3D reads every frame, so dragging causes no React re-renders.
- **Exploded view labels:** HTML labels pinned to 3D points (`exploded.ts`). Each frame the point is
  projected from 3D to screen pixels, so crisp HTML text follows the spinning model.

### 7. Live screen per section
The watch screen is a 2D canvas used as a texture (`components/three/watchScreen.ts`), with a
different face per section: clock → **live ECG + heart rate** (Health) → the selected finish
name (Finish) → battery (Specs) → Founder's Edition badge (Order). Faces crossfade.
- In Health the watch arrives showing its sensors, then turns to show the reading. That's an
  "inner pose" in `lib/poses.ts`, a second pose a section moves to while you scroll through it.
- The texture is only re-uploaded to the GPU when something changed: about 30×/s while the ECG
  or a crossfade animates, otherwise once a minute.
- The ECG is built from five bell curves, one per real ECG wave (P, Q, R, S, T).

### 8. Section progress indicator
`components/SectionProgress.tsx`: a dot rail on the right (desktop) and a top bar (mobile).
Like the watch, the per-frame fill is written straight to the DOM through refs. Only the active
section uses React state, and that changes about 6 times per full scroll.

---

## Project structure

```
app/
  layout.tsx, page.tsx, globals.css   ← page shell + design tokens (@theme)
components/
  three/
    SceneLoader.tsx   ← GPU check + starts the 3D when the browser is idle
    exploded.ts       ← exploded-view travel distances + hotspot labels
    HotspotLabels.tsx ← the HTML labels that follow the 3D parts
    Experience.tsx    ← fixed full-screen <Canvas>, lighting, reflections
    Watch.tsx         ← assembles the watch + scroll choreography + live clock
    watchGeometry.ts  ← case, crown, curved straps (all shapes)
    watchScreen.ts    ← screen faces (clock, ECG, battery, badge)
    studioEnvironment.ts ← virtual photo studio for reflections
  sections/           ← Hero, Design, Health, Finish (+Configurator), Specs, Order, Footer
  SmoothScroll.tsx    ← Lenis ↔ GSAP wiring
  SectionProgress.tsx ← section rail (desktop) / top progress bar (mobile)
  ScrollEffects.tsx   ← text reveals + number count-ups
  Nav.tsx
lib/
  watchInteraction.ts ← drag-to-rotate shared state
  poses.ts            ← where the watch sits in each section (desktop + mobile)
  finishes.ts         ← configurator data
  watchMaterials.ts   ← shared materials + applyFinish()
legacy/index.html     ← the original single-file SVG version
```

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel
Push to GitHub, then on vercel.com go to Add New Project, import the repo, and click Deploy. No settings are needed.

---

## Using a real 3D model (optional)
If you get a modelled watch (e.g. a `.glb` from Sketchfab, checking its license), **compress it
first**. This is where "130 MB → 7 MB" wins come from:

```bash
npx @gltf-transform/cli optimize watch.glb public/models/watch.glb --compress meshopt --texture-compress webp --texture-size 2048
```

- `--compress meshopt` shrinks the geometry.
- `--texture-compress webp` and `--texture-size 2048` shrink the images, which are usually most of the file size.

Then load it with `useGLTF` from `@react-three/drei` and assign the shared materials by mesh name
(e.g. `nodes.Case.material = caseMaterial`), so the configurator keeps working unchanged.

## Ideas / next steps
- A real `.glb` watch, compressed as described above (the most photoreal option)
