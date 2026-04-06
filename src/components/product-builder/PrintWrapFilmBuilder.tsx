"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  PRINT_WRAP_BASE_RATE,
  PRINT_WRAP_LAMINATE_OPTIONS,
  PRINT_WRAP_MAX_ROLL_WIDTH,
  PRINT_WRAP_MINIMUM_PRICE,
  calculatePrintWrapPrice,
  type PrintWrapLaminate,
  type PrintWrapSplitDirection,
  type PrintWrapUnit,
} from "@/lib/pricing/print-wrap-film";

interface PrintWrapFilmBuilderProps {
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

function SplitLinePreview({
  resolvedDirection,
  panelCount,
}: {
  resolvedDirection: "none" | "vertical" | "horizontal";
  panelCount: number;
}) {
  if (panelCount <= 1 || resolvedDirection === "none") return null;

  const lines = Array.from({ length: panelCount - 1 }, (_, index) => index + 1);

  return (
    <>
      {lines.map((lineNumber) => {
        if (resolvedDirection === "vertical") {
          const x = (lineNumber / panelCount) * 100;

          return (
            <div key={`v-${lineNumber}`} className="absolute inset-y-0" style={{ left: `${x}%` }}>
              <div className="absolute inset-y-0 border-l-2 border-dashed border-red-400" />
              <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-center text-xs font-bold leading-5 text-white">
                !
              </div>
            </div>
          );
        }

        const y = (lineNumber / panelCount) * 100;
        return (
          <div key={`h-${lineNumber}`} className="absolute inset-x-0" style={{ top: `${y}%` }}>
            <div className="absolute inset-x-0 border-t-2 border-dashed border-red-400" />
            <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-center text-xs font-bold leading-5 text-white">
              !
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function PrintWrapFilmBuilder({ productId = 136 }: PrintWrapFilmBuilderProps) {
  const cart = useCart();

  const [widthStr, setWidthStr] = useState("51");
  const [heightStr, setHeightStr] = useState("36");
  const [unit, setUnit] = useState<PrintWrapUnit>("inches");
  const [quantity, setQuantity] = useState(1);
  const [laminate, setLaminate] = useState<PrintWrapLaminate>("gloss");
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [splitDirection, setSplitDirection] = useState<PrintWrapSplitDirection>("auto");
  const [added, setAdded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const width = parseFloat(widthStr) || 0;
  const height = parseFloat(heightStr) || 0;
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);

  const maxByUnit = unit === "inches" ? 300 : 25;
  const widthError =
    widthStr !== "" &&
    (width <= 0 ? "Width must be greater than 0." : width > maxByUnit ? `Maximum width is ${maxByUnit} ${unit}.` : null);
  const heightError =
    heightStr !== "" &&
    (height <= 0 ? "Height must be greater than 0." : height > maxByUnit ? `Maximum height is ${maxByUnit} ${unit}.` : null);
  const isValid = !widthError && !heightError && width > 0 && height > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculatePrintWrapPrice({
            width,
            height,
            unit,
            quantity: safeQuantity,
            contourCut,
            rush,
            splitDirection,
          })
        : null,
    [width, height, unit, safeQuantity, contourCut, rush, splitDirection, isValid]
  );

  const selectedLaminate = PRINT_WRAP_LAMINATE_OPTIONS.find((option) => option.value === laminate)!;
  const appliedSplitDirection = useMemo(() => {
    if (!pricing) return "none" as const;
    if (pricing.panelCount <= 1) return "none" as const;
    if (splitDirection === "vertical" || splitDirection === "horizontal") return splitDirection;
    return pricing.widthIn >= pricing.heightIn ? "vertical" : "horizontal";
  }, [pricing, splitDirection]);

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
    if (uploadingArtwork) {
      setUploadError("Please wait for your artwork to finish uploading.");
      return;
    }

    cart.addItem({
      productId,
      productName: "3M PRINT WRAP FILM",
      width,
      height,
      unit,
      quantity: safeQuantity,
      material: "3M Print Wrap Film",
      doubleSided: false,
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl,
      uploadedFileName,
      unitPrice: pricing.perItemTotal,
      totalPrice: pricing.grandTotal,
      customOptions: {
        custom_width: `${width} ${unit}`,
        custom_height: `${height} ${unit}`,
        custom_laminate: selectedLaminate.label,
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_rush: rush ? "Yes" : "No",
        custom_split_direction_input: splitDirection,
        custom_split_direction_applied: appliedSplitDirection,
        custom_panel_count: String(pricing.panelCount),
        custom_panel_size: `${formatInches(pricing.panelWidthIn)} x ${formatInches(pricing.panelHeightIn)}`,
        custom_roll_width_limit: `${PRINT_WRAP_MAX_ROLL_WIDTH}"`,
        custom_area_sqft: pricing.areaSqFt.toFixed(2),
      },
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const previewWidth = pricing ? Math.max(240, Math.min(640, pricing.widthIn * 2.8)) : 320;
  const previewHeight = pricing ? Math.max(180, Math.min(460, pricing.heightIn * 2.8)) : 220;

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="mx-auto max-w-[1400px] px-4 py-5">
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
                <span className="font-semibold text-zinc-900">3M PRINT WRAP FILM</span>
              </nav>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "3M Print Wrap Film",
                  "52in Roll Split Logic",
                  "Gloss / Matte / None",
                  "Signs365-Style Panel Preview",
                ].map((item) => (
                  <span key={item} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                    {item}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">3M PRINT WRAP FILM Builder</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Premium wrap vinyl with 52in panel split logic, laminate options, contour cut, and rush production pricing.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}</div>
              <div className="text-xs text-orange-700/80">
                {pricing
                  ? `${pricing.areaSqFt.toFixed(2)} sq ft · ${safeQuantity} unit${safeQuantity !== 1 ? "s" : ""}`
                  : "Set dimensions to calculate"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-700">
                  3M PRINT WRAP FILM · {pricing ? `${formatInches(pricing.widthIn)} x ${formatInches(pricing.heightIn)}` : "Set dimensions"}
                </div>
                <div className="text-xs font-medium text-zinc-500">
                  {selectedLaminate.label} · {splitDirection} split · {contourCut ? "Contour cut" : "Standard cut"}
                </div>
              </div>
              {(widthError || heightError) && (
                <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  {widthError || heightError}
                </div>
              )}
            </div>

            <div
              className="relative h-[58vh] min-h-[430px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="absolute left-5 top-5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                Upload artwork to preview wrap panel splits
              </div>

              <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Top of Image
              </div>
              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Front Side
              </div>

              <div className="relative flex h-full items-center justify-center px-8 py-14">
                {pricing ? (
                  <>
                    <div
                      className="absolute border border-dashed border-zinc-400/70"
                      style={{ width: previewWidth + 18, height: previewHeight + 18 }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                        {formatInches(pricing.widthIn)}
                      </div>
                      <div className="absolute -right-9 top-1/2 -translate-y-1/2 rotate-90 text-xs font-semibold text-zinc-500">
                        {formatInches(pricing.heightIn)}
                      </div>
                    </div>

                    <div
                      className="relative overflow-hidden border border-zinc-300 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.13)]"
                      style={{ width: previewWidth, height: previewHeight }}
                    >
                      <div className="absolute inset-0 bg-[#f6f6f6]" />
                      {uploadedImage ? (
                        <Image src={uploadedImage} alt="Uploaded print wrap artwork preview" fill unoptimized className="object-contain" />
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

                      <SplitLinePreview
                        resolvedDirection={appliedSplitDirection}
                        panelCount={pricing.panelCount}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex h-[250px] w-full max-w-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white/80 px-8 text-center shadow-inner">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Preview Ready</div>
                    <div className="mt-3 text-xl font-semibold text-zinc-800">Set your dimensions to generate a scaled panel mockup</div>
                    <div className="mt-3 max-w-[30rem] text-sm leading-6 text-zinc-500">
                      Split direction, panel count, and upload artwork preview will appear here.
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

              <ControlBox title="Size" className="md:col-span-3 xl:col-span-3" helper="Up to 300in / 25ft per side.">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-1">
                  <input
                    type="number"
                    min={0.1}
                    max={maxByUnit}
                    step={0.25}
                    value={widthStr}
                    onChange={(event) => setWidthStr(event.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <div className="flex items-center justify-center text-sm font-semibold text-zinc-400">x</div>
                  <input
                    type="number"
                    min={0.1}
                    max={maxByUnit}
                    step={0.25}
                    value={heightStr}
                    onChange={(event) => setHeightStr(event.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                </div>
              </ControlBox>

              <ControlBox title="Units" className="md:col-span-2 xl:col-span-2" helper="Switch between inches and feet.">
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as PrintWrapUnit)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="inches">Inches</option>
                  <option value="feet">Feet</option>
                </select>
              </ControlBox>

              <ControlBox title="Laminate" className="md:col-span-2 xl:col-span-3" helper={selectedLaminate.note}>
                <select
                  value={laminate}
                  onChange={(event) => setLaminate(event.target.value as PrintWrapLaminate)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  {PRINT_WRAP_LAMINATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ControlBox>

              <ControlBox title="Split Direction" className="md:col-span-3 xl:col-span-4" helper="Auto follows 52in roll logic.">
                <select
                  value={splitDirection}
                  onChange={(event) => setSplitDirection(event.target.value as PrintWrapSplitDirection)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                </select>
              </ControlBox>

              <ControlBox title="Contour / Rush" className="md:col-span-2 xl:col-span-3" helper="Contour +15%, Rush +100%.">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setContourCut((value) => !value)}
                    className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                      contourCut
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    Contour
                  </button>
                  <button
                    type="button"
                    onClick={() => setRush((value) => !value)}
                    className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                      rush
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    Rush
                  </button>
                </div>
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
            <PanelCard eyebrow="Pricing" title="3M Print Wrap Film Breakdown">
              <div className="space-y-1">
                <BreakdownRow label="Area" value={pricing ? `${pricing.areaSqFt.toFixed(2)} sq ft` : "--"} muted={!pricing} />
                <BreakdownRow label="Base rate" value={pricing ? `${formatCurrency(pricing.baseRate)}/sq ft` : "--"} muted={!pricing} />
                <BreakdownRow label="Raw base" value={pricing ? formatCurrency(pricing.rawBase) : formatCurrency(0)} muted={!pricing} />
                <BreakdownRow label="Contour cut" value={pricing ? formatCharge(pricing.contourCutCharge) : formatCurrency(0)} muted={!pricing || !contourCut} />
                <BreakdownRow label="Rush" value={pricing ? formatCharge(pricing.rushCharge) : formatCurrency(0)} muted={!pricing || !rush} />
                <BreakdownRow label="Minimum floor" value={formatCurrency(PRINT_WRAP_MINIMUM_PRICE)} muted={!pricing} />
                <div className="my-2 border-t border-zinc-200" />
                <BreakdownRow label="Per-item total" value={pricing ? formatCurrency(pricing.perItemTotal) : formatCurrency(0)} strong />
                <BreakdownRow label="Quantity" value={String(pricing?.quantity ?? safeQuantity)} strong />
                <BreakdownRow label="Grand total" value={pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)} strong accent />
              </div>
              <div className="mt-3 text-xs leading-5 text-zinc-500">
                Signs365 model adapted for Signcous: {formatCurrency(PRINT_WRAP_BASE_RATE)}/sq ft base, +15% contour cut, +100% rush, and {formatCurrency(PRINT_WRAP_MINIMUM_PRICE)} minimum.
              </div>
            </PanelCard>

            <PanelCard eyebrow="Split Logic" title="Panel Planning">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryItem label="Roll Width" value={`${PRINT_WRAP_MAX_ROLL_WIDTH}"`} />
                <SummaryItem label="Requested Direction" value={splitDirection} />
                <SummaryItem label="Applied Direction" value={pricing ? appliedSplitDirection : "--"} />
                <SummaryItem label="Panel Count" value={pricing ? String(pricing.panelCount) : "--"} />
                <SummaryItem
                  label="Panel Size"
                  value={pricing ? `${formatInches(pricing.panelWidthIn)} x ${formatInches(pricing.panelHeightIn)}` : "--"}
                />
                <SummaryItem label="Laminate" value={selectedLaminate.label} />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Usage" title="Laminate Notes">
              <div className="space-y-2 text-sm text-zinc-600">
                {PRINT_WRAP_LAMINATE_OPTIONS.map((option) => (
                  <div key={option.value} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="font-semibold text-zinc-800">{option.label}</div>
                    <div className="text-xs text-zinc-600">{option.note}</div>
                  </div>
                ))}
              </div>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
