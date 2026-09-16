// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import Toast from "@/components/ui/Toast";

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
    <html lang="en" className="light">
      <head>
        {/* Material Symbols Outlined icon font */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
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
