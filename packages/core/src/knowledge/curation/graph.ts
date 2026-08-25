/**
 * Build a curation graph from a set of claims.
 *
 * This module is pure — it has no side effects and depends only on its inputs.
 * It imports from `./types` which defines the shared contract for all curation
 * components.
 */

import {
  GRAPH_NODE_KINDS,
  GRAPH_EDGE_KINDS,
  type Claim,
  type CurationGraph,
  type GraphNode,
  type GraphEdge,
  claimConfidence,
  formatTimecode,
} from './types';

/**
 * Build a curation graph from claims.
 *
 * @param claims - The set of claims to build the graph from
 * @param maxNodes - Optional maximum number of nodes; if exceeded, claim nodes are collapsed
 * @returns A curation graph with nodes and edges
 */
export function buildCurationGraph(
  claims: readonly Claim[],
  maxNodes?: number,
): CurationGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let collapsed = false;
  
  // Track unique values for node creation using arrays instead of Sets for ES5 compatibility
  const corpusList: string[] = [];
  const topicList: string[] = [];
  const momentList: string[] = [];
  const speakerList: string[] = [];
  const sessionList: string[] = [];
  
  // Helper to check if value exists in array (ES5 compatible)
  function arrayContains(arr: string[], value: string): boolean {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === value) return true;
    }
    return false;
  }
  
  // Helper to add unique value to array
  function addUnique(arr: string[], value: string): void {
    if (!arrayContains(arr, value)) {
      arr.push(value);
    }
  }
  
  // Maps to track node IDs and their data
  const corpusNodes: Record<string, GraphNode> = {};
  const topicNodes: Record<string, GraphNode> = {};
  const momentNodes: Record<string, GraphNode> = {};
  const speakerNodes: Record<string, GraphNode> = {};
  const sessionNodes: Record<string, GraphNode> = {};
  const claimNodes: Record<string, GraphNode> = {};
  
  // Track relationships for edges
  const topicClaimEdges: Array<{ claimId: string; topicId: string }> = [];
  const momentClaimEdges: Array<{ claimId: string; momentId: string }> = [];
  const sessionClaimEdges: Array<{ claimId: string; sessionId: string }> = [];
  const speakerSessionEdges: Array<{ sessionId: string; speakerId: string }> = [];
  
  // Process claims and build node collections
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    
    // Add corpus
    addUnique(corpusList, claim.corpus);
    
    // Add topic (category)
    addUnique(topicList, `topic:${claim.category}`);
    
    // Add moment (but not 'none')
    if (claim.moment !== 'none') {
      addUnique(momentList, `moment:${claim.moment}`);
    }
    
    // Process provenance to build speaker and session info
    for (let j = 0; j < claim.provenance.length; j++) {
      const prov = claim.provenance[j];
      if (prov.speaker !== null) {
        addUnique(speakerList, prov.speaker);
      }
      
      if (prov.sessionTitle !== null) {
        addUnique(sessionList, prov.sessionTitle);
      }
    }
    
    // Create claim node
    const claimNode: GraphNode = {
      id: `claim:${claim.id}`,
      kind: 'claim',
      label: claim.claim,
      reviewState: claim.reviewState,
      weight: claim.distinctEvents,
      confidence: claimConfidence(claim),
      alertCount: 0, // We don't have alerts in this function
      verifiedRatio: claim.reviewState === 'verified' ? 1 : 0,
    };
    
    claimNodes[claim.id] = claimNode;
  }
  
  // Create corpus nodes
  for (let i = 0; i < corpusList.length; i++) {
    const corpus = corpusList[i];
    const corpusNode: GraphNode = {
      id: `corpus:${corpus}`,
      kind: 'corpus',
      label: corpus,
      reviewState: null,
      weight: 0, // Will be updated later with claim count
      confidence: 0, // Corpus nodes don't have confidence
      alertCount: 0,
      verifiedRatio: 0,
    };
    corpusNodes[corpus] = corpusNode;
    nodes.push(corpusNode);
  }
  
  // Create topic nodes
  for (let i = 0; i < topicList.length; i++) {
    const category = topicList[i];
    const topicNode: GraphNode = {
      id: category,
      kind: 'topic',
      label: category.replace('topic:', ''),
      reviewState: null,
      weight: 0, // Will be updated later with claim count
      confidence: 0, // Will be updated later with average child confidence
      alertCount: 0,
      verifiedRatio: 0,
    };
    topicNodes[category] = topicNode;
    nodes.push(topicNode);
  }
  
  // Create moment nodes (excluding 'none')
  for (let i = 0; i < momentList.length; i++) {
    const moment = momentList[i];
    const momentNode: GraphNode = {
      id: moment,
      kind: 'moment',
      label: moment.replace('moment:', ''),
      reviewState: null,
      weight: 0, // Will be updated later with claim count
      confidence: 0, // Will be updated later with average child confidence
      alertCount: 0,
      verifiedRatio: 0,
    };
    momentNodes[moment] = momentNode;
    nodes.push(momentNode);
  }
  
  // Create speaker nodes
  for (let i = 0; i < speakerList.length; i++) {
    const speaker = speakerList[i];
    const speakerNode: GraphNode = {
      id: `speaker:${speaker}`,
      kind: 'speaker',
      label: speaker,
      reviewState: null,
      weight: 0, // Will be updated later with claim count
      confidence: 0, // Will be updated later with average child confidence
      alertCount: 0,
      verifiedRatio: 0,
    };
    speakerNodes[speaker] = speakerNode;
    nodes.push(speakerNode);
  }
  
  // Create session nodes
  for (let i = 0; i < sessionList.length; i++) {
    const session = sessionList[i];
    const sessionNode: GraphNode = {
      id: `session:${session}`,
      kind: 'session',
      label: session,
      reviewState: null,
      weight: 0, // Will be updated later with claim count
      confidence: 0, // Will be updated later with average child confidence
      alertCount: 0,
      verifiedRatio: 0,
    };
    sessionNodes[session] = sessionNode;
    nodes.push(sessionNode);
  }
  
  // Build edges and update weights for grouping nodes
  const claimCountsByTopic: Record<string, number> = {};
  const claimCountsByMoment: Record<string, number> = {};
  const claimCountsBySession: Record<string, number> = {};
  const claimCountsBySpeaker: Record<string, number> = {};
  
  // Track which claims are assigned to which groups for calculating confidence
  const topicClaims: Record<string, string[]> = {};
  const momentClaims: Record<string, string[]> = {};
  const sessionClaims: Record<string, string[]> = {};
  const speakerClaims: Record<string, string[]> = {};
  
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    
    // About topic edge
    const topicId = `topic:${claim.category}`;
    topicClaimEdges.push({ claimId: claim.id, topicId });
    
    if (!topicClaims[topicId]) {
      topicClaims[topicId] = [];
    }
    topicClaims[topicId].push(claim.id);
    
    // About moment edge (if not 'none')
    if (claim.moment !== 'none') {
      const momentId = `moment:${claim.moment}`;
      momentClaimEdges.push({ claimId: claim.id, momentId });
      
      if (!momentClaims[momentId]) {
        momentClaims[momentId] = [];
      }
      momentClaims[momentId].push(claim.id);
    }
    
    // Came from session edge
    for (let j = 0; j < claim.provenance.length; j++) {
      const prov = claim.provenance[j];
      if (prov.sessionTitle !== null) {
        const sessionId = `session:${prov.sessionTitle}`;
        sessionClaimEdges.push({ claimId: claim.id, sessionId });
        
        if (!sessionClaims[sessionId]) {
          sessionClaims[sessionId] = [];
        }
        sessionClaims[sessionId].push(claim.id);
      }
      
      // Spoken by speaker edge
      if (prov.speaker !== null) {
        const speakerId = `speaker:${prov.speaker}`;
        if (!speakerClaims[speakerId]) {
          speakerClaims[speakerId] = [];
        }
        speakerClaims[speakerId].push(claim.id);
        
        // Add the session -> speaker edge
        if (prov.sessionTitle !== null) {
          const sessionId = `session:${prov.sessionTitle}`;
          speakerSessionEdges.push({ sessionId, speakerId });
        }
      }
    }
  }
  
  // Update weights and confidence for grouping nodes
  for (const topicId in topicClaims) {
    const claimIds = topicClaims[topicId];
    const node = topicNodes[topicId];
    if (node) {
      node.weight = claimIds.length;
      
      // Calculate average confidence for the topic
      let totalConfidence = 0;
      for (let i = 0; i < claimIds.length; i++) {
        const claimId = claimIds[i];
        const claim = claims.find(c => c.id === claimId);
        if (claim) {
          totalConfidence += claimConfidence(claim);
        }
      }
      node.confidence = claimIds.length > 0 ? totalConfidence / claimIds.length : 0;
      
      // Update the collapsed count if needed
      const claimCount = claimIds.length;
      if (claimCount > 0) {
        node.collapsedCount = claimCount;
      }
    }
  }
  
  for (const momentId in momentClaims) {
    const claimIds = momentClaims[momentId];
    const node = momentNodes[momentId];
    if (node) {
      node.weight = claimIds.length;
      
      // Calculate average confidence for the moment
      let totalConfidence = 0;
      for (let i = 0; i < claimIds.length; i++) {
        const claimId = claimIds[i];
        const claim = claims.find(c => c.id === claimId);
        if (claim) {
          totalConfidence += claimConfidence(claim);
        }
      }
      node.confidence = claimIds.length > 0 ? totalConfidence / claimIds.length : 0;
    }
  }
  
  for (const sessionId in sessionClaims) {
    const claimIds = sessionClaims[sessionId];
    const node = sessionNodes[sessionId];
    if (node) {
      node.weight = claimIds.length;
      
      // Calculate average confidence for the session
      let totalConfidence = 0;
      for (let i = 0; i < claimIds.length; i++) {
        const claimId = claimIds[i];
        const claim = claims.find(c => c.id === claimId);
        if (claim) {
          totalConfidence += claimConfidence(claim);
        }
      }
      node.confidence = claimIds.length > 0 ? totalConfidence / claimIds.length : 0;
    }
  }
  
  for (const speakerId in speakerClaims) {
    const claimIds = speakerClaims[speakerId];
    const node = speakerNodes[speakerId];
    if (node) {
      node.weight = claimIds.length;
      
      // Calculate average confidence for the speaker
      let totalConfidence = 0;
      for (let i = 0; i < claimIds.length; i++) {
        const claimId = claimIds[i];
        const claim = claims.find(c => c.id === claimId);
        if (claim) {
          totalConfidence += claimConfidence(claim);
        }
      }
      node.confidence = claimIds.length > 0 ? totalConfidence / claimIds.length : 0;
    }
  }
  
  // Build edges
  for (let i = 0; i < topicClaimEdges.length; i++) {
    const edge = topicClaimEdges[i];
    edges.push({
      source: `claim:${edge.claimId}`,
      target: edge.topicId,
      kind: 'about_topic',
      strength: 0,
    });
  }
  
  for (let i = 0; i < momentClaimEdges.length; i++) {
    const edge = momentClaimEdges[i];
    edges.push({
      source: `claim:${edge.claimId}`,
      target: edge.momentId,
      kind: 'about_moment',
      strength: 0,
    });
  }
  
  for (let i = 0; i < sessionClaimEdges.length; i++) {
    const edge = sessionClaimEdges[i];
    edges.push({
      source: `claim:${edge.claimId}`,
      target: edge.sessionId,
      kind: 'came_from',
      strength: 0,
    });
  }
  
  for (let i = 0; i < speakerSessionEdges.length; i++) {
    const edge = speakerSessionEdges[i];
    edges.push({
      source: edge.sessionId,
      target: edge.speakerId,
      kind: 'spoken_by',
      strength: 0,
    });
  }
  
  // Add edges from corpus to topics and moments
  for (let i = 0; i < corpusList.length; i++) {
    const corpus = corpusList[i];
    const corpusNode = corpusNodes[corpus];
    if (corpusNode) {
      // Add edges to all topics in this corpus
      for (let j = 0; j < topicList.length; j++) {
        const topicId = topicList[j];
        edges.push({
          source: `corpus:${corpus}`,
          target: topicId,
          kind: 'about_topic',
          strength: 0,
        });
      }
      
      // Add edges to all moments in this corpus (excluding 'none')
      for (let j = 0; j < momentList.length; j++) {
        const momentId = momentList[j];
        if (momentId !== 'moment:none') {
          edges.push({
            source: `corpus:${corpus}`,
            target: momentId,
            kind: 'about_moment',
            strength: 0,
          });
        }
      }
    }
  }
  
  // Add claim nodes if within max node limit or if no max is set
  if (maxNodes === undefined || 
      (nodes.length + Object.keys(claimNodes).length) <= maxNodes) {
    // Include individual claim nodes
    for (const claimId in claimNodes) {
      nodes.push(claimNodes[claimId]);
    }
  } else {
    // Collapse claim nodes - set collapsed flag and update topic weights
    collapsed = true;
    
    // Update topic nodes with collapsed counts
    for (const topicId in topicClaims) {
      const node = topicNodes[topicId];
      if (node) {
        node.collapsedCount = node.weight;
        node.weight = 0; // Reset weight since we're collapsing claims
        
        // Recalculate confidence based on children (this is how it should be done)
        let totalConfidence = 0;
        let childCount = 0;
        for (let i = 0; i < topicClaims[topicId].length; i++) {
          const claimId = topicClaims[topicId][i];
          const claim = claims.find(c => c.id === claimId);
          if (claim) {
            totalConfidence += claimConfidence(claim);
            childCount++;
          }
        }
        node.confidence = childCount > 0 ? totalConfidence / childCount : 0;
      }
    }
    
    // Update session nodes with collapsed counts
    for (const sessionId in sessionClaims) {
      const node = sessionNodes[sessionId];
      if (node) {
        node.collapsedCount = node.weight;
        node.weight = 0; // Reset weight since we're collapsing claims
        
        // Recalculate confidence based on children
        let totalConfidence = 0;
        let childCount = 0;
        for (let i = 0; i < sessionClaims[sessionId].length; i++) {
          const claimId = sessionClaims[sessionId][i];
          const claim = claims.find(c => c.id === claimId);
          if (claim) {
            totalConfidence += claimConfidence(claim);
            childCount++;
          }
        }
        node.confidence = childCount > 0 ? totalConfidence / childCount : 0;
      }
    }
    
    // Update speaker nodes with collapsed counts
    for (const speakerId in speakerClaims) {
      const node = speakerNodes[speakerId];
      if (node) {
        node.collapsedCount = node.weight;
        node.weight = 0; // Reset weight since we're collapsing claims
        
        // Recalculate confidence based on children
        let totalConfidence = 0;
        let childCount = 0;
        for (let i = 0; i < speakerClaims[speakerId].length; i++) {
          const claimId = speakerClaims[speakerId][i];
          const claim = claims.find(c => c.id === claimId);
          if (claim) {
            totalConfidence += claimConfidence(claim);
            childCount++;
          }
        }
        node.confidence = childCount > 0 ? totalConfidence / childCount : 0;
      }
    }
    
    // Update moment nodes with collapsed counts
    for (const momentId in momentClaims) {
      const node = momentNodes[momentId];
      if (node) {
        node.collapsedCount = node.weight;
        node.weight = 0; // Reset weight since we're collapsing claims
        
        // Recalculate confidence based on children
        let totalConfidence = 0;
        let childCount = 0;
        for (let i = 0; i < momentClaims[momentId].length; i++) {
          const claimId = momentClaims[momentId][i];
          const claim = claims.find(c => c.id === claimId);
          if (claim) {
            totalConfidence += claimConfidence(claim);
            childCount++;
          }
        }
        node.confidence = childCount > 0 ? totalConfidence / childCount : 0;
      }
    }
    
    // Remove claim nodes since they are collapsed
    // We don't need to add them, so we skip that part
  }
  
  // Add the final nodes (without individual claims if collapsed)
  const resultNodes = [...nodes];
  
  return {
    nodes: resultNodes,
    edges,
    collapsed,
  };
}