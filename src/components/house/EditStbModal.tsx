// src/components/house/EditStbModal.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/components/ui/Toast";
import { validateStbNumber } from "@/lib/validation";
import { setLocalCache, getLocalCache } from "@/lib/cache";
import type { Customer } from "@/types";

interface EditStbModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (newStbId: string) => void;
}

export default function EditStbModal({
  customer,
  isOpen,
  onClose,
  onUpdated,
}: EditStbModalProps) {
  const [stbId, setStbId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setStbId(customer.stbId || "");
      setError(null);
      setTouched(false);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleStbChange = (val: string) => {
    setStbId(val);
    if (touched) {
      const res = validateStbNumber(val);
      setError(res.isValid ? null : res.error ?? "Invalid STB number");
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const res = validateStbNumber(stbId);
    setError(res.isValid ? null : res.error ?? "Invalid STB number");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const res = validateStbNumber(stbId);
    if (!res.isValid) {
      setError(res.error ?? "Invalid STB number");
      setTouched(true);
      showToast({ message: res.error || "Please enter a valid STB number", icon: "warning" });
      return;
    }

    setSaving(true);
    try {
      const cleanStb = stbId.trim();
      const nowIso = new Date().toISOString();

      // 1. Update area subcollection
      if (customer.areaId) {
        await updateDoc(doc(db, "areas", customer.areaId, "customers", customer.id), {
          stbId: cleanStb,
          updatedAt: nowIso,
        });
      }

      // 2. Update top-level customer document
      await updateDoc(doc(db, "customers", customer.id), {
        stbId: cleanStb,
        updatedAt: nowIso,
      });

      // 3. Update local caches
      if (customer.areaId) {
        const cacheKey = `cablekhata_cust_${customer.areaId}`;
        const cached = getLocalCache<Customer[]>(cacheKey) || [];
        const updated = cached.map((c) =>
          c.id === customer.id ? { ...c, stbId: cleanStb } : c
        );
        setLocalCache(cacheKey, updated);
      }

      // 4. Also update all-customers cache if present
      const allCusts = getLocalCache<Customer[]>("cablekhata_customers_subcoll_v3");
      if (allCusts && allCusts.length > 0) {
        const updatedAll = allCusts.map((c) =>
          c.id === customer.id ? { ...c, stbId: cleanStb } : c
        );
        setLocalCache("cablekhata_customers_subcoll_v3", updatedAll);
      }

      showToast({
        message: `STB No updated to "${cleanStb}" for House #${customer.houseNumber}`,
        icon: "check_circle",
      });

      if (onUpdated) {
        onUpdated(cleanStb);
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to update STB number:", err);
      showToast({
        message: err.message || "Failed to update STB number. Please try again.",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-stb-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-float flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-space-md border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">tv</span>
            </div>
            <div className="flex flex-col">
              <h2 id="edit-stb-title" className="text-headline-sm font-bold text-on-surface">
                Edit Set Top Box (STB)
              </h2>
              <p className="text-label-sm text-on-surface-variant font-medium">
                House #{customer.houseNumber} • {customer.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-space-md flex flex-col gap-space-md">
          {/* Current Info Banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-surface-container/80">
            <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
              developer_board
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
                Current STB Number
              </span>
              <span className="font-mono font-bold text-on-surface text-body-md truncate">
                {customer.stbId || "No STB Assigned"}
              </span>
            </div>
          </div>

          {/* New STB Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="stb_input"
              className="text-label-md font-bold text-on-surface flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <span>New Set Top Box (STB) No</span>
                <span className="text-error font-extrabold">*</span>
              </span>
              <span className="text-label-sm text-on-surface-variant">Alphanumeric</span>
            </label>

            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-secondary text-[20px]">
                tag
              </span>
              <input
                id="stb_input"
                type="text"
                autoFocus
                value={stbId}
                onChange={(e) => handleStbChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="e.g. STB-8831 or 8831"
                className={`w-full h-12 pl-11 pr-4 rounded-xl bg-surface-container text-on-surface font-mono font-bold text-body-md focus:outline-none transition-all ${
                  error && touched
                    ? "ring-2 ring-error bg-error-container/10"
                    : "focus:ring-2 focus:ring-secondary/50"
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 px-4 rounded-xl text-label-lg font-bold text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-primary text-on-primary text-label-lg font-bold shadow-card flex items-center gap-2 active:scale-95 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Update STB</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
