"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  BOOTPRINTS_MIN,
  BOOTPRINTS_RATE,
  calculateBootprintsPrice,
  getBootprintsPanelInfo,
} from "@/lib/pricing/bootprints";

type DimensionUnit = "inches" | "feet";
type SplitDirection = "vertical" | "horizontal";

interface BootprintsBuilderProps {
  productId?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
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

function toInches(valueStr: string, unit: DimensionUnit): number {
  const n = parseFloat(valueStr) || 0;
  return unit === "feet" ? n * 12 : n;
}

export default function BootprintsBuilder({ productId = 0 }: BootprintsBuilderProps) {
  const cart = useCart();

  const [widthStr, setWidthStr] = useState("36");
  const [heightStr, setHeightStr] = useState("36");
  const [widthUnit, setWidthUnit] = useState<DimensionUnit>("inches");
  const [heightUnit, setHeightUnit] = useState<DimensionUnit>("inches");
  const [quantity, setQuantity] = useState(1);
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [splitDirection, setSplitDirection] = useState<SplitDirection>("vertical");
  const [selectedSplit, setSelectedSplit] = useState<"all" | number>("all");
  const [splitOffsets, setSplitOffsets] = useState<Record<number, number>>({});
  const [added, setAdded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const widthIn = toInches(widthStr, widthUnit);
  const heightIn = toInches(heightStr, heightUnit);
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);

  const widthError =
    widthStr !== "" && (widthIn <= 0 ? "Width must be greater than 0." : null);
  const heightError =
    heightStr !== "" && (heightIn <= 0 ? "Height must be greater than 0." : null);

  const isValid = !widthError && !heightError && widthIn > 0 && heightIn > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculateBootprintsPrice(widthIn, heightIn, { contourCut, rush }, safeQuantity)
        : null,
    [widthIn, heightIn, contourCut, rush, safeQuantity, isValid]
  );

