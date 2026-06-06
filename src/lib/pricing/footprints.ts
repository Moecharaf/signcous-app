export const FOOTPRINTS_SUPPLIER_RATE = 2.5; // $ per sq ft (Signs365 baseline)
export const FOOTPRINTS_MARKUP_MULTIPLIER = 1.5;
export const FOOTPRINTS_RATE = FOOTPRINTS_SUPPLIER_RATE * FOOTPRINTS_MARKUP_MULTIPLIER;
export const FOOTPRINTS_MIN = 0;
export const FOOTPRINTS_CONTOUR_MULTIPLIER = 0.1; // +10%
export const FOOTPRINTS_RUSH_MULTIPLIER = 1.0; // +100%
export const FOOTPRINTS_PANEL_MAX_IN = 48; // max panel width/height in inches

export interface FootprintsPricingOptions {
  contourCut?: boolean;
  rush?: boolean;
}

export interface FootprintsPricingResult {
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

export interface FootprintsPanelInfo {
  panelsWide: number;
  panelsHigh: number;
  totalPanels: number;
}

/**
 * Calculates panel split info for production/preview purposes only.
 * This does NOT affect pricing.
 */
export function getFootprintsPanelInfo(widthIn: number, heightIn: number): FootprintsPanelInfo {
  const panelsWide = Math.ceil(widthIn / FOOTPRINTS_PANEL_MAX_IN);
  const panelsHigh = Math.ceil(heightIn / FOOTPRINTS_PANEL_MAX_IN);
  return {
    panelsWide,
    panelsHigh,
    totalPanels: panelsWide * panelsHigh,
  };
}

/**
 * Calculates pricing for Footprints (Floor Graphics).
 *
 * Billable dimensions are rounded UP to the nearest foot before area is computed.
 * Pricing: supplier $2.50 / sq ft with +50% markup (retail $3.75 / sq ft)
 * · contour cut +10% · rush +100%.
 */
export function calculateFootprintsPrice(
  widthIn: number,
  heightIn: number,
  options: FootprintsPricingOptions = {},
  quantity: number = 1
): FootprintsPricingResult {
  const safeWidth = Number.isFinite(widthIn) ? Math.max(0, widthIn) : 0;
  const safeHeight = Number.isFinite(heightIn) ? Math.max(0, heightIn) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  // Round each dimension UP to the nearest foot before computing area
  const widthFt = Math.ceil(safeWidth / 12);
  const heightFt = Math.ceil(safeHeight / 12);
  const sqFt = widthFt * heightFt;

  const base = sqFt * FOOTPRINTS_RATE;
  const contourCutCharge = options.contourCut ? base * FOOTPRINTS_CONTOUR_MULTIPLIER : 0;
  const rushCharge = options.rush ? base * FOOTPRINTS_RUSH_MULTIPLIER : 0;
  const preMinimumTotal = base + contourCutCharge + rushCharge;
  const unitPrice = preMinimumTotal;
  const minimumApplied = false;

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
