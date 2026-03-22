import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed — Signcous",
};

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string; total?: string };
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center text-white">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-4xl">
        ✓
      </div>

      <h1 className="mt-6 text-3xl font-black tracking-tight">
        Order Confirmed!
      </h1>
      <p className="mt-3 text-zinc-400">
        Thank you for your order. We&apos;ve received it and will begin
        processing shortly. A confirmation email will be sent to you.
      </p>

      {searchParams.orderId && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950 px-6 py-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Order Number
          </p>
          <p className="mt-2 text-3xl font-black text-orange-400">
            #{searchParams.orderId}
          </p>
          {searchParams.total && (
            <p className="mt-2 text-sm text-zinc-400">
              Total:{" "}
              <span className="font-semibold text-zinc-200">
                ${searchParams.total}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/banners/vinyl-banner"
          className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-colors"
        >
          Order Another Banner
        </Link>
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
