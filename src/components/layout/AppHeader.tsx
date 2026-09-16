// src/components/layout/AppHeader.tsx
"use client";

import Link from "next/link";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  backHref = "/",
  backLabel = "Back",
}: AppHeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-gutter-mobile flex items-center justify-between gap-space-sm">
        {/* Left: back button or logo */}
        <div className="flex items-center gap-space-sm min-w-0">
          {showBack ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
          ) : null}

          {/* Logo + brand text */}
          {!showBack && (
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-on-primary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  cable
                </span>
              </span>
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-label-lg text-primary tracking-tight truncate leading-tight font-bold">
              {title ?? "CableKhata"}
            </span>
            {subtitle && (
              <span className="text-label-sm text-on-surface-variant truncate uppercase tracking-wider">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Live badge + avatar */}
        <div className="flex items-center gap-space-sm shrink-0">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-label-sm uppercase tracking-wide font-extrabold">
              Live
            </span>
          </div>

          {/* Collector avatar (placeholder initials) */}
          <div className="relative flex items-center justify-center p-0.5 rounded-full bg-surface-container">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-sm font-extrabold shrink-0">
              R
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
