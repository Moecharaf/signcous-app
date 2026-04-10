import type { Metadata } from "next";
import OneWayWindowBuilder from "@/components/product-builder/OneWayWindowBuilder";

export const metadata: Metadata = {
  title: "One Way Window (Perforated Vinyl) - Signcous",
  description:
    "One Way Window perforated vinyl builder with tiered area-based pricing, 50in strict panel splitting, 50/50 & 70/30 materials, optional laminate, and contour cut.",
};

export default function OneWayWindowPage() {
  return <OneWayWindowBuilder productId={0} />;
}
