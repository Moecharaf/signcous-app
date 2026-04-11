export const LOW_TAC_WALL_RATE = 4.25; // $ per sq ft
export const LOW_TAC_WALL_MIN = 25;
export const LOW_TAC_WALL_CONTOUR_MULTIPLIER = 0.15; // +15%
export const LOW_TAC_WALL_RUSH_MULTIPLIER = 1.0; // +100%
export const LOW_TAC_WALL_PANEL_MAX_IN = 54; // max panel width/height in inches

export interface LowTacWallPricingOptions {
  contourCut?: boolean;
  rush?: boolean;
}

export interface LowTacWallPricingResult {
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

export interface LowTacWallPanelInfo {
  panelsWide: number;
  panelsHigh: number;
  totalPanels: number;
}

/**
 * Calculates panel split info for production/preview purposes only.
 * Does NOT affect pricing.
 */
export function getLowTacWallPanelInfo(widthIn: number, heightIn: number): LowTacWallPanelInfo {
  const panelsWide = Math.ceil(widthIn / LOW_TAC_WALL_PANEL_MAX_IN);
  const panelsHigh = Math.ceil(heightIn / LOW_TAC_WALL_PANEL_MAX_IN);
  return {
    panelsWide,
    panelsHigh,
    totalPanels: panelsWide * panelsHigh,
  };
}

/**
 * Calculates pricing for Removable Wall Decals (Low-Tac Wall Graphics).
 *
 * Billable dimensions are rounded UP to the nearest foot before area is computed.
 * Pricing: $4.25 / sq ft · contour cut +15% · rush +100% · $25 minimum per unit.
 */
export function calculateLowTacWallPrice(
  widthIn: number,
  heightIn: number,
  options: LowTacWallPricingOptions = {},
  quantity: number = 1
): LowTacWallPricingResult {
  const safeWidth = Number.isFinite(widthIn) ? Math.max(0, widthIn) : 0;
  const safeHeight = Number.isFinite(heightIn) ? Math.max(0, heightIn) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  // Round each dimension UP to the nearest foot before computing area
  const widthFt = Math.ceil(safeWidth / 12);
  const heightFt = Math.ceil(safeHeight / 12);
  const sqFt = widthFt * heightFt;

  const base = sqFt * LOW_TAC_WALL_RATE;
  const contourCutCharge = options.contourCut ? base * LOW_TAC_WALL_CONTOUR_MULTIPLIER : 0;
  const rushCharge = options.rush ? base * LOW_TAC_WALL_RUSH_MULTIPLIER : 0;
  const preMinimumTotal = base + contourCutCharge + rushCharge;
  const unitPrice = Math.max(preMinimumTotal, LOW_TAC_WALL_MIN);
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
