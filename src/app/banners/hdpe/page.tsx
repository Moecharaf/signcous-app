import type { Metadata } from "next";
import HdpeBuilder from "@/components/product-builder/HdpeBuilder";

export const metadata: Metadata = {
  title: "HDPE Signs — Signcous",
  description:
    "Order custom HDPE signs online with simple size-based pricing and artwork upload.",
};

export default function HdpePage() {
  return <HdpeBuilder />;
}
