import type { Metadata } from "next";
import BootprintsBuilder from "@/components/product-builder/BootprintsBuilder";

export const metadata: Metadata = {
  title: "Outdoor Boot Prints (Heavy-Duty Floor Graphics) - Signcous",
  description:
    "Heavy-duty outdoor floor graphic adhesive panels at $14.95/sq ft. Built for high-traffic exterior environments. Optional contour cut and rush.",
};

export default function BootprintsPage() {
  return <BootprintsBuilder productId={0} />;
}
