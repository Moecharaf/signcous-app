export type PolystyrenePrintMode = "single" | "double";

export interface PolystyreneSizeOption {
  id: string;
  width: number;
  height: number;
}

export interface PolystyrenePricingInput {
  width: number;
  height: number;
  quantity: number;
  printMode: PolystyrenePrintMode;
  stepStakes: number;
  heavyDutyStakes: number;
  grommetsEnabled: boolean;
  grommetCount: number;
  gloss: boolean;
  contourCut: boolean;
  rush: boolean;
}

export interface PolystyrenePricingResult {
  signsPerSheet: number;
  sheetsRequired: number;
  sheetPrice: number;
  retailUnitPrice: number;
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

export interface PolystyreneSheetPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export interface PolystyreneSheetLayout {
  count: number;
  placements: PolystyreneSheetPlacement[];
}

export const POLYSTYRENE_SHEET = {
  width: 48,
  height: 96,
};

const SIGNS365_SIGNS_PER_SHEET_OVERRIDES: Record<string, number> = {
  "11x11": 32,
  "14x10": 27,
  "14x22": 12,
  "22x14": 12,
  "18x12": 16,
  "18x24": 8,
  "18x30": 6,
  "12x16": 24,
  "12x18": 20,
  "12x34": 10,
  "24x36": 4,
  "36x24": 4,
  "30x18": 8,
  "32x16": 9,
};

export const POLYSTYRENE_SIZE_OPTIONS: PolystyreneSizeOption[] = [
  { id: "10.5x29", width: 10.5, height: 29 },
  { id: "11x11", width: 11, height: 11 },
  { id: "12x6", width: 12, height: 6 },
  { id: "12x8", width: 12, height: 8 },
  { id: "12x12", width: 12, height: 12 },
  { id: "12x16", width: 12, height: 16 },
  { id: "12x18", width: 12, height: 18 },
  { id: "12x24", width: 12, height: 24 },
  { id: "12x34", width: 12, height: 34 },
  { id: "14x10", width: 14, height: 10 },
  { id: "14x22", width: 14, height: 22 },
  { id: "14.5x29.5", width: 14.5, height: 29.5 },
  { id: "16x12", width: 16, height: 12 },
  { id: "16x16", width: 16, height: 16 },
  { id: "16x24", width: 16, height: 24 },
  { id: "16x32", width: 16, height: 32 },
  { id: "18x12", width: 18, height: 12 },
  { id: "18x18", width: 18, height: 18 },
  { id: "18x24", width: 18, height: 24 },
  { id: "18x30", width: 18, height: 30 },
  { id: "18x36", width: 18, height: 36 },
  { id: "20x24", width: 20, height: 24 },
  { id: "20x30", width: 20, height: 30 },
  { id: "22x14", width: 22, height: 14 },
  { id: "22x27", width: 22, height: 27 },
  { id: "22x28", width: 22, height: 28 },
  { id: "24x6", width: 24, height: 6 },
  { id: "24x8", width: 24, height: 8 },
  { id: "24x12", width: 24, height: 12 },
  { id: "24x16", width: 24, height: 16 },
  { id: "24x18", width: 24, height: 18 },
  { id: "24x20", width: 24, height: 20 },
  { id: "24x24", width: 24, height: 24 },
  { id: "24x30", width: 24, height: 30 },
  { id: "24x32", width: 24, height: 32 },
  { id: "24x36", width: 24, height: 36 },
  { id: "24x48", width: 24, height: 48 },
  { id: "24x96", width: 24, height: 96 },
  { id: "30x18", width: 30, height: 18 },
  { id: "32x16", width: 32, height: 16 },
  { id: "32x96", width: 32, height: 96 },
  { id: "36x18", width: 36, height: 18 },
  { id: "36x24", width: 36, height: 24 },
  { id: "36x36", width: 36, height: 36 },
  { id: "36x48", width: 36, height: 48 },
  { id: "36x96", width: 36, height: 96 },
  { id: "40x26", width: 40, height: 26 },
  { id: "42x32", width: 42, height: 32 },
  { id: "42x48", width: 42, height: 48 },
  { id: "43x27", width: 43, height: 27 },
  { id: "44x28", width: 44, height: 28 },
  { id: "48x9", width: 48, height: 9 },
  { id: "48x18", width: 48, height: 18 },
  { id: "48x24", width: 48, height: 24 },
  { id: "48x32", width: 48, height: 32 },
  { id: "48x36", width: 48, height: 36 },
  { id: "48x48", width: 48, height: 48 },
  { id: "48x69", width: 48, height: 69 },
  { id: "48x72", width: 48, height: 72 },
  { id: "48x78", width: 48, height: 78 },
  { id: "48x96", width: 48, height: 96 },
  { id: "96x48", width: 96, height: 48 },
];

interface TieredSheetPrice {
  maxQty: number;
  retailSingle: number;
  retailDouble: number;
}

const SHEET_TIERS: TieredSheetPrice[] = [
  { maxQty: 9,                      retailSingle: 70, retailDouble: 85 },
  { maxQty: 50,                     retailSingle: 60, retailDouble: 70 },
  { maxQty: Number.POSITIVE_INFINITY, retailSingle: 55, retailDouble: 65 },
];

export function formatPolystyreneSize(size: PolystyreneSizeOption): string {
  return `${size.width}" x ${size.height}"`;
}

function buildGridPlacements(
  originX: number,
  originY: number,
  regionWidth: number,
  regionHeight: number,
  signWidth: number,
  signHeight: number,
  rotated: boolean
): PolystyreneSheetPlacement[] {
  const columns = Math.floor(regionWidth / signWidth);
  const rows = Math.floor(regionHeight / signHeight);
  const placements: PolystyreneSheetPlacement[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      placements.push({
        x: originX + col * signWidth,
        y: originY + row * signHeight,
        width: signWidth,
        height: signHeight,
        rotated,
      });
    }
  }

