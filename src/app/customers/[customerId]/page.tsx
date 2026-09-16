// src/app/customers/[customerId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";
import StatusBadge from "@/components/ui/StatusBadge";
import { showToast } from "@/components/ui/Toast";
import CollectPaymentModal from "@/components/payment/CollectPaymentModal";
import type { Customer, Payment } from "@/types";

// ─── Payment passbook row ─────────────────────────────────────────
function PassbookRow({ payment }: { payment: Payment }) {
  const monthLabel = new Date(payment.billingMonth + "-01").toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );
  const paidDate = payment.paidDate
    ? new Date(payment.paidDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            payment.status === "PAID"
              ? "bg-primary/10 text-primary"
              : "bg-error-container text-error"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {payment.status === "PAID" ? "verified" : "pending_actions"}
          </span>
        </div>
        <div>
          <p className="text-label-md text-on-surface font-bold">{monthLabel}</p>
          <p className="text-body-sm text-on-surface-variant">
            {paidDate ? `Paid on ${paidDate} • ${payment.method}` : "Not yet paid"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-headline-sm text-primary font-bold">
          ₹{payment.amount.toLocaleString("en-IN")}
        </span>
        <span
          className={`block text-label-sm uppercase font-bold ${
            payment.status === "PAID" ? "text-primary" : "text-error"
          }`}
        >
          {payment.status === "PAID" ? "Cleared" : payment.status}
        </span>
      </div>
    </div>
  );
}

