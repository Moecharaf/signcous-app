"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import {
  calculateBannerPrice,
  calculateCanvasPrice,
  calculateHdpePrice,
  calculateMeshPrice,
  calculateNoCurlPrice,
  calculatePosterPrice,
  type EdgeFinish,
  formatPrice,
  getCanvasSqFtRate,
  getHdpeSqFtRate,
  getMeshSqFtRate,
  getNoCurlSqFtRate,
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
  | { mode: "resize"; startX: number; startY: number; startW: number; startH: number; startPxPerIn: number };

type ControlPanel = "artwork" | "size" | "material" | "print" | "finish" | "quantity";

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
  pricingMode?: "banner" | "canvas" | "mesh" | "hdpe" | "poster" | "nocurl" | "economical-stand";
}

const MIN_IN = 6;
const MAX_IN = 240;
const PREVIEW_MAX_WIDTH = 720;
const PREVIEW_MAX_HEIGHT = 420;
const ECONOMICAL_STAND_WIDTH_IN = 33.5;
const ECONOMICAL_STAND_HEIGHT_IN = 80;
const ECONOMICAL_STAND_UNIT_PRICE = 130;
const ECONOMICAL_STAND_PREVIEW_HEIGHT = 520;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toInches(value: number, unit: Unit): number {
  return unit === "feet" ? value * 12 : value;
}

function fromInches(value: number, unit: Unit): string {
  if (unit === "feet") return (value / 12).toFixed(2);
  return Math.round(value).toString();
}

function formatInchLabel(value: number): string {
  const rounded = parseFloat(value.toFixed(2));
  const text = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toString();
  return `${text.replace(/\.0+$/, "")}\"`;
}

