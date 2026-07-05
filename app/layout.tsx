import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";
import AppProvider from "@/providers";

export const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"],
});

export const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "SSC-2015 Foundation — Together We Give Back",
  description:
    "A community foundation by the SSC 2015 batch of Kaya Islamia Secondary School. Join us in making a difference through weekly and monthly contributions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", dmSerif.variable, sans.variable)} suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
