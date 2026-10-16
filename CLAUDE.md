# CLAUDE.md — Project Context for Claude Code

## What this project is
**ECLIPSE** is a premium, fully-responsive **product landing page** for a fictional titanium
smartwatch. It is a **portfolio piece** for Waleed Atiq (front-end developer) to showcase on
Upwork. The visual target is an Awwwards-style, dark, cinematic product experience — the kind of
immersive landing page agencies and product brands pay for.

**Important:** This is a portfolio/concept build, not a real commercial product. Keep all content
clearly as a concept. The footer credits "Designed & developed by Waleed Atiq."

## Current state
- **Next.js 16 (App Router) + TypeScript + Tailwind v4 + React Three Fiber + GSAP ScrollTrigger + Lenis.**
- The original single-file SVG version is preserved at `legacy/index.html`.
- Builds as a fully static page (`npm run build`). Deploys to Vercel with no settings.

## Architecture (how it works)
- **3D layer** — one fixed full-screen `<Canvas>` behind the page (`components/three/Experience.tsx`),
  loaded client-only via `SceneLoader.tsx` (`next/dynamic`, `ssr:false`).
- **Procedural watch** — `components/three/Watch.tsx` assembles it; shapes are in `watchGeometry.ts`
  (pillow case, knurled crown, swept curved straps + holes). Screen = CanvasTexture live clock (OLED black)
  under a reflection-only cover glass. Reflections come from `studioEnvironment.ts` (softboxes rendered
  to a PMREM env map, no HDR download). Tone mapping = `NeutralToneMapping`.
- **Scroll choreography** — `lib/poses.ts` holds one pose per section (desktop + mobile sets; x/y are
  fractions of the viewport). In Watch.tsx, one `gsap.fromTo` per section writes a target pose into a ref;
  `useFrame` damps the model toward it. Section order must match `SECTION_IDS`.
- **Smooth scroll** — `components/SmoothScroll.tsx`: Lenis driven by `gsap.ticker`, `lenis.on('scroll', ScrollTrigger.update)`.
- **Configurator** — `lib/watchMaterials.ts` creates shared materials once; `applyFinish()` tweens them
  directly (no React state touches the 3D scene). `Configurator.tsx` imports it lazily to keep Three.js
  out of the main bundle.
- **Exploded view** — Design section. `EXPLODE` table in Watch.tsx (per-part travel); a scrubbed
  timeline on `#design` drives `explodeTarget.value` 0→1→0, useFrame damps it and offsets each part group.
  Internals (board/battery) are hidden unless exploded. Desktop `.section-tall` (220svh) + sticky inner wrapper.
- **Live screen** — `components/three/watchScreen.ts`: faces per section via `FACE_BY_SECTION`; Watch.tsx
  switches face with per-section ScrollTriggers and redraws in useFrame only when needed (30fps if animated/
  crossfading, else on minute/finish change). Finish name comes from `watchDisplay` in lib/watchMaterials.ts.
- **Inner poses** — `DESKTOP_INNER_POSES` / `MOBILE_INNER_POSES` in lib/poses.ts: a second pose within a
  section (Health: sensors → screen). Health is also `.section-tall` on desktop. Pose `ry` only increases
  down the page (no backward spins).
- **Section progress** — `components/SectionProgress.tsx`: right-hand dot rail (desktop), top bar (mobile).
  Fill = sum of per-section progress computed from scroll position; written via refs, not state.
  Note: Tailwind v4 `scale-*` uses the CSS `scale` property — don't combine it with JS `transform` scaling.
- **Reveals / counters** — `components/ScrollEffects.tsx` (`.reveal`, `[data-count]`) via ScrollTrigger.
- **Startup / performance** — no loader. `SceneLoader.tsx` probes WebGL with `failIfMajorPerformanceCaveat`
  (fails → `html.no-3d` → static `/watch-poster.webp` in Hero) and mounts the 3D on `requestIdleCallback`.
  `Experience.tsx`: async `buildGeometries()` (yields between pieces) → `<Watch geo>` → `ShaderWarmup`
  (`compileAsync`, frameloop "never" until done) → `AdaptiveQuality` drops dpr to 1 if < 45 fps.
  Lighthouse mobile ≈ 70–84, desktop 100. Re-check after adding anything heavy to the 3D.
- **Drag to rotate** — `DragToRotate.tsx` (Finish section) writes `watchDrag` (lib/watchInteraction.ts); Watch adds
  `offset` to rotation, inertia + settle-back (sheds whole turns so it never unwinds).
- **Hotspots** — `components/three/exploded.ts` (EXPLODE + HOTSPOTS), `HotspotLabels.tsx` registers elements,
  Watch projects 3D points to px each frame; opacity follows the explode value.
- **Reduced motion** — no Lenis, no reveals/counters, no idle float/mouse tilt.
- **Link previews** — `app/opengraph-image.png` / `twitter-image.png` (+ `.alt.txt`), metadata in layout.tsx.
- **Responsive** — single breakpoint `desktop:` = 861px+ (defined in `app/globals.css` @theme). On mobile,
  `.section` reserves the top 48svh for the watch.

## Conventions
- Avoid adding libraries unless there's a strong reason (drei was deliberately skipped; plain three addons are used).
- Colors are Tailwind theme tokens in `app/globals.css` (`bg-accent`, `text-muted`…) — reuse them, don't hardcode.
- Accent color is `--accent` (#00e0c6); keep the dark, premium aesthetic.
- Mobile-first mindset: always check the 860px breakpoint after layout changes.

## Likely next tasks (what the owner may ask for)
1. Swap in a real compressed **.glb watch** (see README "Using a real 3D model"); keep the shared materials.

## Guardrails
- Don't add analytics, tracking, or external calls.
- Don't claim the product is real.
- Keep performance high (this is judged by clients on mobile) — avoid heavy libraries for small gains.
- Explain changes so the owner can defend the code in a client call.
