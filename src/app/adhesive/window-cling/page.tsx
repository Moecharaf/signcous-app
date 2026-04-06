import type { Metadata } from "next";
import WindowClingBuilder from "@/components/product-builder/WindowClingBuilder";

export const metadata: Metadata = {
  title: "Window Cling - Signcous",
  description:
    "Configure custom window cling graphics with square-inch pricing, inside/outside application and viewable options, and optional contour cut.",
};

export default function WindowClingPage() {
  return <WindowClingBuilder productId={137} />;
}