function parseDimensionPart(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function toFeetAndInches(totalInches: number): { feet: string; inches: string } {
  const rounded = Math.max(0, Math.round(totalInches));
  return {
    feet: Math.floor(rounded / 12).toString(),
    inches: (rounded % 12).toString(),
  };
}

function composeDimensionInches(feet: string, inches: string): string {
  return (parseDimensionPart(feet) * 12 + parseDimensionPart(inches)).toString();
}

function formatFeetAndInchesLabel(totalInches: number): string {
  const parts = toFeetAndInches(totalInches);
  return `${parts.feet} ft ${parts.inches} in`;
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
  const [activePanel, setActivePanel] = useState<ControlPanel>("size");
  const [dimensionInputs, setDimensionInputs] = useState(() => {
    const widthParts = toFeetAndInches(parseFloat(DEFAULTS.width) || 0);
    const heightParts = toFeetAndInches(parseFloat(DEFAULTS.height) || 0);

    return {
      widthFeet: widthParts.feet,
      widthInches: widthParts.inches,
      heightFeet: heightParts.feet,
      heightInches: heightParts.inches,
    };
  });
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
  const isNoCurlProduct = pricingMode === "nocurl";
  const isEconomicalStandProduct = pricingMode === "economical-stand";
  const effectiveQtyNum = isPosterProduct ? 1 : qtyNum;
  const isMeshMaterial  = isMeshProduct || form.material === "Mesh Banner";
  const posterBillableSqFt = Math.max(1, Math.ceil((widthIn / 12) * (heightIn / 12)));
  const meshBillableSqFt = Math.max(1, Math.ceil((widthIn / 12) * (heightIn / 12)));
  const perimeterFt = 2 * ((widthIn / 12) + (heightIn / 12));
  const meshWebbingCost = form.meshWebbing ? perimeterFt * 1.75 : 0;
  const meshRopeCost = form.meshRope ? perimeterFt * 1.75 : 0;

  const fitScale = Math.min(
    PREVIEW_MAX_WIDTH / Math.max(widthIn, 1),
    PREVIEW_MAX_HEIGHT / Math.max(heightIn, 1)
  );
  const pxPerIn = isEconomicalStandProduct
    ? ECONOMICAL_STAND_PREVIEW_HEIGHT / ECONOMICAL_STAND_HEIGHT_IN
    : fitScale * zoom;
  const artWidth = widthIn * pxPerIn;
  const artHeight = heightIn * pxPerIn;
  const widthLabelInches = formatInchLabel(widthIn);
  const heightLabelInches = formatInchLabel(heightIn);
  const widthFeetInchesLabel = formatFeetAndInchesLabel(widthIn);
  const heightFeetInchesLabel = formatFeetAndInchesLabel(heightIn);

  const canvasRate = useMemo(() => getCanvasSqFtRate(qtyNum), [qtyNum]);
  const hdpeRate = useMemo(() => getHdpeSqFtRate(qtyNum), [qtyNum]);
  const noCurlRate = useMemo(() => getNoCurlSqFtRate(Math.max(1, Math.ceil((widthIn / 12) * (heightIn / 12)))), [widthIn, heightIn]);
  const posterRate = useMemo(() => getPosterSqFtRate(posterBillableSqFt), [posterBillableSqFt]);
  const meshRate   = useMemo(() => getMeshSqFtRate(meshBillableSqFt), [meshBillableSqFt]);
  const meshGrommetPoints = useMemo(
    () => getGrommetPoints(widthIn, heightIn, !isCanvasProduct && !isHdpeProduct && !isPosterProduct && !isNoCurlProduct && form.grommets, form.grommetMode),
    [widthIn, heightIn, isCanvasProduct, isHdpeProduct, isPosterProduct, isNoCurlProduct, form.grommets, form.grommetMode]
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

      if (isNoCurlProduct) {
        const noCurlPricing = calculateNoCurlPrice(widthNum, heightNum, form.unit, effectiveQtyNum, form.rush);

        return {
          sqFt: noCurlPricing.sqFt,
          basePricePerUnit: noCurlPricing.basePricePerUnit,
          grommetCostPerUnit: 0,
          edgeFinishCostPerUnit: 0,
          polePocketCostPerUnit: 0,
          windSlitsCostPerUnit: 0,
          hemmingCostPerUnit: 0,
          addOnCostPerUnit: 0,
          rushSurchargePerUnit: noCurlPricing.rushSurchargePerUnit,
          unitPrice: noCurlPricing.unitPrice,
          totalPrice: noCurlPricing.totalPrice,
        };
      }

      if (isEconomicalStandProduct) {
        return {
          sqFt: Number(((ECONOMICAL_STAND_WIDTH_IN / 12) * (ECONOMICAL_STAND_HEIGHT_IN / 12)).toFixed(2)),
          basePricePerUnit: ECONOMICAL_STAND_UNIT_PRICE,
          grommetCostPerUnit: 0,
          edgeFinishCostPerUnit: 0,
          polePocketCostPerUnit: 0,
          windSlitsCostPerUnit: 0,
          hemmingCostPerUnit: 0,
          addOnCostPerUnit: 0,
          rushSurchargePerUnit: 0,
          unitPrice: ECONOMICAL_STAND_UNIT_PRICE,
          totalPrice: ECONOMICAL_STAND_UNIT_PRICE * effectiveQtyNum,
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
      isNoCurlProduct,
      isEconomicalStandProduct,
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

  const setDimension = useCallback(
    (dimension: "width" | "height", part: "feet" | "inches", value: string) => {
      setDimensionInputs((prev) => {
        const next = {
          ...prev,
          [dimension === "width"
            ? part === "feet"
              ? "widthFeet"
              : "widthInches"
            : part === "feet"
              ? "heightFeet"
              : "heightInches"]: value,
        };

        if (dimension === "width") {
          set("width", composeDimensionInches(next.widthFeet, next.widthInches));
        } else {
          set("height", composeDimensionInches(next.heightFeet, next.heightInches));
        }

        return next;
      });
    },
    [set]
  );

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!widthNum || widthIn < MIN_IN || widthIn > MAX_IN) {
      nextErrors.width = "Use 0 ft 6 in - 20 ft 0 in";
    }
    if (!heightNum || heightIn < MIN_IN || heightIn > MAX_IN) {
      nextErrors.height = "Use 0 ft 6 in - 20 ft 0 in";
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
      material: isNoCurlProduct ? "No-Curl Banner" : isPosterProduct ? "Poster" : isHdpeProduct ? "HDPE" : isCanvasProduct ? "Canvas" : isMeshProduct ? "Mesh Banner" : form.material,
      doubleSided: (isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) ? false : form.doubleSided,
      grommets: isNoCurlProduct
        ? true
        : (isCanvasProduct || isHdpeProduct || isPosterProduct || isEconomicalStandProduct)
          ? false
          : form.grommets,
      edgeFinish: (isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct)
        ? "none"
        : isMeshProduct
          ? meshEdgeFinish
          : form.edgeFinish,
      polePockets: (isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct)
        ? false
        : form.polePockets,
      windSlits: (isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct)
        ? false
        : form.windSlits,
      hemming: (isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct)
        ? false
        : form.hemming,
      rush: (isCanvasProduct || isHdpeProduct || isPosterProduct || isEconomicalStandProduct) ? false : form.rush,
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
      startPxPerIn: pxPerIn || 1,
    });
  }

  useEffect(() => {
    const widthParts = toFeetAndInches(widthIn);
    const heightParts = toFeetAndInches(heightIn);

    setDimensionInputs((prev) => {
      if (
        prev.widthFeet === widthParts.feet &&
        prev.widthInches === widthParts.inches &&
        prev.heightFeet === heightParts.feet &&
        prev.heightInches === heightParts.inches
      ) {
        return prev;
      }

      return {
        widthFeet: widthParts.feet,
        widthInches: widthParts.inches,
        heightFeet: heightParts.feet,
        heightInches: heightParts.inches,
      };
    });
  }, [widthIn, heightIn]);

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

      const dxIn = (event.clientX - drag.startX) / drag.startPxPerIn;
      const dyIn = (event.clientY - drag.startY) / drag.startPxPerIn;

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

  useEffect(() => {
    if (!isEconomicalStandProduct) return;

    setForm((prev) => {
      const targetWidth = ECONOMICAL_STAND_WIDTH_IN.toString();
      const targetHeight = ECONOMICAL_STAND_HEIGHT_IN.toString();
      const needsUpdate =
        prev.width !== targetWidth ||
        prev.height !== targetHeight ||
        prev.unit !== "inches" ||
        prev.doubleSided !== false ||
        prev.grommets !== false ||
        prev.polePockets !== false ||
        prev.windSlits !== false ||
        prev.hemming !== false ||
        prev.rush !== false;

      if (!needsUpdate) {
        return prev;
      }

      return {
        ...prev,
        width: targetWidth,
        height: targetHeight,
        unit: "inches",
        doubleSided: false,
        grommets: false,
        polePockets: false,
        windSlits: false,
        hemming: false,
        rush: false,
      };
    });
  }, [isEconomicalStandProduct]);

  return (
    <div className="flex h-[calc(100vh-88px)] flex-col bg-[#f4f4f4] text-zinc-800">
      <div className="border-b border-zinc-200 bg-white px-3 py-2">
        <div className="grid items-start gap-3 lg:grid-cols-[1.1fr_1fr_auto]">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Vinyl Banner Configurator</h2>
            <p className="mt-1 text-xs text-zinc-600">
              {isNoCurlProduct ? "No-Curl Banner" : isPosterProduct ? "Poster" : isHdpeProduct ? "HDPE" : isCanvasProduct ? "Canvas" : isMeshProduct ? "Mesh Banner" : form.material}
              {" · "}
              {!isCanvasProduct && !isMeshProduct && !isHdpeProduct && !isPosterProduct && !isNoCurlProduct && !isEconomicalStandProduct && (form.doubleSided ? "Double-Sided" : "Single-Sided")}
              {(isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && "Single-Sided"}
              {" · "}
              {widthFeetInchesLabel} x {heightFeetInchesLabel}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Artboard Size: {widthFeetInchesLabel} x {heightFeetInchesLabel}</p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Quick Rate Reference ($/sqft)</div>
            <div className="grid grid-cols-3 gap-x-3 text-[11px]">
              <span className="font-semibold text-zinc-600">13oz</span>
              <span className="text-zinc-600">Single: $0.75</span>
              <span className="text-zinc-600">Double: $1.20</span>
              <span className="font-semibold text-zinc-600">15oz</span>
              <span className="text-zinc-600">Single: $1.15</span>
              <span className="text-zinc-600">Double: $1.84</span>
              <span className="font-semibold text-zinc-400">18oz</span>
              <span className="text-zinc-400">Single: --</span>
              <span className="text-zinc-400">Double: --</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#111111] bg-[#111111] px-4 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#007fff]">Live Total</div>
            <div className="text-2xl font-semibold text-white">{formatPrice(pricing.totalPrice)}</div>
            <div className="text-[11px] text-zinc-300">{pricing.sqFt} sqft / 24 Hours Production</div>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Canvas Workspace</span>
          {!isEconomicalStandProduct && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-500">Zoom</span>
              <input
                type="range"
                min={0.6}
                max={1.8}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value) || 1)}
                className="accent-[#007fff]"
              />
              <span className="w-10 text-right text-xs font-semibold text-zinc-600">{Math.round(zoom * 100)}%</span>
            </div>
          )}
        </div>

        <div
          ref={workspaceRef}
          className={`relative min-h-0 flex-1 overflow-hidden ${isMeshProduct ? "bg-[#f6f6f4]" : "bg-[#f9f9f9]"}`}
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)",
            backgroundSize: isMeshProduct ? "18px 18px" : "24px 24px",
          }}
        >
          <div className="absolute left-4 top-4 rounded border border-zinc-200 bg-white/95 px-3 py-1 text-xs text-zinc-600 shadow-sm">
            Click and drag banner to move
          </div>

          <div
            className={`absolute left-1/2 top-1/2 cursor-move select-none rounded-md ${
              isMeshProduct || isEconomicalStandProduct
                ? "border border-zinc-500 bg-white shadow"
                : "border-2 border-dashed border-[#007fff] bg-[#007fff]/8 shadow"
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
                  {widthFeetInchesLabel}
                </div>
                <div className="pointer-events-none absolute -right-7 top-1/2 -translate-y-1/2 rotate-90 text-[11px] text-zinc-500">
                  {heightFeetInchesLabel}
                </div>
              </>
            )}

            {isEconomicalStandProduct && (
              <>
                <div className="pointer-events-none absolute -top-11 left-1/2 flex -translate-x-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Top Of Image</span>
                  <div className="mt-1 flex items-center gap-2 text-zinc-700">
                    <span className="h-px w-12 bg-zinc-400" />
                    <span>{widthLabelInches}</span>
                    <span className="h-px w-12 bg-zinc-400" />
                  </div>
                </div>
                <div className="pointer-events-none absolute -right-14 top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
                  <span className="h-16 w-px bg-zinc-400" />
                  <span className="my-2 -rotate-90">{heightLabelInches}</span>
                  <span className="h-16 w-px bg-zinc-400" />
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
              <div className="flex h-full items-center justify-center px-6 text-center text-zinc-400">
                <div>
                  <div className="text-base font-medium">Drop Artwork Here</div>
                  <div className="mt-1 text-xs">or use Upload Artwork from controls</div>
                </div>
              </div>
            )}

            {meshGrommetPoints.map((point, index) => (
              <span
                key={`grommet-${index}`}
                className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-500 bg-zinc-100 shadow"
                style={{ left: `${point.xPct}%`, top: `${point.yPct}%` }}
              >
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-400" />
              </span>
            ))}

            {!isEconomicalStandProduct && (
              <>
                {["-top-2 -left-2", "-top-2 left-1/2 -translate-x-1/2", "-top-2 -right-2", "top-1/2 -right-2 -translate-y-1/2", "-bottom-2 -right-2", "-bottom-2 left-1/2 -translate-x-1/2", "-bottom-2 -left-2", "top-1/2 -left-2 -translate-y-1/2"].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    data-role="resize-handle"
                    onPointerDown={startResize}
                    className={`absolute ${pos} h-4 w-4 rounded-full border border-white bg-[#ff7f00] shadow`}
                    aria-label="Resize banner"
                    title="Drag to resize"
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 shrink-0 border-t border-zinc-200 bg-white px-3 py-2">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              <ToolbarButton
                title="Artwork"
                value={uploadedFileName ? "Uploaded" : "No file"}
                active={activePanel === "artwork"}
                onClick={() => setActivePanel("artwork")}
              />
              <ToolbarButton
                title="Size"
                value={`${widthFeetInchesLabel} x ${heightFeetInchesLabel}`}
                active={activePanel === "size"}
                onClick={() => setActivePanel("size")}
                status={errors.width || errors.height ? "alert" : "ok"}
              />
              {!isPosterProduct && (
                <ToolbarButton
                  title="Material"
                  value={isCanvasProduct ? "Canvas" : isNoCurlProduct ? "No-Curl Banner" : isMeshProduct ? "Mesh Banner" : isHdpeProduct ? "HDPE" : form.material}
                  active={activePanel === "material"}
                  onClick={() => setActivePanel("material")}
                />
              )}
              {!(isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
                <ToolbarButton
                  title="Print"
                  value={form.doubleSided ? "Double-sided" : "Single-sided"}
                  active={activePanel === "print"}
                  onClick={() => setActivePanel("print")}
                />
              )}
              {!(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
                <ToolbarButton
                  title="Finishing"
                  value={isMeshProduct ? [form.meshWelding ? "Welded" : null, form.meshRope ? "Rope" : null, form.grommets ? "Grommets" : null].filter(Boolean).join(" / ") || "None" : [form.hemming ? "Hemmed" : null, form.grommets ? "Grommets" : null, form.polePockets ? "Pockets" : null, form.windSlits ? "Wind slits" : null].filter(Boolean).join(" / ") || "None"}
                  active={activePanel === "finish"}
                  onClick={() => setActivePanel("finish")}
                />
              )}
              <ToolbarButton
                title="Quantity"
                value={`${form.quantity} unit${effectiveQtyNum !== 1 ? "s" : ""}`}
                active={activePanel === "quantity"}
                onClick={() => setActivePanel("quantity")}
              />
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {activePanel === "artwork" && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Artwork</div>
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
                    <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 hover:border-[#007fff]">
                      {uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}
                      <input
                        type="file"
                        accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
                        onChange={onUploadArtwork}
                        disabled={uploadingArtwork}
                        className="hidden"
                      />
                    </label>
                    <div className="flex h-10 items-center rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-600">
                      {uploadedFileName ?? "No artwork uploaded"}
                    </div>
                  </div>
                  {uploadError && <div className="mt-2 text-[10px] font-semibold text-rose-600">{uploadError}</div>}
                </div>
              )}

              {activePanel === "size" && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Size</div>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                    <DimensionInput
                      label="Width"
                      feetValue={dimensionInputs.widthFeet}
                      inchesValue={dimensionInputs.widthInches}
                      onFeetChange={(value) => setDimension("width", "feet", value)}
                      onInchesChange={(value) => setDimension("width", "inches", value)}
                    />
                    <DimensionInput
                      label="Height"
                      feetValue={dimensionInputs.heightFeet}
                      inchesValue={dimensionInputs.heightInches}
                      onFeetChange={(value) => setDimension("height", "feet", value)}
                      onInchesChange={(value) => setDimension("height", "inches", value)}
                    />
                    <div className="rounded border border-zinc-200 bg-white p-3 text-sm text-zinc-600">
                      <div className="font-semibold text-zinc-800">Live size</div>
                      <div className="mt-1">{widthFeetInchesLabel} x {heightFeetInchesLabel}</div>
                      <div className="mt-1 text-xs text-zinc-500">Allowed range: 0 ft 6 in to 20 ft 0 in</div>
                    </div>
                  </div>
                  {(errors.width || errors.height) && (
                    <div className="mt-2 text-[10px] font-semibold text-rose-600">{errors.width ?? errors.height}</div>
                  )}
                </div>
              )}

              {activePanel === "material" && !isPosterProduct && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Material</div>
                  {isCanvasProduct || isNoCurlProduct || isMeshProduct || isHdpeProduct ? (
                    <div className="flex h-10 items-center rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-700">
                      {isCanvasProduct ? "Canvas" : isNoCurlProduct ? "No-Curl Banner" : isMeshProduct ? "Mesh Banner" : "HDPE"}
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {(["13oz Vinyl", "15oz Vinyl"] as const).map((option) => (
                        <SegButton key={option} active={form.material === option} onClick={() => set("material", option)}>
                          {option}
                        </SegButton>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activePanel === "print" && !(isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Print Sides</div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:max-w-[320px]">
                    <SegButton active={!form.doubleSided} onClick={() => set("doubleSided", false)}>Single-Sided</SegButton>
                    <SegButton active={form.doubleSided} onClick={() => set("doubleSided", true)} disabled={isMeshMaterial}>Double-Sided</SegButton>
                  </div>
                </div>
              )}

              {activePanel === "finish" && !(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Finishing</div>
                  {isMeshProduct ? (
                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Welding</div>
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.meshWelding} onClick={() => set("meshWelding", false)}>No</SegButton>
                          <SegButton active={form.meshWelding} onClick={() => set("meshWelding", true)}>Yes</SegButton>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Rope</div>
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.meshRope} onClick={() => set("meshRope", false)}>None</SegButton>
                          <SegButton active={form.meshRope} onClick={() => set("meshRope", true)}>Top & Bottom</SegButton>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Grommets</div>
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.grommets} onClick={() => set("grommets", false)}>No</SegButton>
                          <SegButton active={form.grommets} onClick={() => set("grommets", true)}>Yes</SegButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      <SubControlGroup title="Hemming">
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.hemming} onClick={() => set("hemming", false)}>No</SegButton>
                          <SegButton active={form.hemming} onClick={() => set("hemming", true)}>Yes</SegButton>
                        </div>
                      </SubControlGroup>
                      <SubControlGroup title="Grommets">
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.grommets} onClick={() => set("grommets", false)}>No</SegButton>
                          <SegButton active={form.grommets} onClick={() => set("grommets", true)}>Yes</SegButton>
                        </div>
                      </SubControlGroup>
                      <SubControlGroup title="Pole Pockets">
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.polePockets} onClick={() => set("polePockets", false)}>None</SegButton>
                          <SegButton active={form.polePockets} onClick={() => set("polePockets", true)}>Top & Bottom</SegButton>
                        </div>
                      </SubControlGroup>
                      <SubControlGroup title="Wind Slits">
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.windSlits} onClick={() => set("windSlits", false)}>No</SegButton>
                          <SegButton active={form.windSlits} onClick={() => set("windSlits", true)} disabled={isMeshMaterial}>Yes</SegButton>
                        </div>
                      </SubControlGroup>
                    </div>
                  )}
                </div>
              )}

              {activePanel === "quantity" && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Quantity</div>
                  <div className="grid gap-2 md:grid-cols-[120px_1fr] xl:max-w-[420px]">
                    <input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="h-10 rounded border border-zinc-300 px-3 text-sm" />
                    <div className="flex h-10 items-center rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-600">
                      {effectiveQtyNum} billable unit{effectiveQtyNum !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#111111] bg-[#111111] p-3 text-white">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#007fff]">Price / Add to Cart</div>
            <div className="mt-1 text-2xl font-semibold">{formatPrice(pricing.totalPrice)}</div>
            <div className="mt-1 grid grid-cols-[88px_1fr] gap-y-1 text-xs text-zinc-300">
              <div className="font-semibold text-white">Area</div>
              <div>{pricing.sqFt} sqft</div>
              <div className="font-semibold text-white">Quantity</div>
              <div>{effectiveQtyNum} unit{effectiveQtyNum !== 1 ? "s" : ""}</div>
            </div>
            <Button className="mt-3 h-10 w-full rounded bg-[#ff7f00] text-sm font-semibold text-white hover:bg-[#e67200]" onClick={handleAddToCart}>
              {addedToCart ? "Added" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  title,
  value,
  active,
  onClick,
  status,
}: {
  title: string;
  value: string;
  active?: boolean;
  onClick: () => void;
  status?: "ok" | "alert";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded border px-3 py-2 text-left transition ${
        active ? "border-[#007fff] bg-[#007fff]/5 shadow-sm" : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
        <span className="text-zinc-500">{title}</span>
        <span className={`h-2 w-2 rounded-full ${status === "alert" ? "bg-rose-500" : "bg-emerald-500"}`} />
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-zinc-800">{value}</div>
    </button>
  );
}

function SubControlGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{title}</div>
      {children}
    </div>
  );
}

