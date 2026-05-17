"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type GrommetPlacement,
  type Material,
} from "@/lib/pricing";
import { useCart } from "@/context/CartContext";

const materialOptions = ["13oz Vinyl", "15oz Vinyl", "18oz Vinyl", "Mesh Banner", "Fabric Banner"] as const;
const unitOptions = ["inches", "feet"] as const;

type Unit = (typeof unitOptions)[number];
type MeshGrommetSpacing = "every-2-3-feet" | "every-1-2-feet" | "every-6-12-inches" | "corners-only" | "custom-inches";
type MeshRopeMode = "none" | "top-only" | "bottom-only" | "top-bottom";
type MeshPolePocketMode = "none" | "top-only" | "bottom-only" | "left-only" | "right-only" | "top-bottom" | "left-right";

interface FormState {
  width: string;
  height: string;
  unit: Unit;
  quantity: string;
  material: Material;
  doubleSided: boolean;
  grommets: boolean;
  grommetPlacement: GrommetPlacement;
  grommetSpacingIn: number;
  edgeFinish: EdgeFinish;
  polePockets: boolean;
  windSlits: boolean;
  hemming: boolean;
  rush: boolean;
  meshWelding: boolean;
  meshWebbing: boolean;
  meshRope: boolean;
  meshGrommetSpacing: MeshGrommetSpacing;
  meshGrommetSpacingCustom: string;
  meshRopeMode: MeshRopeMode;
  meshPolePocketMode: MeshPolePocketMode;
  meshPolePocketSize: 1 | 2 | 3 | 4;
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

const CONTROL_PANEL_TITLE: Record<ControlPanel, string> = {
  artwork: "Artwork",
  size: "Size",
  material: "Material",
  print: "Print Sides",
  finish: "Finishing",
  quantity: "Quantity",
};

const DEFAULTS: FormState = {
  width: "48",
  height: "24",
  unit: "inches",
  quantity: "1",
  material: "13oz Vinyl",
  doubleSided: false,
  grommets: true,
  grommetPlacement: "all-sides" as const,
  grommetSpacingIn: 24,
  edgeFinish: "none",
  polePockets: false,
  windSlits: false,
  hemming: false,
  rush: false,
  meshWelding: true,
  meshWebbing: false,
  meshRope: false,
  meshGrommetSpacing: "every-1-2-feet",
  meshGrommetSpacingCustom: "12",
  meshRopeMode: "none",
  meshPolePocketMode: "none",
  meshPolePocketSize: 2,
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
const ECONOMICAL_STAND_UNIT_PRICE = 135;
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
  placement: GrommetPlacement,
  spacingIn: number
): Array<{ xPct: number; yPct: number }> {
  if (!enabled || widthIn <= 0 || heightIn <= 0) return [];

  // spacingIn <= 0 means "corners only" — just the endpoints of each selected edge
  if (spacingIn <= 0) {
    const pts: Array<{ xPct: number; yPct: number }> = [];
    const seen = new Set<string>();
    const addPt = (x: number, y: number) => {
      const key = `${x},${y}`;
      if (!seen.has(key)) { seen.add(key); pts.push({ xPct: x, yPct: y }); }
    };
    const hasTop = placement === "all-sides" || placement.includes("top");
    const hasBottom = placement === "all-sides" || placement.includes("bottom");
    const hasLeft = placement === "all-sides" || placement.includes("left");
    const hasRight = placement === "all-sides" || placement.includes("right");
    if (hasTop) { addPt(0, 0); addPt(100, 0); }
    if (hasBottom) { addPt(0, 100); addPt(100, 100); }
    if (hasLeft) { addPt(0, 0); addPt(0, 100); }
    if (hasRight) { addPt(100, 0); addPt(100, 100); }
    return pts;
  }

  const points: Array<{ xPct: number; yPct: number }> = [];
  const safeSpacing = Math.max(1, spacingIn);

  // Helper to add points along an edge
  const addEdgePoints = (isHorizontal: boolean, atTop: boolean, atLeft: boolean) => {
    const length = isHorizontal ? widthIn : heightIn;
    const numPoints = Math.ceil(length / safeSpacing) + 1;

    for (let i = 0; i < numPoints; i++) {
      const position = (i / (numPoints - 1)) * 100;
      if (isHorizontal) {
        points.push({ xPct: position, yPct: atTop ? 0 : 100 });
      } else {
        points.push({ xPct: atLeft ? 0 : 100, yPct: position });
      }
    }
  };

  switch (placement) {
    case "all-sides":
      // Add all four edges
      addEdgePoints(true, true, true);   // top
      addEdgePoints(true, false, true);  // bottom
      // Add left and right (excluding corners already added)
      const heightPoints = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints; i++) {
        const yPct = (i / (heightPoints + 1)) * 100;
        points.push({ xPct: 0, yPct });
        points.push({ xPct: 100, yPct });
      }
      break;

    case "top-left-right":
      // Top and left/right edges
      addEdgePoints(true, true, true);   // top
      const heightPoints1 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints1; i++) {
        const yPct = (i / (heightPoints1 + 1)) * 100;
        points.push({ xPct: 0, yPct });
        points.push({ xPct: 100, yPct });
      }
      break;

