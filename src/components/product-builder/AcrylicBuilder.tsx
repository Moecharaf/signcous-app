"use client";

import { useMemo, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  ACRYLIC_CORNER_OPTIONS,
  ACRYLIC_MAX_HEIGHT,
  ACRYLIC_MAX_WIDTH,
  ACRYLIC_MINIMUM_PRICE,
  ACRYLIC_MOUNTING_OPTIONS,
  ACRYLIC_THICKNESS_OPTIONS,
  calculateAcrylicPricing,
  type AcrylicMounting,
  type AcrylicRoundedCorner,
  type AcrylicThickness,
} from "@/lib/pricing/acrylic";

// ─── Helpers ──────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={`text-xs ${strong ? "font-semibold text-zinc-800" : "text-zinc-500"}`}>
        {label}
      </span>
      <span
        className={`text-xs tabular-nums ${
          strong ? (accent ? "font-bold text-orange-500" : "font-semibold text-zinc-800") : "text-zinc-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Sign preview ──────────────────────────────────────────────

function SignPreview({
  width,
  height,
  isValid,
}: {
  width: number;
  height: number;
  isValid: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const CANVAS_W = 560;
  const CANVAS_H = 380;
  const PAD = 60;

  const scale =
    isValid && width > 0 && height > 0
      ? Math.min((CANVAS_W - PAD * 2) / width, (CANVAS_H - PAD * 2) / height)
      : 0;

  const previewW = width * scale;
  const previewH = height * scale;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(200,210,220,0.25) 1px,transparent 1px),linear-gradient(90deg,rgba(200,210,220,0.25) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundColor: "#f7f8f9",
      }}
    >
      {isValid && scale > 0 ? (
        <>
          {/* Sign body */}
          <div
            className="relative rounded-sm border-2 border-dashed border-blue-500 bg-white/90 shadow-lg"
            style={{ width: previewW, height: previewH }}
          >
            {/* Corner dots */}
            {[
              "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
              "top-0 right-0 translate-x-1/2 -translate-y-1/2",
              "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
              "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
            ].map((cls) => (
              <span
                key={cls}
                className={`absolute h-2.5 w-2.5 rounded-full border-2 border-blue-500 bg-white ${cls}`}
              />
            ))}

            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {width}" × {height}"
              </span>
            </div>
          </div>

          {/* Width dimension */}
          <div
            className="pointer-events-none absolute flex items-center justify-center text-[10px] font-semibold text-zinc-400"
            style={{
              left: "50%",
              transform: "translateX(-50%)",
              top: `calc(50% - ${previewH / 2}px - 22px)`,
              width: previewW,
            }}
          >
            <span className="mr-1 flex-1 border-t border-dashed border-zinc-300" />
            {width}"
            <span className="ml-1 flex-1 border-t border-dashed border-zinc-300" />
          </div>

          {/* Height dimension */}
          <div
            className="pointer-events-none absolute flex flex-col items-center justify-center text-[10px] font-semibold text-zinc-400"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              left: `calc(50% + ${previewW / 2}px + 10px)`,
              height: previewH,
            }}
          >
            <span className="mb-1 flex-1 border-l border-dashed border-zinc-300" />
            <span className="-rotate-90 whitespace-nowrap">{height}"</span>
            <span className="mt-1 flex-1 border-l border-dashed border-zinc-300" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <svg
            className="h-10 w-10 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
            <path d="M3 9h18M9 3v18" strokeDasharray="3 2" />
          </svg>
          <p className="text-sm font-medium">PLEASE SPECIFY DIMENSIONS</p>
        </div>
      )}
    </div>
  );
}

// ─── Bottom bar control ────────────────────────────────────────

function BarControl({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col border-r border-zinc-300 last:border-r-0">
      <div className="border-b border-zinc-300 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="flex items-center px-3 py-2">{children}</div>
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────────────

function Toggle({
  label,
  suffix,
  checked,
  onChange,
}: {
  label: string;
  suffix?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-xs text-zinc-600">
        {label}
        {suffix && <span className="ml-1 text-zinc-400">{suffix}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-orange-500" : "bg-zinc-300"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

// ─── Main component ────────────────────────────────────────────

interface AcrylicBuilderProps {
  productId?: number;
}

export default function AcrylicBuilder({ productId = 0 }: AcrylicBuilderProps) {
  const cart = useCart();

  const [widthStr, setWidthStr] = useState("24");
  const [heightStr, setHeightStr] = useState("18");
  const [quantity, setQuantity] = useState(1);
  const [thickness, setThickness] = useState<AcrylicThickness>("1/8");
  const [mounting, setMounting] = useState<AcrylicMounting>("none");
  const [roundedCorners, setRoundedCorners] = useState<AcrylicRoundedCorner>("none");
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);
  const [added, setAdded] = useState(false);

  const width = parseFloat(widthStr) || 0;
  const height = parseFloat(heightStr) || 0;

  const widthError =
    widthStr !== "" &&
    (width <= 0 ? 'Width must be > 0"' : width > ACRYLIC_MAX_WIDTH ? `Max ${ACRYLIC_MAX_WIDTH}"` : null);
  const heightError =
    heightStr !== "" &&
    (height <= 0 ? 'Height must be > 0"' : height > ACRYLIC_MAX_HEIGHT ? `Max ${ACRYLIC_MAX_HEIGHT}"` : null);
  const isValid = !widthError && !heightError && width > 0 && height > 0;

  const pricing = useMemo(
    () =>
      isValid
        ? calculateAcrylicPricing({
            width,
            height,
            quantity: Math.max(1, quantity),
            thickness,
            mounting,
            roundedCorners,
            contourCut,
            rush,
          })
        : null,
    [width, height, quantity, thickness, mounting, roundedCorners, contourCut, rush, isValid]
  );

  const thicknessOption = ACRYLIC_THICKNESS_OPTIONS.find((t) => t.value === thickness)!;
  const mountingOption = ACRYLIC_MOUNTING_OPTIONS.find((m) => m.value === mounting)!;
  const cornerOption = ACRYLIC_CORNER_OPTIONS.find((c) => c.value === roundedCorners)!;

  function addToCart() {
    if (!isValid || !pricing) return;
    cart.addItem({
      productId,
      productName: "Acrylic Signs",
      width,
      height,
      unit: "inches",
      quantity: Math.max(1, quantity),
      material: `Acrylic ${thicknessOption.label}`,
      doubleSided: false,
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl: null,
      customOptions: {
        custom_width: `${width}"`,
        custom_height: `${height}"`,
        custom_thickness: thicknessOption.label,
        custom_mounting: mountingOption.label,
        custom_rounded_corners: cornerOption.label,
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_rush: rush ? "Yes" : "No",
        custom_area_sqin: String(pricing.area),
      },
      unitPrice: pricing.perItemTotal,
      totalPrice: pricing.grandTotal,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-96px)] flex-col bg-[#f5f6f8] text-zinc-800">

      {/* Top header bar */}
      <div className="flex items-center justify-between border-b border-zinc-300 bg-white px-5 py-3 shadow-sm">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Rigid Product</div>
          <h1 className="text-xl font-black uppercase tracking-[0.05em] text-zinc-900">Acrylic Signs</h1>
          <p className="text-[11px] text-zinc-500">
            Acrylic {thicknessOption.label}
            {isValid ? ` · ${width}" × ${height}"` : " · please set dimensions"}
          </p>
        </div>

        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Pricing &amp; Info</div>
          <div className="text-[11px] text-zinc-500">
            Single-Sided · <span className="font-semibold">$0.16 / sq in</span>
          </div>
          {isValid && pricing ? (
            <>
              <div className="text-2xl font-black text-orange-500">{fmt(pricing.grandTotal)}</div>
              <div className="text-[10px] text-zinc-400">
                {pricing.area.toFixed(0)} sq in · qty {pricing.quantity} · 24h production
              </div>
            </>
          ) : (
            <div className="text-2xl font-black text-zinc-300">$0.00</div>
          )}
        </div>
      </div>

      {/* Main: canvas + right panel */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="relative flex flex-1 flex-col">
          <div className="flex-1">
            <SignPreview width={width} height={height} isValid={isValid} />
          </div>

          {(widthError || heightError) && (
            <div className="absolute right-3 top-3 rounded border border-red-300 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 shadow">
              {widthError || heightError}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-300 bg-white p-4">

          {/* Options */}
          <div>
            <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Options</div>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Thickness
                </label>
                <select
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value as AcrylicThickness)}
                  className="h-9 w-full rounded border border-zinc-300 bg-zinc-50 px-2 text-xs text-zinc-800 focus:border-zinc-500 focus:outline-none"
                >
                  {ACRYLIC_THICKNESS_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}{t.modifier > 0 ? ` (+${Math.round(t.modifier * 100)}%)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  className="h-9 w-full rounded border border-zinc-300 bg-zinc-50 px-2 text-xs text-zinc-800 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <Toggle label="Contour Cut" suffix="(+20%)" checked={contourCut} onChange={setContourCut} />
              <Toggle label="Rush Production" suffix="(+25%)" checked={rush} onChange={setRush} />
            </div>
          </div>

          <div className="border-t border-zinc-100" />

          {/* Pricing breakdown */}
          {isValid && pricing ? (
            <div>
              <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Pricing Breakdown
              </div>
              <div className="space-y-0.5">
                <Row label="Area"         value={`${pricing.area.toFixed(1)} sq in`} />
                <Row label="Base Price"   value={fmt(pricing.rawBase)} />
                {pricing.rawBase < ACRYLIC_MINIMUM_PRICE && (
                  <Row label="Min. Applied" value={fmt(pricing.minAdjustedBase)} />
                )}
                {pricing.thicknessCharge > 0 && (
                  <Row label={`Thickness (${thicknessOption.label})`} value={`+${fmt(pricing.thicknessCharge)}`} />
                )}
                {pricing.contourCutCharge > 0 && (
                  <Row label="Contour Cut" value={`+${fmt(pricing.contourCutCharge)}`} />
                )}
                {pricing.roundedCornersCharge > 0 && (
                  <Row label={`Corners (${cornerOption.label})`} value={`+${fmt(pricing.roundedCornersCharge)}`} />
                )}
                {pricing.standoffCharge > 0 && (
                  <Row label="Standoffs"   value={`+${fmt(pricing.standoffCharge)}`} />
                )}
                {pricing.rushCharge > 0 && (
                  <Row label="Rush (+25%)" value={`+${fmt(pricing.rushCharge)}`} />
                )}
                <div className="my-1 border-t border-zinc-100" />
                <Row label="Per-Item"       value={fmt(pricing.perItemTotal)} strong />
                <Row label={`Total (×${pricing.quantity})`} value={fmt(pricing.grandTotal)} strong accent />
              </div>
            </div>
          ) : (
            <div className="rounded border border-dashed border-zinc-200 p-3 text-center text-[11px] text-zinc-400">
              Enter dimensions to see pricing
            </div>
          )}

          {/* Add to Cart */}
          <button
            type="button"
            disabled={!isValid}
            onClick={addToCart}
            className={`mt-auto w-full rounded py-3 text-xs font-bold uppercase tracking-[0.16em] transition ${
              !isValid
                ? "cursor-not-allowed bg-zinc-200 text-zinc-400"
                : added
                ? "bg-emerald-500 text-white"
                : "bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-600"
            }`}
          >
            {!isValid ? "Set Dimensions" : added ? "Added ✓" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Bottom control bar --- Signs365 style */}
      <div className="flex h-14 shrink-0 items-stretch border-t border-zinc-300 bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">

        {/* Size */}
        <BarControl label="Size (inches)">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0.1}
              max={ACRYLIC_MAX_WIDTH}
              step={0.5}
              value={widthStr}
              onChange={(e) => setWidthStr(e.target.value)}
              placeholder="W"
              className={`h-8 w-16 rounded border px-2 text-center text-sm font-semibold focus:outline-none ${
                widthError ? "border-red-400 bg-red-50 text-red-600" : "border-zinc-300 bg-zinc-50"
              }`}
            />
            <span className="text-zinc-400">×</span>
            <input
              type="number"
              min={0.1}
              max={ACRYLIC_MAX_HEIGHT}
              step={0.5}
              value={heightStr}
              onChange={(e) => setHeightStr(e.target.value)}
              placeholder="H"
              className={`h-8 w-16 rounded border px-2 text-center text-sm font-semibold focus:outline-none ${
                heightError ? "border-red-400 bg-red-50 text-red-600" : "border-zinc-300 bg-zinc-50"
              }`}
            />
          </div>
        </BarControl>

        {/* Standoffs */}
        <BarControl label="Standoffs">
          <select
            value={mounting}
            onChange={(e) => setMounting(e.target.value as AcrylicMounting)}
            className="h-8 rounded border border-zinc-300 bg-zinc-50 px-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-700 focus:outline-none"
          >
            {ACRYLIC_MOUNTING_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </BarControl>

        {/* Rounded corners */}
        <BarControl label="Rounded Corners">
          <select
            value={roundedCorners}
            onChange={(e) => setRoundedCorners(e.target.value as AcrylicRoundedCorner)}
            className="h-8 rounded border border-zinc-300 bg-zinc-50 px-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-700 focus:outline-none"
          >
            {ACRYLIC_CORNER_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </BarControl>

        {/* Material */}
        <BarControl label="Material">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600">
            Acrylic · {thicknessOption.label}
          </span>
        </BarControl>

      </div>
    </div>
  );
}
