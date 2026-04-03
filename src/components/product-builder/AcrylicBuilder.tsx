"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  ACRYLIC_BASE_RATE,
  ACRYLIC_CORNER_OPTIONS,
  ACRYLIC_MAX_HEIGHT,
  ACRYLIC_MAX_WIDTH,
  ACRYLIC_MOUNTING_OPTIONS,
  ACRYLIC_THICKNESS_OPTIONS,
  calculateAcrylicPricing,
  type AcrylicMounting,
  type AcrylicRoundedCorner,
  type AcrylicThickness,
} from "@/lib/pricing/acrylic";

interface AcrylicBuilderProps {
  productId?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatInches(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "--";
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted}\"`;
}

function formatCharge(value: number): string {
  return value === 0 ? formatCurrency(0) : `+${formatCurrency(value)}`;
}

function getCornerRadius(value: AcrylicRoundedCorner): number {
  switch (value) {
    case "1/4":
      return 16;
    case "1/2":
      return 24;
    case "3/4":
      return 32;
    case "1":
      return 40;
    default:
      return 10;
  }
}

function getProductionMessage({
  rush,
  contourCut,
  mounting,
  quantity,
}: {
  rush: boolean;
  contourCut: boolean;
  mounting: AcrylicMounting;
  quantity: number;
}): string {
  if (rush) {
    return "Estimated production time: rush handling requested. Final scheduling is confirmed after order review.";
  }

  if (contourCut || mounting !== "none") {
    return "Estimated production time: specialty finishing and hardware may add handling time to standard configurations.";
  }

  if (quantity >= 10) {
    return "Estimated production time: larger runs may require additional production handling before shipment.";
  }

  return "Estimated production time: fast production on standard configurations.";
}

function SurfaceCard({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${className}`}
    >
      {(title || eyebrow) && (
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          {eyebrow && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">{eyebrow}</div>
          )}
          {title && <h2 className="mt-1 text-lg font-semibold text-zinc-900">{title}</h2>}
        </div>
      )}
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

function TrustPill({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur">
      {label}
    </div>
  );
}

function OptionButton({
  selected,
  title,
  description,
  price,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  price?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition ${
        selected
          ? "border-orange-300 bg-orange-50 shadow-[0_10px_24px_rgba(249,115,22,0.12)]"
          : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-sm font-semibold ${selected ? "text-orange-700" : "text-zinc-800"}`}>{title}</div>
          {description && <div className="mt-1 text-xs leading-5 text-zinc-500">{description}</div>}
        </div>
        {price && <div className="text-xs font-semibold text-zinc-500">{price}</div>}
      </div>
    </button>
  );
}

