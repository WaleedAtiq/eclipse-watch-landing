import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css"; // small stylesheet Lenis needs to work correctly
import "./globals.css";

const title = "ECLIPSE // Titanium Smartwatch (Concept)";
const description =
  "Concept product page for a fictional titanium smartwatch — interactive 3D, scroll-driven animation and a live finish configurator. Designed & developed by Waleed Atiq.";

/*
 * Link previews (LinkedIn, Upwork, Slack, X, iMessage…).
 * The preview IMAGE comes from app/opengraph-image.png + twitter-image.png:
 * Next.js finds those files by name and adds the right <meta> tags itself.
 * On Vercel the image URLs automatically use the deployed domain.
 */
export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Waleed Atiq" }],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "ECLIPSE — concept by Waleed Atiq",
  },
  twitter: {
    card: "summary_large_image", // big image preview instead of a small thumbnail
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#06070a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
