"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface PixelBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function isNearWhite(red: number, green: number, blue: number): boolean {
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance >= 242 && maxChannel - minChannel <= 18;
}

function expandBounds(bounds: PixelBounds | null, x: number, y: number): PixelBounds {
  if (!bounds) {
    return { left: x, top: y, right: x, bottom: y };
  }

  return {
    left: Math.min(bounds.left, x),
    top: Math.min(bounds.top, y),
    right: Math.max(bounds.right, x),
    bottom: Math.max(bounds.bottom, y),
  };
}

function colorizeContourPreview(canvas: HTMLCanvasElement): PixelBounds | null {
  const context = canvas.getContext("2d");
  if (!context || canvas.width < 2 || canvas.height < 2) return null;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  let bounds: PixelBounds | null = null;

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

    const pixelIndex = i / 4;
    bounds = expandBounds(bounds, pixelIndex % canvas.width, Math.floor(pixelIndex / canvas.width));
    pixels[i] = 255;
    pixels[i + 1] = 0;
    pixels[i + 2] = 140;
    pixels[i + 3] = Math.max(alpha, 220);
  }

  context.putImageData(imageData, 0, 0);
  return bounds;
}

function getArtworkVisibleBounds(image: HTMLImageElement): PixelBounds | null {
  if (!image.naturalWidth || !image.naturalHeight) return null;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  let bounds: PixelBounds | null = null;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha <= 8) continue;

    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];
    if (isNearWhite(red, green, blue)) continue;

    const pixelIndex = i / 4;
    bounds = expandBounds(bounds, pixelIndex % canvas.width, Math.floor(pixelIndex / canvas.width));
  }

  return bounds;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = src;
  });
}

function boundsSize(bounds: PixelBounds) {
  return {
    width: bounds.right - bounds.left + 1,
    height: bounds.bottom - bounds.top + 1,
  };
}

async function alignContourToArtwork(
  contourCanvas: HTMLCanvasElement,
  contourBounds: PixelBounds | null,
  artworkUrl?: string | null
): Promise<HTMLCanvasElement> {
  if (!artworkUrl || !contourBounds) return contourCanvas;

  const artwork = await loadImage(artworkUrl);
  const artworkBounds = getArtworkVisibleBounds(artwork);
  if (!artworkBounds) return contourCanvas;

  const sourceSize = boundsSize(contourBounds);
  const targetSize = boundsSize(artworkBounds);
  const hasUsableBounds =
    sourceSize.width > 4 &&
    sourceSize.height > 4 &&
    targetSize.width > 4 &&
    targetSize.height > 4;

  if (!hasUsableBounds) return contourCanvas;

  const targetBounds: PixelBounds = {
    left: (artworkBounds.left / artwork.naturalWidth) * contourCanvas.width,
    top: (artworkBounds.top / artwork.naturalHeight) * contourCanvas.height,
    right: ((artworkBounds.right + 1) / artwork.naturalWidth) * contourCanvas.width - 1,
    bottom: ((artworkBounds.bottom + 1) / artwork.naturalHeight) * contourCanvas.height - 1,
  };
  const mappedTargetSize = boundsSize(targetBounds);

  const alignedCanvas = document.createElement("canvas");
  const context = alignedCanvas.getContext("2d");
  if (!context) return contourCanvas;

  alignedCanvas.width = contourCanvas.width;
  alignedCanvas.height = contourCanvas.height;
  context.drawImage(
    contourCanvas,
    contourBounds.left,
    contourBounds.top,
    sourceSize.width,
    sourceSize.height,
    targetBounds.left,
    targetBounds.top,
    mappedTargetSize.width,
    mappedTargetSize.height
  );

  return alignedCanvas;
}

interface ContourPdfOverlayProps {
  previewUrl?: string | null;
  fileUrl: string;
  alignToImageUrl?: string | null;
  displayMode?: "fit" | "stretch";
  className?: string;
  title?: string;
}

export default function ContourPdfOverlay({
  previewUrl,
  fileUrl,
  alignToImageUrl,
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
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const sourceBuffer: ArrayBuffer = await fetch(fileUrl).then((response) =>
          response.arrayBuffer()
        );
        const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({
          data: new Uint8Array(sourceBuffer),
        }).promise;
        try {
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas context unavailable");
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          await page.render({ canvasContext: context, canvas, viewport }).promise;
          const contourBounds = colorizeContourPreview(canvas);
          const previewCanvas = await alignContourToArtwork(canvas, contourBounds, alignToImageUrl);
          const nextPreviewUrl = previewCanvas.toDataURL("image/png");
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
  }, [alignToImageUrl, fileUrl, previewUrl]);

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
