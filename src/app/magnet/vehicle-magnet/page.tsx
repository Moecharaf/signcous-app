import type { Metadata } from "next";
import VehicleMagnetBuilder from "@/components/product-builder/VehicleMagnetBuilder";

export const metadata: Metadata = {
  title: "Vehicle Magnet — Signcous",
  description:
    "Order single-sided vehicle magnets with fixed size options, rounded corners, rush production, and artwork upload.",
};

export default function VehicleMagnetPage() {
  return <VehicleMagnetBuilder />;
}
