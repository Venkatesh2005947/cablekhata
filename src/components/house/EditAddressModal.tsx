// src/components/house/EditAddressModal.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/components/ui/Toast";
import { validateAddress } from "@/lib/validation";
import { setLocalCache, getLocalCache } from "@/lib/cache";
import type { Customer } from "@/types";

interface EditAddressModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (newAddress: string) => void;
}

export default function EditAddressModal({
  customer,
  isOpen,
  onClose,
  onUpdated,
}: EditAddressModalProps) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setAddress(customer.address || "");
      setError(null);
      setTouched(false);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (touched) {
      const res = validateAddress(val);
      setError(res.isValid ? null : res.error ?? "Invalid address");
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const res = validateAddress(address);
    setError(res.isValid ? null : res.error ?? "Invalid address");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const res = validateAddress(address);
    if (!res.isValid) {
      setError(res.error ?? "Invalid address");
      setTouched(true);
      showToast({ message: res.error || "Please enter a valid address", icon: "warning" });
      return;
    }

    setSaving(true);
    try {
      const cleanAddress = address.trim();
      const nowIso = new Date().toISOString();

      // 1. Update area subcollection
      if (customer.areaId) {
        await updateDoc(doc(db, "areas", customer.areaId, "customers", customer.id), {
          address: cleanAddress,
          updatedAt: nowIso,
        });
      }

      // 2. Update top-level customer document
      await updateDoc(doc(db, "customers", customer.id), {
        address: cleanAddress,
        updatedAt: nowIso,
      });

      // 3. Update local caches
      if (customer.areaId) {
        const cacheKey = `cablekhata_cust_${customer.areaId}`;
        const cached = getLocalCache<Customer[]>(cacheKey) || [];
        const updated = cached.map((c) =>
          c.id === customer.id ? { ...c, address: cleanAddress } : c
        );
        setLocalCache(cacheKey, updated);
      }

      showToast({
        message: `Address updated for House #${customer.houseNumber}`,
        icon: "check_circle",
      });

      if (onUpdated) {
        onUpdated(cleanAddress);
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to update address:", err);
      showToast({
        message: err?.message || "Failed to update address",
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-space-md flex flex-col gap-space-md shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex flex-col items-center gap-1.5 -mt-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg shrink-0">
              {customer.houseNumber}
            </span>
            <div className="min-w-0">
              <h2 className="text-headline-sm text-on-surface font-bold truncate">
                Edit Doorstep Address
              </h2>
              <p className="text-body-sm text-on-surface-variant truncate">
                {customer.name} • {customer.areaName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit_address_input" className="text-label-md text-on-surface font-bold flex items-center justify-between">
              <span>Complete Doorstep Address</span>
              <span className="text-label-sm text-primary font-bold">House #{customer.houseNumber}</span>
            </label>
            <textarea
              id="edit_address_input"
              rows={3}
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={handleBlur}
              placeholder="e.g. 14, Gandhi Street, Near Surya Hotel, Srivilliputhur"
              className={`w-full p-3.5 rounded-xl bg-surface-container text-on-surface text-body-md leading-relaxed resize-none focus:outline-none transition-all ${
                error && touched
                  ? "ring-2 ring-error bg-error-container/10"
                  : "focus:ring-2 focus:ring-primary/50"
              }`}
            />
            {error && touched && (
              <div className="flex items-center gap-1 text-label-sm text-error font-semibold px-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface text-label-lg font-bold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-primary text-on-primary text-label-lg font-bold shadow-card active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  <span>Update Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
