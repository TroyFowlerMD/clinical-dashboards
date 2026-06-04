export type VolumeUnit = "oz" | "mL" | "L" | "pint" | "fifth" | "handle";

export type AbvSource = "manual" | "product directory" | "default assumption";

export interface ContainerSize {
  volume: number;
  unit: VolumeUnit;
}

export interface BeverageEntry {
  id: string;
  displayName: string;
  aliases: string[];
  category: string;
  defaultAbv: number;
  commonContainers: ContainerSize[];
  abvSource: Exclude<AbvSource, "manual">;
  abvOptions?: number[];
  notes?: string;
  sourceUrl?: string;
}

export interface DrinkInput {
  id: string;
  label: string;
  quantity: number;
  volume: number;
  unit: VolumeUnit;
  abvPercent: number;
  proof?: number;
  abvSource: AbvSource;
  beverageId?: string;
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
