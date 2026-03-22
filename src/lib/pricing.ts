// Pricing configuration for Signcous products

export type MaterialName = "13oz Vinyl" | "15oz Vinyl" | "Mesh Banner" | "Fabric Banner";
export type LegacyMaterialName = "standard" | "premium" | "mesh" | "fabric";
export type Material = MaterialName | LegacyMaterialName;
export type GrommetMode = "per-corner" | "every-2ft";

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
  polePockets: boolean;
  windSlits: boolean;
  hemming: boolean;
  rush: boolean;
}

export interface BannerPricingResult {
  sqFt: number;
  basePricePerUnit: number;
  grommetCostPerUnit: number;
  polePocketCostPerUnit: number;
  windSlitsCostPerUnit: number;
  hemmingCostPerUnit: number;
  addOnCostPerUnit: number;
  rushSurchargePerUnit: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Calculates the total price for a vinyl banner order.
 */
export function calculateBannerPrice(input: BannerPricingInput): BannerPricingResult {
  const { widthIn, heightIn, quantity, material, doubleSided,
          grommets, grommetMode, polePockets, windSlits, hemming, rush } = input;

  const config = PRICING_CONFIG;
  const resolvedMaterial = resolveMaterial(material);

  const safeWidthIn = Number.isFinite(widthIn) ? widthIn : 0;
  const safeHeightIn = Number.isFinite(heightIn) ? heightIn : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;

  // Convert to feet
  const widthFt = safeWidthIn / 12;
  const heightFt = safeHeightIn / 12;
  const sqFt = widthFt * heightFt;

  // Base price per unit
  let basePricePerUnit = sqFt * config.materialRates[resolvedMaterial];
  if (doubleSided) {
    basePricePerUnit *= config.addOns.doubleSided;
  }

  // Add-on costs
  const perimeterFt = 2 * (widthFt + heightFt);

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
    polePocketCostPerUnit: Math.round(polePocketCostPerUnit * 100) / 100,
    windSlitsCostPerUnit: Math.round(windSlitsCostPerUnit * 100) / 100,
    hemmingCostPerUnit: Math.round(hemmingCostPerUnit * 100) / 100,
    addOnCostPerUnit: Math.round(addOnCostPerUnit * 100) / 100,
    rushSurchargePerUnit: Math.round(rushSurchargePerUnit * 100) / 100,
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
