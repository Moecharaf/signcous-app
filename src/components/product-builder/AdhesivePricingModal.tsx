"use client";

import { useMemo, useState } from "react";
import {
  ADHESIVE_MARKUP,
  type AdhesivePricingConfig,
  type AdhesiveRateRow,
  type AdhesiveShippingTable,
} from "@/components/product-builder/adhesive-pricing-data";

interface AdhesivePricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AdhesivePricingConfig;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatRate(row: AdhesiveRateRow, value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const base = formatPrice(rounded);
  return row.suffix ? `${base} ${row.suffix}` : base;
}

function renderShippingTable(table: AdhesiveShippingTable) {
  return (
    <table className="w-full border-collapse" key={table.rowLabel}>
      <thead>
        <tr className="text-zinc-600">
          <th className="pb-1 text-left font-semibold">{table.rowLabel}</th>
          {table.headers.map((header) => (
            <th key={`${table.rowLabel}-${header}`} className="pb-1 text-left font-semibold">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="align-top">
        <tr>
          <td className="py-0.5">Shipping</td>
          {table.values.map((value, index) => (
            <td key={`${table.rowLabel}-retail-${index}`} className="py-0.5">
              {formatPrice(value * ADHESIVE_MARKUP)}
              {table.freightIndexes?.includes(index) ? " (freight)" : ""}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

export default function AdhesivePricingModal({ isOpen, onClose, config }: AdhesivePricingModalProps) {
  const [activeTab, setActiveTab] = useState<"pricing" | "shipping">("pricing");

  const pricingRows = useMemo(() => config.pricingRows, [config.pricingRows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-[620px] rounded-sm bg-white p-4 shadow-2xl">
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600">{config.title}</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.04em] text-zinc-700">
                  <th className="pb-1 text-left font-bold">Item</th>
                  <th className="pb-1 text-left font-bold">Signs365 Base</th>
                  <th className="pb-1 text-left font-bold">Signcous (+50%)</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {pricingRows.map((row) => (
                  <tr key={row.label}>
                    <td className="py-0.5">{row.label}</td>
                    <td className="py-0.5">{formatRate(row, row.base)}</td>
                    <td className="py-0.5">{formatRate(row, row.base * ADHESIVE_MARKUP)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="w-full border-collapse">
              <tbody className="align-top">
                {config.addOnRates.map((row) => (
                  <tr key={row.label}>
                    <td className="py-0.5">{row.label}</td>
                    <td className="py-0.5">{formatRate(row, row.base)}</td>
                    <td className="py-0.5">{formatRate(row, row.base * ADHESIVE_MARKUP)}</td>
                  </tr>
                ))}
                {config.addOnText.map((row) => (
                  <tr key={row.label}>
                    <td className="py-0.5">{row.label}</td>
                    <td className="py-0.5">{row.text}</td>
                    <td className="py-0.5">{row.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3 py-1 text-[11px] text-zinc-700">{config.shippingTables.map(renderShippingTable)}</div>
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
