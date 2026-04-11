import type { Metadata } from "next";
import FootprintsBuilder from "@/components/product-builder/FootprintsBuilder";

export const metadata: Metadata = {
  title: "Footprints (Floor Graphics) - Signcous",
  description:
    "Custom floor graphic adhesive panels priced at $3.10/sq ft. Dimensions billed to the nearest whole foot. Optional contour cut and rush available.",
};

export default function FootprintsPage() {
  return <FootprintsBuilder productId={0} />;
}
