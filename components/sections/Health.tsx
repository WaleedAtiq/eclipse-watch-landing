import FeatureList from "./FeatureList";

// Text on the LEFT. The watch arrives showing its sensor array, then turns
// around as you scroll to show the live heart-rate reading on its screen.
//
// Desktop: extra-tall section + sticky wrapper (same as Design), so the text
// stays in view while the turn plays.
export default function Health() {
  return (
    <section id="health" className="section section-tall">
      <div className="w-full desktop:sticky desktop:top-0 desktop:flex desktop:h-svh desktop:items-center desktop:pt-[72px]">
        <div className="w-full desktop:w-1/2">
          <div className="reveal">
            <div className="eyebrow">02 — Health engine</div>
            <h2 className="heading">A clinic on your wrist.</h2>
            <p className="lead">
              Six medical-grade sensors track what matters — continuously, quietly, accurately. Readings appear on
              your wrist the moment they&apos;re taken.
            </p>
          </div>
          <FeatureList
            big="6"
            bigCaption="Continuous sensors"
            items={[
              { title: "Medical-grade ECG", text: "Take a reading in 30 seconds and flag irregular rhythms early." },
              { title: "Blood-oxygen & sleep stages", text: "Overnight SpO₂ and full REM/deep/light sleep breakdown." },
              { title: "Stress & recovery score", text: "Heart-rate variability turned into one simple daily number." },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
