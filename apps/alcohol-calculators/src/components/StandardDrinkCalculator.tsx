import { useMemo, useState } from "react";
import type { DrinkInput } from "../types";
import {
  buildDocumentationSentence,
  calculateDrinkRows,
  calculateTotalEthanolFlOz,
  calculateTotalGramsEthanol,
  calculateTotalStandardDrinks
} from "../calculators/standardDrinks";
import DrinkRow from "./DrinkRow";

interface StandardDrinkCalculatorProps {
  onBack: () => void;
}

function createDrinkRow(): DrinkInput {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: "Manual entry",
    quantity: 1,
    volume: 12,
    unit: "oz",
    abvPercent: 5,
    abvSource: "manual"
  };
}

export default function StandardDrinkCalculator({ onBack }: StandardDrinkCalculatorProps) {
  const [rows, setRows] = useState<DrinkInput[]>(() => [createDrinkRow()]);
  const [copyStatus, setCopyStatus] = useState("");
  const calculations = useMemo(() => calculateDrinkRows(rows), [rows]);
  const totalStandardDrinks = calculateTotalStandardDrinks(calculations);
  const totalEthanolFlOz = calculateTotalEthanolFlOz(calculations);
  const totalGramsEthanol = calculateTotalGramsEthanol(calculations);
  const documentationSentence = buildDocumentationSentence(calculations);

  function updateRow(nextRow: DrinkInput) {
    setRows((currentRows) => currentRows.map((row) => (row.id === nextRow.id ? nextRow : row)));
  }

  function removeRow(rowId: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
  }

  async function copyDocumentation() {
    try {
      await navigator.clipboard.writeText(documentationSentence);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy unavailable");
    }
  }

  return (
    <>
      <header className="tool-header">
        <button className="ghost-button" type="button" onClick={onBack}>
          Back to calculators
        </button>
        <div>
          <p className="eyebrow">Documentation calculator</p>
          <h1>Standard Drink Calculator</h1>
          <p className="subtitle">1 U.S. standard drink = 0.6 fl oz pure ethanol = 14 g ethanol.</p>
        </div>
      </header>

      <main className="calculator-layout">
        <section className="stack">
          {rows.map((row, index) => (
            <DrinkRow
              key={row.id}
              row={row}
              calculation={calculations[index]}
              index={index}
              canRemove={rows.length > 1}
              onChange={updateRow}
              onRemove={() => removeRow(row.id)}
            />
          ))}

          <button className="primary-button" type="button" onClick={() => setRows([...rows, createDrinkRow()])}>
            + Add additional drink type
          </button>
        </section>

        <aside className="summary-panel" aria-label="Standard drink summary">
          <div className="metric-block">
            <span className="metric-label">Total</span>
            <strong>{totalStandardDrinks.toFixed(1)}</strong>
            <span>U.S. standard drinks</span>
          </div>

          <div className="details-grid">
            <div>
              <span className="metric-label">Pure ethanol</span>
              <strong>{totalEthanolFlOz.toFixed(2)} fl oz</strong>
            </div>
            <div>
              <span className="metric-label">Ethanol mass</span>
              <strong>{totalGramsEthanol.toFixed(0)} g</strong>
            </div>
          </div>

          <div className="doc-sentence">
            <span className="metric-label">Documentation sentence</span>
            <p>{documentationSentence}</p>
            <button className="secondary-button" type="button" onClick={copyDocumentation}>
              Copy sentence
            </button>
            {copyStatus && <span className="copy-status">{copyStatus}</span>}
          </div>

          <div className="notice compact-notice">
            Directory defaults are starter estimates. Use the label when available and override ABV or volume as
            needed.
          </div>
        </aside>
      </main>
    </>
  );
}
