"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import SizeInputPanel, { composeDimensionInches, toFeetAndInches } from "@/components/product-builder/SizeInputPanel";
import { getUploadedImageSizeInches } from "@/components/product-builder/uploaded-image-size";
import Button from "@/components/ui/Button";
import AdhesivePricingModal from "@/components/product-builder/AdhesivePricingModal";
import { ADHESIVE_PRICING_CONFIGS } from "@/components/product-builder/adhesive-pricing-data";
import { useCart } from "@/context/CartContext";
import {
  ONE_WAY_MARKUP_MULTIPLIER,
  ONE_WAY_MATERIAL_OPTIONS,
  ONE_WAY_MAX_PANEL_WIDTH,
  ONE_WAY_SUPPLIER_LAMINATE_RATE,
  ONE_WAY_SUPPLIER_RATE,
  calculateOneWayWindowPrice,
  type OneWayWindowMaterial,
} from "@/lib/pricing/one-way-window";

interface OneWayWindowBuilderProps {
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

export default function OneWayWindowBuilder({ productId = 0 }: OneWayWindowBuilderProps) {
  const cart = useCart();

  const [widthFeet, setWidthFeet] = useState("0");
  const [widthInches, setWidthInches] = useState("0");
  const [heightFeet, setHeightFeet] = useState("0");
  const [heightInches, setHeightInches] = useState("0");
  const [material, setMaterial] = useState<OneWayWindowMaterial>("50/50");
  const [laminate, setLaminate] = useState(false);
  const [rush, setRush] = useState(false);
  const [added, setAdded] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedPdf, setUploadedPdf] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [imageDisplayMode, setImageDisplayMode] = useState<"fit" | "stretch">("fit");
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const width = composeDimensionInches(widthFeet, widthInches);
  const height = composeDimensionInches(heightFeet, heightInches);
  const safeQuantity = 1;

