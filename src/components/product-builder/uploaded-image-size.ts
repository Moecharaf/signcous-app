const DEFAULT_IMAGE_DPI = 150;
const PDF_POINTS_PER_INCH = 72;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface UploadedImageSize {
  widthInches: number;
  heightInches: number;
}

export async function getUploadedImageSizeInches(file: File): Promise<UploadedImageSize | null> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) return null;

  const blobUrl = isImage ? URL.createObjectURL(file) : null;
  try {
    let widthInches: number;
    let heightInches: number;

    if (isPdf) {
      const pdfjsLib = await import("pdfjs-dist");
      const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer(), disableWorker: true } as any);
      const pdf = await loadingTask.promise;
      try {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        widthInches = Math.max(0.1, roundToTwo(viewport.width / PDF_POINTS_PER_INCH));
        heightInches = Math.max(0.1, roundToTwo(viewport.height / PDF_POINTS_PER_INCH));
      } finally {
        await pdf.destroy();
      }
    } else {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        };
        image.onerror = () => reject(new Error("Could not read image dimensions."));
        image.src = blobUrl!;
      });

      widthInches = Math.max(0.1, roundToTwo(dimensions.width / DEFAULT_IMAGE_DPI));
      heightInches = Math.max(0.1, roundToTwo(dimensions.height / DEFAULT_IMAGE_DPI));
    }

    return { widthInches, heightInches };
  } catch {
    return null;
  } finally {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
