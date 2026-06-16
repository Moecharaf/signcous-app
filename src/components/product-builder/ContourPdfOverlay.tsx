"use client";

import { useEffect, useState } from "react";

function colorizeContourPreview(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context || canvas.width < 2 || canvas.height < 2) return;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha === 0) continue;

    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const isNearWhite = luminance >= 242 && maxChannel - minChannel <= 18;

    if (isNearWhite) {
      pixels[i + 3] = 0;
      continue;
    }

    pixels[i] = 255;
    pixels[i + 1] = 0;
    pixels[i + 2] = 140;
    pixels[i + 3] = Math.max(alpha, 220);
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

  const wrapperClassName = `pointer-events-none absolute inset-0 z-20 opacity-90 ${className}`;
  const assetClassName =
    displayMode === "stretch"
      ? "h-full w-full object-fill"
      : "h-full w-full object-contain";

  useEffect(() => {
    if (previewUrl) {
      setGeneratedPreviewUrl(null);
      return;
    }

    if (!fileUrl) {
      setGeneratedPreviewUrl(null);
      return;
    }

    let cancelled = false;

    async function renderPdfFirstPage() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        try {
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas context unavailable");
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          await page.render({ canvasContext: context, canvas, viewport }).promise;
          colorizeContourPreview(canvas);
          const nextPreviewUrl = canvas.toDataURL("image/png");
          if (!cancelled) setGeneratedPreviewUrl(nextPreviewUrl);
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
