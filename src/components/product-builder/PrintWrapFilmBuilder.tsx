"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import SizeInputPanel, { composeDimensionInches } from "@/components/product-builder/SizeInputPanel";
import Button from "@/components/ui/Button";
import AdhesivePricingModal from "@/components/product-builder/AdhesivePricingModal";
import { ADHESIVE_PRICING_CONFIGS } from "@/components/product-builder/adhesive-pricing-data";
import { useCart } from "@/context/CartContext";
import {
  PRINT_WRAP_BASE_RATE,
  PRINT_WRAP_LAMINATE_OPTIONS,
  PRINT_WRAP_MARKUP,
  PRINT_WRAP_MAX_ROLL_WIDTH,
  calculatePrintWrapPrice,
  type PrintWrapLaminate,
  type PrintWrapSplitDirection,
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

  const [widthFeet, setWidthFeet] = useState("0");
  const [widthInches, setWidthInches] = useState("0");
  const [heightFeet, setHeightFeet] = useState("0");
  const [heightInches, setHeightInches] = useState("0");
  const [laminate, setLaminate] = useState<PrintWrapLaminate>("gloss");
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [splitDirection, setSplitDirection] = useState<PrintWrapSplitDirection>("auto");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
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
        ? calculatePrintWrapPrice({
            width,
            height,
            unit: "inches",
            quantity: safeQuantity,
            contourCut,
            rush,
            splitDirection,
          })
        : null,
    [width, height, contourCut, rush, splitDirection, isValid]
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
      unit: "inches",
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
        custom_width: `${width} inches`,
        custom_height: `${height} inches`,
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
                  <div className="text-[27px] leading-[0.98] font-medium uppercase tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">3M PRINT WRAP FILM</div>
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
                          <td className="py-0.5 text-left text-zinc-500">3M Controltac</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency(PRINT_WRAP_BASE_RATE * PRINT_WRAP_MARKUP)} per sq ft</td>
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
              config={ADHESIVE_PRICING_CONFIGS.printWrap}
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
                      className="relative border border-zinc-300 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.13)]"
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
                        <div className="absolute inset-0 bg-[#f6f6f6]" />
                        {uploadedImage ? (
                          <Image src={uploadedImage} alt="Uploaded print wrap artwork preview" fill unoptimized className="object-contain" />
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
                { id: "artwork", title: "Artwork", value: uploadedFileName ? "Uploaded" : "No file", width: 420, content: <><label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400"><input type="file" accept="image/*,.pdf,.ai,.eps,.psd,.svg" className="hidden" onChange={onUploadArtwork} />{uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}</label>{uploadedFileName && <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600"><span className="truncate">{uploadedFileName}</span><button type="button" onClick={clearArtwork} className="font-semibold text-zinc-500 hover:text-zinc-900">Remove</button></div>}{uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}</> },
                { id: "size", title: "Size", value: pricing ? `${formatInches(pricing.widthIn)} x ${formatInches(pricing.heightIn)}` : "Set dimensions", status: widthError || heightError ? "alert" : "ok", width: 360, content: (<SizeInputPanel widthFeet={widthFeet} widthInches={widthInches} heightFeet={heightFeet} heightInches={heightInches} onWidthFeetChange={setWidthFeet} onWidthInchesChange={setWidthInches} onHeightFeetChange={setHeightFeet} onHeightInchesChange={setHeightInches} onWidthNormalize={(f, i) => { setWidthFeet(f); setWidthInches(i); }} onHeightNormalize={(f, i) => { setHeightFeet(f); setHeightInches(i); }} error={widthError || heightError} helper="" />) },
                { id: "split", title: "Split Direction", value: splitDirection === "auto" ? "Auto" : splitDirection.charAt(0).toUpperCase() + splitDirection.slice(1), width: 320, content: <select value={splitDirection} onChange={(event) => setSplitDirection(event.target.value as PrintWrapSplitDirection)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-700 transition hover:border-[var(--brand-accent)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-soft)]"><option value="auto">Auto</option><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select> },
                { id: "finish", title: "Contour / Rush", value: [contourCut ? "Contour" : "No contour", rush ? "Rush" : "Standard"].join(" / "), width: 320, content: <div className="grid grid-cols-2 gap-1"><button type="button" onClick={() => setContourCut((value) => !value)} className={`h-9 rounded border px-3 text-xs font-semibold transition ${contourCut ? "border-[var(--brand-primary)] bg-[linear-gradient(90deg,var(--brand-primary-soft),var(--brand-accent-soft))] text-[var(--brand-primary)]" : "border-zinc-300 bg-white text-zinc-700 hover:border-[var(--brand-accent)]"}`}>Contour</button><button type="button" onClick={() => setRush((value) => !value)} className={`h-9 rounded border px-3 text-xs font-semibold transition ${rush ? "border-[var(--brand-primary)] bg-[linear-gradient(90deg,var(--brand-primary-soft),var(--brand-accent-soft))] text-[var(--brand-primary)]" : "border-zinc-300 bg-white text-zinc-700 hover:border-[var(--brand-accent)]"}`}>Rush</button></div> },
                {
                  id: "laminate",
                  title: "Laminate",
                  value: selectedLaminate.label.toUpperCase(),
                  width: 320,
                  content: (
                    <div className="space-y-1">
                      {PRINT_WRAP_LAMINATE_OPTIONS.map((option) => {
                        const active = option.value === laminate;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setLaminate(option.value)}
                            className={`flex h-9 w-full items-center justify-between rounded border px-3 text-xs font-semibold uppercase tracking-[0.04em] transition ${
                              active
                                ? "border-[var(--brand-primary)] bg-[linear-gradient(90deg,var(--brand-primary-soft),var(--brand-accent-soft))] text-[var(--brand-primary)]"
                                : "border-zinc-300 bg-white text-zinc-700 hover:border-[var(--brand-accent)]"
                            }`}
                          >
                            <span>{option.label}</span>
                            <span
                              aria-hidden
                              className={`h-2 w-2 rounded-full ${active ? "bg-[var(--brand-accent)]" : "bg-zinc-300"}`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ),
                },
              ] satisfies BuilderBottomToolbarPanel[]}
              action={<Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" disabled={!isValid} onClick={addToCart}>{added ? "Added" : "Add"}</Button>}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

