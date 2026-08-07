'use client';

import { useState } from 'react';

import { FLOOR } from '../copy';

/**
 * The unknown-barcode sheet (IMPLEMENTATION_SPEC §6.2).
 *
 * Budget is twenty seconds, so it asks for four things and guesses the rest. The
 * symbology and code are already known — they came off the scan — and the
 * catalogue builds itself through use rather than through a data-entry project
 * nobody at a salon is going to do.
 */

const CATEGORIES = [
  'bronzer',
  'accelerator',
  'aftercare',
  'face',
  'wellness',
  'accessory',
  'kit',
] as const;

export function QuickCreateSheet({
  barcode,
  symbology,
  busy,
  onClose,
  onCreate,
}: {
  barcode: string;
  symbology: 'upc_a' | 'ean_13' | 'code_128' | 'custom';
  busy: boolean;
  onClose: () => void;
  onCreate: (input: {
    barcode: string;
    symbology: 'upc_a' | 'ean_13' | 'code_128' | 'custom';
    name: string;
    price: number;
    category: string;
    brand?: string;
    size?: string;
    onHand: number;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [onHand, setOnHand] = useState('1');

  const ready = name.trim().length >= 2 && Number(price) > 0;

  return (
    <div
      className="sheet-scrim center"
      role="dialog"
      aria-label={FLOOR.quickCreate.title}
      onClick={onClose}
    >
      <div className="sheet center" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>{FLOOR.quickCreate.title}</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
              {FLOOR.quickCreate.body(barcode)}
            </p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <label className="floor-field">
          <span className="k">{FLOOR.quickCreate.name}</span>
          <input value={name} autoFocus onChange={(e) => setName(e.target.value)} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <label className="floor-field">
            <span className="k">{FLOOR.quickCreate.price}</span>
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label className="floor-field">
            <span className="k">{FLOOR.quickCreate.onHand}</span>
            <input inputMode="numeric" value={onHand} onChange={(e) => setOnHand(e.target.value)} />
          </label>
          <label className="floor-field">
            <span className="k">{FLOOR.quickCreate.category}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="floor-field">
            <span className="k">{FLOOR.quickCreate.brand}</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </label>
          <label className="floor-field">
            <span className="k">{FLOOR.quickCreate.size}</span>
            <input value={size} onChange={(e) => setSize(e.target.value)} />
          </label>
        </div>

        <button
          type="button"
          className="btn btn-primary start"
          disabled={!ready || busy}
          onClick={() =>
            onCreate({
              barcode,
              symbology,
              name,
              price: Number(price),
              category,
              brand: brand || undefined,
              size: size || undefined,
              onHand: Number(onHand) || 0,
            })
          }
        >
          {FLOOR.quickCreate.save}
        </button>
      </div>
    </div>
  );
}
