// src/app/areas/[areaId]/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCustomers } from "@/hooks/useCustomers";
import { useAreas } from "@/hooks/useAreas";
import StatusBadge from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import { showToast } from "@/components/ui/Toast";
import CollectPaymentModal from "@/components/payment/CollectPaymentModal";
import type { Customer } from "@/types";

type SortKey = "walkOrder" | "pendingFirst" | "paidFirst" | "name";

// ─── House Ledger Card ────────────────────────────────────────────
function HouseCard({
  customer,
  onCollect,
}: {
  customer: Customer;
  onCollect: (c: Customer) => void;
}) {
  const isPaid = customer.status === "PAID";
  const isPending = customer.status === "PENDING" || customer.status === "OVERDUE";
  const isPartial = customer.status === "PARTIAL";

  return (
    <article
      className={`p-space-md rounded-xl bg-surface-container-lowest shadow-card flex flex-col gap-space-sm ${
        isPending ? "ring-1 ring-error/20" : ""
      }`}
    >
      {/* Top row: house no + name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-label-lg font-extrabold shrink-0 ${
              isPending
                ? "bg-error-container text-on-error-container"
                : isPartial
                ? "bg-secondary-fixed text-on-secondary-fixed"
                : "bg-surface-container text-on-surface"
            }`}
          >
            {customer.houseNumber}
          </span>
          <div className="min-w-0">
            <h2 className="text-headline-sm text-on-surface truncate font-semibold">
              {customer.name}
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              STB:{" "}
              <span className="font-mono">{customer.connectionId}</span> • ₹
              {customer.monthlyFee} / mo
            </p>
          </div>
        </div>
        <StatusBadge status={customer.status} />
      </div>

      {/* Middle row: phone + paid info or balance */}
      {isPaid ? (
        <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
          <a
            href={`tel:${customer.phone}`}
            className="inline-flex items-center gap-1 text-primary text-label-md active:opacity-75"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>{customer.phone}</span>
          </a>
          <span className="text-label-sm text-outline">Paid this month</span>
        </div>
      ) : isPartial ? (
        <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-label-sm text-primary font-bold">
              Paid: ₹{customer.monthlyFee - (customer.monthlyFee * 0.4)}
            </span>
            <a
              href={`tel:${customer.phone}`}
              className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">call</span>
              {customer.phone}
            </a>
          </div>
          <div className="text-right">
            <span className="text-label-sm text-secondary font-bold uppercase">Remaining</span>
            <div className="text-headline-md text-secondary leading-tight font-bold">
              ₹{Math.round(customer.monthlyFee * 0.4)}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <a
            href={`tel:${customer.phone}`}
            className="h-10 px-3 rounded-lg bg-surface-container text-on-surface text-label-md inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">call</span>
            <span>{customer.phone}</span>
          </a>
          <div className="text-right">
            <span className="text-label-sm text-error font-bold uppercase">Balance Due</span>
            <div className="text-headline-md text-error leading-tight font-bold">
              ₹{customer.monthlyFee}
            </div>
          </div>
        </div>
      )}

      {/* Bottom row: action buttons */}
      {isPaid ? (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/customers/${customer.id}`}
            className="h-10 rounded-lg bg-surface-container text-on-surface text-label-md flex items-center justify-center gap-1.5 active:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>History</span>
          </Link>
          <button
            type="button"
            className="h-10 rounded-lg bg-surface-container-high text-primary text-label-md flex items-center justify-center gap-1.5 active:scale-[0.98]"
            onClick={() => onCollect(customer)}
          >
            <span className="material-symbols-outlined text-[18px]">add_card</span>
            <span>+ Advance</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 pt-1">
          <Link
            href={`/customers/${customer.id}`}
            className="col-span-1 h-12 rounded-lg bg-surface-container text-on-surface text-label-md flex items-center justify-center active:bg-surface-container-high"
          >
            View
          </Link>
          <button
            type="button"
            className={`col-span-3 h-12 rounded-lg text-label-lg font-bold flex items-center justify-center gap-1.5 shadow-card active:scale-[0.98] transition-all ${
              isPartial
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-primary text-on-primary"
            }`}
            onClick={() => onCollect(customer)}
          >
            <span className="material-symbols-outlined text-[20px]">payments</span>
            <span>
              Collect ₹{customer.monthlyFee}
            </span>
          </button>
        </div>
      )}
    </article>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function AreaHousesPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { customers, loading } = useCustomers(areaId);
  const { areas } = useAreas();

  const area = areas.find((a) => a.id === areaId);
  const [sort, setSort] = useState<SortKey>("walkOrder");
  const [search, setSearch] = useState("");
  const [collectingCustomer, setCollectingCustomer] = useState<Customer | null>(null);

  const sorted = useMemo(() => {
    let list = [...customers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.houseNumber.includes(q) ||
          c.connectionId.toLowerCase().includes(q)
      );
    }
    if (sort === "pendingFirst")
      list.sort((a, b) =>
        a.status === "PENDING" ? -1 : b.status === "PENDING" ? 1 : 0
      );
    else if (sort === "paidFirst")
      list.sort((a, b) => (a.status === "PAID" ? -1 : b.status === "PAID" ? 1 : 0));
    else if (sort === "name")
      list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => a.walkOrder - b.walkOrder);
    return list;
  }, [customers, sort, search]);

  const collected = customers
    .filter((c) => c.status === "PAID")
    .reduce((s, c) => s + c.monthlyFee, 0);
  const target = customers.reduce((s, c) => s + c.monthlyFee, 0);
  const paidCount = customers.filter((c) => c.status === "PAID").length;
  const partialCount = customers.filter((c) => c.status === "PARTIAL").length;
  const pendingCount = customers.filter(
    (c) => c.status === "PENDING" || c.status === "OVERDUE"
  ).length;

  return (
    <div className="flex flex-col w-full">
      {/* Sub-header */}
      <section className="px-gutter-mobile pt-space-sm pb-space-xs flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <Link
            href="/areas"
            className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="text-label-md">Back to Areas</span>
          </Link>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span className="text-label-sm">Offline Synced</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                {area?.icon ?? "location_on"}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-headline-lg-mobile text-on-surface truncate font-bold">
                {area?.name ?? "Loading…"}
              </h1>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                LANE DIRECTORY • {area ? `ROUTE 0${area.walkOrder}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/manage/areas"
              aria-label="Edit Area"
              className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </Link>
            <button
              type="button"
              className="h-10 px-3.5 rounded-xl bg-primary text-on-primary text-label-md font-bold flex items-center gap-1.5 shadow-card active:scale-95 transition-all"
              onClick={() => showToast({ message: "Add Customer — coming soon", icon: "person_add" })}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add House</span>
            </button>
          </div>
        </div>
      </section>

      {/* Progress bento card */}
      <section className="px-gutter-mobile py-space-sm">
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card flex flex-col gap-space-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-sm text-primary uppercase font-extrabold tracking-wider">
                {area?.name} Collection
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-currency-display text-primary font-extrabold tabular-nums">
                  ₹{collected.toLocaleString("en-IN")}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  / ₹{target.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-headline-sm text-primary font-bold">
                {target > 0 ? Math.round((collected / target) * 100) : 0}%
              </span>
              <span className="text-label-sm text-on-surface-variant">Collected</span>
            </div>
          </div>

          <ProgressBar collected={collected} target={target} showLabels={false} height="md" />

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "Paid", count: paidCount, amount: collected, color: "text-primary", icon: "check_circle" },
              { label: "Partial", count: partialCount, amount: 0, color: "text-secondary", icon: "timelapse" },
              { label: "Due", count: pendingCount, amount: target - collected, color: "text-error", icon: "schedule" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col p-2 rounded-lg bg-surface-container-low">
                <span className={`text-label-sm ${stat.color} font-bold flex items-center gap-1`}>
                  <span className="material-symbols-outlined text-[14px]">{stat.icon}</span>
                  {stat.count} {stat.label}
                </span>
                <span className="text-label-md text-on-surface mt-0.5 tabular-nums">
                  ₹{stat.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search + sort */}
      <section className="px-gutter-mobile py-space-sm flex flex-col gap-space-sm">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search house no, customer name, phone..."
            className="w-full h-12 pl-11 pr-11 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            aria-label="Scan barcode"
            className="absolute right-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-primary-fixed/40 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </button>
        </div>

        {/* Sort chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { key: "walkOrder", label: "Walk Order" },
              { key: "pendingFirst", label: `Pending First (${pendingCount})` },
              { key: "paidFirst", label: `Paid First (${paidCount})` },
              { key: "name", label: "Name (A-Z)" },
            ] as { key: SortKey; label: string }[]
          ).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-label-md shadow-card flex items-center gap-1 transition-all ${
                sort === s.key
                  ? "bg-primary text-on-primary font-bold"
                  : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {s.label}
              {sort === s.key && (
                <span className="material-symbols-outlined text-[16px]">done</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* House cards */}
      <section className="px-gutter-mobile flex flex-col gap-space-sm pb-space-md">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 bg-surface-container-lowest rounded-xl animate-pulse shadow-card"
            />
          ))
        ) : (
          sorted.map((customer) => (
            <HouseCard
              key={customer.id}
              customer={customer}
              onCollect={setCollectingCustomer}
            />
          ))
        )}
      </section>

      <footer className="px-gutter-mobile pt-space-xs pb-space-lg flex flex-col items-center text-center gap-2">
        <div className="w-10 h-1 rounded-full bg-outline-variant/60 mb-1" />
        <p className="text-body-sm text-on-surface-variant max-w-xs">
          Showing {sorted.length} of {customers.length} houses in {area?.name} area.
        </p>
      </footer>

      {/* Collect Payment Bottom Sheet */}
      <CollectPaymentModal
        customer={collectingCustomer}
        isOpen={!!collectingCustomer}
        onClose={() => setCollectingCustomer(null)}
      />
    </div>
  );
}
