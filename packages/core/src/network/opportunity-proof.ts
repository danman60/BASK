/**
 * Network proof for an opportunity — "salons like yours already tried this".
 *
 * ⚠️ READ THIS BEFORE BELIEVING A NUMBER OFF THIS FILE.
 * There is NO production source of `NetworkOutcomeRecord` in this repo. Nothing
 * writes one, no table holds one, and `summariseNetworkOutcomes` had zero call
 * sites before this file. The only network data that existed was `DEMO_WINS`
 * (`./fixtures.ts`) — four wins, four different salons, four different actions,
 * so every group in it has a sample of ONE and could never clear the confidence
 * floor.
 *
 * So the records below are a DEMO FIXTURE, written by hand, exactly like
 * `DEMO_OPPORTUNITIES` and `DEMO_WINS` are. They are not measurements.
 *
 * What is NOT faked: every figure the UI shows is COMPUTED from these per-salon
 * rows by `summariseNetworkOutcomes` — the success rate, the median move and the
 * median time to result are real arithmetic over a real sample, and the
 * `MIN_SALONS_FOR_CONFIDENCE` floor really does suppress the card. That is why
 * `tuesday-offpeak` below is deliberately left at three salons: it is the case
 * that must render NOTHING, and it proves the floor is load-bearing rather than
 * decorative. Replacing this file with real rows changes no rendering code.
 *
 * Delta sizes are stated in points off a low base, matching the note in
 * `./fixtures.ts` that the real twelve-year dataset moves attachment by points,
 * not by the double-digit jumps the old synthetic fixtures used.
 */

import {
  summariseNetworkOutcomes,
  type NetworkOutcomeRecord,
  type NetworkOutcomeSummary,
} from './outcomes';

/** Hand-written demo rows. One row = one salon that ran one action. */
export const DEMO_NETWORK_OUTCOMES: readonly NetworkOutcomeRecord[] = [
  // Evening product challenge — 7 salons, 6 improved.
  { salonId: 'net-a1', actionKey: 'evening-product-challenge', signalType: 'retail_attachment_slip', improved: true, deltaPoints: 1.9, daysToResult: 14 },
  { salonId: 'net-a2', actionKey: 'evening-product-challenge', signalType: 'retail_attachment_slip', improved: true, deltaPoints: 2.4, daysToResult: 21 },
  { salonId: 'net-a3', actionKey: 'evening-product-challenge', signalType: 'retail_attachment_slip', improved: true, deltaPoints: 1.2, daysToResult: 10 },
  { salonId: 'net-a4', actionKey: 'evening-product-challenge', signalType: 'retail_attachment_slip', improved: true, deltaPoints: 0.9, daysToResult: 18 },
  { salonId: 'net-a5', actionKey: 'evening-product-challenge', signalType: 'retail_attachment_slip', improved: true, deltaPoints: 1.6, daysToResult: 12 },
  { salonId: 'net-a6', actionKey: 'evening-product-challenge', signalType: 'retail_attachment_slip', improved: false, deltaPoints: -0.4, daysToResult: 30 },
  { salonId: 'net-a7', actionKey: 'evening-product-challenge', signalType: 'retail_attachment_slip', improved: true, deltaPoints: 2.0, daysToResult: 16 },

  // Unlimited-upgrade conversation — 6 salons, 5 improved.
  { salonId: 'net-b1', actionKey: 'unlimited-upgrade-convo', signalType: 'membership_upgrade', improved: true, deltaPoints: 1.1, daysToResult: 9 },
  { salonId: 'net-b2', actionKey: 'unlimited-upgrade-convo', signalType: 'membership_upgrade', improved: true, deltaPoints: 0.7, daysToResult: 14 },
  { salonId: 'net-b3', actionKey: 'unlimited-upgrade-convo', signalType: 'membership_upgrade', improved: true, deltaPoints: 1.4, daysToResult: 21 },
  { salonId: 'net-b4', actionKey: 'unlimited-upgrade-convo', signalType: 'membership_upgrade', improved: true, deltaPoints: 0.5, daysToResult: 11 },
  { salonId: 'net-b5', actionKey: 'unlimited-upgrade-convo', signalType: 'membership_upgrade', improved: true, deltaPoints: 2.0, daysToResult: 7 },
  { salonId: 'net-b6', actionKey: 'unlimited-upgrade-convo', signalType: 'membership_upgrade', improved: false, deltaPoints: -0.2, daysToResult: 28 },

  // Off-peak discount — 3 salons. BELOW the floor on purpose. Must render nothing.
  { salonId: 'net-c1', actionKey: 'tuesday-offpeak', signalType: 'soft_capacity', improved: true, deltaPoints: 3.1, daysToResult: 7 },
  { salonId: 'net-c2', actionKey: 'tuesday-offpeak', signalType: 'soft_capacity', improved: true, deltaPoints: 2.2, daysToResult: 5 },
  { salonId: 'net-c3', actionKey: 'tuesday-offpeak', signalType: 'soft_capacity', improved: false, deltaPoints: -1.0, daysToResult: 12 },
];

/**
 * Which network group backs which opportunity, and what to call the thing the
 * other salons did. The label is plain words about the ACTION, never a salon
 * name and never a town — the proof is "salons like yours", not "that salon".
 */
const OPPORTUNITY_PROOF_KEYS: Record<
  string,
  { actionKey: string; signalType: string; actionLabel: string }
> = {
  'opp-retail-attach': {
    actionKey: 'evening-product-challenge',
    signalType: 'retail_attachment_slip',
    actionLabel: 'Ran a product challenge on evening shifts',
  },
  'opp-membership-convert': {
    actionKey: 'unlimited-upgrade-convo',
    signalType: 'membership_upgrade',
    actionLabel: 'Offered membership to their most frequent pay-as-you-go customers',
  },
  'opp-fill-tuesday': {
    actionKey: 'tuesday-offpeak',
    signalType: 'soft_capacity',
    actionLabel: 'Discounted a quiet weekday afternoon',
  },
};

export interface OpportunityNetworkProof {
  /** Plain words for what the other salons actually did. */
  actionLabel: string;
  summary: NetworkOutcomeSummary;
}

/**
 * The network proof behind one opportunity, or null.
 *
 * Returns null when there is no group for the opportunity AND when the group
 * has not cleared `MIN_SALONS_FOR_CONFIDENCE`. Below the floor a success rate
 * is anecdote, and an anecdote rendered as proof is the one thing this card
 * must never do — so the caller gets nothing to render rather than a hedge.
 */
export function networkProofFor(opportunityId: string): OpportunityNetworkProof | null {
  const key = OPPORTUNITY_PROOF_KEYS[opportunityId];
  if (!key) return null;

  const summary = summariseNetworkOutcomes(
    DEMO_NETWORK_OUTCOMES.filter(
      (r) => r.actionKey === key.actionKey && r.signalType === key.signalType,
    ),
  )[0];

  if (!summary || !summary.confident) return null;
  return { actionLabel: key.actionLabel, summary };
}
