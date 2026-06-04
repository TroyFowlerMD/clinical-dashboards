import type {
  BalParseResult,
  BalTrajectoryRow,
  EliminationProfile,
  EliminationRates
} from "../types";
import { addHours, hoursBetween } from "../utils/time";

export const DEFAULT_ELIMINATION_RATES: EliminationRates = {
  slow: 10,
  typical: 15,
  fast: 25
};

export const BAL_PROFILES: EliminationProfile[] = ["slow", "typical", "fast"];

export function parseBalInput(rawInput: string): BalParseResult {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return { mgDl: null, source: "blank", error: "Enter a measured BAL." };
  }

  const hasMgDlUnit = /mg\s*\/?\s*dl/i.test(trimmed);
  const normalized = trimmed
    .replace(/,/g, "")
    .replace(/mg\s*\/?\s*dl/gi, "")
    .replace(/bac/gi, "")
    .replace(/%/g, "")
    .trim();
  const value = Number(normalized);

  if (!Number.isFinite(value) || value < 0) {
    return { mgDl: null, source: "invalid", error: "Measured BAL must be 0 or higher." };
  }

  if (!hasMgDlUnit && value <= 1) {
    return { mgDl: Math.round(value * 1000), source: "decimal BAC" };
  }

  return { mgDl: Math.round(value), source: "mg/dL" };
}

export function validateEliminationRate(rate: number): string | null {
  if (!Number.isFinite(rate) || rate <= 0) {
    return "Elimination rate must be greater than 0.";
  }

  return null;
}

export function estimateBalAtElapsed(
  startingMgDl: number,
  eliminationRateMgDlPerHour: number,
  elapsedHours: number
): number {
  return Math.max(0, startingMgDl - eliminationRateMgDlPerHour * elapsedHours);
}

export function generateBalTargets(startingMgDl: number): number[] {
  if (!Number.isFinite(startingMgDl) || startingMgDl < 0) {
    return [];
  }

  const roundedStart = Math.round(startingMgDl);
  const targets = [roundedStart];
  let nextTarget = Math.floor(roundedStart / 50) * 50;

  if (nextTarget === roundedStart) {
    nextTarget -= 50;
  }

  for (let target = nextTarget; target > 0; target -= 50) {
    targets.push(target);
  }

  if (!targets.includes(0)) {
    targets.push(0);
  }

  return targets;
}

export function hoursFromDrawToTarget(
  startingMgDl: number,
  targetMgDl: number,
  eliminationRateMgDlPerHour: number
): number {
  const rateError = validateEliminationRate(eliminationRateMgDlPerHour);
  if (rateError) {
    throw new Error(rateError);
  }

  return Math.max(0, (startingMgDl - targetMgDl) / eliminationRateMgDlPerHour);
}

export function buildTrajectoryRows(
  startingMgDl: number,
  labDrawTime: Date,
  currentTime: Date,
  rates: EliminationRates = DEFAULT_ELIMINATION_RATES
): BalTrajectoryRow[] {
  const elapsed = hoursBetween(labDrawTime, currentTime);
  const currentBeforeLab = elapsed < 0;

  return generateBalTargets(startingMgDl).map((targetMgDl) => {
    const hoursFromDraw = BAL_PROFILES.reduce((acc, profile) => {
      acc[profile] = hoursFromDrawToTarget(startingMgDl, targetMgDl, rates[profile]);
      return acc;
    }, {} as Record<EliminationProfile, number>);

    const clockTime = BAL_PROFILES.reduce((acc, profile) => {
      acc[profile] = addHours(labDrawTime, hoursFromDraw[profile]);
      return acc;
    }, {} as Record<EliminationProfile, Date>);

    const remainingHours = BAL_PROFILES.reduce((acc, profile) => {
      acc[profile] = currentBeforeLab ? null : Math.max(0, hoursFromDraw[profile] - elapsed);
      return acc;
    }, {} as Record<EliminationProfile, number | null>);

    return {
      targetMgDl,
      hoursFromDraw,
      clockTime,
      remainingHours
    };
  });
}

export function estimateCurrentBals(
  startingMgDl: number,
  labDrawTime: Date,
  currentTime: Date,
  rates: EliminationRates = DEFAULT_ELIMINATION_RATES
): Record<EliminationProfile, number> | null {
  const elapsed = hoursBetween(labDrawTime, currentTime);

  if (elapsed < 0) {
    return null;
  }

  return BAL_PROFILES.reduce((acc, profile) => {
    acc[profile] = Math.round(estimateBalAtElapsed(startingMgDl, rates[profile], elapsed));
    return acc;
  }, {} as Record<EliminationProfile, number>);
}
