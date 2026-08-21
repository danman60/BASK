// PageBeat — a reusable 2.5D beat over one live-product page texture.
//
// The 2026-08-21 salon-intelligence cut adds five product beats (opportunity
// feed, customer health, peers, front-desk monitor, proof) that all share the
// same grammar: settle on an establishing frame, push/drift to the thing that
// matters, hold. Rather than hand-author five near-identical shots, this one
// component takes the texture + camera keys + a Fraunces title chip and drives
// all of them. The bespoke shots (Daybreak, the UVALUX finale) stay bespoke.
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { PageCam, CamKey } from '../lib/PageCam';
import { BODY, DISPLAY, E, T } from '../tokens';

export const S_pageBeat = (
  src: string,
  pageH: number,
  keys: CamKey[],
) =>
  function PageBeatShot({ title, kicker }: { title: string; kicker?: string }) {
    const frame = useCurrentFrame();
    // title chip fades in over the establishing hold, out before the last push
    const last = keys[keys.length - 1].frame;
    const inT = interpolate(frame, [8, 26], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: E.easeOut,
    });
    const outT = interpolate(frame, [last - 24, last - 4], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const chip = Math.min(inT, outT);
    const rise = interpolate(chip, [0, 1], [14, 0]);

    return (
      <AbsoluteFill style={{ backgroundColor: T.paper, overflow: 'hidden' }}>
        <PageCam src={`textures/${src}.png`} pageH={pageH} keys={keys} ease={E.camera} />
        <div
          style={{
            position: 'absolute',
            left: 96,
            bottom: 92,
            opacity: chip,
            transform: `translateY(${rise}px)`,
            maxWidth: 900,
          }}
        >
          {kicker && (
            <div
              style={{
                font: `600 22px/1 ${BODY}`,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: T.primaryDeep,
                marginBottom: 12,
              }}
            >
              {kicker}
            </div>
          )}
          <div
            style={{
              font: `600 58px/1.08 ${DISPLAY}`,
              color: T.ink,
              textShadow: '0 2px 24px rgba(255,255,255,0.9)',
            }}
          >
            {title}
          </div>
        </div>
      </AbsoluteFill>
    );
  };

/* ---- the five beats, each = texture + camera keys ------------------------ */

// Opportunity feed: settle on the heading + first ranked card, drift down the
// ranked list, push into the one-click approve button (the money shot).
export const SOppFeed = S_pageBeat('today-full', 3397, [
  { frame: 0, cx: 780, cy: 560, zoom: 1.32 },
  { frame: 44, cx: 780, cy: 560, zoom: 1.32 },
  { frame: 150, cx: 780, cy: 1020, zoom: 1.36 },
  { frame: 250, cx: 690, cy: 900, zoom: 1.74 },
  { frame: 300, cx: 690, cy: 900, zoom: 1.74 },
] as CamKey[]);

// Customer health: band tiles, then the slipping grid.
export const SHealth = S_pageBeat('customers-full', 2676, [
  { frame: 0, cx: 900, cy: 360, zoom: 1.18 },
  { frame: 40, cx: 900, cy: 360, zoom: 1.18 },
  { frame: 150, cx: 820, cy: 720, zoom: 1.34 },
  { frame: 190, cx: 820, cy: 720, zoom: 1.34 },
] as CamKey[]);

// Peers: the scoreboard tiles, then the cohort gap.
export const SPeers = S_pageBeat('peers-full', 2199, [
  { frame: 0, cx: 900, cy: 360, zoom: 1.2 },
  { frame: 40, cx: 900, cy: 360, zoom: 1.2 },
  { frame: 150, cx: 860, cy: 640, zoom: 1.4 },
  { frame: 190, cx: 860, cy: 640, zoom: 1.4 },
] as CamKey[]);

// Front Desk Monitor: the listener + a coaching pattern, then a scored
// conversation.
export const SMonitor = S_pageBeat('monitor-full', 3422, [
  { frame: 0, cx: 940, cy: 400, zoom: 1.12 },
  { frame: 44, cx: 940, cy: 400, zoom: 1.12 },
  { frame: 150, cx: 790, cy: 940, zoom: 1.4 },
  { frame: 210, cx: 790, cy: 940, zoom: 1.4 },
] as CamKey[]);

// Proof: the two outcome cards, push onto the recurring-revenue line.
export const SProof = S_pageBeat('today-full', 3397, [
  { frame: 0, cx: 780, cy: 2120, zoom: 1.44 },
  { frame: 40, cx: 780, cy: 2120, zoom: 1.44 },
  { frame: 120, cx: 780, cy: 2110, zoom: 1.6 },
] as CamKey[]);
