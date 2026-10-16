/*
 * Drag-to-rotate state, shared outside React (same pattern as watchMaterials.ts).
 *
 * The 3D canvas has pointer-events: none so it never blocks the page. So the
 * dragging happens on an invisible HTML element over the watch
 * (components/sections/DragToRotate.tsx), which writes here, and Watch.tsx
 * reads it every frame. Neither side re-renders React while you drag.
 */
export const watchDrag = {
  dragging: false,
  /** Extra spin (radians) added on top of the scroll pose. Settles back to 0 after release. */
  offset: 0,
  /** Spin speed (radians/second) at release, for the "flick" inertia. */
  velocity: 0,
};
