'use client';

import { WHISPERS, type WhisperKey } from './guidance';

/**
 * WhisperNote — the small trust/consequence line that sits at the point of action
 * ("Goes to 43 people who agreed to texts"). DESIGN_SPEC §4 lists it as a first-class
 * component because it appears everywhere.
 *
 * Keyed into the dictionary like everything else. Entries that need a real number are
 * functions there, so the count is passed as an argument rather than the caller
 * assembling a sentence — assembling is how copy drifts out of the file.
 */

type StaticKey = {
  [K in WhisperKey]: (typeof WHISPERS)[K] extends string ? K : never;
}[WhisperKey];

type FnKey = Exclude<WhisperKey, StaticKey>;

type WhisperNoteProps = {
  tone?: 'quiet' | 'caution';
  className?: string;
} & ({ note: StaticKey; count?: never } | { note: FnKey; count: number });

export function WhisperNote({ note, count, tone = 'quiet', className }: WhisperNoteProps) {
  const entry = WHISPERS[note];
  const text = typeof entry === 'function' ? entry(count as number) : entry;

  return (
    <p
      className={['g-whisper', className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-testid="whisper-note"
    >
      <span>{text}</span>
    </p>
  );
}
