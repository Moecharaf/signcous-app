"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import ArtworkUploadModal from "@/components/product-builder/ArtworkUploadModal";
import Button from "@/components/ui/Button";
import RigidPricingHeader from "@/components/product-builder/RigidPricingHeader";
import { useCart } from "@/context/CartContext";
import {
  FOAMCORE_SHEET,
  FOAMCORE_SIZE_OPTIONS,
  calculateFoamcorePricing,
  formatFoamcoreSize,
  getBestFoamcoreSheetLayout,
  type FoamcorePrintMode,
} from "@/lib/foamcore-pricing";

interface FoamcoreBuilderProps {
  productId?: number;
  productName?: string;
}

type GrommetPosition = "all-sides" | "top-bottom" | "left-right";
type GrommetSpacingMode = "every-2-3-feet" | "corners-only" | "custom";
type ImageFitMode = "fit" | "stretch";

  interface BlockUpload {
    fileUrl: string;
    fileName: string;
    blobUrl: string | null;
  }

  interface BlockUploadPair {
    front?: BlockUpload;
    back?: BlockUpload;
  }

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function FoamcoreBuilder({ productId = 0, productName = "FOAMCORE" }: FoamcoreBuilderProps) {
  const cart = useCart();

  const [sizeId, setSizeId] = useState(FOAMCORE_SIZE_OPTIONS[0].id);
  const [printMode, setPrintMode] = useState<FoamcorePrintMode>("single");

  // Simplified defaults - no longer adjustable via UI
  const quantity = 1;
  const stepStakes = 0;
  const heavyDutyStakes = 0;
  const contourCut = false;
  const rush = false;

  const [grommetsEnabled, setGrommetsEnabled] = useState(false);
  const [grommetPosition, setGrommetPosition] = useState<GrommetPosition>("top-bottom");
  const [grommetSpacingMode, setGrommetSpacingMode] = useState<GrommetSpacingMode>("every-2-3-feet");
  const [grommetSpacing, setGrommetSpacing] = useState(24);
  const [gloss, setGloss] = useState(false);

  // Per-block upload state
  const [imageCount, setImageCount] = useState(12);
  const [blockUploads, setBlockUploads] = useState<Record<number, BlockUploadPair>>({});
  const [uploadingBlock, setUploadingBlock] = useState<string | null>(null);
  const [blockUploadErrors, setBlockUploadErrors] = useState<Record<string, string>>({});
  const [blockImageModes, setBlockImageModes] = useState<Record<string, ImageFitMode>>({});
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputBackRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [added, setAdded] = useState(false);

  const activeSize = useMemo(
    () => FOAMCORE_SIZE_OPTIONS.find((size) => size.id === sizeId) ?? FOAMCORE_SIZE_OPTIONS[0],
    [sizeId]
  );

  const estimatedGrommetCount = useMemo(
    () =>
      estimateGrommetCount(
        activeSize.width,
        activeSize.height,
        grommetPosition,
        grommetSpacingMode,
        grommetSpacing
      ),
    [activeSize.width, activeSize.height, grommetPosition, grommetSpacingMode, grommetSpacing]
  );

  const pricing = useMemo(
    () =>
      calculateFoamcorePricing({
        width: activeSize.width,
        height: activeSize.height,
        quantity,
        printMode,
        stepStakes,
        heavyDutyStakes,
        grommetsEnabled,
        grommetCount: grommetsEnabled ? estimatedGrommetCount : 0,
        gloss,
        contourCut,
        rush,
      }),
    [
      activeSize.width,
      activeSize.height,
      quantity,
      printMode,
      stepStakes,
      heavyDutyStakes,
      grommetsEnabled,
      estimatedGrommetCount,
      gloss,
      contourCut,
      rush,
    ]
  );

  const sheetLayout = useMemo(
    () => getBestFoamcoreSheetLayout(activeSize.width, activeSize.height),
    [activeSize.height, activeSize.width]
  );

    const maxImages = sheetLayout.count;
    const safeImageCount = Math.min(imageCount, maxImages);

    useEffect(() => {
      // Keep active upload slots in sync with current sheet capacity.
      setImageCount(maxImages);
    }, [maxImages]);

    useEffect(() => {
      if (printMode === "single" && previewSide === "back") {
        setPreviewSide("front");
      }
    }, [printMode, previewSide]);

    async function uploadArtworkForBlock(blockIndex: number, file: File, side: "front" | "back" = "front") {
      const uploadKey = `${blockIndex}:${side}`;
      setUploadingBlock(uploadKey);
      setBlockUploadErrors((prev) => {
        const n = { ...prev };
        delete n[uploadKey];
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
          setBlockUploadErrors((prev) => ({ ...prev, [uploadKey]: data.error ?? "Upload failed." }));
          return;
        }
        let blobUrl: string | null = null;
        if (file.type.startsWith("image/")) {
          blobUrl = URL.createObjectURL(file);
        }
        const newUpload = { fileUrl: data.fileUrl!, fileName: data.originalName ?? file.name, blobUrl };

        // Signs365 behavior: first upload on a side auto-fills active blocks.
        setBlockUploads((prev) => {
          const isFirstUpload = !Object.values(prev).some((pair) => Boolean(pair?.[side]?.fileUrl));
          if (!isFirstUpload) {
            return { ...prev, [blockIndex]: { ...prev[blockIndex], [side]: newUpload } };
          }

          const next = { ...prev };
          const autoFillCount = maxImages;
          setImageCount(autoFillCount);
          for (let i = 0; i < autoFillCount; i += 1) {
            if (!next[i]?.[side]) {
              next[i] = { ...next[i], [side]: newUpload };
            }
          }
          return next;
        });
      } catch {
        setBlockUploadErrors((prev) => ({ ...prev, [uploadKey]: "Upload failed. Please try again." }));
      } finally {
        setUploadingBlock(null);
      }
    }

    function handleFileChange(blockIndex: number, event: React.ChangeEvent<HTMLInputElement>, side: "front" | "back" = "front") {
      const file = event.target.files?.[0];
      if (file) void uploadArtworkForBlock(blockIndex, file, side);
      event.target.value = "";
    }

    function removeBlockUpload(blockIndex: number, side: "front" | "back" = "front") {
      const modeKey = `${blockIndex}:${side}`;
      setBlockUploads((prev) => {
        const pair = prev[blockIndex];
        if (!pair) return prev;
        if (pair[side]?.blobUrl) URL.revokeObjectURL(pair[side]!.blobUrl!);
        const updated = { ...pair };
        delete updated[side];
        if (Object.keys(updated).length === 0) {
          const n = { ...prev };
          delete n[blockIndex];
          return n;
        }
        return { ...prev, [blockIndex]: updated };
      });
      setBlockImageModes((prev) => {
        if (!(modeKey in prev)) return prev;
        const next = { ...prev };
        delete next[modeKey];
        return next;
      });
    }

    function setBlockImageMode(blockIndex: number, side: "front" | "back", mode: ImageFitMode) {
      const modeKey = `${blockIndex}:${side}`;
      setBlockImageModes((prev) => ({ ...prev, [modeKey]: mode }));
    }

    function getBlockImageMode(blockIndex: number, side: "front" | "back"): ImageFitMode {
      return blockImageModes[`${blockIndex}:${side}`] ?? "fit";
    }

  function addToCart() {
    const safeQty = Math.max(1, Math.floor(quantity));
    const materialLabel = `${productName} ${printMode === "single" ? "Single-Sided" : "Double-Sided"}`;
    const uploadedFileUrls = Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.front?.fileUrl ?? "").filter(Boolean);
    const uploadedBackUrls =
      printMode === "double"
        ? Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.back?.fileUrl ?? "").filter(Boolean)
        : [];

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
      uploadedFileName: blockUploads[0]?.front?.fileName ?? null,
      uploadedFileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
      customOptions: {
        custom_sheet_size: `${FOAMCORE_SHEET.width}\" x ${FOAMCORE_SHEET.height}\"`,
        custom_sign_size: formatFoamcoreSize(activeSize),
        custom_signs_per_sheet: String(pricing.signsPerSheet),
        custom_sheets_required: String(pricing.sheetsRequired),
        custom_material_thickness: "Foamcore Board",
        custom_print_mode: printMode === "single" ? "Single-Sided" : "Double-Sided",
        custom_front_images: String(uploadedFileUrls.length),
        custom_back_images: printMode === "double" ? String(uploadedBackUrls.length) : "0",
        custom_back_image_urls: uploadedBackUrls.length > 0 ? uploadedBackUrls.join(",") : "none",
        custom_step_stakes: String(stepStakes),
        custom_heavy_duty_stakes: String(heavyDutyStakes),
        custom_grommet_count: grommetsEnabled ? String(estimatedGrommetCount) : "0",
        custom_grommet_position: grommetsEnabled ? grommetPosition : "none",
        custom_grommet_spacing: grommetsEnabled
          ? grommetSpacingMode === "every-2-3-feet"
            ? "Every 2-3 Feet"
            : grommetSpacingMode === "corners-only"
              ? "Corners Only"
              : `${grommetSpacing} in`
          : "n/a",
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

    const uploadedCount = Object.keys(blockUploads).filter((k) => Number(k) < safeImageCount && blockUploads[Number(k)]?.front).length;
    const uploadedBackCount = printMode === "double" ? Object.keys(blockUploads).filter((k) => Number(k) < safeImageCount && blockUploads[Number(k)]?.back).length : 0;
    
  const toolbarPanels: BuilderBottomToolbarPanel[] = [
    {
      id: "grommet-presets",
      title: "Grommet Presets",
      value: grommetsEnabled
        ? `${grommetPosition.replace("-", " ")} / ${grommetSpacingMode === "every-2-3-feet" ? "Every 2-3 Ft" : grommetSpacingMode === "corners-only" ? "Corners Only" : "Custom"}`
        : "Disabled",
      width: 360,
      content: (
        <>
          <button
            type="button"
            onClick={() => setGrommetsEnabled((prev) => !prev)}
            className="mb-2 h-9 w-full rounded border border-zinc-300 bg-white px-2 text-left text-sm font-semibold"
          >
            {grommetsEnabled ? "Enabled" : "Disabled"}
          </button>
          {grommetsEnabled && (
            <div className="space-y-2">
              <select
                value={grommetPosition}
                onChange={(event) => setGrommetPosition(event.target.value as GrommetPosition)}
                className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
              >
                <option value="all-sides">All Sides</option>
                <option value="top-bottom">Top and Bottom</option>
                <option value="left-right">Left and Right</option>
              </select>
              <select
                value={grommetSpacingMode}
                onChange={(event) => setGrommetSpacingMode(event.target.value as GrommetSpacingMode)}
                className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
              >
                <option value="every-2-3-feet">Every 2-3 Feet</option>
                <option value="corners-only">Corners Only</option>
                <option value="custom">Custom Spacing</option>
              </select>
              {grommetSpacingMode === "custom" && (
                <input
                  type="number"
                  min={6}
                  max={48}
                  step={1}
                  value={grommetSpacing}
                  onChange={(event) => setGrommetSpacing(Math.min(48, Math.max(6, Number(event.target.value) || 24)))}
                  className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                />
              )}
              <div className="text-[11px] leading-4 text-zinc-500">Approx: {estimatedGrommetCount} per sign</div>
            </div>
          )}
        </>
      ),
    },
    {
      id: "artwork",
      title: "Artwork",
      value:
        printMode === "double"
          ? `${uploadedCount}/${safeImageCount} front, ${uploadedBackCount}/${safeImageCount} back`
          : `${uploadedCount}/${safeImageCount} uploaded`,
      width: 280,
      status:
        printMode === "double"
          ? uploadedCount === safeImageCount && uploadedBackCount === safeImageCount && safeImageCount > 0
            ? "ok"
            : "neutral"
          : uploadedCount === safeImageCount && safeImageCount > 0
            ? "ok"
            : "neutral",
      content: (
        <div className="space-y-3">
          <p className="text-[11px] leading-4 text-zinc-500">
            {printMode === "double"
              ? "Upload front and back artworks for each block."
              : safeImageCount === 1
                ? "Upload 1 artwork for all signs."
                : `Upload artworks for up to ${safeImageCount} blocks.`}
          </p>
          <button
            type="button"
            onClick={() => setIsArtworkModalOpen(true)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            🎨 Open Upload Panel
          </button>
          <div className="text-[10px] text-zinc-400">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</div>
        </div>
      ),
    },
    {
      id: "layout",
      title: "Images",
      value: `${safeImageCount}/${maxImages} active`,
      width: 260,
      content: (
        <>
          <input
            type="number"
            min={1}
            max={maxImages}
            value={safeImageCount}
            onChange={(e) => setImageCount(Math.min(maxImages, Math.max(1, Number(e.target.value) || 1)))}
            className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
          />
          <div className="text-[11px] leading-4 text-zinc-500">Adjust how many artwork blocks are active on the sheet.</div>
        </>
      ),
    },
    {
      id: "size",
      title: "Size",
      value: formatFoamcoreSize(activeSize),
      width: 300,
      content: (
        <select value={sizeId} onChange={(event) => setSizeId(event.target.value)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
          {FOAMCORE_SIZE_OPTIONS.map((size) => (
            <option key={size.id} value={size.id}>{formatFoamcoreSize(size)}</option>
          ))}
        </select>
      ),
    },
    {
      id: "print",
      title: "Print Sides",
      value: printMode === "single" ? "Single" : "Double",
      width: 260,
      content: (
        <select value={printMode} onChange={(event) => setPrintMode(event.target.value as FoamcorePrintMode)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
          <option value="single">Single</option>
          <option value="double">Double</option>
        </select>
      ),
    },
    {
      id: "gloss",
      title: "Gloss",
      value: gloss ? "Yes" : "No",
      width: 200,
      content: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGloss(false)}
              className={`rounded border-2 px-3 py-2 text-sm font-semibold transition ${
                !gloss
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setGloss(true)}
              className={`rounded border-2 px-3 py-2 text-sm font-semibold transition ${
                gloss
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              Yes
            </button>
          </div>
          <div className="text-[11px] text-zinc-500">Gloss finish adds $6 per sign</div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="grid gap-3">
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <RigidPricingHeader
              section
              productName={productName}
              detail="Rigid sheet-layout builder"
              totalPrice={formatPrice(pricing.totalPrice)}
              middleRows={[
                { label: "Price / Sheet", value: formatPrice(pricing.totalPrice / Math.max(pricing.sheetsRequired, 1)) },
                { label: "Effective / Sign", value: formatPrice(pricing.totalPrice / Math.max(quantity, 1)) },
                { label: "Sheets Needed", value: String(pricing.sheetsRequired) },
              ]}
            />

            <div
              className="relative h-[calc(100vh-360px)] min-h-[460px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2"
                style={{
                  width: 200 + 18,
                  height: 400 + 18,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">48&quot;</div>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">48&quot;</div>
                <div className="pointer-events-none absolute -left-9 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-zinc-500">96&quot;</div>
                <div className="pointer-events-none absolute -right-9 top-1/2 -translate-y-1/2 rotate-90 text-xs font-semibold text-zinc-500">96&quot;</div>
              </div>

              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-zinc-500 bg-white"
                style={{
                  width: 200,
                  height: 400,
                }}
              >
                {sheetLayout.placements.map((placement, index) => {
                  const slotIndex = index < safeImageCount ? index : null;
                  const upload = slotIndex !== null ? blockUploads[slotIndex]?.[previewSide] : null;
                  const imageMode = slotIndex !== null ? getBlockImageMode(slotIndex, previewSide) : "fit";

                  return (
                    <button
                      key={`cell-${index}`}
                      type="button"
                      disabled={slotIndex === null}
                      onClick={() => {
                        if (slotIndex !== null) {
                          if (printMode === "double" && previewSide === "back") {
                            fileInputBackRefs.current[slotIndex]?.click();
                          } else {
                            fileInputRefs.current[slotIndex]?.click();
                          }
                        }
                      }}
                      className={`absolute overflow-hidden border ${
                        slotIndex !== null ? "cursor-pointer hover:opacity-85" : "cursor-default"
                      } ${upload ? "border-emerald-500" : "border-[#8ea4bb] bg-[#edf1f4]"}`}
                      style={{
                        left: `${(placement.x / FOAMCORE_SHEET.width) * 100}%`,
                        top: `${(placement.y / FOAMCORE_SHEET.height) * 100}%`,
                        width: `${(placement.width / FOAMCORE_SHEET.width) * 100}%`,
                        height: `${(placement.height / FOAMCORE_SHEET.height) * 100}%`,
                      }}
                    >
                      {upload?.blobUrl ? (
                        <div className="flex h-full w-full items-center justify-center bg-white p-[1px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={upload.blobUrl} alt="" className={`h-full w-full ${imageMode === "stretch" ? "object-fill" : "object-contain"}`} />
                        </div>
                      ) : slotIndex !== null ? (
                        <div className="sc-panel-dotted-guides flex h-full w-full items-center justify-center">
                          <span className="text-[7px] font-semibold text-zinc-500">
                            {uploadingBlock === `${slotIndex}:${previewSide}` ? "…" : slotIndex + 1}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute left-1/2 top-[calc(50%-216px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Top of Sheet
              </div>
              <div className="pointer-events-none absolute left-1/2 top-[calc(50%+212px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {previewSide === "front" ? "Front Side" : "Back Side"}
              </div>
              {printMode === "double" && (
                <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewSide("front")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      previewSide === "front"
                        ? "bg-blue-500 text-white"
                        : "border border-zinc-300 bg-white text-zinc-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSide("back")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      previewSide === "back"
                        ? "bg-orange-500 text-white"
                        : "border border-zinc-300 bg-white text-zinc-600 hover:border-orange-400 hover:text-orange-600"
                    }`}
                  >
                    Back
                  </button>
                </div>
              )}
              <div className="pointer-events-none absolute left-[calc(50%-118px)] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Left
              </div>
              <div className="pointer-events-none absolute left-[calc(50%+118px)] top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Right
              </div>
            </div>

            {Array.from({ length: safeImageCount }).map((_, i) => (
              <input
                key={`file-input-${i}`}
                ref={(el) => { fileInputRefs.current[i] = el; }}
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                className="hidden"
                onChange={(e) => handleFileChange(i, e, "front")}
                disabled={uploadingBlock !== null}
              />
            ))}
            {printMode === "double" && Array.from({ length: safeImageCount }).map((_, i) => (
              <input
                key={`file-input-back-${i}`}
                ref={(el) => { fileInputBackRefs.current[i] = el; }}
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                className="hidden"
                onChange={(e) => handleFileChange(i, e, "back")}
                disabled={uploadingBlock !== null}
              />
            ))}

            <BuilderBottomToolbar
              panels={toolbarPanels}
              action={
                <Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" onClick={addToCart}>
                  {added ? "Added" : "Add"}
                </Button>
              }
            />

            <ArtworkUploadModal
              isOpen={isArtworkModalOpen}
              onClose={() => setIsArtworkModalOpen(false)}
              safeImageCount={safeImageCount}
              blockUploads={blockUploads}
              blockUploadErrors={blockUploadErrors}
              uploadingBlock={uploadingBlock}
              printMode={printMode}
              fileInputRefs={fileInputRefs}
              fileInputBackRefs={fileInputBackRefs}
              onRemoveUpload={removeBlockUpload}
              onSetImageMode={setBlockImageMode}
              onGetImageMode={getBlockImageMode}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function estimateGrommetCount(
  width: number,
  height: number,
  position: GrommetPosition,
  spacingMode: GrommetSpacingMode,
  spacing: number
): number {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const safeSpacing = spacingMode === "every-2-3-feet" ? 30 : Math.max(1, spacing);

  if (spacingMode === "corners-only") {
    return 4;
  }

  const topBottomEach = Math.max(2, Math.floor(safeWidth / safeSpacing) + 1);
  const leftRightEach = Math.max(2, Math.floor(safeHeight / safeSpacing) + 1);

  if (position === "top-bottom") return topBottomEach * 2;
  if (position === "left-right") return leftRightEach * 2;

  return Math.max(4, topBottomEach * 2 + Math.max(0, leftRightEach - 2) * 2);
}

