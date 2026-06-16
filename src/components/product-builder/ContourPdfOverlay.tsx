"use client";

import { useEffect, useRef, useState } from "react";

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
  const overlayClassName =
    displayMode === "stretch"
      ? `pointer-events-none absolute inset-0 z-20 h-full w-full opacity-70 mix-blend-multiply ${className}`
      : `pointer-events-none absolute inset-0 z-20 m-auto h-auto max-h-full w-auto max-w-full opacity-70 mix-blend-multiply ${className}`;

  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={title}
        className={displayMode === "stretch" ? overlayClassName : `${overlayClassName} object-contain`}
      />
    );
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderPdfFirstPage() {
      setRenderFailed(false);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        if (cancelled || !canvasRef.current) {
          await pdf.destroy();
          return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) {
          await pdf.destroy();
          throw new Error("Canvas context unavailable");
        }

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        await page.render({ canvasContext: context, canvas, viewport }).promise;
        await pdf.destroy();
      } catch {
        if (!cancelled) setRenderFailed(true);
      }
    }

    void renderPdfFirstPage();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (renderFailed) {
    return (
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
        title={title}
        className={overlayClassName}
        scrolling="no"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={title}
      className={overlayClassName}
    />
  );
}
