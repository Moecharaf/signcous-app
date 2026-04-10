import type { Metadata } from "next";
import GF830Builder from "@/components/product-builder/GF830Builder";

export const metadata: Metadata = {
  title: "GF830 AutoMark (Wrap Vinyl) - Signcous",
  description:
    "GF830 AutoMark wrap vinyl builder with tiered area-based pricing, 60in panel splitting, laminate options, contour cut, and rush production.",
};

export default function GF830Page() {
  return <GF830Builder productId={0} />;
}
