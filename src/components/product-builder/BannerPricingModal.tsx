"use client";

import { useState } from "react";

type PricingRow = {
  label: string;
  values: string[];
};

type AddOnRow = {
  label: string;
  value: string;
};

type ShippingRow = {
  label: string;
  value: string;
};

interface BannerPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricingColumns: string[];
  pricingRows: PricingRow[];
  addOnRows: AddOnRow[];
  shippingRows: ShippingRow[];
  markup: number;
}

export default function BannerPricingModal({
  isOpen,
  onClose,
  pricingColumns,
  pricingRows,
  addOnRows,
  shippingRows,
  markup,
}: BannerPricingModalProps) {
  const [activeTab, setActiveTab] = useState<"pricing" | "shipping">("pricing");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-[560px] rounded-sm bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-4 inline-flex rounded border border-zinc-300 bg-zinc-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`min-w-[88px] px-3 py-1 ${
              activeTab === "pricing" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
            }`}
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shipping")}
            className={`min-w-[88px] px-3 py-1 ${
              activeTab === "shipping" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
            }`}
          >
            Shipping
          </button>
        </div>

        {activeTab === "pricing" ? (
          <div className="space-y-4 text-xs text-zinc-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.04em] text-zinc-700">
                  <th className="pb-1 text-left font-bold">Per Quantity Pricing</th>
                  {pricingColumns.map((column) => (
                    <th key={column} className="pb-1 text-left font-bold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="align-top">
                {pricingRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-0.5">{row.label}</td>
                    {row.values.map((value, idx) => (
                      <td key={`${row.label}-${idx}`} className="py-0.5">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {addOnRows.length > 0 && (
              <table className="w-full border-collapse">
                <tbody className="align-top">
                  {addOnRows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-0.5">{row.label}</td>
                      <td className="py-0.5 text-right">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-1 text-[11px] text-zinc-700">
            <table className="w-full border-collapse">
              <tbody className="align-top">
                {shippingRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-0.5">{row.label}</td>
                    <td className="py-0.5 text-right">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] text-zinc-600">
              Shipping rates displayed to customers include a 50% markup (supplier rate x {markup.toFixed(2)}).
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 items-center justify-center rounded bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
