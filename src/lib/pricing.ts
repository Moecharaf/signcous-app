// Pricing configuration for Signcous products

export const BANNER_MARKUP = 1.5; // 50% over cost

export type MaterialName = "13oz Vinyl" | "15oz Vinyl" | "18oz Vinyl" | "Mesh Banner" | "Fabric Banner";
export type LegacyMaterialName = "standard" | "premium" | "mesh" | "fabric";
export type Material = MaterialName | LegacyMaterialName;
export type GrommetPlacement =
  | "all-sides"
  | "top-left-right"
  | "top-left-bottom"
  | "top-right-bottom"
  | "left-right-bottom"
  | "top-left"
  | "top-right"
  | "top-bottom"
  | "left-right"
  | "left-bottom"
  | "right-bottom"
  | "top-only"
  | "left-only"
  | "right-only"
  | "bottom-only";
export type EdgeFinish = "none" | "welding" | "webbing" | "rope";

export interface PricingConfig {
  // Square foot rate (USD) per material
  materialRates: Record<MaterialName, number>;
  // Add-on pricing rules
  addOns: {
    grommetsPerPlacement: number; // per grommet placement
    grommetSpacingFt: number;      // every N feet around perimeter
    minGrommets: number;           // minimum grommets per banner
    polePocketsPerLinearFt: number; // per linear foot (top + bottom)
    polePocketsSetupFee: number;    // flat setup fee
    windSlitsPerSqFt: number;       // per sq ft
    ropePerLinearFt: number;        // per linear foot of perimeter
    hemmingPerLinearFt: number;     // per linear foot of perimeter
    hemmingIncluded: boolean;       // if true, hemming adds no cost
    doubleSided: number;    // multiplier over base
  };
  // Rush production surcharge (multiplier)
  rushMultiplier: number;
  // Minimum price floor
  minimumPrice: number;
}

export const PRICING_CONFIG: PricingConfig = {
  materialRates: {
    "13oz Vinyl": 1.25 * BANNER_MARKUP,   // USD per sq ft (qty 1-999 cost)
    "15oz Vinyl": 1.75 * BANNER_MARKUP,
    "18oz Vinyl": 2.25 * BANNER_MARKUP,
    "Mesh Banner": 1.05 * BANNER_MARKUP,
    "Fabric Banner": 1.35 * BANNER_MARKUP,
  },
  addOns: {
    grommetsPerPlacement: 0,
    grommetSpacingFt: 2,
    minGrommets: 4,
    polePocketsPerLinearFt: 1.00 * BANNER_MARKUP,
    polePocketsSetupFee: 10.00 * BANNER_MARKUP,
    windSlitsPerSqFt: 0.50 * BANNER_MARKUP,
    ropePerLinearFt: 1.00 * BANNER_MARKUP,
    hemmingPerLinearFt: 0.5,
    hemmingIncluded: false,
    doubleSided: 1.6,
  },
  rushMultiplier: 2.0, // 100% additional
  minimumPrice: 15.00,
};

export interface BannerPricingInput {
  widthIn: number;       // width in inches
  heightIn: number;      // height in inches
  quantity: number;
  material: Material;
  doubleSided: boolean;
  grommets: boolean;
  grommetPlacement: GrommetPlacement;
  grommetSpacingIn: number;
  edgeFinish: EdgeFinish;
  polePockets: boolean;
  windSlits: boolean;
  hemming: boolean;
  rush: boolean;
}

