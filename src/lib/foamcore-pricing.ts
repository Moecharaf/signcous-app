export type FoamcorePrintMode = "single" | "double";

export interface FoamcoreSizeOption {
  id: string;
  width: number;
  height: number;
}

export interface FoamcorePricingInput {
  width: number;
  height: number;
  quantity: number;
  printMode: FoamcorePrintMode;
  stepStakes: number;
  heavyDutyStakes: number;
  grommetsEnabled: boolean;
  grommetCount: number;
  gloss: boolean;
  contourCut: boolean;
  rush: boolean;
}

export interface FoamcorePricingResult {
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

export interface FoamcoreSheetPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export interface FoamcoreSheetLayout {
  count: number;
  placements: FoamcoreSheetPlacement[];
}

export const FOAMCORE_SHEET = {
  width: 48,
  height: 96,
};

// Signs365 uses fixed sheet counts for some sizes instead of pure max packing.
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

export const FOAMCORE_SIZE_OPTIONS: FoamcoreSizeOption[] = [
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
  // Retail values use the midpoint of the recommended ranges.
  { maxQty: 9, retailSingle: 90, retailDouble: 105 },
  { maxQty: 50, retailSingle: 72.5, retailDouble: 87.5 },
  { maxQty: Number.POSITIVE_INFINITY, retailSingle: 67.5, retailDouble: 77.5 },
];

export function formatFoamcoreSize(size: FoamcoreSizeOption): string {
  return `${size.width}\" x ${size.height}\"`;
}

function buildGridPlacements(
  originX: number,
  originY: number,
  regionWidth: number,
  regionHeight: number,
  signWidth: number,
  signHeight: number,
  rotated: boolean
): FoamcoreSheetPlacement[] {
  const columns = Math.floor(regionWidth / signWidth);
  const rows = Math.floor(regionHeight / signHeight);
  const placements: FoamcoreSheetPlacement[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      placements.push({
        x: originX + column * signWidth,
        y: originY + row * signHeight,
        width: signWidth,
        height: signHeight,
        rotated,
      });
    }
  }

  return placements;
}

function chooseBetterLayout(current: FoamcoreSheetLayout, candidate: FoamcoreSheetLayout): FoamcoreSheetLayout {
  return candidate.count > current.count ? candidate : current;
}

function getSizeKey(width: number, height: number): string {
  return `${Number(width)}x${Number(height)}`;
}

function getFixedSigns365Layout(width: number, height: number): FoamcoreSheetLayout | null {
  const sizeKey = getSizeKey(width, height);

  if (sizeKey === "18x36") {
    const placements: FoamcoreSheetPlacement[] = [
      { x: 0, y: 0, width: 18, height: 36, rotated: false },
      { x: 18, y: 0, width: 18, height: 36, rotated: false },
      { x: 0, y: 36, width: 36, height: 18, rotated: true },
      { x: 0, y: 54, width: 18, height: 36, rotated: false },
      { x: 18, y: 54, width: 18, height: 36, rotated: false },
    ];

    return {
      count: placements.length,
      placements: centerPlacementsInSheet(placements),
    };
  }

  if (sizeKey === "24x36") {
    const placements: FoamcoreSheetPlacement[] = [
      { x: 0, y: 0, width: 36, height: 24, rotated: true },
      { x: 0, y: 24, width: 36, height: 24, rotated: true },
      { x: 0, y: 48, width: 36, height: 24, rotated: true },
      { x: 0, y: 72, width: 36, height: 24, rotated: true },
    ];

    return {
      count: placements.length,
      placements: centerPlacementsInSheet(placements),
    };
  }

  return null;
}

function centerPlacementsInSheet(placements: FoamcoreSheetPlacement[]): FoamcoreSheetPlacement[] {
  if (placements.length === 0) return placements;

  const minX = Math.min(...placements.map((placement) => placement.x));
  const minY = Math.min(...placements.map((placement) => placement.y));
  const maxX = Math.max(...placements.map((placement) => placement.x + placement.width));
  const maxY = Math.max(...placements.map((placement) => placement.y + placement.height));

  const usedWidth = maxX - minX;
  const usedHeight = maxY - minY;

  const offsetX = (FOAMCORE_SHEET.width - usedWidth) / 2 - minX;
  const offsetY = (FOAMCORE_SHEET.height - usedHeight) / 2 - minY;

  return placements.map((placement) => ({
    ...placement,
    x: Number((placement.x + offsetX).toFixed(4)),
    y: Number((placement.y + offsetY).toFixed(4)),
  }));
}

