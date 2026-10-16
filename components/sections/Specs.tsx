const SPECS = [
  { value: 72, unit: "h", label: "Battery life" },
  { value: 2000, unit: "nits", label: "Peak brightness" },
  { value: 18, unit: "g", label: "Titanium case" },
  { value: 100, unit: "m", label: "Water resistance" },
  { value: 6, unit: "", label: "Health sensors" },
  { value: 15, unit: "min", label: "Full fast-charge" },
];

// The watch spins far in the background here, blurred through the glass cards.
// Numbers render as their real value in HTML (good for SEO / no-JS), then
// ScrollEffects counts them up from 0 when they scroll into view.
export default function Specs() {
  return (
    <section id="specs" className="section">
      <div className="w-full">
        <div className="reveal">
          <div className="eyebrow">04 — Technical index</div>
          <h2 className="heading">The numbers.</h2>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 desktop:mt-10 desktop:grid-cols-3 desktop:gap-5">
          {SPECS.map((s) => (
            <div key={s.label} className="glass reveal p-5 desktop:p-7">
              <div className="text-[26px] font-bold desktop:text-[34px]">
                <span data-count={s.value}>{s.value.toLocaleString("en-US")}</span>
                {s.unit && <small className="ml-1 text-base text-accent">{s.unit}</small>}
              </div>
              <div className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
