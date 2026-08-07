import type { ReactNode } from 'react';

/**
 * Small presentational parts shared by Inventory and Insights.
 *
 * These are deliberately NOT in `@bask/ui` — Lane 1 owns that package for M1
 * (merge protocol in the plan file). `GapSlider`, `StatRow` and `WhisperNote`
 * are DESIGN_SPEC §4 vocabulary and should be promoted into `@bask/ui` once the
 * lanes merge; the names here match the spec so that promotion is a move, not a
 * rewrite.
 */

export function Chip({
  tone,
  children,
  dot = false,
}: {
  tone:
    | 'critical'
    | 'reorder'
    | 'watch'
    | 'healthy'
    | 'overstock'
    | 'accent'
    | 'good'
    | 'bad'
    | 'neutral';
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className="l4-chip" data-tone={tone}>
      {dot && <span className="l4-chip-dot" aria-hidden />}
      {children}
    </span>
  );
}

export function StatRow({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="l4-stat-row">
      <span className="l4-stat-label">
        {label}
        {hint && (
          <>
            {' '}
            <span style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-xs)' }}>{hint}</span>
          </>
        )}
      </span>
      <span className="l4-stat-value num">{value}</span>
    </div>
  );
}

export function SectionHead({
  title,
  note,
  aside,
}: {
  title: ReactNode;
  note?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="l4-section-head">
      <div>
        <h2 className="l4-section-title">{title}</h2>
        {note && <p className="l4-note">{note}</p>}
      </div>
      {aside}
    </div>
  );
}

/**
 * Sparkline — amber stroke, no axes (DESIGN_SPEC §3.1). Rendered as inline SVG
 * so it costs no JavaScript and prints.
 */
export function Sparkline({
  points,
  stroke = 'var(--gold)',
  label,
}: {
  points: Array<{ value: number }>;
  stroke?: string;
  label: string;
}) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 100;
  const height = 30;

  const d = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      className="l4-spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Catalogue tile. There are no product photographs in this dataset and inventing
 * them would be exactly the kind of fake asset DESIGN_SPEC's slop test rules out,
 * so the tile is a deterministic colour-and-initials chip derived from the SKU —
 * it reads as a bottle on a shelf without pretending to be a photograph.
 */
const CATEGORY_HUES: Record<string, number> = {
  bronzer: 42,
  accelerator: 78,
  aftercare: 200,
  face: 330,
  spray_solution: 24,
  wellness: 155,
  kit: 300,
  accessory: 260,
};

export function ProductSwatch({
  sku,
  category,
  size = 'sm',
}: {
  sku: string;
  category: string | null;
  size?: 'sm' | 'lg';
}) {
  const hue = CATEGORY_HUES[category ?? ''] ?? 42;
  // Deterministic per-SKU lightness so two bronzers do not look identical.
  const seed = [...sku].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const lightness = 52 + (seed % 5) * 4;

  return (
    <span
      className={size === 'lg' ? 'l4-order-swatch' : 'l4-swatch'}
      style={{
        background: `linear-gradient(160deg, oklch(${lightness + 10}% 0.11 ${hue}), oklch(${lightness}% 0.13 ${hue}))`,
      }}
      aria-hidden
    >
      {sku.replace('BSK-', '')}
    </span>
  );
}

/**
 * Evidence sentence with `**bold**` numbers (DESIGN_SPEC §5). The engine writes
 * the markers; this renders them without pulling in a markdown dependency.
 */
export function EvidenceSentence({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="l4-evidence">
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <b key={index} className="num">
            {part.slice(2, -2)}
          </b>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}
