"use client";

import { useEffect, useState } from "react";

function keyOutPageBackground(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context || canvas.width < 2 || canvas.height < 2) return;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const samplePoints = [
    [1, 1],
    [canvas.width - 2, 1],
    [1, canvas.height - 2],
    [canvas.width - 2, canvas.height - 2],
    [Math.floor(canvas.width / 2), 1],
    [Math.floor(canvas.width / 2), canvas.height - 2],
    [1, Math.floor(canvas.height / 2)],
    [canvas.width - 2, Math.floor(canvas.height / 2)],
  ];

  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  let count = 0;

  for (const [x, y] of samplePoints) {
    const idx = (y * canvas.width + x) * 4;
    const alpha = pixels[idx + 3];
    if (alpha === 0) continue;
    bgR += pixels[idx];
    bgG += pixels[idx + 1];
    bgB += pixels[idx + 2];
    count += 1;
  }

  if (count === 0) return;

  bgR /= count;
  bgG /= count;
  bgB /= count;

  const hardCutoff = 24;
  const softCutoff = 52;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha === 0) continue;

    const distance =
      Math.abs(pixels[i] - bgR) +
      Math.abs(pixels[i + 1] - bgG) +
      Math.abs(pixels[i + 2] - bgB);

    if (distance <= hardCutoff) {
      pixels[i + 3] = 0;
    } else if (distance < softCutoff) {
      const blend = (distance - hardCutoff) / (softCutoff - hardCutoff);
      pixels[i + 3] = Math.max(0, Math.min(255, Math.round(alpha * blend)));
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
          try {
            await page.render({ canvasContext: context, canvas, viewport, background: "rgba(0,0,0,0)" } as any).promise;
          } catch {
            await page.render({ canvasContext: context, canvas, viewport }).promise;
          }
          keyOutPageBackground(canvas);

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
