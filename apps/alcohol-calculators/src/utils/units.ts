import type { VolumeUnit } from "../types";

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

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}

export function formatCompactNumber(value: number, digits = 1): string {
  return Number.isInteger(value) ? String(value) : formatNumber(value, digits);
}
