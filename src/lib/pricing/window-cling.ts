export const WINDOW_CLING_RATE = 0.024;
export const WINDOW_CLING_MIN = 4.99;
export const WINDOW_CLING_MAX_WIDTH_IN = 52;
export const WINDOW_CLING_MAX_HEIGHT_IN = 240;

export type WindowClingApplication = "inside" | "outside";
export type WindowClingViewable = "inside" | "outside";

export interface WindowClingOptions {
  contourCut?: boolean;
}

export interface WindowClingPricingResult {
  sqIn: number;
  rawBase: number;
  contourCutCharge: number;
  preMinimumTotal: number;
  minimumApplied: boolean;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export function calculateWindowClingPrice(
  widthIn: number,
  heightIn: number,
  options: WindowClingOptions = {},
  quantity: number = 1
): WindowClingPricingResult {
  const safeWidth = Number.isFinite(widthIn) ? Math.max(0, widthIn) : 0;
  const safeHeight = Number.isFinite(heightIn) ? Math.max(0, heightIn) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  const sqIn = safeWidth * safeHeight;
  const rawBase = sqIn * WINDOW_CLING_RATE;
  const contourAdjusted = options.contourCut ? rawBase * 1.15 : rawBase;
  const contourCutCharge = contourAdjusted - rawBase;

  const unitPrice = Math.max(contourAdjusted, WINDOW_CLING_MIN);
  const minimumApplied = unitPrice > contourAdjusted;
  const totalPrice = unitPrice * safeQuantity;

  return {
    sqIn,
    rawBase,
    contourCutCharge,
    preMinimumTotal: contourAdjusted,
    minimumApplied,
    unitPrice: Math.round(unitPrice * 100) / 100,
    quantity: safeQuantity,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}
