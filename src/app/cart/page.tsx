"use client";

import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function LineItemCard({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCart();
  const customOptionEntries = Object.entries(item.customOptions ?? {});

  const labelMap: Record<string, string> = {
    custom_sheet_size: "Sheet Size",
    custom_signs_per_sheet: "Signs / Sheet",
    custom_sheets_required: "Sheets",
    custom_print_mode: "Print",
    custom_step_stakes: "Step Stakes",
    custom_heavy_duty_stakes: "Heavy Stakes",
    custom_grommet_count: "Grommet Count",
    custom_gloss: "Gloss",
    custom_contour_cut: "Contour Cut",
    custom_rush_surcharge_mode: "Rush",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-zinc-100">{item.productName}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {item.width} × {item.height} {item.unit} · {item.material}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-500">
            {item.doubleSided && <span>Double-sided</span>}
            {item.grommets && <span>Grommets</span>}
            {item.edgeFinish && item.edgeFinish !== "none" && <span>Edge: {item.edgeFinish}</span>}
            {item.polePockets && <span>Pole pockets</span>}
            {item.windSlits && <span>Wind slits</span>}
            {item.hemming && <span>Hemming</span>}
            {item.rush && <span className="text-orange-400">Rush</span>}
            {customOptionEntries.map(([key, value]) => (
              <span key={key}>{labelMap[key] ?? key.replace(/^custom_/, "").replace(/_/g, " ")}: {value}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-zinc-100">
            {formatPrice(item.totalPrice)}
          </p>
          <p className="text-xs text-zinc-500">
            {formatPrice(item.unitPrice)} / unit
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs text-zinc-400">Qty</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800"
          >
            +
          </button>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="ml-auto text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-white">
        <h1 className="text-4xl font-black tracking-tight">Your Cart</h1>
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-950 py-20 text-center">
          <div className="text-5xl">🛒</div>
          <h2 className="mt-6 text-2xl font-bold">Your cart is empty</h2>
          <p className="mt-3 text-zinc-400">Add a product to get started.</p>
          <Link
            href="/"
            className="mt-8 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold hover:bg-orange-400 transition-colors"
          >
            Shop Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 text-white">
      <h1 className="text-4xl font-black tracking-tight">Your Cart</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Line items */}
        <div className="space-y-4">
          {items.map((item) => (
            <LineItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* Order summary */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm text-zinc-400">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.productName} ×{item.quantity}
                </span>
                <span className="text-zinc-200">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Shipping calculated at checkout
            </p>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-colors"
          >
            Proceed to Checkout →
          </Link>
          <Link
            href="/banners/vinyl-banner"
            className="mt-3 block w-full rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-400 hover:bg-white/5 transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
