"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import SizeInputPanel, { composeDimensionInches } from "@/components/product-builder/SizeInputPanel";
import Button from "@/components/ui/Button";
import RigidPricingHeader from "@/components/product-builder/RigidPricingHeader";
import { useCart } from "@/context/CartContext";
import {
  ONE_WAY_MARKUP_MULTIPLIER,
  ONE_WAY_MATERIAL_OPTIONS,
  ONE_WAY_MAX_PANEL_WIDTH,
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

function PanelSplitPreview({ panelCount }: { panelCount: number }) {
  if (panelCount <= 1) return null;

  const lines = Array.from({ length: panelCount - 1 }, (_, i) => i + 1);

  return (
    <>
      {lines.map((lineNumber) => {
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

export default function OneWayWindowBuilder({ productId = 0 }: OneWayWindowBuilderProps) {
  const cart = useCart();

  const [widthFeet, setWidthFeet] = useState("4");
  const [widthInches, setWidthInches] = useState("2");
  const [heightFeet, setHeightFeet] = useState("3");
  const [heightInches, setHeightInches] = useState("0");
  const [quantity, setQuantity] = useState(1);
  const [material, setMaterial] = useState<OneWayWindowMaterial>("50/50");
  const [laminate, setLaminate] = useState(false);
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [added, setAdded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const width = composeDimensionInches(widthFeet, widthInches);
  const height = composeDimensionInches(heightFeet, heightInches);
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);

  const widthError = width <= 0 ? "Width must be greater than 0." : width > 300 ? "Maximum width is 25 ft 0 in." : null;
  const heightError = height <= 0 ? "Height must be greater than 0." : height > 300 ? "Maximum height is 25 ft 0 in." : null;
  const isValid = !widthError && !heightError && width > 0 && height > 0;

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
            contourCut,
            rush,
          })
        : null,
    [width, height, safeQuantity, material, laminate, contourCut, rush, isValid]
  );

  const selectedMaterial = ONE_WAY_MATERIAL_OPTIONS.find((o) => o.value === material)!;

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
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_panel_count: String(pricing.panelCount),
        custom_panel_size: `${formatInches(pricing.panelWidthIn)} x ${formatInches(pricing.panelHeightIn)}`,
        custom_max_panel_width: `${ONE_WAY_MAX_PANEL_WIDTH}"`,
        custom_area_sqft: pricing.areaSqFt.toFixed(2),
        custom_billed_sqft: pricing.billedSqFt.toFixed(2),
        custom_base_rate: `${formatCurrency(pricing.supplierRate)}/sq ft`,
        custom_supplier_rate: `${formatCurrency(pricing.supplierRate)}/sq ft`,
        custom_markup: `${Math.round((ONE_WAY_MARKUP_MULTIPLIER - 1) * 100)}%`,
        custom_rush_charge: formatCurrency(pricing.rushCharge),
        custom_panel_cost: formatCurrency(pricing.panelCost),
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
            <RigidPricingHeader
              section
              productName="ONE WAY WINDOW"
              detail="Adhesive window film builder"
              totalPrice={pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}
              middleRows={[
                { label: "Actual Area", value: pricing ? `${pricing.areaSqFt.toFixed(2)} sq ft` : "--" },
                { label: "Billed Area", value: pricing ? `${pricing.billedSqFt.toFixed(2)} sq ft` : "--" },
                { label: "Per Item", value: pricing ? formatCurrency(pricing.grandTotal / Math.max(safeQuantity, 1)) : formatCurrency(0) },
                { label: "Qty", value: String(safeQuantity) },
              ]}
              accentClassName="text-[var(--brand-primary)]"
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
                Upload artwork to preview panel splits
              </div>

              <div className="relative flex h-full items-center justify-center px-8 py-14">
                {pricing ? (
                  <>
                    <div
                      className="absolute pointer-events-none"
                      style={{ width: previewWidth + 18, height: previewHeight + 18 }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                        {formatInches(pricing.widthIn)}
                      </div>
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                        {formatInches(pricing.widthIn)}
                      </div>
                      <div className="absolute -left-9 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-zinc-500">
                        {formatInches(pricing.heightIn)}
                      </div>
                      <div className="absolute -right-9 top-1/2 -translate-y-1/2 rotate-90 text-xs font-semibold text-zinc-500">
                        {formatInches(pricing.heightIn)}
                      </div>
                    </div>

                    <div
                      className="relative overflow-hidden border border-sky-200 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.10)] transition-[width,height] duration-150"
                      style={{ width: previewWidth, height: previewHeight }}
                    >
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
                          className="object-fill"
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
                  <div className="flex h-[250px] w-full max-w-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-sky-300 bg-white/80 px-8 text-center shadow-inner">
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

            <BuilderBottomToolbar
              panels={[
                { id: "artwork", title: "Artwork", value: uploadedFileName ? "Uploaded" : "No file", width: 420, content: <><label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400"><input type="file" accept="image/*,.pdf,.ai,.eps,.psd,.svg" className="hidden" onChange={onUploadArtwork} />{uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}</label>{uploadedFileName && <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600"><span className="truncate">{uploadedFileName}</span><button type="button" onClick={clearArtwork} className="font-semibold text-zinc-500 hover:text-zinc-900">Remove</button></div>}{uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}</> },
                { id: "size", title: "Size", value: pricing ? `${formatInches(pricing.widthIn)} x ${formatInches(pricing.heightIn)}` : "Set dimensions", status: widthError || heightError ? "alert" : "ok", width: 360, content: (<SizeInputPanel widthFeet={widthFeet} widthInches={widthInches} heightFeet={heightFeet} heightInches={heightInches} onWidthFeetChange={setWidthFeet} onWidthInchesChange={setWidthInches} onHeightFeetChange={setHeightFeet} onHeightInchesChange={setHeightInches} onWidthNormalize={(f, i) => { setWidthFeet(f); setWidthInches(i); }} onHeightNormalize={(f, i) => { setHeightFeet(f); setHeightInches(i); }} error={widthError || heightError} helper="Up to 25 ft 0 in per side." />) },
                { id: "material", title: "Material", value: selectedMaterial.label, width: 320, content: <select value={material} onChange={(event) => setMaterial(event.target.value as OneWayWindowMaterial)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">{ONE_WAY_MATERIAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> },
                { id: "finish", title: "Laminate / Contour / Rush", value: [laminate ? "Laminate" : null, contourCut ? "Contour" : null, rush ? "Rush" : null].filter(Boolean).join(" / ") || "None", width: 360, content: <div className="grid grid-cols-3 gap-1"><button type="button" onClick={() => setLaminate((v) => !v)} className={`h-9 rounded border px-3 text-xs font-semibold transition ${laminate ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>Laminate</button><button type="button" onClick={() => setContourCut((v) => !v)} className={`h-9 rounded border px-3 text-xs font-semibold transition ${contourCut ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>Contour</button><button type="button" onClick={() => setRush((v) => !v)} className={`h-9 rounded border px-3 text-xs font-semibold transition ${rush ? "border-sky-300 bg-sky-50 text-sky-700" : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}>Rush</button></div> },
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

