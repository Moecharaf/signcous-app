"use client";

// ── Shared dimension utilities ────────────────────────────────────────────────

export function parseDimensionPart(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function composeDimensionInches(feet: string, inches: string): number {
  return parseDimensionPart(feet) * 12 + parseDimensionPart(inches);
}

export function toFeetAndInches(totalInches: number): { feet: string; inches: string } {
  const safe = Math.max(0, totalInches);
  const f = Math.floor(safe / 12);
  const i = Number((safe - f * 12).toFixed(2));
  return {
    feet: String(f),
    inches: Number.isInteger(i) ? String(i) : i.toString(),
  };
}

export function normalizeDimension(feet: string, inches: string): { feet: string; inches: string } {
  const rawIn = parseDimensionPart(inches);
  if (rawIn < 12) return { feet, inches };
  const totalIn = parseDimensionPart(feet) * 12 + rawIn;
  return toFeetAndInches(totalIn);
}

/** Format total-inch values into "49" x 26"" style label for the toolbar button. */
export function formatSizeLabel(widthIn: number, heightIn: number): string {
  if (widthIn <= 0 || heightIn <= 0) return "Set dimensions";
  const fmt = (v: number) =>
    Number.isInteger(v) ? `${v}"` : `${parseFloat(v.toFixed(2))}"`;
  return `${fmt(widthIn)} x ${fmt(heightIn)}`;
}

// ── Internal DimRow ───────────────────────────────────────────────────────────

interface DimRowProps {
  label: string;
  feet: string;
  inches: string;
  onFeetChange: (v: string) => void;
  onInchesChange: (v: string) => void;
  onNormalize: (newFeet: string, newInches: string) => void;
}

function DimRow({ label, feet, inches, onFeetChange, onInchesChange, onNormalize }: DimRowProps) {
  function handleBlur() {
    const rawIn = parseDimensionPart(inches);
    if (rawIn >= 12) {
      const n = normalizeDimension(feet, inches);
      onNormalize(n.feet, n.inches);
    }
  }

  const inputCls =
    "h-8 w-[52px] rounded border border-zinc-300 bg-white px-1.5 text-center text-sm tabular-nums transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300";
  const labelCls = "text-[11px] font-medium text-zinc-400";

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {label}:
      </span>
      <input
        type="number"
        min={0}
        step={1}
        value={feet}
        onChange={(e) => onFeetChange(e.target.value)}
        onBlur={handleBlur}
        className={inputCls}
      />
      <span className={labelCls}>ft</span>
      <input
        type="number"
        min={0}
        step={0.25}
        value={inches}
        onChange={(e) => onInchesChange(e.target.value)}
        onBlur={handleBlur}
        className={inputCls}
      />
      <span className={labelCls}>in</span>
    </div>
  );
}

// ── SizeInputPanel ────────────────────────────────────────────────────────────

export interface SizeInputPanelProps {
  widthFeet: string;
  widthInches: string;
  heightFeet: string;
  heightInches: string;
  onWidthFeetChange: (v: string) => void;
  onWidthInchesChange: (v: string) => void;
  onHeightFeetChange: (v: string) => void;
  onHeightInchesChange: (v: string) => void;
  onWidthNormalize: (feet: string, inches: string) => void;
  onHeightNormalize: (feet: string, inches: string) => void;
  /** Validation error string shown below the inputs. */
  error?: string | null | false;
  /** Optional hint text shown below the inputs. */
  helper?: string;
}

export default function SizeInputPanel({
  widthFeet,
  widthInches,
  heightFeet,
  heightInches,
  onWidthFeetChange,
  onWidthInchesChange,
  onHeightFeetChange,
  onHeightInchesChange,
  onWidthNormalize,
  onHeightNormalize,
  error,
  helper,
}: SizeInputPanelProps) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        Sign size
      </div>
      <DimRow
        label="width"
        feet={widthFeet}
        inches={widthInches}
        onFeetChange={onWidthFeetChange}
        onInchesChange={onWidthInchesChange}
        onNormalize={onWidthNormalize}
      />
      <DimRow
        label="height"
        feet={heightFeet}
        inches={heightInches}
        onFeetChange={onHeightFeetChange}
        onInchesChange={onHeightInchesChange}
        onNormalize={onHeightNormalize}
      />
      {error && (
        <div className="text-xs font-medium text-red-600">{error}</div>
      )}
      {helper && (
        <div className="text-[11px] leading-4 text-zinc-500">{helper}</div>
      )}
    </div>
  );
}
