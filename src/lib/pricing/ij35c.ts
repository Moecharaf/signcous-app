export type IJ35CUnit = "inches" | "feet";
export type IJ35CLaminate = "gloss" | "matte" | "none";
export type IJ35CSplitDirection = "auto" | "vertical" | "horizontal";
export type IJ35CResolvedSplitDirection = "none" | "vertical" | "horizontal";

export interface IJ35CPricingInput {
  width: number;
  height: number;
  unit: IJ35CUnit;
  quantity: number;
  contourCut: boolean;
  rush: boolean;
  splitDirection: IJ35CSplitDirection;
}

export interface IJ35CPricingResult {
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
  resolvedSplitDirection: IJ35CResolvedSplitDirection;
  panelCount: number;
  panelWidthIn: number;
  panelHeightIn: number;
}

export const IJ35C_BASE_RATE = 3.49;
export const IJ35C_MINIMUM_PRICE = 25;
export const IJ35C_CONTOUR_CUT_MULTIPLIER = 1.15;
export const IJ35C_RUSH_MULTIPLIER = 2;
export const IJ35C_MAX_ROLL_WIDTH = 52;

export const IJ35C_LAMINATE_OPTIONS: { value: IJ35CLaminate; label: string; note: string }[] = [
  { value: "gloss", label: "Gloss Laminate", note: "Shiny finish with vibrant colors." },
  { value: "matte", label: "Matte Laminate", note: "Low-reflection premium look." },
  { value: "none", label: "No Laminate", note: "Best for short-term indoor use." },
];

export function toInches(value: number, unit: IJ35CUnit): number {
  return unit === "feet" ? value * 12 : value;
}

function getPanelsForDirection(
  direction: IJ35CResolvedSplitDirection,
  widthIn: number,
  heightIn: number
): number {
  if (direction === "vertical") {
    return Math.max(1, Math.ceil(widthIn / IJ35C_MAX_ROLL_WIDTH));
  }

  if (direction === "horizontal") {
    return Math.max(1, Math.ceil(heightIn / IJ35C_MAX_ROLL_WIDTH));
  }

  return 1;
}

export function resolveSplitDirection(
  widthIn: number,
  heightIn: number,
  requestedDirection: IJ35CSplitDirection
): IJ35CResolvedSplitDirection {
  if (requestedDirection === "vertical") {
    return widthIn > IJ35C_MAX_ROLL_WIDTH ? "vertical" : "none";
  }

  if (requestedDirection === "horizontal") {
    return heightIn > IJ35C_MAX_ROLL_WIDTH ? "horizontal" : "none";
  }

  const needsVertical = widthIn > IJ35C_MAX_ROLL_WIDTH;
  const needsHorizontal = heightIn > IJ35C_MAX_ROLL_WIDTH;

  if (!needsVertical && !needsHorizontal) return "none";
  if (needsVertical && !needsHorizontal) return "vertical";
  if (!needsVertical && needsHorizontal) return "horizontal";

  const verticalPanels = Math.ceil(widthIn / IJ35C_MAX_ROLL_WIDTH);
  const horizontalPanels = Math.ceil(heightIn / IJ35C_MAX_ROLL_WIDTH);

  return verticalPanels <= horizontalPanels ? "vertical" : "horizontal";
}

export function calculateIJ35CPricing(input: IJ35CPricingInput): IJ35CPricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const rawBase = areaSqFt * IJ35C_BASE_RATE;

  const contourAdjustedBase = input.contourCut
    ? rawBase * IJ35C_CONTOUR_CUT_MULTIPLIER
    : rawBase;
  const contourCutCharge = contourAdjustedBase - rawBase;

  const rushAdjustedBase = input.rush
    ? contourAdjustedBase * IJ35C_RUSH_MULTIPLIER
    : contourAdjustedBase;
  const rushCharge = rushAdjustedBase - contourAdjustedBase;

  const preMinimumTotal = rushAdjustedBase;
  const perItemTotal = Math.max(preMinimumTotal, IJ35C_MINIMUM_PRICE);
  const minimumApplied = perItemTotal > preMinimumTotal;

  const resolvedSplitDirection = resolveSplitDirection(widthIn, heightIn, input.splitDirection);
  const panelCount = getPanelsForDirection(resolvedSplitDirection, widthIn, heightIn);

  const panelWidthIn = resolvedSplitDirection === "vertical"
    ? widthIn / panelCount
    : widthIn;
  const panelHeightIn = resolvedSplitDirection === "horizontal"
    ? heightIn / panelCount
    : heightIn;

  return {
    widthIn,
    heightIn,
    areaSqFt,
    baseRate: IJ35C_BASE_RATE,
    rawBase,
    contourCutCharge,
    contourAdjustedBase,
    rushCharge,
    preMinimumTotal,
    minimumApplied,
    perItemTotal: Math.round(perItemTotal * 100) / 100,
    quantity,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    resolvedSplitDirection,
    panelCount,
    panelWidthIn,
    panelHeightIn,
  };
}
