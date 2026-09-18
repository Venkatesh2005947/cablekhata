// src/app/manage/areas/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAreas } from "@/hooks/useAreas";
import { showToast } from "@/components/ui/Toast";
import { validateAreaName } from "@/lib/validation";
import { setLocalCache, getLocalCache } from "@/lib/cache";
import type { Area, AreaWithStats } from "@/types";

const FEE_PRESETS = [200, 250, 300, 350];

const AREA_ICONS = [
  { icon: "location_on", label: "Location" },
  { icon: "hotel", label: "Hotel" },
  { icon: "directions_bus", label: "Bus Stand" },
  { icon: "temple_hindu", label: "Temple" },
  { icon: "train", label: "Railway" },
  { icon: "storefront", label: "Bazar" },
  { icon: "home", label: "Street" },
  { icon: "apartment", label: "Quarters" },
];

export default function AddAreaPage() {
  const router = useRouter();
  const { areas } = useAreas();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState(250);
  const [selectedIcon, setSelectedIcon] = useState("location_on");

  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (touched) {
      const res = validateAreaName(val);
      setError(res.isValid ? null : res.error ?? "Invalid area name");
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const res = validateAreaName(name);
    setError(res.isValid ? null : res.error ?? "Invalid area name");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const res = validateAreaName(name);
    if (!res.isValid) {
      setError(res.error ?? "Please enter a valid area name");
      setTouched(true);
      showToast({ message: res.error || "Please enter a valid area name", icon: "warning" });
      return;
    }

    setSaving(true);
    try {
      const cleanName = name.trim();
      const cleanDesc = description.trim();
      const nowIso = new Date().toISOString();

      // Create URL-friendly slug ID + unique suffix
      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "area";
      const uniqueSuffix = Date.now().toString(36).slice(-4);
      const areaId = `${slug}-${uniqueSuffix}`;

      const newAreaDoc: Area = {
        id: areaId,
        name: cleanName,
        description: cleanDesc || "Door-to-door collection route",
        icon: selectedIcon,
        walkOrder: (areas?.length || 0) + 1,
        defaultMonthlyFee: Number(defaultMonthlyFee) || 250,
        createdAt: nowIso,
      };

      const newAreaWithStats: AreaWithStats = {
        ...newAreaDoc,
        totalHouses: 0,
        paidCount: 0,
        pendingCount: 0,
        partialCount: 0,
        collectedAmount: 0,
        targetAmount: 0,
        progressPercent: 0,
      };

      // 1. Save to Firestore
      await setDoc(doc(db, "areas", areaId), newAreaDoc);

      // 2. Update local caches for 0ms instant display
      const cacheKey = "cablekhata_cached_areas_v2";
      const cached = getLocalCache<AreaWithStats[]>(cacheKey) || [];
      const updated = [...cached, newAreaWithStats];
      setLocalCache(cacheKey, updated);

      showToast({
        message: `Area "${cleanName}" created successfully!`,
        icon: "check_circle",
      });

      // Redirect back to home
      router.push("/areas");
    } catch (err: any) {
      console.error("Failed to add area:", err);
      showToast({
        message: err.message || "Failed to create area. Please try again.",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-gutter-mobile gap-space-md py-space-sm max-w-lg mx-auto pb-space-xl">
      {/* Top back navigation */}
      <div className="flex items-center justify-between pt-space-xs">
        <Link
          href="/areas"
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="text-label-md font-semibold">Back to Home</span>
        </Link>
        <span className="text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
          New Route Pocket
        </span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-3 p-space-md rounded-2xl bg-surface-container-lowest shadow-card">
        <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[28px]">add_location_alt</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-headline-md font-bold text-on-surface">
            Add Collection Area
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Register a new street or neighborhood for field collection
          </p>
        </div>
      </div>

      {/* Add Area Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-2xl p-space-md shadow-card flex flex-col gap-space-md"
      >
        {/* Area / Street Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="page_area_name_input" className="text-label-md font-bold text-on-surface flex items-center gap-1">
            <span>Area / Street Name</span>
            <span className="text-error font-extrabold">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-primary text-[20px]">
              location_on
            </span>
            <input
              id="page_area_name_input"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleBlur}
              placeholder="e.g. Surya Hotel, Gandhi Nagar, Market Road"
              className={`w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container text-on-surface font-semibold text-body-md focus:outline-none transition-all ${
                error && touched
                  ? "ring-2 ring-error bg-error-container/10"
                  : "focus:ring-2 focus:ring-primary/50"
              }`}
            />
          </div>
          {error && touched && (
            <div className="flex items-center gap-1 text-label-sm text-error font-medium px-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Landmark / Route Details */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="page_area_desc_input" className="text-label-md font-bold text-on-surface">
              Landmark & Route Details
            </label>
            <span className="text-label-sm text-on-surface-variant">Optional</span>
          </div>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">
              signpost
            </span>
            <input
              id="page_area_desc_input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Near Bus Stop & Murugan Temple, Srivilliputhur"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Default Monthly Fee */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="page_area_fee_input" className="text-label-md font-bold text-on-surface">
              Default Monthly Fee (₹)
            </label>
            <span className="text-label-sm text-primary font-bold">Standard Area Plan</span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-currency-display text-primary font-bold text-headline-sm">
              ₹
            </span>
            <input
              id="page_area_fee_input"
              type="number"
              min="0"
              step="10"
              value={defaultMonthlyFee}
              onChange={(e) => setDefaultMonthlyFee(Number(e.target.value))}
              className="w-full h-12 pl-9 pr-4 rounded-xl bg-surface-container text-on-surface font-bold text-headline-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Quick Fee Presets */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            <span className="text-label-sm text-on-surface-variant shrink-0">Presets:</span>
            {FEE_PRESETS.map((fee) => (
              <button
                key={fee}
                type="button"
                onClick={() => setDefaultMonthlyFee(fee)}
                className={`h-8 px-3 rounded-lg text-label-sm font-bold transition-all shrink-0 ${
                  defaultMonthlyFee === fee
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                ₹{fee}
              </button>
            ))}
          </div>
        </div>

        {/* Area Icon Marker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-label-md font-bold text-on-surface">
            Area Icon Marker
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AREA_ICONS.map((item) => {
              const isSelected = selectedIcon === item.icon;
              return (
                <button
                  key={item.icon}
                  type="button"
                  onClick={() => setSelectedIcon(item.icon)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-surface-container bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-bold truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container mt-1">
          <Link
            href="/areas"
            className="h-11 px-4 rounded-xl text-label-lg font-bold text-on-surface-variant hover:bg-surface-container flex items-center justify-center active:scale-95 transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="h-11 px-6 rounded-xl bg-primary text-on-primary text-label-lg font-bold shadow-card flex items-center gap-2 active:scale-95 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Creating Area...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                <span>Create Area</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
