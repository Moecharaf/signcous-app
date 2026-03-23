"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { calculateHdpePrice, formatPrice } from "@/lib/pricing";

const MIN_IN = 6;
const MAX_IN = 240;
const unitOptions = ["inches", "feet"] as const;

type Unit = (typeof unitOptions)[number];

function toInches(value: number, unit: Unit): number {
  return unit === "feet" ? value * 12 : value;
}

export default function HdpeBuilder() {
  const cart = useCart();
  const [width, setWidth] = useState("13");
  const [height, setHeight] = useState("13");
  const [unit, setUnit] = useState<Unit>("inches");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const widthNum = parseFloat(width) || 0;
  const heightNum = parseFloat(height) || 0;
  const widthIn = toInches(widthNum, unit);
  const heightIn = toInches(heightNum, unit);

  const pricing = useMemo(() => calculateHdpePrice(widthIn, heightIn, 1), [widthIn, heightIn]);

  function validateSize(): boolean {
    if (!widthNum || !heightNum) {
      setSizeError("Enter width and height.");
      return false;
    }

    if (widthIn < MIN_IN || widthIn > MAX_IN || heightIn < MIN_IN || heightIn > MAX_IN) {
      setSizeError(unit === "inches" ? "Use 6-240 in." : "Use 0.5-20 ft.");
      return false;
    }

    setSizeError(null);
    return true;
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
              ? "Upload rejected by server size limit. Ask support to increase Nginx client_max_body_size."
              : `Upload failed with status ${response.status}. ${raw.slice(0, 180)}`,
        };
      }

      if (!response.ok || !data.fileUrl) {
        setUploadError(data.error ?? `Artwork upload failed (status ${response.status}).`);
        return;
      }

      setUploadedFileUrl(data.fileUrl);
      setUploadedFileName(data.originalName ?? file.name);
    } catch {
      setUploadError("Artwork upload failed. Please try again.");
    } finally {
      setUploadingArtwork(false);
      event.target.value = "";
    }
  }

  function handleAddToCart() {
    const isSizeValid = validateSize();
    if (!isSizeValid) return;

    if (uploadingArtwork) {
      setUploadError("Please wait for your artwork to finish uploading.");
      return;
    }

    cart.addItem({
      productId: 56,
      productName: "HDPE Sign",
      width: widthNum,
      height: heightNum,
      unit,
      quantity: 1,
      material: "HDPE",
      doubleSided: false,
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush: false,
      uploadedFileUrl,
      uploadedFileName,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">HDPE</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">HDPE Sign Builder</h1>
              <p className="mt-1 text-sm text-zinc-600">Simple layout: set size, upload artwork, and add to cart.</p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{formatPrice(pricing.totalPrice)}</div>
              <div className="text-xs text-orange-700/80">{pricing.sqFt} sqft @ $3.50/sqft</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Size</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_110px]">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="h-10 rounded border border-zinc-300 px-3 text-sm"
                placeholder="Width"
              />
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="h-10 rounded border border-zinc-300 px-3 text-sm"
                placeholder="Height"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="h-10 rounded border border-zinc-300 bg-white px-2 text-sm"
              >
                {unitOptions.map((nextUnit) => (
                  <option key={nextUnit} value={nextUnit}>
                    {nextUnit === "inches" ? "in" : "ft"}
                  </option>
                ))}
              </select>
            </div>
            {sizeError && <div className="mt-2 text-xs font-semibold text-rose-600">{sizeError}</div>}

            <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Artwork</div>
            <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-8 text-center text-sm text-zinc-600 hover:border-orange-400 hover:bg-orange-50">
              {uploadingArtwork ? "Uploading..." : "Upload Artwork"}
              <input
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
                onChange={onUploadArtwork}
                disabled={uploadingArtwork}
                className="hidden"
              />
            </label>
            <div className="mt-2 text-xs text-zinc-500">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</div>
            {uploadedFileName && (
              <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700">
                Uploaded: {uploadedFileName}
              </div>
            )}
            {uploadError && (
              <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
                {uploadError}
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pricing</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                <div className="flex items-center justify-between">
                  <span>Rate</span>
                  <span>$3.50 / sqft</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Square Feet</span>
                  <span>{pricing.sqFt}</span>
                </div>
                <div className="my-2 border-t border-zinc-200" />
                <div className="flex items-center justify-between font-semibold text-zinc-900">
                  <span>Unit Total</span>
                  <span>{formatPrice(pricing.unitPrice)}</span>
                </div>
              </div>

              <Button
                className="mt-4 h-10 w-full rounded bg-orange-500 text-sm font-semibold text-white hover:bg-orange-400"
                onClick={handleAddToCart}
              >
                {addedToCart ? "Added to Cart" : "Add to Cart"}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
