"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import AdhesivePricingModal from "@/components/product-builder/AdhesivePricingModal";
import { ADHESIVE_PRICING_CONFIGS } from "@/components/product-builder/adhesive-pricing-data";
import {
  CONTOUR_SIZE_TOLERANCE_INCHES,
  contourSizesMatch,
  formatSizeForMessage,
} from "@/components/product-builder/contour-cut";
import { type UploadedImageSize } from "@/components/product-builder/uploaded-image-size";
import { getUploadedImageSizeInches } from "@/components/product-builder/uploaded-image-size";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  LOW_TAC_WALL_MARKUP_MULTIPLIER,
  LOW_TAC_WALL_SUPPLIER_RATE,
  calculateLowTacWallPrice,
  getLowTacWallPanelInfo,
} from "@/lib/pricing/low-tac-wall";

type DimensionUnit = "inches" | "feet";
type SplitDirection = "vertical" | "horizontal";

interface LowTacWallBuilderProps {
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
          muted ? "text-zinc-400" : accent ? "font-semibold text-[var(--brand-primary)]" : strong ? "font-semibold text-zinc-900" : "text-zinc-700"
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

export default function LowTacWallBuilder({ productId = 0 }: LowTacWallBuilderProps) {
  const cart = useCart();

  const [widthStr, setWidthStr] = useState("0");
  const [heightStr, setHeightStr] = useState("0");
  const [widthUnit, setWidthUnit] = useState<DimensionUnit>("inches");
  const [heightUnit, setHeightUnit] = useState<DimensionUnit>("inches");
  const [quantity, setQuantity] = useState(1);
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [splitDirection, setSplitDirection] = useState<SplitDirection>("vertical");
  const [selectedSplit, setSelectedSplit] = useState<"all" | number>("all");
  const [splitOffsets, setSplitOffsets] = useState<Record<number, number>>({});
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [artworkImageSize, setArtworkImageSize] = useState<UploadedImageSize | null>(null);
  const [contourFileUrl, setContourFileUrl] = useState<string | null>(null);
  const [contourFileName, setContourFileName] = useState<string | null>(null);
  const [contourImage, setContourImage] = useState<string | null>(null);
  const [uploadingContour, setUploadingContour] = useState(false);
  const [contourAlignmentConfirmed, setContourAlignmentConfirmed] = useState(false);
  const [imageDisplayMode, setImageDisplayMode] = useState<"fit" | "stretch">("fit");
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const widthIn = toInches(widthStr, widthUnit);
  const heightIn = toInches(heightStr, heightUnit);
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);

