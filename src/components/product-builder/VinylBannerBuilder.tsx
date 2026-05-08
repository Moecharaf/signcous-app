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

// Banner preview component with realistic vinyl rendering
function BannerPreview({
  uploadedImage,
  widthPx,
  heightPx,
  meshGrommetPoints,
  widthIn,
  heightIn,
  widthNum,
  heightNum,
  form,
  isMeshProduct,
  isEconomicalStandProduct,
}: {
  uploadedImage: string | null;
  widthPx: number;
  heightPx: number;
  meshGrommetPoints: Array<{ xPct: number; yPct: number }>;
  widthIn: number;
  heightIn: number;
  widthNum: number;
  heightNum: number;
  form: FormState;
  isMeshProduct: boolean;
  isEconomicalStandProduct: boolean;
}) {
  return (
    <>
      {/* Vinyl banner with realistic styling */}
      <div
        className="relative select-none"
        style={{
          width: widthPx,
          height: heightPx,
          boxShadow: "0 8px 20px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.08)",
          backgroundColor: "#f5f5f5",
          border: "1px solid #d4d4d4",
          position: "relative",
        }}
      >
        {/* Subtle top-to-bottom gradient for lighting */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 30%, rgba(0,0,0,0.05) 100%)",
            zIndex: 0.5,
          }}
        />

        {/* Fine vinyl texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(255, 255, 255, 0.08) 1px,
                rgba(255, 255, 255, 0.08) 2px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(150, 150, 150, 0.03) 2px,
                rgba(150, 150, 150, 0.03) 3px
              )
            `,
            zIndex: 1,
          }}
        />

        {/* Stitched hem top */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "8px",
            background: "linear-gradient(to bottom, #d8d8d8, #e8e8e8)",
            backgroundImage: `repeating-linear-gradient(
              90deg,
              #b0b0b0 0px,
              #b0b0b0 1px,
              #e0e0e0 1px,
              #e0e0e0 3px
            )`,
            boxShadow: "inset 0 1px 1px rgba(0,0,0,0.1), 0 1px 1px rgba(255,255,255,0.3)",
            zIndex: 2,
          }}
        />

        {/* Stitched hem bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "8px",
            background: "linear-gradient(to top, #d8d8d8, #e8e8e8)",
            backgroundImage: `repeating-linear-gradient(
              90deg,
              #b0b0b0 0px,
              #b0b0b0 1px,
              #e0e0e0 1px,
              #e0e0e0 3px
            )`,
            boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.1), 0 -1px 1px rgba(255,255,255,0.3)",
            zIndex: 2,
          }}
        />

        {/* Stitched hem left */}
        <div
          className="absolute left-0 top-0 bottom-0 pointer-events-none"
          style={{
            width: "7px",
            background: "linear-gradient(to right, #d8d8d8, #e8e8e8)",
            backgroundImage: `repeating-linear-gradient(
              0deg,
              #b0b0b0 0px,
              #b0b0b0 1px,
              #e0e0e0 1px,
              #e0e0e0 3px
            )`,
            boxShadow: "inset 1px 0 1px rgba(0,0,0,0.1), 1px 0 1px rgba(255,255,255,0.3)",
            zIndex: 2,
          }}
        />

        {/* Stitched hem right */}
        <div
          className="absolute right-0 top-0 bottom-0 pointer-events-none"
          style={{
            width: "7px",
            background: "linear-gradient(to left, #d8d8d8, #e8e8e8)",
            backgroundImage: `repeating-linear-gradient(
              0deg,
              #b0b0b0 0px,
              #b0b0b0 1px,
              #e0e0e0 1px,
              #e0e0e0 3px
            )`,
            boxShadow: "inset -1px 0 1px rgba(0,0,0,0.1), -1px 0 1px rgba(255,255,255,0.3)",
            zIndex: 2,
          }}
        />

        {/* Content area */}
        <div className="relative h-full w-full overflow-hidden" style={{ zIndex: 0 }}>
          {uploadedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={uploadedImage}
              alt="Artwork preview"
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-zinc-400">
              <div>
                <div className="text-sm font-medium">Drop Artwork Here</div>
                <div className="mt-1 text-xs">or use Upload Artwork</div>
              </div>
            </div>
          )}
        </div>

        {/* Grommets rendering - PROMINENT METALLIC */}
        {meshGrommetPoints.map((point, index) => (
          <div
            key={`grommet-${index}`}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: `${point.xPct}%`,
              top: `${point.yPct}%`,
              width: "14px",
              height: "14px",
              transform: "translate(-50%, -50%)",
              // Metallic outer ring
              background: "radial-gradient(circle at 35% 35%, #e8e8e8, #a0a0a0, #707070)",
              border: "2px solid #505050",
              boxShadow: "inset -1px -1px 2px rgba(0,0,0,0.5), inset 1px 1px 1px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.4)",
              zIndex: 5,
            }}
          >
            {/* Inner hole */}
            <div
              style={{
                position: "absolute",
                inset: "3px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #3a3a3a, #1a1a1a)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.2)",
              }}
            />
          </div>
        ))}

        {/* Subtle wrinkle effect overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 900px 140px at 20% 45%, rgba(0,0,0,0.04) 0%, transparent 50%),
              radial-gradient(ellipse 500px 200px at 85% 75%, rgba(0,0,0,0.025) 0%, transparent 60%),
              radial-gradient(ellipse 700px 160px at 50% 20%, rgba(255,255,255,0.08) 0%, transparent 55%)
            `,
            zIndex: 4,
          }}
        />
      </div>

      {/* Dimension labels for mesh and stand products */}
      {isMeshProduct && (
        <>
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
            TOP OF IMAGE
          </div>
          <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] font-medium text-zinc-500">
            {widthNum.toFixed(2)} {form.unit === "feet" ? "ft" : "in"}
          </div>
          <div className="pointer-events-none absolute -right-7 top-1/2 -translate-y-1/2 rotate-90 text-[11px] font-medium text-zinc-500">
            {heightNum.toFixed(2)} {form.unit === "feet" ? "ft" : "in"}
          </div>
        </>
      )}

      {isEconomicalStandProduct && (
        <>
          <div className="pointer-events-none absolute -top-11 left-1/2 flex -translate-x-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
            <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">TOP OF IMAGE</span>
            <div className="mt-1 flex items-center gap-2 text-zinc-700">
              <span className="h-px w-12 bg-zinc-400" />
              <span>{formatInchLabel(widthIn)}</span>
              <span className="h-px w-12 bg-zinc-400" />
            </div>
          </div>
          <div className="pointer-events-none absolute -right-14 top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700">
            <span className="h-16 w-px bg-zinc-400" />
            <span className="my-2 -rotate-90">{formatInchLabel(heightIn)}</span>
            <span className="h-16 w-px bg-zinc-400" />
          </div>
        </>
      )}
    </>
  );
}