  return placements;
}

function chooseBetterLayout(
  current: PolystyreneSheetLayout,
  candidate: PolystyreneSheetLayout
): PolystyreneSheetLayout {
  return candidate.count > current.count ? candidate : current;
}

function getSizeKey(width: number, height: number): string {
  return `${Number(width)}x${Number(height)}`;
}

function getFixedSigns365Layout(width: number, height: number): PolystyreneSheetLayout | null {
  const sizeKey = getSizeKey(width, height);

  if (sizeKey === "18x36") {
    const placements: PolystyreneSheetPlacement[] = [
      { x: 0, y: 0, width: 18, height: 36, rotated: false },
      { x: 18, y: 0, width: 18, height: 36, rotated: false },
      { x: 0, y: 36, width: 36, height: 18, rotated: true },
      { x: 0, y: 54, width: 18, height: 36, rotated: false },
      { x: 18, y: 54, width: 18, height: 36, rotated: false },
    ];
    return { count: placements.length, placements: centerPlacementsInSheet(placements) };
  }

  if (sizeKey === "24x36") {
    const placements: PolystyreneSheetPlacement[] = [
      { x: 0, y: 0, width: 36, height: 24, rotated: true },
      { x: 0, y: 24, width: 36, height: 24, rotated: true },
      { x: 0, y: 48, width: 36, height: 24, rotated: true },
      { x: 0, y: 72, width: 36, height: 24, rotated: true },
    ];
    return { count: placements.length, placements: centerPlacementsInSheet(placements) };
  }

  return null;
}

function centerPlacementsInSheet(
  placements: PolystyreneSheetPlacement[]
): PolystyreneSheetPlacement[] {
  if (placements.length === 0) return placements;

  const minX = Math.min(...placements.map((p) => p.x));
  const minY = Math.min(...placements.map((p) => p.y));
  const maxX = Math.max(...placements.map((p) => p.x + p.width));
  const maxY = Math.max(...placements.map((p) => p.y + p.height));

  const offsetX = (POLYSTYRENE_SHEET.width - (maxX - minX)) / 2 - minX;
  const offsetY = (POLYSTYRENE_SHEET.height - (maxY - minY)) / 2 - minY;

  return placements.map((p) => ({
    ...p,
    x: Number((p.x + offsetX).toFixed(4)),
    y: Number((p.y + offsetY).toFixed(4)),
  }));
}

