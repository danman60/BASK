/**
 * grade(expected, detected) → GradeRow[]. Each expected signal is matched to a
 * detected one by salon + a keyword overlap between the expected signal text
 * and the detected kind. A signal with no match is reported found:false — the
 * honest "the built detectors don't cover this yet" result. Pure.
 */
import { ExpectedSignal, DetectedSignal, GradeRow } from './contract';

const KIND_WORDS: Record<string, string[]> = {
  retail_attachment_slip: ['retail', 'attachment'],
  failed_payments: ['payment', 'failure', 'failed'],
  bottle_depletion: ['inventory', 'stockout', 'reorder', 'stock'],
  seasonal_pause: ['seasonal', 'pause'],
  member_tenure_gap: ['tenure', 'membership'],
  category_gap: ['category'],
  first_visit_lapse: ['first', 'visit', 'lapse'],
};

export function grade(expected: ExpectedSignal[], detected: DetectedSignal[]): GradeRow[] {
  return expected.map((e) => {
    const text = `${e.signal} ${e.expectedDetection}`.toLowerCase();
    const hit = detected.find((d) => {
      if (d.salonSrcId !== e.salonSrcId) return false;
      const words = KIND_WORDS[d.kind] ?? [d.kind];
      return words.some((w) => text.includes(w));
    });
    return {
      signalId: e.signalId,
      salonSrcId: e.salonSrcId,
      signal: e.signal,
      found: Boolean(hit),
      matchedKind: hit ? hit.kind : null,
      note: hit ? `matched ${hit.kind}: ${hit.detail}` : 'no built detector covers this signal',
    };
  });
}