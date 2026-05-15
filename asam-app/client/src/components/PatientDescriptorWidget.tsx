// Interactive patient descriptor widget
// Two-column: left = age spinner, right = gender chips
// Builds a clean de-identified descriptor string from the selections + addendum
import { useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Gender, Configuration } from "@shared/schema";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "M", label: "M" },
  { value: "F", label: "F" },
  { value: "NB", label: "NB" },
  { value: "TM", label: "TM" },
  { value: "TF", label: "TF" },
  { value: "Other", label: "Other" },
];

interface PatientDescriptorWidgetProps {
  age: number | null;
  gender: Gender;
  addendum: string;
  onAgeChange: (age: number | null) => void;
  onGenderChange: (gender: Gender) => void;
  onAddendumChange: (text: string) => void;
}

// Build the descriptor string from parts
export function buildDescriptorString(age: number | null, gender: Gender, addendum: string): string {
  const parts: string[] = [];
  if (age !== null) parts.push(`${age}-year-old`);
  if (gender) {
    const genderMap: Record<string, string> = {
      M: "male", F: "female", NB: "nonbinary individual", TM: "transgender man",
      TF: "transgender woman", Other: "individual",
    };
    parts.push(genderMap[gender] || gender);
  } else if (age !== null) {
    parts.push("patient");
  }
  const base = parts.join(" ");
  if (!base && !addendum.trim()) return "";
  if (!base) return addendum.trim();
  if (!addendum.trim()) return base;
  return `${base} with ${addendum.trim()}`;
}

export function PatientDescriptorWidget({
  age, gender, addendum, onAgeChange, onGenderChange, onAddendumChange,
}: PatientDescriptorWidgetProps) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use a ref so the repeat interval always reads the latest age
  const ageRef = useRef(age);
  useEffect(() => { ageRef.current = age; }, [age]);

  const increment = useCallback(() => {
    const next = ageRef.current === null ? 18 : Math.min(ageRef.current + 1, 120);
    onAgeChange(next);
  }, [onAgeChange]);

  const decrement = useCallback(() => {
    if (ageRef.current === null) return;
    const next = Math.max(ageRef.current - 1, 1);
    onAgeChange(next);
  }, [onAgeChange]);

  const startPress = (action: () => void) => {
    // Fire once immediately
    action();
    // After 400ms hold, start repeating at 80ms
    pressTimerRef.current = setTimeout(() => {
      repeatTimerRef.current = setInterval(action, 80);
    }, 400);
  };

  const stopPress = () => {
    if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
    if (repeatTimerRef.current) { clearInterval(repeatTimerRef.current); repeatTimerRef.current = null; }
  };

  // Clean up on unmount
  useEffect(() => () => stopPress(), []);

  const handleAgeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (v === "" || v === "0") { onAgeChange(null); return; }
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= 120) onAgeChange(n);
  };

  const toggleGender = (g: Gender) => {
    onGenderChange(gender === g ? null : g);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {/* Age spinner */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-[0.65rem] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Age</span>
          <button
            type="button" className="pd-age-btn" aria-label="Increase age" tabIndex={-1}
            onMouseDown={() => startPress(increment)}
            onMouseUp={stopPress}
            onMouseLeave={stopPress}
            onTouchStart={(e) => { e.preventDefault(); startPress(increment); }}
            onTouchEnd={stopPress}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={1}
            max={120}
            value={age ?? ""}
            onChange={handleAgeInput}
            placeholder="—"
            className={cn(
              "w-12 h-8 text-center text-sm font-semibold rounded border border-border bg-muted/50",
              "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
              "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            )}
            data-testid="input-age"
          />
          <button
            type="button" className="pd-age-btn" aria-label="Decrease age" tabIndex={-1}
            onMouseDown={() => startPress(decrement)}
            onMouseUp={stopPress}
            onMouseLeave={stopPress}
            onTouchStart={(e) => { e.preventDefault(); startPress(decrement); }}
            onTouchEnd={stopPress}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Gender chips */}
        <div className="flex-1">
          <span className="text-[0.65rem] text-muted-foreground font-medium uppercase tracking-wide block mb-1.5">Gender</span>
          <div className="flex flex-wrap gap-1">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn("pd-chip", gender === opt.value && "active")}
                onClick={() => toggleGender(opt.value)}
                data-testid={`gender-${opt.value}`}
                aria-pressed={gender === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Addendum free text */}
      <div>
        <span className="text-[0.65rem] text-muted-foreground font-medium uppercase tracking-wide block mb-1">Clinical context</span>
        <Textarea
          value={addendum}
          onChange={(e) => onAddendumChange(e.target.value)}
          rows={2}
          placeholder="e.g. severe AUD, co-occurring MDD, homeless"
          className="text-sm resize-none"
          data-testid="input-patient-addendum"
        />
      </div>
    </div>
  );
}
