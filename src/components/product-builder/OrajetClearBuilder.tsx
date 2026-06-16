"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import {
  CONTOUR_SIZE_TOLERANCE_INCHES,
  contourSizesMatch,
  formatSizeForMessage,
} from "@/components/product-builder/contour-cut";
import SizeInputPanel, { composeDimensionInches, toFeetAndInches } from "@/components/product-builder/SizeInputPanel";
import { getUploadedImageSizeInches, type UploadedImageSize } from "@/components/product-builder/uploaded-image-size";
import Button from "@/components/ui/Button";
import AdhesivePricingModal from "@/components/product-builder/AdhesivePricingModal";
import { ADHESIVE_PRICING_CONFIGS } from "@/components/product-builder/adhesive-pricing-data";
import { useCart } from "@/context/CartContext";
import {
  ORAJET_CLEAR_MARKUP_MULTIPLIER,
  ORAJET_CLEAR_MAX_PANEL_WIDTH,
  ORAJET_CLEAR_SUPPLIER_RATE,
  calculateOrajetClearPrice,
  type OrajetClearSplitDirection,
} from "@/lib/pricing/orajet-clear";

interface OrajetClearBuilderProps {
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
              <div className="absolute inset-y-0 border-l-2 border-dashed border-blue-400" />
              <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 text-center text-xs font-bold leading-5 text-white">
                !
              </div>
            </div>
          );
        }

        const y = (lineNumber / panelCount) * 100;
        return (
          <div key={`h-${lineNumber}`} className="absolute inset-x-0" style={{ top: `${y}%` }}>
            <div className="absolute inset-x-0 border-t-2 border-dashed border-blue-400" />
            <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 text-center text-xs font-bold leading-5 text-white">
              !
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function OrajetClearBuilder({ productId = 0 }: OrajetClearBuilderProps) {
  const cart = useCart();

  const [widthFeet, setWidthFeet] = useState("0");
  const [widthInches, setWidthInches] = useState("0");
  const [heightFeet, setHeightFeet] = useState("0");
  const [heightInches, setHeightInches] = useState("0");
  const [contourCut, setContourCut] = useState(false);
  const [splitDirection, setSplitDirection] = useState<OrajetClearSplitDirection>("auto");
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

  const width = composeDimensionInches(widthFeet, widthInches);
  const height = composeDimensionInches(heightFeet, heightInches);
  const safeQuantity = 1;

  const widthError = width <= 0 ? "Width must be greater than 0." : null;
  const heightError = height <= 0 ? "Height must be greater than 0." : null;
  const isValid = !widthError && !heightError && width > 0 && height > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculateOrajetClearPrice({
            width,
            height,
            unit: "inches",
            quantity: safeQuantity,
            contourCut,
            rush: false,
            splitDirection,
          })
        : null,
    [width, height, safeQuantity, contourCut, splitDirection, isValid]
  );

  const appliedSplitDirection = useMemo(() => {
    if (!pricing) return "none" as const;
    if (pricing.panelCount <= 1) return "none" as const;
    if (splitDirection === "vertical" || splitDirection === "horizontal") return splitDirection;
    return pricing.widthIn >= pricing.heightIn ? "vertical" : "horizontal";
  }, [pricing, splitDirection]);

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
        const widthParts = toFeetAndInches(imageSize.widthInches);
        const heightParts = toFeetAndInches(imageSize.heightInches);
        setWidthFeet(widthParts.feet);
        setWidthInches(widthParts.inches);
        setHeightFeet(heightParts.feet);
        setHeightInches(heightParts.inches);
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
      setUploadError("Contour cut file must be an image so size can be validated.");
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
      productName: "Orajet Clear (Translucent Clear Vinyl)",
      width,
      height,
      unit: "inches",
      quantity: safeQuantity,
      material: "Orajet Clear Translucent Vinyl",
      doubleSided: false,
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
        custom_width: `${width} inches`,
        custom_height: `${height} inches`,
        custom_laminate: "Gloss",
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_contour_cut_file: contourFileName ?? "None",
        custom_split_direction_input: splitDirection,
        custom_split_direction_applied: appliedSplitDirection,
        custom_panel_count: String(pricing.panelCount),
        custom_panel_size: `${formatInches(pricing.panelWidthIn)} x ${formatInches(pricing.panelHeightIn)}`,
        custom_roll_width_limit: `${ORAJET_CLEAR_MAX_PANEL_WIDTH}"`,
        custom_area_sqft: pricing.areaSqFt.toFixed(2),
        custom_base_rate: `${formatCurrency(pricing.baseRate)}/sq ft`,
      },
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const preview = useMemo(() => {
    if (!pricing) return { width: 320, height: 220 };

    const maxPreviewWidth = 640;
    const maxPreviewHeight = 460;
    const minPreviewWidth = 240;
    const minPreviewHeight = 180;

    const fitScale = Math.min(maxPreviewWidth / pricing.widthIn, maxPreviewHeight / pricing.heightIn);
    const fittedWidth = pricing.widthIn * fitScale;
    const fittedHeight = pricing.heightIn * fitScale;

    if (fittedWidth < minPreviewWidth || fittedHeight < minPreviewHeight) {
      const boost = Math.max(minPreviewWidth / fittedWidth, minPreviewHeight / fittedHeight);
      const boostedWidth = fittedWidth * boost;
      const boostedHeight = fittedHeight * boost;

      if (boostedWidth <= maxPreviewWidth && boostedHeight <= maxPreviewHeight) {
        return { width: boostedWidth, height: boostedHeight };
      }
    }

    return { width: fittedWidth, height: fittedHeight };
  }, [pricing]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f0f4f8_0%,#e8ecf0_55%,#dde4ec_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="grid gap-4">
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
                  <div className="text-[27px] leading-[0.98] font-medium uppercase tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">ORAJET CLEAR</div>
                  <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">Adhesive vinyl builder</div>
                </div>

                <div className="text-center md:pt-1">
                  <div className="mx-auto w-full max-w-[320px]">
                    <table className="w-full border-collapse text-[10px] leading-5 text-zinc-600 md:text-[11px]">
                      <thead>
                        <tr>
                          <th className="pb-0.5 text-left font-semibold text-zinc-500" />
                          <th className="pb-0.5 text-left font-semibold text-zinc-500">Single-Sided</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-0.5 text-left text-zinc-500">Orajet Clear</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency(ORAJET_CLEAR_SUPPLIER_RATE * ORAJET_CLEAR_MARKUP_MULTIPLIER)} per sq ft</td>
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
                  <div className="text-[34px] leading-none font-semibold text-[var(--brand-primary)] md:text-[44px]">{pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}</div>
                  <div className="mt-1 text-[10px] text-zinc-500">Live total</div>
                </div>
              </div>
            </div>

            <AdhesivePricingModal
              isOpen={isPricingModalOpen}
              onClose={() => setIsPricingModalOpen(false)}
              config={ADHESIVE_PRICING_CONFIGS.orajetClear}
            />

            <div
              className="relative h-[calc(100vh-290px)] min-h-[560px] overflow-hidden rounded-b-2xl bg-[#f8fafb]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(56,189,248,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.07) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="absolute left-5 top-5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                Upload artwork to preview panel splits
              </div>

              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Front Side
              </div>

              <div className="relative flex h-full items-center justify-center px-8 py-14">
                {pricing ? (
                  <>
                    <div
                      className="relative border border-blue-200 bg-white/80 shadow-[0_26px_70px_rgba(15,23,42,0.10)]"
                      style={{ width: preview.width, height: preview.height }}
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
                        <div className="absolute inset-0 bg-[rgba(239,246,255,0.6)]" />
                        {uploadedImage ? (
                          <Image src={uploadedImage} alt="Uploaded Orajet Clear artwork preview" fill unoptimized className={imageDisplayMode === "stretch" ? "object-fill" : "object-contain"} />
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
          </div>{uploadedFileName && <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600"><span className="truncate">{uploadedFileName}</span><button type="button" onClick={clearArtwork} className="font-semibold text-zinc-500 hover:text-zinc-900">Remove</button></div>}{uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}</> },
                {
                  id: "contourFile",
                  title: "Contour File",
                  value: contourCut ? (contourFileName ? "Uploaded" : "Required") : "Off",
                  width: 420,
                  content: (
                    <>
                      {contourCut ? (
                        <>
                          <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded border border-dashed border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
                            <input type="file" accept="image/*" className="hidden" onChange={onUploadContourFile} />
                            {uploadingContour ? "Uploading Contour..." : contourFileName ? "Replace Contour File" : "Upload Contour File"}
                          </label>
                          {contourFileName && (
                            <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600">
                              <span className="truncate">{contourFileName}</span>
                              <button type="button" onClick={clearContourFile} className="font-semibold text-zinc-500 hover:text-zinc-900">Remove</button>
                            </div>
                          )}
                          {uploadedImage && contourImage && (
                            <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
                              <div className="mb-2 text-[11px] text-zinc-600">Confirm contour line aligns with artwork.</div>
                              <div className="relative h-28 overflow-hidden rounded border border-zinc-300 bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={uploadedImage} alt="Artwork preview" className="absolute inset-0 h-full w-full object-contain" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={contourImage} alt="Contour overlay" className="absolute inset-0 h-full w-full object-contain opacity-70 mix-blend-multiply" />
                              </div>
                              <label className="mt-2 flex items-center gap-2 text-xs text-zinc-700">
                                <input type="checkbox" checked={contourAlignmentConfirmed} onChange={(event) => setContourAlignmentConfirmed(event.target.checked)} />
                                I confirm contour cut alignment is correct.
                              </label>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[11px] text-zinc-500">Enable contour cut to upload a separate contour file.</div>
                      )}
                    </>
                  ),
                },
                { id: "size", title: "Size", value: pricing ? `${formatInches(pricing.widthIn)} x ${formatInches(pricing.heightIn)}` : "Set dimensions", status: widthError || heightError ? "alert" : "ok", width: 360, content: (<SizeInputPanel widthFeet={widthFeet} widthInches={widthInches} heightFeet={heightFeet} heightInches={heightInches} onWidthFeetChange={setWidthFeet} onWidthInchesChange={setWidthInches} onHeightFeetChange={setHeightFeet} onHeightInchesChange={setHeightInches} onWidthNormalize={(f, i) => { setWidthFeet(f); setWidthInches(i); }} onHeightNormalize={(f, i) => { setHeightFeet(f); setHeightInches(i); }} error={widthError || heightError} helper="" />) },
                { id: "split", title: "Split Direction", value: splitDirection === "auto" ? "Auto" : splitDirection.charAt(0).toUpperCase() + splitDirection.slice(1), width: 320, content: <select value={splitDirection} onChange={(event) => setSplitDirection(event.target.value as OrajetClearSplitDirection)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"><option value="auto">Auto</option><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select> },
                { id: "contour", title: "Contour", value: contourCut ? "Enabled" : "Disabled", width: 320, content: <button type="button" onClick={handleContourToggle} className={`h-9 w-full rounded border px-3 text-xs font-semibold transition ${contourCut ? "border-blue-300 bg-blue-50 text-blue-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>{contourCut ? "Enabled" : "Disabled"}</button> },
              ] satisfies BuilderBottomToolbarPanel[]}
              action={<Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" disabled={!isValid} onClick={addToCart}>{added ? "Added" : "Add"}</Button>}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

