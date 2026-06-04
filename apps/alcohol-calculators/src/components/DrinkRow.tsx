import type { ChangeEvent } from "react";
import type { DrinkCalculation, DrinkInput, VolumeUnit } from "../types";
import { beverages, findBeverage } from "../data/beverages";
import { proofToAbv } from "../utils/units";

interface DrinkRowProps {
  row: DrinkInput;
  calculation: DrinkCalculation;
  index: number;
  canRemove: boolean;
  onChange: (row: DrinkInput) => void;
  onRemove: () => void;
}

const units: VolumeUnit[] = ["oz", "mL", "L", "pint", "fifth", "handle"];

function numberFromEvent(event: ChangeEvent<HTMLInputElement>): number {
  return Number(event.target.value);
}

export default function DrinkRow({
  row,
  calculation,
  index,
  canRemove,
  onChange,
  onRemove
}: DrinkRowProps) {
  const productListId = `beverage-list-${row.id}`;

  function applyProduct(value: string) {
    const beverage = findBeverage(value);
    if (!beverage) {
      onChange({ ...row, label: value, beverageId: undefined, notes: undefined });
      return;
    }

    const container = beverage.commonContainers[0];
    onChange({
      ...row,
      label: beverage.displayName,
      beverageId: beverage.id,
      quantity: row.quantity || 1,
      volume: container.volume,
      unit: container.unit,
      abvPercent: beverage.defaultAbv,
      proof: undefined,
      abvSource: beverage.abvSource,
      notes: beverage.notes
    });
  }

  return (
    <section className="drink-row" aria-label={`Drink row ${index + 1}`}>
      <div className="row-head">
        <h3>Drink type {index + 1}</h3>
        {canRemove && (
          <button className="ghost-button compact" type="button" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>

      <div className="field-grid">
        <label>
          <span>Drink/product</span>
          <input
            list={productListId}
            value={row.label}
            onChange={(event) => applyProduct(event.target.value)}
            placeholder="Manual entry or product"
          />
          <datalist id={productListId}>
            {beverages.map((beverage) => (
              <option key={beverage.id} value={beverage.displayName} />
            ))}
          </datalist>
        </label>

        <label>
          <span>Quantity</span>
          <input
            min="0"
            inputMode="decimal"
            type="number"
            value={row.quantity}
            onChange={(event) => onChange({ ...row, quantity: numberFromEvent(event) })}
          />
        </label>

        <label>
          <span>Volume</span>
          <input
            min="0"
            inputMode="decimal"
            type="number"
            value={row.volume}
            onChange={(event) => onChange({ ...row, volume: numberFromEvent(event) })}
          />
        </label>

        <label>
          <span>Unit</span>
          <select
            value={row.unit}
            onChange={(event) => onChange({ ...row, unit: event.target.value as VolumeUnit })}
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>ABV %</span>
          <input
            min="0"
            max="95"
            inputMode="decimal"
            type="number"
            step="0.1"
            value={row.abvPercent}
            onChange={(event) =>
              onChange({
                ...row,
                abvPercent: numberFromEvent(event),
                proof: undefined,
                abvSource: "manual"
              })
            }
          />
        </label>

        <label>
          <span>Proof</span>
          <input
            min="0"
            inputMode="decimal"
            type="number"
            value={row.proof ?? ""}
            placeholder="optional"
            onChange={(event) => {
              const proof = numberFromEvent(event);
              onChange({
                ...row,
                proof: Number.isFinite(proof) ? proof : undefined,
                abvPercent: Number.isFinite(proof) ? proofToAbv(proof) : row.abvPercent,
                abvSource: "manual"
              });
            }}
          />
        </label>
      </div>

      <div className="row-result">
        <div>
          <span className="metric-label">Row subtotal</span>
          <strong>{calculation.standardDrinks.toFixed(1)}</strong>
          <span> U.S. standard drinks</span>
        </div>
        <span className="source-pill">{row.abvSource}</span>
      </div>

      {row.notes && <p className="row-note">{row.notes}</p>}

      {calculation.validationErrors.length > 0 && (
        <ul className="validation-list">
          {calculation.validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
