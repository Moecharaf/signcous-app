import type { Metadata } from "next";
import CoroBuilder from "@/components/product-builder/CoroBuilder";

export const metadata: Metadata = {
  title: "Coro Rigid Signs - Signcous",
  description:
    "Configure custom CORO rigid signs with Signs365-style sheet layout, live pricing, and add-on options.",
};

export default function CoroRigidPage() {
  return <CoroBuilder productId={13} productName="CORO" />;
}
