'use client';

import { useState } from 'react';

import type { AskResult } from '@bask/core';

/**
 * The question box.
 *
 * Three decisions worth keeping:
 *
 * 1. SUGGESTIONS ARE VISIBLE AND REAL. An empty box in front of a stakeholder is
 *    a dare, and the honest reason to seed it is not stage-management: the
 *    assistant answers from a bounded set of facts, so showing the questions it
 *    can actually answer is telling the truth about its edges rather than
 *    hiding them behind a blinking cursor.
 *
 * 2. "I DON'T HAVE THAT" RENDERS AS AN ANSWER, not an error. `answered: false`
 *    gets the same card in a calmer colour. An assistant that always has
 *    something to say teaches an owner to check none of it.
 *
 * 3. THE FACTS IT USED ARE ON SCREEN. Same principle as the records drill-down
 *    one page over: the interesting part is not that software wrote a sentence,
 *    it is that you can see what the sentence rests on.
 */

/* The bundle's keys are camelCase because they are code. The owner should never
   see them — printing `thingsNeedingAttention` under an answer is the same leak
   as a card quoting its own field name. Anything unmapped falls back to spacing
   out the camelCase rather than showing it raw. */
const FACT_LABELS: Record<string, string> = {
  salonName: 'your salon',
  totalVisitsOnRecord: 'every visit on record',
  activeCustomers: 'your active customers',
  activeMemberships: 'your memberships',
  monthlyMembershipMoney: 'monthly membership money',
  membershipsWithFailedPayment: 'memberships with a failed payment',
  moneyStuckInFailedPayments: 'money stuck in failed payments',
  thingsNeedingAttention: 'what needs your attention',
  bestSellingProductsRecently: 'what has been selling',
};

function factLabel(key: string): string {
  return FACT_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

const SUGGESTIONS = [
  'How many memberships am I about to lose?',
  'What is my biggest opportunity this week?',
  'Which lotion sells best right now?',
  'How much money is stuck in failed payments?',
];

export function AskSurface({
  onAskAction,
}: {
  onAskAction: (question: string) => Promise<AskResult>;
}) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [asked, setAsked] = useState<string | null>(null);

  async function run(q: string) {
    if (!q.trim() || asking) return;
    setAsking(true);
    setAsked(q);
    setResult(null);
    try {
      setResult(await onAskAction(q));
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="ask-wrap">
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(question);
        }}
      >
        <input
          className="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your salon…"
          aria-label="Ask about your salon"
          disabled={asking}
        />
        <button type="submit" className="btn btn-primary ask-go" disabled={asking || !question.trim()}>
          {asking ? 'Looking…' : 'Ask'}
        </button>
      </form>

      <div className="ask-suggest">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="ask-chip"
            disabled={asking}
            onClick={() => {
              setQuestion(s);
              void run(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {asked && (
        <div className="ask-answer" data-state={asking ? 'busy' : result?.answered ? 'yes' : 'no'}>
          <p className="ask-q">{asked}</p>
          {asking ? (
            <p className="ask-a ask-a--busy">Reading your numbers…</p>
          ) : (
            result && (
              <>
                <p className="ask-a">{result.answer}</p>
                {result.usedFacts.length > 0 && (
                  <p className="ask-used">
                    Looked at: {result.usedFacts.map(factLabel).join(' · ')}
                  </p>
                )}
                {result.offline && (
                  <p className="ask-used">
                    The rest of the product does not use the model — every other number you have seen
                    is computed.
                  </p>
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
