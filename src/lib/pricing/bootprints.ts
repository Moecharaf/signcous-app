export const BOOTPRINTS_SUPPLIER_RATE = 12.5; // $ per sq ft (Signs365 baseline)
export const BOOTPRINTS_MARKUP_MULTIPLIER = 1.5;
export const BOOTPRINTS_RATE = BOOTPRINTS_SUPPLIER_RATE * BOOTPRINTS_MARKUP_MULTIPLIER;
export const BOOTPRINTS_MIN = 0;
export const BOOTPRINTS_CONTOUR_MULTIPLIER = 0.1; // +10%
export const BOOTPRINTS_RUSH_MULTIPLIER = 1.0; // +100%
export const BOOTPRINTS_PANEL_MAX_IN = 48; // max panel width/height in inches

export interface BootprintsPricingOptions {
  contourCut?: boolean;
  rush?: boolean;
}

export interface BootprintsPricingResult {
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

export interface BootprintsPanelInfo {
  panelsWide: number;
  panelsHigh: number;
  totalPanels: number;
}

/**
 * Calculates panel split info for production/preview purposes only.
 * Does NOT affect pricing.
 */
export function getBootprintsPanelInfo(widthIn: number, heightIn: number): BootprintsPanelInfo {
  const panelsWide = Math.ceil(widthIn / BOOTPRINTS_PANEL_MAX_IN);
  const panelsHigh = Math.ceil(heightIn / BOOTPRINTS_PANEL_MAX_IN);
  return {
    panelsWide,
    panelsHigh,
    totalPanels: panelsWide * panelsHigh,
  };
}

/**
 * Calculates pricing for Bootprints (Outdoor Heavy-Duty Floor Graphics).
 *
 * Billable dimensions are rounded UP to the nearest foot before area is computed.
 * Pricing: supplier $12.50 / sq ft with +50% markup (retail $18.75 / sq ft)
 * · contour cut +10% · rush +100%.
 */
export function calculateBootprintsPrice(
  widthIn: number,
  heightIn: number,
  options: BootprintsPricingOptions = {},
  quantity: number = 1
): BootprintsPricingResult {
  const safeWidth = Number.isFinite(widthIn) ? Math.max(0, widthIn) : 0;
  const safeHeight = Number.isFinite(heightIn) ? Math.max(0, heightIn) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  // Round each dimension UP to the nearest foot before computing area
  const widthFt = Math.ceil(safeWidth / 12);
  const heightFt = Math.ceil(safeHeight / 12);
  const sqFt = widthFt * heightFt;

  const base = sqFt * BOOTPRINTS_RATE;
  const contourCutCharge = options.contourCut ? base * BOOTPRINTS_CONTOUR_MULTIPLIER : 0;
  const rushCharge = options.rush ? base * BOOTPRINTS_RUSH_MULTIPLIER : 0;
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
