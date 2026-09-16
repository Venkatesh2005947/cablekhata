// src/app/collection/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAreas } from "@/hooks/useAreas";
import ProgressBar from "@/components/ui/ProgressBar";
import QuickCollectModal from "@/components/payment/QuickCollectModal";
import MonthPickerModal from "@/components/collection/MonthPickerModal";
import type { Payment, Customer } from "@/types";

// Helper to format "YYYY-MM" to readable "Month Year"
function formatMonthLabel(monthKey: string): string {
  try {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return monthKey;
  }
}

// Helper to calculate previous or next month key
function getOffsetMonth(monthKey: string, offset: number): string {
  const [year, month] = monthKey.split("-");
  const d = new Date(Number(year), Number(month) - 1 + offset, 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

// Generate last N months list (e.g. past 12 months)
function getRecentMonths(count: number = 12): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }
  return months;
}

export default function CollectionPage() {
  const { areas } = useAreas();
  const recentMonths = useMemo(() => getRecentMonths(12), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(recentMonths[0]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<"ALL" | "Cash" | "UPI">("ALL");
  const [showQuickCollect, setShowQuickCollect] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Live stream all payments from root payments collection
  useEffect(() => {
    const q = query(
      collection(db, "payments"),
      orderBy("paidDate", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Payment)
        );
        setAllPayments(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Could not stream payments:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch customers to calculate accurate target and house counts
  useEffect(() => {
    const fetchCust = async () => {
      try {
        const snap = await getDocs(collection(db, "customers"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
        setAllCustomers(list);
      } catch (err) {
        console.warn("Could not fetch customers:", err);
      }
    };
    fetchCust();
  }, []);

  // Total target monthly revenue based on all active customers
  const totalMonthlyTarget = useMemo(() => {
    if (allCustomers.length > 0) {
      return allCustomers.reduce((sum, c) => sum + (c.monthlyFee || 0), 0);
    }
    return areas.reduce((s, a) => s + (a.targetAmount || 0), 0);
  }, [allCustomers, areas]);

  const totalHouses = allCustomers.length > 0 ? allCustomers.length : areas.reduce((s, a) => s + a.totalHouses, 0);

  // Filter payments specifically for the selected month
  const monthPayments = useMemo(() => {
    return allPayments.filter((p) => {
      if (p.billingMonth) {
        return p.billingMonth === selectedMonth;
      }
      if (p.paidDate) {
        return p.paidDate.startsWith(selectedMonth);
      }
      return false;
    });
  }, [allPayments, selectedMonth]);

  // Selected month totals
  const monthCollected = useMemo(() => {
    return monthPayments.reduce((s, p) => s + (p.amount || 0), 0);
  }, [monthPayments]);

  const monthCash = useMemo(() => {
    return monthPayments
      .filter((p) => p.method === "Cash")
      .reduce((s, p) => s + (p.amount || 0), 0);
  }, [monthPayments]);

  const monthUPI = useMemo(() => {
    return monthPayments
      .filter((p) => p.method === "UPI")
      .reduce((s, p) => s + (p.amount || 0), 0);
  }, [monthPayments]);

  // Unique customers who paid in this month
  const uniquePaidCustomerIds = useMemo(() => {
    return new Set(monthPayments.map((p) => p.customerId)).size;
  }, [monthPayments]);

  const pendingHousesCount = Math.max(0, totalHouses - uniquePaidCustomerIds);
  const percent = totalMonthlyTarget > 0 ? Math.min(100, Math.round((monthCollected / totalMonthlyTarget) * 100)) : 0;

  // Monthly summary bar data (for past 4 months quick cards)
  const monthlySummaryList = useMemo(() => {
    return recentMonths.slice(0, 4).map((mKey) => {
      const paymentsInMonth = allPayments.filter((p) => {
        if (p.billingMonth) return p.billingMonth === mKey;
        if (p.paidDate) return p.paidDate.startsWith(mKey);
        return false;
      });
      const total = paymentsInMonth.reduce((s, p) => s + (p.amount || 0), 0);
      return {
        monthKey: mKey,
        label: formatMonthLabel(mKey).split(" ")[0], // e.g. "September"
        year: mKey.split("-")[0],
        total,
        count: paymentsInMonth.length,
      };
    });
  }, [allPayments, recentMonths]);

  // Filtered payments by Cash / UPI
  const displayPayments = useMemo(() => {
    if (methodFilter === "ALL") return monthPayments;
    return monthPayments.filter((p) => p.method === methodFilter);
  }, [monthPayments, methodFilter]);

  const isCurrentMonth = selectedMonth === recentMonths[0];

  return (
    <div className="flex-1 flex flex-col pb-28 pt-2">
      {/* Header */}
      <div className="px-gutter-mobile flex items-center justify-between py-2">
        <div>
          <h1 className="text-headline-md text-on-surface font-extrabold">
            Collection Ledger
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Month-wise collections & payment audit trail
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowQuickCollect(true)}
          className="h-10 px-3 rounded-xl bg-primary text-on-primary text-label-md font-bold flex items-center gap-1.5 shadow-card active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>+ Collect</span>
        </button>
      </div>

      <div className="px-gutter-mobile flex flex-col gap-space-md mt-space-sm">
        {/* Month Stepper & Year Picker */}
        <div className="flex flex-col gap-2">
          <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-card border border-surface-container flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelectedMonth(getOffsetMonth(selectedMonth, -1))}
              className="w-10 h-10 rounded-xl bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all shadow-xs"
              title="Previous Month"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMonthPicker(true)}
              className="flex-1 h-10 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center gap-2 font-bold text-label-lg transition-all border border-surface-container active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
              <span>{formatMonthLabel(selectedMonth)}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
            </button>

            <button
              type="button"
              disabled={isCurrentMonth}
              onClick={() => setSelectedMonth(getOffsetMonth(selectedMonth, 1))}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                isCurrentMonth
                  ? "opacity-30 cursor-not-allowed bg-surface-container-low text-on-surface-variant"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95"
              }`}
              title="Next Month"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            </button>
          </div>

          {/* Quick Recent Months Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {recentMonths.map((mKey) => {
              const active = selectedMonth === mKey;
              const [y, m] = mKey.split("-");
              const d = new Date(Number(y), Number(m) - 1, 1);
              const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
              const isCurrent = mKey === recentMonths[0];

              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setSelectedMonth(mKey)}
                  className={`h-9 px-3.5 rounded-xl text-label-md font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    active
                      ? "bg-primary text-on-primary shadow-card scale-[1.02]"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-surface-container"
                  }`}
                >
                  <span>{label}</span>
                  {isCurrent && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      Now
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowMonthPicker(true)}
              className="h-9 px-3 rounded-xl bg-surface-container-high text-primary text-label-sm font-extrabold whitespace-nowrap flex items-center gap-1 border border-primary/20 shrink-0 hover:bg-surface-container-highest"
            >
              <span className="material-symbols-outlined text-[16px]">more_horiz</span>
              <span>All Months</span>
            </button>
          </div>
        </div>

        {/* Selected Month Summary Card */}
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-sm relative overflow-hidden border border-surface-container">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </span>
              <span className="text-label-md text-on-surface-variant uppercase font-bold tracking-wider">
                {formatMonthLabel(selectedMonth)}
              </span>
            </div>
            <span className="text-label-sm font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              {percent}% Collected
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-headline-lg text-primary font-extrabold">
              ₹{monthCollected.toLocaleString("en-IN")}
            </span>
            <span className="text-body-md text-on-surface-variant">
              / ₹{totalMonthlyTarget.toLocaleString("en-IN")} target
            </span>
          </div>

          <ProgressBar
            collected={monthCollected}
            target={totalMonthlyTarget}
            showLabels={false}
          />

          {/* Cash vs UPI Breakdown for Selected Month */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container">
            {/* Cash */}
            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </span>
              <div className="min-w-0">
                <div className="text-label-sm text-on-surface-variant uppercase font-bold">
                  Cash Collected
                </div>
                <div className="text-label-lg font-extrabold text-on-surface">
                  ₹{monthCash.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* UPI */}
            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
              </span>
              <div className="min-w-0">
                <div className="text-label-sm text-on-surface-variant uppercase font-bold">
                  UPI / GPay
                </div>
                <div className="text-label-lg font-extrabold text-on-surface">
                  ₹{monthUPI.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* House Count Metrics */}
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant pt-1 px-1">
            <span>
              <strong className="text-primary font-bold">{uniquePaidCustomerIds}</strong> Paid Houses
            </span>
            <span>•</span>
            <span>
              <strong className="text-error font-bold">{pendingHousesCount}</strong> Pending
            </span>
            <span>•</span>
            <span>
              <strong>{totalHouses}</strong> Total Connections
            </span>
          </div>
        </div>

        {/* 4-Month Historical Snapshot */}
        <div className="flex flex-col gap-1.5">
          <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant px-1">
            Historical Comparison
          </span>
          <div className="grid grid-cols-4 gap-2">
            {monthlySummaryList.map((item) => {
              const isSelected = selectedMonth === item.monthKey;
              return (
                <button
                  key={item.monthKey}
                  type="button"
                  onClick={() => setSelectedMonth(item.monthKey)}
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-card ring-2 ring-primary"
                      : "bg-surface-container-lowest border border-surface-container hover:bg-surface-container-low"
                  }`}
                >
                  <span className="text-label-sm font-bold truncate">{item.label}</span>
                  <span className={`text-label-md font-extrabold mt-0.5 ${isSelected ? "text-white" : "text-primary"}`}>
                    ₹{item.total.toLocaleString("en-IN")}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? "text-white/80" : "text-on-surface-variant"}`}>
                    {item.count} bills
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Chips for Selected Month */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMethodFilter("ALL")}
              className={`h-9 px-3.5 rounded-full text-label-md font-bold transition-all ${
                methodFilter === "ALL"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              All Bills ({monthPayments.length})
            </button>
            <button
              type="button"
              onClick={() => setMethodFilter("Cash")}
              className={`h-9 px-3.5 rounded-full text-label-md font-bold flex items-center gap-1.5 transition-all ${
                methodFilter === "Cash"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setMethodFilter("UPI")}
              className={`h-9 px-3.5 rounded-full text-label-md font-bold flex items-center gap-1.5 transition-all ${
                methodFilter === "UPI"
                  ? "bg-secondary text-on-secondary shadow-xs"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
              <span>UPI</span>
            </button>
          </div>
        </div>

        {/* Transactions List for Selected Month */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-headline-sm text-on-surface font-bold">
              {formatMonthLabel(selectedMonth)} Collections
            </h2>
            <span className="text-label-sm text-on-surface-variant font-medium">
              {displayPayments.length} recorded
            </span>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-surface-container-lowest rounded-xl animate-pulse shadow-card"
              />
            ))
          ) : displayPayments.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center shadow-card flex flex-col items-center gap-2 border border-surface-container">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">
                event_busy
              </span>
              <p className="text-label-lg font-bold text-on-surface">
                No collection records for {formatMonthLabel(selectedMonth)}
              </p>
              <p className="text-body-sm text-on-surface-variant max-w-xs">
                {isCurrentMonth
                  ? "Payments collected from area houses this month will automatically appear here."
                  : "No payments were recorded for this previous month."}
              </p>
              {isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => setShowQuickCollect(true)}
                  className="mt-2 h-10 px-4 rounded-xl bg-primary text-on-primary text-label-md font-bold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>Record Collection</span>
                </button>
              )}
            </div>
          ) : (
            displayPayments.map((payment) => {
              const formattedDate = payment.paidDate
                ? new Date(payment.paidDate).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : formatMonthLabel(selectedMonth);

              const isCash = payment.method === "Cash";

              return (
                <div
                  key={payment.id}
                  className="bg-surface-container-lowest rounded-xl p-3.5 shadow-card flex items-center justify-between gap-3 border border-surface-container hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isCash
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isCash ? "payments" : "qr_code_2"}
                      </span>
                    </span>

                    <div className="min-w-0">
                      <div className="text-label-lg font-bold text-on-surface truncate">
                        {payment.customerName || "Customer"}
                      </div>
                      <div className="text-body-sm text-on-surface-variant flex items-center gap-1.5 truncate">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="font-semibold">{payment.method}</span>
                        {payment.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate">{payment.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-headline-sm font-extrabold text-primary">
                      +₹{payment.amount.toLocaleString("en-IN")}
                    </div>
                    <span className="inline-block text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.2 rounded-full uppercase">
                      Cleared
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Collect Modal */}
      <QuickCollectModal
        isOpen={showQuickCollect}
        onClose={() => setShowQuickCollect(false)}
      />

      {/* Month & Year Picker Modal */}
      <MonthPickerModal
        isOpen={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        allPayments={allPayments}
      />
    </div>
  );
}
