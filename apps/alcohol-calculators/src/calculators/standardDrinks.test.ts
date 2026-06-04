import { describe, expect, it } from "vitest";
import {
  buildDocumentationSentence,
  calculateDrinkRow,
  calculateStandardDrinks,
  calculateTotalStandardDrinks
} from "./standardDrinks";
import { proofToAbv, volumeToFluidOunces } from "../utils/units";
import type { DrinkInput } from "../types";

function drink(input: Partial<DrinkInput>): DrinkInput {
  return {
    id: "row",
    label: "beer",
    quantity: 1,
    volume: 12,
    unit: "oz",
    abvPercent: 5,
    abvSource: "manual",
    ...input
  };
}

describe("standard drink calculations", () => {
  it("calculates the standard drink formula", () => {
    expect(calculateStandardDrinks(6, 12, "oz", 5)).toBeCloseTo(6.0, 5);
    expect(calculateStandardDrinks(3, 24, "oz", 8)).toBeCloseTo(9.6, 5);
    expect(calculateStandardDrinks(1, 1, "pint", 40)).toBeCloseTo(10.6667, 4);
  });

  it("converts supported volume units to fluid ounces", () => {
    expect(volumeToFluidOunces(12, "oz")).toBe(12);
    expect(volumeToFluidOunces(750, "mL")).toBeCloseTo(25.3605, 4);
    expect(volumeToFluidOunces(1.75, "L")).toBeCloseTo(59.1746, 4);
    expect(volumeToFluidOunces(1, "pint")).toBe(16);
    expect(volumeToFluidOunces(1, "fifth")).toBeCloseTo(25.3605, 4);
    expect(volumeToFluidOunces(1, "handle")).toBeCloseTo(59.1746, 4);
  });

  it("converts proof to ABV", () => {
    expect(proofToAbv(80)).toBe(40);
    expect(proofToAbv(100)).toBe(50);
  });

  it("matches the requested combined documentation example", () => {
    const rows = [
      calculateDrinkRow(drink({ id: "beer", label: "beer", quantity: 6, volume: 12, abvPercent: 5 })),
      calculateDrinkRow(
        drink({ id: "strong-beer", label: "high-gravity beer", quantity: 3, volume: 24, abvPercent: 8 })
      ),
      calculateDrinkRow(
        drink({ id: "vodka", label: "vodka assumed at 40% ABV", quantity: 1, volume: 1, unit: "pint", abvPercent: 40 })
      )
    ];

    expect(calculateTotalStandardDrinks(rows)).toBeCloseTo(26.2667, 4);
    expect(buildDocumentationSentence(rows)).toContain("26.3 U.S. standard drinks");
  });
});
