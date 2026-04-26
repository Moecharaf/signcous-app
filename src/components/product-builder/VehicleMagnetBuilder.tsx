"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

interface VehicleMagnetSizeOption {
  label: string;
  width: number;
  height: number;
  price: number;
}

type RoundedCornerOption = "none" | "half-inch" | "one-inch";

const SIZE_OPTIONS: VehicleMagnetSizeOption[] = [
  { label: '18" x 12"', width: 18, height: 12, price: 17.95 },
  { label: '24" x 12"', width: 24, height: 12, price: 22.95 },
  { label: '24" x 18"', width: 24, height: 18, price: 31.95 },
  { label: '42" x 12"', width: 42, height: 12, price: 44.95 },
  { label: '72" x 24"', width: 72, height: 24, price: 129.95 },
];

const ROUNDED_CORNER_OPTIONS: Array<{ value: RoundedCornerOption; label: string; price: number }> = [
  { value: "none", label: "None", price: 0 },
  { value: "half-inch", label: '1/2"', price: 0 },
  { value: "one-inch", label: '1"', price: 0 },
];

const DEFAULT_SIZE_KEY = "72x24";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getSizeKey(size: VehicleMagnetSizeOption): string {
  return `${size.width}x${size.height}`;
}

function getDimensionLabel(value: number): string {
  return `${value}\"`;
}

