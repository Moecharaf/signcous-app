export const ADHESIVE_MARKUP = 1.5;

export type AdhesiveRateRow = {
  label: string;
  base: number;
  suffix?: string;
};

export type AdhesiveTextRow = {
  label: string;
  text: string;
};

export type AdhesiveShippingTable = {
  rowLabel: string;
  headers: string[];
  values: number[];
  freightIndexes?: number[];
};

export type AdhesivePricingConfig = {
  title: string;
  pricingRows: AdhesiveRateRow[];
  addOnRates: AdhesiveRateRow[];
  addOnText: AdhesiveTextRow[];
  shippingTables: AdhesiveShippingTable[];
};

const DEFAULT_SHIPPING_TABLES: AdhesiveShippingTable[] = [
  {
    rowLabel: "Rolled / Flat Pack",
    headers: ["1-3", "4+", "Oversize"],
    values: [10, 199, 199],
    freightIndexes: [1, 2],
  },
];

export const ADHESIVE_PRICING_CONFIGS: Record<string, AdhesivePricingConfig> = {
  bootprints: {
    title: "Bootprints",
    pricingRows: [{ label: "Base Rate", base: 14.95, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 40, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  dryErase: {
    title: "Dry Erase",
    pricingRows: [{ label: "Base Rate", base: 4.35, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 30, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  dualView: {
    title: "Dual View",
    pricingRows: [
      { label: "Single-Sided Base", base: 2.79, suffix: "per billed sq ft" },
      { label: "Double-Sided Base", base: 4.99, suffix: "per billed sq ft" },
    ],
    addOnRates: [
      { label: "Panel Cost (Single)", base: 8, suffix: "per extra panel" },
      { label: "Panel Cost (Double)", base: 10, suffix: "per extra panel" },
      { label: "Minimum (Single)", base: 30, suffix: "per item" },
      { label: "Minimum (Double)", base: 40, suffix: "per item" },
    ],
    addOnText: [{ label: "Contour Cut", text: "+10%" }],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  footprints: {
    title: "Footprints",
    pricingRows: [{ label: "Base Rate", base: 3.1, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 25, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  gf2030: {
    title: "GF 2030APAE",
    pricingRows: [{ label: "Base Rate", base: 2.95, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 30, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  gf830: {
    title: "GF830 AutoMark",
    pricingRows: [{ label: "Base Rate", base: 3.99, suffix: "per sq ft" }],
    addOnRates: [
      { label: "Panel Cost", base: 8, suffix: "per extra panel" },
      { label: "Minimum", base: 30, suffix: "per item" },
    ],
    addOnText: [
      { label: "Contour Cut", text: "+10%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  ij35c: {
    title: "3M IJ-35C",
    pricingRows: [{ label: "Base Rate", base: 3.49, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 25, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  lowTacWall: {
    title: "Low-Tac Wall",
    pricingRows: [{ label: "Base Rate", base: 4.25, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 25, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  oneWayWindow: {
    title: "One Way Window",
    pricingRows: [{ label: "Base Rate", base: 2.75, suffix: "per billed sq ft" }],
    addOnRates: [
      { label: "Laminate", base: 1.24, suffix: "per billed sq ft" },
      { label: "Panel Cost", base: 7, suffix: "per extra panel" },
      { label: "Minimum", base: 25, suffix: "per item" },
    ],
    addOnText: [
      { label: "Contour Cut", text: "+10%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  orajetClear: {
    title: "Orajet Clear",
    pricingRows: [{ label: "Base Rate", base: 6, suffix: "per sq ft" }],
    addOnRates: [
      { label: "Panel Cost", base: 10, suffix: "per extra panel" },
      { label: "Minimum", base: 35, suffix: "per item" },
    ],
    addOnText: [
      { label: "Contour Cut", text: "+10%" },
      { label: "Rush", text: "+75%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  printWrap: {
    title: "3M Print Wrap Film",
    pricingRows: [{ label: "Base Rate", base: 5.75, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 35, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  reflectiveVinyl: {
    title: "Reflective Vinyl",
    pricingRows: [{ label: "Base Rate", base: 9.95, suffix: "per sq ft" }],
    addOnRates: [{ label: "Minimum", base: 30, suffix: "per item" }],
    addOnText: [
      { label: "Contour Cut", text: "+15%" },
      { label: "Rush", text: "+100%" },
    ],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
  windowCling: {
    title: "Window Cling",
    pricingRows: [{ label: "Base Rate", base: 0.024, suffix: "per sq in" }],
    addOnRates: [{ label: "Minimum", base: 4.99, suffix: "per item" }],
    addOnText: [{ label: "Contour Cut", text: "+15%" }],
    shippingTables: DEFAULT_SHIPPING_TABLES,
  },
};
