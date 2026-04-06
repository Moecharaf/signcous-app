import type { Metadata } from "next";
import Ij35cBuilder from "@/components/product-builder/Ij35cBuilder";

export const metadata: Metadata = {
  title: "3M IJ-35C Adhesive Vinyl - Signcous",
  description:
    "Configure 3M IJ-35C adhesive vinyl with laminate options, contour cut, rush production, and Signs365-style panel splitting.",
};

export default function Ij35cPage() {
  return <Ij35cBuilder productId={135} />;
}
