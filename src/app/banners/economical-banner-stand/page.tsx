import type { Metadata } from "next";
import VinylBannerBuilder from "@/components/product-builder/VinylBannerBuilder";

export const metadata: Metadata = {
  title: "Economical Banner Stand — Signcous",
  description:
    "Order the Economical Banner Stand with a standard 33.5 x 80 single-sided print at a fixed $130 per banner.",
};

export default function EconomicalBannerStandPage() {
  return (
    <VinylBannerBuilder
      productName="Economical Banner Stand"
      productDescription='Standard 33.5" x 80" single-sided banner stand at $130 per banner.'
      pricingMode="economical-stand"
      productId={124}
    />
  );
}
