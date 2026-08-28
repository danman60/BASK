import './ask.css';

import { AskSurface } from './AskSurface';
import { askQuestion } from './actions';

/**
 * Ask — a plain-language question about the salon's own numbers.
 *
 * The server action is passed down rather than imported by the client component,
 * so the boundary stays one-way: the surface knows how to ask, and nothing about
 * where the answer comes from.
 */
export const dynamic = 'force-dynamic';

export default function AskPage() {
  return (
    <div className="ask-page">
      <header className="ask-head">
        <p className="ask-eyebrow">Ask</p>
        <h1 className="ask-h1">What do you want to know?</h1>
        <p className="ask-lede">
          Type it the way you would say it. The answer comes from your own numbers — the same ones
          behind every other screen — and if the answer is not in them, it will say so rather than
          guess.
        </p>
      </header>
      <AskSurface onAskAction={askQuestion} />
    </div>
  );
}
