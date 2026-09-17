// src/components/house/AddHouseModal.tsx
"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/components/ui/Toast";
import {
  validateAddress,
  validateHouseName,
  validateHouseNumber,
  validatePhone,
} from "@/lib/validation";
import { setLocalCache, getLocalCache } from "@/lib/cache";
import type { Customer } from "@/types";

interface AddHouseModalProps {
  areaId: string;
  areaName: string;
  defaultFee?: number;
  nextWalkOrder?: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (customer: Customer) => void;
}

const FEE_PRESETS = [200, 250, 300, 350];

export default function AddHouseModal({
  areaId,
  areaName,
  defaultFee = 250,
  nextWalkOrder = 1,
  isOpen,
  onClose,
  onCreated,
}: AddHouseModalProps) {
  // Form state
  const [name, setName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [address, setAddress] = useState("");
  const [collectorNote, setCollectorNote] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyFee, setMonthlyFee] = useState<number>(defaultFee);

  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    houseNumber?: string;
    address?: string;
    phone?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean;
    houseNumber?: boolean;
    address?: boolean;
    phone?: boolean;
  }>({});

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleBlur = (field: "name" | "houseNumber" | "address" | "phone") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: "name" | "houseNumber" | "address" | "phone") => {
    const nextErrors = { ...errors };

    if (field === "name") {
      const res = validateHouseName(name);
      if (!res.isValid) nextErrors.name = res.error;
      else delete nextErrors.name;
    }

    if (field === "houseNumber") {
      const res = validateHouseNumber(houseNumber);
      if (!res.isValid) nextErrors.houseNumber = res.error;
      else delete nextErrors.houseNumber;
    }

    if (field === "address") {
      const res = validateAddress(address);
      if (!res.isValid) nextErrors.address = res.error;
      else delete nextErrors.address;
    }

    if (field === "phone") {
      const res = validatePhone(phone);
      if (!res.isValid) nextErrors.phone = res.error;
      else delete nextErrors.phone;
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const validateAll = () => {
    const nameRes = validateHouseName(name);
    const houseNoRes = validateHouseNumber(houseNumber);
    const addressRes = validateAddress(address);
    const phoneRes = validatePhone(phone);

    const newErrors: typeof errors = {};
    if (!nameRes.isValid) newErrors.name = nameRes.error;
    if (!houseNoRes.isValid) newErrors.houseNumber = houseNoRes.error;
    if (!addressRes.isValid) newErrors.address = addressRes.error;
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error;

    setErrors(newErrors);
    setTouched({ name: true, houseNumber: true, address: true, phone: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!validateAll()) {
      showToast({ message: "Please fix form errors before saving", icon: "warning" });
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const cleanDoorNo = houseNumber.trim();
      const cleanName = name.trim();
      const cleanAddress = address.trim();
      const cleanNote = collectorNote.trim();
      const cleanPhone = phone.trim();

      // Generate consistent IDs
      const uniqueSuffix = Date.now().toString(36).slice(-4) + Math.floor(Math.random() * 900 + 100);
      const customerId = `cbl_${cleanDoorNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "h"}_${uniqueSuffix}`;
      const connectionId = `CBL${cleanDoorNo.replace(/\D/g, "").padStart(3, "0").slice(-3) || Math.floor(100 + Math.random() * 899)}`;
      const stbId = `STB-${Math.floor(1000 + Math.random() * 9000)}`;

      const newCustomer: Customer = {
        id: customerId,
        name: cleanName,
        phone: cleanPhone || "Not Provided",
        address: cleanAddress,
        areaId,
        areaName,
        houseNumber: cleanDoorNo,
        walkOrder: nextWalkOrder,
        stbId,
        connectionId,
        monthlyFee: Number(monthlyFee) || defaultFee,
        status: "PENDING",
        collectorNote: cleanNote || undefined,
        isActive: true,
        createdAt: nowIso,
      };

      // 1. Save to area customer subcollection: areas/{areaId}/customers/{customerId}
      await setDoc(doc(db, "areas", areaId, "customers", customerId), newCustomer);

      // 2. Save to top-level collection: customers/{customerId}
      await setDoc(doc(db, "customers", customerId), newCustomer);

      // 3. Update local caches for immediate 0ms sync
      const cacheKey = `cablekhata_cust_${areaId}`;
      const existingList = getLocalCache<Customer[]>(cacheKey) || [];
      const updatedList = [...existingList, newCustomer].sort((a, b) => a.walkOrder - b.walkOrder);
      setLocalCache(cacheKey, updatedList);

      showToast({
        message: `House #${cleanDoorNo} (${cleanName}) registered!`,
        icon: "home",
      });

      if (onCreated) {
        onCreated(newCustomer);
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to add house:", err);
      showToast({
        message: err?.message || "Failed to register house. Please try again.",
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
        className="w-full sm:max-w-lg bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-space-md flex flex-col gap-space-md shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex flex-col items-center gap-1.5 -mt-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">add_home</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-headline-sm text-on-surface font-bold truncate">
                Add House to Lane
              </h2>
              <p className="text-body-sm text-on-surface-variant truncate">
                📍 {areaName} • Stop #{nextWalkOrder}
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
          {/* Row 1: Door/House No + Customer/House Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            {/* Door / House Number */}
            <div className="col-span-1 flex flex-col gap-1">
              <label htmlFor="house_number" className="text-label-md text-on-surface font-bold flex items-center gap-1">
                <span>Door / House No</span>
                <span className="text-error font-extrabold">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  tag
                </span>
                <input
                  id="house_number"
                  type="text"
                  value={houseNumber}
                  onChange={(e) => {
                    setHouseNumber(e.target.value);
                    if (touched.houseNumber) validateField("houseNumber");
                  }}
                  onBlur={() => handleBlur("houseNumber")}
                  placeholder="e.g. 14 / 2B"
                  className={`w-full h-12 pl-9 pr-3 rounded-xl bg-surface-container text-on-surface text-body-md font-bold focus:outline-none transition-all ${
                    errors.houseNumber && touched.houseNumber
                      ? "ring-2 ring-error bg-error-container/10"
                      : "focus:ring-2 focus:ring-primary/50"
                  }`}
                />
              </div>
              {errors.houseNumber && touched.houseNumber && (
                <span className="text-label-sm text-error font-medium px-1">
                  {errors.houseNumber}
                </span>
              )}
            </div>

            {/* House / Customer Name */}
            <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
              <label htmlFor="customer_name" className="text-label-md text-on-surface font-bold flex items-center gap-1">
                <span>House / Customer Name</span>
                <span className="text-error font-extrabold">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  person
                </span>
                <input
                  id="customer_name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) validateField("name");
                  }}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g. Ramesh Kumar / Sharma Niwas"
                  className={`w-full h-12 pl-9 pr-3 rounded-xl bg-surface-container text-on-surface text-body-md font-medium focus:outline-none transition-all ${
                    errors.name && touched.name
                      ? "ring-2 ring-error bg-error-container/10"
                      : "focus:ring-2 focus:ring-primary/50"
                  }`}
                />
              </div>
              {errors.name && touched.name && (
                <span className="text-label-sm text-error font-medium px-1">
                  {errors.name}
                </span>
              )}
            </div>
          </div>

          {/* Full Address */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="doorstep_address" className="text-label-md text-on-surface font-bold flex items-center gap-1">
                <span>Doorstep Address</span>
                <span className="text-error font-extrabold">*</span>
              </label>
              <span className="text-label-sm text-on-surface-variant font-medium">
                Street, Landmark & Town
              </span>
            </div>
            <div className="relative flex flex-col">
              <textarea
                id="doorstep_address"
                rows={2}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (touched.address) validateField("address");
                }}
                onBlur={() => handleBlur("address")}
                placeholder="e.g. 14, Gandhi Street, Opposite Surya Hotel, Srivilliputhur"
                className={`w-full p-3 rounded-xl bg-surface-container text-on-surface text-body-md leading-relaxed resize-none focus:outline-none transition-all ${
                  errors.address && touched.address
                    ? "ring-2 ring-error bg-error-container/10"
                    : "focus:ring-2 focus:ring-primary/50"
                }`}
              />
            </div>
            {errors.address && touched.address && (
              <div className="flex items-center gap-1 text-label-sm text-error font-semibold px-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{errors.address}</span>
              </div>
            )}
          </div>

          {/* Phone Number (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label htmlFor="customer_phone" className="text-label-md text-on-surface font-bold flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-label-sm text-on-surface-variant font-normal">Optional</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  call
                </span>
                <input
                  id="customer_phone"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(cleaned);
                    if (touched.phone) validateField("phone");
                  }}
                  onBlur={() => handleBlur("phone")}
                  placeholder="e.g. 9876543210"
                  className={`w-full h-12 pl-9 pr-3 rounded-xl bg-surface-container text-on-surface text-body-md focus:outline-none transition-all ${
                    errors.phone && touched.phone
                      ? "ring-2 ring-error bg-error-container/10"
                      : "focus:ring-2 focus:ring-primary/50"
                  }`}
                />
              </div>
              {errors.phone && touched.phone && (
                <span className="text-label-sm text-error font-medium px-1">
                  {errors.phone}
                </span>
              )}
            </div>

            {/* Monthly Cable Fee */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="monthly_fee" className="text-label-md text-on-surface font-bold">
                  Monthly Fee (₹)
                </label>
                <span className="text-label-sm text-primary font-bold">Default: ₹{defaultFee}</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-currency-display text-primary font-bold text-headline-sm">
                  ₹
                </span>
                <input
                  id="monthly_fee"
                  type="number"
                  min="0"
                  step="10"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  className="w-full h-12 pl-8 pr-3 rounded-xl bg-surface-container text-on-surface text-headline-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Quick Fee Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-label-sm text-on-surface-variant shrink-0">Fee Presets:</span>
            {FEE_PRESETS.map((fee) => (
              <button
                key={fee}
                type="button"
                onClick={() => setMonthlyFee(fee)}
                className={`h-8 px-2.5 rounded-lg text-label-sm font-bold transition-all shrink-0 ${
                  monthlyFee === fee
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                ₹{fee}
              </button>
            ))}
          </div>

          {/* Optional Notes */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="optional_notes" className="text-label-md text-on-surface font-bold">
                Optional Notes
              </label>
              <span className="text-label-sm text-secondary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">sticky_note_2</span>
                <span>Collector Tip</span>
              </span>
            </div>
            <textarea
              id="optional_notes"
              rows={2}
              value={collectorNote}
              onChange={(e) => setCollectorNote(e.target.value)}
              placeholder="e.g. Ring bell twice, visit after 10 AM, dog inside gate"
              className="w-full p-3 rounded-xl bg-surface-container text-on-surface text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
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
                  <span>Saving House…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  <span>Save House</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
