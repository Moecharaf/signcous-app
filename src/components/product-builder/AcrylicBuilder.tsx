"use client";

import { useMemo, useState } from "react";
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

function fmt(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function RowItem({
  label,
  value,
  strong,
  accent,
  faint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
  faint?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${faint ? "opacity-50" : ""}`}>
      <span className={`text-sm ${strong ? "font-semibold text-zinc-900" : "text-zinc-500"}`}>
        {label}
      </span>
      <span
        className={`text-sm tabular-nums ${
          strong
            ? accent
              ? "font-bold text-orange-600"
              : "font-semibold text-zinc-900"
            : "text-zinc-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function OptionSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  note,
}: {
  label: string;
  value: T;
  options: { label: string; value: T; note?: string; price?: number }[];
  onChange: (val: T) => void;
  note?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
            {opt.price ? ` (+${fmt(opt.price)})` : ""}
          </option>
        ))}
      </select>
      {note && <p className="mt-1 text-[10px] italic text-zinc-400">{note}</p>}
    </div>
  );
}

function ToggleCheckbox({
  label,
  checked,
  onChange,
  suffix,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  suffix?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-zinc-300 hover:bg-white">
      <span className="text-sm text-zinc-700">
        {label}
        {suffix && <span className="ml-1 text-xs text-zinc-400">{suffix}</span>}
      </span>
      <div
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-orange-500" : "bg-zinc-300"}`}
        onClick={() => onChange(!checked)}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") onChange(!checked);
        }}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}

// ─── Validation ──────────────────────────────────────────────

function validateDimensions(
  width: number,
  height: number
): { widthError: string | null; heightError: string | null } {
  return {
    widthError:
      width <= 0
        ? "Width must be greater than 0"
        : width > ACRYLIC_MAX_WIDTH
          ? `Max width is ${ACRYLIC_MAX_WIDTH}"`
          : null,
    heightError:
      height <= 0
        ? "Height must be greater than 0"
        : height > ACRYLIC_MAX_HEIGHT
          ? `Max height is ${ACRYLIC_MAX_HEIGHT}"`
          : null,
  };
}

// ─── Main builder ────────────────────────────────────────────

interface AcrylicBuilderProps {
  productId?: number;
}

