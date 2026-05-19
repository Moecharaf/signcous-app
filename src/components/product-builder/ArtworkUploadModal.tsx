"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BlockUpload {
  fileUrl: string;
  fileName: string;
  blobUrl: string | null;
}

interface BlockUploadPair {
  front?: BlockUpload;
  back?: BlockUpload;
}

interface ArtworkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeImageCount: number;
  blockUploads: Record<number, BlockUploadPair>;
  blockUploadErrors: Record<string, string>;
  uploadingBlock: string | null;
  printMode: "single" | "double";
  fileInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  fileInputBackRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onRemoveUpload: (blockIndex: number, side: "front" | "back") => void;
  onSetImageMode: (blockIndex: number, side: "front" | "back", mode: "fit" | "stretch") => void;
  onGetImageMode: (blockIndex: number, side: "front" | "back") => "fit" | "stretch";
}

const SLOT_COLORS = [
  "bg-blue-400", "bg-emerald-400", "bg-violet-400", "bg-amber-400",
  "bg-pink-400", "bg-cyan-400", "bg-orange-400", "bg-teal-400",
];

export default function ArtworkUploadModal({
  isOpen,
  onClose,
  safeImageCount,
  blockUploads,
  blockUploadErrors,
  uploadingBlock,
  printMode,
  fileInputRefs,
  fileInputBackRefs,
  onRemoveUpload,
  onSetImageMode,
  onGetImageMode,
}: ArtworkUploadModalProps) {
  const [dragOverBlock, setDragOverBlock] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleDragOver = useCallback((e: React.DragEvent, blockIndex: number) => {
    e.preventDefault();
    setDragOverBlock(blockIndex);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverBlock(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, blockIndex: number, side: "front" | "back") => {
    e.preventDefault();
    setDragOverBlock(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const input = side === "front" ? fileInputRefs.current[blockIndex] : fileInputBackRefs.current[blockIndex];
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        // eslint-disable-next-line react-hooks/immutability
        input.files = dataTransfer.files;
        const changeEvent = new Event("change", { bubbles: true });
        input.dispatchEvent(changeEvent);
      }
    }
  }, [fileInputRefs, fileInputBackRefs]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Upload Artwork</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {printMode === "double" ? "Upload front and back images" : "Upload your designs"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: "calc(85vh - 120px)" }}>
          <div className="space-y-4">
            {Array.from({ length: safeImageCount }).map((_, i) => {
              const uploadPair = blockUploads[i];
              const frontUpload = uploadPair?.front;
              const backUpload = uploadPair?.back;
              const frontError = blockUploadErrors[`${i}:front`];
              const backError = blockUploadErrors[`${i}:back`];
              const isFrontUploading = uploadingBlock === `${i}:front`;
              const isBackUploading = uploadingBlock === `${i}:back`;
              const color = SLOT_COLORS[i % SLOT_COLORS.length];

              return (
                <div key={`block-${i}`} className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 transition-colors">
                  {/* Block Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${color} text-sm font-bold text-white`}>
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900">Block {i + 1}</h3>
                      {printMode === "double" && (
                        <p className="text-xs text-zinc-500">
                          {frontUpload && backUpload ? "✓ Both uploaded" : frontUpload ? "✓ Front uploaded" : backUpload ? "✓ Back uploaded" : "Empty"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Upload Areas */}
                  {printMode === "double" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Front */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide">Front</label>
                        <div
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, i, "front")}
                          className={`rounded-lg border-2 border-dashed p-3 text-center transition-all ${
                            dragOverBlock === i && !frontUpload
                              ? "border-blue-500 bg-blue-50"
                              : "border-blue-200 bg-blue-50/30 hover:border-blue-300"
                          }`}
                        >
                          {frontUpload ? (
                            <div className="space-y-2">
                              {frontUpload.blobUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={frontUpload.blobUrl} alt={frontUpload.fileName} className="h-20 w-full rounded object-cover" />
                              )}
                              <p className="text-xs text-emerald-700 font-medium truncate">{frontUpload.fileName}</p>
                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => onSetImageMode(i, "front", "fit")}
                                  className={`rounded py-1 text-[11px] font-semibold transition ${
                                    onGetImageMode(i, "front") === "fit"
                                      ? "border border-blue-400 bg-blue-100 text-blue-700"
                                      : "border border-zinc-300 bg-white text-zinc-600 hover:border-blue-300"
                                  }`}
                                >
                                  Fit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSetImageMode(i, "front", "stretch")}
                                  className={`rounded py-1 text-[11px] font-semibold transition ${
                                    onGetImageMode(i, "front") === "stretch"
                                      ? "border border-blue-400 bg-blue-100 text-blue-700"
                                      : "border border-zinc-300 bg-white text-zinc-600 hover:border-blue-300"
                                  }`}
                                >
                                  Stretch
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => onRemoveUpload(i, "front")}
                                className="w-full rounded border border-rose-200 bg-rose-50 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[i]?.click()}
                              disabled={isFrontUploading}
                              className="w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                            >
                              {isFrontUploading ? "Uploading..." : "+ Upload Front"}
                            </button>
                          )}
                        </div>
                        {frontError && <p className="text-[11px] text-rose-600">{frontError}</p>}
                      </div>

                      {/* Back */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-orange-700 uppercase tracking-wide">Back</label>
                        <div
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, i, "back")}
                          className={`rounded-lg border-2 border-dashed p-3 text-center transition-all ${
                            dragOverBlock === i && !backUpload
                              ? "border-orange-500 bg-orange-50"
                              : "border-orange-200 bg-orange-50/30 hover:border-orange-300"
                          }`}
                        >
                          {backUpload ? (
                            <div className="space-y-2">
                              {backUpload.blobUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={backUpload.blobUrl} alt={backUpload.fileName} className="h-20 w-full rounded object-cover" />
                              )}
                              <p className="text-xs text-emerald-700 font-medium truncate">{backUpload.fileName}</p>
                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => onSetImageMode(i, "back", "fit")}
                                  className={`rounded py-1 text-[11px] font-semibold transition ${
                                    onGetImageMode(i, "back") === "fit"
                                      ? "border border-orange-400 bg-orange-100 text-orange-700"
                                      : "border border-zinc-300 bg-white text-zinc-600 hover:border-orange-300"
                                  }`}
                                >
                                  Fit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSetImageMode(i, "back", "stretch")}
                                  className={`rounded py-1 text-[11px] font-semibold transition ${
                                    onGetImageMode(i, "back") === "stretch"
                                      ? "border border-orange-400 bg-orange-100 text-orange-700"
                                      : "border border-zinc-300 bg-white text-zinc-600 hover:border-orange-300"
                                  }`}
                                >
                                  Stretch
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => onRemoveUpload(i, "back")}
                                className="w-full rounded border border-rose-200 bg-rose-50 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputBackRefs.current[i]?.click()}
                              disabled={isBackUploading}
                              className="w-full py-2 text-xs font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50"
                            >
                              {isBackUploading ? "Uploading..." : "+ Upload Back"}
                            </button>
                          )}
                        </div>
                        {backError && <p className="text-[11px] text-rose-600">{backError}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, i, "front")}
                        className={`rounded-lg border-2 border-dashed p-4 text-center transition-all ${
                          dragOverBlock === i && !frontUpload
                            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
                            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400"
                        }`}
                      >
                        {frontUpload ? (
                          <div className="space-y-2">
                            {frontUpload.blobUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={frontUpload.blobUrl} alt={frontUpload.fileName} className="h-24 w-full rounded object-cover" />
                            )}
                            <p className="text-xs text-emerald-700 font-medium truncate">{frontUpload.fileName}</p>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => onSetImageMode(i, "front", "fit")}
                                className={`rounded py-1 text-[11px] font-semibold transition ${
                                  onGetImageMode(i, "front") === "fit"
                                    ? "border border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                                    : "border border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                                }`}
                              >
                                Fit
                              </button>
                              <button
                                type="button"
                                onClick={() => onSetImageMode(i, "front", "stretch")}
                                className={`rounded py-1 text-[11px] font-semibold transition ${
                                  onGetImageMode(i, "front") === "stretch"
                                    ? "border border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                                    : "border border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                                }`}
                              >
                                Stretch
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveUpload(i, "front")}
                              className="w-full rounded border border-rose-200 bg-rose-50 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[i]?.click()}
                            disabled={isFrontUploading}
                            className="w-full py-3 text-sm font-semibold text-zinc-600 hover:text-zinc-700 disabled:opacity-50"
                          >
                            {isFrontUploading ? "Uploading..." : "💾 Upload Image or Drag Here"}
                          </button>
                        )}
                      </div>
                      {frontError && <p className="text-[11px] text-rose-600">{frontError}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-[11px] text-blue-700">
            <p className="font-semibold mb-1">💡 Tip:</p>
            <p>Drag and drop files directly into the upload areas, or click to browse.</p>
            <p className="text-blue-600 text-[10px] mt-1">Accepted: PDF, AI, EPS, PNG, JPG, TIFF, PSD (up to 100MB)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
