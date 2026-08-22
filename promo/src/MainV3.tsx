// MainV3 — the salon-intelligence cut (2026-08-21). Picture-only review cut:
// no Soundtrack, no captions. It places the shots; timing lives in timelineV3.
//
// New beats (opportunity feed, health, peers, monitor, proof) are driven by the
// reusable PageBeat shots. The UVALUX finale (map → network → wall → compass →
// outro) is the proven set from the shipped film, reused verbatim.
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';

import { S0Brand } from './shots/S0Brand';
import { S1Daybreak } from './shots/S1Daybreak';
import { S8Map } from './shots/S8Map';
import { S8Network } from './shots/S8Network';
import { S9Compass } from './shots/S9Compass';
import { S9Wall } from './shots/S9Wall';
import { S10Outro } from './shots/S10Outro';
import { SHealth, SMonitor, SOppFeed, SPeers, SProof } from './shots/PageBeat';
import { SHOTS_V3 } from './timelineV3';
import { T } from './tokens';

export const MainV3: React.FC<{ audio?: boolean }> = ({ audio = false }) => {
  const S = SHOTS_V3;
  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      {audio && (
        <>
          {/* New ElevenLabs VO (UvaInt v3, ~83.7s) over the old open-road bed,
              held low so the read sits on top. */}
          <Audio src={staticFile('audio/bgm-open-road.mp3')} volume={0.14} />
          <Audio src={staticFile('audio/vo/uvaint-v3.mp3')} volume={1} />
        </>
      )}
      <Sequence from={S.brand.from} durationInFrames={S.brand.duration}>
        <S0Brand duration={S.brand.duration} />
      </Sequence>

      <Sequence from={S.daybreak.from} durationInFrames={S.daybreak.duration}>
        <S1Daybreak />
      </Sequence>

      <Sequence from={S.oppfeed.from} durationInFrames={S.oppfeed.duration}>
        <SOppFeed kicker="Salon intelligence" title="Six ways to grow your business today" />
      </Sequence>

      <Sequence from={S.health.from} durationInFrames={S.health.duration}>
        <SHealth kicker="Customer Health" title="Who is slipping, before they're gone" />
      </Sequence>

      <Sequence from={S.peers.from} durationInFrames={S.peers.duration}>
        <SPeers kicker="Analytics" title="Where you stand — and the gap, in dollars" />
      </Sequence>

      <Sequence from={S.monitor.from} durationInFrames={S.monitor.duration}>
        <SMonitor kicker="Front Desk Monitor" title="What your best people do differently" />
      </Sequence>

      <Sequence from={S.proof.from} durationInFrames={S.proof.duration}>
        <SProof kicker="Proof" title="What your last actions made" />
      </Sequence>

      {/* The UVALUX finale — the proven set, unchanged. */}
      <Sequence from={S.map.from - 30} durationInFrames={S.map.duration + 30}>
        <S8Map />
      </Sequence>

      <Sequence from={S.network.from} durationInFrames={S.network.duration}>
        <S8Network />
      </Sequence>

      <Sequence from={S.wall.from} durationInFrames={S.wall.duration}>
        <S9Wall duration={S.wall.duration} />
      </Sequence>

      <Sequence from={S.compass.from} durationInFrames={S.compass.duration}>
        <S9Compass />
      </Sequence>

      <Sequence from={S.outro.from} durationInFrames={S.outro.duration}>
        <S10Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
