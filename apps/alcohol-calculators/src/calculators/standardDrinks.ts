import type { DrinkCalculation, DrinkInput, VolumeUnit } from "../types";
import {
  GRAMS_ETHANOL_PER_FL_OZ,
  STANDARD_DRINK_ETHANOL_FL_OZ,
  volumeToFluidOunces
} from "../utils/units";

/** Blank fields are stored as ""; treat them as 0 for math and empty for display. */
function toNumber(value: number | ""): number {
  return value === "" || !Number.isFinite(Number(value)) ? 0 : Number(value);
}

function isBlank(value: number | ""): boolean {
  return value === "";
}

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

  // A fully blank row (nothing entered yet) is not an error; it just contributes 0.
  const untouched =
    isBlank(input.quantity) && isBlank(input.volume) && isBlank(input.abvPercent);
  if (untouched) {
    return errors;
  }

  const quantity = toNumber(input.quantity);
  const volume = toNumber(input.volume);
  const abv = toNumber(input.abvPercent);

  if (quantity < 0) {
    errors.push("Quantity cannot be negative.");
  }

  if (volume < 0) {
    errors.push("Volume cannot be negative.");
  }

  if (abv <= 0) {
    errors.push("ABV must be greater than 0.");
  }

  if (abv > 95) {
    errors.push("ABV should be 95% or lower.");
  }

  if (input.proof !== undefined && input.proof < 0) {
    errors.push("Proof cannot be negative.");
  }

  return errors;
}

export function calculateDrinkRow(input: DrinkInput): DrinkCalculation {
  const validationErrors = validateDrinkInput(input);
  const quantity = toNumber(input.quantity);
  const abv = toNumber(input.abvPercent);
  const volumeFlOz = volumeToFluidOunces(toNumber(input.volume), input.unit);
  const ethanolFlOz = quantity * volumeFlOz * (abv / 100);
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
  const parts = rows
    .filter((row) => row.standardDrinks > 0)
    .map(({ input }) => {
      const qtyNum = toNumber(input.quantity);
      const volNum = toNumber(input.volume);
      const abvNum = toNumber(input.abvPercent);
      const abv = Number.isInteger(abvNum) ? abvNum.toFixed(0) : abvNum.toFixed(1);
      const volume = Number.isInteger(volNum) ? volNum.toString() : volNum.toFixed(1);
      const label = input.label.trim() || "drink";
      return `${qtyNum} x ${volume} ${input.unit} ${abv}% ${label}`;
    });

  if (parts.length === 0) {
    return "Enter at least one drink to generate a documentation sentence.";
  }

  const joined =
    parts.length <= 1
      ? parts.join("")
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

  return `Patient reports approximately ${total.toFixed(
    1
  )} U.S. standard drinks based on ${joined}.`;
}
