// src/app/manage/areas/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAreas } from "@/hooks/useAreas";
import { showToast } from "@/components/ui/Toast";
import type { AreaWithStats } from "@/types";

function AreaManageCard({ area }: { area: AreaWithStats }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-label-md shrink-0 shadow-card">
            {area.walkOrder}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-headline-sm text-on-surface truncate flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                {area.icon}
              </span>
              {area.name}
            </span>
            <span className="text-label-sm text-on-surface-variant font-semibold">
              Stop #{area.walkOrder} on Morning Route
            </span>
          </div>
        </div>
        <span className="px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-extrabold shrink-0 shadow-card">
          Active Lane
        </span>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-1.5 bg-surface-container-low p-2 rounded-lg">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface text-label-sm font-bold">
          {area.totalHouses} Houses
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed/60 text-on-primary-fixed text-label-sm font-bold">
          ✓ {area.paidCount} Paid
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm">
          ◷ {area.pendingCount} Pending
        </span>
        {area.partialCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-bold">
            ◐ {area.partialCount} Partial
          </span>
        )}
      </div>

      <p className="text-body-sm text-on-surface-variant leading-snug">{area.description}</p>

      {area.totalHouses > 0 && (
        <div className="flex items-center gap-2 bg-secondary-fixed-dim/30 px-2.5 py-2 rounded-lg text-on-secondary-fixed">
          <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
          <span className="text-label-sm">
            {area.totalHouses} houses attached — must reassign or archive if deleted
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href={`/areas/${area.id}`}
          className="h-11 bg-primary text-on-primary rounded-lg text-label-md font-bold flex items-center justify-center gap-1.5 shadow-card active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">home_work</span>
          <span>Open Houses</span>
        </Link>
        <button
          type="button"
          className="h-11 bg-surface-container text-on-surface rounded-lg text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
          onClick={() => showToast({ message: `Edit ${area.name} — coming in Phase 4`, icon: "edit" })}
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          <span>Edit Area</span>
        </button>
        <button
          type="button"
          className="h-11 bg-surface-container-high text-on-surface rounded-lg text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-highest transition-colors"
          onClick={() => showToast({ message: "Bulk move coming in Phase 4", icon: "swap_horiz" })}
        >
          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
          <span>Move Houses</span>
        </button>
        <button
          type="button"
          className="h-11 bg-error-container text-on-error-container rounded-lg text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          onClick={() => showToast({ message: area.totalHouses > 0 ? `Reassign ${area.totalHouses} houses first` : "Delete area?", icon: area.totalHouses > 0 ? "warning" : "delete" })}
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          <span>Delete Area</span>
        </button>
      </div>
    </div>
  );
}

