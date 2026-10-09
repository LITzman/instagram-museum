import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";
import { loadMuseum } from "@/lib/pictures";

// Noto Sans for Latin text, Noto Sans Hebrew for Hebrew. globals.css lists Noto Sans first: its faces cover only Latin
// ranges, so Hebrew letters fall through to Noto Sans Hebrew. Neither gets a metric-matched fallback face (local
// Arial, covering every character), which would claim the Hebrew letters first.
const hebrew = Noto_Sans_Hebrew({
  variable: "--font-hebrew",
  subsets: ["hebrew"],
  weight: ["300", "400", "500", "600"],
  adjustFontFallback: false,
  fallback: [],
});

const latin = Noto_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  adjustFontFallback: false,
  fallback: [],
});

export async function generateMetadata(): Promise<Metadata> {
  const { pageTitle, description } = await loadMuseum();
  return { title: pageTitle, description };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${hebrew.variable} ${latin.variable}`}>
      <body>{children}</body>
    </html>
  );
}
