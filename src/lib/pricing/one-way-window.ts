import { calculateProductionFootprint, calculateRetailPrice } from "../pricing";

export type OneWayWindowUnit = "inches" | "feet";
export type OneWayWindowMaterial = "50/50" | "70/30";

export interface OneWayWindowPricingInput {
  width: number;
  height: number;
  unit: OneWayWindowUnit;
  quantity: number;
  material: OneWayWindowMaterial;
  laminate: boolean;
  contourCut: boolean;
  rush: boolean;
}

export interface OneWayWindowPricingResult {
  enteredWidthIn: number;
  enteredHeightIn: number;
  widthIn: number;
  heightIn: number;
  billedWidthFt: number;
  billedHeightFt: number;
  billedSqFt: number;
  areaSqFt: number;
  supplierRate: number;
  baseCost: number;
  laminateCost: number;
  rushCharge: number;
  markupMultiplier: number;
  retailBeforeMinimum: number;
  baseRate: number;
  rawBase: number;
  laminateCharge: number;
  laminateAdjustedBase: number;
  contourCutCharge: number;
  contourAdjustedBase: number;
  panelCount: number;
  panelCost: number;
  preMinimumTotal: number;
  minimumApplied: boolean;
  perItemTotal: number;
  quantity: number;
  grandTotal: number;
  panelWidthIn: number;
  panelHeightIn: number;
}

export const ONE_WAY_MINIMUM_PRICE = 25;
export const ONE_WAY_MAX_PANEL_WIDTH = 50; // inches — STRICT
export const ONE_WAY_PANEL_EXTRA_COST = 7; // per extra panel
export const ONE_WAY_SUPPLIER_RATE = 2.75; // per sq ft
export const ONE_WAY_SUPPLIER_LAMINATE_RATE = 1.24; // per sq ft
export const ONE_WAY_MARKUP_MULTIPLIER = 1.5;
export const ONE_WAY_RUSH_MULTIPLIER = 2.0; // 100% additional
export const ONE_WAY_CONTOUR_MULTIPLIER = 1.10;

export const ONE_WAY_MATERIAL_OPTIONS: { value: OneWayWindowMaterial; label: string; note: string }[] = [
  {
    value: "50/50",
    label: "50/50 Perforated",
    note: "50% print, 50% holes. Maximum see-through from outside for maximum transparency.",
  },
  {
    value: "70/30",
    label: "70/30 Perforated",
    note: "70% print, 30% holes. Better print quality and opacity with moderate see-through.",
  },
];

function toInches(value: number, unit: OneWayWindowUnit): number {
  return unit === "feet" ? value * 12 : value;
}

export function calculateOneWayPanels(widthIn: number): number {
  return Math.max(1, Math.ceil(widthIn / ONE_WAY_MAX_PANEL_WIDTH));
}

export function calculateOneWayWindowPrice(input: OneWayWindowPricingInput): OneWayWindowPricingResult {
  const footprint = calculateProductionFootprint(input.width, input.height, input.unit, 0);
  const widthIn = footprint.billedWidthIn;
  const heightIn = footprint.billedHeightIn;
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const supplierRate = ONE_WAY_SUPPLIER_RATE;
  const baseCost = footprint.billedSqft * supplierRate;

  // Laminate supplier cost per billed sq ft
  const laminateCost = input.laminate ? footprint.billedSqft * ONE_WAY_SUPPLIER_LAMINATE_RATE : 0;
  const laminateAdjustedBase = baseCost + laminateCost;

  // Contour +10%
  const contourAdjustedBase = input.contourCut
    ? laminateAdjustedBase * ONE_WAY_CONTOUR_MULTIPLIER
    : laminateAdjustedBase;
  const contourCutCharge = contourAdjustedBase - laminateAdjustedBase;

  // Rush = 100% additional on production subtotal
  const rushCharge = input.rush ? contourAdjustedBase * (ONE_WAY_RUSH_MULTIPLIER - 1) : 0;
  const productionSubtotal = contourAdjustedBase + rushCharge;

  // Panel splitting — always based on 50in max width
  const panelCount = calculateOneWayPanels(widthIn);
  const panelCost = (panelCount - 1) * ONE_WAY_PANEL_EXTRA_COST;
  const preMinimumTotal = productionSubtotal + panelCost;
  const retailBeforeMinimum = calculateRetailPrice(preMinimumTotal, ONE_WAY_MARKUP_MULTIPLIER);

  // Minimum retail floor
  const minimumApplied = retailBeforeMinimum < ONE_WAY_MINIMUM_PRICE;
  const perItemTotal = Math.max(retailBeforeMinimum, ONE_WAY_MINIMUM_PRICE);

  const panelWidthIn = widthIn / panelCount;
  const panelHeightIn = heightIn;

  return {
    enteredWidthIn: Math.max(0, toInches(input.width, input.unit)),
    enteredHeightIn: Math.max(0, toInches(input.height, input.unit)),
    widthIn,
    heightIn,
    billedWidthFt: footprint.billedWidthFt,
    billedHeightFt: footprint.billedHeightFt,
    billedSqFt: footprint.billedSqft,
    areaSqFt: footprint.actualSqft,
    supplierRate,
    baseCost,
    laminateCost,
    rushCharge,
    markupMultiplier: ONE_WAY_MARKUP_MULTIPLIER,
    retailBeforeMinimum,
    baseRate: supplierRate,
    rawBase: baseCost,
    laminateCharge: laminateCost,
    laminateAdjustedBase,
    contourCutCharge,
    contourAdjustedBase,
    panelCount,
    panelCost,
    preMinimumTotal,
    minimumApplied,
    perItemTotal,
    quantity,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    panelWidthIn,
    panelHeightIn,
  };
}
