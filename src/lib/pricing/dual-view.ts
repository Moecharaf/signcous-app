import { calculateProductionFootprint, calculateRetailPrice } from "../pricing";

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
  enteredWidthIn: number;
  enteredHeightIn: number;
  actualSqft: number;
  billedWidthIn: number;
  billedHeightIn: number;
  billedWidthFt: number;
  billedHeightFt: number;
  billedSqft: number;
  supplierRate: number;
  productionCost: number;
  retailPrice: number;
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
  totalPrice: number;
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

export const DUAL_VIEW_SINGLE_SUPPLIER_RATE = 2.79;
export const DUAL_VIEW_DOUBLE_SUPPLIER_RATE = 4.99;

export const DUAL_VIEW_CONTOUR_MULTIPLIER = 1.10;

function toInches(value: number, unit: DualViewUnit): number {
  return unit === "feet" ? value * 12 : value;
}

export function getDualViewRate(side: DualViewSide): number {
  return side === "single" ? DUAL_VIEW_SINGLE_SUPPLIER_RATE : DUAL_VIEW_DOUBLE_SUPPLIER_RATE;
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
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const footprint = calculateProductionFootprint(input.width, input.height, input.unit, 1);
  const supplierRate = getDualViewRate(input.side);
  const productionCost = footprint.billedSqft * supplierRate;

  const contourAdjustedBase = input.contourCut
    ? productionCost * DUAL_VIEW_CONTOUR_MULTIPLIER
    : productionCost;
  const contourCutCharge = contourAdjustedBase - productionCost;

  const panelCount = calculateDualViewPanels(footprint.billedWidthIn);
  const panelCostPer = DUAL_VIEW_PANEL_COST[input.side];
  const panelCost = (panelCount - 1) * panelCostPer;

  const minimumPrice = DUAL_VIEW_MINIMUM[input.side];
  const preMinimumTotal = contourAdjustedBase + panelCost;
  const retailBeforeMinimum = calculateRetailPrice(preMinimumTotal);
  const minimumApplied = retailBeforeMinimum < minimumPrice;
  const perItemTotal = Math.max(retailBeforeMinimum, minimumPrice);

  const panelWidthIn = footprint.billedWidthIn / panelCount;
  const panelHeightIn = footprint.billedHeightIn;

  return {
    enteredWidthIn: footprint.enteredWidthIn,
    enteredHeightIn: footprint.enteredHeightIn,
    actualSqft: footprint.actualSqft,
    billedWidthIn: footprint.billedWidthIn,
    billedHeightIn: footprint.billedHeightIn,
    billedWidthFt: footprint.billedWidthFt,
    billedHeightFt: footprint.billedHeightFt,
    billedSqft: footprint.billedSqft,
    supplierRate,
    productionCost,
    retailPrice: perItemTotal,
    widthIn: footprint.billedWidthIn,
    heightIn: footprint.billedHeightIn,
    areaSqFt: footprint.actualSqft,
    baseRate: supplierRate,
    rawBase: productionCost,
    contourCutCharge,
    contourAdjustedBase,
    panelCount,
    panelCostPer,
    panelCost,
    minimumPrice,
    minimumApplied,
    preMinimumTotal,
    perItemTotal,
    quantity,
    totalPrice: perItemTotal,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    panelWidthIn,
    panelHeightIn,
  };
}
