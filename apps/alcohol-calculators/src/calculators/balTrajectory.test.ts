import { describe, expect, it } from "vitest";
import {
  buildTrajectoryRows,
  estimateCurrentBals,
  generateBalTargets,
  hoursFromDrawToTarget,
  parseBalInput
} from "./balTrajectory";

describe("BAL trajectory calculations", () => {
  it("parses mg/dL input", () => {
    expect(parseBalInput("300").mgDl).toBe(300);
    expect(parseBalInput("300 mg/dL").mgDl).toBe(300);
    expect(parseBalInput("0.5 mg/dL").mgDl).toBe(1);
  });

  it("parses decimal BAC input", () => {
    expect(parseBalInput("0.30").mgDl).toBe(300);
    expect(parseBalInput("0.300").mgDl).toBe(300);
    expect(parseBalInput("0.08").mgDl).toBe(80);
  });

  it("generates the starting target, 50 mg/dL decrements, and zero", () => {
    expect(generateBalTargets(327)).toEqual([327, 300, 250, 200, 150, 100, 50, 0]);
    expect(generateBalTargets(300)).toEqual([300, 250, 200, 150, 100, 50, 0]);
  });

  it("calculates hours from draw to target", () => {
    expect(hoursFromDrawToTarget(300, 250, 10)).toBeCloseTo(5);
    expect(hoursFromDrawToTarget(300, 250, 25)).toBeCloseTo(2);
  });

  it("calculates current BAL from the lab draw time", () => {
    const lab = new Date("2026-06-04T18:00:00");
    const current = new Date("2026-06-04T22:00:00");

    expect(estimateCurrentBals(300, lab, current)).toEqual({
      slow: 260,
      typical: 240,
      fast: 200
    });
  });

  it("builds target table rows with remaining time from now", () => {
    const lab = new Date("2026-06-04T18:00:00");
    const current = new Date("2026-06-04T22:00:00");
    const rows = buildTrajectoryRows(300, lab, current);
    const target250 = rows.find((row) => row.targetMgDl === 250);

    expect(target250?.hoursFromDraw.slow).toBeCloseTo(5);
    expect(target250?.hoursFromDraw.typical).toBeCloseTo(3.3333, 4);
    expect(target250?.hoursFromDraw.fast).toBeCloseTo(2);
    expect(target250?.remainingHours.slow).toBeCloseTo(1);
    expect(target250?.remainingHours.typical).toBe(0);
    expect(target250?.remainingHours.fast).toBe(0);
  });
});
