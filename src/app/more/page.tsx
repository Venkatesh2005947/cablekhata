// src/app/more/page.tsx
"use client";

import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

export default function MorePage() {
  return (
    <div className="flex-1 flex flex-col pb-28 pt-2">
      {/* Top Banner */}
      <div className="px-gutter-mobile py-2">
        <h1 className="text-headline-md text-on-surface font-extrabold">
          Settings & Profile
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          Field operator configuration and management
        </p>
      </div>

      <div className="px-gutter-mobile flex flex-col gap-space-md mt-space-sm">
        {/* Operator Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex items-center gap-3.5 border border-surface-container">
          <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-extrabold text-headline-sm shadow-xs shrink-0">
            RK
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-headline-sm text-on-surface font-bold truncate">
                Rajesh Kumar
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Operator
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Ward 4 Field Collection Route
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-label-sm text-primary font-bold">Shift Active</span>
            </div>
          </div>
        </div>

        {/* Quick Links Group */}
        <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden border border-surface-container">
          <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container">
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Field Operations
            </span>
          </div>

          <div className="divide-y divide-surface-container">
            <Link
              href="/manage/areas"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
                </span>
                <div>
                  <div className="text-label-lg font-bold text-on-surface">Manage Collection Areas</div>
                  <div className="text-body-sm text-on-surface-variant">Add or reorder collection routes</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
            </Link>

            <Link
              href="/collection"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">currency_rupee</span>
                </span>
                <div>
                  <div className="text-label-lg font-bold text-on-surface">Daily Collection Audit</div>
                  <div className="text-body-sm text-on-surface-variant">View transactions & Cash/UPI breakdown</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* System & Database Group */}
        <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden border border-surface-container">
          <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container">
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              System & Database
            </span>
          </div>

          <div className="divide-y divide-surface-container">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                </span>
                <div>
                  <div className="text-label-md font-bold text-on-surface">Database Status</div>
                  <div className="text-body-sm text-on-surface-variant">Firebase Firestore Connected</div>
                </div>
              </div>
              <span className="text-label-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                </span>
                <div>
                  <div className="text-label-md font-bold text-on-surface">App Version</div>
                  <div className="text-body-sm text-on-surface-variant">CableKhata v1.0.0 (Field Edition)</div>
                </div>
              </div>
              <span className="text-label-sm text-on-surface-variant font-mono">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
