// src/components/ui/StatusBadge.tsx
import type { PaymentStatus } from "@/types";

interface StatusBadgeProps {
  status: PaymentStatus;
  size?: "sm" | "md";
}

const config: Record<
  PaymentStatus,
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  PAID: {
    bg: "bg-primary-fixed/50",
    text: "text-on-primary-fixed",
    border: "border-primary-fixed",
    icon: "check",
    label: "PAID",
  },
  PARTIAL: {
    bg: "bg-secondary-fixed",
    text: "text-on-secondary-fixed-variant",
    border: "border-secondary-fixed-dim",
    icon: "timelapse",
    label: "PARTIAL",
  },
  PENDING: {
    bg: "bg-error-container",
    text: "text-error",
    border: "border-error-container",
    icon: "warning",
    label: "PENDING",
  },
  OVERDUE: {
    bg: "bg-error-container",
    text: "text-error",
    border: "border-error",
    icon: "warning",
    label: "OVERDUE",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const c = config[status];
  const textClass = size === "sm" ? "text-label-sm" : "text-label-md";
  const iconSize = size === "sm" ? "text-[14px]" : "text-[16px]";
  const px = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";

  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 ${px} rounded-full border font-extrabold tracking-wider uppercase ${c.bg} ${c.text} ${c.border} ${textClass}`}
    >
      <span className={`material-symbols-outlined ${iconSize}`}>{c.icon}</span>
      {c.label}
    </span>
  );
}