export default function AcrylicBuilder({ productId = 0 }: AcrylicBuilderProps) {
  const cart = useCart();

  const [widthStr, setWidthStr]   = useState("24");
  const [heightStr, setHeightStr] = useState("18");
  const [quantity, setQuantity]   = useState(1);
  const [thickness, setThickness] = useState<AcrylicThickness>("1/8");
  const [mounting, setMounting]   = useState<AcrylicMounting>("none");
  const [roundedCorners, setRoundedCorners] = useState<AcrylicRoundedCorner>("none");
  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush]             = useState(false);
  const [added, setAdded]           = useState(false);

  const width  = parseFloat(widthStr)  || 0;
  const height = parseFloat(heightStr) || 0;

  const { widthError, heightError } = validateDimensions(width, height);
  const isValid = !widthError && !heightError && width > 0 && height > 0;

  const pricing = useMemo(() => {
    if (!isValid) return null;
    return calculateAcrylicPricing({
      width,
      height,
      quantity: Math.max(1, quantity),
      thickness,
      mounting,
      roundedCorners,
      contourCut,
      rush,
    });
  }, [width, height, quantity, thickness, mounting, roundedCorners, contourCut, rush, isValid]);

  const mountingOption = ACRYLIC_MOUNTING_OPTIONS.find((m) => m.value === mounting);
  const thicknessOption = ACRYLIC_THICKNESS_OPTIONS.find((t) => t.value === thickness);
  const cornerOption = ACRYLIC_CORNER_OPTIONS.find((c) => c.value === roundedCorners);

  function addToCart() {
    if (!isValid || !pricing) return;

    cart.addItem({
      productId,
      productName: "Acrylic Signs",
      width,
      height,
      unit: "inches",
      quantity: Math.max(1, quantity),
      material: `Acrylic ${thicknessOption?.label ?? thickness}`,
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
        custom_thickness: thicknessOption?.label ?? thickness,
        custom_mounting: mountingOption?.label ?? "None",
        custom_rounded_corners: cornerOption?.label ?? "None",
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

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="mx-auto max-w-[1420px] px-3 py-5 md:px-5 md:py-7">

        {/* ── Page intro ── */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Rigid Product
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            Acrylic Signs
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Premium clear and rigid signage for offices, lobbies, branding, and wall-mounted displays.
            Optionally add standoff hardware for a floating, high-end finish.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">

          {/* Left: configurator */}
          <div className="space-y-4">

            {/* Dimensions + Quantity */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Dimensions &amp; Quantity
              </div>
              <div className="grid gap-4 sm:grid-cols-3">

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Width (inches)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={ACRYLIC_MAX_WIDTH}
                    step={0.5}
                    value={widthStr}
                    onChange={(e) => setWidthStr(e.target.value)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm shadow-sm focus:outline-none ${
                      widthError
                        ? "border-red-400 bg-red-50 focus:border-red-500"
                        : "border-zinc-300 bg-white focus:border-zinc-500"
                    }`}
                  />
                  {widthError && (
                    <p className="mt-1 text-[10px] text-red-500">{widthError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Height (inches)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={ACRYLIC_MAX_HEIGHT}
                    step={0.5}
                    value={heightStr}
                    onChange={(e) => setHeightStr(e.target.value)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm shadow-sm focus:outline-none ${
                      heightError
                        ? "border-red-400 bg-red-50 focus:border-red-500"
                        : "border-zinc-300 bg-white focus:border-zinc-500"
                    }`}
                  />
                  {heightError && (
                    <p className="mt-1 text-[10px] text-red-500">{heightError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {isValid && (
                <p className="mt-3 text-[11px] text-zinc-400">
                  Area: <strong className="text-zinc-600">{(width * height).toFixed(1)} sq in</strong>
                  &nbsp;·&nbsp;
                  Base rate: <strong className="text-zinc-600">$0.16 / sq in</strong>
                  &nbsp;·&nbsp;
                  Minimum per item: <strong className="text-zinc-600">{fmt(ACRYLIC_MINIMUM_PRICE)}</strong>
                </p>
              )}
            </div>

            {/* Material options */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Material &amp; Options
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <OptionSelect
                  label="Thickness"
                  value={thickness}
                  options={ACRYLIC_THICKNESS_OPTIONS.map((t) => ({
                    label: t.label,
                    value: t.value,
                    note: t.modifier > 0 ? `+${Math.round(t.modifier * 100)}%` : undefined,
                  }))}
                  onChange={setThickness}
                />
                <OptionSelect
                  label="Rounded Corners"
                  value={roundedCorners}
                  options={ACRYLIC_CORNER_OPTIONS}
                  onChange={setRoundedCorners}
                />
                <OptionSelect
                  label="Mounting / Standoff"
                  value={mounting}
                  options={ACRYLIC_MOUNTING_OPTIONS}
                  onChange={setMounting}
                  note={
                    mounting !== "none"
                      ? "✦ Standoff hardware gives a floating premium wall-mount look"
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Add-ons */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Add-ons
              </div>
              <div className="space-y-2">
                <ToggleCheckbox
                  label="Contour Cut"
                  checked={contourCut}
                  onChange={setContourCut}
                  suffix="(+20% of adjusted base)"
                />
                <ToggleCheckbox
                  label="Rush Production"
                  checked={rush}
                  onChange={setRush}
                  suffix="(+25%)"
                />
              </div>
            </div>

            {/* Features */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Product Features
              </div>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  `Custom sizes up to ${ACRYLIC_MAX_WIDTH}" × ${ACRYLIC_MAX_HEIGHT}"`,
                  "Premium cast acrylic — rigid, clear, durable",
                  "Optional rounded corners for a polished finish",
                  "Optional silver or black standoff hardware for wall-mount displays",
                  "Great for office, lobby, retail, and wayfinding signage",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-orange-400">✦</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: summary + breakdown */}
          <aside className="space-y-4">

            {/* Live total */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Live Total
              </div>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">
                {isValid && pricing ? fmt(pricing.grandTotal) : "—"}
              </div>
              {isValid && pricing && (
                <div className="mt-1 text-xs text-zinc-400">
                  {quantity} sign{quantity !== 1 ? "s" : ""} · {fmt(pricing.perItemTotal)} each
                </div>
              )}
            </div>

            {/* Breakdown */}
            {isValid && pricing && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Pricing Breakdown
                </div>
                <div className="space-y-2">
                  <RowItem label="Area" value={`${pricing.area.toFixed(1)} sq in`} />
                  <RowItem label="Base Price" value={fmt(pricing.rawBase)} />
                  {pricing.rawBase < ACRYLIC_MINIMUM_PRICE && (
                    <RowItem label="Min. Price Applied" value={fmt(pricing.minAdjustedBase)} />
                  )}
                  {pricing.thicknessCharge > 0 && (
                    <RowItem
                      label={`Thickness (${thicknessOption?.label})`}
                      value={`+${fmt(pricing.thicknessCharge)}`}
                    />
                  )}
                  {pricing.contourCutCharge > 0 && (
                    <RowItem label="Contour Cut (+20%)" value={`+${fmt(pricing.contourCutCharge)}`} />
                  )}
                  {pricing.roundedCornersCharge > 0 && (
                    <RowItem
                      label={`Rounded Corners (${cornerOption?.label})`}
                      value={`+${fmt(pricing.roundedCornersCharge)}`}
                    />
                  )}
                  {pricing.standoffCharge > 0 && (
                    <RowItem
                      label={`Standoff Kit (${mountingOption?.label})`}
                      value={`+${fmt(pricing.standoffCharge)}`}
                    />
                  )}
                  {pricing.rushCharge > 0 && (
                    <RowItem label="Rush (+25%)" value={`+${fmt(pricing.rushCharge)}`} />
                  )}
                  <div className="my-1 border-t border-zinc-100" />
                  <RowItem label="Per-Item Total" value={fmt(pricing.perItemTotal)} strong />
                  <RowItem label="Quantity" value={`× ${pricing.quantity}`} />
                  <div className="my-1 border-t border-zinc-200" />
                  <RowItem label="Order Total" value={fmt(pricing.grandTotal)} strong accent />
                </div>
              </div>
            )}

            {/* Configuration summary */}
            {isValid && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Configuration
                </div>
                <div className="space-y-1.5 text-sm text-zinc-600">
                  {[
                    ["Size",            `${width}" × ${height}"`],
                    ["Quantity",        String(quantity)],
                    ["Thickness",       thicknessOption?.label ?? thickness],
                    ["Mounting",        mountingOption?.label ?? "None"],
                    ["Rounded Corners", cornerOption?.label ?? "None"],
                    ["Contour Cut",     contourCut ? "Yes" : "No"],
                    ["Rush Production", rush ? "Yes" : "No"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                      <span className="text-zinc-400">{label}</span>
                      <span className="font-medium text-zinc-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              type="button"
              disabled={!isValid}
              onClick={addToCart}
              className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.16em] transition ${
                !isValid
                  ? "cursor-not-allowed bg-zinc-200 text-zinc-400"
                  : added
                    ? "bg-emerald-500 text-white"
                    : "bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-600"
              }`}
            >
              {!isValid ? "Fix Dimensions to Continue" : added ? "Added to Cart ✓" : "Add to Cart"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
