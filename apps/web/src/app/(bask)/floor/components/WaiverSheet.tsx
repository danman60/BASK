'use client';

import { useEffect, useState } from 'react';

import { FLOOR } from '../copy';
import { readWaiverAction, type StoredWaiver } from '../actions';
import { SignaturePad, type SignatureResult } from './SignaturePad';

/**
 * Capture and view a waiver signature.
 *
 * Both halves live in one sheet on purpose: the question a staffer has at the
 * desk is "is this signed, and can I see it?", and answering half of that
 * somewhere else is how a two-click job becomes a hunt. The stored signatures
 * load when the sheet opens rather than with the page — they are PNGs, and the
 * Floor does not pay for them until somebody asks.
 */

export function WaiverSheet({
  customerId,
  customerName,
  busy,
  onClose,
  onSave,
}: {
  customerId: string;
  customerName: string;
  busy: boolean;
  onClose: () => void;
  onSave: (input: SignatureResult & { signedName: string }) => void;
}) {
  const [signature, setSignature] = useState<SignatureResult | null>(null);
  const [signedName, setSignedName] = useState(customerName);
  const [stored, setStored] = useState<StoredWaiver[] | null>(null);

  useEffect(() => {
    let alive = true;
    void readWaiverAction(customerId).then((result) => {
      if (alive && result.ok) setStored(result.waivers);
    });
    return () => {
      alive = false;
    };
  }, [customerId]);

  const ready = Boolean(signature) && signedName.trim().length >= 2;

  return (
    <div className="sheet-scrim" role="dialog" aria-label={FLOOR.waiver.title} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>{FLOOR.waiver.title}</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>{customerName}</p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <SignaturePad onChange={setSignature} disabled={busy} />

        <label className="floor-field" style={{ marginTop: 'var(--space-4)' }}>
          <span className="k">{FLOOR.waiver.nameLabel}</span>
          <input value={signedName} onChange={(e) => setSignedName(e.target.value)} />
        </label>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 12 }}>
          {FLOOR.waiver.consequence}
        </p>

        <button
          type="button"
          className="btn btn-primary start"
          disabled={!ready || busy}
          onClick={() => signature && onSave({ ...signature, signedName })}
        >
          {ready ? FLOOR.waiver.save : FLOOR.waiver.incomplete}
        </button>

        {stored !== null && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <div className="sect">{FLOOR.waiver.view}</div>
            {stored.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
                {FLOOR.waiver.none}
              </p>
            ) : (
              stored.map((w) => (
                <div className="sig-stored" key={w.id}>
                  {/* A plain <img>, not next/image: the source is a self-contained
                      data: URL, so there is nothing for the image optimiser to
                      fetch, resize or cache. */}
                  <img src={w.imageData} alt={`Signature by ${w.signedName}`} />
                  <div className="when">
                    {w.signedName} ·{' '}
                    {FLOOR.waiver.onFile(new Date(w.signedAt).toLocaleDateString('en-CA'))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