function ToggleRow({
  label,
  helper,
  checked,
  suffix,
  onChange,
}: {
  label: string;
  helper: string;
  checked: boolean;
  suffix?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-zinc-800">
          {label}
          {suffix && <span className="ml-2 text-xs font-medium text-zinc-400">{suffix}</span>}
        </div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">{helper}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-orange-500" : "bg-zinc-300"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  muted = false,
  emphasized = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className={`text-sm ${muted ? "text-zinc-400" : emphasized ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>
        {label}
      </span>
      <span
        className={`text-sm tabular-nums ${
          muted ? "text-zinc-400" : emphasized ? "font-semibold text-zinc-900" : "text-zinc-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-zinc-800">{value}</div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-zinc-800">{value}</div>
    </div>
  );
}

function AcrylicPreview({
  width,
  height,
  isValid,
  mounting,
  roundedCorners,
  contourCut,
  thickness,
}: {
  width: number;
  height: number;
  isValid: boolean;
  mounting: AcrylicMounting;
  roundedCorners: AcrylicRoundedCorner;
  contourCut: boolean;
  thickness: AcrylicThickness;
}) {
  const maxWidth = 640;
  const maxHeight = 360;
  const scale = isValid ? Math.min(maxWidth / width, maxHeight / height) : 0;
  const previewWidth = isValid ? Math.max(140, width * scale) : 280;
  const previewHeight = isValid ? Math.max(110, height * scale) : 200;
  const boardRadius = getCornerRadius(roundedCorners);
  const showStandoffs = mounting !== "none";
  const standoffTone = mounting === "black-standoff" ? "bg-zinc-800 ring-zinc-600" : "bg-zinc-200 ring-zinc-300";

  return (
    <div className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Live Preview</div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">Scaled acrylic mockup</div>
          <div className="mt-1 text-sm text-zinc-500">Rounded corners and hardware colors update as you configure the sign.</div>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {showStandoffs ? "Standoff hardware visible" : "Face-mounted acrylic preview"}
        </div>
      </div>

      <div className="relative overflow-hidden bg-[linear-gradient(rgba(212,217,224,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(212,217,224,0.45)_1px,transparent_1px)] bg-[size:22px_22px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_42%)]" />
        <div className="relative mx-auto flex min-h-[430px] items-center justify-center sm:min-h-[520px]">
          {isValid ? (
            <>
              <div
                className="relative border border-dashed border-zinc-400/70"
                style={{ width: previewWidth, height: previewHeight, borderRadius: boardRadius + 4 }}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold tracking-[0.16em] text-zinc-500">
                  {formatInches(width)}
                </div>
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold tracking-[0.16em] text-zinc-500">
                  {formatInches(height)}
                </div>
              </div>

              <div
                className="absolute overflow-hidden border border-white/80 bg-white/90 shadow-[0_40px_90px_rgba(15,23,42,0.18)]"
                style={{ width: previewWidth, height: previewHeight, borderRadius: boardRadius }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,251,0.82)_50%,rgba(255,255,255,0.72))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.95),transparent_30%),linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.45)_42%,transparent_58%)]" />
                <div className="absolute inset-x-[12%] top-[18%] h-px bg-zinc-200/80" />
                <div className="absolute inset-x-[12%] bottom-[18%] h-px bg-zinc-200/70" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400">Premium Acrylic</div>
                  <div className="mt-4 text-[clamp(1.2rem,2.5vw,2.3rem)] font-black tracking-[0.24em] text-zinc-700">SIGNCOUS</div>
                  <div className="mt-2 max-w-[72%] text-xs leading-6 text-zinc-500 sm:text-sm">
                    Crystal-clear wall signage with a polished face, dimensional depth, and refined hardware finish.
                  </div>
                </div>
                {showStandoffs && (
                  <>
                    {[
                      "left-[8%] top-[10%]",
                      "right-[8%] top-[10%]",
                      "left-[8%] bottom-[10%]",
                      "right-[8%] bottom-[10%]",
                    ].map((position) => (
                      <span
                        key={position}
                        className={`absolute h-5 w-5 rounded-full ring-4 shadow-md ${standoffTone} ${position}`}
                      />
                    ))}
                  </>
                )}
                {contourCut && (
                  <div className="absolute right-4 top-4 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                    Contour Cut
                  </div>
                )}
                <div className="absolute bottom-4 left-4 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Thickness {thickness}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-[260px] w-full max-w-[520px] flex-col items-center justify-center rounded-[30px] border border-dashed border-zinc-300 bg-white/75 px-8 text-center shadow-inner">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">Preview Ready</div>
              <div className="mt-3 text-xl font-semibold text-zinc-800">Enter your dimensions to generate a scaled acrylic mockup</div>
              <div className="mt-3 max-w-[32rem] text-sm leading-6 text-zinc-500">
                The preview will reflect your selected size, rounded corners, and silver or black standoff hardware.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
    (width <= 0 ? 'Width must be greater than 0".' : width > ACRYLIC_MAX_WIDTH ? `Maximum width is ${ACRYLIC_MAX_WIDTH}".` : null);
  const heightError =
    heightStr !== "" &&
    (height <= 0 ? 'Height must be greater than 0".' : height > ACRYLIC_MAX_HEIGHT ? `Maximum height is ${ACRYLIC_MAX_HEIGHT}".` : null);
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

  const thicknessOption = ACRYLIC_THICKNESS_OPTIONS.find((option) => option.value === thickness)!;
  const mountingOption = ACRYLIC_MOUNTING_OPTIONS.find((option) => option.value === mounting)!;
  const cornerOption = ACRYLIC_CORNER_OPTIONS.find((option) => option.value === roundedCorners)!;

  const minimumAdjustment = pricing ? Math.max(0, pricing.minAdjustedBase - pricing.rawBase) : 0;
  const productionMessage = getProductionMessage({
    rush,
    contourCut,
    mounting,
    quantity: Math.max(1, quantity),
  });

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
        custom_width: `${width}\"`,
        custom_height: `${height}\"`,
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

  return (
    <div className="bg-[radial-gradient(circle_at_top,#fff9f4_0%,#f7f8fb_38%,#eff2f6_100%)] text-zinc-900">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[36px] border border-white/70 bg-white/70 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 lg:p-8">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="transition hover:text-zinc-900">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop/rigid" className="transition hover:text-zinc-900">
              Rigid Signs
            </Link>
            <span>/</span>
            <span className="font-medium text-zinc-900">Acrylic Signs</span>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500">Premium Rigid Signage</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">Acrylic Signs</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600 sm:text-lg">
                Premium clear and rigid signage for offices, lobbies, branding, and wall-mounted displays.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  "Custom Sizes",
                  "Premium Rigid Material",
                  "Optional Standoff Hardware",
                  "Fast Turnaround",
                ].map((item) => (
                  <TrustPill key={item} label={item} />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(145deg,#f5fff6_0%,#effbf2_100%)] p-5 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Live Quote</div>
              <div className="mt-3 text-4xl font-semibold text-zinc-950">
                {pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {pricing
                  ? `${pricing.quantity} item${pricing.quantity === 1 ? "" : "s"} · ${pricing.area.toFixed(0)} sq in each`
                  : "Configure your sign to see live pricing."}
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm leading-6 text-zinc-600">
                {productionMessage}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_390px] xl:items-start">
          <div className="space-y-6">
            <AcrylicPreview
              width={width}
              height={height}
              isValid={isValid}
              mounting={mounting}
              roundedCorners={roundedCorners}
              contourCut={contourCut}
              thickness={thickness}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <QuickStat label="Size" value={isValid ? `${formatInches(width)} × ${formatInches(height)}` : "Set dimensions"} />
              <QuickStat label="Standoffs" value={mountingOption.label} />
              <QuickStat label="Rounded Corners" value={cornerOption.label} />
              <QuickStat label="Quantity" value={`${Math.max(1, quantity)} piece${Math.max(1, quantity) === 1 ? "" : "s"}`} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SurfaceCard eyebrow="Why Choose Acrylic Signs" title="Premium presentation with dimensional depth">
                <div className="space-y-4 text-sm leading-7 text-zinc-600">
                  <p>
                    Acrylic signs deliver a crystal-clear, rigid presentation that feels elevated in professional interiors. They are ideal when you want branding to look architectural instead of temporary.
                  </p>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    <li className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">Crystal-clear premium look</li>
                    <li className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">Ideal for branding, office, and lobby signage</li>
                    <li className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">Clean modern presentation</li>
                    <li className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">Optional standoff hardware for a floating effect</li>
                  </ul>
                </div>
              </SurfaceCard>

              <SurfaceCard eyebrow="Popular Uses" title="Designed for polished interior branding">
                <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
                  {[
                    "Lobby signs",
                    "Office signs",
                    "Reception displays",
                    "Interior branding",
                    "Directional signage",
                    "Wall-mounted business signage",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 font-medium text-zinc-700">
                      {item}
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <SurfaceCard eyebrow="Product Features" title="Built for custom rigid sign programs">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    `Custom sizes up to ${ACRYLIC_MAX_WIDTH}\" × ${ACRYLIC_MAX_HEIGHT}\"`,
                    "Multiple thickness options",
                    "Optional rounded corners",
                    "Optional contour cut",
                    "Optional silver or black standoff hardware",
                    "Premium polished finish",
                  ].map((feature) => (
                    <div key={feature} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm">
                      {feature}
                    </div>
                  ))}
                </div>
              </SurfaceCard>

              <SurfaceCard eyebrow="Installation / Mounting" title="Raised wall-mounted finish">
                <div className="space-y-4 text-sm leading-7 text-zinc-600">
                  <p>
                    Standoff hardware creates a premium wall-mounted appearance by lifting the acrylic slightly off the surface. The result is a clean floating look that works especially well in reception areas, conference rooms, and branded office environments.
                  </p>
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900">
                    Silver and black hardware options are both reflected in the live preview so customers can compare the overall finish before adding to cart.
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-6">
            <SurfaceCard eyebrow="Configurator" title="Build your acrylic sign">
              <div className="space-y-6">
                <div>
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Size</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Width</span>
                      <input
                        type="number"
                        min={0.1}
                        max={ACRYLIC_MAX_WIDTH}
                        step={0.5}
                        value={widthStr}
                        onChange={(event) => setWidthStr(event.target.value)}
                        className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-zinc-900 outline-none transition ${
                          widthError ? "border-red-300 focus:border-red-400" : "border-zinc-200 focus:border-orange-300"
                        }`}
                      />
                      <div className={`mt-2 text-xs ${widthError ? "text-red-600" : "text-zinc-500"}`}>
                        {widthError ?? `Up to ${ACRYLIC_MAX_WIDTH}\" wide`}
                      </div>
                    </label>

                    <label className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Height</span>
                      <input
                        type="number"
                        min={0.1}
                        max={ACRYLIC_MAX_HEIGHT}
                        step={0.5}
                        value={heightStr}
                        onChange={(event) => setHeightStr(event.target.value)}
                        className={`mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-zinc-900 outline-none transition ${
                          heightError ? "border-red-300 focus:border-red-400" : "border-zinc-200 focus:border-orange-300"
                        }`}
                      />
                      <div className={`mt-2 text-xs ${heightError ? "text-red-600" : "text-zinc-500"}`}>
                        {heightError ?? `Up to ${ACRYLIC_MAX_HEIGHT}\" high`}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Thickness</div>
                  <div className="grid gap-3">
                    {ACRYLIC_THICKNESS_OPTIONS.map((option) => (
                      <OptionButton
                        key={option.value}
                        selected={thickness === option.value}
                        title={option.label}
                        description={
                          option.modifier > 0
                            ? `Adds ${Math.round(option.modifier * 100)}% to the base acrylic rate.`
                            : "Standard acrylic profile for clean, crisp signage."
                        }
                        price={option.modifier > 0 ? `+${Math.round(option.modifier * 100)}%` : "Standard"}
                        onClick={() => setThickness(option.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Standoffs</div>
                  <div className="grid gap-3">
                    {ACRYLIC_MOUNTING_OPTIONS.map((option) => (
                      <OptionButton
                        key={option.value}
                        selected={mounting === option.value}
                        title={option.label}
                        description={option.note ?? "Direct face presentation without stand-off hardware."}
                        price={option.price > 0 ? formatCharge(option.price) : "Included"}
                        onClick={() => setMounting(option.value)}
                      />
                    ))}
                  </div>
                  <div className="mt-3 text-xs leading-5 text-zinc-500">Creates a premium floating wall-mounted look.</div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Rounded Corners</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ACRYLIC_CORNER_OPTIONS.map((option) => (
                      <OptionButton
                        key={option.value}
                        selected={roundedCorners === option.value}
                        title={option.label}
                        description={option.price > 0 ? `Adds ${formatCurrency(option.price)} per item.` : "Sharp square corners."}
                        price={option.price > 0 ? formatCharge(option.price) : "Included"}
                        onClick={() => setRoundedCorners(option.value)}
                      />
                    ))}
                  </div>
                  <div className="mt-3 text-xs leading-5 text-zinc-500">Choose a radius for softer, finished edges.</div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Quantity & Finishing</div>
                  <div className="space-y-3">
                    <label className="block rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Quantity</span>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
                        className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 outline-none transition focus:border-orange-300"
                      />
                    </label>
                    <ToggleRow
                      label="Contour Cut"
                      helper="Use this for shaped acrylic signage that follows custom artwork outlines."
                      suffix="+20%"
                      checked={contourCut}
                      onChange={setContourCut}
                    />
                    <ToggleRow
                      label="Rush Production"
                      helper="Prioritize the order in production. Final timing is still confirmed after review."
                      suffix="+25%"
                      checked={rush}
                      onChange={setRush}
                    />
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard eyebrow="Live Summary" title="Your Configuration">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryItem label="Size" value={isValid ? `${formatInches(width)} × ${formatInches(height)}` : "Set dimensions"} />
                <SummaryItem label="Thickness" value={thicknessOption.label} />
                <SummaryItem label="Mounting" value={mountingOption.label} />
                <SummaryItem label="Rounded Corners" value={cornerOption.label} />
                <SummaryItem label="Contour Cut" value={contourCut ? "Enabled" : "None"} />
                <SummaryItem label="Rush" value={rush ? "Requested" : "Standard"} />
                <SummaryItem label="Quantity" value={`${Math.max(1, quantity)}`} />
              </div>
            </SurfaceCard>

            <SurfaceCard eyebrow="Pricing" title="Transparent price breakdown">
              <div className="space-y-2">
                <BreakdownRow label="Width × Height" value={isValid ? `${formatInches(width)} × ${formatInches(height)}` : "--"} muted={!isValid} />
                <BreakdownRow label="Area" value={pricing ? `${pricing.area.toFixed(1)} sq in` : "--"} muted={!pricing} />
                <BreakdownRow label={`Base price (${formatCurrency(ACRYLIC_BASE_RATE)}/sq in)`} value={pricing ? formatCurrency(pricing.rawBase) : formatCurrency(0)} muted={!pricing} />
                <BreakdownRow label="Minimum price adjustment" value={pricing ? formatCharge(minimumAdjustment) : formatCurrency(0)} muted={!pricing || minimumAdjustment === 0} />
                <BreakdownRow label={`Thickness modifier (${thicknessOption.label})`} value={pricing ? formatCharge(pricing.thicknessCharge) : formatCurrency(0)} muted={!pricing || pricing.thicknessCharge === 0} />
                <BreakdownRow label="Contour cut charge" value={pricing ? formatCharge(pricing.contourCutCharge) : formatCurrency(0)} muted={!pricing || pricing.contourCutCharge === 0} />
                <BreakdownRow label="Rounded corners charge" value={pricing ? formatCharge(pricing.roundedCornersCharge) : formatCurrency(0)} muted={!pricing || pricing.roundedCornersCharge === 0} />
                <BreakdownRow label="Standoff charge" value={pricing ? formatCharge(pricing.standoffCharge) : formatCurrency(0)} muted={!pricing || pricing.standoffCharge === 0} />
                <BreakdownRow label="Rush charge" value={pricing ? formatCharge(pricing.rushCharge) : formatCurrency(0)} muted={!pricing || pricing.rushCharge === 0} />
                <div className="my-3 border-t border-zinc-100" />
                <BreakdownRow label="Per-item total" value={pricing ? formatCurrency(pricing.perItemTotal) : formatCurrency(0)} emphasized />
                <BreakdownRow label="Quantity" value={String(pricing?.quantity ?? Math.max(1, quantity))} emphasized />
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-orange-800">Grand total</span>
                    <span className="text-xl font-semibold text-orange-600">
                      {pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
                <div className="pt-1 text-xs leading-5 text-zinc-500">Final pricing updates instantly as you configure your sign.</div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm leading-6 text-zinc-600">
                {productionMessage}
              </div>

              <Button
                type="button"
                size="lg"
                className="mt-5 w-full rounded-2xl"
                disabled={!isValid}
                onClick={addToCart}
              >
                {!isValid ? "Set dimensions to continue" : added ? "Added to cart" : "Add to cart"}
              </Button>
            </SurfaceCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
