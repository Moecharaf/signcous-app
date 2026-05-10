import type { Metadata } from "next";
import VinylBannerBuilder from "@/components/product-builder/VinylBannerBuilder";

export const metadata: Metadata = {
  title: "HDPE Signs — Signcous",
  description:
    "Order custom HDPE signs online with simple size-based pricing and artwork upload.",
};

export default function HdpePage() {
  return (
    <VinylBannerBuilder
      productName="HDPE Sign"
      pricingMode="hdpe"
      productId={56}
    />
  );
}
