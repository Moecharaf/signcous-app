"use client";

import { useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  JBOND_SHEET,
  JBOND_SIZE_OPTIONS,
  calculateJBondSheetPricing,
  calculateJBondSqinPricing,
  formatJBondSize,
  getBestJBondSheetLayout,
  type JBondMaterial,
  type JBondPricingMode,
  type JBondPrintMode,
} from "@/lib/jbond-pricing";

interface JBondBuilderProps {
  productId?: number;
  productName?: string;
}

interface BlockUpload {
  fileUrl: string;
  fileName: string;
  blobUrl: string | null;
}

const SLOT_COLORS = [
  "bg-blue-400", "bg-emerald-400", "bg-violet-400", "bg-amber-400",
  "bg-pink-400", "bg-cyan-400", "bg-orange-400", "bg-teal-400",
];

function formatPrice(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

export default function JBondBuilder({ productId = 0, productName = "JBOND" }: JBondBuilderProps) {
  const cart = useCart();

  // ── mode (sheet vs sq.in) ──
  const [pricingMode, setPricingMode] = useState<JBondPricingMode>("sheet");

  // ── sheet mode state ──
  const [sizeId, setSizeId] = useState(JBOND_SIZE_OPTIONS[0].id);
  const [imageCount, setImageCount] = useState(1);
  const [blockUploads, setBlockUploads] = useState<Record<number, BlockUpload>>({});
  const [uploadingBlock, setUploadingBlock] = useState<number | null>(null);
  const [blockUploadErrors, setBlockUploadErrors] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── sqin mode state ──
  const [customWidth, setCustomWidth] = useState(24);
  const [customHeight, setCustomHeight] = useState(18);
  const [sqinUpload, setSqinUpload] = useState<BlockUpload | null>(null);
  const [sqinUploading, setSqinUploading] = useState(false);
  const [sqinUploadError, setSqinUploadError] = useState<string | null>(null);
  const sqinFileRef = useRef<HTMLInputElement | null>(null);

  // ── shared state ──
  const [material, setMaterial] = useState<JBondMaterial>("3mm");
  const [printMode, setPrintMode] = useState<JBondPrintMode>("single");
  const [quantity, setQuantity] = useState(1);
  const [contourCut, setContourCut] = useState(false);
  const [roundedCorners, setRoundedCorners] = useState(false);
  const [rush, setRush] = useState(false);
  const [added, setAdded] = useState(false);

  // ── derived ──
  const activeSize = useMemo(
    () => JBOND_SIZE_OPTIONS.find(s => s.id === sizeId) ?? JBOND_SIZE_OPTIONS[0],
    [sizeId]
  );

  const pricing = useMemo(() => {
    if (pricingMode === "sheet") {
      return calculateJBondSheetPricing({
        width: activeSize.width,
        height: activeSize.height,
        quantity,
        material,
        printMode,
        contourCut,
        roundedCorners,
        rush,
      });
    }
    return calculateJBondSqinPricing({
      customWidth,
      customHeight,
      quantity,
      material,
      printMode,
      contourCut,
      roundedCorners,
      rush,
    });
  }, [pricingMode, activeSize, customWidth, customHeight, quantity, material, printMode, contourCut, roundedCorners, rush]);

  const sheetLayout = useMemo(
    () => pricingMode === "sheet" ? getBestJBondSheetLayout(activeSize.width, activeSize.height) : null,
    [pricingMode, activeSize]
  );

  const maxImages = sheetLayout?.count ?? 1;
  const safeImageCount = pricingMode === "sheet" ? Math.min(imageCount, maxImages) : 1;

  // ── artwork upload helpers ──
  async function uploadFile(file: File): Promise<{ fileUrl: string; fileName: string; blobUrl: string | null } | string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-artwork", { method: "POST", body: formData });
    const ct = res.headers.get("content-type") ?? "";
    let data: { fileUrl?: string; originalName?: string; error?: string } = {};
    if (ct.includes("application/json")) {
      data = await res.json();
    } else {
      const raw = await res.text();
      data = { error: res.status === 413 ? "File too large." : `Upload failed (${res.status}). ${raw.slice(0, 100)}` };
    }
    if (!res.ok || !data.fileUrl) return data.error ?? "Upload failed.";
    const blobUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    return { fileUrl: data.fileUrl!, fileName: data.originalName ?? file.name, blobUrl };
  }

  async function uploadBlock(blockIndex: number, file: File) {
    setUploadingBlock(blockIndex);
    setBlockUploadErrors(p => { const n = { ...p }; delete n[blockIndex]; return n; });
    try {
      const result = await uploadFile(file);
      if (typeof result === "string") {
        setBlockUploadErrors(p => ({ ...p, [blockIndex]: result }));
      } else {
        setBlockUploads(p => ({ ...p, [blockIndex]: result }));
      }
    } catch {
      setBlockUploadErrors(p => ({ ...p, [blockIndex]: "Upload failed. Please try again." }));
    } finally {
      setUploadingBlock(null);
    }
  }

  async function uploadSqin(file: File) {
    setSqinUploading(true);
    setSqinUploadError(null);
    try {
      const result = await uploadFile(file);
      if (typeof result === "string") setSqinUploadError(result);
      else setSqinUpload(result);
    } catch {
      setSqinUploadError("Upload failed. Please try again.");
    } finally {
      setSqinUploading(false);
    }
  }

  function handleBlockFileChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void uploadBlock(i, f);
    e.target.value = "";
  }

  function handleSqinFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void uploadSqin(f);
    e.target.value = "";
  }

  function removeBlock(i: number) {
    setBlockUploads(p => {
      const n = { ...p };
      if (n[i]?.blobUrl) URL.revokeObjectURL(n[i].blobUrl!);
      delete n[i]; return n;
    });
  }

  function removeSqin() {
    if (sqinUpload?.blobUrl) URL.revokeObjectURL(sqinUpload.blobUrl);
    setSqinUpload(null);
  }

  // ── add to cart ──
  function addToCart() {
    const qty = Math.max(1, Math.floor(quantity));
    const materialLabel = `JBond ${material} ${printMode === "single" ? "Single-Sided" : "Double-Sided"}`;

    let uploadedFileUrls: string[] = [];
    let uploadedFileUrl: string | null = null;
    let uploadedFileName: string | null = null;

    if (pricingMode === "sheet") {
      uploadedFileUrls = Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.fileUrl ?? "").filter(Boolean);
      uploadedFileUrl = uploadedFileUrls[0] ?? null;
      uploadedFileName = blockUploads[0]?.fileName ?? null;
    } else {
      uploadedFileUrl = sqinUpload?.fileUrl ?? null;
      uploadedFileName = sqinUpload?.fileName ?? null;
      if (uploadedFileUrl) uploadedFileUrls = [uploadedFileUrl];
    }

    const w = pricingMode === "sheet" ? activeSize.width : customWidth;
    const h = pricingMode === "sheet" ? activeSize.height : customHeight;

    cart.addItem({
      productId,
      productName,
      width: w,
      height: h,
      unit: "inches",
      quantity: qty,
      material: materialLabel,
      doubleSided: printMode === "double",
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl,
      uploadedFileName,
      uploadedFileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
      customOptions: {
        custom_pricing_mode: pricingMode === "sheet" ? "Sheet Pricing" : "Custom Size (Sq.In)",
        custom_sheet_size: `${JBOND_SHEET.width}" x ${JBOND_SHEET.height}"`,
        custom_sign_size: pricingMode === "sheet" ? formatJBondSize(activeSize) : `${customWidth}" x ${customHeight}"`,
        custom_material_thickness: `JBond ${material}`,
        custom_print_mode: printMode === "single" ? "Single-Sided" : "Double-Sided",
        ...(pricingMode === "sheet"
          ? {
              custom_signs_per_sheet: String(pricing.signsPerSheet),
              custom_sheets_required: String(pricing.sheetsRequired),
              custom_image_count: String(safeImageCount),
            }
          : {
              custom_sq_inches: String(pricing.sqInches),
              custom_rate_per_sqin: `$${pricing.ratePerSqIn}/sq.in`,
            }),
        custom_contour_cut: contourCut ? "yes" : "no",
        custom_rounded_corners: roundedCorners ? "yes ($15 setup)" : "no",
        custom_rush_surcharge_mode: rush ? "+100%" : "none",
      },
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const uploadedBlockCount = Object.keys(blockUploads).filter(k => Number(k) < safeImageCount).length;

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f0f4f8_0%,#e8edf2_55%,#dde4ec_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">

        {/* Header */}
        <div className="mb-3 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Rigid Product — Composite Panel</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">JBond Configurator</h1>
            <p className="mt-1 text-sm text-zinc-600">Standard sizes (sheet pricing) or custom dimensions (sq.in pricing).</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-2 text-right">
            <div className="text-xs uppercase tracking-[0.14em] text-sky-700">Live Total</div>
            <div className="text-3xl font-semibold text-zinc-900">{formatPrice(pricing.totalPrice)}</div>
            <div className="text-xs text-sky-700/80">
              {quantity} sign{quantity !== 1 ? "s" : ""}
              {pricingMode === "sheet" ? ` · ${pricing.sheetsRequired} sheet${pricing.sheetsRequired !== 1 ? "s" : ""}` : ` · ${pricing.sqInches} sq.in`}
            </div>
          </div>
        </div>

        {/* ── Pricing mode selector ── */}
        <div className="mb-3 flex gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setPricingMode("sheet")}
            className={`flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-[0.12em] transition ${
              pricingMode === "sheet"
                ? "bg-zinc-900 text-white shadow"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            Sheet Pricing
            <span className="ml-2 text-[10px] font-normal opacity-70">Standard sizes</span>
          </button>
          <button
            type="button"
            onClick={() => setPricingMode("sqin")}
            className={`flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-[0.12em] transition ${
              pricingMode === "sqin"
                ? "bg-zinc-900 text-white shadow"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            Custom Size
            <span className="ml-2 text-[10px] font-normal opacity-70">Sq.in pricing</span>
          </button>
        </div>

        <div className="grid gap-3">

          {/* ══ SHEET MODE ══════════════════════════════════════════════════════ */}
          {pricingMode === "sheet" && sheetLayout && (
            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 px-4 py-3">
                <div className="text-sm font-medium text-zinc-700">
                  Sheet #1 / {JBOND_SHEET.width}&quot; × {JBOND_SHEET.height}&quot; / Front Side — {sheetLayout.count} signs per sheet
                </div>
              </div>

              <div
                className="relative h-[calc(100vh-320px)] min-h-[520px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
              >
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-zinc-500 bg-[#f8f8f6]"
                  style={{ width: 220, height: 440 }}
                >
                  {sheetLayout.placements.map((placement, index) => {
                    const slotIndex = index < safeImageCount ? index : null;
                    const upload = slotIndex !== null ? blockUploads[slotIndex] : null;
                    const colorClass = slotIndex !== null ? SLOT_COLORS[slotIndex % SLOT_COLORS.length] : "";
                    return (
                      <button
                        key={`cell-${index}`}
                        type="button"
                        disabled={slotIndex === null}
                        onClick={() => { if (slotIndex !== null) fileInputRefs.current[slotIndex]?.click(); }}
                        className={`absolute overflow-hidden border ${
                          slotIndex !== null ? "cursor-pointer hover:opacity-85" : "cursor-default"
                        } ${upload ? "border-emerald-500" : "border-zinc-400 bg-[#f0f0ee]"}`}
                        style={{
                          left: `${(placement.x / JBOND_SHEET.width) * 100}%`,
                          top: `${(placement.y / JBOND_SHEET.height) * 100}%`,
                          width: `${(placement.width / JBOND_SHEET.width) * 100}%`,
                          height: `${(placement.height / JBOND_SHEET.height) * 100}%`,
                        }}
                      >
                        {upload?.blobUrl ? (
                          <div className="flex h-full w-full items-center justify-center bg-white p-[1px]">
                            <img src={upload.blobUrl} alt="" className="h-full w-full object-contain" />
                          </div>
                        ) : slotIndex !== null ? (
                          <div className={`flex h-full w-full items-center justify-center ${colorClass} opacity-30`}>
                            <span className="text-[7px] font-bold text-zinc-700">
                              {uploadingBlock === slotIndex ? "…" : slotIndex + 1}
                            </span>
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute left-1/2 top-[calc(50%-236px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Top of Sheet</div>
                <div className="pointer-events-none absolute left-1/2 top-[calc(50%+232px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Front Side</div>
                <div className="pointer-events-none absolute left-[calc(50%-128px)] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Left</div>
                <div className="pointer-events-none absolute left-[calc(50%+128px)] top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Right</div>
              </div>

              {/* Sheet controls bar */}
              <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-4 xl:grid-cols-9">
                <ControlBox title="Images">
                  <input
                    type="number" min={1} max={maxImages} value={safeImageCount}
                    onChange={e => setImageCount(Math.min(maxImages, Math.max(1, Number(e.target.value) || 1)))}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </ControlBox>
                <ControlBox title="Size" className="md:col-span-2">
                  <select value={sizeId} onChange={e => setSizeId(e.target.value)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
                    {JBOND_SIZE_OPTIONS.map(s => (
                      <option key={s.id} value={s.id}>{formatJBondSize(s)}</option>
                    ))}
                  </select>
                </ControlBox>
                <ControlBox title="Thickness">
                  <select value={material} onChange={e => setMaterial(e.target.value as JBondMaterial)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
                    <option value="3mm">3mm</option>
                    <option value="6mm">6mm</option>
                  </select>
                </ControlBox>
                <ControlBox title="Print Sides">
                  <select value={printMode} onChange={e => setPrintMode(e.target.value as JBondPrintMode)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                  </select>
                </ControlBox>
                <ControlBox title="Rounded Corners">
                  <button type="button" onClick={() => setRoundedCorners(p => !p)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
                    {roundedCorners ? "Yes" : "No"}
                  </button>
                </ControlBox>
                <ControlBox title="Qty / Add" className="md:col-span-2">
                  <div className="grid grid-cols-[68px_1fr] gap-1">
                    <input type="number" min={1} value={quantity}
                      onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="h-9 rounded border border-zinc-300 px-2 text-sm"
                    />
                    <Button className="h-9 rounded bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500" onClick={addToCart}>
                      {added ? "Added" : "Add"}
                    </Button>
                  </div>
                </ControlBox>
              </div>
            </section>
          )}

          {/* ══ SQ.IN MODE ══════════════════════════════════════════════════════ */}
          {pricingMode === "sqin" && (
            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 px-4 py-3">
                <div className="text-sm font-medium text-zinc-700">Custom Dimensions — Sq.In Pricing</div>
              </div>

              <div
                className="relative flex h-64 items-center justify-center overflow-hidden bg-[#fafaf9]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
              >
                {sqinUpload?.blobUrl ? (
                  <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded border-2 border-dashed border-zinc-400 bg-white">
                    <img src={sqinUpload.blobUrl} alt="preview" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => sqinFileRef.current?.click()}
                    className="flex h-44 w-60 flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-zinc-300 bg-white text-zinc-400 hover:border-sky-400 hover:text-sky-500"
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs font-semibold">
                      {sqinUploading ? "Uploading…" : `${customWidth}" × ${customHeight}" · Click to upload artwork`}
                    </span>
                    {pricing.sqInches > 0 && (
                      <span className="text-[10px] text-zinc-400">{pricing.sqInches} sq.in · {formatPrice(pricing.pricePerSign)}/sign</span>
                    )}
                  </button>
                )}
                {sqinUpload && (
                  <button type="button" onClick={removeSqin}
                    className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-500 shadow hover:text-rose-500">
                    ✕ Remove
                  </button>
                )}
                {sqinUploadError && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-rose-50 px-3 py-1 text-[11px] text-rose-700 shadow">
                    {sqinUploadError}
                  </div>
                )}
              </div>

              <input
                ref={sqinFileRef}
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                className="hidden"
                onChange={handleSqinFileChange}
                disabled={sqinUploading}
              />

              {/* Sq.in controls bar */}
              <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-4 xl:grid-cols-9">
                <ControlBox title="Width (in)">
                  <input type="number" min={1} step={0.5} value={customWidth}
                    onChange={e => setCustomWidth(Math.max(0.5, Number(e.target.value) || 1))}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </ControlBox>
                <ControlBox title="Height (in)">
                  <input type="number" min={1} step={0.5} value={customHeight}
                    onChange={e => setCustomHeight(Math.max(0.5, Number(e.target.value) || 1))}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </ControlBox>
                <ControlBox title="Thickness">
                  <select value={material} onChange={e => setMaterial(e.target.value as JBondMaterial)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
                    <option value="3mm">3mm</option>
                    <option value="6mm">6mm</option>
                  </select>
                </ControlBox>
                <ControlBox title="Print Sides">
                  <select value={printMode} onChange={e => setPrintMode(e.target.value as JBondPrintMode)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                  </select>
                </ControlBox>
                <ControlBox title="Rounded Corners">
                  <button type="button" onClick={() => setRoundedCorners(p => !p)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
                    {roundedCorners ? "Yes" : "No"}
                  </button>
                </ControlBox>
                <ControlBox title="Qty / Add" className="md:col-span-2">
                  <div className="grid grid-cols-[68px_1fr] gap-1">
                    <input type="number" min={1} value={quantity}
                      onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="h-9 rounded border border-zinc-300 px-2 text-sm"
                    />
                    <Button className="h-9 rounded bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500" onClick={addToCart}>
                      {added ? "Added" : "Add"}
                    </Button>
                  </div>
                </ControlBox>
              </div>
            </section>
          )}

          {/* ── Aside: breakdown + add-ons + artwork ─────────────────────────── */}
          <aside className="space-y-3">
            {/* Pricing breakdown */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pricing Breakdown</div>
              <div className="mt-3 space-y-2 text-sm">
                {pricingMode === "sheet" ? (
                  <>
                    <Row label="Signs / Sheet" value={String(pricing.signsPerSheet)} />
                    <Row label="Sheets Needed" value={String(pricing.sheetsRequired)} />
                    <Row label="Price / Sheet" value={formatPrice(pricing.sheetPrice)} />
                  </>
                ) : (
                  <>
                    <Row label="Dimensions" value={`${customWidth}" × ${customHeight}"`} />
                    <Row label="Sq. Inches" value={`${pricing.sqInches} sq.in`} />
                    <Row label="Rate" value={`$${pricing.ratePerSqIn}/sq.in (min $${pricing.minPrice})`} />
                    <Row label="Price / Sign" value={formatPrice(pricing.pricePerSign)} />
                  </>
                )}
                <Row label="Base Subtotal" value={formatPrice(pricing.baseSubtotal)} />
                <Row label="Contour Cut (+10%)" value={formatPrice(pricing.contourCutFee)} />
                <Row label="Rounded Corners" value={formatPrice(pricing.roundedCornersFee)} />
                <Row label="Rush (+100%)" value={formatPrice(pricing.rushFee)} />
                <div className="my-2 border-t border-zinc-200" />
                <Row label="Unit Price" value={formatPrice(pricing.unitPrice)} strong />
                <Row label="Order Total" value={formatPrice(pricing.totalPrice)} strong className="text-sky-700" />
              </div>
            </div>

            {/* Add-ons */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Add-ons</div>
              <div className="mt-3 space-y-3 text-sm">
                <ToggleField label="Contour Cut (+10%)" value={contourCut} onChange={setContourCut} />
                <ToggleField label="Rounded Corners ($15 setup)" value={roundedCorners} onChange={setRoundedCorners} />
                <ToggleField label="Rush (+100%)" value={rush} onChange={setRush} />
              </div>
            </div>

            {/* Artwork — sheet mode (per-block) */}
            {pricingMode === "sheet" && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Artwork ({uploadedBlockCount}/{safeImageCount} uploaded)
                  </div>
                  {uploadedBlockCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {uploadedBlockCount} ready
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {safeImageCount === 1
                    ? "Upload 1 artwork for all signs."
                    : `Upload up to ${safeImageCount} artworks — one per block. Click a block on the sheet or use the slots below.`}
                </p>
                {Array.from({ length: safeImageCount }).map((_, i) => (
                  <input
                    key={`file-input-${i}`}
                    ref={el => { fileInputRefs.current[i] = el; }}
                    type="file"
                    accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                    className="hidden"
                    onChange={e => handleBlockFileChange(i, e)}
                    disabled={uploadingBlock !== null}
                  />
                ))}
                <div className="mt-3 space-y-2">
                  {Array.from({ length: safeImageCount }).map((_, i) => {
                    const upload = blockUploads[i];
                    const error = blockUploadErrors[i];
                    const isUploading = uploadingBlock === i;
                    const color = SLOT_COLORS[i % SLOT_COLORS.length];
                    return (
                      <div key={`slot-${i}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm ${color} text-[10px] font-bold text-white`}>
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1 text-xs font-medium text-zinc-700">Block {i + 1}</div>
                          {upload ? (
                            <div className="flex items-center gap-1">
                              <span className="max-w-[100px] truncate text-[10px] text-emerald-700">{upload.fileName}</span>
                              <button type="button" onClick={() => removeBlock(i)}
                                className="rounded px-1 text-[10px] text-zinc-400 hover:text-rose-500">✕</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => fileInputRefs.current[i]?.click()} disabled={isUploading}
                              className="shrink-0 rounded border border-dashed border-zinc-300 px-2 py-1 text-[10px] text-zinc-500 hover:border-sky-400 hover:text-sky-500 disabled:opacity-50">
                              {isUploading ? "Uploading…" : "+ Upload"}
                            </button>
                          )}
                        </div>
                        {upload?.blobUrl && (
                          <img src={upload.blobUrl} alt={upload.fileName} className="mt-2 h-16 w-full rounded object-contain" />
                        )}
                        {upload && !upload.blobUrl && (
                          <div className="mt-1 rounded bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">✓ {upload.fileName}</div>
                        )}
                        {error && (
                          <div className="mt-1 rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700">{error}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-zinc-400">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</p>
              </div>
            )}

            {/* Artwork — sqin mode (single) */}
            {pricingMode === "sqin" && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Artwork</div>
                <p className="mt-1 text-xs text-zinc-500">Upload your artwork file for this custom sign.</p>
                <div className="mt-3">
                  {sqinUpload ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-700">✓ {sqinUpload.fileName}</span>
                        <button type="button" onClick={removeSqin}
                          className="text-[10px] text-zinc-400 hover:text-rose-500">✕ Remove</button>
                      </div>
                      {sqinUpload.blobUrl && (
                        <img src={sqinUpload.blobUrl} alt={sqinUpload.fileName} className="mt-2 h-20 w-full rounded object-contain" />
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={() => sqinFileRef.current?.click()} disabled={sqinUploading}
                      className="w-full rounded-lg border border-dashed border-zinc-300 py-4 text-center text-xs text-zinc-500 hover:border-sky-400 hover:text-sky-500 disabled:opacity-50">
                      {sqinUploading ? "Uploading…" : "+ Upload Artwork"}
                    </button>
                  )}
                  {sqinUploadError && (
                    <div className="mt-2 rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700">{sqinUploadError}</div>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-zinc-400">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function ControlBox({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-2 ${className ?? ""}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-semibold text-zinc-900" : "text-zinc-700"} ${className ?? ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="flex h-9 w-full items-center justify-between rounded border border-zinc-300 bg-white px-3 text-sm">
      <span>{label}</span>
      <span className={value ? "text-emerald-600" : "text-zinc-500"}>{value ? "Yes" : "No"}</span>
    </button>
  );
}
