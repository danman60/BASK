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

  // Normalize series points to 640x220 viewBox
  const normalizedPoints = series.map((value, i) => {
    const x = (i / (series.length - 1)) * 640;
    const y = 220 - (value / Math.max(...series, 1)) * 220;
    return `${x},${y}`;
  }).join(' ');

  // Calculate path length for strokeDashoffset
  const pathLength = series.length > 1 ? 
    Math.sqrt(
      Math.pow(series[series.length - 1] - series[0], 2) + 
      Math.pow(640, 2)
    ) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      <div 
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${plateScale})`,
          opacity: plateOpacity,
          width: 640,
          height: 220,
        }}
      >
        <svg 
          viewBox="0 0 640 220" 
          width="640" 
          height="220"
          style={{ display: 'block' }}
        >
          <polyline
            points={normalizedPoints}
            fill="none"
            stroke={accent ? T.cAmber : T.ink}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength}
            strokeDashoffset={lineStart * pathLength}
            style={{
              transition: 'stroke-dashoffset 0.1s ease-out',
            }}
          />
        </svg>
        
        {/* From label */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 200,
            opacity: fromLabelOpacity,
            fontFamily: DISPLAY,
            fontSize: 24,
            fontWeight: 600,
            color: T.ink,
            letterSpacing: '-0.02em',
          }}
        >
          {fromLabel}
        </div>
        
        {/* From value */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 170,
            opacity: fromLabelOpacity,
            fontFamily: BODY,
            fontSize: 32,
            fontWeight: 600,
            color: T.ink,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fromValue}
        </div>
        
        {/* To label */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 140,
            opacity: toLabelOpacity,
            fontFamily: DISPLAY,
            fontSize: 24,
            fontWeight: 600,
            color: T.ink,
            letterSpacing: '-0.02em',
          }}
        >
          {toLabel}
        </div>
        
        {/* To value */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 110,
            opacity: toLabelOpacity,
            fontFamily: BODY,
            fontSize: 32,
            fontWeight: 600,
            color: T.ink,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {toValue}
        </div>
        
        {/* Chart label */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 170,
            fontFamily: DISPLAY,
            fontSize: 24,
            fontWeight: 600,
            color: T.ink,
            letterSpacing: '-0.02em',
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};