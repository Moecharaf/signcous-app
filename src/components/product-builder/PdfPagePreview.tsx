"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

function isNearWhite(red: number, green: number, blue: number): boolean {
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance >= 242 && maxChannel - minChannel <= 18;
}

function hasVisibleContent(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || canvas.width < 2 || canvas.height < 2) return false;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha <= 8) continue;

    if (!isNearWhite(pixels[i], pixels[i + 1], pixels[i + 2])) return true;
  }

  return false;
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

interface PdfPagePreviewProps {
  fileUrl: string;
  className?: string;
  displayMode?: "fit" | "stretch";
  title?: string;
}

export default function PdfPagePreview({
  fileUrl,
  className = "",
  displayMode = "fit",
  title = "PDF preview",
}: PdfPagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useNativeFallback, setUseNativeFallback] = useState(false);

  useEffect(() => {
    if (!fileUrl) {
      setPreviewUrl(null);
      setUseNativeFallback(false);
      return;
    }

    let cancelled = false;
    setPreviewUrl(null);
    setUseNativeFallback(false);

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
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, canvas, viewport }).promise;
          if (!hasVisibleContent(canvas)) throw new Error("Rendered PDF preview was blank.");
          if (!cancelled) setPreviewUrl(canvas.toDataURL("image/png"));
        } finally {
          await pdf.destroy();
        }
      } catch {
        if (!cancelled) {
          setPreviewUrl(null);
          setUseNativeFallback(true);
        }
      }
    }

    void renderPdfFirstPage();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (useNativeFallback) {
    return (
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=Fit`}
        title={title}
        className={`pointer-events-none ${displayMode === "stretch" ? "h-full w-full" : "h-full w-full"} ${className}`}
        scrolling="no"
      />
    );
  }
  if (!previewUrl) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={previewUrl}
      alt={title}
      className={`${displayMode === "stretch" ? "h-full w-full object-fill" : "h-full w-full object-contain"} ${className}`}
    />
  );
}
