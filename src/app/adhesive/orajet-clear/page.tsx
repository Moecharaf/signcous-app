import type { Metadata } from "next";
import OrajetClearBuilder from "@/components/product-builder/OrajetClearBuilder";

export const metadata: Metadata = {
  title: "Orajet Clear (Translucent Clear Vinyl) - Signcous",
  description:
    "Orajet Clear translucent vinyl builder with tiered area-based pricing, 54in panel splitting, laminate options, contour cut, and rush production.",
};

export default function OrajetClearPage() {
  return <OrajetClearBuilder productId={0} />;
}
