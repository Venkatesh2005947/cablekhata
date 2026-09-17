// src/app/areas/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAreas } from "@/hooks/useAreas";
import ProgressBar from "@/components/ui/ProgressBar";
import QuickCollectModal from "@/components/payment/QuickCollectModal";
import type { AreaWithStats } from "@/types";

// ─── Today's Collection Summary Tile ─────────────────────────────────
function SummaryTile({ areas }: { areas: AreaWithStats[] }) {
  const totalCollected = areas.reduce((s, a) => s + a.collectedAmount, 0);
  const totalTarget = areas.reduce((s, a) => s + a.targetAmount, 0);
  const totalPaid = areas.reduce((s, a) => s + a.paidCount, 0);
  const totalPending = areas.reduce((s, a) => s + a.pendingCount, 0);
  const percent = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  return (
    <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-sm relative overflow-hidden">
      {/* Decorative blur blob */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              payments
            </span>
          </span>
          <span className="text-label-md uppercase tracking-wider text-on-surface-variant">
            Today's Collection
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-extrabold">
          {percent}% Reached
        </span>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-headline-lg-mobile text-primary font-extrabold">₹</span>
          <span className="text-currency-display text-on-surface font-extrabold tracking-tight tabular-nums">
            {totalCollected.toLocaleString("en-IN")}
          </span>
        </div>
        <span className="text-label-md text-on-surface-variant">
          Target: ₹{totalTarget.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Segmented progress bar */}
      <ProgressBar collected={totalCollected} target={totalTarget} showLabels={false} />

      <div className="grid grid-cols-2 gap-space-sm pt-1">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
          <span
            className="material-symbols-outlined text-primary text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <div className="flex flex-col">
            <span className="text-headline-sm text-on-surface leading-tight font-bold">
              {totalPaid}
            </span>
            <span className="text-label-sm text-on-surface-variant uppercase">
              Paid Houses
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
          <span
            className="material-symbols-outlined text-secondary text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            pending_actions
          </span>
          <div className="flex flex-col">
            <span className="text-headline-sm text-on-surface leading-tight font-bold">
              {totalPending}
            </span>
            <span className="text-label-sm text-on-surface-variant uppercase">
              Pending Houses
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Area Card ───────────────────────────────────────────────────────
function AreaCard({ area }: { area: AreaWithStats }) {
  return (
    <article className="area-item w-full bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-3 transition-all active:shadow-card-active">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">{area.icon}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-headline-sm text-on-surface truncate font-semibold">
                {area.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm shrink-0">
                {area.totalHouses} Houses
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant truncate">
              {area.description}
            </p>
          </div>
        </div>
        <Link
          href={`/manage/areas`}
          aria-label={`Edit ${area.name} Area`}
          className="min-w-[48px] min-h-[48px] -mr-2 -mt-2 rounded-lg text-on-surface-variant flex items-center justify-center hover:bg-surface-container active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">edit_location</span>
        </Link>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/50 text-on-primary-fixed text-label-sm font-extrabold">
          <span className="material-symbols-outlined text-[14px]">check</span>
          {area.paidCount} Paid
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-label-sm">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {area.pendingCount} Pending
        </span>
        {area.partialCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-extrabold">
            <span className="material-symbols-outlined text-[14px]">incomplete_circle</span>
            {area.partialCount} Partial
          </span>
        )}
      </div>

      {/* Progress */}
      <ProgressBar collected={area.collectedAmount} target={area.targetAmount} />

      {/* CTA */}
      <Link
        href={`/areas/${area.id}`}
        className="w-full min-h-[48px] px-4 rounded-xl bg-primary-fixed text-on-primary-fixed text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-card"
      >
        <span>Open Area</span>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </article>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-3 animate-pulse">
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-surface-container shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 bg-surface-container rounded w-3/4" />
          <div className="h-3 bg-surface-container rounded w-1/2" />
        </div>
      </div>
      <div className="h-2 bg-surface-container rounded-full w-full" />
      <div className="h-12 bg-surface-container rounded-xl w-full" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function AreasPage() {
  const { areas, loading, error } = useAreas();
  const [search, setSearch] = useState("");
  const [showQuickCollect, setShowQuickCollect] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return areas;
    const q = search.toLowerCase();
    return areas.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [areas, search]);

  const totalHouses = areas.reduce((s, a) => s + a.totalHouses, 0);

  return (
    <div className="flex flex-col w-full">
      {/* Collector Context Bar */}
      <div className="w-full px-gutter-mobile py-space-sm bg-surface-container-low flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0 shadow-sm">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              badge
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-headline-sm text-on-surface truncate font-semibold">
              Good Morning, Rajesh
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-label-sm text-primary uppercase font-extrabold tracking-wider">
                Ward 4 Active
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-label-sm text-on-surface-variant">Morning Route</span>
            </div>
          </div>
        </div>
        <button
          aria-label="Quick Route Map"
          className="min-w-[48px] min-h-[48px] rounded-xl bg-surface-container-lowest text-on-surface shadow-card flex items-center justify-center active:scale-95 transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">map</span>
        </button>
      </div>

      <div className="px-gutter-mobile flex flex-col gap-space-md mt-space-sm">
        {/* Summary tile — show immediately if we have any data (cached or live).
            Only show a slim skeleton on true cold start (no data at all). */}
        {areas.length > 0 ? (
          <SummaryTile areas={areas} />
        ) : loading ? (
          <div className="h-40 bg-surface-container-lowest rounded-xl animate-pulse" />
        ) : (
          <SummaryTile areas={areas} />
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-space-sm">
          <button
            onClick={() => setShowQuickCollect(true)}
            className="min-h-[52px] px-3 rounded-xl bg-primary text-on-primary text-label-lg font-bold shadow-card flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
            <span>Quick Collect</span>
          </button>
          <Link
            href="/manage/areas"
            className="min-h-[52px] px-3 rounded-xl bg-surface-container-high text-on-surface text-label-lg font-bold shadow-card flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-primary text-[22px]">add_location_alt</span>
            <span>+ Add Area</span>
          </Link>
        </div>

        {/* Section heading */}
        <div className="flex flex-col gap-0.5 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md text-on-surface font-bold">
              Collection Areas ({areas.length})
            </h2>
            <span className="text-label-md text-primary font-bold">
              {totalHouses} Houses Total
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Tap an area to start door-to-door collection
          </p>
        </div>

        {/* Search bar */}
        <div className="relative flex items-center w-full shadow-card rounded-xl bg-surface-container-lowest">
          <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[22px] pointer-events-none">
            search
          </span>
          <input
            id="areaSearchInput"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search area, landmark, house no..."
            className="w-full h-[52px] pl-11 pr-14 rounded-xl bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
          />
          <div className="absolute right-1 flex items-center gap-1 pr-1">
            <button
              aria-label="Scan barcode"
              className="min-w-[44px] min-h-[44px] rounded-lg text-primary flex items-center justify-center hover:bg-surface-container active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">barcode_scanner</span>
            </button>
          </div>
        </div>

        {/* Area cards — show cached data immediately; skeleton only on true cold
            start (loading=true AND no cached data at all). */}
        <div className="flex flex-col gap-space-sm pb-space-lg">
          {loading && areas.length === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error && areas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-space-xl text-center bg-surface-container-lowest rounded-xl shadow-card">
              <span className="material-symbols-outlined text-error text-[32px] mb-2">error</span>
              <p className="text-headline-sm text-on-surface">Failed to load areas</p>
              <p className="text-body-sm text-on-surface-variant mt-1">{error}</p>
            </div>
          ) : filtered.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center p-space-xl text-center bg-surface-container-lowest rounded-xl shadow-card">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-2">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <p className="text-headline-sm text-on-surface">No Area Found</p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Try typing a nearby street or landmark name.
              </p>
            </div>
          ) : (
            filtered.map((area) => <AreaCard key={area.id} area={area} />)
          )}
        </div>
      </div>

      {/* Quick Collect Modal */}
      <QuickCollectModal
        isOpen={showQuickCollect}
        onClose={() => setShowQuickCollect(false)}
      />
    </div>
  );
}
