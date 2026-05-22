"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import SizeInputPanel, { composeDimensionInches, formatSizeLabel } from "@/components/product-builder/SizeInputPanel";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

type RoundedCornerOption = "none" | "half-inch" | "one-inch";

const RATE_PER_SQ_IN = 0.1;
const PREVIEW_MAX_WIDTH = 880;
const PREVIEW_MAX_HEIGHT = 540;
const PREVIEW_SIDE_GUTTER = 88;
const PREVIEW_TOP_GUTTER = 72;
const PREVIEW_BOTTOM_GUTTER = 44;
const MAX_SIZE_ERROR =
  'Maximum size is 24" x 96". One side must be 24" or less, and the other side must be 96" or less.';

const ROUNDED_CORNER_OPTIONS: Array<{ value: RoundedCornerOption; label: string; price: number }> = [
  { value: "none", label: "None", price: 0 },
  { value: "half-inch", label: '1/2"', price: 0 },
  { value: "one-inch", label: '1"', price: 0 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function dimensionLabel(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '--"';
  const rounded = Number(value.toFixed(2));
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${text}\"`;
}

export default function CustomMagnetBuilder() {
  const cart = useCart();

  const [widthFeet, setWidthFeet] = useState("2");
  const [widthInches, setWidthInches] = useState("0");
  const [heightFeet, setHeightFeet] = useState("1");
  const [heightInches, setHeightInches] = useState("6");
  const [quantityInput, setQuantityInput] = useState("1");
  const [roundedCorners, setRoundedCorners] = useState<RoundedCornerOption>("none");
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const [sizeError, setSizeError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const width = composeDimensionInches(widthFeet, widthInches);
  const height = composeDimensionInches(heightFeet, heightInches);
  const quantity = Number.parseInt(quantityInput, 10) || 0;

  const hasPositiveSize = width > 0 && height > 0;
  const isSizeValid =
    hasPositiveSize &&
    Math.min(width, height) <= 24 &&
    Math.max(width, height) <= 96;
  const isQuantityValid = Number.isInteger(quantity) && quantity >= 1;

  const previewUsableWidth = PREVIEW_MAX_WIDTH - PREVIEW_SIDE_GUTTER;
  const previewUsableHeight = PREVIEW_MAX_HEIGHT - PREVIEW_TOP_GUTTER - PREVIEW_BOTTOM_GUTTER;
  const previewScale = Math.min(
    previewUsableWidth / Math.max(width, 1),
    previewUsableHeight / Math.max(height, 1)
  );
  const previewWidth = Math.max(160, width > 0 ? width * previewScale : 220);
  const previewHeight = Math.max(120, height > 0 ? height * previewScale : 180);
  const topGuideLineWidth = Math.max(24, previewWidth / 2 - 32);
  const sideGuideLineHeight = Math.max(24, previewHeight / 2 - 20);

  const cornerOption =
    ROUNDED_CORNER_OPTIONS.find((option) => option.value === roundedCorners) ?? ROUNDED_CORNER_OPTIONS[0];

  const pricing = useMemo(() => {
    const sqIn = Math.max(0, width * height);
    const base = sqIn * RATE_PER_SQ_IN;
    const contourFee = contourCut ? base * 0.1 : 0;
    const unitPrice = base + contourFee;
    const subtotal = unitPrice * Math.max(0, quantity);
    const rushFee = rush ? subtotal : 0;
    const total = subtotal + rushFee;

    return {
      sqIn,
      base,
      contourFee,
      unitPrice,
      subtotal,
      rushFee,
      total,
    };
  }, [width, height, quantity, contourCut, rush]);

  function validate(): boolean {
    let valid = true;

    if (!isQuantityValid) {
      setQuantityError("Quantity must be at least 1.");
      valid = false;
    } else {
      setQuantityError(null);
    }

    if (!isSizeValid) {
      setSizeError(MAX_SIZE_ERROR);
      valid = false;
    } else {
      setSizeError(null);
    }

    return valid;
  }

  function onBlurQuantity() {
    if (!isQuantityValid) return;
    setQuantityInput(String(quantity));
  }

  async function onUploadArtwork(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingArtwork(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-artwork", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") ?? "";
      let data: { fileUrl?: string; originalName?: string; error?: string } = {};

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const raw = await response.text();
        data = {
          error:
            response.status === 413
              ? "Upload rejected by server size limit."
              : `Upload failed (${response.status}). ${raw.slice(0, 180)}`,
        };
      }

      if (!response.ok || !data.fileUrl) {
        setUploadError(data.error ?? `Artwork upload failed (status ${response.status}).`);
        return;
      }

      setUploadedFileUrl(data.fileUrl);
      setUploadedFileName(data.originalName ?? file.name);

      if (file.type.startsWith("image/")) {
        const blobUrl = URL.createObjectURL(file);
        setUploadedImage((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return blobUrl;
        });
      } else {
        setUploadedImage((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return null;
        });
      }
    } catch {
      setUploadError("Artwork upload failed. Please try again.");
    } finally {
      setUploadingArtwork(false);
      event.target.value = "";
    }
  }

  function addToCart() {
    if (!validate()) return;

    if (uploadingArtwork) {
      setUploadError("Please wait for your artwork to finish uploading.");
      return;
    }

    const unitPriceForCart = quantity > 0 ? pricing.total / quantity : pricing.total;

    cart.addItem({
      productId: 164,
      productName: "Custom Magnets",
      width,
      height,
      unit: "inches",
      quantity,
      material: "Custom Magnet",
      doubleSided: false,
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl,
      uploadedFileName,
      unitPrice: unitPriceForCart,
      totalPrice: pricing.total,
      customOptions: {
        custom_product_name: "Custom Magnets",
        custom_width: `${width}`,
        custom_height: `${height}`,
        custom_quantity: `${quantity}`,
        custom_rounded_corners: cornerOption.label,
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_rush: rush ? "Yes" : "No",
        custom_sq_inches: pricing.sqIn.toFixed(2),
        custom_unit_price: pricing.unitPrice.toFixed(2),
        custom_final_total: pricing.total.toFixed(2),
        custom_uploaded_artwork_filename: uploadedFileName ?? "",
      },
    });

    setAddedToCart(true);
    window.setTimeout(() => setAddedToCart(false), 1800);
  }

  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);

  const toolbarPanels: BuilderBottomToolbarPanel[] = [
    {
      id: "artwork",
      title: "Artwork",
      value: uploadedFileName ? "Uploaded" : "No file",
      width: 360,
      status: uploadedFileName ? "ok" : "neutral",
      content: (
        <>
          <label className="flex h-10 cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
            {uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}
            <input
              type="file"
              accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
              onChange={onUploadArtwork}
              disabled={uploadingArtwork}
              className="hidden"
            />
          </label>
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
            {uploadedFileName ? `Uploaded artwork: ${uploadedFileName}` : "No artwork uploaded yet."}
          </div>
          {uploadError && <div className="text-xs font-medium text-rose-600">{uploadError}</div>}
        </>
      ),
    },
    {
      id: "size",
      title: "Size",
      value: formatSizeLabel(width, height),
      width: 320,
      status: sizeError ? "alert" : isSizeValid ? "ok" : "neutral",
      content: (
        <SizeInputPanel
          widthFeet={widthFeet}
          widthInches={widthInches}
          heightFeet={heightFeet}
          heightInches={heightInches}
          onWidthFeetChange={setWidthFeet}
          onWidthInchesChange={setWidthInches}
          onHeightFeetChange={setHeightFeet}
          onHeightInchesChange={setHeightInches}
          onWidthNormalize={(f, i) => { setWidthFeet(f); setWidthInches(i); }}
          onHeightNormalize={(f, i) => { setHeightFeet(f); setHeightInches(i); }}
          error={sizeError}
          helper='Max 2 ft 0 in × 8 ft 0 in. One side must be 24" or less.'
        />
      ),
    },
    {
      id: "options",
      title: "Options",
      value: [cornerOption.label, contourCut ? "Contour" : "Standard", rush ? "Rush" : "Standard"].join(" / "),
      width: 340,
      content: (
        <>
          <select value={roundedCorners} onChange={(event) => setRoundedCorners(event.target.value as RoundedCornerOption)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
            {ROUNDED_CORNER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1">
            <button type="button" onClick={() => setContourCut((value) => !value)} className={`h-9 rounded border px-2 text-sm font-semibold transition ${contourCut ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>
              {contourCut ? "Contour On" : "Standard Cut"}
            </button>
            <button type="button" onClick={() => setRush((value) => !value)} className={`h-9 rounded border px-2 text-sm font-semibold transition ${rush ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>
              {rush ? "Rush On" : "Standard"}
            </button>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800 md:min-h-[calc(100dvh-88px)] md:h-[calc(100vh-88px)]">
      <div className="mx-3 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div
          className="relative flex min-h-0 flex-1 overflow-hidden bg-[#fafaf9]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        >
          <div className="pointer-events-none absolute left-1/2 top-4 z-20 w-[min(940px,calc(100%-24px))] -translate-x-1/2 px-2 md:px-3">
            <div className="grid w-full max-w-[940px] grid-cols-1 gap-2 px-1 md:grid-cols-[0.85fr_1.4fr_0.85fr] md:items-start md:gap-8">
              <div>
                <div className="text-[27px] font-medium leading-[0.98] tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">Custom Magnets</div>
                <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">Single-sided magnet builder, {dimensionLabel(width)} x {dimensionLabel(height)}</div>
              </div>

              <div className="text-[10px] text-zinc-600 md:pt-1 md:text-center">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Quick Rate Reference</div>
                <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5 text-[10px] md:text-center md:grid-cols-2 md:justify-center md:inline-grid">
                  <span className="text-zinc-500">Base / sq in</span>
                  <span>{pricing && pricing.sqIn > 0 ? formatCurrency(pricing.base / pricing.sqIn) : formatCurrency(0)}</span>
                  <span className="text-zinc-500">Unit Price</span>
                  <span>{formatCurrency(pricing.unitPrice)}</span>
                  <span className="text-zinc-500">Sq in</span>
                  <span>{pricing.sqIn.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-left md:pt-1 md:text-right">
                <div className="text-[38px] leading-none font-semibold text-[var(--brand-primary)] md:text-[44px]">{formatCurrency(pricing.total)}</div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {isQuantityValid ? `${quantity} magnet${quantity !== 1 ? "s" : ""} · ${dimensionLabel(width)} x ${dimensionLabel(height)}` : "Set quantity to calculate"}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%)" }}>
            <div className="pointer-events-none absolute -top-12 left-1/2 flex -translate-x-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Top Of Image</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-px bg-zinc-400" style={{ width: topGuideLineWidth }} />
                <span>{dimensionLabel(width)}</span>
                <span className="h-px bg-zinc-400" style={{ width: topGuideLineWidth }} />
              </div>
            </div>

            <div className="pointer-events-none absolute -left-14 top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
              <span className="w-px bg-zinc-400" style={{ height: sideGuideLineHeight }} />
              <span className="my-2 -rotate-90">{dimensionLabel(height)}</span>
              <span className="w-px bg-zinc-400" style={{ height: sideGuideLineHeight }} />
            </div>

            <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Front Side
            </div>

            <div
              className={`relative overflow-hidden border-2 bg-white/80 shadow-lg ${
                isSizeValid
                  ? "border-dashed border-[var(--brand-primary)]"
                  : "border-solid border-red-500"
              }`}
              style={{
                width: previewWidth,
                height: previewHeight,
                borderRadius: roundedCorners === "none" ? 6 : roundedCorners === "half-inch" ? 12 : 18,
              }}
            >
              {!isSizeValid ? (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div className="text-sm font-semibold text-red-600">{MAX_SIZE_ERROR}</div>
                </div>
              ) : uploadedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uploadedImage}
                  alt="Custom magnet artwork preview"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-zinc-500">
                  <div>
                    <div className="text-lg font-medium">Upload Artwork</div>
                    <div className="mt-1 text-xs">Your custom magnet preview appears here</div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        <BuilderBottomToolbar
          panels={toolbarPanels}
          action={
            <Button onClick={addToCart} className="h-10 w-full rounded bg-[var(--brand-primary)] px-6 text-sm hover:bg-[var(--brand-primary-hover)]" disabled={uploadingArtwork}>
              {addedToCart ? "Added to Cart" : "Add to Cart"}
            </Button>
          }
        />
      </div>
    </div>
  );
}
