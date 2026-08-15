import { AbsoluteFill, Sequence } from 'remotion';

import { BaskCaption } from './lib/BaskCaption';
import { PaperTitleCard } from './lib/PaperTitleCard';
import { S0Brand } from './shots/S0Brand';
import { S1Daybreak } from './shots/S1Daybreak';
import { S3Checkin } from './shots/S3Checkin';
import { S4Pos } from './shots/S4Pos';
import { S2Insight } from './shots/S2Insight';
import { S4Studio } from './shots/S4Studio';
import { S5Floor } from './shots/S5Floor';
import { S6Order } from './shots/S6Order';
import { S8Network } from './shots/S8Network';
import { S9Compass } from './shots/S9Compass';
import { S9Wall } from './shots/S9Wall';
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
    <Sequence from={SHOTS.brand.from} durationInFrames={SHOTS.brand.duration}>
      <S0Brand duration={SHOTS.brand.duration} />
    </Sequence>

    <Sequence from={SHOTS.open.from} durationInFrames={SHOTS.open.duration}>
      <S1Daybreak />
      {captions ? (
        <BaskCaption
          lead="Less friction booking and coming back. Less work running the place."
          sub="Daybreak · the morning brief, written overnight"
          from={60}
          duration={SHOTS.open.duration}
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.hero.from} durationInFrames={SHOTS.hero.duration}>
      <S2Insight />
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

    <Sequence from={SHOTS.checkin.from} durationInFrames={SHOTS.checkin.duration}>
      <S3Checkin />
      {captions ? (
        <BaskCaption
          lead="A name at the desk brings up "
          accent="everything about them."
          sub="Last visit, package, waiver, and which rooms are free right now."
          from={70}
          duration={SHOTS.checkin.duration}
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.pos.from} durationInFrames={SHOTS.pos.duration}>
      <S4Pos />
      {captions ? (
        <BaskCaption
          lead="Scan a bottle. It rings up, and the shelf count "
          accent="moves with it."
          sub="The catalogue is the real UVALUX one — staff never build it."
          from={96}
          duration={SHOTS.pos.duration}
          rightGutter={620}
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




    {/* Starts 22f early and dissolves, so the return from the dark Compass act
        to ivory paper is a transition rather than a one-frame slam onto an empty
        card. The words wait out the dissolve. It also names the Tuesday finding
        again — the campaign line that follows says "Studio turned THAT into a
        campaign", and its referent is now half a film away. */}
    <Sequence
      from={SHOTS.titleA.from - 22}
      durationInFrames={SHOTS.titleA.duration + 22}
    >
      <PaperTitleCard
        duration={SHOTS.titleA.duration + 22}
        fadeIn={22}
        wordDelay={14}
        words={[
          { text: 'And' }, { text: 'it' }, { text: 'writes' },
          { text: 'the' }, { text: 'marketing.', accent: true },
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

    {/* ── the UVALUX finale ─────────────────────────────────────────────────
        Three screens, because one never carried it: the whole network page,
        then every Compass surface on a single wall, then the call the rep
        actually makes. The act break pushes up into the first of them. */}
    <Sequence
      from={SHOTS.network.from - 30}
      durationInFrames={SHOTS.network.duration + 30}
    >
      <S8Network />
      {captions ? (
        <BaskCaption
          lead="Twelve salons, "
          accent="one picture."
          sub="Health bands, what the network is telling you, where they are, who is sharing."
          from={60}
          duration={SHOTS.network.duration + 30}
          dark
        />
      ) : null}
    </Sequence>

    <Sequence from={SHOTS.wall.from} durationInFrames={SHOTS.wall.duration}>
      <S9Wall duration={SHOTS.wall.duration} />
      {captions ? (
        <BaskCaption
          lead="Every account, every signal, "
          accent="in one place."
          sub="Rollups, spread, adoption, coaching — none of it a report anybody ran."
          from={110}
          duration={SHOTS.wall.duration}
          dark
        />
      ) : null}
    </Sequence>

    <Sequence
      from={SHOTS.compass.from}
      durationInFrames={SHOTS.compass.duration}
    >
      <S9Compass />
      {captions ? (
        <BaskCaption
          lead="And UVALUX sees the network it supplies — "
          accent="salon by salon."
          sub="Every rep calls knowing exactly what changed."
          from={78}
          duration={SHOTS.compass.duration}
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
