import Configurator from "./Configurator";
import DragToRotate from "./DragToRotate";

// Configurator on the RIGHT; the watch faces you on the left so you can see each finish.
// DragToRotate sits over the watch's area (left half on desktop, top half on
// mobile) so visitors can spin the watch to inspect the finish.
export default function Finish() {
  return (
    <section id="finish" className="section">
      <DragToRotate className="absolute inset-x-0 top-0 h-[48svh] desktop:inset-y-0 desktop:right-1/2 desktop:h-auto" />
      <div className="w-full desktop:ml-auto desktop:w-1/2">
        <div className="reveal">
          <div className="eyebrow">03 — Material spectrum</div>
          <h2 className="heading">Pick your finish.</h2>
          <p className="lead">
            Each finish changes the metal itself, not just its color: polished cases reflect sharply, matte ones
            diffuse the light.
          </p>
        </div>
        <Configurator />
      </div>
    </section>
  );
}
