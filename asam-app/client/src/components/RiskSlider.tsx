// Reusable 0-4 risk rating selector with optional auto-suggestion
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { RiskRating } from "@shared/schema";

const RISK_LABELS: Record<RiskRating, string> = {
  0: "None",
  1: "Mild",
  2: "Moderate",
  3: "Significant",
  4: "Severe",
};

const RISK_CLASSES: Record<RiskRating, string> = {
  0: "bg-muted text-muted-foreground border-border",
  1: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-700",
  2: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700",
  3: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700",
  4: "bg-red-200 text-red-900 border-red-400 font-bold dark:bg-red-950/60 dark:text-red-100 dark:border-red-600",
};

// Subtle "ghost" style for the suggested-but-not-selected state
const SUGGESTED_GHOST: Record<RiskRating, string> = {
  0: "bg-muted/60 border-dashed border-muted-foreground/40 text-muted-foreground",
  1: "bg-yellow-50 border-dashed border-yellow-400 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-300",
  2: "bg-orange-50 border-dashed border-orange-400 text-orange-700 dark:bg-orange-900/20 dark:border-orange-600 dark:text-orange-300",
  3: "bg-red-50 border-dashed border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300",
  4: "bg-red-100 border-dashed border-red-500 text-red-800 dark:bg-red-950/30 dark:border-red-500 dark:text-red-200",
};

interface RiskSliderProps {
  value: RiskRating;
  onChange: (val: RiskRating) => void;
  onOverrideChange?: (overridden: boolean) => void; // called when user manually picks a value
  label?: string;
  suggested?: RiskRating | null;     // auto-calculated suggestion
  rationale?: string;                // brief explanation shown below
  userOverrode?: boolean;            // true when user picked a different value than suggested
}

export function RiskSlider({
  value,
  onChange,
  onOverrideChange,
  label,
  suggested,
  rationale,
  userOverrode,
}: RiskSliderProps) {
  const hasSuggestion = suggested !== null && suggested !== undefined;
  const suggestionMatchesCurrent = hasSuggestion && suggested === value;

  // Auto-apply suggestion whenever it changes (unless user has overridden)
  const prevSuggested = useRef<RiskRating | null | undefined>(suggested);
  useEffect(() => {
    if (!hasSuggestion) return;
    // If suggestion changed to a new value, clear override and auto-apply
    if (suggested !== prevSuggested.current) {
      prevSuggested.current = suggested;
      if (!userOverrode || suggested !== value) {
        onChange(suggested as RiskRating);
        onOverrideChange?.(false);
      }
    }
  }, [suggested]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row + suggestion chip */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {label && (
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        )}
        {hasSuggestion && (
          <span
            className={cn(
              "text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full border leading-tight",
              suggestionMatchesCurrent
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700"
            )}
          >
            {suggestionMatchesCurrent
              ? `✓ Suggested: ${suggested} — ${RISK_LABELS[suggested]}`
              : userOverrode
              ? `Suggested: ${suggested} (overridden)`
              : `Suggested: ${suggested} — ${RISK_LABELS[suggested]}`}
          </span>
        )}
      </div>

      {/* Rating buttons */}
      <div className="flex gap-1">
        {([0, 1, 2, 3, 4] as RiskRating[]).map((r) => {
          const isSelected = value === r;
          const isSuggested = hasSuggestion && suggested === r && !isSelected;

          return (
            <button
              key={r}
              type="button"
              data-testid={`risk-${r}`}
              title={
                isSuggested
                  ? `Suggested based on checked items`
                  : RISK_LABELS[r]
              }
              onClick={() => {
                onChange(r);
                // Mark as overridden only if user is picking something OTHER than the suggestion
                if (hasSuggestion && r !== suggested) {
                  onOverrideChange?.(true);
                } else {
                  onOverrideChange?.(false);
                }
              }}
              className={cn(
                "flex-1 py-1 px-1 text-xs rounded border transition-all duration-150 text-center relative",
                isSelected
                  ? cn(RISK_CLASSES[r], "ring-2 ring-offset-1 ring-primary scale-105 font-semibold shadow-sm")
                  : isSuggested
                  ? cn(SUGGESTED_GHOST[r], "scale-[1.02]")
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <div className="font-mono font-bold">{r}</div>
              <div className="text-[0.65rem] leading-tight hidden sm:block">{RISK_LABELS[r]}</div>
              {/* Small arrow indicator on suggested button */}
              {isSuggested && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[0.55rem] text-amber-600 dark:text-amber-400 font-bold">
                  ▲
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scale endpoints */}
      <div className="flex justify-between text-[0.65rem] text-muted-foreground px-0.5">
        <span>No problem</span>
        <span>Severe</span>
      </div>

      {/* Rationale text — shows what's driving the suggestion */}
      {hasSuggestion && rationale && (
        <p className="text-[0.68rem] text-muted-foreground leading-snug bg-muted/50 rounded px-2 py-1 border border-border/60">
          <span className="font-semibold text-foreground/70">Why: </span>
          {rationale}
        </p>
      )}
    </div>
  );
}
