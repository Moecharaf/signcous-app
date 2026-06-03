"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import ArtworkUploadModal from "@/components/product-builder/ArtworkUploadModal";
import Button from "@/components/ui/Button";
import RigidPricingHeader from "@/components/product-builder/RigidPricingHeader";
import { useCart } from "@/context/CartContext";
import {
  CORO_MARKUP,
  CORO_SHEET,
  CORO_SHEET_TIERS,
  CORO_SUPPLIER_FEES,
  CORO_SIZE_OPTIONS,
  calculateCoroPricing,
  formatCoroSize,
  getBestSheetLayout,
  type CoroMaterial,
  type CoroPrintMode,
} from "@/lib/coro-pricing";

type GrommetPosition = "all-sides" | "top-bottom" | "left-right";
type GrommetSpacingMode = "every-2-3-feet" | "corners-only" | "custom";

interface CoroBuilderProps {
  productId?: number;
  productName?: string;
}

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

export default function CoroBuilder({ productId = 13, productName = "CORO" }: CoroBuilderProps) {
  const cart = useCart();

  const [sizeId, setSizeId] = useState(CORO_SIZE_OPTIONS[0].id);
  const [sizeMode, setSizeMode] = useState<"preset" | "custom">("preset");
  const [customWidth, setCustomWidth] = useState(24);
  const [customHeight, setCustomHeight] = useState(18);
  const [sizeRatioLocked, setSizeRatioLocked] = useState(true);
  const [material, setMaterial] = useState<CoroMaterial>("4mm");
  const [printMode, setPrintMode] = useState<CoroPrintMode>("single");
  const [quantity, setQuantity] = useState(1);

  const [stepStakes, setStepStakes] = useState(0);
  const [heavyDutyStakes, setHeavyDutyStakes] = useState(0);
  const [grommetsEnabled, setGrommetsEnabled] = useState(false);
  const [grommetPosition, setGrommetPosition] = useState<GrommetPosition>("top-bottom");
  const [grommetSpacingMode, setGrommetSpacingMode] = useState<GrommetSpacingMode>("every-2-3-feet");
  const [grommetSpacing, setGrommetSpacing] = useState(24);
  const [gloss, setGloss] = useState(false);
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [colorMatching, setColorMatching] = useState(false);

  // Per-block upload state (supports front/back for double-sided)
  const [imageCount, setImageCount] = useState(12);
  const [blockUploads, setBlockUploads] = useState<Record<number, BlockUploadPair>>({});
  const [uploadingBlock, setUploadingBlock] = useState<string | null>(null); // format: "blockIndex:side"
  const [blockUploadErrors, setBlockUploadErrors] = useState<Record<string, string>>({});
  const [blockImageModes, setBlockImageModes] = useState<Record<string, "fit" | "stretch">>();
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front"); // New: toggle for double-sided preview
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputBackRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [added, setAdded] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingModalTab, setPricingModalTab] = useState<"pricing" | "shipping">("pricing");

  const activeSize = useMemo(
    () => {
      if (sizeMode === "custom") {
        return {
          id: "custom",
          width: Math.min(CORO_SHEET.width, Math.max(1, customWidth || 1)),
          height: Math.min(CORO_SHEET.height, Math.max(1, customHeight || 1)),
        };
      }

      return CORO_SIZE_OPTIONS.find((size) => size.id === sizeId) ?? CORO_SIZE_OPTIONS[0];
    },
    [sizeId, sizeMode, customWidth, customHeight]
  );

  const doubleSidedAllowed = material === "10mm";
  const contourCutAllowed = activeSize.width === 48 && activeSize.height === 96;

  useEffect(() => {
    if (!doubleSidedAllowed && printMode === "double") {
      setPrintMode("single");
    }
  }, [doubleSidedAllowed, printMode]);

  useEffect(() => {
    if (!contourCutAllowed && contourCut) {
      setContourCut(false);
    }
  }, [contourCutAllowed, contourCut]);

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
        grommetCount:
          grommetsEnabled
            ? estimateGrommetCount(activeSize.width, activeSize.height, grommetPosition, grommetSpacingMode, grommetSpacing)
            : 0,
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
      grommetPosition,
      grommetSpacingMode,
      grommetSpacing,
      gloss,
      contourCut,
      rush,
    ]
  );

  const sheetLayout = useMemo(
    () => getBestSheetLayout(activeSize.width, activeSize.height),
    [activeSize.height, activeSize.width]
  );

  function clampCustomWidth(value: number): number {
    return Math.min(CORO_SHEET.width, Math.max(1, value || 1));
  }

  function clampCustomHeight(value: number): number {
    return Math.min(CORO_SHEET.height, Math.max(1, value || 1));
  }

  function handleCustomWidthChange(nextRawWidth: number) {
    const nextWidth = clampCustomWidth(nextRawWidth);
    if (sizeRatioLocked) {
      const ratio = customWidth / Math.max(customHeight, 1);
      const nextHeight = clampCustomHeight(nextWidth / Math.max(ratio, 0.001));
      setCustomHeight(Number(nextHeight.toFixed(3)));
    }
    setCustomWidth(Number(nextWidth.toFixed(3)));
  }

  function handleCustomHeightChange(nextRawHeight: number) {
    const nextHeight = clampCustomHeight(nextRawHeight);
    if (sizeRatioLocked) {
      const ratio = customWidth / Math.max(customHeight, 1);
      const nextWidth = clampCustomWidth(nextHeight * ratio);
      setCustomWidth(Number(nextWidth.toFixed(3)));
    }
    setCustomHeight(Number(nextHeight.toFixed(3)));
  }

    const maxImages = sheetLayout.count;
    const safeImageCount = Math.min(imageCount, maxImages);

    useEffect(() => {
      setImageCount(maxImages);
    }, [maxImages]);

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
        
        // Auto-fill: Check if this is the first upload for this side
        // If so, fill all empty blocks with the same image (Signs365 behavior)
        setBlockUploads((prev) => {
          const updated = { ...prev };
          for (let i = 0; i < safeImageCount; i++) {
            updated[i] = { ...updated[i], [side]: newUpload };
          }
          return updated;
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

    function setBlockImageMode(blockIndex: number, side: "front" | "back", mode: "fit" | "stretch") {
      setBlockImageModes((prev) => ({
        ...prev,
        [`${blockIndex}:${side}`]: mode,
      }));
    }

    function getBlockImageMode(blockIndex: number, side: "front" | "back"): "fit" | "stretch" {
      return blockImageModes?.[`${blockIndex}:${side}`] ?? "fit";
    }

    function removeBlockUpload(blockIndex: number, side: "front" | "back" = "front") {
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
    }

  function addToCart() {
    const safeQty = Math.max(1, Math.floor(quantity));
    const materialLabel = `${productName} ${material} ${printMode === "single" ? "Single-Sided" : "Double-Sided"}`;
    const uploadedFileUrls = Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.front?.fileUrl ?? "").filter(Boolean);
    const uploadedBackUrls = printMode === "double" ? Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.back?.fileUrl ?? "").filter(Boolean) : [];

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
        custom_sheet_size: `${CORO_SHEET.width}\" x ${CORO_SHEET.height}\"`,
        custom_sign_size: formatCoroSize(activeSize),
        custom_signs_per_sheet: String(pricing.signsPerSheet),
        custom_sheets_required: String(pricing.sheetsRequired),
        custom_material_thickness: material,
        custom_print_mode: printMode === "single" ? "Single-Sided" : "Double-Sided",
        custom_front_images: String(uploadedFileUrls.length),
        custom_back_images: printMode === "double" ? String(uploadedBackUrls.length) : "0",
        custom_back_image_urls: uploadedBackUrls.length > 0 ? uploadedBackUrls.join(",") : "none",
        custom_step_stakes: String(stepStakes),
        custom_heavy_duty_stakes: String(heavyDutyStakes),
        custom_grommet_count: grommetsEnabled
          ? String(estimateGrommetCount(activeSize.width, activeSize.height, grommetPosition, grommetSpacingMode, grommetSpacing))
          : "0",
        custom_grommet_position: grommetsEnabled ? grommetPosition : "none",
        custom_grommet_spacing: grommetsEnabled
          ? grommetSpacingMode === "every-2-3-feet"
            ? "Every 2-3 Feet"
            : grommetSpacingMode === "corners-only"
              ? "Corners Only"
              : `${grommetSpacing} in`
          : "n/a",
        custom_gloss: gloss ? "yes" : "no",
        custom_color_matching: colorMatching ? "yes" : "no",
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
      id: "layout",
      title: "Images",
      value: `${safeImageCount}/${maxImages} active`,
      width: 200,
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
      value: `${formatCoroSize(activeSize)}${sizeMode === "custom" ? " (Custom)" : ""}`,
      width: 280,
      content: (
        <>
          <div className="mb-2 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setSizeMode("preset")}
              className={`h-9 rounded border text-sm ${
                sizeMode === "preset"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-700"
              }`}
            >
              Preset
            </button>
            <button
              type="button"
              onClick={() => {
                if (sizeMode !== "custom") {
                  setCustomWidth(activeSize.width);
                  setCustomHeight(activeSize.height);
                }
                setSizeMode("custom");
              }}
              className={`h-9 rounded border text-sm ${
                sizeMode === "custom"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-700"
              }`}
            >
              Custom
            </button>
          </div>

          {sizeMode === "preset" ? (
            <select
              value={sizeId}
              onChange={(event) => setSizeId(event.target.value)}
              className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
            >
              {CORO_SIZE_OPTIONS.map((size) => (
                <option key={size.id} value={size.id}>{formatCoroSize(size)}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-1">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Width (in)</label>
                  <input
                    type="number"
                    min={1}
                    max={CORO_SHEET.width}
                    step={0.5}
                    value={customWidth}
                    onChange={(event) => handleCustomWidthChange(Number(event.target.value) || 1)}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setSizeRatioLocked((prev) => !prev)}
                    className={`h-9 rounded border px-2 text-xs font-semibold ${
                      sizeRatioLocked
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                        : "border-zinc-300 bg-white text-zinc-600"
                    }`}
                    aria-label={sizeRatioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                  >
                    {sizeRatioLocked ? "Locked" : "Unlocked"}
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Height (in)</label>
                  <input
                    type="number"
                    min={1}
                    max={CORO_SHEET.height}
                    step={0.5}
                    value={customHeight}
                    onChange={(event) => handleCustomHeightChange(Number(event.target.value) || 1)}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomWidth(24);
                  setCustomHeight(18);
                  setSizeRatioLocked(true);
                }}
                className="h-8 w-full rounded border border-zinc-300 bg-white text-xs font-semibold text-zinc-600 hover:border-zinc-400"
              >
                Reset to 24 x 18
              </button>
            </div>
          )}

          {sizeMode === "custom" && (
            <div className="mt-2 text-[11px] leading-4 text-zinc-500">
              Custom sizes are constrained to the 48&quot; x 96&quot; sheet.
            </div>
          )}
        </>
      ),
    },
    {
      id: "material",
      title: "Material",
      value: material,
      width: 200,
      content: (
        <select
          value={material}
          onChange={(event) => setMaterial(event.target.value as CoroMaterial)}
          className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
        >
          <option value="4mm">4mm</option>
          <option value="10mm">10mm</option>
        </select>
      ),
    },
    {
      id: "print",
      title: "Print Sides",
      value: printMode === "single" ? "Single" : "Double",
      width: 220,
      content: (
        <>
          <select
            value={printMode}
            onChange={(event) => setPrintMode(event.target.value as CoroPrintMode)}
            className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
          >
            <option value="single">Single</option>
            <option value="double" disabled={!doubleSidedAllowed}>Double</option>
          </select>
          {!doubleSidedAllowed && (
            <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] leading-4 text-amber-700">
              Double-sided is only available for 10mm material.
            </div>
          )}
        </>
      ),
    },
    {
      id: "grommet-presets",
      title: "Grommets",
      value: grommetsEnabled ? "Yes" : "No",
      width: 200,
      content: (
        <>
          <button
            type="button"
            onClick={() => setGrommetsEnabled((prev) => !prev)}
            className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-left text-sm font-semibold mb-2"
          >
            {grommetsEnabled ? "✓ Enabled" : "Disabled"}
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
              <div className="text-[11px] leading-4 text-zinc-500">
                Approx: {estimateGrommetCount(activeSize.width, activeSize.height, grommetPosition, grommetSpacingMode, grommetSpacing)} per sign
              </div>
            </div>
          )}
        </>
      ),
    },
    {
      id: "stakes",
      title: "Step Stakes",
      value: stepStakes > 0 ? String(stepStakes) : "0",
      width: 200,
      content: (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Step Stakes ($1.88 ea)</label>
          <input
            type="number"
            min={0}
            value={stepStakes}
            onChange={(event) => setStepStakes(Math.max(0, Number(event.target.value) || 0))}
            className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
          />
        </div>
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
              onMiddleTitleClick={() => setIsPricingModalOpen(true)}
              totalPrice={formatPrice(pricing.totalPrice)}
              middleRows={[
                { label: "Price / Sheet", value: formatPrice(pricing.totalPrice / Math.max(pricing.sheetsRequired, 1)) },
                { label: "Effective / Sign", value: formatPrice(pricing.totalPrice / Math.max(quantity, 1)) },
                { label: "Sheets Needed", value: String(pricing.sheetsRequired) },
              ]}
            />

            <div className="relative">
              {/* Canvas Area */}
              <div className="relative h-[calc(100vh-320px)] min-h-[540px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
              >
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-zinc-500 bg-white"
                style={{
                  width: 248,
                  height: 496,
                }}
              >
                {sheetLayout.placements.map((placement, index) => {
                  const slotIndex = index < safeImageCount ? index : null;
                  const upload = slotIndex !== null ? blockUploads[slotIndex]?.[previewSide] : null;
                  const imageMode = slotIndex !== null ? getBlockImageMode(slotIndex, previewSide) : "fit";
                  const markerPoints = grommetsEnabled
                    ? getGrommetMarkers(placement.width, placement.height, grommetPosition, grommetSpacingMode, grommetSpacing)
                    : [];

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
                        left: `${(placement.x / CORO_SHEET.width) * 100}%`,
                        top: `${(placement.y / CORO_SHEET.height) * 100}%`,
                        width: `${(placement.width / CORO_SHEET.width) * 100}%`,
                        height: `${(placement.height / CORO_SHEET.height) * 100}%`,
                      }}
                    >
                      {upload?.blobUrl ? (
                        <div className="h-full w-full bg-white p-[1px]">
                          <img src={upload.blobUrl} alt="" className={`h-full w-full ${imageMode === "stretch" ? "object-fill" : "object-contain"}`} />
                        </div>
                      ) : upload && upload.fileName.toLowerCase().endsWith(".pdf") ? (
                        <CoroPdfStretchPreview
                          fileUrl={upload.fileUrl}
                          title={`Uploaded Coro PDF preview ${slotIndex !== null ? slotIndex + 1 : ""}`}
                        />
                      ) : slotIndex !== null ? (
                        <div className="sc-panel-dotted-guides flex h-full w-full items-center justify-center">
                          <span className="text-[7px] font-semibold text-zinc-500">
                            {uploadingBlock === `${slotIndex}:${previewSide}` ? "…" : slotIndex + 1}
                          </span>
                        </div>
                      ) : null}
                      {slotIndex !== null && grommetsEnabled && markerPoints.map((point, markerIndex) => (
                        <span
                          key={`gm-${index}-${markerIndex}`}
                          className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 ring-1 ring-white"
                          style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
                        />
                      ))}
                    </button>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute left-1/2 top-[calc(50%-264px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Top of Sheet
              </div>
              <div className="pointer-events-none absolute left-1/2 top-[calc(50%+260px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
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
              <div className="pointer-events-none absolute left-[calc(50%-148px)] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Left
              </div>
              <div className="pointer-events-none absolute left-[calc(50%+116px)] top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Right
              </div>
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
                <Button className="h-12 w-full rounded bg-[var(--brand-primary)] text-sm font-bold text-white hover:bg-[var(--brand-primary-hover)]" onClick={addToCart}>
                  {added ? "✓ Added to Cart" : "Add to Cart"}
                </Button>
              }
            />

            {isPricingModalOpen && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6">
                <div className="w-full max-w-[520px] rounded-sm bg-white p-4 shadow-2xl">
                  <div className="mx-auto mb-4 inline-flex rounded border border-zinc-300 bg-zinc-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPricingModalTab("pricing")}
                      className={`min-w-[88px] px-3 py-1 ${
                        pricingModalTab === "pricing" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
                      }`}
                    >
                      Pricing
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingModalTab("shipping")}
                      className={`min-w-[88px] px-3 py-1 ${
                        pricingModalTab === "shipping" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
                      }`}
                    >
                      Shipping
                    </button>
                  </div>

                  {pricingModalTab === "pricing" ? (
                    <div className="space-y-4 text-xs text-zinc-800">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-[0.04em] text-zinc-700">
                            <th className="pb-1 text-left font-bold">Per Quantity Pricing</th>
                            <th className="pb-1 text-left font-bold">1-9</th>
                            <th className="pb-1 text-left font-bold">10-50</th>
                            <th className="pb-1 text-left font-bold">51+</th>
                          </tr>
                        </thead>
                        <tbody className="align-top">
                          <tr>
                            <td className="py-0.5">4mm Single-Sided</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[0].single4mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[1].single4mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[2].single4mm * CORO_MARKUP)} per sheet</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">4mm Double-Sided</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[0].double4mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[1].double4mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[2].double4mm * CORO_MARKUP)} per sheet</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">10mm Single-Sided</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[0].single10mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[1].single10mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[2].single10mm * CORO_MARKUP)} per sheet</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">10mm Double-Sided</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[0].double10mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[1].double10mm * CORO_MARKUP)} per sheet</td>
                            <td className="py-0.5">{formatPrice(CORO_SHEET_TIERS[2].double10mm * CORO_MARKUP)} per sheet</td>
                          </tr>
                        </tbody>
                      </table>

                      <table className="w-full border-collapse">
                        <tbody className="align-top">
                          <tr>
                            <td className="py-0.5">Standard wire step stakes</td>
                            <td className="py-0.5 text-right">{formatPrice(CORO_SUPPLIER_FEES.stepStake * CORO_MARKUP)} per item</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">Grommets</td>
                            <td className="py-0.5 text-right">
                              {formatPrice(CORO_SUPPLIER_FEES.grommetPerItem * CORO_MARKUP)} per item, {formatPrice(CORO_SUPPLIER_FEES.grommetSetup * CORO_MARKUP)} setup fee
                            </td>
                          </tr>
                          <tr>
                            <td className="py-0.5">Custom Cut</td>
                            <td className="py-0.5 text-right">No additional cost</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">Contour Cutting</td>
                            <td className="py-0.5 text-right">{Math.round(CORO_SUPPLIER_FEES.contourCutRate * 100)}% additional</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">Gloss Finish</td>
                            <td className="py-0.5 text-right">{formatPrice(CORO_SUPPLIER_FEES.glossPerSign * CORO_MARKUP)} per item</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">Heavy Duty Step Stakes</td>
                            <td className="py-0.5 text-right">{formatPrice(CORO_SUPPLIER_FEES.heavyDutyStake * CORO_MARKUP)} per item</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">Score and Fold</td>
                            <td className="py-0.5 text-right">No additional cost</td>
                          </tr>
                          <tr>
                            <td className="py-0.5">Rush</td>
                            <td className="py-0.5 text-right">{Math.round(CORO_SUPPLIER_FEES.rushRate * 100)}% additional</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2 text-xs text-zinc-700">
                      <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
                        Shipping follows the same markup rule as pricing.
                        <div className="mt-1 font-semibold">Displayed Shipping = Supplier Shipping x {CORO_MARKUP.toFixed(2)}</div>
                      </div>
                      <div className="rounded border border-zinc-200 bg-white px-3 py-2 text-zinc-600">
                        Final shipping rates still vary by quantity, destination, and turnaround and are calculated during checkout.
                        Any returned supplier shipping amount is marked up by 50% before display.
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setIsPricingModalOpen(false)}
                      className="inline-flex h-6 items-center justify-center bg-[#ffde00] px-4 text-xs font-semibold text-zinc-900 hover:brightness-95"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

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
  disabled,
  helperText,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className="flex h-9 w-full items-center justify-between rounded border border-zinc-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
      >
        <span>{label}</span>
        <span className={disabled ? "text-zinc-400" : value ? "text-emerald-600" : "text-zinc-500"}>{value ? "Yes" : "No"}</span>
      </button>
      {helperText && <div className="mt-1 text-[11px] leading-4 text-amber-700">{helperText}</div>}
    </div>
  );
}

