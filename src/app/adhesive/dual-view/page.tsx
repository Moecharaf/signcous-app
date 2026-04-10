import type { Metadata } from "next";
import DualViewBuilder from "@/components/product-builder/DualViewBuilder";

export const metadata: Metadata = {
  title: "Dual View - Signcous",
  description:
    "Dual View window graphic builder with single and double-sided options, tiered pricing, 52in panel splitting, and contour cut.",
};

export default function DualViewPage() {
  return <DualViewBuilder productId={0} />;
}