export function getBestFoamcoreSheetLayout(width: number, height: number): FoamcoreSheetLayout {
  const fixedLayout = getFixedSigns365Layout(width, height);
  if (fixedLayout) return fixedLayout;

  const normalPlacements = buildGridPlacements(
    0,
    0,
    FOAMCORE_SHEET.width,
    FOAMCORE_SHEET.height,
    width,
    height,
    false
  );
  const rotatedPlacements = buildGridPlacements(
    0,
    0,
    FOAMCORE_SHEET.width,
    FOAMCORE_SHEET.height,
    height,
    width,
    true
  );

  const candidates: FoamcoreSheetLayout[] = [
    { count: normalPlacements.length, placements: normalPlacements },
    { count: rotatedPlacements.length, placements: rotatedPlacements },
  ];

  let best: FoamcoreSheetLayout =
    candidates[0].count >= candidates[1].count ? candidates[0] : candidates[1];

  const splitXCandidates = new Set<number>([0, FOAMCORE_SHEET.width]);
  const splitYCandidates = new Set<number>([0, FOAMCORE_SHEET.height]);

  for (let x = width; x < FOAMCORE_SHEET.width; x += width) splitXCandidates.add(Number(x.toFixed(4)));
  for (let x = height; x < FOAMCORE_SHEET.width; x += height) splitXCandidates.add(Number(x.toFixed(4)));
  for (let y = height; y < FOAMCORE_SHEET.height; y += height) splitYCandidates.add(Number(y.toFixed(4)));
  for (let y = width; y < FOAMCORE_SHEET.height; y += width) splitYCandidates.add(Number(y.toFixed(4)));

  for (const splitX of splitXCandidates) {
    const leftNormal = buildGridPlacements(0, 0, splitX, FOAMCORE_SHEET.height, width, height, false);
    const rightRotated = buildGridPlacements(
      splitX,
      0,
      FOAMCORE_SHEET.width - splitX,
      FOAMCORE_SHEET.height,
      height,
      width,
      true
    );
    best = chooseBetterLayout(best, {
      count: leftNormal.length + rightRotated.length,
      placements: [...leftNormal, ...rightRotated],
    });
    candidates.push({
      count: leftNormal.length + rightRotated.length,
      placements: [...leftNormal, ...rightRotated],
    });

    const leftRotated = buildGridPlacements(0, 0, splitX, FOAMCORE_SHEET.height, height, width, true);
    const rightNormal = buildGridPlacements(
      splitX,
      0,
      FOAMCORE_SHEET.width - splitX,
      FOAMCORE_SHEET.height,
      width,
      height,
      false
    );
    best = chooseBetterLayout(best, {
      count: leftRotated.length + rightNormal.length,
      placements: [...leftRotated, ...rightNormal],
    });
    candidates.push({
      count: leftRotated.length + rightNormal.length,
      placements: [...leftRotated, ...rightNormal],
    });
  }

  for (const splitY of splitYCandidates) {
    const topNormal = buildGridPlacements(0, 0, FOAMCORE_SHEET.width, splitY, width, height, false);
    const bottomRotated = buildGridPlacements(
      0,
      splitY,
      FOAMCORE_SHEET.width,
      FOAMCORE_SHEET.height - splitY,
      height,
      width,
      true
    );
    best = chooseBetterLayout(best, {
      count: topNormal.length + bottomRotated.length,
      placements: [...topNormal, ...bottomRotated],
    });
    candidates.push({
      count: topNormal.length + bottomRotated.length,
      placements: [...topNormal, ...bottomRotated],
    });

    const topRotated = buildGridPlacements(0, 0, FOAMCORE_SHEET.width, splitY, height, width, true);
    const bottomNormal = buildGridPlacements(
      0,
      splitY,
      FOAMCORE_SHEET.width,
      FOAMCORE_SHEET.height - splitY,
      width,
      height,
      false
    );
    best = chooseBetterLayout(best, {
      count: topRotated.length + bottomNormal.length,
      placements: [...topRotated, ...bottomNormal],
    });
    candidates.push({
      count: topRotated.length + bottomNormal.length,
      placements: [...topRotated, ...bottomNormal],
    });
  }

  const overrideCount = SIGNS365_SIGNS_PER_SHEET_OVERRIDES[getSizeKey(width, height)];
  if (overrideCount) {
    const exact = candidates.filter((candidate) => candidate.count === overrideCount);
    if (exact.length > 0) {
      // Prefer layout with fewer rotated signs when multiple exact matches exist.
      exact.sort((a, b) => {
        const aRotated = a.placements.filter((placement) => placement.rotated).length;
        const bRotated = b.placements.filter((placement) => placement.rotated).length;
        return aRotated - bRotated;
      });
      return {
        count: overrideCount,
        placements: centerPlacementsInSheet(exact[0].placements),
      };
    }
  }

  return {
    count: Math.max(1, best.count),
    placements: centerPlacementsInSheet(best.placements),
  };
}

export function getFoamcoreSignsPerSheet(width: number, height: number): number {
  return getBestFoamcoreSheetLayout(width, height).count;
}

export function getFoamcoreRetailSheetPrice(quantity: number, printMode: FoamcorePrintMode): number {
  const safeQuantity = Math.max(1, quantity);
  const tier = SHEET_TIERS.find((item) => safeQuantity <= item.maxQty) ?? SHEET_TIERS[SHEET_TIERS.length - 1];
  return printMode === "double" ? tier.retailDouble : tier.retailSingle;
}

export function calculateFoamcorePricing(input: FoamcorePricingInput): FoamcorePricingResult {
  const safeQuantity = Math.max(1, Math.floor(input.quantity));
  const signsPerSheet = getFoamcoreSignsPerSheet(input.width, input.height);
  const sheetsRequired = Math.max(1, Math.ceil(safeQuantity / signsPerSheet));

  const sheetPrice = getFoamcoreRetailSheetPrice(safeQuantity, input.printMode);
  const retailTotalCost = sheetsRequired * sheetPrice;
  const retailUnitPrice = retailTotalCost / safeQuantity;
  const baseSubtotal = retailUnitPrice * safeQuantity;

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
    sheetPrice: Number(sheetPrice.toFixed(2)),
    retailUnitPrice: Number(retailUnitPrice.toFixed(2)),
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

