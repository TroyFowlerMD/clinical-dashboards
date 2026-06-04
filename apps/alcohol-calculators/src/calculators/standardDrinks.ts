import type { DrinkCalculation, DrinkInput, VolumeUnit } from "../types";
import {
  GRAMS_ETHANOL_PER_FL_OZ,
  STANDARD_DRINK_ETHANOL_FL_OZ,
  volumeToFluidOunces
} from "../utils/units";

export function calculateStandardDrinks(
  quantity: number,
  volume: number,
  unit: VolumeUnit,
  abvPercent: number
): number {
  const volumeFlOz = volumeToFluidOunces(volume, unit);
  return (quantity * volumeFlOz * (abvPercent / 100)) / STANDARD_DRINK_ETHANOL_FL_OZ;
}

export function validateDrinkInput(input: DrinkInput): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    errors.push("Quantity cannot be negative.");
  }

  if (!Number.isFinite(input.volume) || input.volume < 0) {
    errors.push("Volume cannot be negative.");
  }

  if (!Number.isFinite(input.abvPercent) || input.abvPercent <= 0) {
    errors.push("ABV must be greater than 0.");
  }

  if (input.abvPercent > 95) {
    errors.push("ABV should be 95% or lower.");
  }

  if (input.proof !== undefined && input.proof < 0) {
    errors.push("Proof cannot be negative.");
  }

  return errors;
}

export function calculateDrinkRow(input: DrinkInput): DrinkCalculation {
  const validationErrors = validateDrinkInput(input);
  const volumeFlOz = volumeToFluidOunces(input.volume, input.unit);
  const ethanolFlOz = input.quantity * volumeFlOz * (input.abvPercent / 100);
  const standardDrinks = ethanolFlOz / STANDARD_DRINK_ETHANOL_FL_OZ;
  const gramsEthanol = ethanolFlOz * GRAMS_ETHANOL_PER_FL_OZ;

  return {
    input,
    volumeFlOz,
    ethanolFlOz,
    gramsEthanol,
    standardDrinks,
    validationErrors
  };
}

export function calculateDrinkRows(inputs: DrinkInput[]): DrinkCalculation[] {
  return inputs.map(calculateDrinkRow);
}

export function calculateTotalStandardDrinks(rows: DrinkCalculation[]): number {
  return rows.reduce((sum, row) => sum + row.standardDrinks, 0);
}

export function calculateTotalEthanolFlOz(rows: DrinkCalculation[]): number {
  return rows.reduce((sum, row) => sum + row.ethanolFlOz, 0);
}

export function calculateTotalGramsEthanol(rows: DrinkCalculation[]): number {
  return rows.reduce((sum, row) => sum + row.gramsEthanol, 0);
}

export function buildDocumentationSentence(rows: DrinkCalculation[]): string {
  const total = calculateTotalStandardDrinks(rows);
  const parts = rows.map(({ input }) => {
    const abv = Number.isInteger(input.abvPercent)
      ? input.abvPercent.toFixed(0)
      : input.abvPercent.toFixed(1);
    const volume = Number.isInteger(input.volume)
      ? input.volume.toString()
      : input.volume.toFixed(1);
    return `${input.quantity} x ${volume} ${input.unit} ${abv}% ${input.label}`;
  });

  const joined =
    parts.length <= 1
      ? parts.join("")
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

  return `Patient reports approximately ${total.toFixed(
    1
  )} U.S. standard drinks based on ${joined}.`;
}
