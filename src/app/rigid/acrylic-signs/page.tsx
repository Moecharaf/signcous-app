import type { Metadata } from "next";
import AcrylicBuilder from "@/components/product-builder/AcrylicBuilder";

export const metadata: Metadata = {
  title: "Acrylic Signs - Signcous",
  description:
    "Custom acrylic signs priced by square inch. Choose thickness, standoff hardware, rounded corners, and more. Premium rigid signage for offices, lobbies, and wall-mounted displays.",
};

export default function AcrylicSignsPage() {
  return <AcrylicBuilder productId={0} />;
}
