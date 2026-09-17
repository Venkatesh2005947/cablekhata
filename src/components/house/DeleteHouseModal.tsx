// src/components/house/DeleteHouseModal.tsx
"use client";

import { useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/components/ui/Toast";
import { getLocalCache, setLocalCache } from "@/lib/cache";
import type { Customer } from "@/types";

interface DeleteHouseModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (customerId: string) => void;
}

export default function DeleteHouseModal({
  customer,
  isOpen,
  onClose,
  onDeleted,
}: DeleteHouseModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !customer) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // 1. Delete from area subcollection: areas/{areaId}/customers/{customerId}
      if (customer.areaId) {
        await deleteDoc(doc(db, "areas", customer.areaId, "customers", customer.id));
      }

      // 2. Delete from root collection: customers/{customerId}
      await deleteDoc(doc(db, "customers", customer.id));

      // 3. Remove from local caches
      if (customer.areaId) {
        const cacheKey = `cablekhata_cust_${customer.areaId}`;
        const cached = getLocalCache<Customer[]>(cacheKey) || [];
        const updated = cached.filter((c) => c.id !== customer.id);
        setLocalCache(cacheKey, updated);
      }

      showToast({
        message: `House #${customer.houseNumber} removed from lane`,
        icon: "delete",
      });

      if (onDeleted) {
        onDeleted(customer.id);
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to delete house:", err);
      showToast({
        message: err?.message || "Failed to delete house",
        icon: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-space-md flex flex-col gap-space-md shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center mx-auto shadow-xs">
          <span className="material-symbols-outlined text-[32px]">delete_forever</span>
        </div>

        <div className="text-center">
          <h3 className="text-headline-sm text-on-surface font-bold">
            Delete House #{customer.houseNumber}?
          </h3>
          <p className="text-body-md text-on-surface-variant mt-1.5 leading-snug">
            Are you sure you want to remove{" "}
            <strong className="text-on-surface">{customer.name}</strong> from{" "}
            <span className="text-primary font-semibold">{customer.areaName}</span> lane?
          </p>
          <div className="mt-2.5 p-2 rounded-lg bg-surface-container-low text-label-sm text-on-surface-variant">
            STB: <span className="font-mono text-secondary font-bold">{customer.stbId}</span> • ID:{" "}
            <span className="font-mono text-on-surface font-bold">{customer.connectionId}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="w-full min-h-[48px] rounded-xl bg-error text-on-error text-label-lg font-bold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {deleting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>Deleting House…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">delete</span>
                <span>Yes, Delete House</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="w-full min-h-[48px] rounded-xl bg-surface-container text-on-surface text-label-lg font-bold hover:bg-surface-container-high transition-colors"
          >
            Cancel & Keep
          </button>
        </div>
      </div>
    </div>
  );
}
