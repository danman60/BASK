// 48 element cutouts already sit in promo/public/textures/v5 and the v5 cut framed almost none of them.
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { T, BODY, E } from '../../tokens';

export type FigurePlateProps = {
  src: string;
  caption?: string;
  move?: 'push' | 'drift' | 'settle';
  delay?: number;
};

export const FigurePlate: React.FC<FigurePlateProps> = ({ src, caption, move = 'push', delay = 0 }) => {
  const frame = useCurrentFrame();
  const startFrame = delay;
  
  // Image fade in over 12 frames
  const imageOpacity = interpolate(frame - startFrame, [0, 12], [0, 1], { 
    extrapolateLeft: 'clamp', 
    extrapolateRight: 'clamp' 
  });
  
  // Caption fade in after image (10 frames after image fades in)
  const captionStartFrame = startFrame + 12 + 10;
  const captionOpacity = interpolate(frame - captionStartFrame, [0, 10], [0, 1], { 
    extrapolateLeft: 'clamp', 
    extrapolateRight: 'clamp' 
  });
  
  // Motion based on move prop
  let scale = 1;
  let translateX = 0;
  
  if (move === 'push') {
    // Scale from 1.0 to 1.06 over 90 frames
    const pushProgress = interpolate(frame - startFrame, [0, 90], [0, 1], { 
      extrapolateLeft: 'clamp', 
      extrapolateRight: 'clamp' 
    });
    scale = interpolate(pushProgress, [0, 1], [1, 1.06], { 
      easing: E.push 
    });
  } else if (move === 'drift') {
    // Translate horizontally by 22px over 90 frames
    const driftProgress = interpolate(frame - startFrame, [0, 90], [0, 1], { 
      extrapolateLeft: 'clamp', 
      extrapolateRight: 'clamp' 
    });
    translateX = interpolate(driftProgress, [0, 1], [0, 22], { 
      easing: E.camera 
    });
  } else if (move === 'settle') {
    // Scale from 1.04 to 1.0 over 30 frames
    const settleProgress = interpolate(frame - startFrame, [0, 30], [0, 1], { 
      extrapolateLeft: 'clamp', 
      extrapolateRight: 'clamp' 
    });
    scale = interpolate(settleProgress, [0, 1], [1.04, 1], { 
      easing: E.easeOut 
    });
  }
  
  return (
    <AbsoluteFill style={{ backgroundColor: T.paper, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`,
        transformOrigin: 'center',
      }}>
        {/* `src` takes EITHER a bare v5 texture name ("daybreak-letter") or a
            full path under public ("textures/v6/citation.png"). The generated
            version hardcoded the v5 folder, which locked the component out of
            every capture taken since — including the coaching citation, which
            is the one shot in this film showing a feature that did not exist
            when the v5 textures were shot. */}
        <Img
          src={staticFile(src.includes('/') ? src : `textures/v5/${src}.png`)}
          style={{
            display: 'block',
            borderRadius: 14,
            opacity: imageOpacity,
            boxShadow: T.shadowPop,
            /* The cutouts are 3x captures — `records-table` is 2052x4170 and
               `net-map` is 2700 wide. Rendered at natural size they hang off a
               1920x1080 frame in every direction and the shot reads as a crop
               of nothing. Fit inside the frame with margin, and let the camera
               move do the rest. */
            maxWidth: 1420,
            maxHeight: 742,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
        {caption && (
          <div 
            style={{
              fontFamily: BODY,
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.4,
              color: T.ink,
              marginTop: 12,
              textAlign: 'center',
              opacity: captionOpacity,
              width: '100%',
            }}
          >
            {caption}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};