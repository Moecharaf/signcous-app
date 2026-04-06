import type { Metadata } from "next";
import PrintWrapFilmBuilder from "@/components/product-builder/PrintWrapFilmBuilder";

export const metadata: Metadata = {
  title: "3M Print Wrap Film - Signcous",
  description:
    "Configure 3M Print Wrap Film with custom sizing, laminate options, contour cut, rush, and 52-inch panel splitting.",
};

export default function PrintWrapFilmPage() {
  return <PrintWrapFilmBuilder productId={136} />;
}
