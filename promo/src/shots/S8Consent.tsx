// S8 — "What UVALUX sees". The consent screen is the hinge of the whole pitch:
// it is the reason the Compass act is allowed to exist. One slow push, no
// device other than the camera — the screen's own two columns do the arguing.
// Its last 30 frames are the act break: S9 pushes up from the bottom edge and
// carries this page out of frame (seam handled in S9, see bottom-push-stack-wipe).
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { E, T } from '../tokens';
import { SHOTS } from '../timeline';

const PAGE = layout.pages['consent-full'];

const CAM_KEYS: CamKey[] = [
  { frame: 0, cx: 960, cy: 640, zoom: 0.92 },
  { frame: 88, cx: 1010, cy: 760, zoom: 1.04 },
  { frame: 100, cx: 1010, cy: 760, zoom: 1.04 },
];

export const S8Consent: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = SHOTS.consent.duration;

  // pushed out of frame by the Compass act over the last 30 frames
  const out = interpolate(frame, [dur - 30, dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.heavyOut,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper, transform: `translateY(${-1080 * out}px)` }}>
      <PageCam src="textures/consent-full.png" pageH={PAGE.pageH} keys={CAM_KEYS} ease={E.camera} />
    </AbsoluteFill>
  );
};
