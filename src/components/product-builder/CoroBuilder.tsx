"use client";

import { useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  CORO_SHEET,
  CORO_SIZE_OPTIONS,
  calculateCoroPricing,
  formatCoroSize,
  getBestSheetLayout,
  type CoroMaterial,
  type CoroPrintMode,
} from "@/lib/coro-pricing";

interface CoroBuilderProps {
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

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function CoroBuilder({ productId = 13, productName = "CORO" }: CoroBuilderProps) {
  const cart = useCart();

  const [sizeId, setSizeId] = useState(CORO_SIZE_OPTIONS[0].id);
  const [material, setMaterial] = useState<CoroMaterial>("4mm");
  const [printMode, setPrintMode] = useState<CoroPrintMode>("single");
  const [quantity, setQuantity] = useState(1);

  const [stepStakes, setStepStakes] = useState(0);
  const [heavyDutyStakes, setHeavyDutyStakes] = useState(0);
  const [grommetsEnabled, setGrommetsEnabled] = useState(false);
  const [grommetCount, setGrommetCount] = useState(4);
  const [gloss, setGloss] = useState(false);
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);

  // Per-block upload state
  const [imageCount, setImageCount] = useState(1);
  const [blockUploads, setBlockUploads] = useState<Record<number, BlockUpload>>({});
  const [uploadingBlock, setUploadingBlock] = useState<number | null>(null);
  const [blockUploadErrors, setBlockUploadErrors] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [added, setAdded] = useState(false);

  const activeSize = useMemo(
    () => CORO_SIZE_OPTIONS.find((size) => size.id === sizeId) ?? CORO_SIZE_OPTIONS[0],
    [sizeId]
  );

  const pricing = useMemo(
    () =>
      calculateCoroPricing({
        width: activeSize.width,
        height: activeSize.height,
        quantity,
        material,
        printMode,
        stepStakes,
        heavyDutyStakes,
        grommetsEnabled,
        grommetCount,
        gloss,
        contourCut,
        rush,
      }),
    [
      activeSize.width,
      activeSize.height,
      quantity,
      material,
      printMode,
      stepStakes,
      heavyDutyStakes,
      grommetsEnabled,
      grommetCount,
      gloss,
      contourCut,
      rush,
    ]
  );

  const sheetLayout = useMemo(
    () => getBestSheetLayout(activeSize.width, activeSize.height),
    [activeSize.height, activeSize.width]
  );

    const maxImages = sheetLayout.count;
    const safeImageCount = Math.min(imageCount, maxImages);

