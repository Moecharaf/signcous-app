export const DRY_ERASE_RATE = 4.35; // $ per sq ft
export const DRY_ERASE_MIN = 30;
export const DRY_ERASE_CONTOUR_MULTIPLIER = 0.15; // +15%
export const DRY_ERASE_RUSH_MULTIPLIER = 1.0; // +100%
export const DRY_ERASE_PANEL_MAX_IN = 48; // max panel width/height in inches

export interface DryErasePricingOptions {
  contourCut?: boolean;
  rush?: boolean;
}

export interface DryErasePricingResult {
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

export interface DryErasePanelInfo {
  panelsWide: number;
  panelsHigh: number;
  totalPanels: number;
}

/**
 * Calculates panel split info for production/preview purposes only.
 * Does NOT affect pricing.
 */
export function getDryErasePanelInfo(widthIn: number, heightIn: number): DryErasePanelInfo {
  const panelsWide = Math.ceil(widthIn / DRY_ERASE_PANEL_MAX_IN);
  const panelsHigh = Math.ceil(heightIn / DRY_ERASE_PANEL_MAX_IN);
  return {
    panelsWide,
    panelsHigh,
    totalPanels: panelsWide * panelsHigh,
  };
}

/**
 * Calculates pricing for Dry Erase Wall Graphics.
 *
 * Billable dimensions are rounded UP to the nearest foot before area is computed.
 * Pricing: $4.35 / sq ft · contour cut +15% · rush +100% · $30 minimum per unit.
 */
export function calculateDryErasePrice(
  widthIn: number,
  heightIn: number,
  options: DryErasePricingOptions = {},
  quantity: number = 1
): DryErasePricingResult {
  const safeWidth = Number.isFinite(widthIn) ? Math.max(0, widthIn) : 0;
  const safeHeight = Number.isFinite(heightIn) ? Math.max(0, heightIn) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  // Round each dimension UP to the nearest foot before computing area
  const widthFt = Math.ceil(safeWidth / 12);
  const heightFt = Math.ceil(safeHeight / 12);
  const sqFt = widthFt * heightFt;

  const base = sqFt * DRY_ERASE_RATE;
  const contourCutCharge = options.contourCut ? base * DRY_ERASE_CONTOUR_MULTIPLIER : 0;
  const rushCharge = options.rush ? base * DRY_ERASE_RUSH_MULTIPLIER : 0;
  const preMinimumTotal = base + contourCutCharge + rushCharge;
  const unitPrice = Math.max(preMinimumTotal, DRY_ERASE_MIN);
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
