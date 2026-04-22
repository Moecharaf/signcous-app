export type JBondMaterial = "3mm" | "6mm";
export type JBondPrintMode = "single" | "double";
export type JBondPricingMode = "sheet" | "sqin";

// ─── Size options (same 48"×96" sheet, same size list as Aluminum) ───────────

export interface JBondSizeOption {
  id: string;
  width: number;
  height: number;
}

export const JBOND_SHEET = { width: 48, height: 96 };

const SIGNS365_OVERRIDES: Record<string, number> = {
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

export const JBOND_SIZE_OPTIONS: JBondSizeOption[] = [
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

export function formatJBondSize(size: JBondSizeOption): string {
  return `${size.width}" x ${size.height}"`;
}

// ─── Sheet layout (same algorithm) ───────────────────────────────────────────

export interface JBondSheetPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export interface JBondSheetLayout {
  count: number;
  placements: JBondSheetPlacement[];
}

function buildGrid(
  ox: number, oy: number, rw: number, rh: number,
  sw: number, sh: number, rotated: boolean
): JBondSheetPlacement[] {
  const cols = Math.floor(rw / sw);
  const rows = Math.floor(rh / sh);
  const placements: JBondSheetPlacement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      placements.push({ x: ox + c * sw, y: oy + r * sh, width: sw, height: sh, rotated });
    }
  }
  return placements;
}

function pick(a: JBondSheetLayout, b: JBondSheetLayout): JBondSheetLayout {
  return b.count > a.count ? b : a;
}

function sizeKey(w: number, h: number): string { return `${Number(w)}x${Number(h)}`; }

function centerPlacements(ps: JBondSheetPlacement[]): JBondSheetPlacement[] {
  if (!ps.length) return ps;
  const minX = Math.min(...ps.map(p => p.x));
  const minY = Math.min(...ps.map(p => p.y));
  const maxX = Math.max(...ps.map(p => p.x + p.width));
  const maxY = Math.max(...ps.map(p => p.y + p.height));
  const ox = (JBOND_SHEET.width - (maxX - minX)) / 2 - minX;
  const oy = (JBOND_SHEET.height - (maxY - minY)) / 2 - minY;
  return ps.map(p => ({ ...p, x: Number((p.x + ox).toFixed(4)), y: Number((p.y + oy).toFixed(4)) }));
}

function fixedLayout(w: number, h: number): JBondSheetLayout | null {
  if (sizeKey(w, h) === "18x36") {
    const ps: JBondSheetPlacement[] = [
      { x: 0, y: 0,  width: 18, height: 36, rotated: false },
      { x: 18, y: 0, width: 18, height: 36, rotated: false },
      { x: 0, y: 36, width: 36, height: 18, rotated: true  },
      { x: 0, y: 54, width: 18, height: 36, rotated: false },
      { x: 18, y: 54, width: 18, height: 36, rotated: false },
    ];
    return { count: ps.length, placements: centerPlacements(ps) };
  }
  if (sizeKey(w, h) === "24x36") {
    const ps: JBondSheetPlacement[] = [
      { x: 0, y: 0,  width: 36, height: 24, rotated: true },
      { x: 0, y: 24, width: 36, height: 24, rotated: true },
      { x: 0, y: 48, width: 36, height: 24, rotated: true },
      { x: 0, y: 72, width: 36, height: 24, rotated: true },
    ];
    return { count: ps.length, placements: centerPlacements(ps) };
  }
  return null;
}

export function getBestJBondSheetLayout(w: number, h: number): JBondSheetLayout {
  const fixed = fixedLayout(w, h);
  if (fixed) return fixed;

  const W = JBOND_SHEET.width, H = JBOND_SHEET.height;
  const n = buildGrid(0, 0, W, H, w, h, false);
  const r = buildGrid(0, 0, W, H, h, w, true);
  let best: JBondSheetLayout = n.length >= r.length
    ? { count: n.length, placements: n }
    : { count: r.length, placements: r };
  const all: JBondSheetLayout[] = [{ count: n.length, placements: n }, { count: r.length, placements: r }];

  const xs = new Set([0, W]);
  const ys = new Set([0, H]);
  for (let x = w; x < W; x += w) xs.add(Number(x.toFixed(4)));
  for (let x = h; x < W; x += h) xs.add(Number(x.toFixed(4)));
  for (let y = h; y < H; y += h) ys.add(Number(y.toFixed(4)));
  for (let y = w; y < H; y += w) ys.add(Number(y.toFixed(4)));

  for (const sx of xs) {
    for (const [la, lb, lc, ld] of [
      [buildGrid(0,0,sx,H,w,h,false), buildGrid(sx,0,W-sx,H,h,w,true)],
      [buildGrid(0,0,sx,H,h,w,true),  buildGrid(sx,0,W-sx,H,w,h,false)],
    ]) {
      const c = { count: la.length + lb.length, placements: [...la, ...lb] };
      best = pick(best, c); all.push(c);
      void lc; void ld;
    }
  }

  for (const sy of ys) {
    for (const [la, lb] of [
      [buildGrid(0,0,W,sy,w,h,false), buildGrid(0,sy,W,H-sy,h,w,true)],
      [buildGrid(0,0,W,sy,h,w,true),  buildGrid(0,sy,W,H-sy,w,h,false)],
    ]) {
      const c = { count: la.length + lb.length, placements: [...la, ...lb] };
      best = pick(best, c); all.push(c);
    }
  }

  const override = SIGNS365_OVERRIDES[sizeKey(w, h)];
  if (override) {
    const exact = all.filter(c => c.count === override);
    if (exact.length) {
      exact.sort((a, b) => a.placements.filter(p => p.rotated).length - b.placements.filter(p => p.rotated).length);
      return { count: override, placements: centerPlacements(exact[0].placements) };
    }
  }

  return { count: Math.max(1, best.count), placements: centerPlacements(best.placements) };
}

