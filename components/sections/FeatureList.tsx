// Shared layout for the Design and Health sections:
// a highlighted big number, followed by a list of sub-features.
type Props = {
  big: string;
  bigCaption: string;
  items: { title: string; text: string }[];
};

export default function FeatureList({ big, bigCaption, items }: Props) {
  return (
    <div className="glass reveal mt-8 p-7 desktop:p-9">
      <div className="flex items-baseline gap-4">
        <span className="text-[40px] font-bold text-accent">{big}</span>
        <span className="text-sm text-muted">{bigCaption}</span>
      </div>
      {items.map((item) => (
        <div key={item.title} className="mt-5">
          <h3 className="mb-1 text-[17px] font-semibold">{item.title}</h3>
          <p className="text-sm text-muted">{item.text}</p>
        </div>
      ))}
    </div>
  );
}
