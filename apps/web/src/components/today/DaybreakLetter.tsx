import type { BriefGreeting } from '@bask/core';

/**
 * The letter (DESIGN_SPEC §3.1.2): gold eyebrow → Fraunces display headline with
 * exactly ONE italic terracotta emphasis → 1–2 sentences of sub-prose at a 58ch
 * measure. This block owns the top-left and nothing competes with it.
 *
 * The emphasis is a substring match, which is the contract `briefGreetingSchema`
 * states: `emphasis` "must appear verbatim in `headline` — the renderer highlights
 * by substring match". Only the FIRST occurrence is wrapped, so a model that echoes
 * the phrase twice still yields one italic run and the design rule holds.
 */
export function DaybreakLetter({ greeting }: { greeting: BriefGreeting }) {
  return (
    <section className="b-daybreak" data-testid="daybreak-letter">
      <span className="eyebrow">{greeting.eyebrow}</span>
      <h1>{emphasise(greeting.headline, greeting.emphasis)}</h1>
      <p>{greeting.subProse}</p>
    </section>
  );
}

export function emphasise(headline: string, emphasis: string) {
  const at = headline.indexOf(emphasis);
  if (at === -1 || emphasis.length === 0) return headline;
  return (
    <>
      {headline.slice(0, at)}
      <em>{emphasis}</em>
      {headline.slice(at + emphasis.length)}
    </>
  );
}