  const widthError = width <= 0 ? "Width must be greater than 0." : null;
  const heightError = height <= 0 ? "Height must be greater than 0." : null;
  const orientation = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    if (width <= ONE_WAY_MAX_PANEL_WIDTH) return "portrait" as const;
    if (height <= ONE_WAY_MAX_PANEL_WIDTH) return "landscape" as const;
    return null;
  }, [width, height]);
  const rollConstraintError =
    width > 0 && height > 0 && width > ONE_WAY_MAX_PANEL_WIDTH && height > ONE_WAY_MAX_PANEL_WIDTH
      ? `Maximum roll width is ${ONE_WAY_MAX_PANEL_WIDTH} inches. At least one side must be ${ONE_WAY_MAX_PANEL_WIDTH} inches or less.`
      : null;
  const isValid = !widthError && !heightError && !rollConstraintError && width > 0 && height > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculateOneWayWindowPrice({
            width,
            height,
            unit: "inches",
            quantity: safeQuantity,
            material,
            laminate,
            contourCut: false,
            rush,
          })
        : null,
    [width, height, safeQuantity, material, laminate, rush, isValid]
  );

  const selectedMaterial = ONE_WAY_MATERIAL_OPTIONS.find((o) => o.value === material)!;

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
      if (uploadedPdf) URL.revokeObjectURL(uploadedPdf);
    };
  }, [uploadedImage, uploadedPdf]);

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
      if (imageSize) {
        const widthParts = toFeetAndInches(imageSize.widthInches);
        const heightParts = toFeetAndInches(imageSize.heightInches);
        setWidthFeet(widthParts.feet);
        setWidthInches(widthParts.inches);
        setHeightFeet(heightParts.feet);
        setHeightInches(heightParts.inches);
      }

      if (file.type.startsWith("image/")) {
        const blobUrl = URL.createObjectURL(file);
        setUploadedImage((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return blobUrl;
        });
        setUploadedPdf((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return null;
        });
      } else if (file.type === "application/pdf") {
        const blobUrl = URL.createObjectURL(file);
        setUploadedPdf((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return blobUrl;
        });
        setUploadedImage((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return null;
        });
      } else {
        setUploadedImage((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return null;
        });
        setUploadedPdf((previous) => {
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
    setUploadedPdf((previous) => {
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
      productName: "One Way Window (Perforated Vinyl)",
      width,
      height,
      unit: "inches",
      quantity: safeQuantity,
      material: `One Way Window ${material}`,
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
        custom_material: selectedMaterial.label,
        custom_laminate: laminate ? "Yes" : "No",
        custom_rush: rush ? "Yes" : "No",
        custom_orientation: orientation ?? pricing.orientation,
        custom_max_roll_width: `${ONE_WAY_MAX_PANEL_WIDTH}"`,
        custom_area_sqft: pricing.areaSqFt.toFixed(2),
        custom_billed_sqft: pricing.billedSqFt.toFixed(2),
        custom_base_rate: `${formatCurrency(pricing.supplierRate)}/sq ft`,
        custom_supplier_rate: `${formatCurrency(pricing.supplierRate)}/sq ft`,
        custom_markup: `${Math.round((ONE_WAY_MARKUP_MULTIPLIER - 1) * 100)}%`,
        custom_rush_charge: formatCurrency(pricing.rushCharge),
        custom_laminate_charge: formatCurrency(pricing.laminateCharge),
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
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f8ff_0%,#e8f1ff_55%,#dbe9ff_100%)] text-zinc-800">
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
                  <div className="text-[27px] leading-[0.98] font-medium uppercase tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">ONE WAY WINDOW</div>
                  <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">Adhesive window film builder</div>
                </div>

                <div className="text-center md:pt-1">
                  <div className="mx-auto w-full max-w-[360px]">
                    <table className="w-full border-collapse text-[10px] leading-5 text-zinc-600 md:text-[11px]">
                      <thead>
                        <tr>
                          <th className="pb-0.5 text-left font-semibold text-zinc-500" />
                          <th className="pb-0.5 text-left font-semibold text-zinc-500">Laminate</th>
                          <th className="pb-0.5 text-left font-semibold text-zinc-500">No Laminate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-0.5 text-left text-zinc-500">50/50 Perforation</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency((ONE_WAY_SUPPLIER_RATE + ONE_WAY_SUPPLIER_LAMINATE_RATE) * ONE_WAY_MARKUP_MULTIPLIER)} per sq ft</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency(ONE_WAY_SUPPLIER_RATE * ONE_WAY_MARKUP_MULTIPLIER)} per sq ft</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 text-left text-zinc-500">70/30 Perforation</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency((ONE_WAY_SUPPLIER_RATE + ONE_WAY_SUPPLIER_LAMINATE_RATE) * ONE_WAY_MARKUP_MULTIPLIER)} per sq ft</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatCurrency(ONE_WAY_SUPPLIER_RATE * ONE_WAY_MARKUP_MULTIPLIER)} per sq ft</td>
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
              config={ADHESIVE_PRICING_CONFIGS.oneWayWindow}
            />

            <div
              className="relative h-[calc(100vh-290px)] min-h-[560px] overflow-hidden rounded-b-2xl bg-[#f8fbff]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="absolute left-5 top-5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                Upload artwork to preview single-roll output
              </div>

              <div className="relative flex h-full items-center justify-center px-8 py-14">
                {pricing ? (
                  <>
                    <div
                      className="relative border border-sky-200 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.10)] transition-[width,height] duration-150"
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
                      {/* Perforation pattern overlay */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            material === "50/50"
                              ? "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.15) 40%)"
                              : "radial-gradient(circle, transparent 56%, rgba(0,0,0,0.12) 56%)",
                          backgroundSize: "8px 8px",
                        }}
                      />
                      {uploadedImage ? (
                        <Image
                          src={uploadedImage}
                          alt="Uploaded One Way Window artwork preview"
                          fill
                          unoptimized
                          className={imageDisplayMode === "stretch" ? "object-fill" : "object-contain"}
                        />
                      ) : uploadedPdf ? (
                        <>
                          <iframe
                            src={`${uploadedPdf}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
                            title="Uploaded One Way Window PDF preview"
                            className="absolute -left-3 top-0 h-full w-[calc(100%+32px)] pointer-events-none"
                            scrolling="no"
                            style={{ clipPath: "inset(0 20px 0 0)" }}
                          />
                          <div className="absolute inset-y-0 right-0 w-5 bg-white pointer-events-none" />
                        </>
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
                { id: "size", title: "Size", value: pricing ? `${formatInches(pricing.widthIn)} x ${formatInches(pricing.heightIn)}` : "Set dimensions", status: widthError || heightError || rollConstraintError ? "alert" : "ok", width: 360, content: (<SizeInputPanel widthFeet={widthFeet} widthInches={widthInches} heightFeet={heightFeet} heightInches={heightInches} onWidthFeetChange={setWidthFeet} onWidthInchesChange={setWidthInches} onHeightFeetChange={setHeightFeet} onHeightInchesChange={setHeightInches} onWidthNormalize={(f, i) => { setWidthFeet(f); setWidthInches(i); }} onHeightNormalize={(f, i) => { setHeightFeet(f); setHeightInches(i); }} error={widthError || heightError || rollConstraintError} helper="Single-roll product: one side must be 50 in or less." />) },
                { id: "material", title: "Material", value: selectedMaterial.label, width: 320, content: <select value={material} onChange={(event) => setMaterial(event.target.value as OneWayWindowMaterial)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">{ONE_WAY_MATERIAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> },
                { id: "finish", title: "Laminate / Rush", value: [laminate ? "Laminate" : null, rush ? "Rush" : null].filter(Boolean).join(" / ") || "None", width: 360, content: <div className="grid grid-cols-2 gap-1"><button type="button" onClick={() => setLaminate((v) => !v)} className={`h-9 rounded border px-3 text-xs font-semibold transition ${laminate ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>Laminate</button><button type="button" onClick={() => setRush((v) => !v)} className={`h-9 rounded border px-3 text-xs font-semibold transition ${rush ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>Rush</button></div> },
              ] satisfies BuilderBottomToolbarPanel[]}
              action={<Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" disabled={!isValid} onClick={addToCart}>{added ? "Added" : "Add"}</Button>}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