const materialOptions = ["13oz Vinyl", "15oz Vinyl", "Mesh Banner", "Fabric Banner"] as const;
const unitOptions = ["inches", "feet"] as const;

type Unit = (typeof unitOptions)[number];

// Format dimension label with proper inch notation
function formatInchLabel(value: number): string {
  const rounded = parseFloat(value.toFixed(2));
  const text = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toString();
  return `${text.replace(/\.0+$/, "")}\"`;
}

// Rulers component for workspace
function Rulers({
  workspaceWidth,
  workspaceHeight,
  pxPerIn,
}: {
  workspaceWidth: number;
  workspaceHeight: number;
  pxPerIn: number;
}) {
  const topRulerMarks = [];
  const leftRulerMarks = [];

  const inchesVisible = workspaceWidth / pxPerIn;
  const heightInchesVisible = workspaceHeight / pxPerIn;

  for (let i = 0; i <= inchesVisible; i++) {
    topRulerMarks.push(i);
  }
  for (let i = 0; i <= heightInchesVisible; i++) {
    leftRulerMarks.push(i);
  }

  return (
    <>
      {/* Top ruler */}
      <div
        className="absolute top-0 left-20 right-0 h-6 border-b border-zinc-300 bg-zinc-100 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {topRulerMarks.map((inch) => (
          <div
            key={`top-${inch}`}
            className="absolute text-[9px] font-semibold text-zinc-600"
            style={{
              left: `${inch * pxPerIn}px`,
              width: "1px",
              top: 0,
              height: "100%",
              borderLeft: "1px solid #999",
            }}
          >
            <span className="absolute left-0.5 top-1 whitespace-nowrap">{inch}</span>
          </div>
        ))}
      </div>

      {/* Left ruler */}
      <div
        className="absolute left-0 top-6 bottom-0 w-20 border-r border-zinc-300 bg-zinc-100 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {leftRulerMarks.map((inch) => (
          <div
            key={`left-${inch}`}
            className="absolute text-[9px] font-semibold text-zinc-600"
            style={{
              top: `${inch * pxPerIn + 24}px`,
              height: "1px",
              left: 0,
              width: "100%",
              borderTop: "1px solid #999",
            }}
          >
            <span className="absolute left-1 -top-3 whitespace-nowrap">{inch}</span>
          </div>
        ))}
      </div>
    </>
  );
}

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
// Increased preview dimensions to enlarge banner by ~40%
const PREVIEW_MAX_WIDTH = 1000;
const PREVIEW_MAX_HEIGHT = 590;
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
    <div className="flex h-[calc(100vh-88px)] flex-col bg-[#f2f2f2] text-zinc-800">
      {/* TOP INFO BAR - Industrial compact layout */}
      <div className="border-b border-zinc-300 bg-white px-4 py-2">
        <div className="grid items-center gap-4 lg:grid-cols-[auto_1fr_auto]">
          {/* LEFT: Product & dimensions */}
          <div className="min-w-0">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-900">
              {isNoCurlProduct ? "NO-CURL BANNER" : isPosterProduct ? "POSTER" : isHdpeProduct ? "HDPE" : isCanvasProduct ? "CANVAS" : isMeshProduct ? "MESH BANNER" : "VINYL BANNER"} CONFIGURATOR
            </h2>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-zinc-600">
              <span>
                {isNoCurlProduct ? "No-Curl" : isPosterProduct ? "Poster" : isHdpeProduct ? "HDPE" : isCanvasProduct ? "Canvas" : isMeshProduct ? "Mesh" : form.material}
              </span>
              <span className="text-zinc-400">·</span>
              <span>
                {!isCanvasProduct && !isMeshProduct && !isHdpeProduct && !isPosterProduct && !isNoCurlProduct && !isEconomicalStandProduct
                  ? (form.doubleSided ? "Double-Sided" : "Single-Sided")
                  : "Single-Sided"}
              </span>
              <span className="text-zinc-400">·</span>
              <span>{formatInchLabel(widthIn)} × {formatInchLabel(heightIn)}</span>
            </div>
            <div className="mt-0.5 text-[10px] text-zinc-500">ARTBOARD: {(widthIn / 12).toFixed(2)} FT × {(heightIn / 12).toFixed(2)} FT</div>
          </div>

          {/* CENTER: Quick pricing table */}
          <div className="hidden rounded border border-zinc-300 bg-zinc-50 px-3 py-1.5 lg:block">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">RATE REFERENCE ($/SQFT)</div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10px]">
              <span className="font-semibold text-zinc-700">13oz</span>
              <span className="text-zinc-600">$0.75–$1.20</span>
              <span className="text-zinc-500">(S/D)</span>
              <span className="font-semibold text-zinc-700">15oz</span>
              <span className="text-zinc-600">$1.15–$1.84</span>
              <span className="text-zinc-500">(S/D)</span>
            </div>
          </div>

          {/* RIGHT: Live total */}
          <div className="rounded border border-[#111111] bg-[#111111] px-4 py-1.5 text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#007fff]">LIVE TOTAL</div>
            <div className="mt-0.5 text-2xl font-black text-white">{formatPrice(pricing.totalPrice)}</div>
            <div className="text-[10px] text-zinc-300">{pricing.sqFt} SQFT · 24H PRODUCTION</div>
          </div>
        </div>
      </div>

      {/* WORKSPACE WITH CANVAS */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Main canvas area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Canvas toolbar */}
          <div className="flex items-center justify-between border-b border-zinc-300 bg-white px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">PRODUCTION WORKSPACE</span>
            {!isEconomicalStandProduct && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
                  className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-sm font-bold text-zinc-700 hover:border-[#007fff] hover:text-[#007fff]"
                  title="Zoom out"
                >
                  −
                </button>
                <span className="w-12 text-center text-xs font-bold text-zinc-600">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(1.8, zoom + 0.1))}
                  className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-sm font-bold text-zinc-700 hover:border-[#007fff] hover:text-[#007fff]"
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="ml-2 rounded border border-zinc-300 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-700 hover:border-[#007fff] hover:text-[#007fff]"
                  title="Fit to workspace"
                >
                  FIT
                </button>
              </div>
            )}
          </div>

          {/* Canvas workspace with improved grid and rulers */}
          <div
            ref={workspaceRef}
            className="relative min-h-0 flex-1 overflow-hidden bg-[#f2f2f2]"
            style={{
              backgroundImage: `
                /* Subtle micro grid */
                linear-gradient(to right, rgba(100,116,139,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(100,116,139,0.08) 1px, transparent 1px),
                /* Every 5th line darker */
                linear-gradient(to right, rgba(100,116,139,0.16) 5px, transparent 5px),
                linear-gradient(to bottom, rgba(100,116,139,0.16) 5px, transparent 5px)
              `,
              backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
              backgroundPosition: "0 0, 0 0, 0 0, 0 0",
            }}
          >
            {/* Rulers */}
            <Rulers workspaceWidth={workspaceRef.current?.offsetWidth || 800} workspaceHeight={workspaceRef.current?.offsetHeight || 600} pxPerIn={pxPerIn} />

            {/* Canvas with padding for rulers */}
            <div
              className="absolute inset-0 overflow-auto"
              style={{ paddingTop: "24px", paddingLeft: "80px" }}
            >
              <div className="relative inline-flex h-full w-full items-center justify-center p-8">
                {/* Main preview with drag capability */}
                <div
                  className="cursor-move relative"
                  onPointerDown={startMove}
                  style={{
                    transform: `translate(${artPos.x}px, ${artPos.y}px)`,
                  }}
                >
                  <BannerPreview
                    uploadedImage={uploadedImage}
                    widthPx={artWidth}
                    heightPx={artHeight}
                    meshGrommetPoints={meshGrommetPoints}
                    widthIn={widthIn}
                    heightIn={heightIn}
                    widthNum={widthNum}
                    heightNum={heightNum}
                    form={form}
                    isMeshProduct={isMeshProduct}
                    isEconomicalStandProduct={isEconomicalStandProduct}
                  />

                  {/* Resize handles - sharp, small, orange */}
                  {!isEconomicalStandProduct &&
                    [
                      { pos: "-top-1.5 -left-1.5", cursor: "nw-resize" },
                      { pos: "-top-1.5 left-1/2 -translate-x-1/2", cursor: "n-resize" },
                      { pos: "-top-1.5 -right-1.5", cursor: "ne-resize" },
                      { pos: "top-1/2 -right-1.5 -translate-y-1/2", cursor: "e-resize" },
                      { pos: "-bottom-1.5 -right-1.5", cursor: "se-resize" },
                      { pos: "-bottom-1.5 left-1/2 -translate-x-1/2", cursor: "s-resize" },
                      { pos: "-bottom-1.5 -left-1.5", cursor: "sw-resize" },
                      { pos: "top-1/2 -left-1.5 -translate-y-1/2", cursor: "w-resize" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        data-role="resize-handle"
                        onPointerDown={startResize}
                        className={`absolute ${item.pos} h-3 w-3 border border-white bg-[#ff7f00] shadow-md`}
                        style={{
                          cursor: item.cursor,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.8)",
                        }}
                        aria-label="Resize banner"
                        title="Drag to resize"
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT BOTTOM CONTROLS */}
      <div className="border-t border-zinc-300 bg-white px-3 py-1.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {/* Images / Upload */}
          <ControlModule title="IMAGES / UPLOAD ARTWORK" value={uploadedFileName ? "UPLOADED" : "NO FILE"} active={Boolean(uploadedFileName)} compact>
            <label className="flex h-8 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-700 hover:border-[#007fff] hover:text-[#007fff]">
              {uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace" : "Upload"}
              <input
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
                onChange={onUploadArtwork}
                disabled={uploadingArtwork}
                className="hidden"
              />
            </label>
            {uploadError && <div className="mt-0.5 text-[9px] font-bold text-rose-600">{uploadError}</div>}
          </ControlModule>

          {/* Size */}
          <ControlModule title="SIZE" value={`${form.width}×${form.height}${form.unit === "inches" ? "\"" : "'"}`} active={!errors.width && !errors.height} compact>
            <div className="grid grid-cols-[1fr_1fr_50px] gap-0.5">
              <input type="number" value={form.width} onChange={(e) => set("width", e.target.value)} className="h-8 rounded border border-zinc-300 px-1.5 text-xs" placeholder="W" />
              <input type="number" value={form.height} onChange={(e) => set("height", e.target.value)} className="h-8 rounded border border-zinc-300 px-1.5 text-xs" placeholder="H" />
              <select value={form.unit} onChange={(e) => set("unit", e.target.value as Unit)} className="h-8 rounded border border-zinc-300 bg-white px-1 text-xs">
                <option value="inches">"</option>
                <option value="feet">'</option>
              </select>
            </div>
          </ControlModule>

          {/* Material */}
          {!isPosterProduct && (
            <ControlModule title="MATERIAL" value={isCanvasProduct ? "CANVAS" : isNoCurlProduct ? "NO-CURL" : isMeshProduct ? "MESH" : isHdpeProduct ? "HDPE" : form.material} active compact>
              {isCanvasProduct || isNoCurlProduct || isMeshProduct || isHdpeProduct ? (
                <div className="flex h-8 items-center rounded border border-zinc-300 bg-zinc-100 px-1.5 text-xs font-semibold text-zinc-700">
                  {isCanvasProduct ? "CANVAS" : isNoCurlProduct ? "NO-CURL" : isMeshProduct ? "MESH" : "HDPE"}
                </div>
              ) : (
                <select
                  value={form.material}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === "18oz Vinyl" || next === "18oz Double Sided") return;
                    set("material", next as Material);
                  }}
                  className="h-8 w-full rounded border border-zinc-300 bg-white px-1.5 text-xs"
                >
                  <option value="13oz Vinyl">13oz Vinyl</option>
                  <option value="15oz Vinyl">15oz Vinyl</option>
                  <option value="18oz Vinyl" disabled>18oz Vinyl</option>
                  <option value="18oz Double Sided" disabled>18oz Double Sided</option>
                </select>
              )}
            </ControlModule>
          )}

          {/* Print Sides */}
          {!(isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
            <ControlModule title="PRINT SIDES" value={form.doubleSided ? "DOUBLE" : "SINGLE"} active={form.doubleSided} compact>
              <div className="grid grid-cols-2 gap-0.5">
                <SegButton active={!form.doubleSided} onClick={() => set("doubleSided", false)}>
                  SINGLE
                </SegButton>
                <SegButton active={form.doubleSided} onClick={() => set("doubleSided", true)} disabled={isMeshMaterial}>
                  DOUBLE
                </SegButton>
              </div>
            </ControlModule>
          )}

          {/* Hemming / Welding */}
          {!(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
            <ControlModule
              title={isMeshProduct ? "WELDING" : "HEMMING"}
              value={isMeshProduct ? (form.meshWelding ? "YES" : "NO") : (form.hemming ? "YES" : "NO")}
              active={isMeshProduct ? form.meshWelding : form.hemming}
              compact
            >
              <div className="grid grid-cols-2 gap-0.5">
                <SegButton active={!(isMeshProduct ? form.meshWelding : form.hemming)} onClick={() => (isMeshProduct ? set("meshWelding", false) : set("hemming", false))}>
                  NO
                </SegButton>
                <SegButton active={isMeshProduct ? form.meshWelding : form.hemming} onClick={() => (isMeshProduct ? set("meshWelding", true) : set("hemming", true))}>
                  YES
                </SegButton>
              </div>
            </ControlModule>
          )}

          {/* Rope */}
          {!(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
            <ControlModule title="ROPE" value={isMeshProduct && form.meshRope ? "TOP & BTM" : "NONE"} active={isMeshProduct && form.meshRope} compact>
              <div className="grid grid-cols-4 gap-0.5">
                <SegButton active={!(isMeshProduct && form.meshRope)} onClick={() => set("meshRope", false)}>
                  NONE
                </SegButton>
                <SegButton active={false} disabled onClick={() => {}}>
                  TOP
                </SegButton>
                <SegButton active={false} disabled onClick={() => {}}>
                  BTM
                </SegButton>
                <SegButton active={isMeshProduct && form.meshRope} onClick={() => set("meshRope", true)}>
                  BOTH
                </SegButton>
              </div>
            </ControlModule>
          )}

          {/* Grommets */}
          {!(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
            <ControlModule title="GROMMETS" value={form.grommets ? "YES" : "NO"} active={form.grommets} compact>
              <div className="grid grid-cols-2 gap-0.5">
                <SegButton active={!form.grommets} onClick={() => set("grommets", false)}>
                  NO
                </SegButton>
                <SegButton active={form.grommets} onClick={() => set("grommets", true)}>
                  YES
                </SegButton>
              </div>
            </ControlModule>
          )}

          {/* Pole Pockets */}
          {!(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
            <ControlModule title="POLE POCKETS" value={form.polePockets ? "TOP & BTM" : "NONE"} active={form.polePockets} compact>
              <div className="grid grid-cols-4 gap-0.5">
                <SegButton active={!form.polePockets} onClick={() => set("polePockets", false)}>
                  NONE
                </SegButton>
                <SegButton active={false} disabled onClick={() => {}}>
                  TOP
                </SegButton>
                <SegButton active={false} disabled onClick={() => {}}>
                  BTM
                </SegButton>
                <SegButton active={form.polePockets} onClick={() => set("polePockets", true)}>
                  BOTH
                </SegButton>
              </div>
            </ControlModule>
          )}

          {/* Wind Slits */}
          {!(isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
            <ControlModule title="WIND SLITS" value={form.windSlits ? "YES" : "NO"} active={form.windSlits} compact>
              <div className="grid grid-cols-2 gap-0.5">
                <SegButton active={!form.windSlits} onClick={() => set("windSlits", false)}>
                  NO
                </SegButton>
                <SegButton active={form.windSlits} onClick={() => set("windSlits", true)} disabled={isMeshMaterial}>
                  YES
                </SegButton>
              </div>
            </ControlModule>
          )}

          {/* Quantity */}
          <ControlModule title="QUANTITY" value={form.quantity} active compact>
            <input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="h-8 w-full rounded border border-zinc-300 px-1.5 text-xs" />
          </ControlModule>

          {/* Add to Cart */}
          <ControlModule title="TOTAL / ADD TO CART" value={formatPrice(pricing.totalPrice)} active className="min-w-[220px]" compact>
            <div className="mb-1 flex items-center justify-between gap-1 text-[9px] text-zinc-600">
              <span className="font-bold">{pricing.sqFt} SQFT</span>
              <span>{effectiveQtyNum} UNIT{effectiveQtyNum !== 1 ? "S" : ""}</span>
            </div>
            <Button
              className="h-8 w-full rounded bg-[#ff7f00] text-[10px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#e67200]"
              onClick={handleAddToCart}
            >
              {addedToCart ? "✓ ADDED" : "ADD TO CART"}
            </Button>
          </ControlModule>
        </div>
      </div>
    </div>
  );
}

