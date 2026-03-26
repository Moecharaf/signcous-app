"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import {
  calculateBannerPrice,
  calculateCanvasPrice,
  calculateHdpePrice,
  calculateMeshPrice,
  calculatePosterPrice,
  type EdgeFinish,
  formatPrice,
  getCanvasSqFtRate,
  getHdpeSqFtRate,
  getMeshSqFtRate,
  getPosterSqFtRate,
  type GrommetMode,
  type Material,
} from "@/lib/pricing";
import { useCart } from "@/context/CartContext";

const materialOptions = ["13oz Vinyl", "15oz Vinyl", "Mesh Banner", "Fabric Banner"] as const;
const unitOptions = ["inches", "feet"] as const;

type Unit = (typeof unitOptions)[number];

interface FormState {
  width: string;
  height: string;
  unit: Unit;
  quantity: string;
  material: Material;
  doubleSided: boolean;
  grommets: boolean;
  grommetMode: GrommetMode;
  edgeFinish: EdgeFinish;
  polePockets: boolean;
  windSlits: boolean;
  hemming: boolean;
  rush: boolean;
  meshWelding: boolean;
  meshWebbing: boolean;
  meshRope: boolean;
}

interface FormErrors {
  width?: string;
  height?: string;
  quantity?: string;
}

type DragState =
  | { mode: "none" }
  | { mode: "move"; startX: number; startY: number; originX: number; originY: number }
  | { mode: "resize"; startX: number; startY: number; startW: number; startH: number };

const DEFAULTS: FormState = {
  width: "48",
  height: "24",
  unit: "inches",
  quantity: "1",
  material: "13oz Vinyl",
  doubleSided: false,
  grommets: true,
  grommetMode: "every-2ft",
  edgeFinish: "none",
  polePockets: false,
  windSlits: false,
  hemming: false,
  rush: false,
  meshWelding: true,
  meshWebbing: false,
  meshRope: false,
};

interface VinylBannerBuilderProps {
  initialMaterial?: Material;
  productName?: string;
  productDescription?: string;
  productId?: number;
  pricingMode?: "banner" | "canvas" | "mesh" | "hdpe" | "poster";
}

const MIN_IN = 6;
const MAX_IN = 240;
const BASE_PX_PER_IN = 2.4;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toInches(value: number, unit: Unit): number {
  return unit === "feet" ? value * 12 : value;
}

function fromInches(value: number, unit: Unit): string {
  if (unit === "feet") return (value / 12).toFixed(2);
  return value.toFixed(1);
}

function getGrommetPoints(
  widthIn: number,
  heightIn: number,
  enabled: boolean,
  mode: GrommetMode
): Array<{ xPct: number; yPct: number }> {
  if (!enabled || widthIn <= 0 || heightIn <= 0) return [];

  if (mode === "per-corner") {
    return [
      { xPct: 0, yPct: 0 },
      { xPct: 100, yPct: 0 },
      { xPct: 100, yPct: 100 },
      { xPct: 0, yPct: 100 },
    ];
  }

  const points: Array<{ xPct: number; yPct: number }> = [];
  const xSegments = Math.max(1, Math.ceil(widthIn / 24));
  const ySegments = Math.max(1, Math.ceil(heightIn / 24));

  for (let i = 0; i <= xSegments; i += 1) {
    const xPct = (i / xSegments) * 100;
    points.push({ xPct, yPct: 0 });
    points.push({ xPct, yPct: 100 });
  }

  for (let i = 1; i < ySegments; i += 1) {
    const yPct = (i / ySegments) * 100;
    points.push({ xPct: 0, yPct });
    points.push({ xPct: 100, yPct });
  }

  return points;
}

