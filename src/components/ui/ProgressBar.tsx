// src/components/ui/ProgressBar.tsx

interface ProgressBarProps {
  collected: number;
  target: number;
  showLabels?: boolean;
  height?: "sm" | "md";
}

export default function ProgressBar({
  collected,
  target,
  showLabels = true,
  height = "sm",
}: ProgressBarProps) {
  const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const remaining = Math.max(0, 100 - percent);
  const h = height === "sm" ? "h-2" : "h-3";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {showLabels && (
        <div className="flex items-center justify-between">
          <span className="text-label-md text-on-surface">
            Collected:{" "}
            <strong className="text-primary font-extrabold">
              ₹{collected.toLocaleString("en-IN")}
            </strong>{" "}
            <span className="text-on-surface-variant">
              / ₹{target.toLocaleString("en-IN")}
            </span>
          </span>
          <span className="text-label-sm text-primary font-extrabold">
            {percent}%
          </span>
        </div>
      )}
      <div className={`w-full ${h} rounded-full bg-surface-container overflow-hidden flex`}>
        <div
          className={`${h} bg-primary rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
        {remaining > 0 && (
          <div
            className={`${h} bg-secondary-container`}
            style={{ width: `${remaining}%` }}
          />
        )}
      </div>
    </div>
  );
}
