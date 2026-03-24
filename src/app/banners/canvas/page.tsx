import type { Metadata } from "next";
import VinylBannerBuilder from "@/components/product-builder/VinylBannerBuilder";

export const metadata: Metadata = {
  title: "Canvas — Signcous",
  description:
    "Order custom canvas prints online with live size pricing and artwork upload.",
};

export default function CanvasPage() {
  return (
    <VinylBannerBuilder
      productName="Canvas"
      pricingMode="canvas"
      productId={60}
    />
  );
}
