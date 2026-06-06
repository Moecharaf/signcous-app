export type OrajetClearUnit = "inches" | "feet";
export type OrajetClearLaminate = "gloss" | "matte" | "none";
export type OrajetClearSplitDirection = "auto" | "vertical" | "horizontal";

export interface OrajetClearPricingInput {
  width: number;
  height: number;
  unit: OrajetClearUnit;
  quantity: number;
  contourCut: boolean;
  rush: boolean;
  splitDirection: OrajetClearSplitDirection;
}

export interface OrajetClearPricingResult {
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

export const ORAJET_CLEAR_MINIMUM_PRICE = 35;
export const ORAJET_CLEAR_MAX_PANEL_WIDTH = 54; // inches
export const ORAJET_CLEAR_SUPPLIER_RATE = 6.0; // cost per sq ft
export const ORAJET_CLEAR_MARKUP_MULTIPLIER = 1.5; // +50% on cost
export const ORAJET_CLEAR_CONTOUR_MULTIPLIER = 1.10;
export const ORAJET_CLEAR_RUSH_MULTIPLIER = 2;

export const ORAJET_CLEAR_LAMINATE_OPTIONS: { value: OrajetClearLaminate; label: string; note: string }[] = [
  { value: "gloss", label: "Gloss Laminate", note: "Shiny finish enhancing color vibrancy through clear vinyl." },
  { value: "matte", label: "Matte Laminate", note: "Low reflection, premium finish for window applications." },
  { value: "none", label: "No Laminate", note: "For short-term or indoor uses where lamination is not required." },
];

function toInches(value: number, unit: OrajetClearUnit): number {
  return unit === "feet" ? value * 12 : value;
}

export function getDynamicRate(sqFt: number): number {
  void sqFt;
  return ORAJET_CLEAR_SUPPLIER_RATE * ORAJET_CLEAR_MARKUP_MULTIPLIER;
}

export function calculateOrajetClearPanels(
  widthIn: number,
  heightIn: number,
  splitDirection: OrajetClearSplitDirection
): number {
  if (splitDirection === "vertical") {
    return Math.max(1, Math.ceil(widthIn / ORAJET_CLEAR_MAX_PANEL_WIDTH));
  }
  if (splitDirection === "horizontal") {
    return Math.max(1, Math.ceil(heightIn / ORAJET_CLEAR_MAX_PANEL_WIDTH));
  }
  // Auto: use max dimension
  return Math.max(1, Math.ceil(Math.max(widthIn, heightIn) / ORAJET_CLEAR_MAX_PANEL_WIDTH));
}

export function calculateOrajetClearPrice(input: OrajetClearPricingInput): OrajetClearPricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const baseRate = getDynamicRate(areaSqFt);
  const rawBase = areaSqFt * baseRate;

  const contourAdjustedBase = input.contourCut ? rawBase * ORAJET_CLEAR_CONTOUR_MULTIPLIER : rawBase;
  const contourCutCharge = contourAdjustedBase - rawBase;

  const rushAdjustedBase = input.rush ? contourAdjustedBase * ORAJET_CLEAR_RUSH_MULTIPLIER : contourAdjustedBase;
  const rushCharge = rushAdjustedBase - contourAdjustedBase;

  // Step 6: Minimum (supplier minimum with Signcous +50% markup)
  const preMin = rushAdjustedBase;
  const minimumWithMarkup = ORAJET_CLEAR_MINIMUM_PRICE * ORAJET_CLEAR_MARKUP_MULTIPLIER;
  const minimumApplied = preMin < minimumWithMarkup;
  const afterMinimum = Math.max(preMin, minimumWithMarkup);

  // Panel splitting for artwork guidance only (no panel surcharge)
  const panelCount = calculateOrajetClearPanels(widthIn, heightIn, input.splitDirection);
  const panelCost = 0;

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
