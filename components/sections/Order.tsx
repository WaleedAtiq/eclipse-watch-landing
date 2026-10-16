import ReserveButton from "./ReserveButton";

// Card on the RIGHT; the watch returns to the left for a final hero shot.
export default function Order() {
  return (
    <section id="order" className="section">
      <div className="glass reveal w-full px-6 py-14 text-center desktop:ml-auto desktop:w-1/2 desktop:px-12">
        <div className="eyebrow">Founder&apos;s batch — limited to 2,000</div>
        <h2 className="heading">Reserve your ECLIPSE.</h2>
        <p className="lead mx-auto mb-8">
          Priority shipping, custom engraving, and the magnetic charging puck included for pre-orders.
        </p>
        <ReserveButton />
      </div>
    </section>
  );
}
