// ─────────────────────────────────────────────────────────────
//  Acrylic Signs  –  Pricing utility
//  All prices in USD, dimensions in inches.
// ─────────────────────────────────────────────────────────────

export type AcrylicThickness = "1/8" | "3/16" | "1/4";
export type AcrylicMounting = "none" | "silver-standoff" | "black-standoff";
export type AcrylicRoundedCorner = "none" | "1/4" | "1/2" | "3/4" | "1";

export interface AcrylicPricingInput {
  width: number;
  height: number;
  quantity: number;
  thickness: AcrylicThickness;
  mounting: AcrylicMounting;
  roundedCorners: AcrylicRoundedCorner;
  contourCut: boolean;
  rush: boolean;
}

export interface AcrylicPricingResult {
  area: number;
  rawBase: number;
  minAdjustedBase: number;
  thicknessMultiplier: number;
  thicknessCharge: number;
  thicknessAdjustedBase: number;
  contourCutCharge: number;
  roundedCornersCharge: number;
  standoffCharge: number;
  preRushSubtotal: number;
  rushCharge: number;
  perItemTotal: number;
  quantity: number;
  grandTotal: number;
}

// ─── Constants ────────────────────────────────────────────────

export const ACRYLIC_BASE_RATE = 0.16;    // $ per sq-in
export const ACRYLIC_MINIMUM_PRICE = 22;  // $ per item

export const ACRYLIC_THICKNESS_OPTIONS: { label: string; value: AcrylicThickness; modifier: number }[] = [
  { label: '1/8"',  value: "1/8",  modifier: 0 },
  { label: '3/16"', value: "3/16", modifier: 0.15 },
  { label: '1/4"',  value: "1/4",  modifier: 0.30 },
];

export const ACRYLIC_MOUNTING_OPTIONS: { label: string; value: AcrylicMounting; price: number; note?: string }[] = [
  { label: "None",                value: "none",           price: 0 },
  { label: "Silver Standoff Kit", value: "silver-standoff", price: 18, note: "Floating premium look" },
  { label: "Black Standoff Kit",  value: "black-standoff",  price: 24, note: "Floating premium look" },
];

export const ACRYLIC_CORNER_OPTIONS: { label: string; value: AcrylicRoundedCorner; price: number }[] = [
  { label: 'None',  value: "none",  price: 0  },
  { label: '1/4"',  value: "1/4",  price: 8  },
  { label: '1/2"',  value: "1/2",  price: 10 },
  { label: '3/4"',  value: "3/4",  price: 12 },
  { label: '1"',    value: "1",    price: 15 },
];

export const ACRYLIC_MAX_WIDTH  = 96;   // inches
export const ACRYLIC_MAX_HEIGHT = 48;   // inches

// ─── Calculation ──────────────────────────────────────────────

export function calculateAcrylicPricing(input: AcrylicPricingInput): AcrylicPricingResult {
  const safeQty = Math.max(1, Math.floor(input.quantity));

  // 1. Area
  const area = input.width * input.height;

  // 2. Raw base
  const rawBase = area * ACRYLIC_BASE_RATE;

  // 3. Minimum price floor
  const minAdjustedBase = Math.max(rawBase, ACRYLIC_MINIMUM_PRICE);

  // 4. Thickness modifier
  const thicknessModifier =
    ACRYLIC_THICKNESS_OPTIONS.find((t) => t.value === input.thickness)?.modifier ?? 0;
  const thicknessMultiplier = 1 + thicknessModifier;
  const thicknessAdjustedBase = minAdjustedBase * thicknessMultiplier;
  const thicknessCharge = thicknessAdjustedBase - minAdjustedBase;

  // 5. Contour cut (+20% of thickness-adjusted base)
  const contourCutCharge = input.contourCut ? thicknessAdjustedBase * 0.2 : 0;

  // 6. Fixed add-ons
  const roundedCornersCharge =
    ACRYLIC_CORNER_OPTIONS.find((c) => c.value === input.roundedCorners)?.price ?? 0;
  const standoffCharge =
    ACRYLIC_MOUNTING_OPTIONS.find((m) => m.value === input.mounting)?.price ?? 0;

  // 7. Pre-rush subtotal
  const preRushSubtotal = thicknessAdjustedBase + contourCutCharge + roundedCornersCharge + standoffCharge;

  // 8. Rush (+25%)
  const rushCharge = input.rush ? preRushSubtotal * 0.25 : 0;

  // 9. Per-item total
  const perItemTotal = Math.round((preRushSubtotal + rushCharge) * 100) / 100;

  // 10. Grand total
  const grandTotal = Math.round(perItemTotal * safeQty * 100) / 100;

  return {
    area,
    rawBase,
    minAdjustedBase,
    thicknessMultiplier,
    thicknessCharge,
    thicknessAdjustedBase,
    contourCutCharge,
    roundedCornersCharge,
    standoffCharge,
    preRushSubtotal,
    rushCharge,
    perItemTotal,
    quantity: safeQty,
    grandTotal,
  };
}
