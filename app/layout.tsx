import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CLINIC } from "@/lib/clinic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${CLINIC.name} | Dentist in ${CLINIC.city}`, template: `%s | ${CLINIC.name}` },
  description: `${CLINIC.name} in Saheed Nagar, ${CLINIC.city}. Checkups, root canal, braces, whitening and implants. Book an appointment online.`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: CLINIC.name,
    title: `${CLINIC.name}, ${CLINIC.city}`,
    description: "Gentle dental care for the whole family. Pick a time slot and book online.",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B6E6E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
