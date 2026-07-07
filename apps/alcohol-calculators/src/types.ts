export type VolumeUnit = "oz" | "mL" | "L" | "pint" | "fifth" | "handle";

export type AbvSource = "manual" | "product directory" | "default assumption";

/**
 * High-level category used to drive the Category -> Product cascade in the
 * Standard Drink Calculator. Keep these values stable; they are used as keys.
 */
export type BeverageCategory =
  | "light-beer"
  | "domestic-beer"
  | "import-beer"
  | "malt-high-gravity"
  | "hard-seltzer"
  | "fmb-rtd"
  | "wine"
  | "fortified-wine"
  | "spirits"
  | "liqueur"
  | "wnc-craft";

export interface CategoryMeta {
  id: BeverageCategory;
  label: string;
}

export interface ContainerSize {
  volume: number;
  unit: VolumeUnit;
  /** Optional colloquial nickname shown in parentheses, e.g. "handle". */
  nickname?: string;
}

export interface BeverageEntry {
  id: string;
  displayName: string;
  aliases: string[];
  /** Machine category used for the cascade selector. */
  category: BeverageCategory;
  /** Human-readable sub-style shown in notes (e.g. "IPA", "amber ale"). */
  style?: string;
  defaultAbv: number;
  commonContainers: ContainerSize[];
  abvSource: Exclude<AbvSource, "manual">;
  /** When a product ships in multiple ABVs, list each selectable value here. */
  abvOptions?: number[];
  notes?: string;
  sourceUrl?: string;
}

export interface DrinkInput {
  id: string;
  label: string;
  /** Blank until the user types; empty string renders an empty field. */
  quantity: number | "";
  volume: number | "";
  unit: VolumeUnit;
  abvPercent: number | "";
  proof?: number;
  abvSource: AbvSource;
  beverageId?: string;
  category?: BeverageCategory;
  notes?: string;
}

export interface DrinkCalculation {
  input: DrinkInput;
  volumeFlOz: number;
  ethanolFlOz: number;
  gramsEthanol: number;
  standardDrinks: number;
  validationErrors: string[];
}

export type EliminationProfile = "slow" | "typical" | "fast";

export interface EliminationRates {
  slow: number;
  typical: number;
  fast: number;
}

export interface BalParseResult {
  mgDl: number | null;
  source: "mg/dL" | "decimal BAC" | "blank" | "invalid";
  error?: string;
}

export interface BalTrajectoryRow {
  targetMgDl: number;
  hoursFromDraw: Record<EliminationProfile, number>;
  clockTime: Record<EliminationProfile, Date>;
  remainingHours: Record<EliminationProfile, number | null>;
}
