import FeatureList from "./FeatureList";

// Text on the RIGHT; on the left the watch comes apart into its layers
// (the exploded view, driven by scrolling through this section).
//
// Desktop: the section is extra-tall (.section-tall) and this wrapper is
// `sticky top-0` and one screen high, so the text stays pinned in view while
// you scroll through the exploded view. Plain CSS, no JavaScript pinning.
export default function Design() {
  return (
    <section id="design" className="section section-tall">
      <div className="w-full desktop:sticky desktop:top-0 desktop:flex desktop:h-svh desktop:items-center desktop:pt-[72px]">
        <div className="w-full desktop:ml-auto desktop:w-1/2">
          <div className="reveal">
            <div className="eyebrow">01 — Architecture</div>
            <h2 className="heading">
              Aerospace titanium.
              <br />
              Zero compromise.
            </h2>
            <p className="lead">
              Machined from a single block of grade-5 titanium, then bead-blasted to a satin finish that resists
              scratches, salt and sweat. 40% lighter than steel, twice as strong.
            </p>
          </div>
          <FeatureList
            big="18g"
            bigCaption="Total wrist weight"
            items={[
              { title: "Sapphire crystal glass", text: "Virtually unscratchable, anti-glare coated for sunlight legibility." },
              { title: "Micro-LED always-on display", text: "2,000 nits peak brightness at a fraction of the power draw." },
              { title: "IP68 + 100m water resistance", text: "Swim, shower and dive-ready out of the box." },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
