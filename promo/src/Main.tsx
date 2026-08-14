import { AbsoluteFill, Sequence } from 'remotion';

import { BaskCaption } from './lib/BaskCaption';
import { PaperTitleCard } from './lib/PaperTitleCard';
import { S1Daybreak } from './shots/S1Daybreak';
import { S2Insight } from './shots/S2Insight';
import { S4Studio } from './shots/S4Studio';
import { S5Floor } from './shots/S5Floor';
import { S6Order } from './shots/S6Order';
import { S8Consent } from './shots/S8Consent';
import { S9Compass } from './shots/S9Compass';
import { S10Outro } from './shots/S10Outro';
import { Soundtrack } from './Soundtrack';
import type { Shots } from './timeline';
import { T } from './tokens';

/**
 * Bask / Compass — product film.
 * Shot order, durations and captions live in DESIGN_SPEC.md §3; this file only
 * places them. Every caption is written to the final picture (C1) and names a
 * product surface or a concrete benefit rather than a metaphor (C2).
 */
export const Main: React.FC<{
  bgm: boolean;
  captions: boolean;
  vo?: boolean;
  shots: Shots;
  total: number;
}> = ({ bgm, captions, vo = false, shots: SHOTS, total }) => (
  <AbsoluteFill style={{ backgroundColor: T.paper }}>
    <Sequence from={SHOTS.open.from} durationInFrames={SHOTS.open.duration}>
      <S1Daybreak />
      {captions ? (
        <BaskCaption
          lead="The morning brief was written while the salon slept."
          sub="Daybreak · Sunset Ridge Tanning & Wellness"
          from={60}
          duration={SHOTS.open.duration}
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.hero.from} durationInFrames={SHOTS.hero.duration}>
      <S2Insight />
    </Sequence>

    <Sequence from={SHOTS.titleA.from} durationInFrames={SHOTS.titleA.duration}>
      <PaperTitleCard
        duration={SHOTS.titleA.duration}
        words={[
          { text: 'From' }, { text: 'the' }, { text: 'finding' },
          { text: 'to' }, { text: 'the' }, { text: 'campaign.', accent: true },
        ]}
      />
    </Sequence>

    <Sequence from={SHOTS.studio.from} durationInFrames={SHOTS.studio.duration}>
      <S4Studio />
      {captions ? (
        <BaskCaption
          lead="Studio writes the offer, the post and the text. "
          accent="You still press send."
          sub="Nothing goes out until the owner says so."
          from={72}
          duration={SHOTS.studio.duration}
          /* the page's own "Schedule campaign" button lives bottom-right; the
             caption used to run straight through it */
          rightGutter={640}
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.floor.from} durationInFrames={SHOTS.floor.duration}>
      <S5Floor />
      {captions ? (
        <BaskCaption
          lead="The Floor: eight beds, one board, "
          accent="live."
          sub="Countdowns, cleaning, maintenance — readable from across the counter."
          from={62}
          duration={SHOTS.floor.duration}
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.order.from} durationInFrames={SHOTS.order.duration}>
      <S6Order />
      {captions ? (
        <BaskCaption
          lead="It counts the shelf, then writes the "
          accent="UVALUX order"
          tail="."
          sub="Every line carries the reason it is there."
          from={54}
          duration={SHOTS.order.duration}
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.titleB.from} durationInFrames={SHOTS.titleB.duration}>
      <PaperTitleCard
        duration={SHOTS.titleB.duration}
        words={[
          { text: 'The' }, { text: 'salon' }, { text: 'decides' }, { text: 'what' },
          { text: 'crosses.' }, { text: "That's" }, { text: 'consent.', accent: true },
        ]}
        dark
      />
    </Sequence>

    <Sequence from={SHOTS.consent.from} durationInFrames={SHOTS.consent.duration}>
      <S8Consent />
      {captions ? (
        <BaskCaption
          lead="Business signals only — "
          accent="never their customer list."
          sub="Settings · Data sharing"
          from={4}
          duration={SHOTS.consent.duration - 30}
        />
      ) : null}
    </Sequence>

    {/* the Compass act starts 30f early: those frames are the act break itself,
        shoving the Bask screen up and out of frame (bottom-push seam) */}
    <Sequence
      from={SHOTS.compass.from - 30}
      durationInFrames={SHOTS.compass.duration + 30}
    >
      <S9Compass />
      {captions ? (
        <BaskCaption
          lead="Compass: every rep calls knowing "
          accent="exactly what changed."
          sub="Evidence, not adjectives — and only what the salon agreed to share."
          from={78}
          duration={SHOTS.compass.duration + 30}
          dark
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.outro.from} durationInFrames={SHOTS.outro.duration}>
      <S10Outro />
    </Sequence>

    <Soundtrack bgm={bgm} vo={vo} shots={SHOTS} total={total} />
  </AbsoluteFill>
);
