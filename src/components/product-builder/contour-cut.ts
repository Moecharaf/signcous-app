import type { UploadedImageSize } from "@/components/product-builder/uploaded-image-size";

export const CONTOUR_SIZE_TOLERANCE_INCHES = 0.05;

export function contourSizesMatch(
  artworkSize: UploadedImageSize,
  contourSize: UploadedImageSize,
  toleranceInches: number = CONTOUR_SIZE_TOLERANCE_INCHES
): boolean {
  return (
    Math.abs(artworkSize.widthInches - contourSize.widthInches) <= toleranceInches &&
    Math.abs(artworkSize.heightInches - contourSize.heightInches) <= toleranceInches
  );
}

export function formatSizeForMessage(size: UploadedImageSize): string {
  return `${size.widthInches.toFixed(2)} x ${size.heightInches.toFixed(2)} in`;
}
