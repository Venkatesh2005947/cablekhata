// src/components/house/EditHouseModal.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { showToast } from "@/components/ui/Toast";
import {
  validateAddress,
  validateHouseName,
  validateHouseNumber,
  validatePhone,
  validateStbNumber,
} from "@/lib/validation";
import { setLocalCache, getLocalCache } from "@/lib/cache";
import type { Customer } from "@/types";

interface EditHouseModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedCustomer: Customer) => void;
}

const FEE_PRESETS = [200, 250, 300, 350];

export default function EditHouseModal({
  customer,
  isOpen,
  onClose,
  onUpdated,
}: EditHouseModalProps) {
  const [name, setName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [stbId, setStbId] = useState("");
  const [address, setAddress] = useState("");
  const [collectorNote, setCollectorNote] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyFee, setMonthlyFee] = useState<number>(250);

  const [errors, setErrors] = useState<{
    name?: string;
    houseNumber?: string;
    stbId?: string;
    address?: string;
    phone?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean;
    houseNumber?: boolean;
    stbId?: boolean;
    address?: boolean;
    phone?: boolean;
  }>({});

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setHouseNumber(customer.houseNumber || "");
      setStbId(customer.stbId || "");
      setAddress(customer.address || "");
      setCollectorNote(customer.collectorNote || "");
      setPhone(customer.phone === "Not Provided" ? "" : customer.phone || "");
      setMonthlyFee(customer.monthlyFee || 250);
      setErrors({});
      setTouched({});
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleBlur = (field: "name" | "houseNumber" | "stbId" | "address" | "phone") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: "name" | "houseNumber" | "stbId" | "address" | "phone") => {
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

    if (field === "stbId") {
      const res = validateStbNumber(stbId);
      if (!res.isValid) nextErrors.stbId = res.error;
      else delete nextErrors.stbId;
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
    const stbRes = validateStbNumber(stbId);
    const addressRes = validateAddress(address);
    const phoneRes = validatePhone(phone);

    const newErrors: typeof errors = {};
    if (!nameRes.isValid) newErrors.name = nameRes.error;
    if (!houseNoRes.isValid) newErrors.houseNumber = houseNoRes.error;
    if (!stbRes.isValid) newErrors.stbId = stbRes.error;
    if (!addressRes.isValid) newErrors.address = addressRes.error;
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error;

    setErrors(newErrors);
    setTouched({ name: true, houseNumber: true, stbId: true, address: true, phone: true });
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
      const cleanDoorNo = houseNumber.trim();
      const cleanName = name.trim();
      const cleanStb = stbId.trim();
      const cleanAddress = address.trim();
      const cleanNote = collectorNote.trim();
      const cleanPhone = phone.trim();
      const nowIso = new Date().toISOString();

      const updatedCustomer: Customer = {
        ...customer,
        name: cleanName,
        houseNumber: cleanDoorNo,
        stbId: cleanStb,
        address: cleanAddress,
        phone: cleanPhone || "Not Provided",
        monthlyFee: Number(monthlyFee) || customer.monthlyFee,
        collectorNote: cleanNote || undefined,
      };

      const updatePayload = {
        name: cleanName,
        houseNumber: cleanDoorNo,
        stbId: cleanStb,
        address: cleanAddress,
        phone: cleanPhone || "Not Provided",
        monthlyFee: Number(monthlyFee) || customer.monthlyFee,
        collectorNote: cleanNote || null,
        updatedAt: nowIso,
      };

      // 1. Update area subcollection
      if (customer.areaId) {
        await updateDoc(
          doc(db, "areas", customer.areaId, "customers", customer.id),
          updatePayload
        );
      }

      // 2. Update top-level collection
      await updateDoc(doc(db, "customers", customer.id), updatePayload);

      // 3. Update local caches
      if (customer.areaId) {
        const cacheKey = `cablekhata_cust_${customer.areaId}`;
        const cached = getLocalCache<Customer[]>(cacheKey) || [];
        const updated = cached.map((c) => (c.id === customer.id ? updatedCustomer : c));
        setLocalCache(cacheKey, updated);
      }

      // 4. Also update all-customers collectionGroup cache
      const allCusts = getLocalCache<Customer[]>("cablekhata_customers_subcoll_v3");
      if (allCusts && allCusts.length > 0) {
        const updatedAll = allCusts.map((c) => (c.id === customer.id ? updatedCustomer : c));
        setLocalCache("cablekhata_customers_subcoll_v3", updatedAll);
      }

      showToast({
        message: `Saved changes for House #${cleanDoorNo}`,
        icon: "task_alt",
      });

      if (onUpdated) {
        onUpdated(updatedCustomer);
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to update house:", err);
      showToast({
        message: err?.message || "Failed to save house changes",
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
                Edit House Details
              </h2>
              <p className="text-body-sm text-on-surface-variant truncate">
                {customer.connectionId} • {customer.areaName}
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
          {/* Row 1: Door No + Customer Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            <div className="col-span-1 flex flex-col gap-1">
              <label htmlFor="edit_house_number" className="text-label-md text-on-surface font-bold flex items-center gap-1">
                <span>Door No</span>
                <span className="text-error font-extrabold">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  tag
                </span>
                <input
                  id="edit_house_number"
                  type="text"
                  value={houseNumber}
                  onChange={(e) => {
                    setHouseNumber(e.target.value);
                    if (touched.houseNumber) validateField("houseNumber");
                  }}
                  onBlur={() => handleBlur("houseNumber")}
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

            <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
              <label htmlFor="edit_name" className="text-label-md text-on-surface font-bold flex items-center gap-1">
                <span>House / Customer Name</span>
                <span className="text-error font-extrabold">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  person
                </span>
                <input
                  id="edit_name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) validateField("name");
                  }}
                  onBlur={() => handleBlur("name")}
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

          {/* Row 2: Set Top Box (STB) Number */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="edit_stb_number" className="text-label-md text-on-surface font-bold flex items-center gap-1">
                <span>Set Top Box No (STB No)</span>
                <span className="text-error font-extrabold">*</span>
              </label>
              <span className="text-label-sm text-on-surface-variant font-medium">Alphanumeric</span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                tv
              </span>
              <input
                id="edit_stb_number"
                type="text"
                value={stbId}
                onChange={(e) => {
                  setStbId(e.target.value);
                  if (touched.stbId) validateField("stbId");
                }}
                onBlur={() => handleBlur("stbId")}
                placeholder="e.g. STB-8831 or 8831"
                className={`w-full h-12 pl-9 pr-3 rounded-xl bg-surface-container text-on-surface font-mono text-body-md font-bold focus:outline-none transition-all ${
                  errors.stbId && touched.stbId
                    ? "ring-2 ring-error bg-error-container/10"
                    : "focus:ring-2 focus:ring-primary/50"
                }`}
              />
            </div>
            {errors.stbId && touched.stbId && (
              <span className="text-label-sm text-error font-medium px-1">
                {errors.stbId}
              </span>
            )}
          </div>

          {/* Full Address */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="edit_full_address" className="text-label-md text-on-surface font-bold flex items-center gap-1">
                <span>Doorstep Address</span>
                <span className="text-error font-extrabold">*</span>
              </label>
              <span className="text-label-sm text-on-surface-variant font-medium">
                Street, Landmark & Town
              </span>
            </div>
            <textarea
              id="edit_full_address"
              rows={2}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (touched.address) validateField("address");
              }}
              onBlur={() => handleBlur("address")}
              className={`w-full p-3 rounded-xl bg-surface-container text-on-surface text-body-md leading-relaxed resize-none focus:outline-none transition-all ${
                errors.address && touched.address
                  ? "ring-2 ring-error bg-error-container/10"
                  : "focus:ring-2 focus:ring-primary/50"
              }`}
            />
            {errors.address && touched.address && (
              <div className="flex items-center gap-1 text-label-sm text-error font-semibold px-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{errors.address}</span>
              </div>
            )}
          </div>

          {/* Phone + Monthly Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label htmlFor="edit_phone" className="text-label-md text-on-surface font-bold">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  call
                </span>
                <input
                  id="edit_phone"
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

            <div className="flex flex-col gap-1">
              <label htmlFor="edit_fee" className="text-label-md text-on-surface font-bold">
                Monthly Fee (₹)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-currency-display text-primary font-bold text-headline-sm">
                  ₹
                </span>
                <input
                  id="edit_fee"
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

          {/* Presets */}
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
            <label htmlFor="edit_notes" className="text-label-md text-on-surface font-bold flex items-center justify-between">
              <span>Collector Field Note</span>
              <span className="text-label-sm text-secondary font-medium">Optional Tip</span>
            </label>
            <textarea
              id="edit_notes"
              rows={2}
              value={collectorNote}
              onChange={(e) => setCollectorNote(e.target.value)}
              placeholder="e.g. Ring bell twice, visit in morning"
              className="w-full p-3 rounded-xl bg-surface-container text-on-surface text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 leading-relaxed"
            />
          </div>

          {/* Action buttons */}
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
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
