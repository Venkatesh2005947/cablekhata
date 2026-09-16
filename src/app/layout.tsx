// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import Toast from "@/components/ui/Toast";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CableKhata — Field Collection Manager",
  description:
    "Hyperlocal cable TV collection manager for field operators. Track daily door-to-door collections, manage areas, and view payment history.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CableKhata",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#006948",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${plusJakartaSans.variable}`}>
      <head>
        {/* Preconnect for Material Symbols only (Plus Jakarta Sans is handled by next/font) */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Material Symbols: fixed axes only (opsz=24, wght=600, FILL=0, GRAD=0)
            This avoids loading the full variable font (~200KB) and cuts it to ~60KB */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,600,0,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakartaSans.className} min-h-screen flex flex-col antialiased`}>
        <AppHeader />
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
          {children}
        </main>
        <BottomNav />
        <Toast />
      </body>
    </html>
  );
}