    case "top-left-bottom":
      // Top, left, and bottom
      addEdgePoints(true, true, true);   // top
      addEdgePoints(true, false, true);  // bottom
      const heightPoints2 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints2; i++) {
        const yPct = (i / (heightPoints2 + 1)) * 100;
        points.push({ xPct: 0, yPct });
      }
      break;

    case "top-right-bottom":
      // Top, right, and bottom
      addEdgePoints(true, true, true);   // top
      addEdgePoints(true, false, true);  // bottom
      const heightPoints3 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints3; i++) {
        const yPct = (i / (heightPoints3 + 1)) * 100;
        points.push({ xPct: 100, yPct });
      }
      break;

    case "left-right-bottom":
      // Left, right, and bottom
      addEdgePoints(true, false, true);  // bottom
      const heightPoints4 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints4; i++) {
        const yPct = (i / (heightPoints4 + 1)) * 100;
        points.push({ xPct: 0, yPct });
        points.push({ xPct: 100, yPct });
      }
      break;

    case "top-left":
      // Top and left edges
      addEdgePoints(true, true, true);   // top
      const heightPoints5 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints5; i++) {
        const yPct = (i / (heightPoints5 + 1)) * 100;
        points.push({ xPct: 0, yPct });
      }
      break;

    case "top-right":
      // Top and right edges
      addEdgePoints(true, true, true);   // top
      const heightPoints6 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints6; i++) {
        const yPct = (i / (heightPoints6 + 1)) * 100;
        points.push({ xPct: 100, yPct });
      }
      break;

    case "top-bottom":
      // Top and bottom edges
      addEdgePoints(true, true, true);   // top
      addEdgePoints(true, false, true);  // bottom
      break;

    case "left-right":
      // Left and right edges
      const heightPoints7 = Math.ceil(heightIn / safeSpacing) + 1;
      for (let i = 0; i < heightPoints7; i++) {
        const yPct = (i / (heightPoints7 - 1)) * 100;
        points.push({ xPct: 0, yPct });
        points.push({ xPct: 100, yPct });
      }
      break;

    case "left-bottom":
      // Left and bottom edges
      addEdgePoints(true, false, true);  // bottom
      const heightPoints8 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints8; i++) {
        const yPct = (i / (heightPoints8 + 1)) * 100;
        points.push({ xPct: 0, yPct });
      }
      break;

    case "right-bottom":
      // Right and bottom edges
      addEdgePoints(true, false, true);  // bottom
      const heightPoints9 = Math.ceil(heightIn / safeSpacing) - 1;
      for (let i = 1; i < heightPoints9; i++) {
        const yPct = (i / (heightPoints9 + 1)) * 100;
        points.push({ xPct: 100, yPct });
      }
      break;

    case "top-only":
      // Top edge only
      addEdgePoints(true, true, true);
      break;

    case "bottom-only":
      // Bottom edge only
      addEdgePoints(true, false, true);
      break;

    case "left-only":
      // Left edge only
      addEdgePoints(false, false, true);
      break;

    case "right-only":
      // Right edge only
      addEdgePoints(false, false, false);
      break;
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
  const [activePanel, setActivePanel] = useState<ControlPanel | null>(null);
  const [showMobilePricingDetails, setShowMobilePricingDetails] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [panelAnchor, setPanelAnchor] = useState<{ left: number; top: number; width: number } | null>(null);
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const artworkInputRef = useRef<HTMLInputElement | null>(null);

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
  const meshRopeActive = isMeshProduct && form.meshRopeMode !== "none";
  const meshWebbingCost = form.meshWebbing ? perimeterFt * 1.75 : 0;
  const meshRopeCost = meshRopeActive ? perimeterFt * 1.75 : 0;
  const runtimeViewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
  const isMobileViewport = runtimeViewportWidth < 768;
  const previewMaxWidth = isMobileViewport ? Math.max(220, runtimeViewportWidth - 48) : PREVIEW_MAX_WIDTH;
  const previewMaxHeight = isMobileViewport ? 360 : PREVIEW_MAX_HEIGHT;

  const fitScale = Math.min(
    previewMaxWidth / Math.max(widthIn, 1),
    previewMaxHeight / Math.max(heightIn, 1)
  );
  const economicalStandBasePxPerIn = ECONOMICAL_STAND_PREVIEW_HEIGHT / ECONOMICAL_STAND_HEIGHT_IN;
  const economicalStandPxPerIn = Math.min(economicalStandBasePxPerIn, fitScale * zoom);
  const pxPerIn = isEconomicalStandProduct
    ? economicalStandPxPerIn
    : fitScale * zoom;
  const artWidth = widthIn * pxPerIn;
  const artHeight = heightIn * pxPerIn;
  const widthLabelInches = formatInchLabel(widthIn);
  const heightLabelInches = formatInchLabel(heightIn);
  const widthFeetInchesLabel = formatFeetAndInchesLabel(widthIn);
  const heightFeetInchesLabel = formatFeetAndInchesLabel(heightIn);

  const canvasProductLabel = isCanvasProduct
    ? "Canvas"
    : isMeshProduct
    ? "Mesh"
    : isHdpeProduct
    ? "HDPE"
    : isPosterProduct
    ? "Poster"
    : isNoCurlProduct
    ? "No-Curl"
    : isEconomicalStandProduct
    ? "Economical Stand"
    : form.material || "Vinyl";

  const canvasPrintLabel = "Vinyl";

  const canvasHeaderProductName = isEconomicalStandProduct ? "Econo Banner Stand" : productName;
  const canvasHeaderDetail = isEconomicalStandProduct
    ? `${canvasHeaderProductName}, ${widthLabelInches} x ${heightLabelInches}`
    : `${canvasProductLabel} ${canvasPrintLabel}, ${widthLabelInches} x ${heightLabelInches}`;
  const showVinylRateMatrix = !isCanvasProduct && !isMeshProduct && !isHdpeProduct && !isPosterProduct && !isNoCurlProduct && !isEconomicalStandProduct;

  const canvasRate = useMemo(() => getCanvasSqFtRate(qtyNum), [qtyNum]);
  const hdpeRate = useMemo(() => getHdpeSqFtRate(qtyNum), [qtyNum]);
  const noCurlRate = useMemo(() => getNoCurlSqFtRate(Math.max(1, Math.ceil((widthIn / 12) * (heightIn / 12)))), [widthIn, heightIn]);
  const posterRate = useMemo(() => getPosterSqFtRate(posterBillableSqFt), [posterBillableSqFt]);
  const meshRate   = useMemo(() => getMeshSqFtRate(meshBillableSqFt), [meshBillableSqFt]);
  const meshGrommetPoints = useMemo(() => {
    const spacingIn = isMeshProduct
      ? (form.meshGrommetSpacing === "every-2-3-feet" ? 30
        : form.meshGrommetSpacing === "every-1-2-feet" ? 18
        : form.meshGrommetSpacing === "every-6-12-inches" ? 9
        : form.meshGrommetSpacing === "corners-only" ? 0
        : Math.max(1, parseFloat(form.meshGrommetSpacingCustom) || 12))
      : form.grommetSpacingIn;
    return getGrommetPoints(
      widthIn, heightIn,
      !isCanvasProduct && !isHdpeProduct && !isPosterProduct && !isNoCurlProduct && form.grommets,
      form.grommetPlacement,
      spacingIn
    );
  }, [widthIn, heightIn, isCanvasProduct, isHdpeProduct, isPosterProduct, isNoCurlProduct, form.grommets, form.grommetPlacement, form.grommetSpacingIn, isMeshProduct, form.meshGrommetSpacing, form.meshGrommetSpacingCustom]);

  const pricing = useMemo(
    () => {
      if (isMeshProduct) {
        const m = calculateMeshPrice(
          widthNum, heightNum, form.unit, effectiveQtyNum,
          form.grommets,
          form.meshWelding,
          form.meshWebbing,
          meshRopeActive,
          form.meshPolePocketMode !== "none",
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
        grommetPlacement: form.grommetPlacement,
        grommetSpacingIn: form.grommetSpacingIn,
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
      form.grommetPlacement,
      form.grommetSpacingIn,
      form.edgeFinish,
      form.polePockets,
      form.windSlits,
      form.hemming,
      form.rush,
      form.meshWelding,
      form.meshWebbing,
      meshRopeActive,
      form.meshPolePocketMode,
    ]
  );
  const displaySqFtRate = isHdpeProduct
    ? hdpeRate
    : isCanvasProduct
      ? canvasRate
      : isMeshProduct
        ? meshRate
        : isPosterProduct
          ? posterRate
          : isNoCurlProduct
            ? noCurlRate
            : pricing.basePricePerUnit / Math.max(pricing.sqFt, 1);
  const hdpeTierRates = [
    { qty: "1-9", rate: getHdpeSqFtRate(1) },
    { qty: "10-99", rate: getHdpeSqFtRate(10) },
    { qty: "100+", rate: getHdpeSqFtRate(100) },
  ];

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const openPanel = useCallback((panel: ControlPanel, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPanelAnchor({ left: rect.left, top: rect.top, width: rect.width });
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelAnchor(null);
  }, []);

  const openArtworkPicker = useCallback(() => {
    if (uploadingArtwork) return;
    artworkInputRef.current?.click();
  }, [uploadingArtwork]);

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

    const meshEdgeFinish: EdgeFinish = meshRopeActive
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
      material: isEconomicalStandProduct
        ? "Economical Banner Stand"
        : isNoCurlProduct
          ? "No-Curl Banner"
          : isPosterProduct
            ? "Poster"
            : isHdpeProduct
              ? "HDPE"
              : isCanvasProduct
                ? "Canvas"
                : isMeshProduct
                  ? "Mesh Banner"
                  : form.material,
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
    return;
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
    if (!activePanel) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [activePanel, closePanel]);

  useEffect(() => {
    if (!activePanel) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (panelRef.current?.contains(target)) return;
      if (target.closest('[data-role="control-toolbar-button"]')) return;

      closePanel();
    }

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [activePanel, closePanel]);

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

  useEffect(() => {
    setArtPos({ x: 0, y: isMobileViewport ? 0 : 55 });
  }, [isMobileViewport]);

  const viewportWidth = runtimeViewportWidth;
  const panelMaxWidth =
    activePanel === "size"
      ? 300
      : activePanel === "finish"
        ? 520
        : activePanel === "artwork"
          ? 460
          : activePanel === "material"
            ? 300
            : activePanel === "quantity"
              ? 300
              : 340;
  const panelWidth = Math.max(220, Math.min(panelMaxWidth, viewportWidth - 24));
  const panelLeft = panelAnchor
    ? clamp(panelAnchor.left + panelAnchor.width / 2 - panelWidth / 2, 12, Math.max(12, viewportWidth - panelWidth - 12))
    : 12;

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col bg-[#f4f4f4] text-zinc-800 md:min-h-[calc(100dvh-88px)] md:h-[calc(100vh-88px)]">
      <input
        ref={artworkInputRef}
        type="file"
        accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff"
        onChange={onUploadArtwork}
        disabled={uploadingArtwork}
        className="hidden"
      />

      <div className="mx-3 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-white px-3 py-2 md:hidden">
          <div className="text-[16px] font-semibold uppercase tracking-tight text-zinc-900">{canvasHeaderProductName}</div>
          <div className="mt-0.5 text-[10px] text-zinc-600">{canvasHeaderDetail}</div>

          <div className="mt-2">
            <div className="text-[34px] leading-none font-semibold text-[var(--brand-primary)]">{formatPrice(pricing.totalPrice)}</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">
              {!isEconomicalStandProduct && !isCanvasProduct && !isMeshProduct && !isNoCurlProduct && !isPosterProduct && `${pricing.sqFt} sqft / 24 Hours`}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMobilePricingDetails((prev) => !prev)}
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500"
          >
            Pricing And Shipping
            <span className="text-[11px]">{showMobilePricingDetails ? "-" : "+"}</span>
          </button>

          {showMobilePricingDetails && <div className="mt-1 text-[10px] text-zinc-600">
            {isEconomicalStandProduct ? (
              <div className="text-[11px] leading-tight text-zinc-700">
                <div>{formatPrice(ECONOMICAL_STAND_UNIT_PRICE)} per item</div>
              </div>
            ) : isCanvasProduct ? (
              <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5">
                <span className="text-zinc-500">1-999</span>
                <span>{formatPrice(7.47)} per sqft</span>
                <span className="text-zinc-500">1000-4999</span>
                <span>{formatPrice(5.69)} per sqft</span>
                <span className="text-zinc-500">5000+</span>
                <span>{formatPrice(3.74)} per sqft</span>
              </div>
            ) : isMeshProduct ? (
              <div className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-0.5">
                <span className="text-zinc-500">1-999</span>
                <span>{formatPrice(3.66)} per sqft</span>
                <span className="text-zinc-500">1000-2499</span>
                <span>{formatPrice(2.24)} per sqft</span>
                <span className="text-zinc-500">2500-4999</span>
                <span>{formatPrice(1.64)} per sqft</span>
                <span className="text-zinc-500">5000+</span>
                <span>{formatPrice(1.49)} per sqft</span>
              </div>
            ) : isHdpeProduct ? (
              <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5">
                {hdpeTierRates.map((tier) => (
                  <Fragment key={`hdpe-tier-mobile-${tier.qty}`}>
                    <span className="text-zinc-500">{tier.qty}</span>
                    <span>{formatPrice(tier.rate)} per sqft</span>
                  </Fragment>
                ))}
                <span className="text-zinc-500">Type</span>
                <span>Single-Sided</span>
              </div>
            ) : showVinylRateMatrix ? (
              <div className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-0.5">
                <span className="text-zinc-500">13oz Single</span>
                <span>{formatPrice(1.25 * 1.5)} per sqft</span>
                <span className="text-zinc-500">15oz Single</span>
                <span>{formatPrice(1.75 * 1.5)} per sqft</span>
                <span className="text-zinc-500">18oz Single</span>
                <span>{formatPrice(2.25 * 1.5)} per sqft</span>
                <span className="text-zinc-500">18oz Double</span>
                <span>{formatPrice(4.25 * 1.5)} per sqft</span>
              </div>
            ) : isNoCurlProduct ? (
              <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5">
                <span className="text-zinc-500">1-999</span>
                <span>{formatPrice(4.50)} per sqft</span>
                <span className="text-zinc-500">1000+</span>
                <span>{formatPrice(3.00)} per sqft</span>
              </div>
            ) : isPosterProduct ? (
              <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5">
                <span className="text-zinc-500">1-999</span>
                <span>{formatPrice(3.00)} per sqft</span>
                <span className="text-zinc-500">1000-4999</span>
                <span>{formatPrice(2.25)} per sqft</span>
                <span className="text-zinc-500">5000+</span>
                <span>{formatPrice(1.50)} per sqft</span>
              </div>
            ) : (
              <div className="text-[11px] leading-tight text-zinc-500">
                <div>{canvasHeaderProductName}</div>
                <div className="mt-0.5 text-zinc-700">{form.doubleSided ? "Double-Sided" : "Single-Sided"}</div>
                <div>{formatPrice(displaySqFtRate)} per sqft</div>
              </div>
            )}
            <div className="mt-1 text-[10px] text-zinc-500">
              {!isEconomicalStandProduct && !isCanvasProduct && !isMeshProduct && !isNoCurlProduct && !isPosterProduct && `${pricing.sqFt} sqft / 24 Hours Production`}
            </div>
          </div>}
        </div>

        <div
          ref={workspaceRef}
          className={`relative min-h-[360px] flex-1 overflow-hidden md:min-h-0 ${isMeshProduct ? "bg-[#f6f6f4]" : "bg-[#f9f9f9]"}`}
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)",
            backgroundSize: isMeshProduct ? "18px 18px" : "24px 24px",
          }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-4 z-20 hidden w-[min(940px,calc(100%-24px))] px-2 md:block md:px-3"
            style={{ transform: "translateX(-50%)" }}
          >
            <div className="mx-auto grid w-full grid-cols-1 gap-2 px-1 md:items-start md:gap-8 max-w-[940px] md:grid-cols-[0.85fr_1.4fr_0.85fr]">
              {/* Product Info */}
              <div>
                <div className={`text-[27px] leading-[0.98] uppercase tracking-tight text-zinc-900 md:whitespace-nowrap ${isEconomicalStandProduct ? "font-normal md:text-[34px]" : "font-medium md:text-[36px]"}`}>
                  {canvasHeaderProductName}
                </div>
                <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">
                  {canvasHeaderDetail}
                </div>
                {!isEconomicalStandProduct && productDescription && <div className="mt-1 text-[10px] text-zinc-500 md:text-[11px]">{productDescription}</div>}
              </div>

              {/* Pricing Info */}
              <div className="text-[10px] text-zinc-600 md:pt-1 md:text-center">
                <div className="mb-1 text-[10px] font-bold underline uppercase tracking-[0.14em] text-zinc-500">Pricing And Shipping</div>
                {isEconomicalStandProduct ? (
                  <div className="text-[11px] leading-tight text-zinc-700">
                    <div>{formatPrice(ECONOMICAL_STAND_UNIT_PRICE)} per item</div>
                  </div>
                ) : isCanvasProduct ? (
                  <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5 text-[10px] md:text-center md:grid-cols-2 md:justify-center md:inline-grid">
                    <span className="text-zinc-500">1-999</span>
                    <span>{formatPrice(7.47)} per sqft</span>
                    <span className="text-zinc-500">1000-4999</span>
                    <span>{formatPrice(5.69)} per sqft</span>
                    <span className="text-zinc-500">5000+</span>
                    <span>{formatPrice(3.74)} per sqft</span>
                  </div>
                ) : isMeshProduct ? (
                  <div className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-0.5 text-[10px] md:text-center md:grid-cols-2 md:justify-center md:inline-grid">
                    <span className="text-zinc-500">1-999</span>
                    <span>{formatPrice(3.66)} per sqft</span>
                    <span className="text-zinc-500">1000-2499</span>
                    <span>{formatPrice(2.24)} per sqft</span>
                    <span className="text-zinc-500">2500-4999</span>
                    <span>{formatPrice(1.64)} per sqft</span>
                    <span className="text-zinc-500">5000+</span>
                    <span>{formatPrice(1.49)} per sqft</span>
                  </div>
                ) : isHdpeProduct ? (
                  <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5 text-[10px] md:text-center md:grid-cols-2 md:justify-center md:inline-grid">
                    {hdpeTierRates.map((tier) => (
                      <Fragment key={`hdpe-tier-${tier.qty}`}>
                        <span className="text-zinc-500">{tier.qty}</span>
                        <span>{formatPrice(tier.rate)} per sqft</span>
                      </Fragment>
                    ))}
                    <span className="text-zinc-500">Type</span>
                    <span>Single-Sided</span>
                  </div>
                ) : showVinylRateMatrix ? (
                  <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5 text-[10px] md:text-center md:grid-cols-2 md:justify-center md:inline-grid">
                    <span className="text-zinc-500">13oz Single</span>
                    <span>{formatPrice(1.25 * 1.5)} per sqft</span>
                    <span className="text-zinc-500">15oz Single</span>
                    <span>{formatPrice(1.75 * 1.5)} per sqft</span>
                    <span className="text-zinc-500">18oz Single</span>
                    <span>{formatPrice(2.25 * 1.5)} per sqft</span>
                    <span className="text-zinc-500">18oz Double</span>
                    <span>{formatPrice(4.25 * 1.5)} per sqft</span>
                  </div>
                ) : isNoCurlProduct ? (
                  <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5 text-[10px] md:text-center md:grid-cols-2 md:justify-center md:inline-grid">
                    <span className="text-zinc-500">1-999</span>
                    <span>{formatPrice(4.50)} per sqft</span>
                    <span className="text-zinc-500">1000+</span>
                    <span>{formatPrice(3.00)} per sqft</span>
                  </div>
                ) : isPosterProduct ? (
                  <div className="grid grid-cols-[56px_1fr] gap-x-2 gap-y-0.5 text-[10px] md:text-center md:grid-cols-2 md:justify-center md:inline-grid">
                    <span className="text-zinc-500">1-999</span>
                    <span>{formatPrice(3.00)} per sqft</span>
                    <span className="text-zinc-500">1000-4999</span>
                    <span>{formatPrice(2.25)} per sqft</span>
                    <span className="text-zinc-500">5000+</span>
                    <span>{formatPrice(1.50)} per sqft</span>
                  </div>
                ) : (
                  <div className="text-[11px] leading-tight text-zinc-500">
                    <div>{canvasHeaderProductName}</div>
                    <div className="mt-0.5 text-zinc-700">{form.doubleSided ? "Double-Sided" : "Single-Sided"}</div>
                    <div>{formatPrice(displaySqFtRate)} per sqft</div>
                  </div>
                )}
                <div className="mt-1 text-[10px] text-zinc-500">
                  {!isEconomicalStandProduct && !isCanvasProduct && !isMeshProduct && !isNoCurlProduct && !isPosterProduct && `${pricing.sqFt} sqft / 24 Hours Production`}
                </div>
              </div>

              {/* Total Price */}
              <div className="text-left md:pt-1 md:text-right">
                <div className="text-[38px] leading-none font-semibold text-[var(--brand-primary)] md:text-[44px]">{formatPrice(pricing.totalPrice)}</div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {!isEconomicalStandProduct && !isCanvasProduct && !isMeshProduct && !isNoCurlProduct && !isPosterProduct && `${pricing.sqFt} sqft / 24 Hours`}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`absolute left-1/2 top-1/2 select-none border border-zinc-500 bg-white ${isEconomicalStandProduct ? "cursor-pointer rounded-none shadow-none" : "cursor-default shadow"}`}
            onClick={isEconomicalStandProduct ? openArtworkPicker : undefined}
            onPointerDown={undefined}
            style={{
              width: artWidth,
              height: artHeight,
              transform: `translate(calc(-50% + ${artPos.x}px), calc(-50% + ${artPos.y}px))`,
            }}
          >
            {!isEconomicalStandProduct && (
              <>
                {/* Signs365-style outer bleed guide */}
                <div className="pointer-events-none absolute -inset-3 border border-dashed border-zinc-300" />

                {/* Top dimension line */}
                <div className="pointer-events-none absolute left-0 right-0 flex flex-col gap-0.5" style={{ bottom: "calc(100% + 6px)" }}>
                  <div className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">v TOP OF IMAGE v</div>
                  <div className="relative flex h-2.5 items-center">
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-300" />
                    <div className="absolute left-0 h-full w-px bg-zinc-300" />
                    <div className="absolute right-0 h-full w-px bg-zinc-300" />
                    <div className="relative w-full text-center leading-none">
                      <span className={`px-1 text-[10px] font-medium text-zinc-700 ${isMeshProduct ? "bg-[#f6f6f4]" : "bg-[#f9f9f9]"}`}>{widthLabelInches}</span>
                    </div>
                  </div>
                </div>

                {/* Top corner extension lines */}
                <div className="pointer-events-none absolute left-0 w-px bg-zinc-300" style={{ bottom: "100%", height: "6px" }} />
                <div className="pointer-events-none absolute right-0 w-px bg-zinc-300" style={{ bottom: "100%", height: "6px" }} />

                {/* Left dimension line */}
                <div className="pointer-events-none absolute top-0 bottom-0 flex flex-col items-center" style={{ right: "calc(100% + 2px)", width: "12px" }}>
                  <div className="h-px w-full flex-none bg-zinc-300" />
                  <div className="relative flex flex-1 items-center justify-center">
                    <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-300" />
                    <span className={`relative -rotate-90 whitespace-nowrap py-0.5 text-[10px] font-medium text-zinc-700 ${isMeshProduct ? "bg-[#f6f6f4]" : "bg-[#f9f9f9]"}`}>{heightLabelInches}</span>
                  </div>
                  <div className="h-px w-full flex-none bg-zinc-300" />
                </div>

                {/* Right dimension line */}
                <div className="pointer-events-none absolute top-0 bottom-0 flex flex-col items-center" style={{ left: "calc(100% + 2px)", width: "12px" }}>
                  <div className="h-px w-full flex-none bg-zinc-300" />
                  <div className="relative flex flex-1 items-center justify-center">
                    <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-300" />
                    <span className={`relative rotate-90 whitespace-nowrap py-0.5 text-[10px] font-medium text-zinc-700 ${isMeshProduct ? "bg-[#f6f6f4]" : "bg-[#f9f9f9]"}`}>{heightLabelInches}</span>
                  </div>
                  <div className="h-px w-full flex-none bg-zinc-300" />
                </div>
              </>
            )}

            {isEconomicalStandProduct && (
              <>
                <div
                  className={`pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700 ${
                    isMobileViewport ? "top-2" : "-top-11"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Top Of Image</span>
                  <div className="mt-1 flex items-center gap-2 text-zinc-700">
                    <span className={`${isMobileViewport ? "w-8" : "w-12"} h-px bg-zinc-400`} />
                    <span>{widthLabelInches}</span>
                    <span className={`${isMobileViewport ? "w-8" : "w-12"} h-px bg-zinc-400`} />
                  </div>
                </div>
                <div
                  className={`pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700 ${
                    isMobileViewport ? "bottom-2" : "-bottom-11"
                  }`}
                >
                  <div className="flex items-center gap-2 text-zinc-700">
                    <span className={`${isMobileViewport ? "w-8" : "w-12"} h-px bg-zinc-400`} />
                    <span>{widthLabelInches}</span>
                    <span className={`${isMobileViewport ? "w-8" : "w-12"} h-px bg-zinc-400`} />
                  </div>
                </div>
                <div
                  className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700 ${
                    isMobileViewport ? "left-2" : "-left-14"
                  }`}
                >
                  <span className={`${isMobileViewport ? "h-10" : "h-16"} w-px bg-zinc-400`} />
                  <span className="my-2 rotate-90">{heightLabelInches}</span>
                  <span className={`${isMobileViewport ? "h-10" : "h-16"} w-px bg-zinc-400`} />
                </div>
                <div
                  className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col items-center text-[11px] font-semibold text-zinc-700 ${
                    isMobileViewport ? "right-2" : "-right-14"
                  }`}
                >
                  <span className={`${isMobileViewport ? "h-10" : "h-16"} w-px bg-zinc-400`} />
                  <span className="my-2 -rotate-90">{heightLabelInches}</span>
                  <span className={`${isMobileViewport ? "h-10" : "h-16"} w-px bg-zinc-400`} />
                </div>
              </>
            )}

            {uploadedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={uploadedImage}
                alt="Artwork preview"
                className={`h-full w-full object-cover ${isEconomicalStandProduct ? "rounded-none" : ""}`}
                draggable={false}
              />
            ) : uploadedFileUrl && uploadedFileName?.toLowerCase().endsWith(".pdf") ? (
              <div className="relative h-full w-full overflow-hidden">
                <iframe
                  src={`${uploadedFileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
                  title="Uploaded PDF artwork preview"
                  className="absolute -left-3 top-0 h-full w-[calc(100%+32px)] pointer-events-none"
                  scrolling="no"
                  style={{ clipPath: "inset(0 20px 0 0)" }}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-white" />
              </div>
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

            {/* Rope visualization */}
            {isMeshProduct && form.meshRopeMode !== "none" && (
              <>
                {(form.meshRopeMode === "top-only" || form.meshRopeMode === "top-bottom") && (
                  <div
                    className="pointer-events-none absolute rounded-sm bg-zinc-900"
                    style={{ top: -7, left: -14, right: -14, height: 7 }}
                  />
                )}
                {(form.meshRopeMode === "bottom-only" || form.meshRopeMode === "top-bottom") && (
                  <div
                    className="pointer-events-none absolute rounded-sm bg-zinc-900"
                    style={{ bottom: -7, left: -14, right: -14, height: 7 }}
                  />
                )}
              </>
            )}

            {/* Pole pocket visualization */}
            {isMeshProduct && form.meshPolePocketMode !== "none" && (() => {
              const pocketPx = Math.max(8, form.meshPolePocketSize * pxPerIn);
              const hasTop = form.meshPolePocketMode === "top-only" || form.meshPolePocketMode === "top-bottom";
              const hasBottom = form.meshPolePocketMode === "bottom-only" || form.meshPolePocketMode === "top-bottom";
              const hasLeft = form.meshPolePocketMode === "left-only" || form.meshPolePocketMode === "left-right";
              const hasRight = form.meshPolePocketMode === "right-only" || form.meshPolePocketMode === "left-right";
              return (
                <>
                  {hasTop && <div className="pointer-events-none absolute left-0 right-0 top-0 border-b-2 border-[#007fff]/60 bg-[#007fff]/15" style={{ height: pocketPx }} />}
                  {hasBottom && <div className="pointer-events-none absolute left-0 right-0 bottom-0 border-t-2 border-[#007fff]/60 bg-[#007fff]/15" style={{ height: pocketPx }} />}
                  {hasLeft && <div className="pointer-events-none absolute top-0 bottom-0 left-0 border-r-2 border-[#007fff]/60 bg-[#007fff]/15" style={{ width: pocketPx }} />}
                  {hasRight && <div className="pointer-events-none absolute top-0 bottom-0 right-0 border-l-2 border-[#007fff]/60 bg-[#007fff]/15" style={{ width: pocketPx }} />}
                </>
              );
            })()}

            {!isEconomicalStandProduct && !isMobileViewport && (
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
            <div className="md:hidden">
              <button
                type="button"
                className="h-10 w-full rounded border border-[#22c55e] bg-white px-3 text-left text-sm font-semibold uppercase tracking-[0.08em] text-[#16a34a]"
                onClick={() => setShowMobileOptions((prev) => !prev)}
              >
                {showMobileOptions ? "- Hide Options" : "+ Show Options"}
              </button>
            </div>
            <div className={`${showMobileOptions ? "grid" : "hidden"} gap-2 sm:grid-cols-2 xl:grid-cols-6 md:grid`}>
              <ToolbarButton
                title="Artwork"
                value={uploadedFileName ? "Uploaded" : "No file"}
                active={activePanel === "artwork"}
                onClick={(event) => openPanel("artwork", event)}
              />
              {!isEconomicalStandProduct && (
                <ToolbarButton
                  title="Size"
                  value={`${widthFeetInchesLabel} x ${heightFeetInchesLabel}`}
                  active={activePanel === "size"}
                  onClick={(event) => openPanel("size", event)}
                  status={errors.width || errors.height ? "alert" : "ok"}
                />
              )}
              {!isPosterProduct && !isEconomicalStandProduct && (
                <ToolbarButton
                  title="Material"
                  value={isCanvasProduct ? "Canvas" : isNoCurlProduct ? "No-Curl Banner" : isMeshProduct ? "Mesh Banner" : isHdpeProduct ? "HDPE" : form.material}
                  active={activePanel === "material"}
                  onClick={(event) => openPanel("material", event)}
                />
              )}
              {!(isCanvasProduct || isMeshProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
                <ToolbarButton
                  title="Print"
                  value={form.doubleSided ? "Double-sided" : "Single-sided"}
                  active={activePanel === "print"}
                  onClick={(event) => openPanel("print", event)}
                />
              )}
              {!(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
                <ToolbarButton
                  title="Finishing"
                  value={isMeshProduct ? [form.meshWelding ? "Welded" : null, form.meshRopeMode !== "none" ? "Rope" : null, form.grommets ? "Grommets" : null, form.meshPolePocketMode !== "none" ? "Pockets" : null].filter(Boolean).join(" / ") || "None" : [form.hemming ? "Hemmed" : null, form.grommets ? "Grommets" : null, form.polePockets ? "Pockets" : null, form.windSlits ? "Wind slits" : null].filter(Boolean).join(" / ") || "None"}
                  active={activePanel === "finish"}
                  onClick={(event) => openPanel("finish", event)}
                />
              )}
              <ToolbarButton
                title="Quantity"
                value={`${form.quantity} unit${effectiveQtyNum !== 1 ? "s" : ""}`}
                active={activePanel === "quantity"}
                onClick={(event) => openPanel("quantity", event)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Cart Action</div>
            <Button className="mt-3 h-10 w-full rounded bg-[#ff7f00] text-sm font-semibold text-white hover:bg-[#e67200]" onClick={handleAddToCart}>
              {addedToCart ? "Added" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      {activePanel && (panelAnchor || isMobileViewport) && (
        <>
          {isMobileViewport && (
            <button
              type="button"
              aria-label="Close controls panel"
              onClick={closePanel}
              className="fixed inset-0 z-40 bg-black/25"
            />
          )}
          <div
            ref={panelRef}
            className="fixed z-50 rounded-lg border border-zinc-300 bg-white p-2 shadow-2xl"
            style={{
              width: isMobileViewport ? "auto" : `${panelWidth}px`,
              left: isMobileViewport ? "12px" : `${panelLeft}px`,
              right: isMobileViewport ? "12px" : "auto",
              top: isMobileViewport ? "auto" : `${Math.max(16, (panelAnchor?.top ?? 80) - 10)}px`,
              bottom: isMobileViewport ? "12px" : "auto",
              transform: isMobileViewport ? "none" : "translateY(-100%)",
              maxHeight: isMobileViewport ? "72dvh" : "none",
              overflowY: isMobileViewport ? "auto" : "visible",
            }}
          >
            {!isMobileViewport && <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-zinc-300 bg-white" aria-hidden="true" />}
            <div className="relative">
            {activePanel !== "size" && (
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700">{CONTROL_PANEL_TITLE[activePanel]}</h3>
                <button
                  type="button"
                  onClick={closePanel}
                  className="h-6 rounded border border-zinc-300 px-2 text-[11px] font-semibold text-zinc-600 hover:border-zinc-400"
                >
                  Close
                </button>
              </div>
            )}

            {activePanel === "artwork" && (
              <div>
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
                <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
                  <div className="mb-2 text-center text-[11px] font-semibold text-zinc-600">Sign size</div>
                  <div className="grid grid-cols-[42px_minmax(0,1fr)_12px_minmax(0,1fr)_12px] items-center gap-1 text-[11px] text-zinc-600">
                    <span className="font-semibold lowercase text-zinc-500">width:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dimensionInputs.widthFeet}
                      onChange={(event) => setDimension("width", "feet", event.target.value)}
                      className="h-6 w-full min-w-0 rounded border border-zinc-300 px-1.5 text-[12px] [appearance:textfield]"
                    />
                    <span className="text-[10px] font-semibold">ft</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dimensionInputs.widthInches}
                      onChange={(event) => setDimension("width", "inches", event.target.value)}
                      className="h-6 w-full min-w-0 rounded border border-zinc-300 px-1.5 text-[12px] [appearance:textfield]"
                    />
                    <span className="text-[10px] font-semibold">in</span>
                    <span className="font-semibold lowercase text-zinc-500">height:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dimensionInputs.heightFeet}
                      onChange={(event) => setDimension("height", "feet", event.target.value)}
                      className="h-6 w-full min-w-0 rounded border border-zinc-300 px-1.5 text-[12px] [appearance:textfield]"
                    />
                    <span className="text-[10px] font-semibold">ft</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dimensionInputs.heightInches}
                      onChange={(event) => setDimension("height", "inches", event.target.value)}
                      className="h-6 w-full min-w-0 rounded border border-zinc-300 px-1.5 text-[12px] [appearance:textfield]"
                    />
                    <span className="text-[10px] font-semibold">in</span>
                  </div>
                </div>
                <div className="mt-1 rounded border border-zinc-200 bg-white p-2 text-[11px] text-zinc-600">
                  <div className="font-semibold text-zinc-800">Live size: {widthFeetInchesLabel} x {heightFeetInchesLabel}</div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">Allowed range: 0 ft 6 in to 20 ft 0 in</div>
                </div>
                {(errors.width || errors.height) && (
                  <div className="mt-2 text-[10px] font-semibold text-rose-600">{errors.width ?? errors.height}</div>
                )}
              </div>
            )}

            {activePanel === "material" && !isPosterProduct && (
              <div>
                {isCanvasProduct || isNoCurlProduct || isMeshProduct || isHdpeProduct ? (
                  <div className="flex h-8 items-center rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-700">
                    {isCanvasProduct ? "Canvas" : isNoCurlProduct ? "No-Curl Banner" : isMeshProduct ? "Mesh Banner" : "HDPE"}
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(["13oz Vinyl", "15oz Vinyl", "18oz Vinyl"] as const).map((option) => (
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
                <div className="grid gap-2 sm:grid-cols-2">
                  <SegButton active={!form.doubleSided} onClick={() => set("doubleSided", false)}>Single-Sided</SegButton>
                  <SegButton active={form.doubleSided} onClick={() => set("doubleSided", true)} disabled={isMeshMaterial}>Double-Sided</SegButton>
                </div>
              </div>
            )}

            {activePanel === "finish" && !(isCanvasProduct || isHdpeProduct || isPosterProduct || isNoCurlProduct || isEconomicalStandProduct) && (
              <div className="space-y-3">
                {isMeshProduct ? (
                  <div className="space-y-2">
                    {/* Welding */}
                    <SubControlGroup title="Welding">
                      <div className="grid grid-cols-2 gap-1">
                        <SegButton active={!form.meshWelding} onClick={() => set("meshWelding", false)}>No</SegButton>
                        <SegButton active={form.meshWelding} onClick={() => set("meshWelding", true)}>Yes</SegButton>
                      </div>
                    </SubControlGroup>

                    {/* Grommets */}
                    <SubControlGroup title="Grommets">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={!form.grommets} onClick={() => { set("grommets", false); }}>No</SegButton>
                          <SegButton active={form.grommets} onClick={() => { set("grommets", true); set("meshRopeMode", "none"); }}>Yes</SegButton>
                        </div>
                        {form.grommets && (
                          <>
                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Placement</label>
                              <select
                                value={form.grommetPlacement}
                                onChange={(e) => set("grommetPlacement", e.target.value as GrommetPlacement)}
                                className="mt-1 w-full h-7 rounded border border-zinc-300 bg-white px-2 text-[11px] font-semibold text-zinc-700"
                              >
                                <option value="all-sides">All Sides</option>
                                <option value="top-left-right">Top/Left/Right</option>
                                <option value="top-left-bottom">Top/Left/Bottom</option>
                                <option value="top-right-bottom">Top/Right/Bottom</option>
                                <option value="left-right-bottom">Left/Right/Bottom</option>
                                <option value="top-left">Top &amp; Left</option>
                                <option value="top-right">Top &amp; Right</option>
                                <option value="top-bottom">Top &amp; Bottom</option>
                                <option value="left-right">Left &amp; Right</option>
                                <option value="left-bottom">Left &amp; Bottom</option>
                                <option value="right-bottom">Right &amp; Bottom</option>
                                <option value="top-only">Top Only</option>
                                <option value="left-only">Left Only</option>
                                <option value="right-only">Right Only</option>
                                <option value="bottom-only">Bottom Only</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Spacing</label>
                              <select
                                value={form.meshGrommetSpacing}
                                onChange={(e) => set("meshGrommetSpacing", e.target.value as MeshGrommetSpacing)}
                                className="mt-1 w-full h-7 rounded border border-zinc-300 bg-white px-2 text-[11px] font-semibold text-zinc-700"
                              >
                                <option value="every-2-3-feet">Every 2-3 Feet</option>
                                <option value="every-1-2-feet">Every 1-2 Feet</option>
                                <option value="every-6-12-inches">Every 6-12 Inches</option>
                                <option value="corners-only">Corners Only</option>
                                <option value="custom-inches">Custom Inches</option>
                              </select>
                              {form.meshGrommetSpacing === "custom-inches" && (
                                <input
                                  type="number"
                                  min={1}
                                  max={240}
                                  value={form.meshGrommetSpacingCustom}
                                  onChange={(e) => set("meshGrommetSpacingCustom", e.target.value)}
                                  placeholder="Spacing in inches"
                                  className="mt-1 w-full h-7 rounded border border-zinc-300 px-2 text-[11px] text-zinc-700"
                                />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </SubControlGroup>

                    {/* Rope — only when Grommets = No */}
                    {!form.grommets && (
                      <SubControlGroup title="Rope">
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={form.meshRopeMode === "none"} onClick={() => set("meshRopeMode", "none")}>None</SegButton>
                          <SegButton active={form.meshRopeMode === "top-only"} onClick={() => set("meshRopeMode", "top-only")}>Top Only</SegButton>
                          <SegButton active={form.meshRopeMode === "bottom-only"} onClick={() => set("meshRopeMode", "bottom-only")}>Bottom Only</SegButton>
                          <SegButton active={form.meshRopeMode === "top-bottom"} onClick={() => set("meshRopeMode", "top-bottom")}>Top &amp; Bottom</SegButton>
                        </div>
                      </SubControlGroup>
                    )}

                    {/* Pole Pockets */}
                    <SubControlGroup title="Pole Pockets">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          <SegButton active={form.meshPolePocketMode === "none"} onClick={() => set("meshPolePocketMode", "none")}>None</SegButton>
                          <SegButton active={form.meshPolePocketMode === "top-only"} onClick={() => set("meshPolePocketMode", "top-only")}>Top Only</SegButton>
                          <SegButton active={form.meshPolePocketMode === "bottom-only"} onClick={() => set("meshPolePocketMode", "bottom-only")}>Bottom Only</SegButton>
                          <SegButton active={form.meshPolePocketMode === "left-only"} onClick={() => set("meshPolePocketMode", "left-only")}>Left Only</SegButton>
                          <SegButton active={form.meshPolePocketMode === "right-only"} onClick={() => set("meshPolePocketMode", "right-only")}>Right Only</SegButton>
                          <SegButton active={form.meshPolePocketMode === "top-bottom"} onClick={() => set("meshPolePocketMode", "top-bottom")}>Top &amp; Bottom</SegButton>
                          <SegButton active={form.meshPolePocketMode === "left-right"} onClick={() => set("meshPolePocketMode", "left-right")}>Left &amp; Right</SegButton>
                        </div>
                        {form.meshPolePocketMode !== "none" && (
                          <div>
                            <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Pocket Size</label>
                            <div className="mt-1 grid grid-cols-4 gap-1">
                              {([1, 2, 3, 4] as const).map((size) => (
                                <SegButton key={size} active={form.meshPolePocketSize === size} onClick={() => set("meshPolePocketSize", size)}>{size}&quot;</SegButton>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </SubControlGroup>
                  </div>
                ) : (
                  <div className="grid gap-1.5 md:grid-cols-2">
                    <SubControlGroup title="Hemming">
                      <div className="grid grid-cols-2 gap-1">
                        <SegButton active={!form.hemming} onClick={() => set("hemming", false)}>No</SegButton>
                        <SegButton active={form.hemming} onClick={() => set("hemming", true)}>Yes</SegButton>
                      </div>
                    </SubControlGroup>
                    <SubControlGroup title="Grommets">
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Placement</label>
                          <select
                            value={form.grommetPlacement}
                            onChange={(e) => set("grommetPlacement", e.target.value as GrommetPlacement)}
                            disabled={!form.grommets}
                            className="mt-1 w-full h-7 rounded border border-zinc-300 bg-white px-2 text-[11px] font-semibold text-zinc-700 disabled:bg-zinc-100 disabled:text-zinc-400"
                          >
                            <option value="all-sides">All Sides</option>
                            <option value="top-left-right">Top, Left & Right</option>
                            <option value="top-left-bottom">Top, Left & Bottom</option>
                            <option value="top-right-bottom">Top, Right & Bottom</option>
                            <option value="left-right-bottom">Left, Right & Bottom</option>
                            <option value="top-left">Top & Left</option>
                            <option value="top-right">Top & Right</option>
                            <option value="top-bottom">Top & Bottom</option>
                            <option value="left-right">Left & Right</option>
                            <option value="left-bottom">Left & Bottom</option>
                            <option value="right-bottom">Right & Bottom</option>
                            <option value="top-only">Top Only</option>
                            <option value="bottom-only">Bottom Only</option>
                            <option value="left-only">Left Only</option>
                            <option value="right-only">Right Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Spacing (inches)</label>
                          <select
                            value={form.grommetSpacingIn}
                            onChange={(e) => set("grommetSpacingIn", parseInt(e.target.value, 10))}
                            disabled={!form.grommets}
                            className="mt-1 w-full h-7 rounded border border-zinc-300 bg-white px-2 text-[11px] font-semibold text-zinc-700 disabled:bg-zinc-100 disabled:text-zinc-400"
                          >
                            {[6, 8, 10, 12, 15, 18, 20, 24].map((spacing) => (
                              <option key={spacing} value={spacing}>{spacing}&quot;</option>
                            ))}
                          </select>
                        </div>
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
                <div className="grid gap-2 md:grid-cols-[110px_1fr]">
                  <input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="h-8 rounded border border-zinc-300 px-3 text-sm" />
                  <div className="flex h-8 items-center rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-600">
                    {effectiveQtyNum} billable unit{effectiveQtyNum !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </>
      )}
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
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
    <div className="rounded border border-zinc-200 bg-white p-1.5">
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{title}</div>
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
      className={`h-7 rounded border text-[10px] font-semibold transition ${
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