function CoroPdfStretchPreview({ fileUrl, title }: { fileUrl: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderPdfFirstPage() {
      setRenderFailed(false);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        if (cancelled || !canvasRef.current) {
          await pdf.destroy();
          return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) {
          await pdf.destroy();
          throw new Error("Canvas context unavailable");
        }

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        await pdf.destroy();
      } catch {
        if (!cancelled) setRenderFailed(true);
      }
    }

    void renderPdfFirstPage();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (renderFailed) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-white">
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
          title={title}
          className="pointer-events-none absolute -left-2 top-0 h-full w-[calc(100%+20px)]"
          scrolling="no"
          style={{ clipPath: "inset(0 14px 0 0)" }}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-white" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <canvas ref={canvasRef} aria-label={title} className="h-full w-full" style={{ objectFit: "fill" }} />
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

function getGrommetMarkers(
  width: number,
  height: number,
  position: GrommetPosition,
  spacingMode: GrommetSpacingMode,
  spacing: number
): Array<{ xPercent: number; yPercent: number }> {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const safeSpacing = spacingMode === "every-2-3-feet" ? 30 : Math.max(1, spacing);

  const edgeInsetXPercent = (0.45 / safeWidth) * 100;
  const edgeInsetYPercent = (0.45 / safeHeight) * 100;
  const minX = edgeInsetXPercent;
  const maxX = 100 - edgeInsetXPercent;
  const minY = edgeInsetYPercent;
  const maxY = 100 - edgeInsetYPercent;

  const points = new Map<string, { xPercent: number; yPercent: number }>();

  const addPoint = (xPercent: number, yPercent: number) => {
    const x = Math.max(0, Math.min(100, xPercent));
    const y = Math.max(0, Math.min(100, yPercent));
    const key = `${x.toFixed(2)}:${y.toFixed(2)}`;
    points.set(key, { xPercent: x, yPercent: y });
  };

  const generateLinePercents = (lengthInches: number, spacingInches: number): number[] => {
    const count = Math.max(2, Math.floor(lengthInches / spacingInches) + 1);
    if (count <= 2) return [0, 100];
    return Array.from({ length: count }, (_, i) => (i / (count - 1)) * 100);
  };

  const xPercents = generateLinePercents(safeWidth, safeSpacing);
  const yPercents = generateLinePercents(safeHeight, safeSpacing);

  if (spacingMode === "corners-only") {
    addPoint(minX, minY);
    addPoint(maxX, minY);
    addPoint(minX, maxY);
    addPoint(maxX, maxY);
    return Array.from(points.values());
  }

  if (position === "all-sides" || position === "top-bottom") {
    xPercents.forEach((x) => {
      const shifted = minX + (x / 100) * (maxX - minX);
      addPoint(shifted, minY);
      addPoint(shifted, maxY);
    });
  }

  if (position === "all-sides" || position === "left-right") {
    yPercents.slice(1, -1).forEach((y) => {
      const shifted = minY + (y / 100) * (maxY - minY);
      addPoint(minX, shifted);
      addPoint(maxX, shifted);
    });
  }

  return Array.from(points.values());
}
