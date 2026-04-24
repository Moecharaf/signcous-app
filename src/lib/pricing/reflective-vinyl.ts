export const REFLECTIVE_VINYL_RATE = 9.95; // $ per sq ft
export const REFLECTIVE_VINYL_MIN = 30;
export const REFLECTIVE_VINYL_CONTOUR_MULTIPLIER = 0.15; // +15%
export const REFLECTIVE_VINYL_RUSH_MULTIPLIER = 1.0; // +100%
export const REFLECTIVE_VINYL_PANEL_MAX_IN = 48; // max panel width/height in inches

export interface ReflectiveVinylPricingOptions {
  contourCut?: boolean;
  rush?: boolean;
}

export interface ReflectiveVinylPricingResult {
  widthFt: number;
  heightFt: number;
  sqFt: number;
  base: number;
  contourCutCharge: number;
  rushCharge: number;
  preMinimumTotal: number;
  minimumApplied: boolean;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ReflectiveVinylPanelInfo {
  panelsWide: number;
  panelsHigh: number;
  totalPanels: number;
}

export function getReflectiveVinylPanelInfo(widthIn: number, heightIn: number): ReflectiveVinylPanelInfo {
  const panelsWide = Math.ceil(widthIn / REFLECTIVE_VINYL_PANEL_MAX_IN);
  const panelsHigh = Math.ceil(heightIn / REFLECTIVE_VINYL_PANEL_MAX_IN);
  return { panelsWide, panelsHigh, totalPanels: panelsWide * panelsHigh };
}

export function calculateReflectiveVinylPrice(
  widthIn: number,
  heightIn: number,
  options: ReflectiveVinylPricingOptions = {},
  quantity: number = 1
): ReflectiveVinylPricingResult {
  const safeWidth = Number.isFinite(widthIn) ? Math.max(0, widthIn) : 0;
  const safeHeight = Number.isFinite(heightIn) ? Math.max(0, heightIn) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  const widthFt = Math.ceil(safeWidth / 12);
  const heightFt = Math.ceil(safeHeight / 12);
  const sqFt = widthFt * heightFt;

  const base = sqFt * REFLECTIVE_VINYL_RATE;
  const contourCutCharge = options.contourCut ? base * REFLECTIVE_VINYL_CONTOUR_MULTIPLIER : 0;
  const rushCharge = options.rush ? base * REFLECTIVE_VINYL_RUSH_MULTIPLIER : 0;
  const preMinimumTotal = base + contourCutCharge + rushCharge;
  const unitPrice = Math.max(preMinimumTotal, REFLECTIVE_VINYL_MIN);
  const minimumApplied = unitPrice > preMinimumTotal;

  return {
    widthFt,
    heightFt,
    sqFt,
    base,
    contourCutCharge,
    rushCharge,
    preMinimumTotal,
    minimumApplied,
    unitPrice: Math.round(unitPrice * 100) / 100,
    quantity: safeQuantity,
    totalPrice: Math.round(unitPrice * safeQuantity * 100) / 100,
  };
}
