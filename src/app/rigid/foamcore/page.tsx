import type { Metadata } from "next";
import FoamcoreBuilder from "@/components/product-builder/FoamcoreBuilder";

export const metadata: Metadata = {
  title: "Foamcore Rigid Signs - Signcous",
  description:
    "Configure custom FOAMCORE rigid signs with Signs365-style sheet layout, tier-based pricing, and add-on options.",
};

export default function FoamcoreRigidPage() {
  return <FoamcoreBuilder productName="FOAMCORE" />;
}