    async function uploadArtworkForBlock(blockIndex: number, file: File) {
      setUploadingBlock(blockIndex);
      setBlockUploadErrors((prev) => {
        const n = { ...prev };
        delete n[blockIndex];
        return n;
      });
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload-artwork", { method: "POST", body: formData });
        const contentType = response.headers.get("content-type") ?? "";
        let data: { fileUrl?: string; originalName?: string; error?: string } = {};
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const raw = await response.text();
          data = {
            error:
              response.status === 413
                ? "Upload rejected: file too large. Ask support to increase Nginx client_max_body_size."
                : `Upload failed (${response.status}). ${raw.slice(0, 120)}`,
          };
        }
        if (!response.ok || !data.fileUrl) {
          setBlockUploadErrors((prev) => ({ ...prev, [blockIndex]: data.error ?? "Upload failed." }));
          return;
        }
        let blobUrl: string | null = null;
        if (file.type.startsWith("image/")) {
          blobUrl = URL.createObjectURL(file);
        }
        setBlockUploads((prev) => ({
          ...prev,
          [blockIndex]: { fileUrl: data.fileUrl!, fileName: data.originalName ?? file.name, blobUrl },
        }));
      } catch {
        setBlockUploadErrors((prev) => ({ ...prev, [blockIndex]: "Upload failed. Please try again." }));
      } finally {
        setUploadingBlock(null);
      }
    }

    function handleFileChange(blockIndex: number, event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      if (file) void uploadArtworkForBlock(blockIndex, file);
      event.target.value = "";
    }

    function removeBlockUpload(blockIndex: number) {
      setBlockUploads((prev) => {
        const n = { ...prev };
        if (n[blockIndex]?.blobUrl) URL.revokeObjectURL(n[blockIndex].blobUrl!);
        delete n[blockIndex];
        return n;
      });
    }

  function addToCart() {
    const safeQty = Math.max(1, Math.floor(quantity));
    const materialLabel = `${productName} ${material} ${printMode === "single" ? "Single-Sided" : "Double-Sided"}`;
    const uploadedFileUrls = Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.fileUrl ?? "").filter(Boolean);

    cart.addItem({
      productId,
      productName,
      width: activeSize.width,
      height: activeSize.height,
      unit: "inches",
      quantity: safeQty,
      material: materialLabel,
      doubleSided: printMode === "double",
      grommets: grommetsEnabled,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl: uploadedFileUrls[0] ?? null,
      uploadedFileName: blockUploads[0]?.fileName ?? null,
      uploadedFileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
      customOptions: {
        custom_sheet_size: `${CORO_SHEET.width}\" x ${CORO_SHEET.height}\"`,
        custom_sign_size: formatCoroSize(activeSize),
        custom_signs_per_sheet: String(pricing.signsPerSheet),
        custom_sheets_required: String(pricing.sheetsRequired),
        custom_material_thickness: material,
        custom_print_mode: printMode === "single" ? "Single-Sided" : "Double-Sided",
        custom_step_stakes: String(stepStakes),
        custom_heavy_duty_stakes: String(heavyDutyStakes),
        custom_grommet_count: grommetsEnabled ? String(grommetCount) : "0",
        custom_gloss: gloss ? "yes" : "no",
        custom_contour_cut: contourCut ? "yes" : "no",
        custom_rush_surcharge_mode: rush ? "+120%" : "none",
        custom_image_count: String(safeImageCount),
      },
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

    const uploadedCount = Object.keys(blockUploads).filter((k) => Number(k) < safeImageCount).length;

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="mb-3 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Rigid Product</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">CORO Configurator</h1>
            <p className="mt-1 text-sm text-zinc-600">Signs365-style sheet layout with per-block artwork upload.</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-right">
            <div className="text-xs uppercase tracking-[0.14em] text-emerald-700">Live Total</div>
            <div className="text-3xl font-semibold text-zinc-900">{formatPrice(pricing.totalPrice)}</div>
            <div className="text-xs text-emerald-800/80">{quantity} sign{quantity !== 1 ? "s" : ""} · {pricing.sheetsRequired} sheet{pricing.sheetsRequired !== 1 ? "s" : ""}</div>
          </div>
        </div>

        <div className="grid gap-3">
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="text-sm font-medium text-zinc-700">
                Sheet #1 / {CORO_SHEET.width}&quot; × {CORO_SHEET.height}&quot; / Front Side — {sheetLayout.count} signs per sheet
              </div>
            </div>

            <div className="relative h-[calc(100vh-290px)] min-h-[560px] overflow-hidden rounded-b-2xl bg-[#f7f7f7]">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-zinc-500 bg-white"
                style={{
                  width: 220,
                  height: 440,
                }}
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
                      } ${upload ? "border-emerald-500" : "border-blue-400 bg-zinc-50"}`}
                      style={{
                        left: `${(placement.x / CORO_SHEET.width) * 100}%`,
                        top: `${(placement.y / CORO_SHEET.height) * 100}%`,
                        width: `${(placement.width / CORO_SHEET.width) * 100}%`,
                        height: `${(placement.height / CORO_SHEET.height) * 100}%`,
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

              <div className="pointer-events-none absolute left-1/2 top-[calc(50%-236px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Top of Sheet
              </div>
              <div className="pointer-events-none absolute left-1/2 top-[calc(50%+232px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Front Side
              </div>
              <div className="pointer-events-none absolute left-[calc(50%-128px)] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Left
              </div>
              <div className="pointer-events-none absolute left-[calc(50%+128px)] top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Right
              </div>
            </div>

            <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-4 xl:grid-cols-8">
              <ControlBox title="Images">
                <input
                  type="number"
                  min={1}
                  max={maxImages}
                  value={safeImageCount}
                  onChange={(e) => setImageCount(Math.min(maxImages, Math.max(1, Number(e.target.value) || 1)))}
                  className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                />
              </ControlBox>

              <ControlBox title="Size" className="md:col-span-2">
                <select
                  value={sizeId}
                  onChange={(event) => setSizeId(event.target.value)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  {CORO_SIZE_OPTIONS.map((size) => (
                    <option key={size.id} value={size.id}>{formatCoroSize(size)}</option>
                  ))}
                </select>
              </ControlBox>

              <ControlBox title="Material">
                <select
                  value={material}
                  onChange={(event) => setMaterial(event.target.value as CoroMaterial)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="4mm">4mm</option>
                  <option value="10mm">10mm</option>
                </select>
              </ControlBox>

              <ControlBox title="Print Sides">
                <select
                  value={printMode}
                  onChange={(event) => setPrintMode(event.target.value as CoroPrintMode)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                </select>
              </ControlBox>

              <ControlBox title="Grommets">
                <button
                  type="button"
                  onClick={() => setGrommetsEnabled((prev) => !prev)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  {grommetsEnabled ? "Yes" : "No"}
                </button>
              </ControlBox>

              <ControlBox title="Qty / Add">
                <div className="grid grid-cols-[68px_1fr] gap-1">
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <Button className="h-9 rounded bg-orange-500 text-xs font-semibold text-white hover:bg-orange-400" onClick={addToCart}>
                    {added ? "Added" : "Add"}
                  </Button>
                </div>
              </ControlBox>
            </div>
          </section>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pricing Breakdown</div>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Signs / Sheet" value={String(pricing.signsPerSheet)} />
                <Row label="Sheets Needed" value={String(pricing.sheetsRequired)} />
                <Row label="Base Subtotal" value={formatPrice(pricing.baseSubtotal)} />
                <Row label="Step Stakes" value={formatPrice(pricing.stepStakesFee)} />
                <Row label="Heavy Stakes" value={formatPrice(pricing.heavyDutyStakesFee)} />
                <Row label="Grommets" value={formatPrice(pricing.grommetFee)} />
                <Row label="Gloss" value={formatPrice(pricing.glossFee)} />
                <Row label="Contour Cut" value={formatPrice(pricing.contourCutFee)} />
                <Row label="Rush (+120%)" value={formatPrice(pricing.rushFee)} />
                <div className="my-2 border-t border-zinc-200" />
                <Row label="Unit Price" value={formatPrice(pricing.unitPrice)} strong />
                <Row label="Order Total" value={formatPrice(pricing.totalPrice)} strong className="text-orange-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Add-ons</div>
              <div className="mt-3 space-y-3 text-sm">
                <NumberField label="Step Stakes ($2.50 ea)" value={stepStakes} onChange={setStepStakes} />
                <NumberField label="Heavy Duty Stakes ($4.00 ea)" value={heavyDutyStakes} onChange={setHeavyDutyStakes} />
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Grommets</label>
                  <button
                    type="button"
                    onClick={() => setGrommetsEnabled((prev) => !prev)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-left text-sm"
                  >
                    {grommetsEnabled ? "Enabled" : "Disabled"}
                  </button>
                  {grommetsEnabled && (
                    <input
                      type="number"
                      min={1}
                      value={grommetCount}
                      onChange={(event) => setGrommetCount(Math.max(1, Number(event.target.value) || 1))}
                      className="mt-2 h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                    />
                  )}
                </div>
                <ToggleField label="Gloss (+$6 / sign)" value={gloss} onChange={setGloss} />
                <ToggleField label="Contour Cut (+20%)" value={contourCut} onChange={setContourCut} />
                <ToggleField label="Rush (+120%)" value={rush} onChange={setRush} />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Artwork</div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Artwork ({uploadedCount}/{safeImageCount} uploaded)
                  </div>
                  {uploadedCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {uploadedCount} ready
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {safeImageCount === 1
                    ? "Upload 1 artwork for all signs."
                    : `Upload up to ${safeImageCount} artworks — one per block. Click a block on the sheet or use the slots below.`}
                </p>
                {/* Hidden file inputs — one per slot */}
                {Array.from({ length: safeImageCount }).map((_, i) => (
                  <input
                    key={`file-input-${i}`}
                    ref={(el) => { fileInputRefs.current[i] = el; }}
                    type="file"
                    accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                    className="hidden"
                    onChange={(e) => handleFileChange(i, e)}
                    disabled={uploadingBlock !== null}
                  />
                ))}
                {/* Upload slots */}
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
                              <button
                                type="button"
                                onClick={() => removeBlockUpload(i)}
                                className="rounded px-1 text-[10px] text-zinc-400 hover:text-rose-500"
                              >✕</button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[i]?.click()}
                              disabled={isUploading}
                              className="shrink-0 rounded border border-dashed border-zinc-300 px-2 py-1 text-[10px] text-zinc-500 hover:border-orange-400 hover:text-orange-500 disabled:opacity-50"
                            >
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
          </aside>
        </div>
      </div>
    </div>
  );
}

function ControlBox({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-2 ${className ?? ""}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-semibold text-zinc-900" : "text-zinc-700"} ${className ?? ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
      />
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex h-9 w-full items-center justify-between rounded border border-zinc-300 bg-white px-3 text-sm"
    >
      <span>{label}</span>
      <span className={value ? "text-emerald-600" : "text-zinc-500"}>{value ? "Yes" : "No"}</span>
    </button>
  );
}
