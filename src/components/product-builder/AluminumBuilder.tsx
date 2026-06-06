"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import SizeInputPanel, { composeDimensionInches, toFeetAndInches } from "@/components/product-builder/SizeInputPanel";
import ArtworkUploadModal from "@/components/product-builder/ArtworkUploadModal";
import RigidSignsPricingModal from "@/components/product-builder/RigidSignsPricingModal";
import Button from "@/components/ui/Button";
import RigidPricingHeader from "@/components/product-builder/RigidPricingHeader";
import { useCart } from "@/context/CartContext";
import {
  ALUMINUM_MARKUP,
  ALUMINUM_SHEET,
  ALUMINUM_SIZE_OPTIONS,
  calculateAluminumSheetPricing,
  calculateAluminumSqinPricing,
  formatAluminumSize,
  getBestAluminumSheetLayout,
  getAluminumSheetPrice,
  type AluminumMaterial,
  type AluminumPricingMode,
  type AluminumPrintMode,
} from "@/lib/aluminum-pricing";

interface AluminumBuilderProps {
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

type AluminumRoundedCornerOption = "none" | "half" | "one";

function formatPrice(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

function formatFeetAndInchesLabel(totalInches: number): string {
  const parts = toFeetAndInches(totalInches);
  return `${parts.feet} ft ${parts.inches} in`;
}

export default function AluminumBuilder({ productId = 0, productName = "ALUMINUM" }: AluminumBuilderProps) {
  const cart = useCart();

  // ── mode (sheet vs sq.in) ──
  const [pricingMode, setPricingMode] = useState<AluminumPricingMode>("sheet");

  // ── sheet mode state ──
  const [sizeId, setSizeId] = useState("24x18");
  const [imageCount, setImageCount] = useState(12);
  const [blockUploads, setBlockUploads] = useState<Record<number, BlockUploadPair>>({});
  const [uploadingBlock, setUploadingBlock] = useState<string | null>(null);
  const [blockUploadErrors, setBlockUploadErrors] = useState<Record<string, string>>({});
  const [blockImageModes, setBlockImageModes] = useState<Record<string, "fit" | "stretch">>();
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputBackRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── sqin mode state ──
  const [customWidthFeet, setCustomWidthFeet] = useState("2");
  const [customWidthInches, setCustomWidthInches] = useState("0");
  const [customHeightFeet, setCustomHeightFeet] = useState("1");
  const [customHeightInches, setCustomHeightInches] = useState("6");
  const [sqinUpload, setSqinUpload] = useState<BlockUpload | null>(null);
  const [sqinUploading, setSqinUploading] = useState(false);
  const [sqinUploadError, setSqinUploadError] = useState<string | null>(null);
  const sqinFileRef = useRef<HTMLInputElement | null>(null);

  // ── shared state ──
  const [material, setMaterial] = useState<AluminumMaterial>("040");
  const [printMode, setPrintMode] = useState<AluminumPrintMode>("single");
  const [quantity, setQuantity] = useState(1);
  const [roundedCornersOption, setRoundedCornersOption] = useState<AluminumRoundedCornerOption>("none");
  const contourCut = false;
  const rush = false;
  const [added, setAdded] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // ── derived ──
  const activeSize = useMemo(
    () => ALUMINUM_SIZE_OPTIONS.find(s => s.id === sizeId) ?? ALUMINUM_SIZE_OPTIONS[0],
    [sizeId]
  );

  const customWidth = Math.max(0.5, composeDimensionInches(customWidthFeet, customWidthInches));
  const customHeight = Math.max(0.5, composeDimensionInches(customHeightFeet, customHeightInches));
  const roundedCorners = roundedCornersOption !== "none";
  const roundedCornersLabel =
    roundedCornersOption === "one" ? '1"' : roundedCornersOption === "half" ? '1/2"' : "None";

  const pricing = useMemo(() => {
    if (pricingMode === "sheet") {
      return calculateAluminumSheetPricing({
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
    return calculateAluminumSqinPricing({
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
    () => pricingMode === "sheet" ? getBestAluminumSheetLayout(activeSize.width, activeSize.height) : null,
    [pricingMode, activeSize]
  );
  const maxImages = sheetLayout?.count ?? 1;
  const safeImageCount = pricingMode === "sheet" ? Math.min(imageCount, maxImages) : 1;

  useEffect(() => {
    if (pricingMode === "sheet") {
      setImageCount(maxImages);
    }
  }, [maxImages, pricingMode]);

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

  async function uploadArtworkForBlock(blockIndex: number, file: File, side: "front" | "back" = "front") {
    const uploadKey = `${blockIndex}:${side}`;
    setUploadingBlock(uploadKey);
    setBlockUploadErrors(p => { const n = { ...p }; delete n[uploadKey]; return n; });
    try {
      const result = await uploadFile(file);
      if (typeof result === "string") {
        setBlockUploadErrors(p => ({ ...p, [uploadKey]: result }));
      } else {
        const newUpload = result;
        setBlockUploads(prev => {
          const updated = { ...prev };
          for (let i = 0; i < maxImages; i++) {
            updated[i] = { ...updated[i], [side]: newUpload };
          }
          return updated;
        });
      }
    } catch {
      setBlockUploadErrors(p => ({ ...p, [uploadKey]: "Upload failed. Please try again." }));
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

  function handleFileChange(blockIndex: number, e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back" = "front") {
    const f = e.target.files?.[0];
    if (f) void uploadArtworkForBlock(blockIndex, f, side);
    e.target.value = "";
  }

  function setBlockImageMode(blockIndex: number, side: "front" | "back", mode: "fit" | "stretch") {
    setBlockImageModes(prev => ({ ...prev, [`${blockIndex}:${side}`]: mode }));
  }

  function getBlockImageMode(blockIndex: number, side: "front" | "back"): "fit" | "stretch" {
    return blockImageModes?.[`${blockIndex}:${side}`] ?? "fit";
  }

  function handleSqinFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void uploadSqin(f);
    e.target.value = "";
  }

  function removeBlockUpload(blockIndex: number, side: "front" | "back" = "front") {
    setBlockUploads(prev => {
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

  function removeSqin() {
    if (sqinUpload?.blobUrl) URL.revokeObjectURL(sqinUpload.blobUrl);
    setSqinUpload(null);
  }

  // ── add to cart ──
  function addToCart() {
    const qty = Math.max(1, Math.floor(quantity));
    const materialLabel = `Aluminum ${material === "040" ? "0.040\"" : "0.080\""} ${printMode === "single" ? "Single-Sided" : "Double-Sided"}`;

    let uploadedFileUrls: string[] = [];
    let uploadedFileUrl: string | null = null;
    let uploadedFileName: string | null = null;

    if (pricingMode === "sheet") {
      uploadedFileUrls = Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.front?.fileUrl ?? "").filter(Boolean);
      uploadedFileUrl = uploadedFileUrls[0] ?? null;
      uploadedFileName = blockUploads[0]?.front?.fileName ?? null;
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
        custom_sheet_size: `${ALUMINUM_SHEET.width}" x ${ALUMINUM_SHEET.height}"`,
        custom_sign_size: pricingMode === "sheet" ? formatAluminumSize(activeSize) : `${formatFeetAndInchesLabel(customWidth)} x ${formatFeetAndInchesLabel(customHeight)}`,
        custom_material_thickness: `Aluminum ${material === "040" ? "0.040\"" : "0.080\""}`,
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
        custom_rounded_corners: roundedCorners ? `${roundedCornersLabel} ($20 setup)` : "none",
        custom_rush_surcharge_mode: rush ? "+100%" : "none",
      },
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const uploadedBlockCount = Object.keys(blockUploads).filter(k => Number(k) < safeImageCount && blockUploads[Number(k)]?.front).length;
  const uploadedBackCount = printMode === "double" ? Object.keys(blockUploads).filter(k => Number(k) < safeImageCount && blockUploads[Number(k)]?.back).length : 0;
  const toolbarPanels: BuilderBottomToolbarPanel[] = pricingMode === "sheet"
    ? [
        {
          id: "artwork",
          title: "Artwork",
          value: printMode === "double"
            ? `${uploadedBlockCount}/${safeImageCount} front, ${uploadedBackCount}/${safeImageCount} back`
            : `${uploadedBlockCount}/${safeImageCount} uploaded`,
          width: 280,
          status:
            printMode === "double"
              ? uploadedBlockCount === safeImageCount && uploadedBackCount === safeImageCount && safeImageCount > 0 ? "ok" : "neutral"
              : uploadedBlockCount === safeImageCount && safeImageCount > 0 ? "ok" : "neutral",
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
              <input type="number" min={1} max={maxImages} value={safeImageCount} onChange={e => setImageCount(Math.min(maxImages, Math.max(1, Number(e.target.value) || 1)))} className="h-9 w-full rounded border border-zinc-300 px-2 text-sm" />
              <div className="text-[11px] leading-4 text-zinc-500">Adjust how many artwork blocks are active on the sheet.</div>
            </>
          ),
        },
        {
          id: "size",
          title: "Size",
          value: formatAluminumSize(activeSize),
          width: 300,
          content: (
            <select value={sizeId} onChange={e => setSizeId(e.target.value)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
              {ALUMINUM_SIZE_OPTIONS.map(s => (
                <option key={s.id} value={s.id}>{formatAluminumSize(s)}</option>
              ))}
            </select>
          ),
        },
        {
          id: "material",
          title: "Material / Print",
          value: `${material} / ${printMode === "single" ? "Single" : "Double"}`,
          width: 320,
          content: (
            <div className="grid grid-cols-2 gap-1">
              <select value={material} onChange={e => setMaterial(e.target.value as AluminumMaterial)} className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm">
                <option value="040">0.040&quot;</option>
                <option value="080">0.080&quot;</option>
              </select>
              <select value={printMode} onChange={e => setPrintMode(e.target.value as AluminumPrintMode)} className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm">
                <option value="single">Single</option>
                <option value="double">Double</option>
              </select>
            </div>
          ),
        },
        {
          id: "rounded-corners",
          title: "Rounded Corners",
          value: roundedCornersLabel,
          width: 320,
          content: (
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setRoundedCornersOption("none")}
                className={`h-9 rounded border px-2 text-xs font-semibold transition ${
                  roundedCornersOption === "none"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setRoundedCornersOption("half")}
                className={`h-9 rounded border px-2 text-xs font-semibold transition ${
                  roundedCornersOption === "half"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                1/2&quot;
              </button>
              <button
                type="button"
                onClick={() => setRoundedCornersOption("one")}
                className={`h-9 rounded border px-2 text-xs font-semibold transition ${
                  roundedCornersOption === "one"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                1&quot;
              </button>
            </div>
          ),
        },
        {
          id: "quantity",
          title: "Quantity",
          value: String(quantity),
          width: 260,
          content: (
            <>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="h-9 w-full rounded border border-zinc-300 px-2 text-sm" />
              <div className="text-[11px] leading-4 text-zinc-500">Set the number of signs in this order.</div>
            </>
          ),
        },
      ]
    : [
        {
          id: "artwork",
          title: "Artwork",
          value: sqinUpload?.fileName ? "Uploaded" : "No file",
          width: 360,
          status: sqinUpload ? "ok" : "neutral",
          content: (
            <>
              {sqinUpload ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-emerald-700">✓ {sqinUpload.fileName}</span>
                    <button type="button" onClick={removeSqin} className="text-[10px] text-zinc-400 hover:text-rose-500">✕ Remove</button>
                  </div>
                  {sqinUpload.blobUrl && <img src={sqinUpload.blobUrl} alt={sqinUpload.fileName} className="mt-2 h-20 w-full rounded object-contain" />}
                </div>
              ) : (
                <button type="button" onClick={() => sqinFileRef.current?.click()} disabled={sqinUploading} className="w-full rounded-lg border border-dashed border-zinc-300 py-4 text-center text-xs text-zinc-500 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] disabled:opacity-50">
                  {sqinUploading ? "Uploading..." : "+ Upload Artwork"}
                </button>
              )}
              {sqinUploadError && <div className="rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700">{sqinUploadError}</div>}
              <div className="text-[10px] text-zinc-400">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</div>
            </>
          ),
        },
        {
          id: "dimensions",
          title: "Dimensions",
          value: `${formatFeetAndInchesLabel(customWidth)} x ${formatFeetAndInchesLabel(customHeight)}`,
          width: 300,
          content: (
            <SizeInputPanel
              widthFeet={customWidthFeet}
              widthInches={customWidthInches}
              heightFeet={customHeightFeet}
              heightInches={customHeightInches}
              onWidthFeetChange={setCustomWidthFeet}
              onWidthInchesChange={setCustomWidthInches}
              onHeightFeetChange={setCustomHeightFeet}
              onHeightInchesChange={setCustomHeightInches}
              onWidthNormalize={(f, i) => { setCustomWidthFeet(f); setCustomWidthInches(i); }}
              onHeightNormalize={(f, i) => { setCustomHeightFeet(f); setCustomHeightInches(i); }}
              error={null}
              helper=""
            />
          ),
        },
        {
          id: "material",
          title: "Material / Print",
          value: `${material} / ${printMode === "single" ? "Single" : "Double"}`,
          width: 320,
          content: (
            <div className="grid grid-cols-2 gap-1">
              <select value={material} onChange={e => setMaterial(e.target.value as AluminumMaterial)} className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm">
                <option value="040">0.040&quot;</option>
                <option value="080">0.080&quot;</option>
              </select>
              <select value={printMode} onChange={e => setPrintMode(e.target.value as AluminumPrintMode)} className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm">
                <option value="single">Single</option>
                <option value="double">Double</option>
              </select>
            </div>
          ),
        },
        {
          id: "rounded-corners",
          title: "Rounded Corners",
          value: roundedCornersLabel,
          width: 320,
          content: (
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setRoundedCornersOption("none")}
                className={`h-9 rounded border px-2 text-xs font-semibold transition ${
                  roundedCornersOption === "none"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setRoundedCornersOption("half")}
                className={`h-9 rounded border px-2 text-xs font-semibold transition ${
                  roundedCornersOption === "half"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                1/2&quot;
              </button>
              <button
                type="button"
                onClick={() => setRoundedCornersOption("one")}
                className={`h-9 rounded border px-2 text-xs font-semibold transition ${
                  roundedCornersOption === "one"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                1&quot;
              </button>
            </div>
          ),
        },
        {
          id: "quantity",
          title: "Quantity",
          value: String(quantity),
          width: 260,
          content: (
            <>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="h-9 w-full rounded border border-zinc-300 px-2 text-sm" />
              <div className="text-[11px] leading-4 text-zinc-500">Set the number of signs in this order.</div>
            </>
          ),
        },
      ];

  const pricingColumns = ["1-9", "10-17", "18+"];
  const pricingRows = [
    {
      label: '0.040" Single-Sided',
      values: [
        `${formatPrice(getAluminumSheetPrice(1, "040", "single") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(10, "040", "single") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(18, "040", "single") * ALUMINUM_MARKUP)} per sheet`,
      ],
    },
    {
      label: '0.040" Double-Sided',
      values: [
        `${formatPrice(getAluminumSheetPrice(1, "040", "double") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(10, "040", "double") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(18, "040", "double") * ALUMINUM_MARKUP)} per sheet`,
      ],
    },
    {
      label: '0.080" Single-Sided',
      values: [
        `${formatPrice(getAluminumSheetPrice(1, "080", "single") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(10, "080", "single") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(18, "080", "single") * ALUMINUM_MARKUP)} per sheet`,
      ],
    },
    {
      label: '0.080" Double-Sided',
      values: [
        `${formatPrice(getAluminumSheetPrice(1, "080", "double") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(10, "080", "double") * ALUMINUM_MARKUP)} per sheet`,
        `${formatPrice(getAluminumSheetPrice(18, "080", "double") * ALUMINUM_MARKUP)} per sheet`,
      ],
    },
  ];

  const addOnRows = [
    { label: "Rounded Corners", value: `${formatPrice(20 * ALUMINUM_MARKUP)} flat` },
    { label: "Contour Cutting", value: "10% additional" },
    { label: "Rush", value: "100% additional" },
  ];

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
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
              <RigidPricingHeader
                section
                productName={productName}
                detail="Rigid sheet-layout builder"
                onMiddleTitleClick={() => setIsPricingModalOpen(true)}
                totalPrice={formatPrice(pricing.totalPrice)}
                accentClassName="text-[var(--brand-primary)]"
                middleRows={[
                  { label: "Price / Sheet", value: formatPrice(pricing.sheetPrice) },
                  { label: "Effective / Sign", value: formatPrice(pricing.totalPrice / Math.max(quantity, 1)) },
                  { label: "Sheets Needed", value: String(pricing.sheetsRequired) },
                ]}
              />

              <div
                className="relative h-[calc(100vh-320px)] min-h-[540px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
              >
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-zinc-500 bg-[#f8f8f6]"
                  style={{ width: 248, height: 496 }}
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
                          left: `${(placement.x / ALUMINUM_SHEET.width) * 100}%`,
                          top: `${(placement.y / ALUMINUM_SHEET.height) * 100}%`,
                          width: `${(placement.width / ALUMINUM_SHEET.width) * 100}%`,
                          height: `${(placement.height / ALUMINUM_SHEET.height) * 100}%`,
                        }}
                      >
                        {upload?.blobUrl ? (
                          <div className="flex h-full w-full items-center justify-center bg-white p-[1px]">
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
                <div className="pointer-events-none absolute left-1/2 top-[calc(50%-264px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Top of Sheet</div>
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
                <div className="pointer-events-none absolute left-[calc(50%-148px)] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Left</div>
                <div className="pointer-events-none absolute left-[calc(50%+116px)] top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Right</div>
              </div>

              {Array.from({ length: safeImageCount }).map((_, i) => (
                <input
                  key={`file-input-${i}`}
                  ref={el => { fileInputRefs.current[i] = el; }}
                  type="file"
                  accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                  className="hidden"
                  onChange={e => handleFileChange(i, e, "front")}
                  disabled={uploadingBlock !== null}
                />
              ))}
              {printMode === "double" && Array.from({ length: safeImageCount }).map((_, i) => (
                <input
                  key={`file-input-back-${i}`}
                  ref={el => { fileInputBackRefs.current[i] = el; }}
                  type="file"
                  accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                  className="hidden"
                  onChange={e => handleFileChange(i, e, "back")}
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
          )}

          {/* ══ SQ.IN MODE ══════════════════════════════════════════════════════ */}
          {pricingMode === "sqin" && (
            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 px-4 py-3">
                <div className="text-sm font-medium text-zinc-700">Custom Dimensions — Sq.In Pricing</div>
              </div>

              <RigidPricingHeader
                section
                productName={productName}
                detail="Rigid square-inch pricing builder"
                onMiddleTitleClick={() => setIsPricingModalOpen(true)}
                totalPrice={formatPrice(pricing.totalPrice)}
                accentClassName="text-[var(--brand-primary)]"
                middleRows={[
                  { label: "Rate / Sq In", value: `$${pricing.ratePerSqIn}` },
                  { label: "Price / Sign", value: formatPrice(pricing.pricePerSign) },
                  { label: "Minimum", value: formatPrice(pricing.minPrice) },
                ]}
              />

              {/* Dimension preview */}
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
                    className="flex h-44 w-60 flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-zinc-300 bg-white text-zinc-400 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  >
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs font-semibold">
                      {sqinUploading ? "Uploading…" : `${formatFeetAndInchesLabel(customWidth)} × ${formatFeetAndInchesLabel(customHeight)} · Click to upload artwork`}
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

              <BuilderBottomToolbar
                panels={toolbarPanels}
                action={
                  <Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" onClick={addToCart}>
                    {added ? "Added" : "Add"}
                  </Button>
                }
              />
            </section>
          )}

          <RigidSignsPricingModal
            isOpen={isPricingModalOpen}
            onClose={() => setIsPricingModalOpen(false)}
            pricingColumns={pricingColumns}
            pricingRows={pricingRows}
            addOnRows={addOnRows}
            markup={ALUMINUM_MARKUP}
          />

        </div>
      </div>
    </div>
  );
}

