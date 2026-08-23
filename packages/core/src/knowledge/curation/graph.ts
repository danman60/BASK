/**
 * Builds a curation graph from claims.
 *
 * Spec: `docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md`.
 *
 * This file is the API surface every curation component builds against. It is
 * TYPES AND PURE HELPERS ONLY — no data access, no React, no side effects — so it
 * can be injected as a contract into a build without dragging the app in with it.
 */

import { Claim, ClaimCategory, ClaimMoment, CurationGraph, GraphEdge, GraphNode, claimConfidence, formatTimecode, reviewProgress } from "./types";

/**
 * Builds a curation graph from claims.
 *
 * @param claims - The claims to build the graph from
 * @param maxNodeCount - Optional maximum number of nodes to include (LOD)
 * @returns A curation graph with nodes and edges
 */
export function buildCurationGraph(
  claims: readonly Claim[],
  maxNodeCount?: number,
): CurationGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let collapsed = false;

  // Build sets of unique values for grouping
  const corpora = new Set<string>();
  const topics = new Set<ClaimCategory>();
  const moments = new Set<ClaimMoment>();
  const speakers = new Set<string>();
  const sessions = new Set<string>();

  claims.forEach((claim) => {
    corpora.add(claim.corpus);
    topics.add(claim.category);
    moments.add(claim.moment);
    
    // Add speaker if present
    claim.provenance.forEach((prov) => {
      if (prov.speaker) {
        speakers.add(prov.speaker);
      }
      if (prov.sessionTitle) {
        sessions.add(prov.sessionTitle);
      }
    });
  });

  // Create corpus nodes
  corpora.forEach((corpus) => {
    nodes.push({
      id: corpus,
      kind: 'corpus',
      label: corpus,
      reviewState: null,
      weight: 0, // Will be set later when counting claims
      confidence: 0,
      alertCount: 0,
      verifiedRatio: 0,
    });
  });

  // Create topic nodes
  topics.forEach((category) => {
    nodes.push({
      id: `topic:${category}`,
      kind: 'topic',
      label: category,
      reviewState: null,
      weight: 0, // Will be set later when counting claims
      confidence: 0,
      alertCount: 0,
      verifiedRatio: 0,
      collapsedCount: 0,
    });
  });

  // Create moment nodes (excluding 'none')
  moments.forEach((moment) => {
    if (moment !== 'none') {
      nodes.push({
        id: `moment:${moment}`,
        kind: 'moment',
        label: moment,
        reviewState: null,
        weight: 0, // Will be set later when counting claims
        confidence: 0,
        alertCount: 0,
        verifiedRatio: 0,
      });
    }
  });

  // Create speaker nodes
  speakers.forEach((speaker) => {
    nodes.push({
      id: `speaker:${speaker}`,
      kind: 'speaker',
      label: speaker,
      reviewState: null,
      weight: 0, // Will be set later when counting claims
      confidence: 0,
      alertCount: 0,
      verifiedRatio: 0,
    });
  });

  // Create session nodes
  sessions.forEach((session) => {
    nodes.push({
      id: `session:${session}`,
      kind: 'session',
      label: session,
      reviewState: null,
      weight: 0, // Will be set later when counting claims
      confidence: 0,
      alertCount: 0,
      verifiedRatio: 0,
    });
  });

  // Track claim counts for grouping nodes
  const topicCounts = new Map<ClaimCategory, number>();
  const momentCounts = new Map<ClaimMoment, number>();
  const speakerCounts = new Map<string, number>();
  const sessionCounts = new Map<string, number>();
  const corpusCounts = new Map<string, number>();

  // Create claim nodes and track counts
  const claimNodes: GraphNode[] = [];
  claims.forEach((claim) => {
    const claimNode: GraphNode = {
      id: claim.id,
      kind: 'claim',
      label: claim.claim,
      reviewState: claim.reviewState,
      weight: claim.distinctEvents,
      confidence: claimConfidence(claim),
      alertCount: 0,
      verifiedRatio: claim.reviewState === 'verified' ? 1 : 0, // Will be set later
    };
    
    claimNodes.push(claimNode);
    
    // Update counts for grouping nodes
    corpusCounts.set(claim.corpus, (corpusCounts.get(claim.corpus) || 0) + 1);
    topicCounts.set(claim.category, (topicCounts.get(claim.category) || 0) + 1);
    
    if (claim.moment !== 'none') {
      momentCounts.set(claim.moment, (momentCounts.get(claim.moment) || 0) + 1);
    }
    
    claim.provenance.forEach((prov) => {
      if (prov.speaker) {
        speakerCounts.set(prov.speaker, (speakerCounts.get(prov.speaker) || 0) + 1);
      }
      if (prov.sessionTitle) {
        sessionCounts.set(prov.sessionTitle, (sessionCounts.get(prov.sessionTitle) || 0) + 1);
      }
    });
  });

  // Set weights for grouping nodes
  nodes.forEach((node) => {
    switch (node.kind) {
      case 'corpus':
        node.weight = corpusCounts.get(node.id) || 0;
        break;
      case 'topic':
        node.weight = topicCounts.get(node.id.split(':')[1] as ClaimCategory) || 0;
        break;
      case 'moment':
        if (node.id.startsWith('moment:')) {
          const moment = node.id.split(':')[1] as ClaimMoment;
          node.weight = momentCounts.get(moment) || 0;
        }
        break;
      case 'speaker':
        node.weight = speakerCounts.get(node.id.split(':')[1]) || 0;
        break;
      case 'session':
        node.weight = sessionCounts.get(node.id.split(':')[1]) || 0;
        break;
    }
  });

  // Check if we need to collapse based on maxNodeCount
  const totalNodes = nodes.length + claimNodes.length;
  
  if (maxNodeCount !== undefined && totalNodes > maxNodeCount) {
    collapsed = true;
    
    // Collapse claim nodes by topic - set collapsed count for each topic
    topics.forEach((category) => {
      const topicNode = nodes.find(n => n.id === `topic:${category}`);
      if (topicNode) {
        const count = topicCounts.get(category) || 0;
        topicNode.collapsedCount = count;
        // Set the weight to include collapsed claims
        topicNode.weight += count;
      }
    });
    
    // Remove claim nodes since they're collapsed
    // We'll keep them in a separate array for edge creation but not add them to final nodes list
  } else {
    // Add claim nodes to the graph
    nodes.push(...claimNodes);
  }

  // Create edges - only when not collapsed or if we're keeping individual claims
  claims.forEach((claim) => {
    // About topic edge
    edges.push({
      source: claim.id,
      target: `topic:${claim.category}`,
      kind: 'about_topic',
      strength: 0,
    });
    
    // About moment edge (when not none)
    if (claim.moment !== 'none') {
      edges.push({
        source: claim.id,
        target: `moment:${claim.moment}`,
        kind: 'about_moment',
        strength: 0,
      });
    }
    
    // Came from session edge (when session exists)
    const firstProv = claim.provenance[0];
    if (firstProv && firstProv.sessionTitle) {
      edges.push({
        source: claim.id,
        target: `session:${firstProv.sessionTitle}`,
        kind: 'came_from',
        strength: 0,
      });
      
      // Add reverse edge from session to claim for proper graph structure
      if (!collapsed) {
        edges.push({
          source: `session:${firstProv.sessionTitle}`,
          target: claim.id,
          kind: 'came_from',
          strength: 0,
        });
      }
    }
    
    // Spoken by edge (when speaker exists)
    if (firstProv && firstProv.speaker) {
      edges.push({
        source: `session:${firstProv.sessionTitle || ''}`,
        target: `speaker:${firstProv.speaker}`,
        kind: 'spoken_by',
        strength: 0,
      });
    }
  });

  // Grouping-node confidence and verified ratio, computed from the real children.
  //
  // These were previously hardcoded to 0.5 with a "placeholder" comment, which
  // meant brightness on every topic and session node was a fabricated number
  // rendered as if it were data. A map that invents its own signal is worse than
  // one that shows nothing, because it looks informative.
  const rollup = (
    kind: GraphNode['kind'],
    keyOf: (claim: Claim) => string | null,
  ) => {
    const buckets = new Map<string, Claim[]>();
    for (const claim of claims) {
      const key = keyOf(claim);
      if (key == null) continue;
      const list = buckets.get(key);
      if (list) list.push(claim);
      else buckets.set(key, [claim]);
    }
    for (const node of nodes) {
      if (node.kind !== kind) continue;
      const members = buckets.get(node.id) ?? [];
      if (members.length === 0) {
        node.confidence = 0;
        node.verifiedRatio = 0;
        continue;
      }
      node.confidence =
        members.reduce((sum, c) => sum + claimConfidence(c), 0) / members.length;
      node.verifiedRatio =
        members.filter((c) => c.reviewState === 'verified').length / members.length;
    }
  };

  rollup('topic', (c) => `topic:${c.category}`);
  rollup('moment', (c) => (c.moment === 'none' ? null : `moment:${c.moment}`));
  rollup('corpus', (c) => `corpus:${c.corpus}`);
  rollup('session', (c) => {
    const title = c.provenance.find((p) => p.sessionTitle)?.sessionTitle;
    return title ? `session:${title}` : null;
  });
  rollup('speaker', (c) => {
    const sp = c.provenance.find((p) => p.speaker)?.speaker;
    return sp ? `speaker:${sp}` : null;
  });

  return {
    nodes: collapsed ? nodes.filter(n => !n.id.startsWith('claim:')) : nodes,
    edges,
    collapsed,
  };
}