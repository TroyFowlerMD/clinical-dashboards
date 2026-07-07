import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type {
  BeverageCategory,
  BeverageEntry,
  ContainerSize,
  DrinkCalculation,
  DrinkInput,
  VolumeUnit
} from "../types";
import {
  beverages,
  beveragesByCategory,
  categories,
  findBeverage,
  searchBeverages
} from "../data/beverages";
import {
  containerKey,
  containerLabel,
  presetGroupForCategory,
  proofToAbv
} from "../utils/units";

interface DrinkRowProps {
  row: DrinkInput;
  calculation: DrinkCalculation;
  index: number;
  canRemove: boolean;
  onChange: (row: DrinkInput) => void;
  onRemove: () => void;
}

const CUSTOM_VOLUME = "__custom__";

/** Parse a numeric text field, allowing an empty string to stay empty. */
function numericFieldValue(event: ChangeEvent<HTMLInputElement>): number | "" {
  const raw = event.target.value;
  if (raw.trim() === "") {
    return "";
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? "" : parsed;
}

/** All selectable volumes for the current row: product containers first, then category presets. */
function volumeOptions(
  beverage: BeverageEntry | undefined,
  category: BeverageCategory | undefined
): ContainerSize[] {
  const list = beverage?.commonContainers?.length
    ? beverage.commonContainers
    : presetGroupForCategory(category);
  // De-duplicate by key while preserving order.
  const seen = new Set<string>();
  const deduped: ContainerSize[] = [];
  for (const c of list) {
    const key = containerKey(c);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }
  return deduped;
}

export default function DrinkRow({
  row,
  calculation,
  index,
  canRemove,
  onChange,
  onRemove
}: DrinkRowProps) {
  const [search, setSearch] = useState("");
  const [customVolume, setCustomVolume] = useState(false);

  const beverage = row.beverageId ? findBeverage(row.label) ?? beverages.find((b) => b.id === row.beverageId) : undefined;
  const category = row.category;

  const productsInCategory = useMemo(
    () => (category ? beveragesByCategory(category) : []),
    [category]
  );

  const searchResults = useMemo(() => searchBeverages(search), [search]);

  const volumes = useMemo(
    () => volumeOptions(beverage, category),
    [beverage, category]
  );

  const currentVolumeKey =
    row.volume === "" ? "" : `${row.volume}|${row.unit}`;
  const volumeIsPreset = volumes.some((c) => containerKey(c) === currentVolumeKey);
  const showCustomVolume = customVolume || (!volumeIsPreset && row.volume !== "");

  const abvVariants = beverage?.abvOptions ?? [];

  function pickCategory(next: string) {
    const value = (next || undefined) as BeverageCategory | undefined;
    onChange({
      ...row,
      category: value,
      // Clear product selection when the category changes.
      beverageId: undefined,
      label: value ? "" : row.label
    });
    setSearch("");
  }

  function applyBeverage(beverageEntry: BeverageEntry) {
    const container = beverageEntry.commonContainers[0];
    onChange({
      ...row,
      label: beverageEntry.displayName,
      beverageId: beverageEntry.id,
      category: beverageEntry.category,
      volume: container ? container.volume : row.volume,
      unit: container ? container.unit : row.unit,
      abvPercent: beverageEntry.defaultAbv,
      proof: undefined,
      abvSource: beverageEntry.abvSource,
      notes: beverageEntry.notes
    });
    setSearch("");
    setCustomVolume(false);
  }

  function pickProduct(value: string) {
    if (!value) {
      onChange({ ...row, beverageId: undefined, label: "", notes: undefined });
      return;
    }
    const entry = beverages.find((b) => b.id === value);
    if (entry) {
      applyBeverage(entry);
    }
  }

  function selectSearchResult(entry: BeverageEntry) {
    applyBeverage(entry);
  }

  function pickVolume(value: string) {
    if (value === CUSTOM_VOLUME) {
      setCustomVolume(true);
      onChange({ ...row, volume: "" });
      return;
    }
    setCustomVolume(false);
    const [vol, unit] = value.split("|");
    onChange({ ...row, volume: Number(vol), unit: unit as VolumeUnit });
  }

  function pickAbvVariant(value: string) {
    onChange({
      ...row,
      abvPercent: value === "" ? row.abvPercent : Number(value),
      proof: undefined,
      abvSource: beverage ? beverage.abvSource : "manual"
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

      {/* Type-ahead search across every product, regardless of category. */}
      <label className="search-field">
        <span>Search all drinks</span>
        <input
          type="text"
          value={search}
          placeholder="Start typing a brand or product…"
          autoComplete="off"
          onChange={(event) => setSearch(event.target.value)}
        />
        {search.trim() !== "" && (
          <ul className="search-results" role="listbox">
            {searchResults.length === 0 && (
              <li className="search-empty">No matches — enter values manually below.</li>
            )}
            {searchResults.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="search-result"
                  onClick={() => selectSearchResult(entry)}
                >
                  <span className="search-result-name">{entry.displayName}</span>
                  <span className="search-result-meta">
                    {entry.style ? `${entry.style} · ` : ""}
                    {entry.defaultAbv}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>

      <div className="field-grid">
        {/* Category -> Product cascade */}
        <label>
          <span>Category</span>
          <select value={category ?? ""} onChange={(event) => pickCategory(event.target.value)}>
            <option value="">Select a category…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Drink / product</span>
          <select
            value={row.beverageId ?? ""}
            disabled={!category}
            onChange={(event) => pickProduct(event.target.value)}
          >
            <option value="">
              {category ? "Select a product…" : "Pick a category first"}
            </option>
            {productsInCategory.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.displayName}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Quantity</span>
          <input
            min="0"
            inputMode="decimal"
            type="number"
            value={row.quantity}
            placeholder="e.g. 3"
            onChange={(event) => onChange({ ...row, quantity: numericFieldValue(event) })}
          />
        </label>

        {/* Volume dropdown with common sizes + a manual Custom option */}
        <label>
          <span>Volume</span>
          <select
            value={showCustomVolume ? CUSTOM_VOLUME : currentVolumeKey}
            onChange={(event) => pickVolume(event.target.value)}
          >
            <option value="">Select a size…</option>
            {volumes.map((c) => (
              <option key={containerKey(c)} value={containerKey(c)}>
                {containerLabel(c)}
              </option>
            ))}
            <option value={CUSTOM_VOLUME}>Custom…</option>
          </select>
        </label>

        {showCustomVolume && (
          <>
            <label>
              <span>Custom volume</span>
              <input
                min="0"
                inputMode="decimal"
                type="number"
                value={row.volume}
                placeholder="Enter amount"
                onChange={(event) => onChange({ ...row, volume: numericFieldValue(event) })}
              />
            </label>
            <label>
              <span>Unit</span>
              <select
                value={row.unit}
                onChange={(event) =>
                  onChange({ ...row, unit: event.target.value as VolumeUnit })
                }
              >
                <option value="oz">oz</option>
                <option value="mL">mL</option>
                <option value="L">L</option>
              </select>
            </label>
          </>
        )}

        {/* When a product ships in multiple ABVs, expose them as a selector. */}
        {abvVariants.length > 1 && (
          <label>
            <span>ABV variant</span>
            <select
              value={row.abvPercent === "" ? "" : String(row.abvPercent)}
              onChange={(event) => pickAbvVariant(event.target.value)}
            >
              <option value="">Select ABV…</option>
              {abvVariants.map((abv) => (
                <option key={abv} value={String(abv)}>
                  {abv}%
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span>ABV %</span>
          <input
            min="0"
            max="95"
            inputMode="decimal"
            type="number"
            step="0.1"
            value={row.abvPercent}
            placeholder="e.g. 5"
            onChange={(event) =>
              onChange({
                ...row,
                abvPercent: numericFieldValue(event),
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
              const proof = numericFieldValue(event);
              onChange({
                ...row,
                proof: proof === "" ? undefined : proof,
                abvPercent: proof === "" ? row.abvPercent : proofToAbv(proof),
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