// ─── Sheet pricing (flat rate — no tiers) ────────────────────────────────────

const SHEET_PRICES: Record<string, number> = {
  "3mm_single": 190,
  "3mm_double": 210,
  "6mm_single": 260,
  "6mm_double": 300,
};

export function getJBondSheetPrice(material: JBondMaterial, printMode: JBondPrintMode): number {
  return SHEET_PRICES[`${material}_${printMode}`];
}

// ─── Sq.in pricing ───────────────────────────────────────────────────────────

interface SqinRate { rate: number; min: number; }

const SQIN_RATES: Record<string, SqinRate> = {
  "3mm_single": { rate: 0.08, min: 10 },
  "3mm_double": { rate: 0.10, min: 12 },
  "6mm_single": { rate: 0.12, min: 16 },
  "6mm_double": { rate: 0.14, min: 18 },
};

export function getJBondSqinRate(material: JBondMaterial, printMode: JBondPrintMode): SqinRate {
  return SQIN_RATES[`${material}_${printMode}`];
}

// ─── Unified pricing result ──────────────────────────────────────────────────

export interface JBondPricingResult {
  mode: JBondPricingMode;
  // Sheet mode
  signsPerSheet: number;
  sheetsRequired: number;
  sheetPrice: number;
  // Sqin mode
  sqInches: number;
  ratePerSqIn: number;
  minPrice: number;
  pricePerSign: number;
  // Common
  baseSubtotal: number;
  retailUnitPrice: number;
  contourCutFee: number;
  roundedCornersFee: number;
  rushFee: number;
  unitPrice: number;
  totalPrice: number;
}

// ─── Sheet pricing calculation ───────────────────────────────────────────────

export interface JBondSheetPricingInput {
  width: number;
  height: number;
  quantity: number;
  material: JBondMaterial;
  printMode: JBondPrintMode;
  contourCut: boolean;
  roundedCorners: boolean;
  rush: boolean;
}

export function calculateJBondSheetPricing(input: JBondSheetPricingInput): JBondPricingResult {
  const qty = Math.max(1, Math.floor(input.quantity));
  const signsPerSheet = getBestJBondSheetLayout(input.width, input.height).count;
  const sheetsRequired = Math.max(1, Math.ceil(qty / signsPerSheet));
  const sheetPrice = getJBondSheetPrice(input.material, input.printMode);
  const retailUnitPrice = (sheetsRequired * sheetPrice) / qty;
  const baseSubtotal = retailUnitPrice * qty;

  const contourCutFee = input.contourCut ? baseSubtotal * 0.1 : 0;
  const roundedCornersFee = input.roundedCorners ? 15 : 0;
  const preRush = baseSubtotal + contourCutFee + roundedCornersFee;
  const rushFee = input.rush ? preRush * 1.0 : 0;
  const totalPrice = preRush + rushFee;

  return {
    mode: "sheet",
    signsPerSheet, sheetsRequired,
    sheetPrice: Number(sheetPrice.toFixed(2)),
    sqInches: 0, ratePerSqIn: 0, minPrice: 0, pricePerSign: 0,
    baseSubtotal: Number(baseSubtotal.toFixed(2)),
    retailUnitPrice: Number(retailUnitPrice.toFixed(2)),
    contourCutFee: Number(contourCutFee.toFixed(2)),
    roundedCornersFee: Number(roundedCornersFee.toFixed(2)),
    rushFee: Number(rushFee.toFixed(2)),
    unitPrice: Number((totalPrice / qty).toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
}

// ─── Sq.in pricing calculation ───────────────────────────────────────────────

export interface JBondSqinPricingInput {
  customWidth: number;
  customHeight: number;
  quantity: number;
  material: JBondMaterial;
  printMode: JBondPrintMode;
  contourCut: boolean;
  roundedCorners: boolean;
  rush: boolean;
}

export function calculateJBondSqinPricing(input: JBondSqinPricingInput): JBondPricingResult {
  const qty = Math.max(1, Math.floor(input.quantity));
  const sqInches = Math.max(0, input.customWidth) * Math.max(0, input.customHeight);
  const { rate, min } = getJBondSqinRate(input.material, input.printMode);
  const pricePerSign = Math.max(min, sqInches * rate);
  const baseSubtotal = pricePerSign * qty;

  const contourCutFee = input.contourCut ? baseSubtotal * 0.1 : 0;
  const roundedCornersFee = input.roundedCorners ? 15 : 0;
  const preRush = baseSubtotal + contourCutFee + roundedCornersFee;
  const rushFee = input.rush ? preRush * 1.0 : 0;
  const totalPrice = preRush + rushFee;

  return {
    mode: "sqin",
    signsPerSheet: 0, sheetsRequired: 0, sheetPrice: 0,
    sqInches: Number(sqInches.toFixed(2)),
    ratePerSqIn: rate,
    minPrice: min,
    pricePerSign: Number(pricePerSign.toFixed(2)),
    baseSubtotal: Number(baseSubtotal.toFixed(2)),
    retailUnitPrice: Number(pricePerSign.toFixed(2)),
    contourCutFee: Number(contourCutFee.toFixed(2)),
    roundedCornersFee: Number(roundedCornersFee.toFixed(2)),
    rushFee: Number(rushFee.toFixed(2)),
    unitPrice: Number((totalPrice / qty).toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
}