export default function VinylBannerBuilder({
  initialMaterial = "13oz Vinyl",
  productName = "Vinyl Banner",
  productDescription,
  productId = 12,
  pricingMode = "banner",
}: VinylBannerBuilderProps) {
  const cart = useCart();
  const [form, setForm] = useState<FormState>({ ...DEFAULTS, material: initialMaterial });
  const [errors, setErrors] = useState<FormErrors>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [artPos, setArtPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragState>({ mode: "none" });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const widthNum = parseFloat(form.width) || 0;
  const heightNum = parseFloat(form.height) || 0;
  const qtyNum = parseInt(form.quantity, 10) || 1;

  const widthIn = toInches(widthNum, form.unit);
  const heightIn = toInches(heightNum, form.unit);
  const isCanvasProduct = pricingMode === "canvas";
  const isMeshProduct   = pricingMode === "mesh";
  const isHdpeProduct   = pricingMode === "hdpe";
  const isPosterProduct = pricingMode === "poster";
  const effectiveQtyNum = isPosterProduct ? 1 : qtyNum;
  const isMeshMaterial  = isMeshProduct || form.material === "Mesh Banner";
  const posterBillableSqFt = Math.max(1, Math.ceil((widthIn / 12) * (heightIn / 12)));
  const meshBillableSqFt = Math.max(1, Math.ceil((widthIn / 12) * (heightIn / 12)));
  const perimeterFt = 2 * ((widthIn / 12) + (heightIn / 12));
  const meshWebbingCost = form.meshWebbing ? perimeterFt * 1.75 : 0;
  const meshRopeCost = form.meshRope ? perimeterFt * 1.75 : 0;

  const pxPerIn = BASE_PX_PER_IN * zoom;
  const artWidth = clamp(widthIn * pxPerIn, 90, 760);
  const artHeight = clamp(heightIn * pxPerIn, 70, 460);

  const canvasRate = useMemo(() => getCanvasSqFtRate(qtyNum), [qtyNum]);
  const hdpeRate = useMemo(() => getHdpeSqFtRate(qtyNum), [qtyNum]);
  const posterRate = useMemo(() => getPosterSqFtRate(posterBillableSqFt), [posterBillableSqFt]);
  const meshRate   = useMemo(() => getMeshSqFtRate(meshBillableSqFt), [meshBillableSqFt]);
  const meshGrommetPoints = useMemo(
    () => getGrommetPoints(widthIn, heightIn, !isCanvasProduct && !isHdpeProduct && !isPosterProduct && form.grommets, form.grommetMode),
    [widthIn, heightIn, isCanvasProduct, isHdpeProduct, isPosterProduct, form.grommets, form.grommetMode]
  );

  const pricing = useMemo(
    () => {
      if (isMeshProduct) {
        const m = calculateMeshPrice(
          widthNum, heightNum, form.unit, effectiveQtyNum,
          form.grommets,
          form.meshWelding,
          form.meshWebbing,
          form.meshRope,
          form.polePockets,
          form.rush
        );
        return {
          sqFt:                 m.sqFt,
          basePricePerUnit:     m.basePricePerUnit,
          grommetCostPerUnit:   m.grommetCostPerUnit,
          edgeFinishCostPerUnit: m.edgeFinishCostPerUnit,
          polePocketCostPerUnit: m.polePocketCostPerUnit,
          windSlitsCostPerUnit: 0,
          hemmingCostPerUnit:   0,
          addOnCostPerUnit:     m.polePocketCostPerUnit + m.edgeFinishCostPerUnit,
          rushSurchargePerUnit: m.rushSurchargePerUnit,
          unitPrice:            m.unitPrice,
          totalPrice:           m.totalPrice,
        };
      }

      if (isCanvasProduct) {
        const canvasPricing = calculateCanvasPrice(widthNum, heightNum, form.unit, effectiveQtyNum);

        return {
          sqFt: canvasPricing.sqFt,
          basePricePerUnit: canvasPricing.baseTotalPrice / effectiveQtyNum,
          grommetCostPerUnit: 0,
          edgeFinishCostPerUnit: 0,
          polePocketCostPerUnit: 0,
          windSlitsCostPerUnit: 0,
          hemmingCostPerUnit: 0,
          addOnCostPerUnit: 0,
          rushSurchargePerUnit: 0,
          unitPrice: canvasPricing.unitPrice,
          totalPrice: canvasPricing.totalPrice,
        };
      }

      if (isHdpeProduct) {
        const hdpePricing = calculateHdpePrice(widthIn, heightIn, effectiveQtyNum);

        return {
          sqFt: hdpePricing.sqFt,
          basePricePerUnit: hdpePricing.unitPrice,
          grommetCostPerUnit: 0,
          edgeFinishCostPerUnit: 0,
          polePocketCostPerUnit: 0,
          windSlitsCostPerUnit: 0,
          hemmingCostPerUnit: 0,
          addOnCostPerUnit: 0,
          rushSurchargePerUnit: 0,
          unitPrice: hdpePricing.unitPrice,
          totalPrice: hdpePricing.totalPrice,
        };
      }

      if (isPosterProduct) {
        const posterPricing = calculatePosterPrice(widthNum, heightNum, form.unit, effectiveQtyNum, false);

        return {
          sqFt: posterPricing.sqFt,
          basePricePerUnit: posterPricing.basePricePerUnit,
          grommetCostPerUnit: 0,
          edgeFinishCostPerUnit: 0,
          polePocketCostPerUnit: 0,
          windSlitsCostPerUnit: 0,
          hemmingCostPerUnit: 0,
          addOnCostPerUnit: 0,
          rushSurchargePerUnit: posterPricing.rushSurchargePerUnit,
          unitPrice: posterPricing.unitPrice,
          totalPrice: posterPricing.totalPrice,
        };
      }

      return calculateBannerPrice({
        widthIn,
        heightIn,
        quantity: effectiveQtyNum,
        material: form.material,
        doubleSided: form.doubleSided,
        grommets: form.grommets,
        grommetMode: form.grommetMode,
        edgeFinish: form.edgeFinish,
        polePockets: form.polePockets,
        windSlits: form.windSlits,
        hemming: form.hemming,
        rush: form.rush,
      });
    },
    [
      isMeshProduct,
      isCanvasProduct,
      isHdpeProduct,
      isPosterProduct,
      widthNum,
      heightNum,
      form.unit,
      widthIn,
      heightIn,
      qtyNum,
      form.material,
      form.doubleSided,
      form.grommets,
      form.grommetMode,
      form.edgeFinish,
      form.polePockets,
      form.windSlits,
      form.hemming,
      form.rush,
      form.meshWelding,
      form.meshWebbing,
      form.meshRope,
    ]
  );

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!widthNum || widthIn < MIN_IN || widthIn > MAX_IN) {
      nextErrors.width = form.unit === "inches" ? "Use 6-240 in" : "Use 0.5-20 ft";
    }
    if (!heightNum || heightIn < MIN_IN || heightIn > MAX_IN) {
      nextErrors.height = form.unit === "inches" ? "Use 6-240 in" : "Use 0.5-20 ft";
    }
    if (!qtyNum || qtyNum < 1 || qtyNum > 10000) {
      nextErrors.quantity = "Use 1-10000";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleAddToCart() {
    if (!validate()) return;

    if (uploadingArtwork) {
      setUploadError("Please wait for your artwork to finish uploading.");
      return;
    }

    const meshEdgeFinish: EdgeFinish = form.meshRope
      ? "rope"
      : form.meshWebbing
        ? "webbing"
        : form.meshWelding
          ? "welding"
          : "none";

    cart.addItem({
      productId,
      productName,
      width: widthNum,
      height: heightNum,
      unit: form.unit,
      quantity: effectiveQtyNum,
      material: isPosterProduct ? "Poster" : isHdpeProduct ? "HDPE" : isCanvasProduct ? "Canvas" : isMeshProduct ? "Mesh Banner" : form.material,
      doubleSided: (isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct) ? false : form.doubleSided,
      grommets: (isCanvasProduct || isHdpeProduct || isPosterProduct) ? false : form.grommets,
      edgeFinish: (isCanvasProduct || isHdpeProduct || isPosterProduct) ? "none" : isMeshProduct ? meshEdgeFinish : form.edgeFinish,
      polePockets: (isCanvasProduct || isHdpeProduct || isPosterProduct) ? false : form.polePockets,
      windSlits: (isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct) ? false : form.windSlits,
      hemming: (isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct) ? false : form.hemming,
      rush: (isCanvasProduct || isHdpeProduct || isPosterProduct) ? false : form.rush,
      uploadedFileUrl,
      uploadedFileName,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }

  async function onUploadArtwork(event: React.ChangeEvent<HTMLInputElement>) {
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
              : `Upload failed with status ${response.status}. ${raw.slice(0, 180)}`,
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
        setUploadedImage((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return blobUrl;
        });
      } else {
        setUploadedImage((prev) => {
          if (prev) URL.revokeObjectURL(prev);
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

  function startMove(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.dataset.role === "resize-handle") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      originX: artPos.x,
      originY: artPos.y,
    });
  }

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      mode: "resize",
      startX: event.clientX,
      startY: event.clientY,
      startW: widthIn,
      startH: heightIn,
    });
  }

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!workspaceRef.current) return;
      if (drag.mode === "none") return;

      if (drag.mode === "move") {
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        setArtPos({ x: drag.originX + dx, y: drag.originY + dy });
        return;
      }

      const dxIn = (event.clientX - drag.startX) / pxPerIn;
      const dyIn = (event.clientY - drag.startY) / pxPerIn;

      const nextWIn = clamp(drag.startW + dxIn, MIN_IN, MAX_IN);
      const nextHIn = clamp(drag.startH + dyIn, MIN_IN, MAX_IN);

      set("width", fromInches(nextWIn, form.unit));
      set("height", fromInches(nextHIn, form.unit));
    }

    function onPointerUp() {
      setDrag({ mode: "none" });
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, form.unit, pxPerIn, set]);

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
    };
  }, [uploadedImage]);

  useEffect(() => {
    if (!isMeshMaterial) return;

    setForm((prev) => {
      if (!prev.doubleSided && !prev.windSlits && !prev.hemming) {
        return prev;
      }

      return {
        ...prev,
        doubleSided: false,
        windSlits: false,
        hemming: false,
      };
    });
  }, [isMeshMaterial]);

  useEffect(() => {
    if (!isMeshProduct) return;

    setForm((prev) => {
      if (prev.meshWelding || prev.meshWebbing || prev.meshRope) {
        return prev;
      }

      return {
        ...prev,
        meshWelding: true,
      };
    });
  }, [isMeshProduct]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="mx-auto max-w-[1400px] px-4 py-5">
        <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700">
                <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] tracking-normal text-orange-400">SC</span>
                Signcous Studio
              </div>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">{productName} Configurator</h2>
              {productDescription && (
                <p className="mt-0.5 text-xs font-medium text-zinc-500">{productDescription}</p>
              )}
              <p className="mt-1 text-sm text-zinc-600">
                Drag to reposition artwork. Use the corner handle to resize and auto-update dimensions.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{formatPrice(pricing.totalPrice)}</div>
              <div className="text-xs text-orange-700/80">{pricing.sqFt} sqft · {effectiveQtyNum} unit{effectiveQtyNum !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-700">
                  Artboard Size: {(widthIn / 12).toFixed(2)} ft x {(heightIn / 12).toFixed(2)} ft
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Zoom</label>
                  <input
                    type="range"
                    min={0.6}
                    max={1.8}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value) || 1)}
                    className="accent-orange-500"
                  />
                  <span className="w-10 text-right text-xs font-semibold text-zinc-600">{Math.round(zoom * 100)}%</span>
                </div>
              </div>
            </div>

            <div
              ref={workspaceRef}
              className={`relative h-[56vh] min-h-[380px] overflow-hidden rounded-b-2xl ${isMeshProduct ? "bg-[#f4f4f2]" : "bg-[#fafaf9]"}`}
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: isMeshProduct ? "18px 18px" : "26px 26px",
              }}
            >
              <div className="absolute left-5 top-5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                Click and drag {isHdpeProduct ? "sign" : "banner"} to move
              </div>

              <div
                className={`absolute left-1/2 top-1/2 cursor-move select-none rounded-md shadow-lg ${
                  isMeshProduct
                    ? "border border-zinc-500 bg-white"
                    : "border-2 border-dashed border-orange-500 bg-orange-50/55"
                }`}
                onPointerDown={startMove}
                style={{
                  width: artWidth,
                  height: artHeight,
                  transform: `translate(calc(-50% + ${artPos.x}px), calc(-50% + ${artPos.y}px))`,
                }}
              >
                {isMeshProduct && (
                  <>
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                      Top Of Image
                    </div>
                    <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] text-zinc-500">
                      {widthNum.toFixed(2)} {form.unit === "feet" ? "ft" : "in"}
                    </div>
                    <div className="pointer-events-none absolute -right-7 top-1/2 -translate-y-1/2 rotate-90 text-[11px] text-zinc-500">
                      {heightNum.toFixed(2)} {form.unit === "feet" ? "ft" : "in"}
                    </div>
                  </>
                )}

                {uploadedImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadedImage}
                    alt="Artwork preview"
                    className="h-full w-full rounded object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-zinc-500">
                    <div>
                      <div className="text-lg font-medium">Drop Artwork Here</div>
                      <div className="mt-1 text-xs">or use Upload Artwork from controls</div>
                    </div>
                  </div>
                )}

                {meshGrommetPoints.map((point, index) => (
                  <span
                    key={`grommet-${index}`}
                    className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-500 bg-zinc-100 shadow"
                    style={{
                      left: `${point.xPct}%`,
                      top: `${point.yPct}%`,
                    }}
                  >
                    <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-400" />
                  </span>
                ))}

                <button
                  type="button"
                  data-role="resize-handle"
                  onPointerDown={startResize}
                  className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full border-2 border-white bg-orange-500 shadow"
                  aria-label="Resize banner"
                  title="Drag to resize"
                />
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50 p-3">
              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-8">
                <ControlBox title="Size" error={errors.width || errors.height} className="md:col-span-2 xl:col-span-2">
                  <div className="grid grid-cols-[1fr_1fr_70px] gap-1">
                    <input
                      type="number"
                      value={form.width}
                      onChange={(e) => set("width", e.target.value)}
                      className="h-9 min-w-0 appearance-none rounded border border-zinc-300 px-2 text-sm text-zinc-800"
                      placeholder="W"
                    />
                    <input
                      type="number"
                      value={form.height}
                      onChange={(e) => set("height", e.target.value)}
                      className="h-9 min-w-0 appearance-none rounded border border-zinc-300 px-2 text-sm text-zinc-800"
                      placeholder="H"
                    />
                    <select
                      value={form.unit}
                      onChange={(e) => set("unit", e.target.value as Unit)}
                      className="h-9 rounded border border-zinc-300 bg-white px-1 text-sm"
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>{unit === "inches" ? "in" : "ft"}</option>
                      ))}
                    </select>
                  </div>
                </ControlBox>

                {!isPosterProduct && (
                <ControlBox title="Material">
                  {isCanvasProduct ? (
                    <div className="flex h-9 items-center rounded border border-zinc-300 bg-zinc-100 px-2 text-sm font-medium text-zinc-700">
                      Canvas
                    </div>
                  ) : isMeshProduct ? (
                    <div className="flex h-9 items-center rounded border border-zinc-300 bg-zinc-100 px-2 text-sm font-medium text-zinc-700">
                      Mesh Banner
                    </div>
                  ) : isHdpeProduct ? (
                    <div className="flex h-9 items-center rounded border border-zinc-300 bg-zinc-100 px-2 text-sm font-medium text-zinc-700">
                      HDPE
                    </div>
                  ) : (
                    <select
                      value={form.material}
                      onChange={(e) => set("material", e.target.value as Material)}
                      className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                    >
                      {materialOptions.map((material) => (
                        <option key={material} value={material}>{material}</option>
                      ))}
                    </select>
                  )}
                </ControlBox>
                )}

                {!(isCanvasProduct || isHdpeProduct || isPosterProduct) && (
                  <>
                    {!isMeshProduct && (
                      <ControlBox title="Print">
                        <TogglePair
                          leftLabel="Single"
                          rightLabel="Double"
                          isRightActive={form.doubleSided}
                          onToggle={() => {
                            if (isMeshMaterial) return;
                            set("doubleSided", !form.doubleSided);
                          }}
                        />
                        {isMeshMaterial && <div className="mt-1 text-[10px] text-zinc-500">Mesh uses single-sided pricing.</div>}
                      </ControlBox>
                    )}

                    <ControlBox title="Grommets">
                      <TogglePair
                        leftLabel="No"
                        rightLabel="Yes"
                        isRightActive={form.grommets}
                        onToggle={() => set("grommets", !form.grommets)}
                      />
                      {form.grommets && (
                        <select
                          value={form.grommetMode}
                          onChange={(e) => set("grommetMode", e.target.value as GrommetMode)}
                          className="mt-1 h-8 w-full rounded border border-zinc-300 bg-white px-2 text-xs"
                        >
                          <option value="every-2ft">Every 2-3 ft</option>
                          <option value="per-corner">Per corner</option>
                        </select>
                      )}
                    </ControlBox>

                    <ControlBox title="Pole Pockets">
                      <TogglePair
                        leftLabel="No"
                        rightLabel="Yes"
                        isRightActive={form.polePockets}
                        onToggle={() => set("polePockets", !form.polePockets)}
                      />
                    </ControlBox>

                    {isMeshProduct ? (
                      <>
                        <ControlBox title="Welding">
                          <TogglePair
                            leftLabel="No"
                            rightLabel="Yes"
                            isRightActive={form.meshWelding}
                            onToggle={() => set("meshWelding", !form.meshWelding)}
                          />
                        </ControlBox>

                        <ControlBox title="Webbing">
                          <TogglePair
                            leftLabel="No"
                            rightLabel="Yes"
                            isRightActive={form.meshWebbing}
                            onToggle={() => set("meshWebbing", !form.meshWebbing)}
                          />
                        </ControlBox>

                        <ControlBox title="Rope">
                          <TogglePair
                            leftLabel="No"
                            rightLabel="Yes"
                            isRightActive={form.meshRope}
                            onToggle={() => set("meshRope", !form.meshRope)}
                          />
                        </ControlBox>
                      </>
                    ) : isMeshMaterial ? (
                      <ControlBox title="Edge Finish">
                        <select
                          value={form.edgeFinish}
                          onChange={(e) => set("edgeFinish", e.target.value as EdgeFinish)}
                          className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                        >
                          <option value="none">None</option>
                          <option value="welding">Welding</option>
                          <option value="webbing">Webbing</option>
                          <option value="rope">Rope</option>
                        </select>
                      </ControlBox>
                    ) : (
                      <>
                        <ControlBox title="Wind Slits">
                          <TogglePair
                            leftLabel="No"
                            rightLabel="Yes"
                            isRightActive={form.windSlits}
                            onToggle={() => set("windSlits", !form.windSlits)}
                          />
                        </ControlBox>

                        <ControlBox title="Hemming">
                          <TogglePair
                            leftLabel="No"
                            rightLabel="Yes"
                            isRightActive={form.hemming}
                            onToggle={() => set("hemming", !form.hemming)}
                          />
                        </ControlBox>
                      </>
                    )}

                    {isMeshProduct && (
                      <ControlBox title="Rush">
                        <TogglePair
                          leftLabel="No"
                          rightLabel="Yes"
                          isRightActive={form.rush}
                          onToggle={() => set("rush", !form.rush)}
                        />
                        {form.rush && (
                          <div className="mt-1 text-[10px] text-zinc-500">+100% surcharge</div>
                        )}
                      </ControlBox>
                    )}
                  </>
                )}

                {isPosterProduct ? (
                  <ControlBox title="Add">
                    <Button
                      className="h-9 w-full rounded bg-orange-500 text-xs font-semibold text-white hover:bg-orange-400"
                      onClick={handleAddToCart}
                    >
                      {addedToCart ? "Added" : "Add"}
                    </Button>
                  </ControlBox>
                ) : (
                <ControlBox title="Qty / Add" error={errors.quantity}>
                  <div className="grid grid-cols-[70px_1fr] gap-1">
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => set("quantity", e.target.value)}
                      className="h-9 rounded border border-zinc-300 px-2 text-sm"
                    />
                    <Button
                      className="h-9 rounded bg-orange-500 text-xs font-semibold text-white hover:bg-orange-400"
                      onClick={handleAddToCart}
                    >
                      {addedToCart ? "Added" : "Add"}
                    </Button>
                  </div>
                </ControlBox>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pricing Breakdown</div>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Base (per unit)" value={formatPrice(pricing.basePricePerUnit)} />
                {isCanvasProduct ? (
                  <>
                    <Row label="Canvas Rate" value={`${formatPrice(canvasRate)} / sqft`} />
                    <Row label="Formula" value="max((W x H / unit) x rate x qty, $20)" />
                  </>
                ) : isHdpeProduct ? (
                  <>
                    <Row label="Rate" value={`${formatPrice(hdpeRate)} / sqft`} />
                    <Row label="Square Feet" value={String(pricing.sqFt)} />
                    <Row label="Minimum Order" value="$20.00" />
                  </>
                ) : isPosterProduct ? (
                  <>
                    <Row label="Poster Rate" value={`${formatPrice(posterRate)} / sqft`} />
                    <Row label="Billable Area" value={`${pricing.sqFt} sqft`} />
                    <Row label="Minimum Unit Price" value="$12.00" />
                  </>
                ) : isMeshProduct ? (
                  <>
                    <Row label="Mesh Rate" value={`${formatPrice(meshRate)} / sqft`} />
                    <Row label="Billable Area" value={`${pricing.sqFt} sqft`} />
                    <Row label="Grommets" value="Free" />
                    <Row label="Welding" value={form.meshWelding ? "Included" : "No"} />
                    <Row label="Webbing" value={formatPrice(meshWebbingCost)} />
                    <Row label="Rope" value={formatPrice(meshRopeCost)} />
                    <Row label="Pole Pockets" value={formatPrice(pricing.polePocketCostPerUnit)} />
                    <Row label="Edge Add-ons" value={formatPrice(pricing.edgeFinishCostPerUnit)} />
                    <Row label="Rush Surcharge" value={formatPrice(pricing.rushSurchargePerUnit)} />
                    <Row label="Minimum Unit Price" value={formatPrice(30)} />
                  </>
                ) : (
                  <>
                    <Row label="Grommets" value={formatPrice(pricing.grommetCostPerUnit)} />
                    <Row label="Edge Finish" value={formatPrice(pricing.edgeFinishCostPerUnit)} />
                    <Row label="Pole Pockets" value={formatPrice(pricing.polePocketCostPerUnit)} />
                    <Row label="Wind Slits" value={formatPrice(pricing.windSlitsCostPerUnit)} />
                    <Row label="Hemming" value={formatPrice(pricing.hemmingCostPerUnit)} />
                    <Row label="Add-ons Total" value={formatPrice(pricing.addOnCostPerUnit)} />
                    <Row label="Rush" value={formatPrice(pricing.rushSurchargePerUnit)} />
                  </>
                )}
                <div className="my-2 border-t border-zinc-200" />
                <Row label="Unit Price" value={formatPrice(pricing.unitPrice)} strong />
                <Row label={`Order Total (${effectiveQtyNum})`} value={formatPrice(pricing.totalPrice)} strong className="text-orange-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Artwork</div>
              <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-600 hover:border-orange-400 hover:bg-orange-50">
                {uploadingArtwork ? "Uploading..." : "Upload Artwork"}
                <input
                  type="file"
                  accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
                  onChange={onUploadArtwork}
                  disabled={uploadingArtwork}
                  className="hidden"
                />
              </label>
              <div className="mt-2 text-xs text-zinc-500">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</div>
              {uploadedFileName && (
                <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-700">
                  Uploaded: {uploadedFileName}
                </div>
              )}
              {uploadError && (
                <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 shadow-sm">
              <div>Tip: Use drag + corner resize for quick setup, then fine-tune with exact dimensions in control rail.</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ControlBox({
  title,
  error,
  className,
  children,
}: {
  title: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-2 ${className ?? ""}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</div>
      {children}
      {error && <div className="mt-1 text-[10px] font-semibold text-rose-600">{error}</div>}
    </div>
  );
}

function TogglePair({
  leftLabel,
  rightLabel,
  isRightActive,
  onToggle,
}: {
  leftLabel: string;
  rightLabel: string;
  isRightActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="grid h-9 w-full grid-cols-2 overflow-hidden rounded border border-zinc-300 text-xs font-semibold"
    >
      <span className={`flex items-center justify-center ${isRightActive ? "bg-zinc-200 text-zinc-500" : "bg-orange-100 text-orange-700"}`}>{leftLabel}</span>
      <span className={`flex items-center justify-center ${isRightActive ? "bg-orange-100 text-orange-700" : "bg-zinc-200 text-zinc-500"}`}>{rightLabel}</span>
    </button>
  );
}

function Row({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-semibold text-zinc-900" : "text-zinc-700"} ${className ?? ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
