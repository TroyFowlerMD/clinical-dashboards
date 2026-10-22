import { describe, expect, it } from "vitest";
import { beveragesByCategory, findBeverage, searchBeverages } from "./beverages";
import { calculateStandardDrinks } from "../calculators/standardDrinks";

describe("Johny Bootlegger directory integration", () => {
  it("finds Bootleggers by common names, spelling and flavor", () => {
    for (const query of ["bootleggers", "Johnny Bootlegger", "Sing Sing Sour Grape"]) {
      expect(searchBeverages(query)[0]?.id).toBe("johny_bootlegger");
      expect(findBeverage(query)?.id).toBe("johny_bootlegger");
    }
    expect(beveragesByCategory("fmb-rtd").some(entry => entry.id === "johny_bootlegger")).toBe(true);
  });

  it("calculates the bottle's standard drinks for each labeled ABV and quantity", () => {
    const entry = findBeverage("bootleggers")!;
    const bottle = entry.commonContainers[0];
    expect(bottle.volume).toBe(200);
    expect(bottle.unit).toBe("mL");
    expect(entry.defaultAbv).toBe(12);
    for (const [abv, expected] of [[12, 1.35256], [10, 1.12713], [8, 0.90171]]) {
      expect(entry.abvOptions).toContain(abv);
      expect(calculateStandardDrinks(1, bottle.volume, bottle.unit, abv)).toBeCloseTo(expected, 4);
      expect(calculateStandardDrinks(3, bottle.volume, bottle.unit, abv)).toBeCloseTo(3 * expected, 4);
    }
  });
});
