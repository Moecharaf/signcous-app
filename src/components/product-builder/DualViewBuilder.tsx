"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import SizeInputPanel, { composeDimensionInches, toFeetAndInches } from "@/components/product-builder/SizeInputPanel";
import Button from "@/components/ui/Button";
import RigidPricingHeader from "@/components/product-builder/RigidPricingHeader";
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
} from "@/lib/pricing/dual-view";
import { calculateProductionFootprint } from "@/lib/pricing";

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
            ? "font-semibold text-[var(--brand-primary)]"
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
            <div className="absolute inset-y-0 border-l-2 border-dashed border-[var(--brand-primary)]" />
            <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-primary)] text-center text-xs font-bold leading-5 text-white">
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

  const [widthFeet, setWidthFeet] = useState("0");
  const [widthInches, setWidthInches] = useState("0");
  const [heightFeet, setHeightFeet] = useState("0");
  const [heightInches, setHeightInches] = useState("0");
  const [quantity, setQuantity] = useState(1);
  const [side, setSide] = useState<DualViewSide>("single");
  const [contourCut, setContourCut] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const width = composeDimensionInches(widthFeet, widthInches);
  const height = composeDimensionInches(heightFeet, heightInches);
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);
  const footprint = useMemo(() => calculateProductionFootprint(width, height, "inches", 1), [width, height]);

  // When switching to double, clamp height if it exceeds the double-sided max
  function handleSideChange(newSide: DualViewSide) {
    if (newSide === "double") {
      const maxH = DUAL_VIEW_CONSTRAINTS.double.maxHeight;
      if (height > maxH) {
        const cappedHeight = toFeetAndInches(maxH);
        setHeightFeet(cappedHeight.feet);
        setHeightInches(cappedHeight.inches);
      }
    }
    setSide(newSide);
  }

  const constraints = DUAL_VIEW_CONSTRAINTS[side];
  const maxWIn = constraints.maxWidth;
  const maxHIn = constraints.maxHeight;

  // Check rotation for double-sided
  const rotationCheck = useMemo(() => {
    if (side !== "double" || !footprint.billedWidthIn || !footprint.billedHeightIn) return null;
    return canFitWithRotation(footprint.billedWidthIn, footprint.billedHeightIn, "double");
  }, [footprint.billedWidthIn, footprint.billedHeightIn, side]);

  function rotateDimensions() {
    const currentWidth = toFeetAndInches(width);
    const currentHeight = toFeetAndInches(height);
    setWidthFeet(currentHeight.feet);
    setWidthInches(currentHeight.inches);
    setHeightFeet(currentWidth.feet);
    setHeightInches(currentWidth.inches);
  }

  const widthError = useMemo(() => {
    if (width <= 0) return "Width must be greater than 0.";
    if (footprint.billedWidthIn > maxWIn) return `Max width for ${side}-sided is ${constraints.maxWidth}".`;
    return null;
  }, [width, footprint.billedWidthIn, maxWIn, side, constraints.maxWidth]);

  const heightError = useMemo(() => {
    if (height <= 0) return "Height must be greater than 0.";
    if (footprint.billedHeightIn > maxHIn) return `Max height for ${side}-sided is ${constraints.maxHeight}".`;
    return null;
  }, [height, footprint.billedHeightIn, maxHIn, side, constraints.maxHeight]);

  const isValid = !widthError && !heightError && width > 0 && height > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculateDualViewPrice({
            width,
            height,
            unit: "inches",
            quantity: safeQuantity,
            side,
            contourCut,
          })
        : null,
    [width, height, safeQuantity, side, contourCut, isValid]
  );

  const actualAreaLabel = pricing ? `${pricing.actualSqft.toFixed(2)} sq ft` : "--";
  const billedAreaLabel = pricing ? `${pricing.billedSqft.toFixed(2)} sq ft` : "--";
  const supplierRateLabel = pricing ? `${formatCurrency(pricing.supplierRate)}/sq ft` : "--";
  const retailPriceLabel = pricing ? formatCurrency(pricing.perItemTotal) : formatCurrency(0);
  const enteredSizeLabel = `${widthFeet} ft ${widthInches} in x ${heightFeet} ft ${heightInches} in`;

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
      width: pricing.billedWidthIn,
      height: pricing.billedHeightIn,
      unit: "inches",
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
        custom_entered_width: `${pricing.enteredWidthIn} inches`,
        custom_entered_height: `${pricing.enteredHeightIn} inches`,
        custom_billed_width: `${pricing.billedWidthIn} inches`,
        custom_billed_height: `${pricing.billedHeightIn} inches`,
        custom_width: `${pricing.billedWidthIn} inches`,
        custom_height: `${pricing.billedHeightIn} inches`,
        custom_side: side === "double" ? "Double Sided" : "Single Sided",
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_panel_count: String(pricing.panelCount),
        custom_panel_size: `${formatInches(pricing.panelWidthIn)} x ${formatInches(pricing.panelHeightIn)}`,
        custom_area_sqft: pricing.areaSqFt.toFixed(2),
        custom_billed_sqft: pricing.billedSqft.toFixed(2),
        custom_base_rate: `${formatCurrency(pricing.baseRate)}/sq ft`,
        custom_supplier_rate: `${formatCurrency(pricing.supplierRate)}/sq ft`,
        custom_production_cost: formatCurrency(pricing.productionCost),
        custom_retail_price: formatCurrency(pricing.perItemTotal),
        custom_panel_cost: formatCurrency(pricing.panelCost),
      },
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const previewMaxWidth = 640;
  const previewMaxHeight = 460;
  const previewMinWidth = 80;
  const previewMinHeight = 60;
  const previewScale = pricing
    ? Math.min(
        previewMaxWidth / Math.max(pricing.widthIn, 1),
        previewMaxHeight / Math.max(pricing.heightIn, 1)
      )
    : 1;
  const previewWidth = pricing
    ? Math.max(previewMinWidth, Math.round(pricing.widthIn * previewScale))
    : 320;
  const previewHeight = pricing
    ? Math.max(previewMinHeight, Math.round(pricing.heightIn * previewScale))
    : 220;

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <RigidPricingHeader
              section
              productName="DUAL VIEW"
              detail="Adhesive window film builder"
              totalPrice={pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}
              middleRows={[
                { label: "Actual Area", value: actualAreaLabel },
                { label: "Billed Area", value: billedAreaLabel },
                { label: "Qty", value: String(safeQuantity) },
              ]}
              accentClassName="text-[var(--brand-primary)]"
            />

            <div
              className="relative h-[calc(100vh-290px)] min-h-[560px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
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
                {(widthError || heightError) ? (
                  <div className="flex flex-col items-center justify-center rounded border-2 border-red-500 bg-white px-10 py-8 text-center shadow-lg" style={{ minWidth: 280, maxWidth: 440 }}>
                    <div className="text-base font-semibold leading-relaxed text-red-600">
                      The maximum dimensions for this material are{" "}
                      <span className="font-bold">
                        {constraints.maxWidth} inches by {constraints.maxHeight} inches
                      </span>
                      .
                    </div>
                    <div className="mt-3 text-sm text-red-400">
                      {side === "single" ? "Single-Sided" : "Double-Sided"} · {constraints.maxWidth}&quot; W × {constraints.maxHeight}&quot; H
                    </div>
                  </div>
                ) : pricing ? (
                  <>
                    <div
                      className="relative border border-zinc-300 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.13)] transition-[width,height] duration-150"
                      style={{ width: previewWidth, height: previewHeight }}
                    >
                      <div className="pointer-events-none absolute left-0 right-0 flex flex-col gap-1" style={{ bottom: "calc(100% + 4px)" }}>
                        <div className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">↓ TOP OF IMAGE ↓</div>
                        <div className="relative flex h-3 items-center">
                          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-400" />
                          <div className="absolute left-0 h-full w-px bg-zinc-400" />
                          <div className="absolute right-0 h-full w-px bg-zinc-400" />
                          <div className="relative w-full text-center leading-none">
                            <span className="bg-[#fafaf9] px-1 text-[11px] font-medium text-zinc-700">{formatInches(pricing.widthIn)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pointer-events-none absolute left-0 right-0" style={{ top: "calc(100% + 4px)" }}>
                        <div className="relative flex h-3 items-center">
                          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-400" />
                          <div className="absolute left-0 h-full w-px bg-zinc-400" />
                          <div className="absolute right-0 h-full w-px bg-zinc-400" />
                          <div className="relative w-full text-center leading-none">
                            <span className="bg-[#fafaf9] px-1 text-[11px] font-medium text-zinc-700">{formatInches(pricing.widthIn)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pointer-events-none absolute bottom-0 top-0 flex flex-col items-center" style={{ right: "calc(100% + 8px)", width: "20px" }}>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                        <div className="relative flex flex-1 items-center justify-center">
                          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-400" />
                          <span className="relative -rotate-90 whitespace-nowrap bg-[#fafaf9] py-0.5 text-[11px] font-medium text-zinc-700">{formatInches(pricing.heightIn)}</span>
                        </div>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                      </div>
                      <div className="pointer-events-none absolute bottom-0 top-0 flex flex-col items-center" style={{ left: "calc(100% + 8px)", width: "20px" }}>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                        <div className="relative flex flex-1 items-center justify-center">
                          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-400" />
                          <span className="relative rotate-90 whitespace-nowrap bg-[#fafaf9] py-0.5 text-[11px] font-medium text-zinc-700">{formatInches(pricing.heightIn)}</span>
                        </div>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                      </div>

                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-[#fdfbff]" />
                        {/* Double-sided mirror effect overlay */}
                        {side === "double" && (
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-100/20 to-sky-100/40" />
                        )}
                        {uploadedImage ? (
                          <Image
                            src={uploadedImage}
                            alt="Uploaded Dual View artwork preview"
                            fill
                            unoptimized
                            className="object-fill"
                          />
                        ) : uploadedFileUrl && uploadedFileName?.toLowerCase().endsWith(".pdf") ? (
                          <div className="relative h-full w-full">
                            <iframe
                              src={`${uploadedFileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
                              title="Uploaded PDF artwork preview"
                              className="absolute -left-3 top-0 h-full w-[calc(100%+32px)] pointer-events-none"
                              scrolling="no" style={{ clipPath: "inset(0 20px 0 0)" }}
                            />
                          </div>
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
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="flex h-[330px] w-[min(500px,calc(100vw-40px))] items-center justify-center border-[1.5px] border-dashed border-zinc-400 bg-[#f7f7f7] text-center">
                      <div className="px-6 text-zinc-500">
                        <div className="text-[14px] font-medium uppercase tracking-[0.02em]">Please specify dimensions or</div>
                        <div className="mt-1 text-[14px] font-medium uppercase tracking-[0.02em]">click to select an image</div>
                        <div className="mt-4 flex justify-center text-zinc-400">
                          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
                            <rect x="7" y="7" width="42" height="42" stroke="currentColor" strokeWidth="2" />
                            <circle cx="25" cy="29" r="6" stroke="currentColor" strokeWidth="2" />
                            <rect x="34" y="16" width="8" height="5" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <BuilderBottomToolbar
              panels={[
                { id: "artwork", title: "Artwork", value: uploadedFileName ? "Uploaded" : "No file", width: 420, content: <><label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400"><input type="file" accept="image/*,.pdf,.ai,.eps,.psd,.svg" className="hidden" onChange={onUploadArtwork} />{uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}</label>{uploadedFileName && <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600"><span className="truncate">{uploadedFileName}</span><button type="button" onClick={clearArtwork} className="font-semibold text-zinc-500 hover:text-zinc-900">Remove</button></div>}{uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}</> },
                { id: "print-side", title: "Print Side", value: side === "double" ? "Double" : "Single", width: 320, content: <div className="grid grid-cols-2 gap-1"><button type="button" onClick={() => handleSideChange("single")} className={`h-9 rounded border px-3 text-xs font-semibold transition ${side === "single" ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>Single</button><button type="button" onClick={() => handleSideChange("double")} className={`h-9 rounded border px-3 text-xs font-semibold transition ${side === "double" ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>Double</button></div> },
                {
                  id: "size",
                  title: "Size",
                    value: pricing ? `${formatInches(pricing.billedWidthIn)} x ${formatInches(pricing.billedHeightIn)}` : "Set dimensions",
                  status: widthError || heightError ? "alert" : "ok",
                  width: 360,
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
                      error={widthError || heightError}
                      helper="Up to 25 ft 0 in per side."
                    />
                  ),
                },
                { id: "contour", title: "Contour", value: contourCut ? "On" : "Off", width: 260, content: <button type="button" onClick={() => setContourCut((v) => !v)} className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${contourCut ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>{contourCut ? "Contour: On" : "Contour: Off"}</button> },
                { id: "quantity", title: "Quantity", value: String(safeQuantity), width: 260, content: <input type="number" min={1} value={safeQuantity} onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))} className="h-9 w-full rounded border border-zinc-300 px-2 text-sm" /> },
              ] satisfies BuilderBottomToolbarPanel[]}
              action={<Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" disabled={!isValid} onClick={addToCart}>{added ? "Added" : "Add"}</Button>}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