function ControlModule({
  title,
  value,
  active,
  className,
  compact,
  children,
}: {
  title: string;
  value: string;
  active?: boolean;
  className?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded border bg-white px-2 py-1 ${active ? "border-[#ff7f00] bg-[#ff7f00]/5" : "border-[#d8d8d8]"} ${className ?? ""} ${
        compact ? "min-w-[180px]" : "min-w-[220px]"
      }`}
    >
      <div className={`flex items-center justify-between gap-1 ${compact ? "mb-0.5" : "mb-1"} text-[9px] font-bold uppercase tracking-[0.1em]`}>
        <span className="text-zinc-600">{title}</span>
        <span className="truncate text-zinc-900">{value}</span>
      </div>
      {children}
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
      className={`h-7 rounded border text-[9px] font-bold uppercase tracking-[0.08em] transition ${
        disabled
          ? "cursor-not-allowed border-[#d8d8d8] bg-zinc-100 text-zinc-400"
          : active
            ? "border-[#ff7f00] bg-[#ff7f00]/15 text-[#ff7f00]"
            : "border-[#d8d8d8] bg-white text-zinc-700 hover:border-[#007fff] hover:text-[#007fff]"
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
    <div className={`rounded border border-[#d8d8d8] bg-white p-1.5 ${className ?? ""}`}>
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-zinc-600">{title}</div>
      {children}
      {error && <div className="mt-0.5 text-[9px] font-bold text-rose-600">{error}</div>}
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
      className="grid h-7 w-full grid-cols-2 overflow-hidden rounded border border-[#d8d8d8] text-[9px] font-bold uppercase tracking-[0.08em]"
    >
      <span className={`flex items-center justify-center ${isRightActive ? "bg-zinc-200 text-zinc-500" : "bg-[#007fff]/15 text-[#007fff]"}`}>{leftLabel}</span>
      <span className={`flex items-center justify-center ${isRightActive ? "bg-[#007fff]/15 text-[#007fff]" : "bg-zinc-200 text-zinc-500"}`}>{rightLabel}</span>
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
    <div className={`flex items-center justify-between text-xs ${strong ? "font-bold text-zinc-900" : "text-zinc-700"} ${className ?? ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
