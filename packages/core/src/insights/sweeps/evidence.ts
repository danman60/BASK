import {
  EVIDENCE_VERSION,
  formatCurrency,
  type Evidence,
  type EvidenceMetric,
  type EvidenceWindow,
} from '../../evidence';

export function buildSweepEvidence(args: {
  metric: EvidenceMetric;
  window: EvidenceWindow;
  impact: number;
  currency: string;
  basis: string;
  sentence: string;
}): Evidence {
  return {
    version: EVIDENCE_VERSION,
    metric: args.metric,
    window: args.window,
    comparison: null,
    impact: {
      amount: args.impact,
      currency: args.currency,
      cadence: 'per_month',
      basis: args.basis,
      confidence: 'low',
      chipLabel: `${formatCurrency(args.impact, args.currency)}/mo opportunity`,
      tone: 'opportunity',
    },
    contributingFactors: [],
    series: null,
    sentence: args.sentence,
  };
}
