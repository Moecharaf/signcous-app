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
}

export interface OneWayWindowPricingResult {
  widthIn: number;
  heightIn: number;
  areaSqFt: number;
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
export const ONE_WAY_LAMINATE_RATE = 3.50; // per sq ft
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

export function getDynamicRate(sqFt: number): number {
  if (sqFt < 10) return 6.25;
  if (sqFt < 50) return 5.75;
  if (sqFt < 150) return 5.45;
  return 5.25;
}

export function calculateOneWayPanels(widthIn: number): number {
  return Math.max(1, Math.ceil(widthIn / ONE_WAY_MAX_PANEL_WIDTH));
}

export function calculateOneWayWindowPrice(input: OneWayWindowPricingInput): OneWayWindowPricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const baseRate = getDynamicRate(areaSqFt);
  const rawBase = areaSqFt * baseRate;

  // Laminate adds $3.50/sq ft
  const laminateCharge = input.laminate ? areaSqFt * ONE_WAY_LAMINATE_RATE : 0;
  const laminateAdjustedBase = rawBase + laminateCharge;

  // Contour +10%
  const contourAdjustedBase = input.contourCut
    ? laminateAdjustedBase * ONE_WAY_CONTOUR_MULTIPLIER
    : laminateAdjustedBase;
  const contourCutCharge = contourAdjustedBase - laminateAdjustedBase;

  // Panel splitting — always based on 50in max width
  const panelCount = calculateOneWayPanels(widthIn);
  const panelCost = (panelCount - 1) * ONE_WAY_PANEL_EXTRA_COST;

  // Minimum — panel cost added AFTER
  const preMin = contourAdjustedBase;
  const minimumApplied = preMin < ONE_WAY_MINIMUM_PRICE;
  const afterMinimum = Math.max(preMin, ONE_WAY_MINIMUM_PRICE);

  const perItemTotal = Math.round((afterMinimum + panelCost) * 100) / 100;

  const panelWidthIn = widthIn / panelCount;
  const panelHeightIn = heightIn;

  return {
    widthIn,
    heightIn,
    areaSqFt,
    baseRate,
    rawBase,
    laminateCharge,
    laminateAdjustedBase,
    contourCutCharge,
    contourAdjustedBase,
    panelCount,
    panelCost,
    preMinimumTotal: preMin,
    minimumApplied,
    perItemTotal,
    quantity,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    panelWidthIn,
    panelHeightIn,
  };
}
