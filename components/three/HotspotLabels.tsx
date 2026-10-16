"use client";

import { HOTSPOTS, hotspotElements } from "./exploded";

/*
 * The HTML labels for the exploded view. They start invisible; Watch.tsx moves
 * each one to its 3D point every frame and fades them in while the watch is
 * exploded (see exploded.ts for how that works).
 *
 * Each label's outer div sits exactly on the 3D point (0×0 size). Inside it:
 * a dot on the point, a leader line, then the text, stacked upward ("above")
 * or downward ("below").
 */
export default function HotspotLabels() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {HOTSPOTS.map((h) => (
        <div
          key={h.id}
          ref={(el) => {
            hotspotElements[h.id] = el;
          }}
          className="absolute left-0 top-0 opacity-0 will-change-transform"
        >
          <div
            className={`absolute flex -translate-x-1/2 items-center ${
              h.side === "above" ? "bottom-[-4px] flex-col-reverse" : "top-[-4px] flex-col"
            }`}
          >
            <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
            <span className="w-px bg-accent/60" style={{ height: h.lift }} />
            <span className="whitespace-nowrap rounded-full border border-line bg-bg/75 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-ink backdrop-blur desktop:text-[11px]">
              {h.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
