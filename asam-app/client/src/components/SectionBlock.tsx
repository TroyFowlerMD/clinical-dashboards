// Visually distinct block for Core vs Extra fields within a dimension
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface SectionBlockProps {
  type: "core" | "extra" | "safety";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CONFIG = {
  core: {
    className: "core-section",
    badge: "ASAM Core",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
    titleClass: "text-blue-900 dark:text-blue-100",
  },
  extra: {
    className: "extra-section",
    badge: "Formulation",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    titleClass: "text-green-900 dark:text-green-100",
  },
  safety: {
    className: "d3-section",
    badge: "Safety / Psych",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    titleClass: "text-red-900 dark:text-red-100",
  },
};

export function SectionBlock({ type, title, subtitle, children, defaultOpen = true }: SectionBlockProps) {
  const [open, setOpen] = useState(defaultOpen);
  const c = CONFIG[type];

  return (
    <div className={cn("p-3 space-y-2", c.className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 text-left"
        data-testid={`section-toggle-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", c.badgeClass)}>
            {c.badge}
          </span>
          <span className={cn("text-sm font-semibold", c.titleClass)}>{title}</span>
          {subtitle && <span className="text-xs text-muted-foreground hidden md:inline">— {subtitle}</span>}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="space-y-0.5 pt-1">{children}</div>}
    </div>
  );
}
