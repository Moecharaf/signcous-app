export type GF830Unit = "inches" | "feet";
export type GF830Laminate = "gloss" | "matte" | "none";
export type GF830SplitDirection = "auto" | "vertical" | "horizontal";

export interface GF830PricingInput {
  width: number;
  height: number;
  unit: GF830Unit;
  quantity: number;
  contourCut: boolean;
  rush: boolean;
  splitDirection: GF830SplitDirection;
}

export interface GF830PricingResult {
  widthIn: number;
  heightIn: number;
  areaSqFt: number;
  baseRate: number;
  rawBase: number;
  contourCutCharge: number;
  contourAdjustedBase: number;
  rushCharge: number;
  preMinimumTotal: number;
  minimumApplied: boolean;
  panelCount: number;
  panelCost: number;
  perItemTotal: number;
  quantity: number;
  grandTotal: number;
  panelWidthIn: number;
  panelHeightIn: number;
}

export const GF830_MINIMUM_PRICE = 30;
export const GF830_MAX_PANEL_WIDTH = 60; // inches
export const GF830_PANEL_EXTRA_COST = 8; // per extra panel
export const GF830_CONTOUR_MULTIPLIER = 1.10;
export const GF830_RUSH_MULTIPLIER = 2;

export const GF830_LAMINATE_OPTIONS: { value: GF830Laminate; label: string; note: string }[] = [
  { value: "gloss", label: "Gloss Laminate", note: "Shiny finish with more vibrant colors." },
  { value: "matte", label: "Matte Laminate", note: "Low reflection for premium applications." },
  { value: "none", label: "No Laminate", note: "For short-term uses where lamination is not required." },
];

function toInches(value: number, unit: GF830Unit): number {
  return unit === "feet" ? value * 12 : value;
}

export function getDynamicRate(sqFt: number): number {
  if (sqFt < 10) return 6.75;
  if (sqFt < 50) return 6.25;
  if (sqFt < 150) return 5.95;
  return 5.75;
}

export function calculateGF830Panels(widthIn: number, heightIn: number, splitDirection: GF830SplitDirection): number {
  if (splitDirection === "vertical") {
    return Math.max(1, Math.ceil(widthIn / GF830_MAX_PANEL_WIDTH));
  }
  if (splitDirection === "horizontal") {
    return Math.max(1, Math.ceil(heightIn / GF830_MAX_PANEL_WIDTH));
  }
  // Auto: use max dimension
  return Math.max(1, Math.ceil(Math.max(widthIn, heightIn) / GF830_MAX_PANEL_WIDTH));
}

export function calculateGF830Price(input: GF830PricingInput): GF830PricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const baseRate = getDynamicRate(areaSqFt);
  const rawBase = areaSqFt * baseRate;

  const contourAdjustedBase = input.contourCut ? rawBase * GF830_CONTOUR_MULTIPLIER : rawBase;
  const contourCutCharge = contourAdjustedBase - rawBase;

  const rushAdjustedBase = input.rush ? contourAdjustedBase * GF830_RUSH_MULTIPLIER : contourAdjustedBase;
  const rushCharge = rushAdjustedBase - contourAdjustedBase;

  // Step 5: Minimum
  const preMin = rushAdjustedBase;
  const minimumApplied = preMin < GF830_MINIMUM_PRICE;
  const afterMinimum = Math.max(preMin, GF830_MINIMUM_PRICE);

  // Step 6: Panel splitting — cost added AFTER minimum
  const panelCount = calculateGF830Panels(widthIn, heightIn, input.splitDirection);
  const panelCost = (panelCount - 1) * GF830_PANEL_EXTRA_COST;

  const perItemTotal = Math.round((afterMinimum + panelCost) * 100) / 100;

  const panelWidthIn = input.splitDirection === "horizontal" ? widthIn : widthIn / panelCount;
  const panelHeightIn = input.splitDirection === "vertical" ? heightIn : heightIn / panelCount;

  return {
    widthIn,
    heightIn,
    areaSqFt,
    baseRate,
    rawBase,
    contourCutCharge,
    contourAdjustedBase,
    rushCharge,
    preMinimumTotal: preMin,
    minimumApplied,
    panelCount,
    panelCost,
    perItemTotal,
    quantity,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    panelWidthIn,
    panelHeightIn,
  };
}
