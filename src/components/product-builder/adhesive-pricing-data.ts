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
    pricingRows: [{ label: "Bootprints", base: 12.5, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Contour Cut", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  dryErase: {
    title: "Dry Erase",
    pricingRows: [{ label: "Dry Erase", base: 3.5, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  dualView: {
    title: "Dual View",
    pricingRows: [
      { label: "DualView Single-Sided", base: 2.79, suffix: "per square foot" },
      { label: "DualView Double-Sided", base: 4.99, suffix: "per square foot" },
    ],
    addOnRates: [],
    addOnText: [{ label: "Contour Cutting", text: "10% additional" }],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  footprints: {
    title: "Footprints",
    pricingRows: [{ label: "Footprints", base: 2.5, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  gf2030: {
    title: "GF 203OAPAE",
    pricingRows: [{ label: "GF 203OAPAE", base: 2.49, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Gloss Laminate", text: "No additional cost" },
      { label: "Matte Laminate", text: "No additional cost" },
      { label: "No Laminate", text: "No additional cost" },
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  gf830: {
    title: "GF830 AutoMark",
    pricingRows: [{ label: "GF830 AutoMark", base: 3.99, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Gloss Laminate", text: "No additional cost" },
      { label: "Matte Laminate", text: "No additional cost" },
      { label: "No Laminate", text: "No additional cost" },
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  ij35c: {
    title: "3M IJ-35C",
    pricingRows: [{ label: "3M IJ-35C", base: 2.99, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Gloss Laminate", text: "No additional cost" },
      { label: "Matte Laminate", text: "No additional cost" },
      { label: "No Laminate", text: "No additional cost" },
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  lowTacWall: {
    title: "Low-Tac Wall",
    pricingRows: [{ label: "Low Tac Wall", base: 3.47, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  oneWayWindow: {
    title: "One Way Window",
    pricingRows: [
      { label: "50/50 Perforation", base: 2.75, suffix: "per square foot" },
      { label: "70/30 Perforation", base: 2.75, suffix: "per square foot" },
    ],
    addOnRates: [{ label: "Gloss Laminate", base: 1.24, suffix: "per square foot" }],
    addOnText: [{ label: "Rush", text: "100% additional" }],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  orajetClear: {
    title: "Orajet Clear",
    pricingRows: [{ label: "Base Rate", base: 6, suffix: "per sq ft" }],
    addOnRates: [],
    addOnText: [{ label: "Contour Cutting", text: "10% additional" }],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  printWrap: {
    title: "3M Print Wrap Film",
    pricingRows: [{ label: "3M Controltac", base: 4.99, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [
      { label: "Gloss Laminate", text: "No additional cost" },
      { label: "Matte Laminate", text: "No additional cost" },
      { label: "No Laminate", text: "No additional cost" },
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Rush", text: "100% additional" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  reflectiveVinyl: {
    title: "Reflective Vinyl",
    pricingRows: [{ label: "Reflective", base: 8, suffix: "per square foot" }],
    addOnRates: [],
    addOnText: [{ label: "Contour Cutting", text: "10% additional" }],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
  windowCling: {
    title: "Window Cling",
    pricingRows: [{ label: "Window Cling", base: 0.02, suffix: "per square inch (minimum price of $2.88)" }],
    addOnRates: [],
    addOnText: [
      { label: "Contour Cutting", text: "10% additional" },
      { label: "Application - Inside", text: "No additional cost" },
      { label: "Application - Outside", text: "No additional cost" },
      { label: "Viewable - Inside", text: "No additional cost" },
      { label: "Viewable - Outside", text: "No additional cost" },
    ],
    shippingTables: [
      {
        rowLabel: "",
        headers: ["1 - 999 sq. ft.", "1,000+ sq. ft."],
        values: [10, 199],
        freightIndexes: [1],
      },
    ],
  },
};
