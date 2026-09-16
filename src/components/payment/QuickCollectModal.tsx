// src/components/payment/QuickCollectModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Customer } from "@/types";
import CollectPaymentModal from "./CollectPaymentModal";

interface QuickCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCustomers?: Customer[];
}

export default function QuickCollectModal({
  isOpen,
  onClose,
  allCustomers: initialCustomers,
}: QuickCollectModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [fetchedCustomers, setFetchedCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (isOpen && (!initialCustomers || initialCustomers.length === 0)) {
      const fetchAll = async () => {
        try {
          const snap = await getDocs(query(collection(db, "customers"), orderBy("houseNumber", "asc")));
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
          setFetchedCustomers(list);
        } catch (err) {
          console.error("Error fetching customers for quick collect:", err);
        }
      };
      fetchAll();
    }
  }, [isOpen, initialCustomers]);

  const customerList = initialCustomers && initialCustomers.length > 0 ? initialCustomers : fetchedCustomers;

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return customerList
        .filter((c) => c.status !== "PAID")
        .slice(0, 10);
    }
    const q = search.toLowerCase();
    return customerList.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.houseNumber && c.houseNumber.toLowerCase().includes(q)) ||
        (c.stbId && c.stbId.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.areaName && c.areaName.toLowerCase().includes(q))
    );
  }, [customerList, search]);

  if (!isOpen) return null;

  if (selectedCustomer) {
    return (
      <CollectPaymentModal
        customer={selectedCustomer}
        isOpen={true}
        onClose={() => {
          setSelectedCustomer(null);
          onClose();
        }}
        onSuccess={() => {
          setSelectedCustomer(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-space-md flex flex-col gap-space-sm shadow-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              qr_code_scanner
            </span>
            <h3 className="text-headline-sm text-on-surface font-bold">
              Quick Collect
            </h3>
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

        {/* Search Bar */}
        <div className="relative flex items-center w-full shadow-xs rounded-xl bg-surface-container">
          <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[22px] pointer-events-none">
            search
          </span>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search House No, Name, STB ID, Phone..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
          />
        </div>

        {/* Result list */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[50vh] pr-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-body-md text-on-surface-variant">
              No matching customers found.
            </div>
          ) : (
            filtered.map((customer) => {
              const isPaid = customer.status === "PAID";
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className="w-full text-left p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container flex items-center justify-between gap-2 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-label-md shrink-0">
                      {customer.houseNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="text-label-lg font-bold text-on-surface truncate">
                        {customer.name}
                      </div>
                      <div className="text-body-sm text-on-surface-variant flex items-center gap-1.5 truncate">
                        <span>{customer.areaName}</span>
                        <span>•</span>
                        <span className="font-mono text-secondary">{customer.stbId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-label-lg font-extrabold text-primary">
                      ₹{customer.monthlyFee}
                    </div>
                    <span
                      className={`text-label-sm font-bold uppercase ${
                        isPaid ? "text-primary" : "text-error"
                      }`}
                    >
                      {customer.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
