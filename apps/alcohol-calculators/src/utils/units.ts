import type { ContainerSize, VolumeUnit } from "../types";

export const ML_PER_FL_OZ = 29.5735;
export const STANDARD_DRINK_ETHANOL_FL_OZ = 0.6;
export const GRAMS_PER_STANDARD_DRINK = 14;
export const GRAMS_ETHANOL_PER_FL_OZ =
  GRAMS_PER_STANDARD_DRINK / STANDARD_DRINK_ETHANOL_FL_OZ;

export function volumeToFluidOunces(volume: number, unit: VolumeUnit): number {
  switch (unit) {
    case "oz":
      return volume;
    case "mL":
      return volume / ML_PER_FL_OZ;
    case "L":
      return (volume * 1000) / ML_PER_FL_OZ;
    case "pint":
      return volume * 16;
    case "fifth":
      return (volume * 750) / ML_PER_FL_OZ;
    case "handle":
      return (volume * 1.75 * 1000) / ML_PER_FL_OZ;
    default: {
      const exhaustive: never = unit;
      return exhaustive;
    }
  }
}

export function proofToAbv(proof: number): number {
  return proof / 2;
}

/** Human-readable container label, e.g. "750 mL (fifth)" or "12 oz". */
export function containerLabel(container: ContainerSize): string {
  const vol = Number.isInteger(container.volume)
    ? container.volume.toString()
    : container.volume.toString();
  const base = `${vol} ${container.unit}`;
  return container.nickname ? `${base} (${container.nickname})` : base;
}

/** Stable key encoding a container's volume + unit for <option> values. */
export function containerKey(container: ContainerSize): string {
  return `${container.volume}|${container.unit}`;
}

/**
 * Common volume presets offered per category before a specific product is
 * chosen. Nicknames follow the user's requested pint/fifth/handle convention.
 */
export const categoryVolumePresets: Record<string, ContainerSize[]> = {
  beer: [
    { volume: 12, unit: "oz" },
    { volume: 16, unit: "oz" },
    { volume: 19.2, unit: "oz" },
    { volume: 24, unit: "oz" },
    { volume: 25, unit: "oz" },
    { volume: 40, unit: "oz" }
  ],
  wine: [
    { volume: 5, unit: "oz", nickname: "glass" },
    { volume: 187, unit: "mL", nickname: "split" },
    { volume: 375, unit: "mL", nickname: "half" },
    { volume: 750, unit: "mL", nickname: "bottle" },
    { volume: 1.5, unit: "L", nickname: "magnum" },
    { volume: 3, unit: "L", nickname: "box" },
    { volume: 5, unit: "L", nickname: "box" }
  ],
  spirits: [
    { volume: 50, unit: "mL", nickname: "mini" },
    { volume: 100, unit: "mL" },
    { volume: 200, unit: "mL" },
    { volume: 375, unit: "mL", nickname: "pint" },
    { volume: 750, unit: "mL", nickname: "fifth" },
    { volume: 1, unit: "L" },
    { volume: 1.75, unit: "L", nickname: "handle" }
  ]
};

/** Map a beverage category to the preset group used when no product is picked. */
export function presetGroupForCategory(category?: string): ContainerSize[] {
  switch (category) {
    case "wine":
    case "fortified-wine":
      return categoryVolumePresets.wine;
    case "spirits":
    case "liqueur":
      return categoryVolumePresets.spirits;
    default:
      return categoryVolumePresets.beer;
  }
}

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}

export function formatCompactNumber(value: number, digits = 1): string {
  return Number.isInteger(value) ? String(value) : formatNumber(value, digits);
}
