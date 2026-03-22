import type { Metadata } from "next";
import VinylBannerBuilder from "@/components/product-builder/VinylBannerBuilder";

export const metadata: Metadata = {
  title: "Mesh Banners — Signcous",
  description:
    "Order custom mesh banners online with live pricing, edge finishing, grommets, pole pockets, and rush options.",
};

export default function MeshBannerPage() {
  return <VinylBannerBuilder initialMaterial="Mesh Banner" productName="Mesh Banner" />;
}