  const widthError = widthStr !== "" && (widthIn <= 0 ? "Width must be greater than 0." : null);
  const heightError = heightStr !== "" && (heightIn <= 0 ? "Height must be greater than 0." : null);
  const isValid = !widthError && !heightError && widthIn > 0 && heightIn > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculateLowTacWallPrice(widthIn, heightIn, { contourCut, rush }, safeQuantity)
        : null,
    [widthIn, heightIn, contourCut, rush, safeQuantity, isValid]
  );

  const panelInfo = useMemo(
    () => (isValid ? getLowTacWallPanelInfo(widthIn, heightIn) : null),
    [widthIn, heightIn, isValid]
  );

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
      if (contourImage) URL.revokeObjectURL(contourImage);
    };
  }, [uploadedImage, contourImage]);

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

      const imageSize = await getUploadedImageSizeInches(file);
      setArtworkImageSize(imageSize);
      if (imageSize) {
        setWidthUnit("inches");
        setHeightUnit("inches");
        setWidthStr(imageSize.widthInches.toString());
        setHeightStr(imageSize.heightInches.toString());
      }

      setContourFileUrl(null);
      setContourFileName(null);
      setContourAlignmentConfirmed(false);
      setContourImage((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });

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
    setArtworkImageSize(null);
    setContourFileUrl(null);
    setContourFileName(null);
    setContourAlignmentConfirmed(false);
    setContourImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setUploadError(null);
  }

  async function onUploadContourFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!uploadedFileUrl || !artworkImageSize) {
      setUploadError("Upload image artwork first so contour size can be validated.");
      event.target.value = "";
      return;
    }

    const contourSize = await getUploadedImageSizeInches(file);
    if (!contourSize) {
      setUploadError("Contour cut file must be a PDF so size can be validated.");
      event.target.value = "";
      return;
    }

    if (!contourSizesMatch(artworkImageSize, contourSize)) {
      setUploadError(
        `Contour cut size must match artwork within ${CONTOUR_SIZE_TOLERANCE_INCHES.toFixed(2)} in. Artwork: ${formatSizeForMessage(
          artworkImageSize
        )}, Contour: ${formatSizeForMessage(contourSize)}.`
      );
      event.target.value = "";
      return;
    }

    setUploadingContour(true);
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
              : `Contour upload failed with status ${response.status}. ${raw.slice(0, 180)}`,
        };
      }

      if (!response.ok || !data.fileUrl) {
        setUploadError(data.error ?? `Contour upload failed (status ${response.status}).`);
        return;
      }

      setContourFileUrl(data.fileUrl);
      setContourFileName(data.originalName ?? file.name);
      setContourAlignmentConfirmed(false);

      const blobUrl = URL.createObjectURL(file);
      setContourImage((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return blobUrl;
      });
    } catch {
      setUploadError("Contour upload failed. Please try again.");
    } finally {
      setUploadingContour(false);
      event.target.value = "";
    }
  }

  function clearContourFile() {
    setContourFileUrl(null);
    setContourFileName(null);
    setContourAlignmentConfirmed(false);
    setContourImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setUploadError(null);
  }

  function handleContourToggle() {
    setContourCut((value) => {
      const next = !value;
      if (!next) {
        clearContourFile();
      }
      return next;
    });
  }

  // Split helpers
  const splitCount = panelInfo
    ? splitDirection === "vertical"
      ? panelInfo.panelsWide - 1
      : panelInfo.panelsHigh - 1
    : 0;

  const positionDisplay = useMemo(() => {
    if (!panelInfo) return "—";
    const panelDimIn =
      splitDirection === "vertical"
        ? widthIn / panelInfo.panelsWide
        : heightIn / panelInfo.panelsHigh;
    if (selectedSplit === "all") return `${panelDimIn.toFixed(2)}in`;
    const idx = selectedSplit as number;
    const offset = splitOffsets[idx] ?? 0;
    return `${(idx * panelDimIn + offset).toFixed(2)}in`;
  }, [selectedSplit, splitOffsets, panelInfo, splitDirection, widthIn, heightIn]);

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
    if (uploadingArtwork || uploadingContour) {
      setUploadError("Please wait for uploads to finish.");
      return;
    }
    if (contourCut) {
      if (!uploadedFileUrl || !artworkImageSize) {
        setUploadError("Upload image artwork first before contour cut.");
        return;
      }
      if (!contourFileUrl || !contourFileName || !contourImage) {
        setUploadError("Upload a contour cut file to continue.");
        return;
      }
      if (!contourAlignmentConfirmed) {
        setUploadError("Confirm contour alignment before adding to cart.");
        return;
      }
    }

    cart.addItem({
      productId,
      productName: "Removable Wall Decals (Low-Tac Wall Graphics)",
      width: widthIn,
      height: heightIn,
      unit: "inches",
      quantity: safeQuantity,
      material: "Low-Tac Wall Vinyl",
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
        custom_contour_cut_file: contourFileName ?? "None",
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

  // Panel lines — percentage-based like GF2030 so lines always divide equally
  const panelLines = useMemo(() => {
    if (!isValid || !panelInfo) return { verticals: [] as number[], horizontals: [] as number[] };
    const verticals: number[] = [];
    const horizontals: number[] = [];
    if (splitDirection === "vertical") {
      for (let i = 1; i < panelInfo.panelsWide; i++) {
        const offPct = ((splitOffsets[i] ?? 0) / widthIn) * 100;
        verticals.push((i / panelInfo.panelsWide) * 100 + offPct);
      }
    } else {
      for (let j = 1; j < panelInfo.panelsHigh; j++) {
        const offPct = ((splitOffsets[j] ?? 0) / heightIn) * 100;
        horizontals.push((j / panelInfo.panelsHigh) * 100 + offPct);
      }
    }
    return { verticals, horizontals };
  }, [isValid, panelInfo, widthIn, heightIn, splitOffsets, splitDirection]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="grid gap-4">
          {/* Preview canvas + controls */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div
              className="bg-[#fafaf9] px-4 py-3"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="grid gap-3 md:grid-cols-[0.85fr_1.4fr_0.85fr] md:items-start md:gap-8">
                <div>
                  <div className="text-[27px] leading-[0.98] font-medium uppercase tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">LOW TAC WALL</div>
                  <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">Adhesive wall graphic builder</div>
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
                        <tr>
                          <td className="py-0.5 text-left text-zinc-500">Low Tac Wall</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency(LOW_TAC_WALL_SUPPLIER_RATE * LOW_TAC_WALL_MARKUP_MULTIPLIER)} per sq ft</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPricingModalOpen(true)}
                    className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
                  >
                    Pricing And Shipping
                  </button>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-[34px] leading-none font-semibold text-[var(--brand-primary)] md:text-[44px]">{pricing ? formatCurrency(pricing.totalPrice) : formatCurrency(0)}</div>
                  <div className="mt-1 text-[10px] text-zinc-500">Live total</div>
                </div>
              </div>
            </div>

            <AdhesivePricingModal
              isOpen={isPricingModalOpen}
              onClose={() => setIsPricingModalOpen(false)}
              config={ADHESIVE_PRICING_CONFIGS.lowTacWall}
            />

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
                Removable wall graphic — single-sided print
              </div>

              {isValid && (
                <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Top of Graphic
                </div>
              )}

              <div className="relative flex h-full items-center justify-center px-8 py-16">
                {isValid ? (
                  <>
                    {/* Graphic panel */}
                    <div
                      className="relative border border-zinc-300 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.13)]"
                      style={{ width: preview.width, height: preview.height }}
                    >
                      <div className="pointer-events-none absolute left-0 right-0 flex flex-col gap-1" style={{ bottom: "calc(100% + 4px)" }}>
                        <div className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">↓ TOP OF IMAGE ↓</div>
                        <div className="relative flex h-3 items-center">
                          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-400" />
                          <div className="absolute left-0 h-full w-px bg-zinc-400" />
                          <div className="absolute right-0 h-full w-px bg-zinc-400" />
                          <div className="relative w-full text-center leading-none">
                            <span className="bg-[#fafaf9] px-1 text-[11px] font-medium text-zinc-700">{widthIn}&quot;</span>
                          </div>
                        </div>
                      </div>
                      <div className="pointer-events-none absolute left-0 right-0" style={{ top: "calc(100% + 4px)" }}>
                        <div className="relative flex h-3 items-center">
                          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-400" />
                          <div className="absolute left-0 h-full w-px bg-zinc-400" />
                          <div className="absolute right-0 h-full w-px bg-zinc-400" />
                          <div className="relative w-full text-center leading-none">
                            <span className="bg-[#fafaf9] px-1 text-[11px] font-medium text-zinc-700">{widthIn}&quot;</span>
                          </div>
                        </div>
                      </div>
                      <div className="pointer-events-none absolute bottom-0 top-0 flex flex-col items-center" style={{ right: "calc(100% + 8px)", width: "20px" }}>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                        <div className="relative flex flex-1 items-center justify-center">
                          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-400" />
                          <span className="relative -rotate-90 whitespace-nowrap bg-[#fafaf9] py-0.5 text-[11px] font-medium text-zinc-700">{heightIn}&quot;</span>
                        </div>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                      </div>
                      <div className="pointer-events-none absolute bottom-0 top-0 flex flex-col items-center" style={{ left: "calc(100% + 8px)", width: "20px" }}>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                        <div className="relative flex flex-1 items-center justify-center">
                          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-400" />
                          <span className="relative rotate-90 whitespace-nowrap bg-[#fafaf9] py-0.5 text-[11px] font-medium text-zinc-700">{heightIn}&quot;</span>
                        </div>
                        <div className="h-px w-full flex-none bg-zinc-400" />
                      </div>

                      <div className="absolute inset-0 overflow-hidden">
                      {/* Subtle wall texture */}
                      <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(0deg, transparent, transparent 39px, #555 39px, #555 40px), repeating-linear-gradient(90deg, transparent, transparent 79px, #555 79px, #555 80px)",
                        }}
                      />

                      {/* Panel split lines (visual/production only) */}
                      {panelLines.verticals.map((x, i) => {
                        const isSel = selectedSplit === i + 1;
                        return (
                          <div
                            key={`v-${i}`}
                            className={`absolute top-0 h-full border-l-2 border-dashed ${
                              isSel ? "border-red-500" : "border-red-400/55"
                            }`}
                            style={{ left: `${x}%` }}
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
                            style={{ top: `${y}%` }}
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
                          alt="Uploaded wall decal artwork preview"
                          fill
                          unoptimized
                          className={imageDisplayMode === "stretch" ? "object-fill" : "object-contain"}
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
                      </div>
                    </div>

                    {/* Split count badge */}
                    {splitCount > 0 && (
                      <div className="absolute right-4 top-4 rounded-md border border-zinc-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm">
                        {splitCount} cut{splitCount !== 1 ? "s" : ""} @ 48&quot; ea
                      </div>
                    )}
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

            {/* Controls strip */}
            <BuilderBottomToolbar
              panels={[
                { id: "artwork", title: "Artwork", value: uploadedFileName ? "Uploaded" : "No file", width: 420, content: <><label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400"><input type="file" accept="image/*,.pdf,.ai,.eps,.psd,.svg" className="hidden" onChange={onUploadArtwork} />{uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}</label><div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImageDisplayMode("fit")}
              className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                imageDisplayMode === "fit"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => setImageDisplayMode("stretch")}
              className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                imageDisplayMode === "stretch"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              Stretch
            </button>
          </div>{uploadedFileName && <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600"><span className="truncate">{uploadedFileName}</span><button type="button" onClick={clearArtwork} className="font-semibold text-zinc-500 hover:text-zinc-900">Remove</button></div>}
          {contourCut && (
            <>
              <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded border border-dashed border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={onUploadContourFile} />
                {uploadingContour ? "Uploading Contour..." : contourFileName ? "Replace Contour File" : "Upload Contour File"}
              </label>
              {contourFileName && <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600"><span className="truncate">{contourFileName}</span><button type="button" onClick={clearContourFile} className="font-semibold text-zinc-500 hover:text-zinc-900">Remove</button></div>}
              {uploadedImage && contourImage && (
                <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
                  <div className="mb-2 text-[11px] text-zinc-600">Confirm contour line aligns with artwork.</div>
                  <div className="relative h-28 overflow-hidden rounded border border-zinc-300 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage} alt="Artwork preview" className="absolute inset-0 h-full w-full object-contain" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <object data={contourImage} type="application/pdf" aria-label="Contour overlay" className="absolute inset-0 h-full w-full object-contain opacity-70 mix-blend-multiply" />
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs text-zinc-700">
                    <input type="checkbox" checked={contourAlignmentConfirmed} onChange={(event) => setContourAlignmentConfirmed(event.target.checked)} />
                    I confirm contour cut alignment is correct.
                  </label>
                </div>
              )}
            </>
          )}
          {uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}</> },
                { id: "width", title: "Width", value: `${widthIn || 0}${widthUnit === "feet" ? " ft" : " in"}`, status: widthError ? "alert" : "ok", width: 280, content: <div className="grid grid-cols-[1fr_auto] gap-1"><input type="number" min={0.1} step={0.25} value={widthStr} onChange={(e) => setWidthStr(e.target.value)} className="h-9 rounded border border-zinc-300 px-2 text-sm" /><select value={widthUnit} onChange={(e) => setWidthUnit(e.target.value as DimensionUnit)} className="h-9 rounded border border-zinc-300 bg-white px-1 text-xs"><option value="inches">in</option><option value="feet">ft</option></select></div> },
                { id: "height", title: "Height", value: `${heightIn || 0}${heightUnit === "feet" ? " ft" : " in"}`, status: heightError ? "alert" : "ok", width: 280, content: <div className="grid grid-cols-[1fr_auto] gap-1"><input type="number" min={0.1} step={0.25} value={heightStr} onChange={(e) => setHeightStr(e.target.value)} className="h-9 rounded border border-zinc-300 px-2 text-sm" /><select value={heightUnit} onChange={(e) => setHeightUnit(e.target.value as DimensionUnit)} className="h-9 rounded border border-zinc-300 bg-white px-1 text-xs"><option value="inches">in</option><option value="feet">ft</option></select></div> },
                { id: "contour", title: "Contour Cut", value: contourCut ? "Enabled" : "Disabled", width: 260, content: <button type="button" onClick={handleContourToggle} className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${contourCut ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>{contourCut ? "Enabled" : "Disabled"}</button> },
                { id: "rush", title: "Rush", value: rush ? "Rush" : "Standard", width: 260, content: <button type="button" onClick={() => setRush((v) => !v)} className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${rush ? "border-red-300 bg-red-50 text-red-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>{rush ? "Rush" : "Standard"}</button> },
                { id: "split-direction", title: "Split Direction", value: splitDirection, width: 280, content: <select value={splitDirection} onChange={(e) => { setSplitDirection(e.target.value as SplitDirection); setSelectedSplit("all"); setSplitOffsets({}); }} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select> },
                { id: "split-selected", title: "Split Selected", value: selectedSplit === "all" ? "All Splits" : `Split ${selectedSplit}`, width: 280, content: <select value={selectedSplit === "all" ? "all" : String(selectedSplit)} onChange={(e) => setSelectedSplit(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"><option value="all">All Splits</option>{Array.from({ length: splitCount }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Split {n}</option>)}</select> },
                { id: "position", title: "Position", value: splitCount > 0 ? positionDisplay : "—", width: 340, content: <div className="flex h-9 items-center gap-1"><button type="button" onClick={() => adjustSplitPosition(-0.25)} disabled={splitCount === 0} className="flex h-9 w-[72px] shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40">− 0.25&quot;</button><div className="flex h-9 flex-1 items-center justify-center rounded border border-zinc-200 bg-zinc-100 px-1 text-xs font-semibold tabular-nums text-zinc-700">{splitCount > 0 ? positionDisplay : "—"}</div><button type="button" onClick={() => adjustSplitPosition(0.25)} disabled={splitCount === 0} className="flex h-9 w-[72px] shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40">+ 0.25&quot;</button></div> },
                { id: "quantity", title: "Quantity", value: String(safeQuantity), width: 260, content: <input type="number" min={1} value={safeQuantity} onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))} className="h-9 w-full rounded border border-zinc-300 px-2 text-sm" /> },
              ] satisfies BuilderBottomToolbarPanel[]}
              action={<Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" disabled={!isValid} onClick={addToCart}>{added ? "Added" : "Add"}</Button>}
            />
            {false && (
            <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-6 xl:grid-cols-12">
              {/* Artwork */}
              <ControlBox title="Artwork" className="md:col-span-3 xl:col-span-3" helper="JPG, PNG, PDF, AI, EPS, PSD, or SVG.">
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
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImageDisplayMode("fit")}
              className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                imageDisplayMode === "fit"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => setImageDisplayMode("stretch")}
              className={`h-9 rounded border px-3 text-xs font-semibold transition ${
                imageDisplayMode === "stretch"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              Stretch
            </button>
          </div>          {uploadedFileName && (
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
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
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
                    className="h-9 rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
                    disabled={!isValid}
                    onClick={addToCart}
                  >
                    {added ? "Added" : "Add"}
                  </Button>
                </div>
              </ControlBox>
            </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

