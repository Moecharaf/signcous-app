export type PrintWrapUnit = "inches" | "feet";
export type PrintWrapLaminate = "gloss" | "matte" | "none";
export type PrintWrapSplitDirection = "auto" | "vertical" | "horizontal";

export interface PrintWrapPricingInput {
  width: number;
  height: number;
  unit: PrintWrapUnit;
  quantity: number;
  contourCut: boolean;
  rush: boolean;
  splitDirection: PrintWrapSplitDirection;
}

export interface PrintWrapPricingResult {
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
  perItemTotal: number;
  quantity: number;
  grandTotal: number;
  panelCount: number;
  panelWidthIn: number;
  panelHeightIn: number;
}

export const PRINT_WRAP_BASE_RATE = 5.75;
export const PRINT_WRAP_MINIMUM_PRICE = 35;
export const PRINT_WRAP_MAX_ROLL_WIDTH = 52;
export const PRINT_WRAP_CONTOUR_MULTIPLIER = 1.15;
export const PRINT_WRAP_RUSH_MULTIPLIER = 2;

export const PRINT_WRAP_LAMINATE_OPTIONS: { value: PrintWrapLaminate; label: string; note: string }[] = [
  { value: "gloss", label: "Gloss Laminate", note: "Shiny finish with more vibrant colors." },
  { value: "matte", label: "Matte Laminate", note: "Low reflection for premium applications." },
  { value: "none", label: "No Laminate", note: "For short-term uses where lamination is not required." },
];

function toInches(value: number, unit: PrintWrapUnit): number {
  return unit === "feet" ? value * 12 : value;
}

// Requested split math: for Auto use max dimension / roll width.
export function calculatePanels(widthIn: number, heightIn: number, splitDirection: PrintWrapSplitDirection): number {
  if (splitDirection === "vertical") {
    return Math.max(1, Math.ceil(widthIn / PRINT_WRAP_MAX_ROLL_WIDTH));
  }

  if (splitDirection === "horizontal") {
    return Math.max(1, Math.ceil(heightIn / PRINT_WRAP_MAX_ROLL_WIDTH));
  }

  return Math.max(1, Math.ceil(Math.max(widthIn, heightIn) / PRINT_WRAP_MAX_ROLL_WIDTH));
}

export function calculatePrintWrapPrice(input: PrintWrapPricingInput): PrintWrapPricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const rawBase = areaSqFt * PRINT_WRAP_BASE_RATE;

  const contourAdjustedBase = input.contourCut ? rawBase * PRINT_WRAP_CONTOUR_MULTIPLIER : rawBase;
  const contourCutCharge = contourAdjustedBase - rawBase;

  const rushAdjustedBase = input.rush ? contourAdjustedBase * PRINT_WRAP_RUSH_MULTIPLIER : contourAdjustedBase;
  const rushCharge = rushAdjustedBase - contourAdjustedBase;

  const perItemTotalUnrounded = Math.max(rushAdjustedBase, PRINT_WRAP_MINIMUM_PRICE);
  const perItemTotal = Math.round(perItemTotalUnrounded * 100) / 100;

  const panelCount = calculatePanels(widthIn, heightIn, input.splitDirection);
  const panelWidthIn = input.splitDirection === "horizontal" ? widthIn : widthIn / panelCount;
  const panelHeightIn = input.splitDirection === "vertical" ? heightIn : heightIn / panelCount;

  return {
    widthIn,
    heightIn,
    areaSqFt,
    baseRate: PRINT_WRAP_BASE_RATE,
    rawBase,
    contourCutCharge,
    contourAdjustedBase,
    rushCharge,
    preMinimumTotal: rushAdjustedBase,
    minimumApplied: perItemTotalUnrounded > rushAdjustedBase,
    perItemTotal,
    quantity,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    panelCount,
    panelWidthIn,
    panelHeightIn,
  };
}