export default function VehicleMagnetBuilder() {
  const cart = useCart();
  const [selectedSizeKey, setSelectedSizeKey] = useState(DEFAULT_SIZE_KEY);
  const [roundedCorners, setRoundedCorners] = useState<RoundedCornerOption>("none");
  const [quantityInput, setQuantityInput] = useState("1");
  const [rush, setRush] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [qtyError, setQtyError] = useState<string | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedSize =
    SIZE_OPTIONS.find((option) => getSizeKey(option) === selectedSizeKey) ??
    SIZE_OPTIONS.find((option) => getSizeKey(option) === DEFAULT_SIZE_KEY) ??
    SIZE_OPTIONS[SIZE_OPTIONS.length - 1];

  const quantity = useMemo(() => {
    const parsed = Number.parseInt(quantityInput, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [quantityInput]);

  const cornerOption =
    ROUNDED_CORNER_OPTIONS.find((option) => option.value === roundedCorners) ?? ROUNDED_CORNER_OPTIONS[0];

  const pricing = useMemo(() => {
    const basePrice = selectedSize.price;
    const subtotal = basePrice * quantity;
    const rushFee = rush ? subtotal : 0;
    const total = subtotal + rushFee;

    return {
      basePrice,
      subtotal,
      rushFee,
      total,
    };
  }, [selectedSize.price, quantity, rush]);

  const shippingInfo = useMemo(() => {
    if (quantity < 1) {
      return "Enter a quantity to see shipping guidance.";
    }

    if (quantity >= 191) {
      return "Estimated shipping tier: $199 freight for 191+ magnets.";
    }

    const packsOfTen = Math.ceil(quantity / 10);
    const shippingEstimate = packsOfTen * 10;
    return `Estimated shipping tier: ${formatCurrency(shippingEstimate)} (${packsOfTen} x $10 per 10 magnets).`;
  }, [quantity]);

  const maxWidth = Math.max(...SIZE_OPTIONS.map((option) => option.width));
  const maxHeight = Math.max(...SIZE_OPTIONS.map((option) => option.height));
  const previewScale = Math.min(520 / maxWidth, 280 / maxHeight);
  const previewWidth = Math.max(140, selectedSize.width * previewScale);
  const previewHeight = Math.max(90, selectedSize.height * previewScale);

  function validateQuantity(): boolean {
    if (!Number.isInteger(quantity) || quantity < 1) {
      setQtyError("Quantity must be at least 1.");
      return false;
    }

    setQtyError(null);
    return true;
  }

  function handleQuantityBlur() {
    if (!validateQuantity()) return;
    setQuantityInput(String(quantity));
  }

  async function onUploadArtwork(event: React.ChangeEvent<HTMLInputElement>) {
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

  function handleAddToCart() {
    if (!validateQuantity()) return;

    if (uploadingArtwork) {
      setUploadError("Please wait for your artwork to finish uploading.");
      return;
    }

    cart.addItem({
      productId: 48,
      productName: "Vehicle Magnet",
      width: selectedSize.width,
      height: selectedSize.height,
      unit: "inches",
      quantity,
      material: "Vehicle Magnet",
      doubleSided: false,
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl,
      uploadedFileName,
      unitPrice: pricing.total / quantity,
      totalPrice: pricing.total,
      customOptions: {
        custom_side: "Single-Sided",
        custom_size: selectedSize.label,
        custom_rounded_corners: cornerOption.label,
        custom_rush: rush ? "Yes" : "No",
        custom_final_calculated_price: pricing.total.toFixed(2),
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
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Vehicle Magnet Builder</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Fixed-size, single-sided vehicle magnets with rush pricing and artwork upload.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{formatCurrency(pricing.total)}</div>
              <div className="text-xs text-orange-700/80">
                {quantity > 0 ? `${quantity} magnet${quantity !== 1 ? "s" : ""} · ${selectedSize.label}` : "Set quantity to calculate"}
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
                    <span className="h-px w-12 bg-zinc-400" />
                    <span>{getDimensionLabel(selectedSize.width)}</span>
                    <span className="h-px w-12 bg-zinc-400" />
                  </div>
                </div>

                <div className="pointer-events-none absolute -left-14 top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
                  <span className="h-14 w-px bg-zinc-400" />
                  <span className="my-2 -rotate-90">{getDimensionLabel(selectedSize.height)}</span>
                  <span className="h-14 w-px bg-zinc-400" />
                </div>

                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Front Side
                </div>

                <div
                  className="relative overflow-hidden border-2 border-dashed border-orange-500 bg-orange-50/60 shadow-lg"
                  style={{
                    width: previewWidth,
                    height: previewHeight,
                    borderRadius: roundedCorners === "none" ? 6 : roundedCorners === "half-inch" ? 12 : 18,
                  }}
                >
                  {uploadedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={uploadedImage}
                      alt="Vehicle magnet artwork preview"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-zinc-500">
                      <div>
                        <div className="text-lg font-medium">Upload Artwork</div>
                        <div className="mt-1 text-xs">Your magnet preview appears here</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50 p-3">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                <ControlBox title="Quantity" className="xl:col-span-1" error={qtyError ?? undefined}>
                  <input
                    type="number"
                    min={1}
                    value={quantityInput}
                    onChange={(event) => setQuantityInput(event.target.value)}
                    onBlur={handleQuantityBlur}
                    className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
                  />
                </ControlBox>

                <ControlBox title="Size" className="xl:col-span-2">
                  <select
                    value={selectedSizeKey}
                    onChange={(event) => setSelectedSizeKey(event.target.value)}
                    className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                  >
                    {SIZE_OPTIONS.map((option) => (
                      <option key={getSizeKey(option)} value={getSizeKey(option)}>
                        {option.label} - {formatCurrency(option.price)}
                      </option>
                    ))}
                  </select>
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
                <Button onClick={handleAddToCart} className="h-10 rounded bg-orange-500 px-6 text-sm hover:bg-orange-400" disabled={uploadingArtwork}>
                  {addedToCart ? "Added to Cart" : "Add to Cart"}
                </Button>
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Price Summary</div>
              <div className="mt-3 space-y-2 text-sm">
                <PriceRow label="Product" value="Vehicle Magnet" />
                <PriceRow label="Print" value="Single-Sided" />
                <PriceRow label="Selected Size" value={selectedSize.label} />
                <PriceRow label="Rounded Corners" value={cornerOption.label} />
                <PriceRow label="Quantity" value={quantity > 0 ? String(quantity) : "-"} />
                <div className="my-2 border-t border-zinc-200" />
                <PriceRow label="Base Price (each)" value={formatCurrency(pricing.basePrice)} />
                <PriceRow label="Subtotal" value={formatCurrency(pricing.subtotal)} />
                <PriceRow label="Rush Fee" value={formatCurrency(pricing.rushFee)} muted={!rush} />
                <PriceRow label="Total" value={formatCurrency(pricing.total)} strong className="text-orange-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Shipping Info (Informational)</div>
              <div className="mt-2 space-y-2 text-xs leading-5 text-zinc-600">
                <p>1-190 magnets: $10 per 10 magnets.</p>
                <p>191+ magnets: $199 freight.</p>
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700">{shippingInfo}</p>
                <p className="text-zinc-500">Shipping is shown for guidance only and is not included in product price.</p>
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
