// Pricing configuration for Signcous products

export type MaterialName = "13oz Vinyl" | "15oz Vinyl" | "Mesh Banner" | "Fabric Banner";
export type LegacyMaterialName = "standard" | "premium" | "mesh" | "fabric";
export type Material = MaterialName | LegacyMaterialName;
export type GrommetMode = "per-corner" | "every-2ft";
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
    windSlits: number;              // per banner (flat)
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
    "13oz Vinyl": 0.75,   // USD per sq ft
    "15oz Vinyl": 1.15,
    "Mesh Banner": 1.05,
    "Fabric Banner": 1.35,
  },
  addOns: {
    grommetsPerPlacement: 0.35,
    grommetSpacingFt: 2,
    minGrommets: 4,
    polePocketsPerLinearFt: 0.85,
    windSlits: 8.00,
    hemmingPerLinearFt: 0.5,
    hemmingIncluded: false,
    doubleSided: 1.6, // multiply base by this
  },
  rushMultiplier: 1.35, // 35% rush surcharge
  minimumPrice: 15.00,
};

export interface BannerPricingInput {
  widthIn: number;       // width in inches
  heightIn: number;      // height in inches
  quantity: number;
  material: Material;
  doubleSided: boolean;
  grommets: boolean;
  grommetMode: GrommetMode;
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

export function getHdpeSqFtRate(quantity: number): number {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
  if (safeQuantity < 10) return 4.5;
  if (safeQuantity < 50) return 4.0;
  if (safeQuantity < 100) return 3.6;
  if (safeQuantity < 500) return 3.2;
  return 2.9;
}

export function getCanvasSqFtRate(quantity: number): number {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  if (safeQuantity <= 5) return 6.99;
  if (safeQuantity <= 10) return 6.49;
  if (safeQuantity <= 25) return 5.99;
  if (safeQuantity <= 50) return 5.49;
  return 4.99;
}

export function getPosterSqFtRate(areaSqFt: number): number {
  const safeAreaSqFt = Number.isFinite(areaSqFt) ? Math.max(1, areaSqFt) : 1;

  if (safeAreaSqFt <= 5) return 4.5;
  if (safeAreaSqFt <= 15) return 4.0;
  if (safeAreaSqFt <= 30) return 3.5;
  if (safeAreaSqFt <= 100) return 3.0;
  return 2.6;
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
  };
}

/**
 * Returns per-sqft rate for mesh banners based on quantity tiers.
 * Tiers (placeholder — update with your pricing strategy):
 *   1–999: $2.44 | 1000–2499: $1.49 | 2500–4999: $1.09 | 5000+: $0.99
 */
export function getMeshSqFtRate(areaSqFt: number): number {
  const safeAreaSqFt = Number.isFinite(areaSqFt) ? Math.max(1, areaSqFt) : 1;
  if (safeAreaSqFt <= 20) return 3.75;
  if (safeAreaSqFt <= 50) return 3.4;
  if (safeAreaSqFt <= 100) return 3.1;
  if (safeAreaSqFt <= 300) return 2.85;
  return 2.6;
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

  // Grommets: always free for mesh
  const grommetCostPerUnit = grommets ? 0 : 0;

  // Pole pockets: $1.00/linear ft (top + bottom = 2×width) plus $10.00 setup
  const polePocketCostPerUnit = polePockets ? (widthFt * 2 * 1.00) + 10.00 : 0;

  // Retail mesh add-ons:
  // - Welding: no additional cost
  // - Webbing: $1.75 per linear foot of perimeter
  // - Rope:    $1.75 per linear foot of perimeter
  const weldingCostPerUnit = welding ? 0 : 0;
  const webbingCostPerUnit = webbing ? perimeterFt * 1.75 : 0;
  const ropeCostPerUnit = rope ? perimeterFt * 1.75 : 0;
  const edgeFinishCostPerUnit = weldingCostPerUnit + webbingCostPerUnit + ropeCostPerUnit;

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
 * Calculates the total price for a vinyl banner order.
 */
export function calculateBannerPrice(input: BannerPricingInput): BannerPricingResult {
  const { widthIn, heightIn, quantity, material, doubleSided,
          grommets, grommetMode, edgeFinish, polePockets, windSlits, hemming, rush } = input;

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
    const meshSqFtRate = getMeshSqFtRate(billableSqFt);
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

  // Base price per unit
  let basePricePerUnit = sqFt * config.materialRates[resolvedMaterial];
  if (doubleSided) {
    basePricePerUnit *= config.addOns.doubleSided;
  }

  // Add-on costs

  let grommetCostPerUnit = 0;
  if (grommets) {
    const totalPlacements = grommetMode === "per-corner"
      ? 4
      : Math.max(
          config.addOns.minGrommets,
          Math.ceil(perimeterFt / config.addOns.grommetSpacingFt)
        );
    grommetCostPerUnit = totalPlacements * config.addOns.grommetsPerPlacement;
  }

  let polePocketCostPerUnit = 0;
  if (polePockets) {
    const polePocketLinearFt = widthFt * 2;
    polePocketCostPerUnit = polePocketLinearFt * config.addOns.polePocketsPerLinearFt;
  }

  const windSlitsCostPerUnit = windSlits ? config.addOns.windSlits : 0;

  let hemmingCostPerUnit = 0;
  if (hemming && !config.addOns.hemmingIncluded) {
    hemmingCostPerUnit = perimeterFt * config.addOns.hemmingPerLinearFt;
  }

  let addOnCostPerUnit = 0;
  addOnCostPerUnit += grommetCostPerUnit;
  const edgeFinishCostPerUnit = 0;
  addOnCostPerUnit += polePocketCostPerUnit;
  addOnCostPerUnit += windSlitsCostPerUnit;
  addOnCostPerUnit += hemmingCostPerUnit;

  // Rush surcharge
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
