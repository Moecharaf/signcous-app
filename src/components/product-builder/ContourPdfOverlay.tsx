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

  const wrapperClassName = `pointer-events-none absolute inset-0 z-20 opacity-70 mix-blend-multiply ${className}`;
  const assetClassName =
    displayMode === "stretch"
      ? "h-full w-full object-fill"
      : "h-full w-full object-contain";

  useEffect(() => {
    if (previewUrl) {
      setGeneratedPreviewUrl(null);
      return;
    }

    let cancelled = false;

    async function renderPdfFirstPage() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        const sourceData = await fetch(fileUrl).then((response) => response.arrayBuffer());
        const loadingTask = pdfjsLib.getDocument({ data: sourceData, disableWorker: true } as any);
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

          const nextPreviewUrl = canvas.toDataURL("image/png");

          if (cancelled) {
            return;
          }

          setGeneratedPreviewUrl(nextPreviewUrl);
        } finally {
          await pdf.destroy();
        }
      } catch {
        if (!cancelled) setGeneratedPreviewUrl(null);
      }
    }

    void renderPdfFirstPage();
    return () => {
      cancelled = true;
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

  return null;
}
