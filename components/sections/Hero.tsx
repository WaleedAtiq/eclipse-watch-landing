const STATS = [
  { value: "72h", label: "Battery life" },
  { value: "18g", label: "Titanium case" },
  { value: "100m", label: "Water resist" },
];

// The watch itself is drawn by the 3D canvas behind the page (or shown as a
// static image on devices that can't run 3D smoothly).
// On desktop it sits in the empty right half; on mobile, above this text.
export default function Hero() {
  return (
    <header id="hero" className="section">
      {/* Fallback for devices without graphics acceleration (see SceneLoader.tsx).
          Hidden normally; lazy-loaded, so it isn't even downloaded unless shown. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static image, no optimisation needed */}
      <img
        src="/watch-poster.webp"
        alt="ECLIPSE titanium smartwatch"
        width={460}
        height={720}
        loading="lazy"
        className="watch-poster pointer-events-none absolute left-1/2 top-[9svh] h-[40svh] w-auto -translate-x-1/2 desktop:left-auto desktop:right-[4%] desktop:top-1/2 desktop:h-[78svh] desktop:-translate-y-1/2 desktop:translate-x-0"
      />
      <div className="w-full text-center desktop:w-1/2 desktop:text-left">
        <div className="eyebrow">Titanium Series — 01</div>
        <h1 className="text-[clamp(46px,7.5vw,100px)] font-bold leading-[1.02] tracking-[-0.02em]">
          Time,
          <br />
          <span className="font-extralight text-muted">reimagined.</span>
        </h1>
        <p className="mx-auto mb-9 mt-6 max-w-[440px] text-[17px] text-muted desktop:mx-0">
          A featherweight titanium smartwatch with a 72-hour battery, medical-grade sensors, and an always-on
          micro-LED display engineered to disappear on your wrist.
        </p>
        <a href="#order" className="btn">
          Reserve yours →
        </a>
        <div className="mt-12 flex flex-wrap justify-center gap-6 desktop:justify-start desktop:gap-10">
          {STATS.map((s) => (
            <div key={s.label}>
              <b className="block text-[26px] font-bold">{s.value}</b>
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted desktop:tracking-[0.2em]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
