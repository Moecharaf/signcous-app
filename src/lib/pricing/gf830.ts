export type GF830Unit = "inches" | "feet";
export type GF830Laminate = "gloss" | "matte" | "none";
export type GF830SplitDirection = "auto" | "vertical" | "horizontal";

export interface GF830PricingInput {
  width: number;
  height: number;
  unit: GF830Unit;
  quantity: number;
  contourCut: boolean;
  rush: boolean;
  splitDirection: GF830SplitDirection;
}

export interface GF830PricingResult {
  widthIn: number;
  heightIn: number;
  areaSqFt: number;
  baseRate: number;
  rawBase: number;
  contourCutCharge: number;
  contourAdjustedBase: number;
  rushCharge: number;
  preMinimumTotal: number;
  minimumApplied: boolean;
  panelCount: number;
  panelCost: number;
  perItemTotal: number;
  quantity: number;
  grandTotal: number;
  panelWidthIn: number;
  panelHeightIn: number;
}

export interface GF830PanelConfig {
  maxPanelWidthInches: number;
  maxPanelHeightInches: number;
}

export const GF830_MINIMUM_PRICE = 30;
export const GF830_PRODUCT_CONFIG = {
  gf830AutoMark: {
    maxPanelWidthInches: 48,
    maxPanelHeightInches: 48,
  },
} as const;
export const GF830_AUTOMARK_PANEL_CONFIG: GF830PanelConfig = GF830_PRODUCT_CONFIG.gf830AutoMark;
export const GF830_MAX_PANEL_WIDTH = GF830_AUTOMARK_PANEL_CONFIG.maxPanelWidthInches; // inches
export const GF830_MAX_PANEL_HEIGHT = GF830_AUTOMARK_PANEL_CONFIG.maxPanelHeightInches; // inches
export const GF830_SUPPLIER_RATE = 3.99; // cost per sq ft
export const GF830_MARKUP_MULTIPLIER = 1.5; // +50% markup
export const GF830_CONTOUR_MULTIPLIER = 1.10;
export const GF830_RUSH_MULTIPLIER = 2;

export const GF830_LAMINATE_OPTIONS: { value: GF830Laminate; label: string; note: string }[] = [
  { value: "gloss", label: "Gloss Laminate", note: "Shiny finish with more vibrant colors." },
  { value: "matte", label: "Matte Laminate", note: "Low reflection for premium applications." },
  { value: "none", label: "No Laminate", note: "For short-term uses where lamination is not required." },
];

function toInches(value: number, unit: GF830Unit): number {
  return unit === "feet" ? value * 12 : value;
}

export function getDynamicRate(sqFt: number): number {
  void sqFt;
  return GF830_SUPPLIER_RATE * GF830_MARKUP_MULTIPLIER;
}

export function calculateGF830Panels(
  widthIn: number,
  heightIn: number,
  splitDirection: GF830SplitDirection,
  panelConfig: GF830PanelConfig = GF830_AUTOMARK_PANEL_CONFIG
): number {
  const maxPanelWidth = Math.max(1, panelConfig.maxPanelWidthInches);
  const maxPanelHeight = Math.max(1, panelConfig.maxPanelHeightInches);

  if (splitDirection === "vertical") {
    return Math.max(1, Math.ceil(widthIn / maxPanelWidth));
  }
  if (splitDirection === "horizontal") {
    return Math.max(1, Math.ceil(heightIn / maxPanelHeight));
  }

  // Auto: honor product-specific max panel constraints on both axes.
  const widthPanels = Math.max(1, Math.ceil(widthIn / maxPanelWidth));
  const heightPanels = Math.max(1, Math.ceil(heightIn / maxPanelHeight));
  return Math.max(widthPanels, heightPanels);
}

export function calculateGF830Price(input: GF830PricingInput): GF830PricingResult {
  const widthIn = Math.max(0, toInches(input.width, input.unit));
  const heightIn = Math.max(0, toInches(input.height, input.unit));
  const quantity = Math.max(1, Math.floor(input.quantity || 1));

  const areaSqFt = (widthIn * heightIn) / 144;
  const baseRate = getDynamicRate(areaSqFt);
  const rawBase = areaSqFt * baseRate;

  const contourAdjustedBase = input.contourCut ? rawBase * GF830_CONTOUR_MULTIPLIER : rawBase;
  const contourCutCharge = contourAdjustedBase - rawBase;

  const rushAdjustedBase = input.rush ? contourAdjustedBase * GF830_RUSH_MULTIPLIER : contourAdjustedBase;
  const rushCharge = rushAdjustedBase - contourAdjustedBase;

  // Step 5: Minimum (supplier minimum with Signcous +50% markup)
  const preMin = rushAdjustedBase;
  const minimumWithMarkup = GF830_MINIMUM_PRICE * GF830_MARKUP_MULTIPLIER;
  const minimumApplied = preMin < minimumWithMarkup;
  const afterMinimum = Math.max(preMin, minimumWithMarkup);

  // Step 6: Panel splitting for artwork guidance only (no panel surcharge)
  const panelCount = calculateGF830Panels(widthIn, heightIn, input.splitDirection, GF830_AUTOMARK_PANEL_CONFIG);
  const panelCost = 0;

  const perItemTotal = Math.round((afterMinimum + panelCost) * 100) / 100;

  const panelWidthIn = input.splitDirection === "horizontal" ? widthIn : widthIn / panelCount;
  const panelHeightIn = input.splitDirection === "vertical" ? heightIn : heightIn / panelCount;

  return {
    widthIn,
    heightIn,
    areaSqFt,
    baseRate,
    rawBase,
    contourCutCharge,
    contourAdjustedBase,
    rushCharge,
    preMinimumTotal: preMin,
    minimumApplied,
    panelCount,
    panelCost,
    perItemTotal,
    quantity,
    grandTotal: Math.round(perItemTotal * quantity * 100) / 100,
    panelWidthIn,
    panelHeightIn,
  };
}