function DimensionInput({
  label,
  feetValue,
  inchesValue,
  onFeetChange,
  onInchesChange,
}: {
  label: string;
  feetValue: string;
  inchesValue: string;
  onFeetChange: (value: string) => void;
  onInchesChange: (value: string) => void;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</div>
      <div className="grid grid-cols-[1fr_32px_1fr_32px] gap-1">
        <input
          type="number"
          min={0}
          step={1}
          value={feetValue}
          onChange={(event) => onFeetChange(event.target.value)}
          className="h-9 rounded border border-zinc-300 px-2 text-sm"
          placeholder="0"
        />
        <div className="flex items-center justify-center text-xs font-semibold text-zinc-500">ft</div>
        <input
          type="number"
          min={0}
          step={1}
          value={inchesValue}
          onChange={(event) => onInchesChange(event.target.value)}
          className="h-9 rounded border border-zinc-300 px-2 text-sm"
          placeholder="0"
        />
        <div className="flex items-center justify-center text-xs font-semibold text-zinc-500">in</div>
      </div>
    </div>
  );
}

function SegButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 rounded border text-[11px] font-semibold transition ${
        disabled
          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
          : active
            ? "border-[#ff7f00] bg-[#ff7f00]/10 text-[#ff7f00]"
            : "border-zinc-300 bg-white text-zinc-600 hover:border-[#007fff] hover:text-[#007fff]"
      }`}
    >
      {children}
    </button>
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
      <div className="sc-label-fx mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</div>
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
      <span className={`flex items-center justify-center ${isRightActive ? "bg-zinc-200 text-zinc-500" : "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"}`}>{leftLabel}</span>
      <span className={`flex items-center justify-center ${isRightActive ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" : "bg-zinc-200 text-zinc-500"}`}>{rightLabel}</span>
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
