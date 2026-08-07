/**
 * Sparkline — amber stroke, no axes (DESIGN_SPEC §3.1).
 *
 * Deliberately dumb: it takes numbers, not an Evidence object, so the same
 * component draws an insight trend, a Compass evidence tile and (later) a Peers
 * band. The caller decides which series is worth drawing — a card only gets a
 * sparkline when its Evidence actually carries one.
 *
 * No axes, no grid, no tooltip. It is there for the SHAPE. Anyone who wants the
 * reading opens "Show me why", which draws the same series big with labels.
 */

export interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  /** Accessible description — the card knows the direction, this component doesn't. */
  label: string;
  /** Stroke colour token. Amber is the default and the design rule. */
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}

/** Maps values onto a 0..width / 0..height box with a hairline of padding. */
export function sparklinePoints(
  values: readonly number[],
  width: number,
  height: number,
  pad = 2,
): string {
  if (values.length === 0) return '';
  if (values.length === 1) return `0,${height / 2} ${width},${height / 2}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const usable = height - pad * 2;
  const step = width / (values.length - 1);

  return values
    .map((value, index) => {
      // A flat series has no span to scale against — draw it down the middle
      // rather than dividing by zero and painting a NaN path.
      const ratio = span === 0 ? 0.5 : (value - min) / span;
      const y = pad + (1 - ratio) * usable;
      return `${round(index * step)},${round(y)}`;
    })
    .join(' ');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function Sparkline({
  values,
  width = 150,
  height = 26,
  label,
  stroke = 'var(--warn)',
  strokeWidth = 2,
  className,
}: SparklineProps) {
  if (values.length < 2) return null;

  return (
    <svg
      className={['b-spark', className].filter(Boolean).join(' ')}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      data-testid="sparkline"
    >
      <polyline
        points={sparklinePoints(values, width, height)}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
