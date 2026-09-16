// src/app/customers/[customerId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/components/ui/Toast";
import type { Customer } from "@/types";

const FEE_PRESETS = [200, 250, 300, 350];

export default function EditCustomerPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState("");
  const [fee, setFee] = useState(250);
  const [stbId, setStbId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [collectorNote, setCollectorNote] = useState("");

  useEffect(() => {
    if (!customerId) return;
    getDoc(doc(db, "customers", customerId)).then((snap) => {
      if (snap.exists()) {
        const c = { id: snap.id, ...snap.data() } as Customer;
        setCustomer(c);
        setName(c.name);
        setPhone(c.phone);
        setAddress(c.address);
        setAreaId(c.areaId);
        setFee(c.monthlyFee);
        setStbId(c.stbId);
        setConnectionId(c.connectionId);
        setCollectorNote(c.collectorNote ?? "");
      }
    });
  }, [customerId]);

  const handleSave = async () => {
    if (!customerId || !name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "customers", customerId), {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        monthlyFee: fee,
        stbId: stbId.trim(),
        connectionId: connectionId.trim(),
        collectorNote: collectorNote.trim(),
      });
      showToast({ message: `Saved changes for ${name}`, icon: "task_alt" });
      setTimeout(() => router.push(`/customers/${customerId}`), 800);
    } catch {
      showToast({ message: "Failed to save changes", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!customer) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="material-symbols-outlined text-[40px] text-primary animate-spin">sync</span>
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
      <div className="px-margin-mobile pt-space-sm pb-space-lg flex flex-col gap-space-md max-w-lg mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/customers/${customerId}`}
            className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors py-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-label-lg">Back to Customer</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-label-sm text-on-surface-variant uppercase tracking-wider">
            Khata Entry
          </span>
        </div>

        {/* Title */}
        <div className="flex flex-col">
          <h1 className="text-headline-lg-mobile text-on-surface font-bold">Edit Customer Details</h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Update field ledger and street navigation notes for instant doorstep sync.
          </p>
        </div>

        {/* Customer summary card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-headline-sm font-bold">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-headline-sm text-on-surface truncate font-semibold">{customer.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm">Active</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant">
                <span className="text-label-sm bg-surface-container px-1.5 py-0.5 rounded text-on-surface tracking-wider">
                  {customer.connectionId}
                </span>
                <span className="text-label-sm text-outline">•</span>
                <span className="text-body-sm truncate">{customer.stbId}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low text-primary">
            <span className="material-symbols-outlined text-[22px]">tv</span>
          </div>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-space-md" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customer_name" className="text-label-lg text-on-surface flex items-center justify-between">
              <span>Customer Full Name <span className="text-error">*</span></span>
              <span className="text-label-sm text-on-surface-variant uppercase">As per Aadhaar/Bill</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">person</span>
              <input
                id="customer_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-on-surface text-body-lg rounded-xl shadow-card focus:outline-none focus:bg-surface-container-low transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-label-lg text-on-surface">Phone Number</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">call</span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-on-surface text-body-lg rounded-xl shadow-card focus:outline-none focus:bg-surface-container-low transition-all"
              />
            </div>
          </div>

          {/* Full Address */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-card flex flex-col gap-2">
            <div className="flex flex-col">
              <label htmlFor="unified_address" className="text-label-lg text-on-surface flex items-center gap-1.5">
                Full Customer Address{" "}
                <span className="text-label-sm text-on-surface-variant font-normal uppercase">Flexible</span>
              </label>
              <span className="text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                Enter complete door-to-door address with house no, street, landmark & town in one place.
              </span>
            </div>
            <div className="relative mt-1">
              <textarea
                id="unified_address"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 14, Gandhi Street, Near Surya Hotel, Srivilliputhur"
                className="w-full p-3.5 bg-surface-container-low text-on-surface text-body-lg rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:bg-surface-container transition-all resize-none leading-relaxed"
              />
            </div>
            <div className="flex items-start gap-2 bg-primary-fixed/30 text-on-primary-fixed p-2.5 rounded-lg mt-1">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">verified</span>
              <span className="text-label-sm leading-tight text-on-primary-fixed">
                Single free-text field — no separate house no, street, or landmark inputs required
              </span>
            </div>
          </div>

          {/* Monthly Fee */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-card flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="cable_fee" className="text-label-lg text-on-surface">Monthly Cable Fee</label>
              <span className="text-label-sm text-on-surface-variant uppercase">Fixed Recurring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3.5 text-currency-display text-primary leading-none">₹</span>
                <input
                  id="cable_fee"
                  type="number"
                  required
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full h-12 pl-10 pr-3 bg-surface-container-low text-on-surface text-headline-md font-bold rounded-xl focus:outline-none focus:bg-surface-container transition-all"
                />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-label-sm text-on-surface-variant">Due Day</span>
                <span className="text-label-lg text-on-surface font-bold">1st of Month</span>
              </div>
            </div>
            {/* Presets */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-label-sm text-on-surface-variant shrink-0">Presets:</span>
              {FEE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFee(preset)}
                  className={`px-3 py-1.5 rounded-full text-label-md active:scale-95 transition-all shrink-0 ${
                    fee === preset
                      ? "bg-primary text-on-primary shadow-card font-bold"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* STB / Connection ID */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="stb_number" className="text-label-lg text-on-surface">Connection / Set Top Box Number</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">developer_board</span>
              <input
                id="stb_number"
                type="text"
                required
                value={`${connectionId} / ${stbId}`}
                onChange={(e) => {
                  const [cid, sid] = e.target.value.split(" / ");
                  setConnectionId(cid ?? "");
                  setStbId(sid ?? "");
                }}
                className="w-full h-12 pl-11 pr-11 bg-surface-container-lowest text-on-surface text-body-lg rounded-xl shadow-card focus:outline-none focus:bg-surface-container-low uppercase tracking-wider transition-all"
              />
              <button
                type="button"
                title="Scan Barcode on Box"
                className="absolute right-2 p-1.5 rounded-lg text-on-surface-variant hover:text-primary active:scale-90 transition-transform"
                onClick={() => showToast({ message: "QR scanner coming soon", icon: "qr_code_scanner" })}
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              </button>
            </div>
          </div>

          {/* Collector Note */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="collector_note" className="text-label-lg text-on-surface">Collector Field Note (Optional)</label>
              <span className="text-label-sm text-secondary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">lock_clock</span> Morning Tip
              </span>
            </div>
            <textarea
              id="collector_note"
              rows={2}
              value={collectorNote}
              onChange={(e) => setCollectorNote(e.target.value)}
              className="w-full p-3.5 bg-surface-container-lowest text-on-surface text-body-md rounded-xl shadow-card focus:outline-none focus:bg-surface-container-low transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 pt-space-sm pb-space-md">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-primary text-on-primary text-label-lg font-bold rounded-xl shadow-card active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? (
                <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Updating…</>
              ) : (
                <><span className="material-symbols-outlined text-[20px]">save</span> Save Customer Details</>
              )}
            </button>
            <Link
              href={`/customers/${customerId}`}
              className="w-full py-2 text-on-surface-variant text-label-lg rounded-xl text-center hover:text-on-surface transition-colors"
            >
              Cancel & Discard Changes
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
