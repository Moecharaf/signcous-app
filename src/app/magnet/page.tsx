import type { Metadata } from "next";
import CustomMagnetBuilder from "@/components/product-builder/CustomMagnetBuilder";

export const metadata: Metadata = {
  title: "Custom Magnets — Signcous",
  description:
    "Build custom-size single-sided magnets with contour cut, rush production, rounded corners, and artwork upload.",
};

export default function MagnetPage() {
  return <CustomMagnetBuilder />;
}
