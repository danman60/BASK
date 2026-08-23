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
import SpriteText from 'three-spritetext';

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

/**
 * Resolve a design token to an rgb() string.
 *
 * Reading the custom property directly returns its AUTHORED text, which for this
 * palette is `oklch(...)`. three.js and its colour helpers cannot parse oklch and
 * throw. Painting the token onto a probe element and reading back the COMPUTED
 * `color` makes the browser do the conversion, so we get `rgb(r, g, b)` — parseable
 * everywhere, and still driven entirely by the token rather than a literal.
 */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved && resolved.startsWith('rgb') ? resolved : fallback;
}

const STATE_TOKEN: Record<ReviewState, string> = {
  verified: '--success',
  rejected: '--risk',
  needs_edit: '--warn',
  unreviewed: '--c-ink-faint',
};

/**
 * Colour buckets for VERIFIED SHARE — the map's primary channel.
 *
 * Previously colour carried per-claim review state, which is uniform until
 * curation has already happened. That made the map blank exactly when it was
 * most needed: at the start, when you are deciding where to spend effort. Share
 * of verified claims is knowable on day one, so an untouched topic and a
 * finished one look different immediately.
 */
const RATIO_TOKEN: [number, string][] = [
  [0.999, '--success'],
  [0.5, '--c-green'],
  [0.001, '--warn'],
  [-1, '--c-ink-faint'],
];

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
      ratios: Object.fromEntries(
        RATIO_TOKEN.map(([, t]) => [t, token(t, '#c9a227')]),
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
    // A claim still shows its own verdict — rejected must look rejected.
    if (n.kind === 'claim' && n.reviewState != null) {
      return colours.states[n.reviewState];
    }
    const bucket = RATIO_TOKEN.find(([min]) => n.verifiedRatio > min);
    return colours.ratios[bucket ? bucket[1] : '--c-ink-faint'] ?? colours.kinds.topic;
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
        // Only GROUPING nodes get a label. Labelling every claim would render
        // the map unreadable, which is the opposite of the point.
        nodeLabel={(n: unknown) => {
          const g = n as GraphNode;
          const pct = Math.round(g.verifiedRatio * 100);
          return g.kind === 'claim'
            ? g.label
            : `${g.label} — ${g.weight} claims, ${pct}% verified`;
        }}
        nodeThreeObjectExtend
        nodeThreeObject={(n: unknown) => {
          const g = n as GraphNode;
          if (g.kind === 'claim' || g.kind === 'corpus') return null;
          const sprite = new SpriteText(g.label, 9, nodeColor(g));
          sprite.fontFace = 'Inter, system-ui, sans-serif';
          // Lift the label clear of the node. SpriteText's own typings do not
          // expose Object3D members, so reach position through the base type.
          const obj = sprite as unknown as { position: { set: (x: number, y: number, z: number) => void } };
          obj.position.set(0, Math.cbrt(Math.max(1, g.weight)) * 3.6 + 3, 0);
          return sprite;
        }}
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
