"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BuilderBottomToolbar, { type BuilderBottomToolbarPanel } from "@/components/product-builder/BuilderBottomToolbar";
import ArtworkUploadModal from "@/components/product-builder/ArtworkUploadModal";
import RigidSignsPricingModal from "@/components/product-builder/RigidSignsPricingModal";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import {
  PVC_SHEET,
  PVC_SIZE_OPTIONS,
  PVC_MARKUP,
  calculatePvcPricing,
  formatPvcSize,
  getBestPvcSheetLayout,
  getPvcSheetPrice,
  type PvcMaterial,
  type PvcPrintMode,
} from "@/lib/pvc-pricing";

interface PvcBuilderProps {
  productId?: number;
  productName?: string;
}

interface BlockUpload {
  fileUrl: string;
  fileName: string;
  blobUrl: string | null;
}

interface BlockUploadPair {
  front?: BlockUpload;
  back?: BlockUpload;
}

type ImageFitMode = "fit" | "stretch";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function PvcBuilder({ productId = 0, productName = "PVC" }: PvcBuilderProps) {
  const cart = useCart();

  const [sizeId, setSizeId] = useState("24x18");
  const [material, setMaterial] = useState<PvcMaterial>("3mm");
  const [printMode, setPrintMode] = useState<PvcPrintMode>("single");
  const [quantity, setQuantity] = useState(1);

  const [contourCut, setContourCut] = useState(false);
  const [rush, setRush] = useState(false);

  const [imageCount, setImageCount] = useState(12);
  const [blockUploads, setBlockUploads] = useState<Record<number, BlockUploadPair>>({});
  const [uploadingBlock, setUploadingBlock] = useState<string | null>(null);
  const [blockUploadErrors, setBlockUploadErrors] = useState<Record<string, string>>({});
  const [blockImageModes, setBlockImageModes] = useState<Record<string, ImageFitMode>>();
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputBackRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [added, setAdded] = useState(false);

  const activeSize = useMemo(
    () => PVC_SIZE_OPTIONS.find((size) => size.id === sizeId) ?? PVC_SIZE_OPTIONS[0],
    [sizeId]
  );

  const pricing = useMemo(
    () =>
      calculatePvcPricing({
        width: activeSize.width,
        height: activeSize.height,
        quantity,
        material,
        printMode,
        stepStakes: 0,
        heavyDutyStakes: 0,
        grommetsEnabled: false,
        grommetCount: 0,
        gloss: false,
        contourCut,
        rush,
      }),
    [
      activeSize.width,
      activeSize.height,
      quantity,
      material,
      printMode,
      contourCut,
      rush,
    ]
  );

  const sheetLayout = useMemo(
    () => getBestPvcSheetLayout(activeSize.width, activeSize.height),
    [activeSize.height, activeSize.width]
  );

  const maxImages = sheetLayout.count;
  const safeImageCount = Math.min(imageCount, maxImages);

  useEffect(() => {
    setImageCount(maxImages);
  }, [maxImages]);

  async function uploadArtworkForBlock(blockIndex: number, file: File, side: "front" | "back" = "front") {
    const uploadKey = `${blockIndex}:${side}`;
    setUploadingBlock(uploadKey);
    setBlockUploadErrors((prev) => {
      const n = { ...prev };
      delete n[uploadKey];
      return n;
    });
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
              ? "Upload rejected: file too large. Ask support to increase Nginx client_max_body_size."
              : `Upload failed (${response.status}). ${raw.slice(0, 120)}`,
        };
      }
      if (!response.ok || !data.fileUrl) {
        setBlockUploadErrors((prev) => ({ ...prev, [uploadKey]: data.error ?? "Upload failed." }));
        return;
      }
      let blobUrl: string | null = null;
      if (file.type.startsWith("image/")) {
        blobUrl = URL.createObjectURL(file);
      }
      const newUpload = { fileUrl: data.fileUrl!, fileName: data.originalName ?? file.name, blobUrl };

      // Match Coro behavior: first upload on a side fills all active panels.
      setBlockUploads((prev) => {
        const isFirstUpload = !Object.values(prev).some((pair) => Boolean(pair?.[side]?.fileUrl));
        if (!isFirstUpload) {
          return {
            ...prev,
            [blockIndex]: { ...prev[blockIndex], [side]: newUpload },
          };
        }

        const next = { ...prev };
        const autoFillCount = maxImages;
        setImageCount(autoFillCount);
        for (let i = 0; i < autoFillCount; i += 1) {
          if (!next[i]?.[side]) {
            next[i] = { ...next[i], [side]: newUpload };
          }
        }
        return next;
      });
    } catch {
      setBlockUploadErrors((prev) => ({ ...prev, [uploadKey]: "Upload failed. Please try again." }));
    } finally {
      setUploadingBlock(null);
    }
  }

  function handleFileChange(blockIndex: number, event: React.ChangeEvent<HTMLInputElement>, side: "front" | "back" = "front") {
    const file = event.target.files?.[0];
    if (file) void uploadArtworkForBlock(blockIndex, file, side);
    event.target.value = "";
  }

  function setBlockImageMode(blockIndex: number, side: "front" | "back", mode: ImageFitMode) {
    setBlockImageModes((prev) => ({ ...prev, [`${blockIndex}:${side}`]: mode }));
  }

  function getBlockImageMode(blockIndex: number, side: "front" | "back"): ImageFitMode {
    return blockImageModes?.[`${blockIndex}:${side}`] ?? "fit";
  }

  function removeBlockUpload(blockIndex: number, side: "front" | "back" = "front") {
    setBlockUploads((prev) => {
      const pair = prev[blockIndex];
      if (!pair) return prev;
      if (pair[side]?.blobUrl) URL.revokeObjectURL(pair[side]!.blobUrl!);
      const updated = { ...pair };
      delete updated[side];
      if (Object.keys(updated).length === 0) {
        const n = { ...prev };
        delete n[blockIndex];
        return n;
      }
      return { ...prev, [blockIndex]: updated };
    });
  }

  function addToCart() {
    const safeQty = Math.max(1, Math.floor(quantity));
    const materialLabel = `PVC ${material} ${printMode === "single" ? "Single-Sided" : "Double-Sided"}`;
    const uploadedFileUrls = Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.front?.fileUrl ?? "").filter(Boolean);
    const uploadedBackUrls = printMode === "double" ? Array.from({ length: safeImageCount }, (_, i) => blockUploads[i]?.back?.fileUrl ?? "").filter(Boolean) : [];

    cart.addItem({
      productId,
      productName,
      width: activeSize.width,
      height: activeSize.height,
      unit: "inches",
      quantity: safeQty,
      material: materialLabel,
      doubleSided: printMode === "double",
      grommets: false,
      edgeFinish: "none",
      polePockets: false,
      windSlits: false,
      hemming: false,
      rush,
      uploadedFileUrl: uploadedFileUrls[0] ?? null,
      uploadedFileName: blockUploads[0]?.front?.fileName ?? null,
      uploadedFileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
      customOptions: {
        custom_sheet_size: `${PVC_SHEET.width}" x ${PVC_SHEET.height}"`,
        custom_sign_size: formatPvcSize(activeSize),
        custom_signs_per_sheet: String(pricing.signsPerSheet),
        custom_sheets_required: String(pricing.sheetsRequired),
        custom_material_thickness: `PVC ${material}`,
        custom_print_mode: printMode === "single" ? "Single-Sided" : "Double-Sided",
        custom_front_images: String(uploadedFileUrls.length),
        custom_back_images: printMode === "double" ? String(uploadedBackUrls.length) : "0",
        custom_back_image_urls: uploadedBackUrls.length > 0 ? uploadedBackUrls.join(",") : "none",
        custom_contour_cut: contourCut ? "yes" : "no",
        custom_rush_surcharge_mode: rush ? "+100%" : "none",
        custom_image_count: String(safeImageCount),
      },
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const uploadedCount = Object.keys(blockUploads).filter((k) => Number(k) < safeImageCount && blockUploads[Number(k)]?.front).length;
  const uploadedBackCount = printMode === "double" ? Object.keys(blockUploads).filter((k) => Number(k) < safeImageCount && blockUploads[Number(k)]?.back).length : 0;
  const toolbarPanels: BuilderBottomToolbarPanel[] = [
    {
      id: "artwork",
      title: "Artwork",
      value:
        printMode === "double"
          ? `${safeImageCount}/${maxImages} active • ${uploadedCount}/${safeImageCount} front, ${uploadedBackCount}/${safeImageCount} back`
          : `${safeImageCount}/${maxImages} active • ${uploadedCount}/${safeImageCount} uploaded`,
      width: 280,
      status:
        printMode === "double"
          ? uploadedCount === safeImageCount && uploadedBackCount === safeImageCount && safeImageCount > 0
            ? "ok"
            : "neutral"
          : uploadedCount === safeImageCount && safeImageCount > 0
            ? "ok"
            : "neutral",
      content: (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-zinc-600">Active image blocks</div>
            <input
              type="number"
              min={1}
              max={maxImages}
              value={safeImageCount}
              onChange={(e) => setImageCount(Math.min(maxImages, Math.max(1, Number(e.target.value) || 1)))}
              className="h-9 w-full rounded border border-zinc-300 px-2 text-sm"
            />
          </div>
          <p className="text-[11px] leading-4 text-zinc-500">
            {printMode === "double"
              ? "Upload front and back artworks for each block."
              : safeImageCount === 1
                ? "Upload 1 artwork for all signs."
                : `Upload artworks for up to ${safeImageCount} blocks.`}
          </p>
          <button
            type="button"
            onClick={() => setIsArtworkModalOpen(true)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            🎨 Open Upload Panel
          </button>
          <div className="text-[10px] text-zinc-400">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</div>
        </div>
      ),
    },
    {
      id: "size",
      title: "Size",
      value: formatPvcSize(activeSize),
      width: 260,
      content: (
        <select value={sizeId} onChange={(event) => setSizeId(event.target.value)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
          {PVC_SIZE_OPTIONS.map((size) => (
            <option key={size.id} value={size.id}>{formatPvcSize(size)}</option>
          ))}
        </select>
      ),
    },
    {
      id: "material",
      title: "Material",
      value: material,
      width: 200,
      content: (
        <select value={material} onChange={(event) => setMaterial(event.target.value as PvcMaterial)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
          <option value="3mm">3mm</option>
          <option value="6mm">6mm</option>
        </select>
      ),
    },
    {
      id: "print",
      title: "Print Sides",
      value: printMode === "single" ? "Single" : "Double",
      width: 220,
      content: (
        <select value={printMode} onChange={(event) => setPrintMode(event.target.value as PvcPrintMode)} className="h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm">
          <option value="single">Single</option>
          <option value="double">Double</option>
        </select>
      ),
    },
  ];

  const pricingColumns = ["1-9", "10-17", "18+"];
  const pricingRows = [
    {
      label: "3mm Single-Sided",
      values: [
        `${formatPrice(getPvcSheetPrice(1, "3mm", "single") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(10, "3mm", "single") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(18, "3mm", "single") * PVC_MARKUP)} per sheet`,
      ],
    },
    {
      label: "3mm Double-Sided",
      values: [
        `${formatPrice(getPvcSheetPrice(1, "3mm", "double") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(10, "3mm", "double") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(18, "3mm", "double") * PVC_MARKUP)} per sheet`,
      ],
    },
    {
      label: "6mm Single-Sided",
      values: [
        `${formatPrice(getPvcSheetPrice(1, "6mm", "single") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(10, "6mm", "single") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(18, "6mm", "single") * PVC_MARKUP)} per sheet`,
      ],
    },
    {
      label: "6mm Double-Sided",
      values: [
        `${formatPrice(getPvcSheetPrice(1, "6mm", "double") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(10, "6mm", "double") * PVC_MARKUP)} per sheet`,
        `${formatPrice(getPvcSheetPrice(18, "6mm", "double") * PVC_MARKUP)} per sheet`,
      ],
    },
  ];

  const addOnRows = [
    { label: "Custom Cut", value: "No additional cost" },
    { label: "Contour Cutting", value: "10% additional" },
    { label: "Rush", value: "100% additional" },
  ];

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[linear-gradient(145deg,#f4f4f5_0%,#ececef_55%,#e4e4e7_100%)] text-zinc-800">
      <div className="w-full px-3 py-3 md:px-4">
        <div className="grid gap-3">
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div
              className="bg-[#fafaf9] px-4 py-3"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div className="grid gap-3 md:grid-cols-[0.85fr_1.4fr_0.85fr] md:items-start md:gap-8">
                <div>
                  <div className="text-[27px] leading-[0.98] font-medium uppercase tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">{productName}</div>
                  <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">Rigid sheet-layout builder</div>
                </div>

                <div className="text-center md:pt-1">
                  <div className="mx-auto w-full max-w-[340px]">
                    <table className="w-full border-collapse text-[10px] leading-5 text-zinc-600 md:text-[11px]">
                      <thead>
                        <tr>
                          <th className="pb-0.5 text-left font-semibold text-zinc-500" />
                          <th className="pb-0.5 text-left font-semibold text-zinc-500">Single-Sided</th>
                          <th className="pb-0.5 text-left font-semibold text-zinc-500">Double-Sided</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-0.5 text-left text-zinc-500">3mm</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatPrice(getPvcSheetPrice(1, "3mm", "single") * PVC_MARKUP)} per sheet</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatPrice(getPvcSheetPrice(1, "3mm", "double") * PVC_MARKUP)} per sheet</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 text-left text-zinc-500">6mm</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatPrice(getPvcSheetPrice(1, "6mm", "single") * PVC_MARKUP)} per sheet</td>
                          <td className="py-0.5 text-left font-medium text-zinc-700">{formatPrice(getPvcSheetPrice(1, "6mm", "double") * PVC_MARKUP)} per sheet</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPricingModalOpen(true)}
                    className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
                  >
                    Pricing And Shipping
                  </button>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-[34px] leading-none font-semibold text-[var(--brand-primary)] md:text-[44px]">{formatPrice(pricing.totalPrice)}</div>
                  <div className="mt-1 text-[10px] text-zinc-500">Live total</div>
                </div>
              </div>
            </div>

            <div
              className="relative h-[calc(100vh-320px)] min-h-[540px] overflow-hidden rounded-b-2xl bg-[#fafaf9]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-zinc-500 bg-white"
                style={{
                  width: 248,
                  height: 496,
                }}
              >
                {sheetLayout.placements.map((placement, index) => {
                  const slotIndex = index < safeImageCount ? index : null;
                  const upload = slotIndex !== null ? blockUploads[slotIndex]?.[previewSide] : null;

                  return (
                    <button
                      key={`cell-${index}`}
                      type="button"
                      disabled={slotIndex === null}
                      onClick={() => {
                        if (slotIndex !== null) {
                          if (printMode === "double" && previewSide === "back") {
                            fileInputBackRefs.current[slotIndex]?.click();
                          } else {
                            fileInputRefs.current[slotIndex]?.click();
                          }
                        }
                      }}
                      className={`absolute overflow-hidden border ${
                        slotIndex !== null ? "cursor-pointer hover:opacity-85" : "cursor-default"
                      } ${upload ? "border-emerald-500" : "border-[#8ea4bb] bg-[#edf1f4]"}`}
                      style={{
                        left: `${(placement.x / PVC_SHEET.width) * 100}%`,
                        top: `${(placement.y / PVC_SHEET.height) * 100}%`,
                        width: `${(placement.width / PVC_SHEET.width) * 100}%`,
                        height: `${(placement.height / PVC_SHEET.height) * 100}%`,
                      }}
                    >
                      {upload?.blobUrl ? (
                        <div className="flex h-full w-full items-center justify-center bg-white p-[1px]">
                          <img src={upload.blobUrl} alt="" className="h-full w-full object-contain" />
                        </div>
                      ) : slotIndex !== null ? (
                        <div className="sc-panel-dotted-guides flex h-full w-full items-center justify-center">
                          <span className="text-[7px] font-semibold text-zinc-500">
                            {uploadingBlock === `${slotIndex}:${previewSide}` ? "\u2026" : slotIndex + 1}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute left-1/2 top-[calc(50%-264px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Top of Sheet
              </div>
              <div className="pointer-events-none absolute left-1/2 top-[calc(50%+260px)] -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {previewSide === "front" ? "Front Side" : "Back Side"}
              </div>

              {printMode === "double" && (
                <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewSide("front")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      previewSide === "front"
                        ? "bg-blue-500 text-white"
                        : "border border-zinc-300 bg-white text-zinc-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSide("back")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      previewSide === "back"
                        ? "bg-orange-500 text-white"
                        : "border border-zinc-300 bg-white text-zinc-600 hover:border-orange-400 hover:text-orange-600"
                    }`}
                  >
                    Back
                  </button>
                </div>
              )}
              <div className="pointer-events-none absolute left-[calc(50%-148px)] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Left
              </div>
              <div className="pointer-events-none absolute left-[calc(50%+116px)] top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Right
              </div>
            </div>

            {Array.from({ length: safeImageCount }).map((_, i) => (
              <input
                key={`file-input-${i}`}
                ref={(el) => { fileInputRefs.current[i] = el; }}
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                className="hidden"
                onChange={(e) => handleFileChange(i, e, "front")}
                disabled={uploadingBlock !== null}
              />
            ))}
            {Array.from({ length: safeImageCount }).map((_, i) => (
              <input
                key={`file-input-back-${i}`}
                ref={(el) => { fileInputBackRefs.current[i] = el; }}
                type="file"
                accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff,.psd"
                className="hidden"
                onChange={(e) => handleFileChange(i, e, "back")}
                disabled={uploadingBlock !== null}
              />
            ))}

            <BuilderBottomToolbar
              panels={toolbarPanels}
              action={
                <Button className="h-10 w-full rounded bg-[var(--brand-primary)] text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]" onClick={addToCart}>
                  {added ? "Added" : "Add"}
                </Button>
              }
            />

            <RigidSignsPricingModal
              isOpen={isPricingModalOpen}
              onClose={() => setIsPricingModalOpen(false)}
              pricingColumns={pricingColumns}
              pricingRows={pricingRows}
              addOnRows={addOnRows}
              markup={PVC_MARKUP}
            />
          </section>

          <ArtworkUploadModal
            isOpen={isArtworkModalOpen}
            onClose={() => setIsArtworkModalOpen(false)}
            safeImageCount={safeImageCount}
            blockUploads={blockUploads}
            blockUploadErrors={blockUploadErrors}
            uploadingBlock={uploadingBlock}
            printMode={printMode}
            fileInputRefs={fileInputRefs}
            fileInputBackRefs={fileInputBackRefs}
            onRemoveUpload={removeBlockUpload}
            onSetImageMode={setBlockImageMode}
            onGetImageMode={getBlockImageMode}
          />


        </div>
      </div>
    </div>
  );
}
