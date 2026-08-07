'use client';

import { useRef, useState } from 'react';
import { WhisperNote } from '@bask/ui';

import { receiveScanAction } from '@/app/(bask)/inventory/actions';

/**
 * Receiving by barcode.
 *
 * This deliberately does NOT install a keystroke listener. The global wedge
 * listener is Lane 2's — one listener on the Floor, context-routed
 * (IMPLEMENTATION_SPEC §6.2), and two of them fighting over the same burst of
 * keystrokes is exactly the bug that shows up on stage. What this owns is the
 * receiving *destination*: a focused field the wedge types into when the box is
 * in front of you, and the manual fallback for a code the scanner will not read.
 */
export function ScanReceiving() {
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState(6);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={async (formData) => {
        const submitted = String(formData.get('code') ?? '');
        await receiveScanAction(formData);
        setLastCode(submitted);
        setCode('');
        inputRef.current?.focus();
      }}
    >
      <p className="l4-stat-label">Scan or type a barcode</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <input
          ref={inputRef}
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="084700010078"
          autoComplete="off"
          inputMode="numeric"
          aria-label="Barcode"
          style={{
            flex: '1 1 220px',
            minWidth: 0,
            padding: '11px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            background: 'var(--paper-2)',
            font: '600 var(--text-base)/1.2 var(--font-body)',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--ink)',
          }}
        />
        <input
          name="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          aria-label="How many arrived"
          style={{
            width: 88,
            padding: '11px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            background: 'var(--paper-2)',
            font: '600 var(--text-base)/1.2 var(--font-body)',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--ink)',
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={code.trim().length === 0}>
          Add {quantity} to the shelf
        </button>
      </div>

      {lastCode && (
        <p className="l4-workings" style={{ marginTop: 12 }}>
          Counted {quantity} against <span className="num">{lastCode}</span>. The days-left figure
          on that product has already moved.
        </p>
      )}

      <WhisperNote note="figuresFromYourTill" />
    </form>
  );
}