export interface BannerPricingResult {
  sqFt: number;
  basePricePerUnit: number;
  grommetCostPerUnit: number;
  edgeFinishCostPerUnit: number;
  polePocketCostPerUnit: number;
  windSlitsCostPerUnit: number;
  hemmingCostPerUnit: number;
  addOnCostPerUnit: number;
  rushSurchargePerUnit: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SimpleSqFtPricingResult {
  sqFt: number;
  unitPrice: number;
  totalPrice: number;
  sheetsRequired: number;
}

export interface CanvasPricingResult extends SimpleSqFtPricingResult {
  ratePerSqFt: number;
  baseTotalPrice: number;
  minimumApplied: boolean;
}

export interface MeshPricingResult {
  sqFt: number;
  ratePerSqFt: number;
  basePricePerUnit: number;
  grommetCostPerUnit: number;
  polePocketCostPerUnit: number;
  edgeFinishCostPerUnit: number;
  rushSurchargePerUnit: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PosterPricingResult {
  sqFt: number;
  ratePerSqFt: number;
  basePricePerUnit: number;
  rushSurchargePerUnit: number;
  unitPrice: number;
  totalPrice: number;
}

export interface NoCurlPricingResult {
  sqFt: number;
  ratePerSqFt: number;
  basePricePerUnit: number;
  rushSurchargePerUnit: number;
  unitPrice: number;
  totalPrice: number;
}

export function getHdpeSqFtRate(quantity: number): number {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
  if (safeQuantity < 10) return 1.50 * BANNER_MARKUP;
  if (safeQuantity < 100) return 1.00 * BANNER_MARKUP;
  return 0.75 * BANNER_MARKUP;
}

export function getCanvasSqFtRate(quantity: number): number {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  if (safeQuantity <= 999) return 4.98 * BANNER_MARKUP;
  if (safeQuantity <= 4999) return 3.79 * BANNER_MARKUP;
  return 2.49 * BANNER_MARKUP;
}

export function getPosterSqFtRate(areaSqFt: number): number {
  const safeAreaSqFt = Number.isFinite(areaSqFt) ? Math.max(1, areaSqFt) : 1;

  if (safeAreaSqFt <= 5) return 4.5 * BANNER_MARKUP;
  if (safeAreaSqFt <= 15) return 4.0 * BANNER_MARKUP;
  if (safeAreaSqFt <= 30) return 3.5 * BANNER_MARKUP;
  if (safeAreaSqFt <= 100) return 3.0 * BANNER_MARKUP;
  return 2.6 * BANNER_MARKUP;
}

export function getNoCurlSqFtRate(areaSqFt: number): number {
  const safeAreaSqFt = Number.isFinite(areaSqFt) ? Math.max(1, areaSqFt) : 1;

  if (safeAreaSqFt <= 5) return 6.5 * BANNER_MARKUP;
  if (safeAreaSqFt <= 15) return 6.0 * BANNER_MARKUP;
  if (safeAreaSqFt <= 30) return 5.5 * BANNER_MARKUP;
  if (safeAreaSqFt <= 100) return 5.0 * BANNER_MARKUP;
  return 4.2 * BANNER_MARKUP;
}

export function calculatePosterPrice(
  width: number,
  height: number,
  unit: "inches" | "feet",
  quantity: number = 1,
  rush: boolean = false
): PosterPricingResult {
  const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  const widthFt = unit === "feet" ? safeWidth : safeWidth / 12;
  const heightFt = unit === "feet" ? safeHeight : safeHeight / 12;
  const sqFt = Math.max(1, Math.ceil(widthFt * heightFt));
  const ratePerSqFt = getPosterSqFtRate(sqFt);

  const basePricePerUnit = sqFt * ratePerSqFt;
  const rushSurchargePerUnit = rush ? basePricePerUnit * 1.0 : 0;
  const unitPrice = Math.max(basePricePerUnit + rushSurchargePerUnit, 12);
  const totalPrice = unitPrice * safeQuantity;

  return {
    sqFt,
    ratePerSqFt,
    basePricePerUnit: Math.round(basePricePerUnit * 100) / 100,
    rushSurchargePerUnit: Math.round(rushSurchargePerUnit * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}

export function calculateNoCurlPrice(
  width: number,
  height: number,
  unit: "inches" | "feet",
  quantity: number = 1,
  rush: boolean = false
): NoCurlPricingResult {
  const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  const widthFt = unit === "feet" ? safeWidth : safeWidth / 12;
  const heightFt = unit === "feet" ? safeHeight : safeHeight / 12;
  const sqFt = Math.max(1, Math.ceil(widthFt * heightFt));
  const ratePerSqFt = getNoCurlSqFtRate(sqFt);

  const basePricePerUnit = sqFt * ratePerSqFt;
  const rushSurchargePerUnit = rush ? basePricePerUnit * 1.0 : 0;
  const unitPrice = Math.max(basePricePerUnit + rushSurchargePerUnit, 20);
  const totalPrice = unitPrice * safeQuantity;

  return {
    sqFt,
    ratePerSqFt,
    basePricePerUnit: Math.round(basePricePerUnit * 100) / 100,
    rushSurchargePerUnit: Math.round(rushSurchargePerUnit * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}

export function calculateCanvasPrice(
  width: number,
  height: number,
  unit: "inches" | "feet",
  quantity: number = 1
): CanvasPricingResult {
  const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
  const ratePerSqFt = getCanvasSqFtRate(safeQuantity);

  const sqFt = unit === "feet"
    ? safeWidth * safeHeight
    : (safeWidth * safeHeight) / 144;

  const baseTotalPrice = sqFt * ratePerSqFt * safeQuantity;
  const totalPrice = Math.max(baseTotalPrice, 20);
  const unitPrice = totalPrice / safeQuantity;

  return {
    sqFt: Math.round(sqFt * 100) / 100,
    ratePerSqFt: Math.round(ratePerSqFt * 100) / 100,
    baseTotalPrice: Math.round(baseTotalPrice * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    minimumApplied: totalPrice > baseTotalPrice,
    sheetsRequired: 1,
  };
}

/**
 * Returns per-sqft rate for mesh banners based on quantity tiers.
 * Tiers (placeholder — update with your pricing strategy):
 *   1–999: $2.44 | 1000–2499: $1.49 | 2500–4999: $1.09 | 5000+: $0.99
 */
export function getMeshSqFtRate(quantity: number): number {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  if (safeQuantity <= 999) return 3.66;
  if (safeQuantity <= 2499) return 2.24;
  if (safeQuantity <= 4999) return 1.64;
  return 1.49;
}

/**
 * Calculates the total price for a mesh banner order.
 * Billable area is rounded up to the next whole square foot.
 * Add-ons: grommets = free, welding = free,
 *          rope/webbing = $1.75/linear ft (perimeter),
 *          polePockets = $1.00/linear ft (2×width) + $10 setup,
 *          rush = 100% surcharge,
 *          minimum unit price = $30.
 */
export function calculateMeshPrice(
  width: number,
  height: number,
  unit: "inches" | "feet",
  quantity: number,
  grommets: boolean,
  welding: boolean,
  webbing: boolean,
  rope: boolean,
  polePockets: boolean,
  rush: boolean
): MeshPricingResult {
  const safeWidth    = Number.isFinite(width)    ? Math.max(0, width)    : 0;
  const safeHeight   = Number.isFinite(height)   ? Math.max(0, height)   : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  const widthFt    = unit === "feet" ? safeWidth  : safeWidth  / 12;
  const heightFt   = unit === "feet" ? safeHeight : safeHeight / 12;
  const rawSqFt    = widthFt * heightFt;
  const sqFt       = Math.ceil(rawSqFt);
  const perimeterFt = 2 * (widthFt + heightFt);

  const ratePerSqFt      = getMeshSqFtRate(sqFt);
  const basePricePerUnit = sqFt * ratePerSqFt;

  // Grommets: always free for mesh (no cost)

  // Pole pockets: $1.00/linear ft (top + bottom = 2×width) plus $10.00 setup
  const polePocketCostPerUnit = polePockets ? (widthFt * 2 * 1.00) + 10.00 : 0;

  // Retail mesh add-ons:
  // - Welding: no additional cost
  // - Webbing: $1.75 per linear foot of perimeter
  // - Rope:    $1.75 per linear foot of perimeter
  const webbingCostPerUnit = webbing ? perimeterFt * 1.75 : 0;
  const ropeCostPerUnit = rope ? perimeterFt * 1.75 : 0;
  const edgeFinishCostPerUnit = webbingCostPerUnit + ropeCostPerUnit;

  const priceBeforeRush      = basePricePerUnit + polePocketCostPerUnit + edgeFinishCostPerUnit;
  const rushSurchargePerUnit = rush ? priceBeforeRush * 1.00 : 0; // 100% additional
  const unitPrice            = Math.max(priceBeforeRush + rushSurchargePerUnit, 30);
  const totalPrice           = unitPrice * safeQuantity;

  return {
    sqFt,
    ratePerSqFt,
    basePricePerUnit:      Math.round(basePricePerUnit      * 100) / 100,
    grommetCostPerUnit:    0,
    polePocketCostPerUnit: Math.round(polePocketCostPerUnit * 100) / 100,
    edgeFinishCostPerUnit: Math.round(edgeFinishCostPerUnit * 100) / 100,
    rushSurchargePerUnit:  Math.round(rushSurchargePerUnit  * 100) / 100,
    unitPrice:             Math.round(unitPrice             * 100) / 100,
    totalPrice:            Math.round(totalPrice            * 100) / 100,
  };
}

/**
 * Calculates the total number of grommet placements based on dimensions and preference.
 */
export function calculateGrommetCount(
  widthIn: number,
  heightIn: number,
  placement: GrommetPlacement,
  spacingIn: number
): number {
  const safeSpacing = Math.max(6, Math.min(25, spacingIn));
  const widthFt = widthIn / 12;
  const heightFt = heightIn / 12;

  const topCount = Math.max(2, Math.ceil(widthFt / (safeSpacing / 12)) + 1);
  const bottomCount = Math.max(2, Math.ceil(widthFt / (safeSpacing / 12)) + 1);
  const leftCount = Math.max(2, Math.ceil(heightFt / (safeSpacing / 12)) + 1);
  const rightCount = Math.max(2, Math.ceil(heightFt / (safeSpacing / 12)) + 1);

  switch (placement) {
    case "all-sides":
      return topCount + bottomCount + leftCount + rightCount - 4;
    case "top-left-right":
      return topCount + leftCount + rightCount - 2;
    case "top-left-bottom":
      return topCount + bottomCount + leftCount - 2;
    case "top-right-bottom":
      return topCount + bottomCount + rightCount - 2;
    case "left-right-bottom":
      return bottomCount + leftCount + rightCount - 2;
    case "top-left":
      return topCount + leftCount - 1;
    case "top-right":
      return topCount + rightCount - 1;
    case "top-bottom":
      return topCount + bottomCount;
    case "left-right":
      return leftCount + rightCount;
    case "left-bottom":
      return bottomCount + leftCount - 1;
    case "right-bottom":
      return bottomCount + rightCount - 1;
    case "top-only":
      return topCount;
    case "bottom-only":
      return bottomCount;
    case "left-only":
      return leftCount;
    case "right-only":
      return rightCount;
    default:
      return 4;
  }
}

/**
 * Calculates the total price for a vinyl banner order.
 */
export function calculateBannerPrice(input: BannerPricingInput): BannerPricingResult {
  const { widthIn, heightIn, quantity, material, doubleSided,
          grommets, grommetPlacement, grommetSpacingIn, edgeFinish, polePockets, windSlits, hemming, rush } = input;

  const config = PRICING_CONFIG;
  const resolvedMaterial = resolveMaterial(material);

  const safeWidthIn = Number.isFinite(widthIn) ? widthIn : 0;
  const safeHeightIn = Number.isFinite(heightIn) ? heightIn : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  // Convert to feet
  const widthFt = safeWidthIn / 12;
  const heightFt = safeHeightIn / 12;
  const sqFt = widthFt * heightFt;
  const perimeterFt = 2 * (widthFt + heightFt);

  // Mesh has its own pricing model and add-on rates.
  if (resolvedMaterial === "Mesh Banner") {
    const billableSqFt = Math.ceil(sqFt);
    const meshSqFtRate = getMeshSqFtRate(safeQuantity);
    const basePricePerUnit = billableSqFt * meshSqFtRate;

    const grommetCostPerUnit = 0;

    let edgeFinishCostPerUnit = 0;
    if (edgeFinish === "webbing" || edgeFinish === "rope") {
      edgeFinishCostPerUnit = perimeterFt * 1.75;
    }

    let polePocketCostPerUnit = 0;
    if (polePockets) {
      polePocketCostPerUnit = (widthFt * 2 * 1.0) + 10;
    }

    const windSlitsCostPerUnit = 0;
    const hemmingCostPerUnit = 0;
    const addOnCostPerUnit = grommetCostPerUnit + edgeFinishCostPerUnit + polePocketCostPerUnit;
    const priceBeforeRush = basePricePerUnit + addOnCostPerUnit;
    const rushSurchargePerUnit = rush ? priceBeforeRush * 1.0 : 0;
    const unitPrice = Math.max(priceBeforeRush + rushSurchargePerUnit, 30);
    const totalPrice = unitPrice * safeQuantity;

    return {
      sqFt: billableSqFt,
      basePricePerUnit: Math.round(basePricePerUnit * 100) / 100,
      grommetCostPerUnit: Math.round(grommetCostPerUnit * 100) / 100,
      edgeFinishCostPerUnit: Math.round(edgeFinishCostPerUnit * 100) / 100,
      polePocketCostPerUnit: Math.round(polePocketCostPerUnit * 100) / 100,
      windSlitsCostPerUnit: Math.round(windSlitsCostPerUnit * 100) / 100,
      hemmingCostPerUnit: Math.round(hemmingCostPerUnit * 100) / 100,
      addOnCostPerUnit: Math.round(addOnCostPerUnit * 100) / 100,
      rushSurchargePerUnit: Math.round(rushSurchargePerUnit * 100) / 100,
      unitPrice: Math.round(unitPrice * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
  }

  // Quantity-tiered rate (1000+ gets lower rate)
  const highQtyRates: Partial<Record<MaterialName, number>> = {
    "13oz Vinyl": 1.00 * BANNER_MARKUP,
    "15oz Vinyl": 1.25 * BANNER_MARKUP,
    "18oz Vinyl": 1.75 * BANNER_MARKUP,
  };
  const sqFtRate = safeQuantity >= 1000 && highQtyRates[resolvedMaterial] != null
    ? highQtyRates[resolvedMaterial]!
    : config.materialRates[resolvedMaterial];

  // 18oz double-sided has its own cost rate ($4.25/sqft × 1.5)
  let basePricePerUnit: number;
  if (resolvedMaterial === "18oz Vinyl" && doubleSided) {
    const doubleSidedRate = safeQuantity >= 1000 ? 3.25 * BANNER_MARKUP : 4.25 * BANNER_MARKUP;
    basePricePerUnit = sqFt * doubleSidedRate;
  } else if (doubleSided) {
    basePricePerUnit = sqFt * sqFtRate * config.addOns.doubleSided;
  } else {
    basePricePerUnit = sqFt * sqFtRate;
  }

  // Add-on costs — grommets: free, welding: free
  const grommetCostPerUnit = 0;

  let polePocketCostPerUnit = 0;
  if (polePockets) {
    polePocketCostPerUnit = (widthFt * 2 * config.addOns.polePocketsPerLinearFt) + config.addOns.polePocketsSetupFee;
  }

  const windSlitsCostPerUnit = windSlits ? sqFt * config.addOns.windSlitsPerSqFt : 0;

  let edgeFinishCostPerUnit = 0;
  if (edgeFinish === "rope") {
    edgeFinishCostPerUnit = perimeterFt * config.addOns.ropePerLinearFt;
  }

  let hemmingCostPerUnit = 0;
  if (hemming && !config.addOns.hemmingIncluded) {
    hemmingCostPerUnit = perimeterFt * config.addOns.hemmingPerLinearFt;
  }

  const addOnCostPerUnit = grommetCostPerUnit + polePocketCostPerUnit + windSlitsCostPerUnit + edgeFinishCostPerUnit + hemmingCostPerUnit;

  // Rush surcharge — 100% additional
  const priceBeforeRush = basePricePerUnit + addOnCostPerUnit;
  const rushSurchargePerUnit = rush
    ? priceBeforeRush * (config.rushMultiplier - 1)
    : 0;

  let unitPrice = priceBeforeRush + rushSurchargePerUnit;

  // Apply minimum price
  unitPrice = Math.max(unitPrice, config.minimumPrice);

  const totalPrice = unitPrice * safeQuantity;

  return {
    sqFt: Math.round(sqFt * 100) / 100,
    basePricePerUnit: Math.round(basePricePerUnit * 100) / 100,
    grommetCostPerUnit: Math.round(grommetCostPerUnit * 100) / 100,
    edgeFinishCostPerUnit,
    polePocketCostPerUnit: Math.round(polePocketCostPerUnit * 100) / 100,
    windSlitsCostPerUnit: Math.round(windSlitsCostPerUnit * 100) / 100,
    hemmingCostPerUnit: Math.round(hemmingCostPerUnit * 100) / 100,
    addOnCostPerUnit: Math.round(addOnCostPerUnit * 100) / 100,
    rushSurchargePerUnit: Math.round(rushSurchargePerUnit * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}

export function calculateHdpePrice(
  widthIn: number,
  heightIn: number,
  quantity: number = 1,
  rush: boolean = false
): SimpleSqFtPricingResult {
  const safeWidthIn = Number.isFinite(widthIn) ? Math.max(0, widthIn) : 0;
  const safeHeightIn = Number.isFinite(heightIn) ? Math.max(0, heightIn) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  const sqFt = (safeWidthIn / 12) * (safeHeightIn / 12);
  const pricePerSqFt = getHdpeSqFtRate(safeQuantity);

  let base = sqFt * pricePerSqFt;
  if (rush) {
    base *= 1.4;
  }

  let totalPrice = base * safeQuantity;
  if (totalPrice < 20) {
    totalPrice = 20;
  }

  const unitPrice = totalPrice / safeQuantity;

  return {
    sqFt: Math.round(sqFt * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    sheetsRequired: 1,
  };
}

export function formatPrice(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(safeAmount);
}

function resolveMaterial(material: Material): MaterialName {
  const aliases: Record<LegacyMaterialName, MaterialName> = {
    standard: "13oz Vinyl",
    premium: "15oz Vinyl",
    mesh: "Mesh Banner",
    fabric: "Fabric Banner",
  };

  if (material in aliases) {
    return aliases[material as LegacyMaterialName];
  }

  return material as MaterialName;
}