export default function ManageAreasPage() {
  const { areas, loading } = useAreas();
  const [showForm, setShowForm] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [areaDesc, setAreaDesc] = useState("");
  const [defaultPlan, setDefaultPlan] = useState(250);
  const [saving, setSaving] = useState(false);

  const totalCollected = areas.reduce((s, a) => s + a.collectedAmount, 0);
  const totalTarget = areas.reduce((s, a) => s + a.targetAmount, 0);
  const totalHouses = areas.reduce((s, a) => s + a.totalHouses, 0);
  const percent = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const handleSaveArea = async () => {
    if (!areaName.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "areas"), {
        name: areaName.trim(),
        description: areaDesc.trim(),
        icon: "location_on",
        walkOrder: areas.length + 1,
        defaultMonthlyFee: defaultPlan,
        createdAt: new Date().toISOString(),
      });
      showToast({ message: `Area "${areaName}" added!`, icon: "check_circle" });
      setAreaName("");
      setAreaDesc("");
      setDefaultPlan(250);
      setShowForm(false);
    } catch {
      showToast({ message: "Failed to add area", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-gutter-mobile gap-space-md">
      {/* Back nav */}
      <div className="flex items-center justify-between pt-space-sm">
        <Link
          href="/areas"
          className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="text-label-md">Back to Home</span>
        </Link>
        <span className="inline-flex items-center gap-1 text-on-surface-variant text-label-sm uppercase tracking-wider bg-surface-container-low px-2 py-0.5 rounded-md">
          <span className="material-symbols-outlined text-[14px]">tune</span> Route Optimizer
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-lg-mobile text-on-surface font-bold tracking-tight">
            Manage Collection Areas
          </h2>
          <span className="material-symbols-outlined text-primary text-[26px]">map</span>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Reorder physical walking routes, add landmarks & move houses
        </p>
      </div>

      {/* Add area CTA */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full h-[52px] bg-primary text-on-primary rounded-xl text-label-lg font-bold flex items-center justify-center gap-2 shadow-card hover:bg-primary-container active:scale-[0.99] transition-all"
        type="button"
      >
        <span className="material-symbols-outlined text-[22px]">add_circle</span>
        <span>{showForm ? "Cancel" : "Add New Collection Area"}</span>
      </button>

      {/* Stats tile */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wide">Route Progress & Coverage</span>
          <span className="text-label-md text-primary font-bold bg-primary-fixed/40 px-2 py-0.5 rounded-full">
            {percent}% Collected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col">
            <span className="text-label-sm text-on-surface-variant">Active Areas</span>
            <span className="text-headline-md text-on-surface font-extrabold">
              {areas.length} <span className="text-body-sm text-on-surface-variant font-normal">lanes</span>
            </span>
          </div>
          <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col">
            <span className="text-label-sm text-on-surface-variant">Total Capacity</span>
            <span className="text-headline-md text-on-surface font-extrabold">
              {totalHouses} <span className="text-body-sm text-on-surface-variant font-normal">houses</span>
            </span>
          </div>
        </div>
        <div className="bg-surface-container-high/60 rounded-lg p-space-sm flex items-center justify-between mt-1">
          <div className="flex flex-col">
            <span className="text-label-sm text-on-surface-variant">Collected Today</span>
            <span className="text-headline-sm text-primary font-extrabold tabular-nums">
              ₹{totalCollected.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-8 w-px bg-surface-dim" />
          <div className="flex flex-col items-end">
            <span className="text-label-sm text-on-surface-variant">Expected Target</span>
            <span className="text-headline-sm text-on-surface font-extrabold tabular-nums">
              ₹{totalTarget.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
        <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden flex">
          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Add area form */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
              </span>
              <div className="flex flex-col">
                <span className="text-headline-sm text-on-surface font-semibold">New Collection Area</span>
                <span className="text-label-sm text-on-surface-variant">Register neighborhood pocket</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface font-bold" htmlFor="areaName">Area / Landmark Name *</label>
              <input
                id="areaName"
                type="text"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g., Surya Hotel or Old Post Office"
                className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:bg-surface-container-highest placeholder:text-on-surface-variant/60"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface font-bold" htmlFor="areaDesc">Description / Walking Route</label>
              <textarea
                id="areaDesc"
                value={areaDesc}
                onChange={(e) => setAreaDesc(e.target.value)}
                placeholder="e.g., Start from corner shop and walk down east street"
                rows={2}
                className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface text-body-md focus:outline-none focus:bg-surface-container-highest placeholder:text-on-surface-variant/60 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface font-bold" htmlFor="defaultPlan">Default Monthly Plan (₹)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-headline-sm text-on-surface-variant">₹</span>
                <input
                  id="defaultPlan"
                  type="number"
                  value={defaultPlan}
                  onChange={(e) => setDefaultPlan(Number(e.target.value))}
                  className="w-full h-12 pl-8 pr-3 rounded-lg bg-surface-container-low text-on-surface text-headline-sm font-bold focus:outline-none focus:bg-surface-container-highest"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 h-[50px] bg-surface-container text-on-surface text-label-lg font-bold rounded-xl hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !areaName.trim()}
              onClick={handleSaveArea}
              className="flex-1 h-[50px] bg-primary text-on-primary text-label-lg font-bold rounded-xl shadow-card active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {saving ? (
                <><span className="material-symbols-outlined text-[20px] animate-spin">sync</span><span>Saving…</span></>
              ) : (
                <><span className="material-symbols-outlined text-[20px]">save</span><span>Save Area</span></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Area cards */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-1">
          <span className="text-label-md text-on-surface uppercase tracking-wide">Physical Walking Routes</span>
          <span className="text-label-sm text-on-surface-variant">Sorted by walk order</span>
        </div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-surface-container-lowest rounded-xl animate-pulse shadow-card" />
            ))
          : areas.map((area) => <AreaManageCard key={area.id} area={area} />)}
      </div>

      <div className="bg-surface-container-highest/60 rounded-xl p-space-md flex items-center gap-space-sm mb-space-lg">
        <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
          <span className="material-symbols-outlined text-[20px]">directions_walk</span>
        </div>
        <div className="flex flex-col">
          <span className="text-label-md text-on-surface font-bold">Optimized Walk Paths</span>
          <span className="text-body-sm text-on-surface-variant">Keep Surya Hotel first to collect before bazaar crowds peak at 11 AM.</span>
        </div>
      </div>
    </div>
  );
}
