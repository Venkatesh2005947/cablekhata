// src/components/collection/MonthPickerModal.tsx
"use client";

import { useState, useMemo } from "react";
import type { Payment } from "@/types";

interface MonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // "YYYY-MM"
  onSelectMonth: (monthKey: string) => void;
  allPayments: Payment[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthPickerModal({
  isOpen,
  onClose,
  selectedMonth,
  onSelectMonth,
  allPayments,
}: MonthPickerModalProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthKey = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return parseInt(selectedMonth.split("-")[0]) || currentYear;
  });

  // Calculate unique years with data + recent 3 years
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear, currentYear - 1, currentYear - 2]);
    allPayments.forEach((p) => {
      const y = parseInt((p.billingMonth || p.paidDate || "").slice(0, 4));
      if (!isNaN(y) && y > 2000) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allPayments, currentYear]);

  // Compute monthly totals for the selected year
  const yearMonthlyTotals = useMemo(() => {
    const totals: Record<string, { total: number; count: number }> = {};
    for (let m = 1; m <= 12; m++) {
      const mKey = `${selectedYear}-${String(m).padStart(2, "0")}`;
      totals[mKey] = { total: 0, count: 0 };
    }

    allPayments.forEach((p) => {
      const mKey = (p.billingMonth || p.paidDate || "").slice(0, 7);
      if (totals[mKey]) {
        totals[mKey].total += p.amount || 0;
        totals[mKey].count += 1;
      }
    });

    return totals;
  }, [allPayments, selectedYear]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-space-md flex flex-col gap-space-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              calendar_month
            </span>
            <h3 className="text-headline-sm text-on-surface font-bold">
              Select Billing Month
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-container-high active:scale-95"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Year Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {availableYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`h-9 px-4 rounded-xl text-label-md font-bold transition-all shrink-0 ${
                selectedYear === yr
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* 12-Month Grid */}
        <div className="grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((name, idx) => {
            const mNum = idx + 1;
            const mKey = `${selectedYear}-${String(mNum).padStart(2, "0")}`;
            const isSelected = selectedMonth === mKey;
            const isCurrent = currentMonthKey === mKey;
            const monthData = yearMonthlyTotals[mKey] || { total: 0, count: 0 };
            const hasData = monthData.total > 0;

            return (
              <button
                key={mKey}
                type="button"
                onClick={() => {
                  onSelectMonth(mKey);
                  onClose();
                }}
                className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-card scale-[1.02]"
                    : hasData
                    ? "bg-surface-container-low text-on-surface border-primary/20 hover:border-primary"
                    : "bg-surface-container-lowest text-on-surface-variant border-surface-container hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-label-md font-bold">{name.slice(0, 3)}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>

                {hasData ? (
                  <span
                    className={`text-[11px] font-extrabold mt-1 ${
                      isSelected ? "text-white" : "text-primary"
                    }`}
                  >
                    ₹{monthData.total.toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="text-[10px] text-on-surface-variant/60 mt-1">
                    No records
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Current Month Jump Button */}
        <div className="pt-2 border-t border-surface-container">
          <button
            type="button"
            onClick={() => {
              onSelectMonth(currentMonthKey);
              onClose();
            }}
            className="w-full h-11 rounded-xl bg-surface-container text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">today</span>
            <span>Jump to Current Month ({MONTH_NAMES[new Date().getMonth()]} {currentYear})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
