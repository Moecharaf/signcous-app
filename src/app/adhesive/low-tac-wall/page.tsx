import type { Metadata } from "next";
import LowTacWallBuilder from "@/components/product-builder/LowTacWallBuilder";

export const metadata: Metadata = {
  title: "Removable Wall Decals (Low-Tac Wall Graphics) - Signcous",
  description:
    "Repositionable low-tac wall graphics at $4.25/sq ft. Easy to apply and remove without residue. Optional contour cut and rush available.",
};

export default function LowTacWallPage() {
  return <LowTacWallBuilder productId={0} />;
}
