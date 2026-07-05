"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

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

  useEffect(() => {
    if (!fileUrl) {
      setPreviewUrl(null);
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
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, canvas, viewport }).promise;
          if (!cancelled) setPreviewUrl(canvas.toDataURL("image/png"));
        } finally {
          await pdf.destroy();
        }
      } catch {
        if (!cancelled) setPreviewUrl(null);
      }
    }

    void renderPdfFirstPage();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

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
