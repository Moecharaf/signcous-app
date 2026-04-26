"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

type RoundedCornerOption = "none" | "half-inch" | "one-inch";

const RATE_PER_SQ_IN = 0.1;
const PREVIEW_MAX_WIDTH = 720;
const PREVIEW_MAX_HEIGHT = 420;
const PREVIEW_SIDE_GUTTER = 96;
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

  const [widthInput, setWidthInput] = useState("24");
  const [heightInput, setHeightInput] = useState("18");
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

  const width = Number.parseFloat(widthInput) || 0;
  const height = Number.parseFloat(heightInput) || 0;
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
  const previewWidth = Math.max(120, width > 0 ? width * previewScale : 180);
  const previewHeight = Math.max(90, height > 0 ? height * previewScale : 140);
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

  const shippingInfo = useMemo(() => {
    const totalSqIn = Math.max(0, width * height * Math.max(quantity, 0));
    if (!totalSqIn) {
      return "Enter valid size and quantity to estimate shipping.";
    }

    const shipping = totalSqIn >= 40500 ? 199 : Math.ceil(totalSqIn / 2025) * 10;
    return `Estimated shipping tier: ${formatCurrency(shipping)} based on ${Math.round(totalSqIn)} total sq in.`;
  }, [width, height, quantity]);

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

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700">
                <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] tracking-normal text-orange-400">SC</span>
                Signcous Studio
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Custom Magnets Builder</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Custom-size single-sided magnets with contour cut, rush production, and artwork upload.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{formatCurrency(pricing.total)}</div>
              <div className="text-xs text-orange-700/80">
                {isQuantityValid ? `${quantity} magnet${quantity !== 1 ? "s" : ""} · ${dimensionLabel(width)} x ${dimensionLabel(height)}` : "Set quantity to calculate"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="text-sm font-medium text-zinc-700">Visual Preview</div>
            </div>

            <div
              className="relative min-h-[440px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
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
                      ? "border-dashed border-orange-500"
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

            <div className="border-t border-zinc-200 bg-zinc-50 p-3">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-7">
                <ControlBox title="Width (in)" className="xl:col-span-1" error={sizeError ?? undefined}>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={widthInput}
                    onChange={(event) => {
                      setWidthInput(event.target.value);
                      if (sizeError) setSizeError(null);
                    }}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </ControlBox>

                <ControlBox title="Height (in)" className="xl:col-span-1" error={sizeError ?? undefined}>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={heightInput}
                    onChange={(event) => {
                      setHeightInput(event.target.value);
                      if (sizeError) setSizeError(null);
                    }}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </ControlBox>

                <ControlBox title="Quantity" className="xl:col-span-1" error={quantityError ?? undefined}>
                  <input
                    type="number"
                    min={1}
                    value={quantityInput}
                    onChange={(event) => {
                      setQuantityInput(event.target.value);
                      if (quantityError) setQuantityError(null);
                    }}
                    onBlur={onBlurQuantity}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </ControlBox>

                <ControlBox title="Rounded Corners" className="xl:col-span-1">
                  <select
                    value={roundedCorners}
                    onChange={(event) => setRoundedCorners(event.target.value as RoundedCornerOption)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                  >
                    {ROUNDED_CORNER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </ControlBox>

                <ControlBox title="Contour Cut" className="xl:col-span-1">
                  <button
                    type="button"
                    onClick={() => setContourCut((value) => !value)}
                    className={`h-9 w-full rounded border px-2 text-sm font-semibold transition ${
                      contourCut
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    {contourCut ? "Enabled (+10%)" : "Standard"}
                  </button>
                </ControlBox>

                <ControlBox title="Rush" className="xl:col-span-1">
                  <button
                    type="button"
                    onClick={() => setRush((value) => !value)}
                    className={`h-9 w-full rounded border px-2 text-sm font-semibold transition ${
                      rush
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    {rush ? "Rush On (+100%)" : "Standard"}
                  </button>
                </ControlBox>

                <ControlBox title="Upload Artwork" className="xl:col-span-1">
                  <label className="flex h-9 cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
                    {uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}
                    <input
                      type="file"
                      accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
                      onChange={onUploadArtwork}
                      disabled={uploadingArtwork}
                      className="hidden"
                    />
                  </label>
                </ControlBox>
              </div>

              <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
                <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
                  {uploadedFileName ? `Uploaded artwork: ${uploadedFileName}` : "No artwork uploaded yet."}
                  {uploadError && <div className="mt-1 text-rose-600">{uploadError}</div>}
                </div>
                <Button onClick={addToCart} className="h-10 rounded bg-orange-500 px-6 text-sm hover:bg-orange-400" disabled={uploadingArtwork}>
                  {addedToCart ? "Added to Cart" : "Add to Cart"}
                </Button>
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Price Summary</div>
              <div className="mt-3 space-y-2 text-sm">
                <PriceRow label="Product" value="Custom Magnets" />
                <PriceRow label="Print" value="Single-Sided" />
                <PriceRow label="Width" value={dimensionLabel(width)} />
                <PriceRow label="Height" value={dimensionLabel(height)} />
                <PriceRow label="Rounded Corners" value={cornerOption.label} />
                <PriceRow label="Contour Cut" value={contourCut ? "Yes" : "No"} />
                <PriceRow label="Quantity" value={isQuantityValid ? String(quantity) : "-"} />
                <div className="my-2 border-t border-zinc-200" />
                <PriceRow label="Sq Inches" value={pricing.sqIn.toFixed(2)} />
                <PriceRow label="Base" value={formatCurrency(pricing.base)} />
                <PriceRow label="Contour Fee" value={formatCurrency(pricing.contourFee)} muted={!contourCut} />
                <PriceRow label="Unit Price" value={formatCurrency(pricing.unitPrice)} />
                <PriceRow label="Subtotal" value={formatCurrency(pricing.subtotal)} />
                <PriceRow label="Rush Fee" value={formatCurrency(pricing.rushFee)} muted={!rush} />
                <PriceRow label="Total" value={formatCurrency(pricing.total)} strong className="text-orange-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Shipping Info (Informational)</div>
              <div className="mt-2 space-y-2 text-xs leading-5 text-zinc-600">
                <p>Shipping is informational only and not included in product price.</p>
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700">{shippingInfo}</p>
              </div>
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
  error,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-2 ${className ?? ""}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</div>
      {children}
      {error && <div className="mt-1 text-[10px] font-semibold text-rose-600">{error}</div>}
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong,
  muted,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        strong ? "font-semibold text-zinc-900" : muted ? "text-zinc-400" : "text-zinc-700"
      } ${className ?? ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