  const panelInfo = useMemo(
    () => (isValid ? getBootprintsPanelInfo(widthIn, heightIn) : null),
    [widthIn, heightIn, isValid]
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

  // Split helpers
  const splitCount = panelInfo
    ? splitDirection === "vertical"
      ? panelInfo.panelsWide - 1
      : panelInfo.panelsHigh - 1
    : 0;

  const positionDisplay = useMemo(() => {
    const BASE = 48;
    if (selectedSplit === "all") return `${BASE}.00in`;
    const base = (selectedSplit as number) * BASE;
    const offset = splitOffsets[selectedSplit as number] ?? 0;
    return `${(base + offset).toFixed(2)}in`;
  }, [selectedSplit, splitOffsets]);

  function adjustSplitPosition(delta: number) {
    if (splitCount === 0) return;
    if (selectedSplit === "all") {
      setSplitOffsets((prev) => {
        const next = { ...prev };
        for (let i = 1; i <= splitCount; i++) next[i] = (next[i] ?? 0) + delta;
        return next;
      });
    } else {
      const idx = selectedSplit as number;
      setSplitOffsets((prev) => ({ ...prev, [idx]: (prev[idx] ?? 0) + delta }));
    }
  }

  function addToCart() {
    if (!isValid || !pricing) return;

    cart.addItem({
      productId,
      productName: "Outdoor Boot Prints (Heavy-Duty Floor Graphics)",
      width: widthIn,
      height: heightIn,
      unit: "inches",
      quantity: safeQuantity,
      material: "Heavy-Duty Floor Graphic",
      doubleSided: false,
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl,
      uploadedFileName,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
      customOptions: {
        custom_width_in: `${widthIn}"`,
        custom_height_in: `${heightIn}"`,
        custom_billable_width_ft: `${pricing.widthFt} ft`,
        custom_billable_height_ft: `${pricing.heightFt} ft`,
        custom_sq_ft: `${pricing.sqFt} sq ft`,
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_rush: rush ? "Yes" : "No",
        custom_split_direction: splitDirection,
        custom_split_count: String(splitCount),
        custom_split_offsets: JSON.stringify(splitOffsets),
      },
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  // Preview sizing
  const preview = useMemo(() => {
    if (!isValid) return { width: 300, height: 220 };

    const maxW = 620;
    const maxH = 440;
    const minW = 220;
    const minH = 180;

    const fitScale = Math.min(maxW / widthIn, maxH / heightIn);
    let pw = widthIn * fitScale;
    let ph = heightIn * fitScale;

    if (pw < minW || ph < minH) {
      const boost = Math.max(minW / pw, minH / ph);
      const bw = pw * boost;
      const bh = ph * boost;
      if (bw <= maxW && bh <= maxH) {
        pw = bw;
        ph = bh;
      }
    }

    return { width: pw, height: ph };
  }, [isValid, widthIn, heightIn]);

  // Panel lines (visual only, respect per-split offsets)
  const panelLines = useMemo(() => {
    if (!isValid || !panelInfo) return { verticals: [] as number[], horizontals: [] as number[] };
    const scaleX = preview.width / widthIn;
    const scaleY = preview.height / heightIn;
    const panelWidthIn = widthIn / panelInfo.panelsWide;
    const panelHeightIn = heightIn / panelInfo.panelsHigh;
    const verticals: number[] = [];
    const horizontals: number[] = [];
    if (splitDirection === "vertical") {
      for (let i = 1; i < panelInfo.panelsWide; i++) {
        const off = splitOffsets[i] ?? 0;
        verticals.push((i * panelWidthIn + off) * scaleX);
      }
    } else {
      for (let j = 1; j < panelInfo.panelsHigh; j++) {
        const off = splitOffsets[j] ?? 0;
        horizontals.push((j * panelHeightIn + off) * scaleY);
      }
    }
    return { verticals, horizontals };
  }, [isValid, panelInfo, preview, widthIn, heightIn, splitOffsets, splitDirection]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        {/* Header */}
        <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Link href="/" className="transition hover:text-zinc-900">Home</Link>
                <span>/</span>
                <Link href="/shop/adhesive" className="transition hover:text-zinc-900">Adhesive</Link>
                <span>/</span>
                <span className="font-semibold text-zinc-900">Outdoor Boot Prints</span>
              </nav>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "$14.95 / sq ft",
                  "Heavy-Duty Outdoor",
                  "Ceil-to-Foot Rounding",
                  "Contour Cut Optional",
                  "Rush Available",
                  "$40 Minimum",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
                Outdoor Boot Prints Builder
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Heavy-duty outdoor floor graphic panels at $14.95/sq ft. Built for high-traffic
                exterior environments. Dimensions billed in whole feet — each dimension rounded up
                before area is computed.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">
                {pricing ? formatCurrency(pricing.totalPrice) : formatCurrency(0)}
              </div>
              <div className="text-xs text-orange-700/80">
                {pricing
                  ? `${pricing.sqFt} sq ft · ${safeQuantity} unit${safeQuantity !== 1 ? "s" : ""}`
                  : "Set dimensions to calculate"}
              </div>
            </div>
          </div>
        </div>

        {/* Billable size banner */}
        {isValid && pricing && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700">
            <span>
              Size: <span className="font-semibold">{widthIn}&quot; × {heightIn}&quot;</span>
            </span>
            <span className="text-blue-400">→</span>
            <span>
              Billable Size:{" "}
              <span className="font-semibold">{pricing.widthFt} ft × {pricing.heightFt} ft</span>
            </span>
            <span className="text-blue-400">→</span>
            <span>
              Total Area: <span className="font-semibold">{pricing.sqFt} sq ft</span>
            </span>
            {splitCount > 0 && (
              <>
                <span className="text-blue-400">·</span>
                <span>
                  Cuts:{" "}
                  <span className="font-semibold">
                    {splitCount} × 48&quot; {splitDirection}
                  </span>
                </span>
              </>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {/* Preview canvas + controls */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-700">
                  Outdoor Boot Prints ·{" "}
                  {isValid && pricing
                    ? `${widthIn}" × ${heightIn}" (${pricing.widthFt} ft × ${pricing.heightFt} ft)`
                    : "Set dimensions"}
                </div>
                <div className="text-xs font-medium text-zinc-500">
                  {contourCut ? "Contour cut · " : ""}
                  {rush ? "Rush · " : ""}
                  Split: {splitDirection} · {splitCount} cut{splitCount !== 1 ? "s" : ""}
                </div>
              </div>
              {(widthError || heightError) && (
                <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  {widthError || heightError}
                </div>
              )}
            </div>

            {/* Canvas */}
            <div
              className="relative h-[calc(100vh-380px)] min-h-[480px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="absolute bottom-4 left-4 z-10 rounded-md border border-zinc-200 bg-white/95 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                Heavy-duty outdoor floor graphic — single-sided print
              </div>

              {isValid && (
                <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Top of Graphic
                </div>
              )}

              <div className="relative flex h-full items-center justify-center px-8 py-16">
                {isValid ? (
                  <>
                    {/* Dashed dimension border */}
                    <div
                      className="absolute border border-dashed border-zinc-400/70"
                      style={{ width: preview.width + 18, height: preview.height + 18 }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                        {widthIn}&quot;
                      </div>
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                        {widthIn}&quot;
                      </div>
                      <div className="absolute -left-9 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-zinc-500">
                        {heightIn}&quot;
                      </div>
                      <div className="absolute -right-9 top-1/2 -translate-y-1/2 rotate-90 text-xs font-semibold text-zinc-500">
                        {heightIn}&quot;
                      </div>
                    </div>

                    {/* Graphic panel */}
                    <div
                      className="relative overflow-hidden border border-zinc-300 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.13)]"
                      style={{ width: preview.width, height: preview.height }}
                    >
                      {/* Floor tile texture hint */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
                          backgroundSize: "40px 40px",
                        }}
                      />

                      {/* Panel split lines (visual/production only — no pricing impact) */}
                      {panelLines.verticals.map((x, i) => {
                        const isSel = selectedSplit === i + 1;
                        return (
                          <div
                            key={`v-${i}`}
                            className={`absolute top-0 h-full border-l-2 border-dashed ${
                              isSel ? "border-red-500" : "border-red-400/55"
                            }`}
                            style={{ left: x }}
                          >
                            <div
                              className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full shadow ${
                                isSel ? "bg-red-500" : "bg-red-400/80"
                              }`}
                            >
                              <div className="h-0.5 w-3 rounded-full bg-white" />
                            </div>
                          </div>
                        );
                      })}
                      {panelLines.horizontals.map((y, j) => {
                        const isSel = selectedSplit === j + 1;
                        return (
                          <div
                            key={`h-${j}`}
                            className={`absolute left-0 w-full border-t-2 border-dashed ${
                              isSel ? "border-red-500" : "border-red-400/55"
                            }`}
                            style={{ top: y }}
                          >
                            <div
                              className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full shadow ${
                                isSel ? "bg-red-500" : "bg-red-400/80"
                              }`}
                            >
                              <div className="h-0.5 w-3 rounded-full bg-white" />
                            </div>
                          </div>
                        );
                      })}

                      {uploadedImage ? (
                        <Image
                          src={uploadedImage}
                          alt="Uploaded outdoor boot prints artwork preview"
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
                    </div>

                    {/* Split count badge */}
                    {splitCount > 0 && (
                      <div className="absolute right-4 top-4 rounded-md border border-zinc-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm">
                        {splitCount} cut{splitCount !== 1 ? "s" : ""} @ 48&quot; ea
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-[250px] w-full max-w-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white/80 px-8 text-center shadow-inner">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      Preview Ready
                    </div>
                    <div className="mt-3 text-xl font-semibold text-zinc-800">
                      Set your dimensions to generate a live mockup
                    </div>
                    <div className="mt-3 max-w-[30rem] text-sm leading-6 text-zinc-500">
                      Dimensions billed to the nearest whole foot (rounded up). Panel split lines
                      shown for production guidance only — no pricing impact.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls strip */}
            <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-6 xl:grid-cols-12">
              {/* Artwork */}
              <ControlBox
                title="Artwork"
                className="md:col-span-3 xl:col-span-3"
                helper="JPG, PNG, PDF, AI, EPS, PSD, or SVG."
              >
                <div className="space-y-2">
                  <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
                    <input
                      type="file"
                      accept="image/*,.pdf,.ai,.eps,.psd,.svg"
                      className="hidden"
                      onChange={onUploadArtwork}
                    />
                    {uploadingArtwork
                      ? "Uploading..."
                      : uploadedFileName
                        ? "Replace Artwork"
                        : "Upload Artwork"}
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
                  {uploadError && (
                    <div className="text-xs font-medium text-red-600">{uploadError}</div>
                  )}
                </div>
              </ControlBox>

              {/* Width */}
              <ControlBox title="Width" className="md:col-span-2 xl:col-span-2" helper="Input value in selected unit.">
                <div className="grid grid-cols-[1fr_auto] gap-1">
                  <input
                    type="number"
                    min={0.1}
                    step={0.25}
                    value={widthStr}
                    onChange={(e) => setWidthStr(e.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <select
                    value={widthUnit}
                    onChange={(e) => setWidthUnit(e.target.value as DimensionUnit)}
                    className="h-9 rounded border border-zinc-300 bg-white px-1 text-xs"
                  >
                    <option value="inches">in</option>
                    <option value="feet">ft</option>
                  </select>
                </div>
              </ControlBox>

              {/* Height */}
              <ControlBox title="Height" className="md:col-span-2 xl:col-span-2" helper="Input value in selected unit.">
                <div className="grid grid-cols-[1fr_auto] gap-1">
                  <input
                    type="number"
                    min={0.1}
                    step={0.25}
                    value={heightStr}
                    onChange={(e) => setHeightStr(e.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value as DimensionUnit)}
                    className="h-9 rounded border border-zinc-300 bg-white px-1 text-xs"
                  >
                    <option value="inches">in</option>
                    <option value="feet">ft</option>
                  </select>
                </div>
              </ControlBox>

              {/* Contour Cut */}
              <ControlBox title="Contour Cut" className="md:col-span-2 xl:col-span-2" helper="+15% added to base.">
                <button
                  type="button"
                  onClick={() => setContourCut((v) => !v)}
                  className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${
                    contourCut
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {contourCut ? "Enabled" : "Disabled"}
                </button>
              </ControlBox>

              {/* Rush */}
              <ControlBox title="Rush" className="md:col-span-2 xl:col-span-2" helper="+100% of base price.">
                <button
                  type="button"
                  onClick={() => setRush((v) => !v)}
                  className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${
                    rush
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {rush ? "Rush" : "Standard"}
                </button>
              </ControlBox>

              {/* Split Direction */}
              <ControlBox title="Split Direction" className="md:col-span-2 xl:col-span-2" helper="Visual / production only.">
                <select
                  value={splitDirection}
                  onChange={(e) => {
                    setSplitDirection(e.target.value as SplitDirection);
                    setSelectedSplit("all");
                    setSplitOffsets({});
                  }}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                </select>
              </ControlBox>

              {/* Split Selected */}
              <ControlBox title="Split Selected" className="md:col-span-2 xl:col-span-2" helper="Pick a split to adjust.">
                <select
                  value={selectedSplit === "all" ? "all" : String(selectedSplit)}
                  onChange={(e) =>
                    setSelectedSplit(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="all">All Splits</option>
                  {Array.from({ length: splitCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Split {n}
                    </option>
                  ))}
                </select>
              </ControlBox>

              {/* Position */}
              <ControlBox title="Position" className="md:col-span-2 xl:col-span-3" helper="± 0.25in fine-tune. No pricing impact.">
                <div className="flex h-9 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustSplitPosition(-0.25)}
                    disabled={splitCount === 0}
                    className="flex h-9 w-[52px] shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    − 0.25&quot;
                  </button>
                  <div className="flex h-9 flex-1 items-center justify-center rounded border border-zinc-200 bg-zinc-100 px-1 text-xs font-semibold tabular-nums text-zinc-700">
                    {splitCount > 0 ? positionDisplay : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustSplitPosition(0.25)}
                    disabled={splitCount === 0}
                    className="flex h-9 w-[52px] shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + 0.25&quot;
                  </button>
                </div>
              </ControlBox>

              {/* Qty + Add */}
              <ControlBox title="Qty / Add" className="md:col-span-3 xl:col-span-5">
                <div className="grid grid-cols-[68px_1fr] gap-1">
                  <input
                    type="number"
                    min={1}
                    value={safeQuantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                    }
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

          {/* Sidebar panels */}
          <aside className="space-y-3">
            <PanelCard eyebrow="Pricing" title="Outdoor Boot Prints Breakdown">
              <div className="space-y-1">
                <BreakdownRow
                  label="Input size"
                  value={pricing ? `${widthIn}" × ${heightIn}"` : "--"}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Billable size"
                  value={pricing ? `${pricing.widthFt} ft × ${pricing.heightFt} ft` : "--"}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Total area"
                  value={pricing ? `${pricing.sqFt} sq ft` : "--"}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Base rate"
                  value={`${formatCurrency(BOOTPRINTS_RATE)} / sq ft`}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Base price"
                  value={pricing ? formatCurrency(pricing.base) : formatCurrency(0)}
                  muted={!pricing}
                />
                <BreakdownRow
                  label="Contour cut (+15%)"
                  value={pricing ? formatCharge(pricing.contourCutCharge) : formatCurrency(0)}
                  muted={!pricing || !contourCut}
                />
                <BreakdownRow
                  label="Rush (+100%)"
                  value={pricing ? formatCharge(pricing.rushCharge) : formatCurrency(0)}
                  muted={!pricing || !rush}
                />
                <BreakdownRow
                  label="Minimum floor"
                  value={formatCurrency(BOOTPRINTS_MIN)}
                  muted={!pricing}
                />
                <div className="my-2 border-t border-zinc-200" />
                <BreakdownRow
                  label="Unit price"
                  value={pricing ? formatCurrency(pricing.unitPrice) : formatCurrency(0)}
                  strong
                />
                <BreakdownRow label="Quantity" value={String(safeQuantity)} strong />
                <BreakdownRow
                  label="Grand total"
                  value={pricing ? formatCurrency(pricing.totalPrice) : formatCurrency(0)}
                  strong
                  accent
                />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Configuration" title="Order Settings">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryItem
                  label="Billable Size"
                  value={pricing ? `${pricing.widthFt} ft × ${pricing.heightFt} ft` : "--"}
                />
                <SummaryItem
                  label="Total Sq Ft"
                  value={pricing ? `${pricing.sqFt} sq ft` : "--"}
                />
                <SummaryItem label="Contour Cut" value={contourCut ? "Enabled (+15%)" : "Disabled"} />
                <SummaryItem label="Rush" value={rush ? "Enabled (+100%)" : "Standard"} />
                <SummaryItem
                  label="Split Direction"
                  value={splitDirection.charAt(0).toUpperCase() + splitDirection.slice(1)}
                />
                <SummaryItem
                  label="Split Count"
                  value={splitCount > 0 ? `${splitCount} cut${splitCount !== 1 ? "s" : ""}` : "None"}
                />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Pricing Note" title="Rounding Policy">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-600">
                Each dimension is rounded <strong>up</strong> to the nearest whole foot before the
                area is computed. Example: 100&quot; × 100&quot; bills as 9 ft × 9 ft = 81 sq ft.
              </div>
            </PanelCard>

            <PanelCard eyebrow="Split Note" title="Panel Split Guidance">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-600">
                Split lines at 48&quot; intervals are for print-file production guidance only.
                Split direction, selection, and position offset do not affect pricing.
              </div>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