// ─── Move Area bottom sheet ───────────────────────────────────────
function MoveAreaSheet({
  open,
  customer,
  onClose,
}: {
  open: boolean;
  customer: Customer;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState("");

  const handleConfirm = async () => {
    if (!selected) { alert("Please select a destination area."); return; }
    try {
      await updateDoc(doc(db, "customers", customer.id), {
        areaId: selected,
        areaName: selected,
      });
      showToast({ message: `${customer.name} moved to ${selected}!`, icon: "swap_horiz" });
      onClose();
    } catch {
      showToast({ message: "Failed to move customer", icon: "error" });
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex flex-col justify-end p-0">
      <div className="bg-surface-container-lowest rounded-t-2xl max-h-[85vh] overflow-y-auto p-space-md flex flex-col gap-space-md shadow-modal">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[24px]">swap_horiz</span>
            <h3 className="text-headline-sm text-on-surface font-semibold">
              Move {customer.name}
            </h3>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Available Areas</p>
        {/* Area options will be populated from Firestore in Phase 4 */}
        <p className="text-body-sm text-on-surface-variant">Loading areas…</p>
        <div className="flex gap-space-sm pt-2">
          <button onClick={onClose} className="flex-1 min-h-[48px] rounded-xl bg-surface-container text-on-surface text-label-md">Cancel</button>
          <button onClick={handleConfirm} className="flex-1 min-h-[48px] rounded-xl bg-tertiary text-on-tertiary text-label-md font-bold shadow-card">Confirm Transfer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Warning modal ─────────────────────────────────────────
function DeleteModal({
  open,
  customer,
  onClose,
}: {
  open: boolean;
  customer: Customer;
  onClose: () => void;
}) {
  const handleDelete = async () => {
    try {
      await updateDoc(doc(db, "customers", customer.id), { isActive: false });
      showToast({ message: `${customer.connectionId} removed from registry`, icon: "delete" });
      onClose();
      // Navigate back after brief delay
      setTimeout(() => window.history.back(), 1200);
    } catch {
      showToast({ message: "Failed to delete customer", icon: "error" });
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex flex-col justify-center items-center p-space-md">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm p-space-md flex flex-col gap-space-md shadow-modal">
        <div className="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[32px]">warning</span>
        </div>
        <div className="text-center">
          <h3 className="text-headline-sm text-on-surface font-semibold">Delete {customer.name}?</h3>
          <p className="text-body-md text-on-surface-variant mt-1">
            This will archive Connection{" "}
            <span className="font-mono font-bold text-on-surface">#{customer.connectionId}</span>{" "}
            and remove all unbilled khata ledgers. This action cannot be undone.
          </p>
        </div>
        <div className="flex flex-col gap-space-xs">
          <button onClick={handleDelete} className="w-full min-h-[48px] rounded-xl bg-error text-on-error text-label-lg font-bold">
            Yes, Delete Subscriber
          </button>
          <button onClick={onClose} className="w-full min-h-[48px] rounded-xl bg-surface-container text-on-surface text-label-lg">
            Cancel & Keep
          </button>
        </div>
      </div>
    </div>
  );
}

import { getLocalCache, setLocalCache } from "@/lib/cache";

// Global in-memory cache for 0ms instant customer profile opening
const memoryCustomerMap: Record<string, Customer> = {};

// ─── Main Page ─────────────────────────────────────────────────────
export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const cacheKey = `cablekhata_customer_${customerId}`;

  const [customer, setCustomer] = useState<Customer | null>(() => {
    if (!customerId) return null;
    if (memoryCustomerMap[customerId]) return memoryCustomerMap[customerId];
    const cached = getLocalCache<Customer>(cacheKey);
    if (cached) {
      memoryCustomerMap[customerId] = cached;
      return cached;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (!customerId) return false;
    return !memoryCustomerMap[customerId] && !getLocalCache<Customer>(cacheKey);
  });
  const [showMove, setShowMove] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const { payments } = usePaymentHistory(customerId);

  useEffect(() => {
    if (!customerId) return;
    const unsub = onSnapshot(doc(db, "customers", customerId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Customer;
        memoryCustomerMap[customerId] = data;
        setLocalCache(cacheKey, data);
        setCustomer(data);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [customerId, cacheKey]);

  const handleStartEditAddress = () => {
    if (!customer) return;
    setAddressInput(customer.address || "");
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async () => {
    if (!customer || !addressInput.trim()) return;
    setSavingAddress(true);
    try {
      const nowIso = new Date().toISOString();
      // Update top-level customer document
      await updateDoc(doc(db, "customers", customer.id), {
        address: addressInput.trim(),
        updatedAt: nowIso,
      });

      // Update area customer subcollection if areaId exists
      if (customer.areaId) {
        await updateDoc(doc(db, "areas", customer.areaId, "customers", customer.id), {
          address: addressInput.trim(),
          updatedAt: nowIso,
        });
      }

      showToast({ message: "Doorstep address updated!", icon: "check_circle" });
      setIsEditingAddress(false);
    } catch (err: any) {
      console.error("Failed to update address:", err);
      showToast({ message: err?.message || "Failed to update address", icon: "error" });
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[40px] text-primary animate-spin">sync</span>
          <span className="text-body-md text-on-surface-variant">Loading customer…</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 flex items-center justify-center p-space-lg text-center">
        <div>
          <span className="material-symbols-outlined text-[48px] text-error">person_off</span>
          <p className="text-headline-sm text-on-surface mt-2">Customer not found</p>
          <Link href="/areas" className="text-primary text-label-lg mt-4 inline-block">← Back to Areas</Link>
        </div>
      </div>
    );
  }

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col w-full">
      {/* Breadcrumb */}
      <div className="px-gutter-mobile pt-space-sm pb-space-xs flex flex-col gap-space-xs">
        <div className="flex items-center justify-between gap-space-sm">
          <Link
            href={`/areas/${customer.areaId}`}
            className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">arrow_back</span>
            <span className="text-label-md">Back to {customer.areaName}</span>
          </Link>
          <StatusBadge status={customer.status} size="md" />
        </div>
        <div className="flex items-center gap-1.5 text-on-surface-variant px-1">
          <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
          <span className="text-label-sm tracking-wide">{customer.areaName}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-label-sm text-on-surface font-semibold">
            House No: {customer.houseNumber}
          </span>
        </div>
      </div>

      <div className="px-gutter-mobile py-space-sm flex flex-col gap-space-md">
        {/* Customer ID card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-md relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-14 h-14 rounded-xl bg-primary text-on-primary flex items-center justify-center text-headline-md font-bold shadow-card shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-headline-md text-on-surface font-bold truncate">{customer.name}</h2>
                <p className="text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="font-bold text-primary">ID:</span>
                  <span className="font-mono tracking-wider bg-surface-container px-1.5 py-0.5 rounded text-on-surface">
                    {customer.connectionId}
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-outline-variant mx-0.5" />
                  <span className="text-secondary font-semibold">{customer.stbId}</span>
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant block">Monthly Bill</span>
              <span className="text-headline-lg-mobile text-primary font-extrabold block">
                ₹{customer.monthlyFee}
              </span>
            </div>
          </div>

          {/* Address */}
          <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col gap-2 border border-surface-container">
            <div className="flex items-center justify-between pb-1.5 border-b border-surface-container">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">hub</span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Collection Area</span>
              </div>
              <span className="text-label-md font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                📍 {customer.areaName}
              </span>
            </div>
            {/* Doorstep Address (Click to Edit) */}
            {isEditingAddress ? (
              <div className="flex flex-col gap-2 pt-1 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm uppercase tracking-wider text-primary font-bold">
                    Edit Doorstep Address
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Tap save when done
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Enter full doorstep address..."
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest text-body-md text-on-surface border-2 border-primary/50 focus:outline-none focus:border-primary leading-snug resize-none shadow-xs"
                />
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    disabled={savingAddress}
                    onClick={() => setIsEditingAddress(false)}
                    className="h-8 px-3 rounded-lg bg-surface-container text-on-surface text-label-sm font-bold hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingAddress || !addressInput.trim()}
                    onClick={handleSaveAddress}
                    className="h-8 px-3.5 rounded-lg bg-primary text-on-primary text-label-sm font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {savingAddress ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">
                          progress_activity
                        </span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Save Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={handleStartEditAddress}
                role="button"
                tabIndex={0}
                className="group flex items-start gap-2 pt-0.5 cursor-pointer hover:bg-surface-container-high/60 p-2 -m-2 rounded-xl transition-all"
                title="Click to edit address"
              >
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  home_pin
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold block">
                      Complete Doorstep Address
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary text-[11px] font-bold bg-primary/10 px-2 py-0.5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      <span>Tap to Edit</span>
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface font-semibold leading-snug mt-1">
                    {customer.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collector note */}
        {customer.collectorNote && (
          <div className="bg-secondary-container/15 rounded-xl p-space-sm flex items-start gap-space-sm">
            <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-on-secondary-fixed-variant shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-label-sm text-on-secondary-fixed-variant uppercase tracking-wider font-bold">Collector Field Note</span>
              <p className="text-body-sm text-on-surface mt-0.5 leading-snug">{customer.collectorNote}</p>
            </div>
          </div>
        )}

        {/* Primary action: Record Payment */}
        <div className="flex flex-col gap-space-xs">
          <button
            className="w-full min-h-[52px] px-space-md py-3 rounded-xl bg-primary text-on-primary text-label-lg font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-card"
            onClick={() => setShowCollect(true)}
          >
            <span className="material-symbols-outlined text-[22px]">payments</span>
            <span>Record Payment / Collect Due</span>
          </button>
        </div>

        {/* Admin section */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">hub</span>
              <h3 className="text-headline-sm text-on-surface font-semibold">Location & Customer Settings</h3>
            </div>
            <span className="text-label-sm bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant font-bold">Admin</span>
          </div>
          <p className="text-body-sm text-on-surface-variant">Manage customer placement across your distribution routes or adjust subscription terms.</p>

          {/* Move area */}
          <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[20px] text-tertiary">swap_horiz</span>
                <div>
                  <span className="text-label-md text-on-surface font-bold block">Current Route Allocation</span>
                  <span className="text-body-sm text-on-surface-variant truncate block">{customer.areaName} Hub</span>
                </div>
              </div>
              <span className="text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shrink-0">Active</span>
            </div>
            <button
              onClick={() => setShowMove(true)}
              className="w-full min-h-[48px] py-2 px-space-md rounded-lg bg-surface-container-highest text-on-surface text-label-md font-bold transition-all flex items-center justify-between active:scale-[0.98]"
            >
              <span className="flex items-center gap-2 text-tertiary font-bold">
                <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                Move to Another Area
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward_ios</span>
            </button>
          </div>

          {/* Edit / Delete buttons */}
          <div className="flex flex-col gap-space-xs pt-1">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="w-full min-h-[48px] py-2.5 px-space-md rounded-lg bg-surface-container text-on-surface text-label-md transition-all flex items-center justify-between hover:bg-surface-container-high active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                Edit Customer Details & Billing
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
            </Link>
            <button
              onClick={() => setShowDelete(true)}
              className="w-full min-h-[48px] py-2.5 px-space-md rounded-lg bg-error-container/40 text-error text-label-md transition-all flex items-center justify-between hover:bg-error-container active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-error">delete_outline</span>
                Delete Customer Profile
              </span>
              <span className="text-label-sm uppercase font-extrabold tracking-wider text-error">Permanent</span>
            </button>
          </div>
        </div>

        {/* Payment Passbook */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-headline-sm text-on-surface flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-primary text-[22px]">menu_book</span>
                Payment Passbook
              </h3>
              <p className="text-body-sm text-on-surface-variant">Audit trail & manual ledger adjustments</p>
            </div>
            <div className="text-right">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant block">
                {payments.length} Months
              </span>
              <span className="text-label-md font-bold text-primary">
                {payments.length > 0 &&
                payments.filter((p) => p.status === "PAID").length === payments.length
                  ? "100% Cleared"
                  : `${payments.filter((p) => p.status === "PAID").length}/${payments.length} Paid`}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            {payments.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-4">
                No payment records yet.
              </p>
            ) : (
              payments.map((p) => <PassbookRow key={p.id} payment={p} />)
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <MoveAreaSheet open={showMove} customer={customer} onClose={() => setShowMove(false)} />
      <DeleteModal open={showDelete} customer={customer} onClose={() => setShowDelete(false)} />
      <CollectPaymentModal
        customer={customer}
        isOpen={showCollect}
        onClose={() => setShowCollect(false)}
      />
    </div>
  );
}
