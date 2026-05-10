import type { Metadata } from "next";
import VinylBannerBuilder from "@/components/product-builder/VinylBannerBuilder";

export const metadata: Metadata = {
  title: "No-Curl Banner — Signcous",
  description:
    "Premium 8mil No-Curl Banner that lays flat and stays flat. Waterproof, tear-resistant, and ideal for trade shows and premium indoor signage.",
};

export default function NoCurlBannerPage() {
  return (
    <VinylBannerBuilder
      productName="No-Curl Banner"
      productDescription=""
      pricingMode="nocurl"
      productId={67}
    />
  );
}