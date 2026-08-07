'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FLOOR } from '../copy';

/**
 * SignaturePad (DESIGN_SPEC §4) — a real signature, captured on a canvas.
 *
 * Pointer Events rather than mouse+touch pairs: one code path covers a finger on
 * a counter tablet, a stylus, and a mouse, and `setPointerCapture` means a
 * signature that runs off the edge of the box still finishes cleanly instead of
 * ending mid-stroke.
 *
 * The canvas is backed at devicePixelRatio so the stored PNG is not a blurry
 * upscale of a 1x bitmap — a waiver you cannot read is not a waiver.
 */

export interface SignatureResult {
  imageData: string;
  width: number;
  height: number;
  strokes: number;
}

export function SignaturePad({
  onChange,
  disabled = false,
}: {
  onChange: (result: SignatureResult | null) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const [hasInk, setHasInk] = useState(false);
  const notify = useRef(onChange);
  notify.current = onChange;

  const prepare = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return ctx;
  }, []);

  // Size the backing store to the element's real pixels. Re-run on resize so a
  // window drag does not leave the ink offset from the pointer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const previous = strokes.current > 0 ? canvas.toDataURL('image/png') : null;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#2a2029';
      if (previous) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = previous;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const emit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (strokes.current === 0) {
      notify.current(null);
      return;
    }
    notify.current({
      imageData: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      strokes: strokes.current,
    });
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = prepare();
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    strokes.current += 1;
    const { x, y } = pointFrom(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // A tap with no drag still leaves a mark — signatures have dots in them.
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    setHasInk(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = prepare();
    if (!ctx) return;
    const { x, y } = pointFrom(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    emit();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = prepare();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.current = 0;
    setHasInk(false);
    notify.current(null);
  };

  return (
    <div className="sig-card">
      <canvas
        ref={canvasRef}
        className="sig-canvas"
        aria-label={FLOOR.waiver.prompt}
        role="img"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <p className="sig-prompt">{FLOOR.waiver.prompt}</p>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ marginTop: 8, padding: '6px 10px' }}
        onClick={clear}
        disabled={!hasInk}
      >
        {FLOOR.waiver.clear}
      </button>
    </div>
  );
}
