// src/components/payment/CollectPaymentModal.tsx
"use client";

import { useState, useEffect } from "react";
import type { Customer, PaymentMethod } from "@/types";
import { recordPayment } from "@/lib/payments";

interface CollectPaymentModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CollectPaymentModal({
  customer,
  isOpen,
  onClose,
  onSuccess,
}: CollectPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (customer) {
      // Default to customer's monthly fee
      setAmount(String(customer.monthlyFee || 250));
      setMethod("Cash");
      setNotes("");
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const currentFee = customer.monthlyFee || 250;
  const numAmount = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    const ok = await recordPayment({
      customer,
      amount: numAmount,
      method,
      notes,
    });
    setSubmitting(false);

    if (ok) {
      if (onSuccess) onSuccess();
      onClose();
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
        {/* Header with drag indicator */}
        <div className="flex flex-col items-center gap-1.5 -mt-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
        </div>

        <div className="flex items-start justify-between gap-2 pb-1 border-b border-surface-container">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-label-lg shrink-0 shadow-xs">
              {customer.houseNumber}
            </span>
            <div className="min-w-0">
              <h3 className="text-headline-sm text-on-surface font-bold truncate">
                {customer.name}
              </h3>
              <p className="text-body-sm text-on-surface-variant flex items-center gap-1.5 truncate">
                <span>{customer.areaName}</span>
                <span>•</span>
                <span className="font-mono text-secondary font-medium">{customer.stbId}</span>
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

        {/* Collection Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          {/* Amount Due Card */}
          <div className="bg-surface-container-low rounded-xl p-space-sm flex items-center justify-between border border-surface-container">
            <div>
              <span className="text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
                Monthly Due
              </span>
              <div className="text-headline-md font-extrabold text-on-surface">
                ₹{currentFee}
              </div>
            </div>
            <div className="text-right">
              <span className="text-label-sm text-secondary font-bold uppercase tracking-wider">
                Status
              </span>
              <div className="text-label-md font-bold text-error uppercase">
                {customer.status}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface font-bold">
              Amount Received (₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-headline-sm text-on-surface-variant font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full h-14 pl-10 pr-4 rounded-xl bg-surface-container text-headline-md text-on-surface font-extrabold focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder={String(currentFee)}
              />
            </div>

            {/* Quick amount suggestion chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setAmount(String(currentFee))}
                className={`px-3 py-1 rounded-lg text-label-sm font-bold border transition-all ${
                  amount === String(currentFee)
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container text-on-surface border-surface-container-high"
                }`}
              >
                Full: ₹{currentFee}
              </button>
              {currentFee > 100 && (
                <button
                  type="button"
                  onClick={() => setAmount("100")}
                  className={`px-3 py-1 rounded-lg text-label-sm font-bold border transition-all ${
                    amount === "100"
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container text-on-surface border-surface-container-high"
                  }`}
                >
                  ₹100
                </button>
              )}
              {currentFee > 150 && (
                <button
                  type="button"
                  onClick={() => setAmount("150")}
                  className={`px-3 py-1 rounded-lg text-label-sm font-bold border transition-all ${
                    amount === "150"
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container text-on-surface border-surface-container-high"
                  }`}
                >
                  ₹150
                </button>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface font-bold">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("Cash")}
                className={`min-h-[50px] rounded-xl flex items-center justify-center gap-2 font-bold text-label-lg border-2 transition-all ${
                  method === "Cash"
                    ? "bg-primary/10 border-primary text-primary shadow-xs"
                    : "bg-surface-container border-transparent text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">payments</span>
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("UPI")}
                className={`min-h-[50px] rounded-xl flex items-center justify-center gap-2 font-bold text-label-lg border-2 transition-all ${
                  method === "UPI"
                    ? "bg-secondary/10 border-secondary text-secondary shadow-xs"
                    : "bg-surface-container border-transparent text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                <span>UPI / GPay</span>
              </button>
            </div>
          </div>

          {/* Optional Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm text-on-surface-variant font-medium">
              Note / Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid at gate, Balance ₹50 next week"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-container text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || numAmount <= 0}
              className="w-full min-h-[52px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-card flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[22px]">check_circle</span>
                  <span>
                    Record ₹{numAmount} {method}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
