// src/components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "home", path: "/" },
  { href: "/areas", label: "Areas", icon: "pin_drop", path: "/areas" },
  { href: "/collection", label: "Collection", icon: "currency_rupee", path: "/collection" },
  { href: "/more", label: "More", icon: "more_horiz", path: "/more" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="h-16 px-gutter-mobile flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors ${
                active
                  ? "text-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">
                  {item.icon}
                </span>
                {/* Active pill indicator */}
                {active && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-label-md tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
