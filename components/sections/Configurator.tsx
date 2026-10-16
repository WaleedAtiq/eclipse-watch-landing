"use client";

import { useState } from "react";
import { FINISHES, type Finish } from "@/lib/finishes";

/*
 * The finish picker.
 *
 * On click, two separate things happen:
 *   1. applyFinish() tweens the shared Three.js materials DIRECTLY. The 3D
 *      scene is never re-rendered by React, which is why the change is instant.
 *   2. setActive() updates this small component only (the ring around the
 *      selected swatch, and the name/description text). That re-render costs
 *      almost nothing, and the 3D canvas is not part of it.
 */
export default function Configurator() {
  const [active, setActive] = useState(0);
  const finish = FINISHES[active];

  const choose = async (f: Finish, i: number) => {
    setActive(i);
    // Imported on demand so Three.js stays out of the page's main bundle.
    // The 3D scene has already loaded this module by the time anyone clicks,
    // so the import resolves instantly from cache.
    const { applyFinish } = await import("@/lib/watchMaterials");
    applyFinish(f);
  };

  return (
    <div className="glass reveal mt-8 p-7 desktop:p-9">
      <div className="flex flex-wrap gap-3 desktop:gap-4" role="radiogroup" aria-label="Case finish">
        {FINISHES.map((f, i) => (
          <button
            key={f.name}
            role="radio"
            aria-checked={i === active}
            aria-label={f.name}
            onClick={() => choose(f, i)}
            className={`size-[46px] cursor-pointer desktop:size-[52px] rounded-full border-2 transition-transform hover:scale-110 ${
              i === active ? "border-ink" : "border-transparent"
            }`}
            style={{ background: `linear-gradient(145deg, ${f.swatch[0]}, ${f.swatch[1]})` }}
          />
        ))}
      </div>
      <div className="mt-6 text-[22px] font-semibold">{finish.name}</div>
      <p className="mt-1 text-sm text-muted">{finish.desc}</p>
    </div>
  );
}
