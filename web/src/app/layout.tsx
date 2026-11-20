import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Barlow_Condensed, Geist } from "next/font/google";
import { cssVariables } from "@/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

// Condensed face for the ticket-style seat label (see theme fonts.ticket).
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "seatview",
  description: "Approximate view from your seat before you buy the ticket.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${barlowCondensed.variable}`}
      // Theme tokens as CSS custom properties; single source: src/theme.
      style={cssVariables() as CSSProperties}
    >
      <body>{children}</body>
    </html>
  );
}