export function getBestPolystyreneSheetLayout(
  width: number,
  height: number
): PolystyreneSheetLayout {
  const fixedLayout = getFixedSigns365Layout(width, height);
  if (fixedLayout) return fixedLayout;

  const normalPlacements = buildGridPlacements(
    0, 0, POLYSTYRENE_SHEET.width, POLYSTYRENE_SHEET.height, width, height, false
  );
  const rotatedPlacements = buildGridPlacements(
    0, 0, POLYSTYRENE_SHEET.width, POLYSTYRENE_SHEET.height, height, width, true
  );

  let best: PolystyreneSheetLayout =
    normalPlacements.length >= rotatedPlacements.length
      ? { count: normalPlacements.length, placements: normalPlacements }
      : { count: rotatedPlacements.length, placements: rotatedPlacements };

  const candidates: PolystyreneSheetLayout[] = [
    { count: normalPlacements.length, placements: normalPlacements },
    { count: rotatedPlacements.length, placements: rotatedPlacements },
  ];

  const splitXCandidates = new Set<number>([0, POLYSTYRENE_SHEET.width]);
  const splitYCandidates = new Set<number>([0, POLYSTYRENE_SHEET.height]);

  for (let x = width; x < POLYSTYRENE_SHEET.width; x += width)
    splitXCandidates.add(Number(x.toFixed(4)));
  for (let x = height; x < POLYSTYRENE_SHEET.width; x += height)
    splitXCandidates.add(Number(x.toFixed(4)));
  for (let y = height; y < POLYSTYRENE_SHEET.height; y += height)
    splitYCandidates.add(Number(y.toFixed(4)));
  for (let y = width; y < POLYSTYRENE_SHEET.height; y += width)
    splitYCandidates.add(Number(y.toFixed(4)));

  for (const splitX of splitXCandidates) {
    const leftNormal = buildGridPlacements(0, 0, splitX, POLYSTYRENE_SHEET.height, width, height, false);
    const rightRotated = buildGridPlacements(splitX, 0, POLYSTYRENE_SHEET.width - splitX, POLYSTYRENE_SHEET.height, height, width, true);
    const c1 = { count: leftNormal.length + rightRotated.length, placements: [...leftNormal, ...rightRotated] };
    best = chooseBetterLayout(best, c1);
    candidates.push(c1);

    const leftRotated = buildGridPlacements(0, 0, splitX, POLYSTYRENE_SHEET.height, height, width, true);
    const rightNormal = buildGridPlacements(splitX, 0, POLYSTYRENE_SHEET.width - splitX, POLYSTYRENE_SHEET.height, width, height, false);
    const c2 = { count: leftRotated.length + rightNormal.length, placements: [...leftRotated, ...rightNormal] };
    best = chooseBetterLayout(best, c2);
    candidates.push(c2);
  }

  for (const splitY of splitYCandidates) {
    const topNormal = buildGridPlacements(0, 0, POLYSTYRENE_SHEET.width, splitY, width, height, false);
    const bottomRotated = buildGridPlacements(0, splitY, POLYSTYRENE_SHEET.width, POLYSTYRENE_SHEET.height - splitY, height, width, true);
    const c3 = { count: topNormal.length + bottomRotated.length, placements: [...topNormal, ...bottomRotated] };
    best = chooseBetterLayout(best, c3);
    candidates.push(c3);

    const topRotated = buildGridPlacements(0, 0, POLYSTYRENE_SHEET.width, splitY, height, width, true);
    const bottomNormal = buildGridPlacements(0, splitY, POLYSTYRENE_SHEET.width, POLYSTYRENE_SHEET.height - splitY, width, height, false);
    const c4 = { count: topRotated.length + bottomNormal.length, placements: [...topRotated, ...bottomNormal] };
    best = chooseBetterLayout(best, c4);
    candidates.push(c4);
  }

  const overrideCount = SIGNS365_SIGNS_PER_SHEET_OVERRIDES[getSizeKey(width, height)];
  if (overrideCount) {
    const exact = candidates.filter((c) => c.count === overrideCount);
    if (exact.length > 0) {
      exact.sort(
        (a, b) =>
          a.placements.filter((p) => p.rotated).length -
          b.placements.filter((p) => p.rotated).length
      );
      return { count: overrideCount, placements: centerPlacementsInSheet(exact[0].placements) };
    }
  }

  return { count: Math.max(1, best.count), placements: centerPlacementsInSheet(best.placements) };
}

export function getPolystyreneSignsPerSheet(width: number, height: number): number {
  return getBestPolystyreneSheetLayout(width, height).count;
}

export function getPolystyreneSheetPrice(
  quantity: number,
  printMode: PolystyrenePrintMode
): number {
  const safeQty = Math.max(1, quantity);
  const tier = SHEET_TIERS.find((t) => safeQty <= t.maxQty) ?? SHEET_TIERS[SHEET_TIERS.length - 1];
  return printMode === "single" ? tier.retailSingle : tier.retailDouble;
}

export function calculatePolystyrenePricing(
  input: PolystyrenePricingInput
): PolystyrenePricingResult {
  const safeQty = Math.max(1, Math.floor(input.quantity));
  const signsPerSheet = getPolystyreneSignsPerSheet(input.width, input.height);
  const sheetsRequired = Math.max(1, Math.ceil(safeQty / signsPerSheet));

  const sheetPrice = getPolystyreneSheetPrice(safeQty, input.printMode);
  const retailUnitPrice = (sheetsRequired * sheetPrice) / safeQty;
  const baseSubtotal = retailUnitPrice * safeQty;

  const contourCutFee = input.contourCut ? baseSubtotal * 0.2 : 0;
  const rushFee = input.rush ? (baseSubtotal + contourCutFee) * 1.2 : 0;

  const stepStakesFee = Math.max(0, input.stepStakes) * 2.5;
  const heavyDutyStakesFee = Math.max(0, input.heavyDutyStakes) * 4;

  const grommetCount = input.grommetsEnabled ? Math.max(1, Math.floor(input.grommetCount)) : 0;
  const grommetFee = input.grommetsEnabled ? 20 + grommetCount * 0.75 : 0;

  const glossFee = input.gloss ? safeQty * 6 : 0;

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
    sheetPrice: Number(sheetPrice.toFixed(2)),
    retailUnitPrice: Number(retailUnitPrice.toFixed(2)),
    baseSubtotal: Number(baseSubtotal.toFixed(2)),
    contourCutFee: Number(contourCutFee.toFixed(2)),
    rushFee: Number(rushFee.toFixed(2)),
    stepStakesFee: Number(stepStakesFee.toFixed(2)),
    heavyDutyStakesFee: Number(heavyDutyStakesFee.toFixed(2)),
    grommetFee: Number(grommetFee.toFixed(2)),
    glossFee: Number(glossFee.toFixed(2)),
    unitPrice: Number((totalPrice / safeQty).toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
}
