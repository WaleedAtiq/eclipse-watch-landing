// The finishes shown in the configurator.
// Each one describes a *material*, not just a color: a polished finish has low
// roughness (sharp reflections), a matte/PVD finish has high roughness (soft).
export type Finish = {
  name: string;
  desc: string;
  caseColor: string; // metal color of the case + crown
  roughness: number; // 0 = mirror, 1 = chalk
  strapColor: string;
  swatch: [string, string]; // two colors for the round swatch button gradient
};

export const FINISHES: Finish[] = [
  {
    name: "Graphite Titanium",
    desc: "Our signature satin blast — understated and timeless.",
    caseColor: "#b9bfcb",
    roughness: 0.32,
    strapColor: "#2b2f3a",
    swatch: ["#c7ccd6", "#7f8696"],
  },
  {
    name: "Midnight Black",
    desc: "PVD-coated stealth black with a matte, fingerprint-resistant skin.",
    caseColor: "#2b2f38",
    roughness: 0.55,
    strapColor: "#16181e",
    swatch: ["#3a3f4b", "#1c2028"],
  },
  {
    name: "Rose Gold",
    desc: "Warm champagne tones over brushed titanium.",
    caseColor: "#e3b496",
    roughness: 0.28,
    strapColor: "#5a4036",
    swatch: ["#e9c4a8", "#b98a6d"],
  },
  {
    name: "Arctic Silver",
    desc: "High-polish mirror finish that catches the light.",
    caseColor: "#eef1f7",
    roughness: 0.1,
    strapColor: "#3a4050",
    swatch: ["#eef1f7", "#aab2c4"],
  },
  {
    name: "Cyber Teal",
    desc: "Anodized teal accent for a bolder statement.",
    caseColor: "#4fcabb",
    roughness: 0.3,
    strapColor: "#173a35",
    swatch: ["#5fd6c6", "#2f8c82"],
  },
];
