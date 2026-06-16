const DEFAULT_IMAGE_DPI = 150;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface UploadedImageSize {
  widthInches: number;
  heightInches: number;
}

export async function getUploadedImageSizeInches(file: File): Promise<UploadedImageSize | null> {
  if (!file.type.startsWith("image/")) return null;

  const blobUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };
      image.onerror = () => reject(new Error("Could not read image dimensions."));
      image.src = blobUrl;
    });

    const widthInches = Math.max(0.1, roundToTwo(dimensions.width / DEFAULT_IMAGE_DPI));
    const heightInches = Math.max(0.1, roundToTwo(dimensions.height / DEFAULT_IMAGE_DPI));

    return { widthInches, heightInches };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
