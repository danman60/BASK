// ChartPlate — the v6 camera primitive.
//
// v5 cut scrolled past its numbers and the film needs figures that move.
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { T, DISPLAY, BODY, E } from '../../tokens';

export type ChartPlateProps = {
  series: number[];
  label: string;
  fromLabel: string;
  toLabel: string;
  fromValue: string;
  toValue: string;
  accent?: boolean;
};

export const ChartPlate: React.FC<ChartPlateProps> = ({
  series,
  label,
  fromLabel,
  toLabel,
  fromValue,
  toValue,
  accent = false,
}) => {
  const f = useCurrentFrame();
  
  // Plate animation (fade and scale)
  const plateOpacity = interpolate(f, [0, 14], [0, 1], { 
    extrapolateLeft: 'clamp', 
    extrapolateRight: 'clamp',
    easing: E.easeOut
  });
  
  const plateScale = interpolate(f, [0, 14], [0.96, 1], { 
    extrapolateLeft: 'clamp', 
    extrapolateRight: 'clamp',
    easing: E.easeOut
  });

  // Line animation (strokeDashoffset)
  const lineStart = interpolate(f, [8, 46], [0, 1], { 
    extrapolateLeft: 'clamp', 
    extrapolateRight: 'clamp',
    easing: E.easeOut
  });

  // Label fade in
  const fromLabelOpacity = interpolate(f, [30, 40], [0, 1], { 
    extrapolateLeft: 'clamp', 
    extrapolateRight: 'clamp',
    easing: E.easeOut
  });
  
  const toLabelOpacity = interpolate(f, [40, 50], [0, 1], { 
    extrapolateLeft: 'clamp', 
    extrapolateRight: 'clamp',
    easing: E.easeOut
  });

  /* Normalise into the viewBox between the series MIN and MAX, not from zero.
     A tanning salon's attachment rate moves between 8.8% and 5.7%; scaled
     against zero those two points sit within a few pixels of each other at the
     top of the box and the "drop" the film is narrating is invisible. 12% of
     the height is left as padding top and bottom so the line never touches the
     frame edge. */
  // Plate geometry. 640x220 was the generated default and rendered as a
  // postage stamp on a 1920 frame.
  const W = 1180;
  const H = 430;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = hi - lo || 1;
  const PAD = 34;
  const pts = series.map((value, i) => {
    const x = (i / Math.max(series.length - 1, 1)) * W;
    const y = H - PAD - ((value - lo) / span) * (H - PAD * 2);
    return [x, y] as const;
  });
  const normalizedPoints = pts.map(([x, y]) => `${x},${y}`).join(' ');

  /* The REAL polyline length — the sum of its segments. The first pass measured
     the hypotenuse from the first point to the last, which is shorter than the
     drawn path on any line that changes direction, so the dash never covered
     the stroke and the "draw on" started with the line already half visible. */
  let pathLength = 0;
  for (let i = 1; i < pts.length; i++) {
    pathLength += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${plateScale})`,
          opacity: plateOpacity,
          width: W,
          height: H + 150,
        }}
      >
        {/* A soft card behind the figure. Without it the page copy underneath
            runs straight through the label and the readings — in context is the
            point, but the figure still has to win the frame. */}
        <div
          style={{
            position: 'absolute',
            left: -56,
            top: -46,
            right: -56,
            bottom: -30,
            backgroundColor: T.paper,
            opacity: 0.86,
            borderRadius: 26,
          }}
        />

        {/* The metric being drawn, stated once, above the line. */}
        <div
          style={{
            fontFamily: BODY,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.inkFaint,
            marginBottom: 18,
            position: 'relative',
          }}
        >
          {label}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', position: 'relative' }}>
          {/* A soft fill under the line, the same shape the product's own
              sparkline uses. Without it a 3px stroke on a 1920 frame reads as a
              hairline scratch rather than as a figure. */}
          <polygon
            points={`0,${H} ${normalizedPoints} ${W},${H}`}
            fill={accent ? T.cAmber : T.ink}
            opacity={0.1 * lineStart}
          />
          <polyline
            points={normalizedPoints}
            fill="none"
            stroke={accent ? T.cAmber : T.ink}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength}
            /* (1 - progress), not progress. Written the other way round the line
               starts FULLY DRAWN and erases itself to nothing — it compiled
               perfectly and did the exact opposite of what the shot needs. */
            strokeDashoffset={(1 - lineStart) * pathLength}
          />
          {/* The endpoint, arriving with the line. */}
          <circle
            cx={pts[pts.length - 1][0]}
            cy={pts[pts.length - 1][1]}
            r={9}
            fill={accent ? T.cAmber : T.ink}
            opacity={toLabelOpacity}
          />
        </svg>

        {/* The two readings sit UNDER THE ENDS OF THE LINE they describe — the
            first pass stacked all four labels in the top-left corner where they
            overlapped each other and said nothing about which end was which. */}
        <div style={{ position: 'relative', height: 96, zIndex: 1 }}>
          <div style={{ position: 'absolute', left: 0, top: 16, opacity: fromLabelOpacity }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 62, fontWeight: 600, color: T.inkSoft, lineHeight: 1 }}>
              {fromValue}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 24, color: T.inkFaint, marginTop: 8 }}>{fromLabel}</div>
          </div>
          <div style={{ position: 'absolute', right: 0, top: 16, textAlign: 'right', opacity: toLabelOpacity }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 62,
                fontWeight: 600,
                color: accent ? T.cAmber : T.ink,
                lineHeight: 1,
              }}
            >
              {toValue}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 24, color: T.inkFaint, marginTop: 8 }}>{toLabel}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
