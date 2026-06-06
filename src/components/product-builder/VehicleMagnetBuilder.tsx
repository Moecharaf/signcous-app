"use client";

import { useEffect, useMemo, useState } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
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
  { label: '18"x12"', width: 18, height: 12, price: 17.93 },
  { label: '24"x12"', width: 24, height: 12, price: 22.43 },
  { label: '24"x18"', width: 24, height: 18, price: 31.43 },
  { label: '42"x12"', width: 42, height: 12, price: 44.93 },
  { label: '72"x24"', width: 72, height: 24, price: 134.55 },
];

const ROUNDED_CORNER_OPTIONS: Array<{ value: RoundedCornerOption; label: string; price: number }> = [
  { value: "none", label: "None", price: 0 },
  { value: "half-inch", label: '1/2"', price: 0 },
  { value: "one-inch", label: '1"', price: 0 },
];

const PREVIEW_MAX_WIDTH = 720;
const PREVIEW_MAX_HEIGHT = 420;

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
  const [selectedSizeKey, setSelectedSizeKey] = useState("");
  const [roundedCorners, setRoundedCorners] = useState<RoundedCornerOption>("none");
  const [quantityInput, setQuantityInput] = useState("1");
  const [rush, setRush] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [activePricingTab, setActivePricingTab] = useState<"pricing" | "shipping">("pricing");
  const [addedToCart, setAddedToCart] = useState(false);
  const [qtyError, setQtyError] = useState<string | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedSize = SIZE_OPTIONS.find((option) => getSizeKey(option) === selectedSizeKey) ?? null;
  const hasSelectedSize = selectedSize !== null;
  const selectedWidth = selectedSize?.width ?? 0;
  const selectedHeight = selectedSize?.height ?? 0;

  const quantity = useMemo(() => {
    const parsed = Number.parseInt(quantityInput, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [quantityInput]);

  const cornerOption =
    ROUNDED_CORNER_OPTIONS.find((option) => option.value === roundedCorners) ?? ROUNDED_CORNER_OPTIONS[0];

  const pricing = useMemo(() => {
    if (!hasSelectedSize) {
      return {
        basePrice: 0,
        subtotal: 0,
        rushFee: 0,
        total: 0,
      };
    }

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
  }, [hasSelectedSize, selectedSize, quantity, rush]);

  const previewScale = hasSelectedSize
    ? Math.min(PREVIEW_MAX_WIDTH / Math.max(selectedWidth, 1), PREVIEW_MAX_HEIGHT / Math.max(selectedHeight, 1))
    : 1;
  const previewWidth = hasSelectedSize ? selectedWidth * previewScale : 320;
  const previewHeight = hasSelectedSize ? selectedHeight * previewScale : 220;
  const topGuideLineWidth = Math.max(24, previewWidth / 2 - 32);
  const sideGuideLineHeight = Math.max(24, previewHeight / 2 - 20);

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
    if (!hasSelectedSize) return;
    if (!validateQuantity()) return;

    if (uploadingArtwork) {
      setUploadError("Please wait for your artwork to finish uploading.");
      return;
    }

    cart.addItem({
      productId: 48,
      productName: "Vehicle Magnet",
      width: selectedWidth,
      height: selectedHeight,
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
      value: hasSelectedSize ? selectedSize.label : '0" x 0"',
      width: 320,
      content: (
        <select value={selectedSizeKey} onChange={(event) => setSelectedSizeKey(event.target.value)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
          <option value="">Select size</option>
          {SIZE_OPTIONS.map((option) => (
            <option key={getSizeKey(option)} value={getSizeKey(option)}>
              {option.label} - {formatCurrency(option.price)}
            </option>
          ))}
        </select>
      ),
    },
    {
      id: "options",
      title: "Options",
      value: [cornerOption.label, rush ? "Rush" : "Standard"].join(" / "),
      width: 320,
      content: (
        <>
          <select value={roundedCorners} onChange={(event) => setRoundedCorners(event.target.value as RoundedCornerOption)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
            {ROUNDED_CORNER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => setRush((value) => !value)} className={`h-9 w-full rounded border px-2 text-sm font-semibold transition ${rush ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>
            {rush ? "Rush On (+100%)" : "Standard"}
          </button>
        </>
      ),
    },
    {
      id: "quantity",
      title: "Quantity",
      value: quantity > 0 ? String(quantity) : "Set qty",
      width: 260,
      status: qtyError ? "alert" : quantity > 0 ? "ok" : "neutral",
      content: (
        <>
          <input
            type="number"
            min={1}
            value={quantityInput}
            onChange={(event) => setQuantityInput(event.target.value)}
            onBlur={handleQuantityBlur}
            className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
          />
          {qtyError && <div className="text-xs font-medium text-rose-600">{qtyError}</div>}
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
          <div className="absolute left-1/2 top-4 z-20 w-[min(940px,calc(100%-24px))] -translate-x-1/2 px-2 md:px-3">
            <div className="grid w-full max-w-[940px] grid-cols-1 gap-2 px-1 md:grid-cols-[0.85fr_1.4fr_0.85fr] md:items-start md:gap-8">
              <div>
                <div className="text-[27px] font-medium leading-[0.98] tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">Vehicle Magnet</div>
                <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">Single-sided magnet builder, {hasSelectedSize ? selectedSize.label : '0" x 0"'}</div>
              </div>

              <div className="text-center md:pt-1">
                <div className="mx-auto w-full max-w-[360px]">
                  <table className="w-full border-collapse text-[10px] leading-5 text-zinc-600 md:text-[11px]">
                    <thead>
                      <tr>
                        <th className="pb-0.5 text-left font-semibold text-zinc-500" />
                        <th className="pb-0.5 text-left font-semibold text-zinc-500">Single-Sided</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_OPTIONS.map((option) => (
                        <tr key={getSizeKey(option)}>
                          <td className="py-0.5 text-left text-zinc-500">{option.label}</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency(option.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActivePricingTab("pricing");
                    setIsPricingModalOpen(true);
                  }}
                  className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
                >
                  Pricing And Shipping
                </button>
              </div>

              <div className="text-left md:pt-1 md:text-right">
                <div className="text-[38px] leading-none font-semibold text-[var(--brand-primary)] md:text-[44px]">{formatCurrency(pricing.total)}</div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {quantity > 0
                    ? `${quantity} magnet${quantity !== 1 ? "s" : ""} · ${hasSelectedSize ? selectedSize.label : '0" x 0"'}`
                    : "Set quantity to calculate"}
                </div>
              </div>
            </div>
          </div>

          {hasSelectedSize ? (
            <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%)" }}>
              <div className="pointer-events-none absolute -top-12 left-1/2 flex -translate-x-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Top Of Image</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-px bg-zinc-400" style={{ width: topGuideLineWidth }} />
                  <span>{getDimensionLabel(selectedWidth)}</span>
                  <span className="h-px bg-zinc-400" style={{ width: topGuideLineWidth }} />
                </div>
              </div>

              <div className="pointer-events-none absolute -left-14 top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
                <span className="w-px bg-zinc-400" style={{ height: sideGuideLineHeight }} />
                <span className="my-2 -rotate-90">{getDimensionLabel(selectedHeight)}</span>
                <span className="w-px bg-zinc-400" style={{ height: sideGuideLineHeight }} />
              </div>

              <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Front Side
              </div>

              <div
                className="relative overflow-hidden border-2 border-dashed border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/60 shadow-lg"
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
                ) : uploadedFileUrl && uploadedFileName?.toLowerCase().endsWith(".pdf") ? (
                  <div className="relative h-full w-full">
                    <iframe
                      src={`${uploadedFileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
                      title="Uploaded PDF artwork preview"
                      className="absolute -left-3 top-0 h-full w-[calc(100%+32px)] pointer-events-none"
                      scrolling="no"
                      style={{ clipPath: "inset(0 20px 0 0)" }}
                    />
                  </div>
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
          ) : (
            <div className="absolute left-1/2 top-1/2 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 px-6 text-center text-zinc-500">
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">Front Side</div>
              <div className="mt-3 text-base font-medium text-zinc-700">Please select a size</div>
              <div className="mt-1 text-sm text-zinc-500">Choose a vehicle magnet size to start your layout and pricing.</div>
            </div>
          )}
        </div>

        <BuilderBottomToolbar
          panels={toolbarPanels}
          action={
            <Button onClick={handleAddToCart} className="h-10 w-full rounded bg-[var(--brand-primary)] px-6 text-sm hover:bg-[var(--brand-primary-hover)]" disabled={uploadingArtwork}>
              {addedToCart ? "Added to Cart" : "Add to Cart"}
            </Button>
          }
        />

        {isPricingModalOpen ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-[620px] rounded-sm bg-white p-4 shadow-2xl">
              <div className="mx-auto mb-4 inline-flex rounded border border-zinc-300 bg-zinc-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActivePricingTab("pricing")}
                  className={`min-w-[88px] px-3 py-1 ${
                    activePricingTab === "pricing" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
                  }`}
                >
                  Pricing
                </button>
                <button
                  type="button"
                  onClick={() => setActivePricingTab("shipping")}
                  className={`min-w-[88px] px-3 py-1 ${
                    activePricingTab === "shipping" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
                  }`}
                >
                  Shipping
                </button>
              </div>

              {activePricingTab === "pricing" ? (
                <div className="space-y-4 text-xs text-zinc-800">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-[0.04em] text-zinc-700">
                        <th className="pb-1 text-left font-bold">Per Quantity Pricing</th>
                        <th className="pb-1 text-left font-bold">1+</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {SIZE_OPTIONS.map((option) => (
                        <tr key={`${getSizeKey(option)}-pricing`}>
                          <td className="py-0.5">{option.label}</td>
                          <td className="py-0.5">{formatCurrency(option.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <table className="w-full border-collapse">
                    <tbody className="align-top">
                      <tr>
                        <td className="py-0.5">Rounded Corners</td>
                        <td className="py-0.5">No additional cost</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">Rush</td>
                        <td className="py-0.5">100% additional</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3 py-1 text-[11px] text-zinc-700">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-zinc-600">
                        <th className="pb-1 text-left font-semibold">per 10 magnets</th>
                        <th className="pb-1 text-left font-semibold">191+ magnets</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      <tr>
                        <td className="py-0.5">{formatCurrency(15)}</td>
                        <td className="py-0.5">{formatCurrency(298.5)} (freight)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="inline-flex h-7 items-center justify-center rounded bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
