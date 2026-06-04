export function nowForDateTimeInput(): string {
  return toDateTimeInputValue(new Date());
}

export function toDateTimeInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function parseDateTimeInput(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 3_600_000;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

export function formatClockTime(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function formatHours(value: number | null): string {
  if (value === null) {
    return "--";
  }

  if (value <= 0) {
    return "0.0";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  });
}
