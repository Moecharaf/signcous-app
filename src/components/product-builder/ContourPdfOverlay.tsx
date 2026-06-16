"use client";

import { useEffect, useState } from "react";

function removeWhiteBackground(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const alpha = pixels[index + 3];

    if (alpha > 0 && red >= 245 && green >= 245 && blue >= 245) {
      pixels[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
}

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

  const wrapperClassName = `pointer-events-none absolute inset-0 z-20 opacity-90 ${className}`;
  const assetClassName =
    displayMode === "stretch"
      ? "h-full w-full object-fill"
      : "h-full w-full object-contain";

  useEffect(() => {
    if (previewUrl) {
      setRenderFailed(false);
      setGeneratedPreviewUrl(null);
      return;
    }

    let cancelled = false;

    async function renderPdfFirstPage() {
      setRenderFailed(false);
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
          removeWhiteBackground(canvas);

          const nextPreviewUrl = canvas.toDataURL("image/png");

          if (cancelled) {
            return;
          }

          setGeneratedPreviewUrl(nextPreviewUrl);
        } finally {
          await pdf.destroy();
        }
      } catch {
        if (!cancelled) {
          setGeneratedPreviewUrl(null);
          setRenderFailed(true);
        }
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

  if (renderFailed && fileUrl) {
    return (
      <div className={wrapperClassName}>
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          scrolling="no"
        />
      </div>
    );
  }

  return null;
}
