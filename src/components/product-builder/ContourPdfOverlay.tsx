"use client";

import { useEffect, useState } from "react";

interface ContourPdfOverlayProps {
  previewUrl?: string | null;
  fileUrl: string;
  displayMode?: "fit" | "stretch";
  className?: string;
  title?: string;
}

export default function ContourPdfOverlay({
  previewUrl,
  fileUrl,
  displayMode = "fit",
  className = "",
  title = "Contour overlay",
}: ContourPdfOverlayProps) {
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  const wrapperClassName = `pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-70 mix-blend-multiply ${className}`;
  const assetClassName =
    displayMode === "stretch"
      ? "h-full w-full object-fill"
      : "h-auto w-auto max-h-full max-w-full object-contain";

  useEffect(() => {
    if (previewUrl) {
      setRenderFailed(false);
      setGeneratedPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      return;
    }

    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    async function renderPdfFirstPage() {
      setRenderFailed(false);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        try {
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Canvas context unavailable");
          }

          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          await page.render({ canvasContext: context, canvas, viewport }).promise;

          const nextPreviewUrl = await new Promise<string | null>((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob ? URL.createObjectURL(blob) : null);
            }, "image/png");
          });

          if (cancelled) {
            if (nextPreviewUrl) URL.revokeObjectURL(nextPreviewUrl);
            return;
          }

          objectUrlToRevoke = nextPreviewUrl;
          setGeneratedPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return nextPreviewUrl;
          });
        } finally {
          await pdf.destroy();
        }
      } catch {
        if (!cancelled) setRenderFailed(true);
      }
    }

    void renderPdfFirstPage();
    return () => {
      cancelled = true;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [fileUrl, previewUrl]);

  const activePreviewUrl = previewUrl ?? generatedPreviewUrl;

  if (activePreviewUrl) {
    return (
      <div className={wrapperClassName}>
        <img src={activePreviewUrl} alt={title} className={assetClassName} />
      </div>
    );
  }

  if (renderFailed) {
    return (
      <div className={wrapperClassName}>
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
          title={title}
          className={assetClassName}
          scrolling="no"
        />
      </div>
    );
  }

  return null;
}
