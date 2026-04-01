export type CoroMaterial = "4mm" | "10mm";
export type CoroPrintMode = "single" | "double";

export interface CoroSizeOption {
  id: string;
  width: number;
  height: number;
}

export interface CoroPricingInput {
  width: number;
  height: number;
  quantity: number;
  material: CoroMaterial;
  printMode: CoroPrintMode;
  stepStakes: number;
  heavyDutyStakes: number;
  grommetsEnabled: boolean;
  grommetCount: number;
  gloss: boolean;
  contourCut: boolean;
  rush: boolean;
}

export interface CoroPricingResult {
  signsPerSheet: number;
  sheetsRequired: number;
  supplierSheetPrice: number;
  supplierCostPerSign: number;
  markedUpUnitPrice: number;
  baseSubtotal: number;
  contourCutFee: number;
  rushFee: number;
  stepStakesFee: number;
  heavyDutyStakesFee: number;
  grommetFee: number;
  glossFee: number;
  unitPrice: number;
  totalPrice: number;
}

export const CORO_SHEET = {
  width: 48,
  height: 96,
};

export const CORO_MARKUP = 1.6;

export const CORO_SIZE_OPTIONS: CoroSizeOption[] = [
  { id: "24x18", width: 24, height: 18 },
  { id: "18x24", width: 18, height: 24 },
  { id: "24x24", width: 24, height: 24 },
  { id: "24x12", width: 24, height: 12 },
  { id: "12x24", width: 12, height: 24 },
  { id: "18x12", width: 18, height: 12 },
  { id: "12x18", width: 12, height: 18 },
  { id: "12x12", width: 12, height: 12 },
  { id: "12x6", width: 12, height: 6 },
  { id: "11x17", width: 11, height: 17 },
  { id: "11x11", width: 11, height: 11 },
  { id: "10.5x29", width: 10.5, height: 29 },
  { id: "10x10", width: 10, height: 10 },
  { id: "10x12", width: 10, height: 12 },
  { id: "9x24", width: 9, height: 24 },
  { id: "8x24", width: 8, height: 24 },
  { id: "8x12", width: 8, height: 12 },
  { id: "6x24", width: 6, height: 24 },
  { id: "6x18", width: 6, height: 18 },
  { id: "6x12", width: 6, height: 12 },
];

interface TieredSheetPrice {
  maxQty: number;
  single4mm: number;
  double4mm: number;
  single10mm: number;
  double10mm: number;
}

const SHEET_TIERS: TieredSheetPrice[] = [
  { maxQty: 9, single4mm: 44, double4mm: 55, single10mm: 70, double10mm: 90 },
  { maxQty: 50, single4mm: 33, double4mm: 44, single10mm: 56, double10mm: 72 },
  { maxQty: Number.POSITIVE_INFINITY, single4mm: 28, double4mm: 38, single10mm: 48, double10mm: 62 },
];

export function formatCoroSize(size: CoroSizeOption): string {
  return `${size.width}\" x ${size.height}\"`;
}

export function getSignsPerSheet(width: number, height: number): number {
  const fitNormal = Math.floor(CORO_SHEET.width / width) * Math.floor(CORO_SHEET.height / height);
  const fitRotated = Math.floor(CORO_SHEET.width / height) * Math.floor(CORO_SHEET.height / width);
  return Math.max(1, fitNormal, fitRotated);
}

export function getSheetColumnsRows(width: number, height: number): { columns: number; rows: number } {
  const normal = {
    columns: Math.floor(CORO_SHEET.width / width),
    rows: Math.floor(CORO_SHEET.height / height),
  };
  const rotated = {
    columns: Math.floor(CORO_SHEET.width / height),
    rows: Math.floor(CORO_SHEET.height / width),
  };

  if (normal.columns * normal.rows >= rotated.columns * rotated.rows) {
    return normal;
  }

  return rotated;
}

export function getSupplierSheetPrice(quantity: number, material: CoroMaterial, printMode: CoroPrintMode): number {
  const safeQuantity = Math.max(1, quantity);
  const tier = SHEET_TIERS.find((item) => safeQuantity <= item.maxQty) ?? SHEET_TIERS[SHEET_TIERS.length - 1];

  if (material === "4mm" && printMode === "single") return tier.single4mm;
  if (material === "4mm" && printMode === "double") return tier.double4mm;
  if (material === "10mm" && printMode === "single") return tier.single10mm;
  return tier.double10mm;
}

function roundRetail(price: number): number {
  const rounded = Math.ceil(price);
  return Math.max(rounded - 0.01, 0.99);
}

export function calculateCoroPricing(input: CoroPricingInput): CoroPricingResult {
  const safeQuantity = Math.max(1, Math.floor(input.quantity));
  const signsPerSheet = getSignsPerSheet(input.width, input.height);
  const sheetsRequired = Math.max(1, Math.ceil(safeQuantity / signsPerSheet));

  const supplierSheetPrice = getSupplierSheetPrice(safeQuantity, input.material, input.printMode);
  const supplierTotalCost = sheetsRequired * supplierSheetPrice;
  const supplierCostPerSign = supplierTotalCost / safeQuantity;

  const markedUpUnitPrice = roundRetail(supplierCostPerSign * CORO_MARKUP);
  const baseSubtotal = markedUpUnitPrice * safeQuantity;

  const contourCutFee = input.contourCut ? baseSubtotal * 0.2 : 0;
  const rushFee = input.rush ? (baseSubtotal + contourCutFee) * 1.2 : 0;

  const stepStakesFee = Math.max(0, input.stepStakes) * 2.5;
  const heavyDutyStakesFee = Math.max(0, input.heavyDutyStakes) * 4;

  const grommetCount = input.grommetsEnabled ? Math.max(1, Math.floor(input.grommetCount)) : 0;
  const grommetFee = input.grommetsEnabled ? 20 + grommetCount * 0.75 : 0;

  const glossFee = input.gloss ? safeQuantity * 6 : 0;

  const totalPrice =
    baseSubtotal +
    contourCutFee +
    rushFee +
    stepStakesFee +
    heavyDutyStakesFee +
    grommetFee +
    glossFee;

  return {
    signsPerSheet,
    sheetsRequired,
    supplierSheetPrice,
    supplierCostPerSign: Number(supplierCostPerSign.toFixed(2)),
    markedUpUnitPrice: Number(markedUpUnitPrice.toFixed(2)),
    baseSubtotal: Number(baseSubtotal.toFixed(2)),
    contourCutFee: Number(contourCutFee.toFixed(2)),
    rushFee: Number(rushFee.toFixed(2)),
    stepStakesFee: Number(stepStakesFee.toFixed(2)),
    heavyDutyStakesFee: Number(heavyDutyStakesFee.toFixed(2)),
    grommetFee: Number(grommetFee.toFixed(2)),
    glossFee: Number(glossFee.toFixed(2)),
    unitPrice: Number((totalPrice / safeQuantity).toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
}
