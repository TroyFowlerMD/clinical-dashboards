import { useMemo, useState } from "react";
import {
  BAL_PROFILES,
  DEFAULT_ELIMINATION_RATES,
  buildTrajectoryRows,
  estimateBalAtElapsed,
  estimateCurrentBals,
  parseBalInput,
  validateEliminationRate
} from "../calculators/balTrajectory";
import type { EliminationProfile } from "../types";
import { hoursBetween, nowForDateTimeInput, parseDateTimeInput } from "../utils/time";
import TrajectoryGraph from "./TrajectoryGraph";
import TrajectoryTable from "./TrajectoryTable";

interface BALTrajectoryCalculatorProps {
  onBack: () => void;
}

type FocusProfile = EliminationProfile | "custom";

const disclaimer =
  "This calculator provides educational estimates only. Alcohol elimination varies substantially between individuals. Results should not be used to determine whether a patient is safe to drive, operate machinery, leave medical supervision, or avoid emergency evaluation. Clinical assessment and measured laboratory values take priority.";

export default function BALTrajectoryCalculator({ onBack }: BALTrajectoryCalculatorProps) {
  const [balInput, setBalInput] = useState("300");
  const [labDrawInput, setLabDrawInput] = useState("");
  const [currentInput, setCurrentInput] = useState(nowForDateTimeInput);
  const [focusProfile, setFocusProfile] = useState<FocusProfile>("typical");
  const [customRate, setCustomRate] = useState(15);
  const [heavyUse, setHeavyUse] = useState(false);

  const parsedBal = useMemo(() => parseBalInput(balInput), [balInput]);
  const labDrawTime = parseDateTimeInput(labDrawInput);
  const currentTime = parseDateTimeInput(currentInput);
  const currentBeforeLab =
    labDrawTime !== null && currentTime !== null && hoursBetween(labDrawTime, currentTime) < 0;
  const customRateError = focusProfile === "custom" ? validateEliminationRate(customRate) : null;

  const canCalculate =
    parsedBal.mgDl !== null &&
    labDrawTime !== null &&
    currentTime !== null &&
    parsedBal.mgDl >= 0 &&
    !customRateError;

  const trajectoryRows = useMemo(() => {
    if (!canCalculate || parsedBal.mgDl === null || labDrawTime === null || currentTime === null) {
      return [];
    }

    return buildTrajectoryRows(parsedBal.mgDl, labDrawTime, currentTime, DEFAULT_ELIMINATION_RATES);
  }, [canCalculate, parsedBal.mgDl, labDrawTime, currentTime]);

  const currentEstimates =
    canCalculate && parsedBal.mgDl !== null && labDrawTime && currentTime
      ? estimateCurrentBals(parsedBal.mgDl, labDrawTime, currentTime, DEFAULT_ELIMINATION_RATES)
      : null;

  const customEstimate =
    focusProfile === "custom" &&
    canCalculate &&
    parsedBal.mgDl !== null &&
    labDrawTime &&
    currentTime &&
    !currentBeforeLab
      ? Math.round(estimateBalAtElapsed(parsedBal.mgDl, customRate, hoursBetween(labDrawTime, currentTime)))
      : null;

  return (
    <>
      <header className="tool-header">
        <button className="ghost-button" type="button" onClick={onBack}>
          Back to calculators
        </button>
        <div>
          <p className="eyebrow">Measured BAL trajectory</p>
          <h1>BAL Trajectory Calculator</h1>
          <p className="subtitle">Primary display unit: mg/dL.</p>
        </div>
      </header>

      <main className="calculator-layout">
        <section className="stack">
          <section className="form-panel">
            <div className="field-grid">
              <label>
                <span>Measured BAL</span>
                <input
                  value={balInput}
                  inputMode="decimal"
                  onChange={(event) => setBalInput(event.target.value)}
                  placeholder="300 or 0.30"
                />
              </label>

              <label>
                <span>Lab draw date/time</span>
                <input
                  type="datetime-local"
                  value={labDrawInput}
                  onChange={(event) => setLabDrawInput(event.target.value)}
                />
              </label>

              <label>
                <span>Current date/time</span>
                <input
                  type="datetime-local"
                  value={currentInput}
                  onChange={(event) => setCurrentInput(event.target.value)}
                />
              </label>
            </div>

            <div className="interpreted">
              {parsedBal.mgDl !== null ? (
                <strong>Interpreted as: {parsedBal.mgDl} mg/dL.</strong>
              ) : (
                <strong>{parsedBal.error}</strong>
              )}
              {parsedBal.source === "decimal BAC" && <span> Decimal BAC input was normalized to mg/dL.</span>}
            </div>

            <fieldset className="segmented">
              <legend>Elimination profile</legend>
              {(["slow", "typical", "fast", "custom"] as FocusProfile[]).map((profile) => (
                <label key={profile}>
                  <input
                    type="radio"
                    name="focus-profile"
                    value={profile}
                    checked={focusProfile === profile}
                    onChange={() => setFocusProfile(profile)}
                  />
                  <span>{profile}</span>
                </label>
              ))}
            </fieldset>

            {focusProfile === "custom" && (
              <label className="custom-rate">
                <span>Custom elimination rate, mg/dL/hr</span>
                <input
                  min="0"
                  inputMode="decimal"
                  type="number"
                  value={customRate}
                  onChange={(event) => setCustomRate(Number(event.target.value))}
                />
              </label>
            )}

            <label className="checkbox-line">
              <input type="checkbox" checked={heavyUse} onChange={(event) => setHeavyUse(event.target.checked)} />
              <span>Chronic heavy use / high tolerance</span>
            </label>

            {heavyUse && (
              <p className="row-note">
                Tolerance may affect clinical impairment more than it predicts exact BAL clearance. Use clinical
                judgment.
              </p>
            )}

            {currentBeforeLab && (
              <p className="validation-list standalone">
                Current time is before the lab draw time. Current and remaining estimates are suppressed.
              </p>
            )}

            {customRateError && <p className="validation-list standalone">{customRateError}</p>}
          </section>

          <section className="disclaimer">
            <strong>Medical disclaimer:</strong> {disclaimer}
          </section>

          {canCalculate && parsedBal.mgDl !== null && (
            <>
              <section className="estimate-grid" aria-label="Estimated current BAL">
                {currentEstimates ? (
                  BAL_PROFILES.map((profile) => (
                    <div className="estimate-card" key={profile}>
                      <span className="metric-label">{profile}</span>
                      <strong>{currentEstimates[profile]} mg/dL</strong>
                      <span>{DEFAULT_ELIMINATION_RATES[profile]} mg/dL/hr</span>
                    </div>
                  ))
                ) : (
                  <div className="estimate-card span-all">
                    <strong>Current estimate unavailable</strong>
                    <span>Enter a current time at or after the lab draw.</span>
                  </div>
                )}
                {customEstimate !== null && (
                  <div className="estimate-card">
                    <span className="metric-label">custom</span>
                    <strong>{customEstimate} mg/dL</strong>
                    <span>{customRate} mg/dL/hr</span>
                  </div>
                )}
              </section>

              <TrajectoryGraph startingMgDl={parsedBal.mgDl} rates={DEFAULT_ELIMINATION_RATES} />
              <TrajectoryTable rows={trajectoryRows} />
            </>
          )}
        </section>

        <aside className="summary-panel">
          <div className="metric-block">
            <span className="metric-label">Profiles</span>
            <strong>10 / 15 / 25</strong>
            <span>mg/dL/hr slow, typical, fast</span>
          </div>
          <div className="notice compact-notice">
            This calculator starts from a measured BAL. It does not estimate BAL from reported drinks and does not use
            weight, sex, height, or age.
          </div>
        </aside>
      </main>
    </>
  );
}
