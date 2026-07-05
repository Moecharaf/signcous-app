"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

function isNearWhite(red: number, green: number, blue: number): boolean {
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance >= 218 && maxChannel - minChannel <= 42;
}

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
    if (isNearWhite(red, green, blue)) {
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

async function getPdfDocument(pdfjsLib: typeof import("pdfjs-dist"), sourceBuffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    return await pdfjsLib.getDocument({
      data: new Uint8Array(sourceBuffer.slice(0)),
    }).promise;
  } catch {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      return await pdfjsLib.getDocument({
        data: new Uint8Array(sourceBuffer.slice(0)),
      }).promise;
    } catch {
      return await pdfjsLib.getDocument({
        data: new Uint8Array(sourceBuffer.slice(0)),
        disableWorker: true,
      } as Parameters<typeof pdfjsLib.getDocument>[0]).promise;
    }
  }
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

  const wrapperClassName = `pointer-events-none absolute inset-0 z-10 opacity-90 ${className}`;
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
        const sourceBuffer: ArrayBuffer = await fetch(fileUrl).then((response) =>
          response.arrayBuffer()
        );
        const pdf = await getPdfDocument(pdfjsLib, sourceBuffer);
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activePreviewUrl} alt={title} className={assetClassName} />
      </div>
    );
  }

  return null;
}
