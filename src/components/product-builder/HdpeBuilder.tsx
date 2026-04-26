"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { calculateHdpePrice, formatPrice, getHdpeSqFtRate } from "@/lib/pricing";

const unitOptions = ["inches", "feet"] as const;
type Unit = (typeof unitOptions)[number];

type DragState =
  | { mode: "none" }
  | { mode: "move"; startX: number; startY: number; originX: number; originY: number }
  | { mode: "resize"; startX: number; startY: number; startW: number; startH: number; startPxPerIn: number };

const MIN_IN = 6;
const MAX_IN = 240;
const PREVIEW_MAX_WIDTH = 720;
const PREVIEW_MAX_HEIGHT = 420;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function toInches(value: number, unit: Unit) {
  return unit === "feet" ? value * 12 : value;
}
function fromInches(value: number, unit: Unit) {
  return unit === "feet" ? (value / 12).toFixed(2) : value.toFixed(1);
}

export default function HdpeBuilder() {
  const cart = useCart();
  const [width, setWidth] = useState("13");
  const [height, setHeight] = useState("13");
  const [unit, setUnit] = useState<Unit>("inches");
  const [quantity, setQuantity] = useState("1");
  const [widthError, setWidthError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [qtyError, setQtyError] = useState("");
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

  const widthNum = parseFloat(width) || 0;
  const heightNum = parseFloat(height) || 0;
  const qtyNum = parseInt(quantity, 10) || 1;
  const widthIn = toInches(widthNum, unit);
  const heightIn = toInches(heightNum, unit);

  const fitScale = Math.min(
    PREVIEW_MAX_WIDTH / Math.max(widthIn, 1),
    PREVIEW_MAX_HEIGHT / Math.max(heightIn, 1)
  );
  const pxPerIn = fitScale * zoom;
  const artWidth = widthIn * pxPerIn;
  const artHeight = heightIn * pxPerIn;

  const pricing = useMemo(
    () => calculateHdpePrice(widthIn, heightIn, qtyNum),
    [widthIn, heightIn, qtyNum]
  );
  const hdpeRate = useMemo(() => getHdpeSqFtRate(qtyNum), [qtyNum]);

  const set = useCallback((field: "width" | "height", val: string) => {
    if (field === "width") setWidth(val);
    else setHeight(val);
  }, []);

  function validate() {
    let ok = true;
    if (!widthNum || widthIn < MIN_IN || widthIn > MAX_IN) {
      setWidthError(unit === "inches" ? "Use 6-240 in" : "Use 0.5-20 ft");
      ok = false;
    } else setWidthError("");
    if (!heightNum || heightIn < MIN_IN || heightIn > MAX_IN) {
      setHeightError(unit === "inches" ? "Use 6-240 in" : "Use 0.5-20 ft");
      ok = false;
    } else setHeightError("");
    if (!qtyNum || qtyNum < 1 || qtyNum > 10000) {
      setQtyError("Use 1-10000");
      ok = false;
    } else setQtyError("");
    return ok;
  }

  function handleAddToCart() {
    if (!validate()) return;
    if (uploadingArtwork) {
      setUploadError("Please wait for your artwork to finish uploading.");
      return;
    }
    cart.addItem({
      productId: 56,
      productName: "HDPE Sign",
      width: widthNum,
      height: heightNum,
      unit,
      quantity: qtyNum,
      material: "HDPE",
      doubleSided: false,
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush: false,
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
      const response = await fetch("/api/upload-artwork", { method: "POST", body: formData });
      const contentType = response.headers.get("content-type") ?? "";
      let data: { fileUrl?: string; originalName?: string; error?: string } = {};
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const raw = await response.text();
        data = {
          error:
            response.status === 413
              ? "Upload rejected by server size limit."
              : `Upload failed (${response.status}). ${raw.slice(0, 180)}`,
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
        setUploadedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return blobUrl; });
      } else {
        setUploadedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
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
    setDrag({ mode: "move", startX: event.clientX, startY: event.clientY, originX: artPos.x, originY: artPos.y });
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
      if (!workspaceRef.current || drag.mode === "none") return;
      if (drag.mode === "move") {
        setArtPos({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY });
        return;
      }
      const nextWIn = clamp(drag.startW + (event.clientX - drag.startX) / drag.startPxPerIn, MIN_IN, MAX_IN);
      const nextHIn = clamp(drag.startH + (event.clientY - drag.startY) / drag.startPxPerIn, MIN_IN, MAX_IN);
      set("width", fromInches(nextWIn, unit));
      set("height", fromInches(nextHIn, unit));
    }
    function onPointerUp() { setDrag({ mode: "none" }); }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, unit, pxPerIn, set]);

  useEffect(() => {
    return () => { if (uploadedImage) URL.revokeObjectURL(uploadedImage); };
  }, [uploadedImage]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">

        {/* Header bar */}
        <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700">
                <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] tracking-normal text-orange-400">SC</span>
                Signcous Studio
              </div>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">HDPE Sign Configurator</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Drag to reposition artwork. Use the corner handle to resize and auto-update dimensions.
              </p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-orange-700">Live Total</div>
              <div className="text-3xl font-semibold text-zinc-900">{formatPrice(pricing.totalPrice)}</div>
              <div className="text-xs text-orange-700/80">{pricing.sqFt} sqft · {qtyNum} unit{qtyNum !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Canvas panel */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="border-b border-zinc-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-700">
                  Artboard Size: {(widthIn / 12).toFixed(2)} ft x {(heightIn / 12).toFixed(2)} ft
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Zoom</label>
                  <input
                    type="range" min={0.6} max={1.8} step={0.05} value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value) || 1)}
                    className="accent-orange-500"
                  />
                  <span className="w-10 text-right text-xs font-semibold text-zinc-600">{Math.round(zoom * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Artboard */}
            <div
              ref={workspaceRef}
              className="relative h-[calc(100vh-290px)] min-h-[560px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="absolute left-5 top-5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
                Click and drag sign to move
              </div>

              <div
                className="absolute left-1/2 top-1/2 cursor-move select-none rounded-md border-2 border-dashed border-orange-500 bg-orange-50/55 shadow-lg"
                onPointerDown={startMove}
                style={{
                  width: artWidth,
                  height: artHeight,
                  transform: `translate(calc(-50% + ${artPos.x}px), calc(-50% + ${artPos.y}px))`,
                }}
              >
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

                <button
                  type="button"
                  data-role="resize-handle"
                  onPointerDown={startResize}
                  className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full border-2 border-white bg-orange-500 shadow"
                  aria-label="Resize sign"
                  title="Drag to resize"
                />
              </div>
            </div>

            {/* Control rail */}
            <div className="border-t border-zinc-200 bg-zinc-50 p-3">
              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-8">
                <ControlBox title="Size" error={widthError || heightError} className="md:col-span-2 xl:col-span-3">
                  <div className="grid grid-cols-[1fr_1fr_70px] gap-1">
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="h-9 min-w-0 appearance-none rounded border border-zinc-300 px-2 text-sm text-zinc-800"
                      placeholder="W"
                    />
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="h-9 min-w-0 appearance-none rounded border border-zinc-300 px-2 text-sm text-zinc-800"
                      placeholder="H"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as Unit)}
                      className="h-9 rounded border border-zinc-300 bg-white px-1 text-sm"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>{u === "inches" ? "in" : "ft"}</option>
                      ))}
                    </select>
                  </div>
                </ControlBox>

                <ControlBox title="Qty / Add" error={qtyError} className="xl:col-span-2">
                  <div className="grid grid-cols-[70px_1fr] gap-1">
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
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
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pricing Breakdown</div>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Rate" value={`$${hdpeRate.toFixed(2)} / sqft`} />
                <Row label="Square Feet" value={String(pricing.sqFt)} />
                <div className="my-2 border-t border-zinc-200" />
                <Row label="Unit Price" value={formatPrice(pricing.unitPrice)} strong />
                <Row label={`Order Total (${qtyNum})`} value={formatPrice(pricing.totalPrice)} strong className="text-orange-600" />
                <Row label="Minimum Order" value="$20.00" />
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
  title, error, className, children,
}: {
  title: string; error?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-2 ${className ?? ""}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</div>
      {children}
      {error && <div className="mt-1 text-[10px] font-semibold text-rose-600">{error}</div>}
    </div>
  );
}

function Row({
  label, value, strong, className,
}: {
  label: string; value: string; strong?: boolean; className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-semibold text-zinc-900" : "text-zinc-700"} ${className ?? ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
