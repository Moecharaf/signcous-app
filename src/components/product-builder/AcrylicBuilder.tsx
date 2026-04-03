"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
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
      return 8;
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
    return "Estimated production time: larger runs may require additional handling before shipment.";
  }

  return "Estimated production time: fast production on standard configurations.";
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

function ChoiceChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
        active
          ? "border-orange-300 bg-orange-50 text-orange-700"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded border px-3 text-xs font-semibold transition ${
        active
          ? "border-orange-300 bg-orange-50 text-orange-700"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
      }`}
    >
      {label}
    </button>
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
          muted ? "text-zinc-400" : accent ? "font-semibold text-orange-600" : strong ? "font-semibold text-zinc-900" : "text-zinc-700"
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

function AcrylicCanvas({
  width,
  height,
  isValid,
  mounting,
  roundedCorners,
  contourCut,
  thickness,
  uploadedImage,
  uploadingArtwork,
}: {
  width: number;
  height: number;
  isValid: boolean;
  mounting: AcrylicMounting;
  roundedCorners: AcrylicRoundedCorner;
  contourCut: boolean;
  thickness: AcrylicThickness;
  uploadedImage: string | null;
  uploadingArtwork: boolean;
}) {
  const maxWidth = 680;
  const maxHeight = 380;
  const scale = isValid ? Math.min(maxWidth / width, maxHeight / height) : 0;
  const previewWidth = isValid ? Math.max(160, width * scale) : 320;
  const previewHeight = isValid ? Math.max(120, height * scale) : 220;
  const borderRadius = getCornerRadius(roundedCorners);
  const showStandoffs = mounting !== "none";
  const standoffTone = mounting === "black-standoff" ? "bg-zinc-800 ring-zinc-500" : "bg-zinc-200 ring-zinc-300";

  return (
    <div
      className="relative h-[58vh] min-h-[430px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}
    >
      <div className="absolute left-5 top-5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
        Upload artwork to preview it on the acrylic face
      </div>

      <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Top of Image
      </div>
      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Front Side
      </div>

      <div className="relative flex h-full items-center justify-center px-8 py-14">
        {isValid ? (
          <>
            <div
              className="absolute border border-dashed border-zinc-400/70"
              style={{ width: previewWidth + 18, height: previewHeight + 18, borderRadius: borderRadius + 4 }}
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-500">
                {formatInches(width)}
              </div>
              <div className="absolute -right-9 top-1/2 -translate-y-1/2 rotate-90 text-xs font-semibold text-zinc-500">
                {formatInches(height)}
              </div>
            </div>

            <div
              className="relative overflow-hidden border border-zinc-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.16)]"
              style={{ width: previewWidth, height: previewHeight, borderRadius }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(243,247,251,0.84)_50%,rgba(255,255,255,0.72))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(255,255,255,0.9),transparent_25%),linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.38)_42%,transparent_58%)]" />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                {uploadedImage ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={uploadedImage}
                      alt="Uploaded acrylic artwork preview"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center text-zinc-400">
                    <svg className="mx-auto h-12 w-12 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" />
                      <path d="M14 14l1.586-1.586a2 2 0 012.828 0L20 14" />
                      <path d="M14 7h.01" />
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                      {uploadingArtwork ? "Uploading Artwork" : "Artwork Preview Area"}
                    </div>
                  </div>
                )}
              </div>

              {showStandoffs &&
                [
                  "left-[7%] top-[10%]",
                  "right-[7%] top-[10%]",
                  "left-[7%] bottom-[10%]",
                  "right-[7%] bottom-[10%]",
                ].map((position) => (
                  <span key={position} className={`absolute h-5 w-5 rounded-full ring-4 shadow-md ${standoffTone} ${position}`} />
                ))}

              {contourCut && (
                <div className="absolute right-4 top-4 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                  Contour Cut
                </div>
              )}

              <div className="absolute bottom-4 left-4 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Thickness {thickness}
              </div>
              <div className="absolute bottom-4 right-4 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                {mounting === "none" ? "No Standoffs" : mounting === "silver-standoff" ? "Silver Hardware" : "Black Hardware"}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[250px] w-full max-w-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white/80 px-8 text-center shadow-inner">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Preview Ready</div>
            <div className="mt-3 text-xl font-semibold text-zinc-800">Set your acrylic dimensions to generate a scaled live mockup</div>
            <div className="mt-3 max-w-[30rem] text-sm leading-6 text-zinc-500">
              Rounded corners, standoff hardware, and uploaded artwork will appear here.
            </div>
          </div>
        )}
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const width = parseFloat(widthStr) || 0;
  const height = parseFloat(heightStr) || 0;
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);

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
            quantity: safeQuantity,
            thickness,
            mounting,
            roundedCorners,
            contourCut,
            rush,
          })
        : null,
    [width, height, safeQuantity, thickness, mounting, roundedCorners, contourCut, rush, isValid]
  );

  const thicknessOption = ACRYLIC_THICKNESS_OPTIONS.find((option) => option.value === thickness)!;
  const mountingOption = ACRYLIC_MOUNTING_OPTIONS.find((option) => option.value === mounting)!;
  const cornerOption = ACRYLIC_CORNER_OPTIONS.find((option) => option.value === roundedCorners)!;
  const minimumAdjustment = pricing ? Math.max(0, pricing.minAdjustedBase - pricing.rawBase) : 0;
  const productionMessage = getProductionMessage({
    rush,
    contourCut,
    mounting,
    quantity: safeQuantity,
  });

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
      productName: "Acrylic Signs",
      width,
      height,
      unit: "inches",
      quantity: safeQuantity,
      material: `Acrylic ${thicknessOption.label}`,
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
        custom_width: `${width}"`,
        custom_height: `${height}"`,
        custom_thickness: thicknessOption.label,
        custom_mounting: mountingOption.label,
        custom_rounded_corners: cornerOption.label,
        custom_contour_cut: contourCut ? "Yes" : "No",
        custom_rush: rush ? "Yes" : "No",
        custom_area_sqin: String(pricing.area),
      },
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="mx-auto max-w-[1400px] px-4 py-5">
        <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Link href="/" className="transition hover:text-zinc-900">
                  Home
                </Link>
                <span>/</span>
                <Link href="/shop/rigid" className="transition hover:text-zinc-900">
                  Rigid Signs
                </Link>
                <span>/</span>
                <span className="font-semibold text-zinc-900">Acrylic Signs</span>
              </nav>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Custom Sizes", "Premium Rigid Material", "Optional Standoff Hardware", "Fast Turnaround"].map((item) => (
                  <span key={item} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                    {item}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">Acrylic Signs</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Premium clear and rigid signage for offices, lobbies, branding, and wall-mounted displays.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)}</div>
              <div className="text-xs text-orange-700/80">
                {pricing ? `${pricing.area.toFixed(1)} sq in · ${safeQuantity} unit${safeQuantity !== 1 ? "s" : ""}` : "Set dimensions to calculate"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-700">
                  Acrylic {thicknessOption.label} · {isValid ? `${formatInches(width)} x ${formatInches(height)}` : "Set dimensions"}
                </div>
                <div className="text-xs font-medium text-zinc-500">
                  {mountingOption.label} · {cornerOption.label} corners · {contourCut ? "Contour cut" : "Square cut"}
                </div>
              </div>
              {(widthError || heightError) && (
                <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  {widthError || heightError}
                </div>
              )}
            </div>

            <AcrylicCanvas
              width={width}
              height={height}
              isValid={isValid}
              mounting={mounting}
              roundedCorners={roundedCorners}
              contourCut={contourCut}
              thickness={thickness}
              uploadedImage={uploadedImage}
              uploadingArtwork={uploadingArtwork}
            />

            <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-3 md:grid-cols-4 xl:grid-cols-8">
              <ControlBox title="Artwork" className="md:col-span-2" helper="Upload artwork the same way as the other builders.">
                <div className="space-y-2">
                  <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
                    <input
                      type="file"
                      accept="image/*,.pdf,.ai,.eps,.psd,.svg"
                      className="hidden"
                      onChange={onUploadArtwork}
                    />
                    {uploadingArtwork ? "Uploading..." : uploadedFileName ? "Replace Artwork" : "Upload Artwork"}
                  </label>
                  {uploadedFileName && (
                    <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600">
                      <span className="truncate">{uploadedFileName}</span>
                      <button type="button" onClick={clearArtwork} className="font-semibold text-zinc-500 hover:text-zinc-900">
                        Remove
                      </button>
                    </div>
                  )}
                  {uploadError && <div className="text-xs font-medium text-red-600">{uploadError}</div>}
                </div>
              </ControlBox>

              <ControlBox title="Size" className="md:col-span-2" helper="Custom sizes up to 96&quot; x 48&quot;.">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-1">
                  <input
                    type="number"
                    min={0.1}
                    max={ACRYLIC_MAX_WIDTH}
                    step={0.5}
                    value={widthStr}
                    onChange={(event) => setWidthStr(event.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <div className="flex items-center justify-center text-sm font-semibold text-zinc-400">x</div>
                  <input
                    type="number"
                    min={0.1}
                    max={ACRYLIC_MAX_HEIGHT}
                    step={0.5}
                    value={heightStr}
                    onChange={(event) => setHeightStr(event.target.value)}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                </div>
              </ControlBox>

              <ControlBox title="Thickness" helper="Selected state is highlighted.">
                <div className="flex flex-wrap gap-1">
                  {ACRYLIC_THICKNESS_OPTIONS.map((option) => (
                    <ChoiceChip
                      key={option.value}
                      active={thickness === option.value}
                      label={option.label}
                      onClick={() => setThickness(option.value)}
                    />
                  ))}
                </div>
              </ControlBox>

              <ControlBox title="Standoffs" className="md:col-span-2" helper="Creates a premium floating wall-mounted look.">
                <div className="flex flex-wrap gap-1">
                  <ChoiceChip active={mounting === "none"} label="None" onClick={() => setMounting("none")} />
                  <ChoiceChip active={mounting === "silver-standoff"} label="Silver" onClick={() => setMounting("silver-standoff")} />
                  <ChoiceChip active={mounting === "black-standoff"} label="Black" onClick={() => setMounting("black-standoff")} />
                </div>
              </ControlBox>

              <ControlBox title="Rounded Corners" helper="Choose a radius for softer, finished edges.">
                <select
                  value={roundedCorners}
                  onChange={(event) => setRoundedCorners(event.target.value as AcrylicRoundedCorner)}
                  className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm"
                >
                  {ACRYLIC_CORNER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ControlBox>

              <ControlBox title="Contour / Rush" helper="Add shaped finishing or expedited handling.">
                <div className="grid grid-cols-2 gap-1">
                  <ToggleChip active={contourCut} label="Contour" onClick={() => setContourCut((value) => !value)} />
                  <ToggleChip active={rush} label="Rush" onClick={() => setRush((value) => !value)} />
                </div>
              </ControlBox>

              <ControlBox title="Qty / Add" className="md:col-span-2">
                <div className="grid grid-cols-[68px_1fr] gap-1">
                  <input
                    type="number"
                    min={1}
                    value={safeQuantity}
                    onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
                    className="h-9 rounded border border-zinc-300 px-2 text-sm"
                  />
                  <Button
                    className="h-9 rounded bg-orange-500 text-xs font-semibold text-white hover:bg-orange-400"
                    disabled={!isValid}
                    onClick={addToCart}
                  >
                    {added ? "Added" : "Add"}
                  </Button>
                </div>
              </ControlBox>
            </div>
          </div>

          <aside className="space-y-3">
            <PanelCard eyebrow="Pricing" title="Transparent price breakdown">
              <div className="space-y-1">
                <BreakdownRow label="Width x Height" value={isValid ? `${formatInches(width)} x ${formatInches(height)}` : "--"} muted={!isValid} />
                <BreakdownRow label="Area" value={pricing ? `${pricing.area.toFixed(1)} sq in` : "--"} muted={!pricing} />
                <BreakdownRow label={`Base price (${formatCurrency(ACRYLIC_BASE_RATE)}/sq in)`} value={pricing ? formatCurrency(pricing.rawBase) : formatCurrency(0)} muted={!pricing} />
                <BreakdownRow label="Minimum price adjustment" value={pricing ? formatCharge(minimumAdjustment) : formatCurrency(0)} muted={!pricing || minimumAdjustment === 0} />
                <BreakdownRow label={`Thickness modifier (${thicknessOption.label})`} value={pricing ? formatCharge(pricing.thicknessCharge) : formatCurrency(0)} muted={!pricing || pricing.thicknessCharge === 0} />
                <BreakdownRow label="Contour cut charge" value={pricing ? formatCharge(pricing.contourCutCharge) : formatCurrency(0)} muted={!pricing || pricing.contourCutCharge === 0} />
                <BreakdownRow label="Rounded corners charge" value={pricing ? formatCharge(pricing.roundedCornersCharge) : formatCurrency(0)} muted={!pricing || pricing.roundedCornersCharge === 0} />
                <BreakdownRow label="Standoff charge" value={pricing ? formatCharge(pricing.standoffCharge) : formatCurrency(0)} muted={!pricing || pricing.standoffCharge === 0} />
                <BreakdownRow label="Rush charge" value={pricing ? formatCharge(pricing.rushCharge) : formatCurrency(0)} muted={!pricing || pricing.rushCharge === 0} />
                <div className="my-2 border-t border-zinc-200" />
                <BreakdownRow label="Per-item total" value={pricing ? formatCurrency(pricing.perItemTotal) : formatCurrency(0)} strong />
                <BreakdownRow label="Quantity" value={String(pricing?.quantity ?? safeQuantity)} strong />
                <BreakdownRow label="Grand total" value={pricing ? formatCurrency(pricing.grandTotal) : formatCurrency(0)} strong accent />
              </div>
              <div className="mt-3 text-xs leading-5 text-zinc-500">Final pricing updates instantly as you configure your sign.</div>
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs leading-5 text-zinc-600">
                {productionMessage}
              </div>
            </PanelCard>

            <PanelCard eyebrow="Live Summary" title="Your Configuration">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <SummaryItem label="Size" value={isValid ? `${formatInches(width)} x ${formatInches(height)}` : "Set dimensions"} />
                <SummaryItem label="Thickness" value={thicknessOption.label} />
                <SummaryItem label="Mounting" value={mountingOption.label} />
                <SummaryItem label="Rounded Corners" value={cornerOption.label} />
                <SummaryItem label="Contour Cut" value={contourCut ? "Enabled" : "None"} />
                <SummaryItem label="Rush" value={rush ? "Requested" : "Standard"} />
                <SummaryItem label="Quantity" value={String(safeQuantity)} />
              </div>
            </PanelCard>

            <PanelCard eyebrow="Product Gallery" title="Acrylic Sign Examples">
              <div className="space-y-3">
                <div className="relative h-48 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <Image
                    src="/card-images/Acrylic.png"
                    alt="Acrylic Signs Product"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-16 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white flex items-center justify-center">
                  <Image
                    src="/card-images/Acrylic-Logo.png"
                    alt="Acrylic Logo"
                    width={200}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </div>
            </PanelCard>

            <PanelCard eyebrow="Acrylic Notes" title="Why customers choose this finish">
              <div className="space-y-3 text-sm leading-6 text-zinc-600">
                <p>
                  Crystal-clear acrylic gives branding a clean, modern presentation for offices, lobbies, reception areas, and wall-mounted business signage.
                </p>
                <ul className="grid gap-2">
                  <li className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">Custom sizes up to 96&quot; x 48&quot;</li>
                  <li className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">Multiple thickness options with premium rigid finish</li>
                  <li className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">Optional silver or black standoff hardware for a floating look</li>
                  <li className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">Optional rounded corners and contour cut finishing</li>
                </ul>
              </div>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  );
}