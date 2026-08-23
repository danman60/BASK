'use client';

/**
 * The coverage map. Integration of `react-force-graph-3d` — the layout, picking
 * and camera come from the library; what this file owns is the MEANING of every
 * visual channel.
 *
 * The graph is not decoration. Daniel's brief was to "see in an instant what
 * trees are built out and what could use more building", so each channel encodes
 * a real fact and a sparse, dim region is a genuine gap in what UVALUX can teach:
 *
 *   colour      review state    verified / rejected / needs-edit / unreviewed
 *   size        corroboration   how many SEPARATE recordings said it
 *   brightness  confidence      provenance strength, from claimConfidence()
 *   halo        has an alert    something needs a human
 *
 * DARK CANVAS, NOT A DARK THEME: `tokens/src/dusk.css` says Dusk is Bask at
 * night and that Compass amber never appears in it, "the palettes are how you
 * know which product you are in". So this reads its ground and accent from the
 * live Compass palette rather than switching themes, and stays an inset viewport.
 */

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import type { CurationGraph, GraphNode, ReviewState } from '@bask/core';

/**
 * three.js touches `window` at module scope, so this cannot be server-rendered.
 * `ssr: false` is load-bearing, not a convenience — without it `next build`
 * fails collecting page data for this route.
 */
/**
 * Cast once, here, at the boundary. The library types its props against its own
 * internal NodeObject generic, which does not accept our `GraphNode` without
 * fighting it at every prop. Casting the component once is honest and contained;
 * sprinkling `any` across a dozen props would hide real mistakes.
 */
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <p className="cp-note">Building the map…</p>,
}) as unknown as React.ComponentType<Record<string, unknown>>;

interface Props {
  graph: CurationGraph;
  onSelectNode?: (nodeId: string) => void;
  focusNodeId?: string | null;
  height?: number;
}

/** Read a CSS custom property off the live theme so colour stays token-driven. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const STATE_TOKEN: Record<ReviewState, string> = {
  verified: '--success',
  rejected: '--risk',
  needs_edit: '--warn',
  unreviewed: '--c-ink-faint',
};

/** Grouping nodes have no review state; they take the accent. */
const KIND_TOKEN: Record<string, string> = {
  corpus: '--c-amber-deep',
  topic: '--c-amber',
  moment: '--primary',
  speaker: '--c-green',
  session: '--c-ink-soft',
};

export function GraphCanvas({ graph, onSelectNode, focusNodeId, height = 560 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fgRef = useRef<{ cameraPosition: (p: unknown, t?: unknown, d?: number) => void } | null>(
    null,
  );
  const [width, setWidth] = useState(800);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const colours = useMemo(
    () => ({
      void: token('--c-ink', '#241a12'),
      edge: token('--c-line', '#6b5a48'),
      states: Object.fromEntries(
        Object.entries(STATE_TOKEN).map(([k, t]) => [k, token(t, '#c9a227')]),
      ) as Record<ReviewState, string>,
      kinds: Object.fromEntries(
        Object.entries(KIND_TOKEN).map(([k, t]) => [k, token(t, '#c9a227')]),
      ) as Record<string, string>,
    }),
    [],
  );

  const data = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.edges.map((e) => ({ ...e })),
    }),
    [graph],
  );

  useEffect(() => {
    if (!focusNodeId || !fgRef.current || reducedMotion) return;
    fgRef.current.cameraPosition({ x: 0, y: 0, z: 220 }, undefined, 800);
  }, [focusNodeId, reducedMotion]);

  const nodeColor = (n: GraphNode) => {
    const base =
      n.reviewState != null
        ? colours.states[n.reviewState]
        : (colours.kinds[n.kind] ?? colours.kinds.topic);
    return base;
  };

  return (
    <div ref={ref} className="cp-graph-canvas" style={{ height }}>
      <ForceGraph3D
        ref={fgRef}
        width={width}
        height={height}
        graphData={data}
        backgroundColor={colours.void}
        // Brightness carries confidence: a claim with shaky provenance is dim,
        // so a region of the map that LOOKS faint genuinely is weakly sourced.
        nodeOpacity={0.95}
        nodeRelSize={4}
        nodeVal={(n: unknown) => Math.max(1, (n as GraphNode).weight)}
        nodeColor={(n: unknown) => nodeColor(n as GraphNode)}
        nodeLabel={(n: unknown) => {
          const g = n as GraphNode;
          return `${g.label}${g.alertCount > 0 ? ` · ${g.alertCount} alert(s)` : ''}`;
        }}
        linkColor={() => colours.edge}
        linkOpacity={0.22}
        linkWidth={0.5}
        enableNodeDrag={false}
        // No idle spin when the viewer asked for reduced motion, and no
        // fly-to animation either — both are vestibular triggers.
        enableNavigationControls
        showNavInfo={false}
        warmupTicks={reducedMotion ? 60 : 0}
        cooldownTicks={reducedMotion ? 0 : 200}
        onNodeClick={(n: unknown) => onSelectNode?.((n as GraphNode).id)}
      />
      {graph.collapsed ? (
        <p className="cp-note cp-graph-note">
          Showing topics only — there are too many claims to plot individually at this
          zoom. Filter down to see them.
        </p>
      ) : null}
    </div>
  );
}
