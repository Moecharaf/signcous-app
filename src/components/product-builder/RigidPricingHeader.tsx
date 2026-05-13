"use client";

type PricingRow = {
  label: string;
  value: string;
};

type RigidPricingHeaderProps = {
  productName: string;
  detail: string;
  totalPrice: string;
  middleTitle?: string;
  middleRows: PricingRow[];
  totalSubtext?: string;
  accentClassName?: string;
  overlay?: boolean;
  section?: boolean;
};

export default function RigidPricingHeader({
  productName,
  detail,
  totalPrice,
  middleTitle = "Pricing And Shipping",
  middleRows,
  totalSubtext = "Live total",
  accentClassName = "text-[var(--brand-primary)]",
  overlay = false,
  section = false,
}: RigidPricingHeaderProps) {
  const sectionStyle = section
    ? {
        backgroundImage:
          "linear-gradient(to right, rgba(63,63,70,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.08) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }
    : undefined;

  const wrapperClassName = overlay
    ? "absolute left-1/2 top-3 z-20 w-[min(940px,calc(100%-24px))] -translate-x-1/2 pointer-events-none"
    : section
    ? "bg-[#fafaf9] px-4 py-3"
    : "rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm";

  const innerClassName = overlay
    ? "mx-auto grid w-full max-w-[940px] gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-md backdrop-blur-md md:grid-cols-[0.85fr_1.4fr_0.85fr] md:items-start md:gap-8"
    : "grid gap-3 md:grid-cols-[0.85fr_1.4fr_0.85fr] md:items-start md:gap-8";

  return (
    <div className={wrapperClassName} style={sectionStyle}>
      <div className={innerClassName}>
        <div>
          <div className="text-[27px] leading-[0.98] font-medium uppercase tracking-tight text-zinc-900 md:whitespace-nowrap md:text-[36px]">{productName}</div>
          <div className="mt-1 text-[11px] text-zinc-600 md:text-[12px]">{detail}</div>
        </div>

        <div className="text-center md:pt-1">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{middleTitle}</div>
          <div className="space-y-1 text-[10px] leading-5 text-zinc-600 md:text-[10px]">
            {middleRows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="grid grid-cols-[1fr_auto] gap-4">
                <span className="text-zinc-500">{row.label}</span>
                <span className="font-medium text-zinc-700">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className={`text-[34px] leading-none font-semibold md:text-[44px] ${accentClassName}`}>{totalPrice}</div>
          <div className="mt-1 text-[10px] text-zinc-500">{totalSubtext}</div>
        </div>
      </div>
    </div>
  );
}