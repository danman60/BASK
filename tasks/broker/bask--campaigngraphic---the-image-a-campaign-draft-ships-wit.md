# bask: CampaignGraphic — the image a campaign draft ships with

## What to build

Create a PRESENTATIONAL React component — props in, markup out, no data fetching, no hooks other than nothing at all, no imports beyond react and the exemplar's vocabulary. It renders the square graphic that goes out with a salon marketing campaign: a background image, a large serif headline over it, and a small offer badge. Export an interface named CampaignGraphicProps with EXACTLY these fields: headline: string; badge: string; backgroundSrc: string; salonName: string; className?: string. Export a function component named CampaignGraphic taking those props. Structure, in this order inside one root element: a root div with className 'b-cgraphic' carrying the square aspect ratio; an img with className 'b-cgraphic-bg' whose src is backgroundSrc and alt is an empty string because it is decorative; a div className 'b-cgraphic-scrim' for the darkening layer that keeps text legible over any photo; a div className 'b-cgraphic-body' holding an h3 className 'b-cgraphic-headline' with the headline text, a span className 'b-cgraphic-badge' with the badge text, and a p className 'b-cgraphic-salon' with the salonName. Append the optional className prop to the root element's class list when it is provided. Use ONLY those class names — every visual value lives in CSS that already exists, so put NO inline styles, NO style objects, NO colour values and NO font families anywhere in this file. Add a file header comment explaining that the square is fixed because the same asset is posted to Instagram and Facebook, and that the scrim exists because a headline over an unknown photograph is unreadable without one. Do NOT add a click handler, a loading state, a Next.js Image import, or any text the caller did not pass in.

## Target file — write EXACTLY this path, and nothing else

`packages/ui/src/components/CampaignGraphic.tsx`
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
/**
 * RecordsPanel — the last step of the drill-down: the owner's own rows.
 *
 * The chain is headline → evidence → RECORDS. The first two are the product
 * explaining itself; this one is the product getting out of the way. Every line
 * here is a visit that happened, with the lotion that did or did not go with it.
 *
 * The header recomputes the rate FROM THE ROWS and prints it beside the figure
 * the card quoted. When they agree it reads as a receipt. When they disagree it
 * SAYS SO — a provenance panel that can only ever confirm itself is decoration,
 * and the first time an owner catches it lying the feature is worth less than
 * nothing.
 *
 * Deliberately not a modal and not a spreadsheet: no sorting, no filtering, no
 * column menu. An owner opened this to answer one question — "is that real?" —
 * and every control added is a way to lose them before they get the answer.
 */

export interface RecordRowView {
  visitId: string;
  day: string;
  customerName: string;
  attached: boolean;
  productName: string | null;
  amountLabel: string | null;
}

export interface RecordsPanelProps {
  rows: readonly RecordRowView[];
  totalVisits: number;
  attachedVisits: number;
  /** Recomputed from the rows, not copied off the card. */
  ratePercent: number;
  /** What the card claimed, so the two can be shown together. */
  quotedPercent?: number | null;
  windowLabel: string;
  hiddenCount: number;
  id?: string;
}

/** Same-day formatting as the rest of Today: "Tue 5 Aug". */
function dayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function RecordsPanel({
  rows,
  totalVisits,
  attachedVisits,
  ratePercent,
  quotedPercent,
  windowLabel,
  hiddenCount,
  id,
}: RecordsPanelProps) {
  /* Half a point of tolerance: the card rounds to one decimal and so does this,
     so identical underlying data can still differ in the last digit. Anything
     wider than that is a real disagreement and gets said out loud. */
  const mismatch =
    typeof quotedPercent === 'number' && Math.abs(quotedPercent - ratePercent) > 0.5;

  return (
    <div className="b-records" id={id} role="region" data-testid="records-panel">
      <p className="b-records-head">
        <strong className="num">{attachedVisits}</strong> of{' '}
        <strong className="num">{totalVisits.toLocaleString('en-CA')}</strong> visits over{' '}
        {windowLabel} included a product — <strong className="num">{ratePercent}%</strong>
        {mismatch ? (
          <span className="b-records-flag">
            {' '}
            · the card says {quotedPercent}%, so these do not agree. Trust this list.
          </span>
        ) : (
          <span className="b-records-ok"> · counted from the visits below</span>
        )}
      </p>

      {/* `.b-dtable` rather than a table of its own: six components already share
          it, it carries the responsive rules that stack a wide table into labelled
          cards on a phone, and `.card:has(> .b-dtable)` gives the scroll wrapper.
          A seventh table shape here would be a seventh thing to keep in line. */}
      <div className="b-records-scroll">
        <table className="b-dtable">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Customer</th>
              <th scope="col">Bought</th>
              <th scope="col" className="num">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.visitId} data-attached={r.attached ? 'true' : 'false'}>
                <td>{dayLabel(r.day)}</td>
                <td className="b-dtable-who">{r.customerName || '—'}</td>
                <td className="b-dtable-why">
                  {r.productName ?? <span className="b-records-none">nothing</span>}
                </td>
                <td className="num">{r.amountLabel ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        /* Say what is not shown. A truncated list that does not admit it is
           truncated is the same lie as a rounded number that does not round. */
        <p className="b-records-more">
          Showing {rows.length} of {totalVisits.toLocaleString('en-CA')} visits — {hiddenCount}{' '}
          more in the window, all counted in the figure above.
        </p>
      )}
    </div>
  );
}

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `packages/ui/src/components/CampaignGraphic.tsx` exists and is complete.
2. `PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.tscgate packages/ui/src/components/CampaignGraphic.tsx --repo /home/danman60/projects/uvalux-platform --cmd 'npx tsc --noEmit' && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/ui/src/components/RecordsPanel.tsx packages/ui/src/components/CampaignGraphic.tsx` passes with exit code 0.
3. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
