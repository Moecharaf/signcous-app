import type { Metadata } from "next";
import VinylBannerBuilder from "@/components/product-builder/VinylBannerBuilder";

export const metadata: Metadata = {
  title: "Vinyl Banners — Signcous",
  description:
    "Order custom vinyl banners online with live pricing. Any size, grommets, pole pockets, hemming, and rush options available.",
};

export default function VinylBannerPage() {
  return (
    <VinylBannerBuilder />
  );
}
