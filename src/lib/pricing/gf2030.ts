export type GF2030Unit = "inches" | "feet";
export type GF2030Laminate = "gloss" | "matte" | "none";
export type GF2030SplitDirection = "auto" | "vertical" | "horizontal";
export type GF2030ResolvedSplitDirection = "none" | "vertical" | "horizontal";

export interface GF2030PricingInput {
  width: number;
  height: number;
  unit: GF2030Unit;
  quantity: number;
  contourCut: boolean;
  rush: boolean;
  splitDirection: GF2030SplitDirection;
}

export interface GF2030PricingResult {
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
  resolvedSplitDirection: GF2030ResolvedSplitDirection;
  panelCount: number;
  panelWidthIn: number;
  panelHeightIn: number;
}

export const GF2030_BASE_RATE = 2.95;
export const GF2030_MINIMUM_PRICE = 30;
export const GF2030_CONTOUR_CUT_MULTIPLIER = 1.15;
export const GF2030_RUSH_MULTIPLIER = 2;
export const GF2030_MAX_ROLL_WIDTH = 52;

export const GF2030_LAMINATE_OPTIONS: { value: GF2030Laminate; label: string; note: string }[] = [
  { value: "gloss", label: "Gloss Laminate", note: "Shiny finish with vibrant colors." },
  { value: "matte", label: "Matte Laminate", note: "Low-reflection premium look." },
  { value: "none", label: "No Laminate", note: "Best for short-term indoor use." },
];

export function toInches(value: number, unit: GF2030Unit): number {
  return unit === "feet" ? value * 12 : value;
}

function getPanelsForDirection(
  direction: GF2030ResolvedSplitDirection,
  widthIn: number,
  heightIn: number
): number {
  if (direction === "vertical") {
    return Math.max(1, Math.ceil(widthIn / GF2030_MAX_ROLL_WIDTH));
  }

  if (direction === "horizontal") {
    return Math.max(1, Math.ceil(heightIn / GF2030_MAX_ROLL_WIDTH));
  }

  return 1;
}

export function resolveSplitDirection(
  widthIn: number,
  heightIn: number,
  requestedDirection: GF2030SplitDirection
): GF2030ResolvedSplitDirection {
  if (requestedDirection === "vertical") {
    return widthIn > GF2030_MAX_ROLL_WIDTH ? "vertical" : "none";
  }

  if (requestedDirection === "horizontal") {
    return heightIn > GF2030_MAX_ROLL_WIDTH ? "horizontal" : "none";
  }

  const needsVertical = widthIn > GF2030_MAX_ROLL_WIDTH;
  const needsHorizontal = heightIn > GF2030_MAX_ROLL_WIDTH;

  if (!needsVertical && !needsHorizontal) return "none";
  if (needsVertical && !needsHorizontal) return "vertical";
  if (!needsVertical && needsHorizontal) return "horizontal";

  const verticalPanels = Math.ceil(widthIn / GF2030_MAX_ROLL_WIDTH);
  const horizontalPanels = Math.ceil(heightIn / GF2030_MAX_ROLL_WIDTH);

  return verticalPanels <= horizontalPanels ? "vertical" : "horizontal";
}

export function calculateGF2030Pricing(input: GF2030PricingInput): GF2030PricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const rawBase = areaSqFt * GF2030_BASE_RATE;

  const contourAdjustedBase = input.contourCut
    ? rawBase * GF2030_CONTOUR_CUT_MULTIPLIER
    : rawBase;
  const contourCutCharge = contourAdjustedBase - rawBase;

  const rushAdjustedBase = input.rush
    ? contourAdjustedBase * GF2030_RUSH_MULTIPLIER
    : contourAdjustedBase;
  const rushCharge = rushAdjustedBase - contourAdjustedBase;

  const preMinimumTotal = rushAdjustedBase;
  const perItemTotal = Math.max(preMinimumTotal, GF2030_MINIMUM_PRICE);
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
    baseRate: GF2030_BASE_RATE,
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
