'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The USB keyboard-wedge listener (IMPLEMENTATION_SPEC §6.2).
 *
 * A $30 HID scanner is a keyboard that types very fast and presses Enter. It has
 * no API, so the only thing separating a scan from a human is *timing*: a wedge
 * emits characters 2–15ms apart, and no front-desk staffer types a 12-digit code
 * with sub-30ms gaps.
 *
 * Consequences of taking that seriously:
 *  - The listener is on `document`, not on an input. §6.2's whole point is "no
 *    focus management burden on non-technical staff": scanning works anywhere on
 *    the Floor, including with nothing focused at all.
 *  - A burst is only a scan if EVERY gap in it was fast. One slow gap means a
 *    human was involved, and the buffer is abandoned rather than half-trusted.
 *  - Typing into a real text field is never intercepted — unless the burst was
 *    fast enough to be a scan, in which case the scanner wins and the field is
 *    left alone. That is the case where a staffer scans while the search box has
 *    focus, which happens constantly.
 *  - Nothing is swallowed on a partial match. If the burst never terminates in
 *    Enter, it times out and is discarded silently.
 */

/** Classic wedge signature: inter-key gaps under this are machine-fast. */
const MAX_INTERKEY_MS = 30;
/** Shorter than this and it is a keyboard shortcut, not a barcode. */
const MIN_LENGTH = 6;
/** A buffer this old is abandoned — a scan never takes a second. */
const STALE_MS = 400;

export interface WedgeScan {
  value: string;
  /** Milliseconds from first to last character — the evidence it was a machine. */
  elapsedMs: number;
  at: number;
}

export function useWedgeScanner(onScan: (scan: WedgeScan) => void): { listening: boolean } {
  const [listening, setListening] = useState(false);
  const buffer = useRef('');
  const firstAt = useRef(0);
  const lastAt = useRef(0);
  const fast = useRef(true);
  const handler = useRef(onScan);
  handler.current = onScan;

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const reset = () => {
      buffer.current = '';
      firstAt.current = 0;
      lastAt.current = 0;
      fast.current = true;
      setListening(false);
    };

    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(reset, STALE_MS);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const now = performance.now();

      if (event.key === 'Enter') {
        const value = buffer.current;
        const elapsed = now - firstAt.current;
        const wasScan = fast.current && value.length >= MIN_LENGTH;
        reset();
        if (idleTimer) clearTimeout(idleTimer);
        if (!wasScan) return;
        // Only now do we claim the keystroke: a scanner's Enter must not submit
        // whatever form happens to be open behind it.
        event.preventDefault();
        event.stopPropagation();
        handler.current({ value, elapsedMs: Math.round(elapsed), at: Date.now() });
        return;
      }

      if (event.key.length !== 1) return;

      const gap = lastAt.current === 0 ? 0 : now - lastAt.current;
      if (buffer.current === '') {
        firstAt.current = now;
        fast.current = true;
      } else if (gap > MAX_INTERKEY_MS) {
        /**
         * A slow gap poisons the whole burst rather than starting a fresh
         * window from this character.
         *
         * Restarting is the tempting version and it is wrong: a 12-digit UPC
         * that stalls after digit five restarts and terminates with a 7-digit
         * buffer, which is still long enough to look like a barcode. That
         * resolves to nothing — or worse, to a *different* product — and the
         * staffer finds out at the receipt. A missed scan makes somebody scan
         * again; a truncated scan puts the wrong bottle in the cart.
         */
        fast.current = false;
      }

      buffer.current += event.key;
      lastAt.current = now;
      setListening(buffer.current.length >= MIN_LENGTH);
      armIdle();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  return { listening };
}

/**
 * Guess a symbology from the code's shape, so the quick-create sheet arrives
 * pre-filled (§6.2: "sheet pre-filled with symbology/code").
 */
export function guessSymbology(value: string): 'upc_a' | 'ean_13' | 'code_128' | 'custom' {
  if (/^\d{12}$/.test(value)) return 'upc_a';
  if (/^\d{13}$/.test(value)) return 'ean_13';
  if (/^BSK-\d{5}$/.test(value)) return 'code_128';
  return 'custom';
}
