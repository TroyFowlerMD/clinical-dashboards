// Reusable checkbox row with optional inline note that appears when checked
// Tab/space/enter navigation: space or enter = toggle checkbox, tab = move to next note or next checkbox
import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CheckRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  note?: string;
  onNoteChange?: (val: string) => void;
  sublabel?: string;
  highlight?: boolean; // red highlight for critical safety items
  notePlaceholder?: string;
  // Auto-check support
  autoRationale?: string;   // if set, this box was auto-checked — show the rationale banner
  onAutoOverride?: () => void; // called when user clicks "uncheck anyway"
}

export function CheckRow({
  id,
  label,
  checked,
  onChange,
  note,
  onNoteChange,
  sublabel,
  highlight,
  notePlaceholder,
  autoRationale,
  onAutoOverride,
}: CheckRowProps) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const checkboxRef = useRef<HTMLButtonElement>(null);

  // Handle Enter key on the checkbox button (Space is native, Enter is not)
  const handleCheckboxKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab from note goes to the next focusable element (next checkbox)
    if (e.key === "Tab" && !e.shiftKey) {
      // Let default tab behavior navigate forward naturally
      return;
    }
  };

  return (
    <div
      className={cn(
        "rounded px-1.5 py-0.5 -mx-1.5",
        checked && highlight && "bg-destructive/10",
        checked && !highlight && "bg-primary/5"
      )}
    >
      {/* Checkbox + label row */}
      <div className="check-row">
        <Checkbox
          ref={checkboxRef}
          id={id}
          checked={checked}
          onCheckedChange={(v) => onChange(!!v)}
          onKeyDown={handleCheckboxKeyDown}
          data-testid={`check-${id}`}
          className={cn(
            "mt-0.5 flex-shrink-0",
            highlight && checked && "border-destructive data-[state=checked]:bg-destructive"
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            "check-row leading-snug flex flex-col cursor-pointer flex-1",
          )}
        >
          <span className={cn("text-sm", highlight && checked && "text-destructive font-medium")}>
            {label}
          </span>
          {sublabel && (
            <span className="text-xs text-muted-foreground leading-tight">{sublabel}</span>
          )}
        </label>
      </div>

      {/* Auto-check rationale banner */}
      {checked && autoRationale && (
        <div className="flex items-center gap-1.5 mt-0.5 mb-0.5 px-1.5 py-1 rounded bg-sky-50 border border-sky-200 dark:bg-sky-950/30 dark:border-sky-800">
          <span className="text-[0.62rem] text-sky-700 dark:text-sky-300 leading-snug flex-1">
            <span className="font-semibold">Auto-checked: </span>{autoRationale}
          </span>
          {onAutoOverride && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAutoOverride(); }}
              className="text-[0.6rem] text-sky-600 dark:text-sky-400 underline underline-offset-1 hover:text-sky-800 dark:hover:text-sky-200 flex-shrink-0 whitespace-nowrap"
            >
              uncheck anyway
            </button>
          )}
        </div>
      )}

      {/* Inline note — shown when checked, auto-focused */}
      {checked && onNoteChange !== undefined && (
        <textarea
          ref={noteRef}
          value={note ?? ""}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={handleNoteKeyDown}
          placeholder={notePlaceholder ?? "Add note…"}
          rows={1}
          className="check-note w-full"
          data-testid={`note-${id}`}
          aria-label={`Note for ${label}`}
          // Allow auto-grow: on input, resize height to fit content
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 96) + "px";
          }}
        />
      )}
    </div>
  );
}
