"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  DUAL_VIEW_CONSTRAINTS,
  DUAL_VIEW_MAX_PANEL_WIDTH,
  DUAL_VIEW_MINIMUM,
  DUAL_VIEW_PANEL_COST,
  calculateDualViewPrice,
  canFitWithRotation,
  getDualViewRate,
  type DualViewSide,
  type DualViewUnit,
} from "@/lib/pricing/dual-view";

interface DualViewBuilderProps {
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
      <span className={muted ? "text-zinc-400" : strong ? "font-semibold text-zinc-900" : "text-zinc-600"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          muted
            ? "text-zinc-400"
            : accent
            ? "font-semibold text-violet-600"
            : strong
            ? "font-semibold text-zinc-900"
            : "text-zinc-700"
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

function PanelSplitPreview({ panelCount }: { panelCount: number }) {
  if (panelCount <= 1) return null;

  return (
    <>
      {Array.from({ length: panelCount - 1 }, (_, i) => i + 1).map((lineNumber) => {
        const x = (lineNumber / panelCount) * 100;
        return (
          <div key={`v-${lineNumber}`} className="absolute inset-y-0" style={{ left: `${x}%` }}>
            <div className="absolute inset-y-0 border-l-2 border-dashed border-violet-400" />
            <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500 text-center text-xs font-bold leading-5 text-white">
              !
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function DualViewBuilder({ productId = 0 }: DualViewBuilderProps) {
  const cart = useCart();

  const [widthStr, setWidthStr] = useState("48");
  const [heightStr, setHeightStr] = useState("36");
  const [unit, setUnit] = useState<DualViewUnit>("inches");
  const [quantity, setQuantity] = useState(1);
  const [side, setSide] = useState<DualViewSide>("single");
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

  // When switching to double, clamp height if it exceeds the double-sided max
  function handleSideChange(newSide: DualViewSide) {
    if (newSide === "double") {
      const maxH = unit === "feet" ? DUAL_VIEW_CONSTRAINTS.double.maxHeight / 12 : DUAL_VIEW_CONSTRAINTS.double.maxHeight;
      if (parseFloat(heightStr) > maxH) {
        setHeightStr(String(maxH));
      }
    }
    setSide(newSide);
  }

  const constraints = DUAL_VIEW_CONSTRAINTS[side];
  const maxByUnit = unit === "inches" ? 300 : 25;
  const maxWIn = unit === "feet" ? constraints.maxWidth / 12 : constraints.maxWidth;
  const maxHIn = unit === "feet" ? constraints.maxHeight / 12 : constraints.maxHeight;

  // Check rotation for double-sided
  const rotationCheck = useMemo(() => {
    if (side !== "double" || !width || !height) return null;
    const wIn = unit === "feet" ? width * 12 : width;
    const hIn = unit === "feet" ? height * 12 : height;
    return canFitWithRotation(wIn, hIn, "double");
  }, [width, height, unit, side]);

  function rotateDimensions() {
    const w = widthStr;
    setWidthStr(heightStr);
    setHeightStr(w);
  }

  const widthError = useMemo(() => {
    if (widthStr === "") return null;
    if (width <= 0) return "Width must be greater than 0.";
    if (width > maxByUnit) return `Maximum width is ${maxByUnit} ${unit}.`;
    if (width > maxWIn) return `Max width for ${side}-sided is ${constraints.maxWidth}".`;
    return null;
  }, [widthStr, width, maxByUnit, maxWIn, unit, side, constraints.maxWidth]);

  const heightError = useMemo(() => {
    if (heightStr === "") return null;
    if (height <= 0) return "Height must be greater than 0.";
    if (height > maxByUnit) return `Maximum height is ${maxByUnit} ${unit}.`;
    if (height > maxHIn) return `Max height for ${side}-sided is ${constraints.maxHeight}".`;
    return null;
  }, [heightStr, height, maxByUnit, maxHIn, unit, side, constraints.maxHeight]);

  const isValid = !widthError && !heightError && width > 0 && height > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculateDualViewPrice({
            width,
            height,
            unit,
            quantity: safeQuantity,
            side,
            contourCut,
          })
        : null,
    [width, height, unit, safeQuantity, side, contourCut, isValid]
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
              ? "Upload rejected by server size limit."
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
      productName: "Dual View",
      width,
      height,
      unit,
      quantity: safeQuantity,
      material: `Dual View ${side === "double" ? "Double" : "Single"} Sided`,
      doubleSided: side === "double",
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush: false,
      uploadedFileUrl,
      uploadedFileName,
      unitPrice: pricing.perItemTotal,
      totalPrice: pricing.grandTotal,
      customOptions: {
        custom_width: `${width} ${unit}`,
        custom_height: `${height} ${unit}`,
        custom_side: side === "double" ? "Double Sided" : "Single Sided",
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_panel_count: String(pricing.panelCount),
        custom_panel_size: `${formatInches(pricing.panelWidthIn)} x ${formatInches(pricing.panelHeightIn)}`,
        custom_area_sqft: pricing.areaSqFt.toFixed(2),
        custom_base_rate: `${formatCurrency(pricing.baseRate)}/sq ft`,
        custom_panel_cost: formatCurrency(pricing.panelCost),
      },
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const previewWidth = pricing ? Math.max(240, Math.min(640, pricing.widthIn * 2.8)) : 320;
  const previewHeight = pricing ? Math.max(180, Math.min(460, pricing.heightIn * 2.8)) : 220;

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f5f3ff_0%,#ede9fe_55%,#e3dcff_100%)] text-zinc-800">
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
                <span className="font-semibold text-zinc-900">Dual View</span>
              </nav>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Dual View", "Single & Double Sided", "52in Panel Split", "Business Grade"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Dual View Builder</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Single or double-sided window graphic with 52in panel logic, tiered pricing, and contour cut option.
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-violet-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">
                {pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}
              </div>
              <div className="text-xs text-violet-700/80">
                {pricing
                  ? `${pricing.areaSqFt.toFixed(2)} sq ft · ${safeQuantity} unit${safeQuantity !== 1 ? "s" : ""}`
                  : "Set dimensions to calculate"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-700">
                  Dual View ·{" "}
                  {pricing
                    ? `${formatInches(pricing.widthIn)} x ${formatInches(pricing.heightIn)}`
                    : "Set dimensions"}{" "}
                  · {side === "double" ? "Double Sided" : "Single Sided"}
                </div>
                <div className="text-xs font-medium text-zinc-500">
                  {contourCut ? "Contour cut" : "Standard cut"}
                </div>
              </div>
              {(widthError || heightError) && (
                <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  {widthError || heightError}
                </div>
              )}
              {rotationCheck?.needsRotation && !widthError && !heightError && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    Rotate dimensions to fit double-sided constraints
                  </div>
                  <button
                    type="button"
                    onClick={rotateDimensions}
                    className="rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-200"
                  >
                    ↺ Rotate to Fit
                  </button>
                </div>
              )}
              {pricing && pricing.panelCount > 1 && (
                <div className="mt-2 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  ⚠ Width exceeds 52" — {pricing.panelCount} panels required (+{formatCurrency(pricing.panelCost)})
                </div>
              )}
            </div>

            <div
              className="relative h-[calc(100vh-290px)] min-h-[560px] overflow-hidden rounded-b-2xl bg-[#faf9ff]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,92,246,0.07) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="absolute left-5 top-5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                Upload artwork to preview panel splits
              </div>

              <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {side === "double" ? "Outside View" : "Print Side"}
              </div>
              {side === "double" && (
                <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Inside View (Mirror Print)
                </div>
              )}

              <div className="relative flex h-full items-center justify-center px-8 py-14">
                {pricing ? (
                  <>
                    <div
                      className="absolute border border-dashed border-violet-400/70"
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
                      className="relative overflow-hidden border border-violet-200 bg-white shadow-[0_26px_70px_rgba(109,40,217,0.10)]"
                      style={{ width: previewWidth, height: previewHeight }}
                    >
                      <div className="absolute inset-0 bg-[#fdfbff]" />
                      {/* Double-sided mirror effect overlay */}
                      {side === "double" && (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-100/20 to-violet-100/40" />
                      )}
                      {uploadedImage ? (
                        <Image
                          src={uploadedImage}
                          alt="Uploaded Dual View artwork preview"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-zinc-400">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.2em]">
                              Artwork Preview Area
                            </div>
                            <div className="mt-2 text-xs">
                              {uploadingArtwork ? "Uploading artwork..." : "No artwork uploaded yet"}
                            </div>
                          </div>
                        </div>
                      )}
                      <PanelSplitPreview panelCount={pricing.panelCount} />
                    </div>
                  </>
                ) : (
                  <div className="flex h-[250px] w-full max-w-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-violet-300 bg-white/80 px-8 text-center shadow-inner">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      Preview Ready
                    </div>
                    <div className="mt-3 text-xl font-semibold text-zinc-800">
                      Set your dimensions to generate a scaled panel mockup
                    </div>
                    <div className="mt-3 max-w-[30rem] text-sm leading-6 text-zinc-500">
                      Panel count and artwork preview will appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-6 xl:grid-cols-12">
              <ControlBox
                title="Artwork"
                className="md:col-span-3 xl:col-span-4"
                helper="Upload JPG, PNG, PDF, AI, EPS, PSD, or SVG."
              >
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
                      <button
                        type="button"
                        onClick={clearArtwork}
                        className="font-semibold text-zinc-500 hover:text-zinc-900"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}
                </div>
              </ControlBox>

              <ControlBox
                title="Print Side"
                className="md:col-span-3 xl:col-span-3"
                helper={
                  side === "single"
                    ? `Max ${DUAL_VIEW_CONSTRAINTS.single.maxWidth}" × ${DUAL_VIEW_CONSTRAINTS.single.maxHeight}"`
                    : `Max ${DUAL_VIEW_CONSTRAINTS.double.maxWidth}" × ${DUAL_VIEW_CONSTRAINTS.double.maxHeight}"`
                }
              >
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => handleSideChange("single")}
                    className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                      side === "single"
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSideChange("double")}
                    className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                      side === "double"
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    Double
                  </button>
                </div>
              </ControlBox>

              <ControlBox
                title="Size"
                className="md:col-span-2 xl:col-span-3"
                helper={`Max ${constraints.maxWidth}" W · ${constraints.maxHeight}" H`}
              >
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

              <ControlBox
                title="Units"
                className="md:col-span-2 xl:col-span-2"
                helper="Switch between inches and feet."
              >
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as DualViewUnit)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="inches">Inches</option>
                  <option value="feet">Feet</option>
                </select>
              </ControlBox>

              <ControlBox
                title="Contour"
                className="md:col-span-2 xl:col-span-2"
                helper="Contour cut +10%."
              >
                <button
                  type="button"
                  onClick={() => setContourCut((v) => !v)}
                  className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${
                    contourCut
                      ? "border-violet-300 bg-violet-50 text-violet-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {contourCut ? "Contour: On" : "Contour: Off"}
                </button>
              </ControlBox>

              <ControlBox title="Qty / Add" className="md:col-span-2 xl:col-span-4">
                <div className="grid grid-cols-[68px_1fr] gap-1">
                  <input
                    type="number"
                    min={1}
                    value={safeQuantity}
                    onChange={(event) =>
                      setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))
                    }
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <Button
                    className="h-9 rounded bg-violet-600 text-xs font-semibold text-white hover:bg-violet-500"
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
            <PanelCard eyebrow="Pricing" title="Dual View Breakdown">
              <div className="space-y-1">
                <BreakdownRow
                  label="Area"
                  value={pricing ? `${pricing.areaSqFt.toFixed(2)} sq ft` : "--"}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Print side"
                  value={side === "double" ? "Double Sided" : "Single Sided"}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Base rate (tiered)"
                  value={pricing ? `${formatCurrency(pricing.baseRate)}/sq ft` : "--"}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Raw base"
                  value={pricing ? formatCurrency(pricing.rawBase) : formatCurrency(0)}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Contour cut"
                  value={pricing ? formatCharge(pricing.contourCutCharge) : formatCurrency(0)}
                  muted={!pricing || !contourCut}
                />
                <BreakdownRow
                  label="Minimum floor"
                  value={formatCurrency(pricing ? pricing.minimumPrice : DUAL_VIEW_MINIMUM[side])}
                  muted={!pricing}
                />
                <BreakdownRow
                  label={`Panel cost (${pricing ? pricing.panelCount : "—"} panel${pricing && pricing.panelCount !== 1 ? "s" : ""})`}
                  value={pricing ? formatCharge(pricing.panelCost) : formatCurrency(0)}
                  muted={!pricing || (pricing?.panelCount ?? 1) <= 1}
                />
                <div className="my-2 border-t border-zinc-200" />
                <BreakdownRow
                  label="Per-item total"
                  value={pricing ? formatCurrency(pricing.perItemTotal) : formatCurrency(0)}
                  strong
                />
                <BreakdownRow label="Quantity" value={String(pricing?.quantity ?? safeQuantity)} strong />
                <BreakdownRow
                  label="Grand total"
                  value={pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}
                  strong
                  accent
                />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Split Logic" title="Panel Planning">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryItem label="Max Panel Width" value={`${DUAL_VIEW_MAX_PANEL_WIDTH}"`} />
                <SummaryItem label="Panel Count" value={pricing ? String(pricing.panelCount) : "--"} />
                <SummaryItem
                  label="Panel Size"
                  value={
                    pricing
                      ? `${formatInches(pricing.panelWidthIn)} x ${formatInches(pricing.panelHeightIn)}`
                      : "--"
                  }
                />
                <SummaryItem
                  label="Panel Surcharge"
                  value={pricing ? formatCurrency(pricing.panelCost) : "--"}
                />
                <SummaryItem label="Cost per Extra Panel" value={formatCurrency(DUAL_VIEW_PANEL_COST[side])} />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Rate Tiers" title="Dynamic Pricing">
              <div className="mb-3 grid grid-cols-2 gap-1">
                {(["single", "double"] as DualViewSide[]).map((s) => (
                  <div
                    key={s}
                    className={`rounded-lg border px-2 py-1.5 text-center text-xs font-semibold ${
                      side === s
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500"
                    }`}
                  >
                    {s === "single" ? "Single Sided" : "Double Sided"}
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-zinc-600">
                {(side === "single"
                  ? [
                      { range: "Under 10 sq ft", rate: "$4.90/sq ft", active: !!pricing && pricing.areaSqFt < 10 },
                      { range: "10–49 sq ft", rate: "$4.40/sq ft", active: !!pricing && pricing.areaSqFt >= 10 && pricing.areaSqFt < 50 },
                      { range: "50–149 sq ft", rate: "$4.10/sq ft", active: !!pricing && pricing.areaSqFt >= 50 && pricing.areaSqFt < 150 },
                      { range: "150+ sq ft", rate: "$3.90/sq ft", active: !!pricing && pricing.areaSqFt >= 150 },
                    ]
                  : [
                      { range: "Under 10 sq ft", rate: "$7.90/sq ft", active: !!pricing && pricing.areaSqFt < 10 },
                      { range: "10–49 sq ft", rate: "$7.10/sq ft", active: !!pricing && pricing.areaSqFt >= 10 && pricing.areaSqFt < 50 },
                      { range: "50–149 sq ft", rate: "$6.50/sq ft", active: !!pricing && pricing.areaSqFt >= 50 && pricing.areaSqFt < 150 },
                      { range: "150+ sq ft", rate: "$6.20/sq ft", active: !!pricing && pricing.areaSqFt >= 150 },
                    ]
                ).map((tier) => (
                  <div
                    key={tier.range}
                    className={`rounded-xl border px-3 py-2 ${
                      tier.active ? "border-violet-200 bg-violet-50" : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    <div className={`font-semibold ${tier.active ? "text-violet-800" : "text-zinc-800"}`}>
                      {tier.range}
                    </div>
                    <div className={`text-xs ${tier.active ? "text-violet-600" : "text-zinc-600"}`}>
                      {tier.rate}
                      {tier.active ? " ← active" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>

            <PanelCard eyebrow="Size Limits" title="Constraints by Type">
              <div className="space-y-2">
                {(["single", "double"] as DualViewSide[]).map((s) => {
                  const c = DUAL_VIEW_CONSTRAINTS[s];
                  const isActive = side === s;
                  return (
                    <div
                      key={s}
                      className={`rounded-xl border px-3 py-2 ${
                        isActive ? "border-violet-200 bg-violet-50" : "border-zinc-200 bg-zinc-50"
                      }`}
                    >
                      <div className={`font-semibold ${isActive ? "text-violet-800" : "text-zinc-800"}`}>
                        {s === "single" ? "Single Sided" : "Double Sided"}
                        {isActive ? " ← selected" : ""}
                      </div>
                      <div className="text-xs text-zinc-600">
                        Max {c.maxWidth}" W × {c.maxHeight}" H
                        {s === "double" ? " · Rotation supported" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
