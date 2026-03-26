import type { Metadata } from "next";
import VinylBannerBuilder from "@/components/product-builder/VinylBannerBuilder";

export const metadata: Metadata = {
  title: "Poster — Signcous",
  description:
    "Order custom posters online with live size pricing and artwork upload.",
};

export default function PosterPage() {
  return (
    <VinylBannerBuilder
      productName="Poster"
      productDescription="Custom poster printing with upload-ready artwork and size-based pricing."
      pricingMode="poster"
      productId={54}
    />
  );
}