export type DualViewUnit = "inches" | "feet";
export type DualViewSide = "single" | "double";

export interface DualViewConstraints {
  maxWidth: number;
  maxHeight: number;
}

export interface DualViewPricingInput {
  width: number;
  height: number;
  unit: DualViewUnit;
  quantity: number;
  side: DualViewSide;
  contourCut: boolean;
}

export interface DualViewPricingResult {
  widthIn: number;
  heightIn: number;
  areaSqFt: number;
  baseRate: number;
  rawBase: number;
  contourCutCharge: number;
  contourAdjustedBase: number;
  panelCount: number;
  panelCostPer: number;
  panelCost: number;
  minimumPrice: number;
  minimumApplied: boolean;
  preMinimumTotal: number;
  perItemTotal: number;
  quantity: number;
  grandTotal: number;
  panelWidthIn: number;
  panelHeightIn: number;
}

export const DUAL_VIEW_MAX_PANEL_WIDTH = 52; // inches — always

export const DUAL_VIEW_CONSTRAINTS: Record<DualViewSide, DualViewConstraints> = {
  single: { maxWidth: 52, maxHeight: 100 },
  double: { maxWidth: 52, maxHeight: 96 },
};

export const DUAL_VIEW_PANEL_COST: Record<DualViewSide, number> = {
  single: 8,
  double: 10,
};

export const DUAL_VIEW_MINIMUM: Record<DualViewSide, number> = {
  single: 30,
  double: 40,
};

export const DUAL_VIEW_CONTOUR_MULTIPLIER = 1.10;

function toInches(value: number, unit: DualViewUnit): number {
  return unit === "feet" ? value * 12 : value;
}

export function getDualViewRate(sqFt: number, side: DualViewSide): number {
  if (side === "single") {
    if (sqFt < 10) return 4.90;
    if (sqFt < 50) return 4.40;
    if (sqFt < 150) return 4.10;
    return 3.90;
  }
  // double
  if (sqFt < 10) return 7.90;
  if (sqFt < 50) return 7.10;
  if (sqFt < 150) return 6.50;
  return 6.20;
}

export function getDualViewConstraints(side: DualViewSide): DualViewConstraints {
  return DUAL_VIEW_CONSTRAINTS[side];
}

/**
 * For double-sided, check if rotating (swapping width/height) would fit within constraints.
 * Returns true if the current orientation is valid, or if rotated orientation would be valid.
 */
export function canFitWithRotation(
  widthIn: number,
  heightIn: number,
  side: DualViewSide
): { fits: boolean; needsRotation: boolean } {
  const { maxWidth, maxHeight } = getDualViewConstraints(side);
  const fitsNormal = widthIn <= maxWidth && heightIn <= maxHeight;
  const fitsRotated = widthIn <= maxHeight && heightIn <= maxWidth;

  if (fitsNormal) return { fits: true, needsRotation: false };
  if (fitsRotated) return { fits: true, needsRotation: true };
  return { fits: false, needsRotation: false };
}

export function calculateDualViewPanels(widthIn: number): number {
  return Math.max(1, Math.ceil(widthIn / DUAL_VIEW_MAX_PANEL_WIDTH));
}

export function calculateDualViewPrice(input: DualViewPricingInput): DualViewPricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const baseRate = getDualViewRate(areaSqFt, input.side);
  const rawBase = areaSqFt * baseRate;

  const contourAdjustedBase = input.contourCut
    ? rawBase * DUAL_VIEW_CONTOUR_MULTIPLIER
    : rawBase;
  const contourCutCharge = contourAdjustedBase - rawBase;

  const panelCount = calculateDualViewPanels(widthIn);
  const panelCostPer = DUAL_VIEW_PANEL_COST[input.side];
  const panelCost = (panelCount - 1) * panelCostPer;

  const minimumPrice = DUAL_VIEW_MINIMUM[input.side];
  const preMin = contourAdjustedBase;
  const minimumApplied = preMin < minimumPrice;
  const afterMinimum = Math.max(preMin, minimumPrice);

  const perItemTotal = Math.round((afterMinimum + panelCost) * 100) / 100;

  const panelWidthIn = widthIn / panelCount;
  const panelHeightIn = heightIn;

  return {
    widthIn,
    heightIn,
    areaSqFt,
    baseRate,
    rawBase,
    contourCutCharge,
    contourAdjustedBase,
    panelCount,
    panelCostPer,
    panelCost,
    minimumPrice,
    minimumApplied,
    preMinimumTotal: preMin,
    perItemTotal,
    quantity,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    panelWidthIn,
    panelHeightIn,
  };
}
