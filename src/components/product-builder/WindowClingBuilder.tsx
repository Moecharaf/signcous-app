"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  WINDOW_CLING_MAX_HEIGHT_IN,
  WINDOW_CLING_MAX_WIDTH_IN,
  WINDOW_CLING_MIN,
  WINDOW_CLING_RATE,
  calculateWindowClingPrice,
  type WindowClingApplication,
  type WindowClingViewable,
} from "@/lib/pricing/window-cling";

interface WindowClingBuilderProps {
  productId?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatInches(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "--";
  const rounded = parseFloat(value.toFixed(2));
  const text = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toString();
  return `${text.replace(/\.0+$/, "")}"`;
}

function formatCharge(value: number): string {
  return value <= 0 ? formatCurrency(0) : `+${formatCurrency(value)}`;
}

function ControlBox({
  title,
  helper,
  className,
  children,
}: {
  title: string;
  helper?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-2 ${className ?? ""}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</div>
      {children}
      {helper && <div className="mt-1 text-[11px] leading-4 text-zinc-500">{helper}</div>}
    </div>
  );
}

function PanelCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</div>
      <div className="mt-1 text-lg font-semibold text-zinc-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  strong,
  accent,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className={muted ? "text-zinc-400" : strong ? "font-semibold text-zinc-900" : "text-zinc-600"}>{label}</span>
      <span
        className={`tabular-nums ${
          muted ? "text-zinc-400" : accent ? "font-semibold text-orange-600" : strong ? "font-semibold text-zinc-900" : "text-zinc-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-1.5 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

export default function WindowClingBuilder({ productId = 137 }: WindowClingBuilderProps) {
  const cart = useCart();

  const [widthStr, setWidthStr] = useState("24");
  const [heightStr, setHeightStr] = useState("24");
  const [quantity, setQuantity] = useState(1);
  const [application, setApplication] = useState<WindowClingApplication>("inside");
  const [viewable, setViewable] = useState<WindowClingViewable>("outside");
  const [contourCut, setContourCut] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const width = parseFloat(widthStr) || 0;
  const height = parseFloat(heightStr) || 0;
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);

  const widthError =
    widthStr !== "" &&
    (width <= 0
      ? "Width must be greater than 0."
      : width > WINDOW_CLING_MAX_WIDTH_IN
        ? `Maximum width for Window Cling is ${WINDOW_CLING_MAX_WIDTH_IN} inches.`
        : null);

  const heightError =
    heightStr !== "" &&
    (height <= 0
      ? "Height must be greater than 0."
      : height > WINDOW_CLING_MAX_HEIGHT_IN
        ? `Maximum height is ${WINDOW_CLING_MAX_HEIGHT_IN} inches.`
        : null);

  const isValid = !widthError && !heightError && width > 0 && height > 0;

  const pricing = useMemo(
    () => (isValid ? calculateWindowClingPrice(width, height, { contourCut }, safeQuantity) : null),
    [width, height, contourCut, safeQuantity, isValid]
  );

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
    };
  }, [uploadedImage]);

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
              ? "Upload rejected by server size limit. Ask support to increase Nginx client_max_body_size."
              : `Artwork upload failed with status ${response.status}. ${raw.slice(0, 180)}`,
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

  function clearArtwork() {
    setUploadedImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setUploadedFileUrl(null);
    setUploadedFileName(null);
    setUploadError(null);
  }

  function addToCart() {
    if (!isValid || !pricing) return;

    cart.addItem({
      productId,
      productName: "Window Cling",
      width,
      height,
      unit: "inches",
      quantity: safeQuantity,
      material: "Window Cling",
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
      customOptions: {
        custom_width: `${width}"`,
        custom_height: `${height}"`,
        custom_application: application,
        custom_viewable: viewable,
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_square_inches: pricing.sqIn.toFixed(2),
      },
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const preview = useMemo(() => {
    if (!isValid) {
      return { width: 300, height: 220 };
    }

    const maxPreviewWidth = 620;
    const maxPreviewHeight = 440;
    const minPreviewWidth = 220;
    const minPreviewHeight = 180;

    const fitScale = Math.min(maxPreviewWidth / width, maxPreviewHeight / height);
    const fittedWidth = width * fitScale;
    const fittedHeight = height * fitScale;

    // Keep aspect ratio but avoid tiny previews when dimensions are very small.
    if (fittedWidth < minPreviewWidth || fittedHeight < minPreviewHeight) {
      const boost = Math.max(minPreviewWidth / fittedWidth, minPreviewHeight / fittedHeight);
      const boostedWidth = fittedWidth * boost;
      const boostedHeight = fittedHeight * boost;

      if (boostedWidth <= maxPreviewWidth && boostedHeight <= maxPreviewHeight) {
        return { width: boostedWidth, height: boostedHeight };
      }
    }

    return { width: fittedWidth, height: fittedHeight };
  }, [isValid, width, height]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Link href="/" className="transition hover:text-zinc-900">
                  Home
                </Link>
                <span>/</span>
                <Link href="/shop/adhesive" className="transition hover:text-zinc-900">
                  Adhesive
                </Link>
                <span>/</span>
                <span className="font-semibold text-zinc-900">Window Cling</span>
              </nav>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Square-Inch Pricing", "Max Width 52in", "Inside / Outside Options", "Contour Cut Optional"].map((item) => (
                  <span key={item} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                    {item}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Window Cling Builder</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Static-cling graphics for glass applications with clear application/viewable controls and square-inch pricing.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{pricing ? formatCurrency(pricing.totalPrice) : formatCurrency(0)}</div>
              <div className="text-xs text-orange-700/80">
                {pricing ? `${pricing.sqIn.toFixed(0)} sq in · ${safeQuantity} unit${safeQuantity !== 1 ? "s" : ""}` : "Set dimensions to calculate"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-700">
                  Window Cling · {isValid ? `${formatInches(width)} x ${formatInches(height)}` : "Set dimensions"}
                </div>
                <div className="text-xs font-medium text-zinc-500">
                  Application: {application} · Viewable: {viewable} · {contourCut ? "Contour cut" : "Standard cut"}
                </div>
              </div>
              {(widthError || heightError) && (
                <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  {widthError || heightError}
                </div>
              )}
            </div>

            <div
              className="relative h-[calc(100vh-290px)] min-h-[560px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="absolute bottom-4 left-4 z-10 rounded-md border border-zinc-200 bg-white/95 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                For best results on clear or spot-white artwork, upload a PNG with a transparent background.
              </div>

              {isValid && (
                <>
                  <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Top of Image
                  </div>
                  <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Front Side
                  </div>
                </>
              )}

              <div className="relative flex h-full items-center justify-center px-8 py-16">
                {isValid ? (
                  <>
                    <div
                      className="absolute border border-dashed border-zinc-400/70"
                      style={{ width: preview.width + 18, height: preview.height + 18 }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                        {formatInches(width)}
                      </div>
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                        {formatInches(width)}
                      </div>
                      <div className="absolute -left-9 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-zinc-500">
                        {formatInches(height)}
                      </div>
                      <div className="absolute -right-9 top-1/2 -translate-y-1/2 rotate-90 text-xs font-semibold text-zinc-500">
                        {formatInches(height)}
                      </div>
                    </div>

                    <div
                      className="relative overflow-hidden border border-zinc-300 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.13)]"
                      style={{ width: preview.width, height: preview.height }}
                    >
                      <div className="absolute inset-0 bg-[#f6f6f6]" />
                      {uploadedImage ? (
                        <Image src={uploadedImage} alt="Uploaded window cling artwork preview" fill unoptimized className="object-contain" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-zinc-400">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.2em]">Artwork Preview Area</div>
                            <div className="mt-2 text-xs">
                              {uploadingArtwork ? "Uploading artwork..." : "No artwork uploaded yet"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-[250px] w-full max-w-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white/80 px-8 text-center shadow-inner">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Preview Ready</div>
                    <div className="mt-3 text-xl font-semibold text-zinc-800">Set your cling dimensions to generate a live mockup</div>
                    <div className="mt-3 max-w-[30rem] text-sm leading-6 text-zinc-500">
                      This product enforces a 52in maximum width and does not panel split.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-6 xl:grid-cols-12">
              <ControlBox title="Artwork" className="md:col-span-3 xl:col-span-4" helper="Upload JPG, PNG, PDF, AI, EPS, PSD, or SVG.">
                <div className="space-y-2">
                  <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
                    <input
                      type="file"
                      accept="image/*,.pdf,.ai,.eps,.psd,.svg"
                      className="hidden"
                      onChange={onUploadArtwork}
                    />
                    {uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}
                  </label>
                  {uploadedFileName && (
                    <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600">
                      <span className="truncate">{uploadedFileName}</span>
                      <button type="button" onClick={clearArtwork} className="font-semibold text-zinc-500 hover:text-zinc-900">
                        Remove
                      </button>
                    </div>
                  )}
                  {uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}
                </div>
              </ControlBox>

              <ControlBox title="Size" className="md:col-span-3 xl:col-span-3" helper="Max width 52in. No panel splitting for this material.">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-1">
                  <input
                    type="number"
                    min={0.1}
                    max={WINDOW_CLING_MAX_WIDTH_IN}
                    step={0.25}
                    value={widthStr}
                    onChange={(event) => setWidthStr(event.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <div className="flex items-center justify-center text-sm font-semibold text-zinc-400">x</div>
                  <input
                    type="number"
                    min={0.1}
                    max={WINDOW_CLING_MAX_HEIGHT_IN}
                    step={0.25}
                    value={heightStr}
                    onChange={(event) => setHeightStr(event.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                </div>
              </ControlBox>

              <ControlBox title="Application" className="md:col-span-2 xl:col-span-2" helper="Installation side on the glass.">
                <select
                  value={application}
                  onChange={(event) => setApplication(event.target.value as WindowClingApplication)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="inside">Inside</option>
                  <option value="outside">Outside</option>
                </select>
              </ControlBox>

              <ControlBox title="Viewable" className="md:col-span-2 xl:col-span-3" helper="Which side reads correctly.">
                <select
                  value={viewable}
                  onChange={(event) => setViewable(event.target.value as WindowClingViewable)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="inside">Inside</option>
                  <option value="outside">Outside</option>
                </select>
              </ControlBox>

              <ControlBox title="Contour Cut" className="md:col-span-3 xl:col-span-4" helper="Optional +15% pricing.">
                <button
                  type="button"
                  onClick={() => setContourCut((value) => !value)}
                  className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${
                    contourCut
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {contourCut ? "Enabled" : "Disabled"}
                </button>
              </ControlBox>

              <ControlBox title="Qty / Add" className="md:col-span-3 xl:col-span-5">
                <div className="grid grid-cols-[68px_1fr] gap-1">
                  <input
                    type="number"
                    min={1}
                    value={safeQuantity}
                    onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <Button
                    className="h-9 rounded bg-orange-500 text-xs font-semibold text-white hover:bg-orange-400"
                    disabled={!isValid}
                    onClick={addToCart}
                  >
                    {added ? "Added" : "Add"}
                  </Button>
                </div>
              </ControlBox>
            </div>
          </div>

          <aside className="space-y-3">
            <PanelCard eyebrow="Pricing" title="Window Cling Breakdown">
              <div className="space-y-1">
                <BreakdownRow label="Square inches" value={pricing ? pricing.sqIn.toFixed(2) : "--"} muted={!pricing} />
                <BreakdownRow label="Base rate" value={`${formatCurrency(WINDOW_CLING_RATE)}/sq in`} muted={!pricing} />
                <BreakdownRow label="Raw base" value={pricing ? formatCurrency(pricing.rawBase) : formatCurrency(0)} muted={!pricing} />
                <BreakdownRow label="Contour cut" value={pricing ? formatCharge(pricing.contourCutCharge) : formatCurrency(0)} muted={!pricing || !contourCut} />
                <BreakdownRow label="Minimum floor" value={formatCurrency(WINDOW_CLING_MIN)} muted={!pricing} />
                <div className="my-2 border-t border-zinc-200" />
                <BreakdownRow label="Unit total" value={pricing ? formatCurrency(pricing.unitPrice) : formatCurrency(0)} strong />
                <BreakdownRow label="Quantity" value={String(pricing?.quantity ?? safeQuantity)} strong />
                <BreakdownRow label="Grand total" value={pricing ? formatCurrency(pricing.totalPrice) : formatCurrency(0)} strong accent />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Settings" title="Window Configuration">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryItem label="Application" value={application} />
                <SummaryItem label="Viewable" value={viewable} />
                <SummaryItem label="Contour Cut" value={contourCut ? "Enabled" : "Disabled"} />
                <SummaryItem label="Max Width" value={`${WINDOW_CLING_MAX_WIDTH_IN}"`} />
                <SummaryItem label="Panel Splitting" value="Not available" />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Artwork Note" title="Transparent PNG Guidance">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-600">
                For best results on clear or spot-white artwork, upload a PNG with a transparent background.
              </div>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
