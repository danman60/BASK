/**
 * @bask/core — domain types, insight rules engine, demo clock, consent filter,
 * metric baselines. Pure TS, zero UI deps: identical on server, web, and mobile.
 *
 * The only LLM provider is OpenAI, and its SDK is imported lazily — a
 * `await import('openai')` inside `generateJson` in `ai/client.ts`, reached only
 * when `OPENAI_API_KEY` is set — so importing this barrel from a browser or
 * React Native bundle stays safe.
 *
 * Landed: demo clock (step 4), Evidence + rules engine (step 5), AI module and
 * Daybreak generation (step 6), pipeline orchestration.
 * Still to come: session state machine + EquipmentDriver (step 7), consent
 * filter (step 11).
 */

export const PRODUCT_NAME = 'Bask';
export const DEALER_PRODUCT_NAME = 'Compass';
export const SPINE_VERSION = '0.0.0-m0';

/** Everything user-facing renders in this zone (see docs/plans constraint). */
export const DISPLAY_TIMEZONE = 'America/New_York';

// Demo clock (IMPLEMENTATION_SPEC §1.4)
export {
  SALON_TIMEZONE,
  addDays,
  assertDateOnly,
  createRealClock,
  createVirtualClock,
  dateOnlyToUtcMidnight,
  dateParts,
  dayOfWeek,
  diffDays,
  eachDay,
  formatLongDate,
  offsetMinutes,
  resolveClock,
  toDateOnly,
  weekdayName,
  zonedToUtc,
  type Clock,
  type DateOnly,
  type DemoStateLike,
} from './clock';

// Label formatters — the ONE hour/weekday/number-word renderer. Four private
// copies had drifted (`2pm` in the insight card vs `2 pm` in the campaign
// generated from that same slot); this is the single source.
export { formatHour, formatHourRange, numberWord, weekdayNameForIndex } from './format';

// The ONE Evidence schema (IMPLEMENTATION_SPEC §2, DESIGN_SPEC §4)
export {
  EVIDENCE_VERSION,
  buildComparison,
  buildMetric,
  buildWindow,
  contributingFactorSchema,
  directionOf,
  evidenceComparisonSchema,
  evidenceImpactSchema,
  evidenceMetricSchema,
  evidenceSchema,
  evidenceSeriesSchema,
  evidenceWindowSchema,
  formatCurrency,
  formatMetricValue,
  metricUnitSchema,
  parseEvidence,
  round,
  safeParseEvidence,
  type ContributingFactor,
  type Evidence,
  type EvidenceComparison,
  type EvidenceDirection,
  type EvidenceImpact,
  type EvidenceMetric,
  type EvidenceSentiment,
  type EvidenceSeries,
  type EvidenceWindow,
  type ImpactCadence,
  type MetricUnit,
} from './evidence';

// Insight rules engine
export {
  ALL_DETECTORS,
  THRESHOLDS,
  anomalyBandDetector,
  attachmentSlipDetector,
  failedPaymentsDetector,
  isRecoverable,
  lowStockDetector,
  overstockDetector,
  softCapacityDetector,
} from './insights/detectors';
export { monthlyValueOf, runInsightSweep, type SweepOptions, type SweepResult } from './insights/engine';
export {
  INSIGHT_SEVERITIES,
  INSIGHT_STATES,
  INSIGHT_TYPES,
  LINKED_ACTION_TYPES,
  SEVERITY_RANK,
  type Detector,
  type DetectorContext,
  type InsightDraft,
  type InsightSeverity,
  type InsightState,
  type InsightType,
  type LinkedActionType,
} from './insights/types';
export {
  DAYPART_LABELS,
  daypartForHour,
  type AttachmentFacts,
  type CapacityFacts,
  type CapacitySlotFacts,
  type CategoryTrendFacts,
  type DailyPoint,
  type FailedMembershipFacts,
  type FailedPaymentFacts,
  type ProductStockFacts,
  type PulseFacts,
  type SalonFacts,
  type SlotAttachmentFacts,
  type StaffAttachmentFacts,
} from './insights/facts';

// AI module (server-side; SDK loaded lazily)
export {
  AI_CALL_OVERRIDES,
  AI_MAX_TOKENS,
  DEFAULT_AI_MODEL,
  resolveModel,
  type AiCall,
  type ModelResolution,
} from './ai/model';
export {
  AiUnavailableError,
  EMBEDDING_MODEL,
  canonicalJson,
  embedText,
  generateJson,
  hashContext,
  isAiConfigured,
  type AiGenerationLog,
  type AiUsage,
} from './ai/client';
export { askAboutSalon, AskAnswerSchema, type AskAnswer, type AskInput, type AskResult } from './ai/ask';
export {
  DEFAULT_GUARDRAILS,
  checkPayload,
  checkText,
  runGuardrails,
  type GuardrailCode,
  type GuardrailOptions,
  type GuardrailResult,
  type GuardrailViolation,
} from './ai/guardrails';
export {
  BRIEF_VERSION,
  briefActionSchema,
  briefCardSchema,
  briefGreetingSchema,
  briefPulseSchema,
  daybreakBriefSchema,
  generatedNarrativeSchema,
  parseBrief,
  safeParseBrief,
  type BriefAction,
  type BriefCard,
  type BriefGreeting,
  type BriefPulse,
  type DaybreakBrief,
  type GeneratedNarrative,
} from './ai/brief';
export {
  buildCards,
  buildFallbackNarrative,
  buildPromptContext,
  buildPulse,
  generateDaybreak,
  type BriefInsightInput,
  type DaybreakDeps,
  type DaybreakInput,
  type DaybreakResult,
} from './ai/daybreak';

// Demo pipeline
export {
  runPipeline,
  type PipelineDayReport,
  type PipelineReport,
  type RunPipelineOptions,
  type SalonDayReport,
} from './pipeline/index';
export {
  type CampaignOutcome,
  type InsightUpsertResult,
  type PipelinePorts,
  type PipelineSalon,
} from './pipeline/ports';

// Consent filter — the ONE choke point every Compass surface reads through
// (IMPLEMENTATION_SPEC §2, PRODUCT_SPEC §15/§38)
export {
  CONSENT_TIERS,
  COMPASS_FIELDS,
  CONSENT_FIELD_LABELS,
  DEFAULT_CONSENT_TIER,
  MIN_COHORT_SIZE,
  allowedFields,
  allowedGroups,
  canSee,
  contributesToCohorts,
  describeConsent,
  filterAccount,
  filterCohort,
  labelForConsentField,
  receivesBenchmarks,
  repMaySeeSignals,
  resolveConsentTier,
  type CohortAggregate,
  type CohortResult,
  type CompassFieldGroup,
  type ConsentDisclosure,
  type ConsentTier,
} from './consent';

// Compass derivation — derive here, filter there, render what survives
// (PRODUCT_SPEC §14; every Compass read goes through `deriveAccountView`)
export {
  CALL_STATUS_LABELS,
  HEALTH_BANDS,
  HEALTH_BAND_FLOOR,
  HEALTH_BAND_LABELS,
  bandForHealth,
  buildEvidenceTiles,
  buildHealthCohort,
  callPriorityScore,
  callStatusFor,
  deriveAccountView,
  healthBandFactors,
  healthDistribution,
  suggestionFor,
  type AccountSignalInput,
  type CallStatus,
  type ChurnRiskBand,
  type CoachingRequestSummary,
  type CompassAccountRecord,
  type CompassAccountView,
  type CompassBand,
  type CompassEnvelope,
  type DeriveAccountInput,
  type DraftOrderSummary,
  type EquipmentProfileSummary,
  type EvidenceTile,
  type HealthBand,
  type HealthCohort,
  type PeerGap,
  type Suggestion,
  type TrendDirection,
} from './compass/derive';

// Rep call brief (PRODUCT_SPEC §16) — Daybreak's sibling, same guarantees
export {
  CALL_BRIEF_VERSION,
  GENERATED_CALL_BRIEF_JSON_SCHEMA,
  buildCallBriefContext,
  buildFacts,
  buildFallbackCallBrief,
  callBriefSchema,
  canBrief,
  generateCallBrief,
  generatedCallBriefSchema,
  type CallBrief,
  type CallBriefDeps,
  type CallBriefInput,
  type CallBriefResult,
  type GeneratedCallBrief,
} from './ai/call-brief';

// Customer health monitor (Nick, 2026-08-19). Engine adapted from
// CommandCentered's baseline-anchored relationship health.
export {
  BANDS,
  BASELINE,
  TUNING,
  VISIT_POINTS,
  bandFor,
  computeCustomerHealth,
  estimateBottle,
  healthReason,
  type BaselineKind,
  type BottleEstimate,
  type CustomerHealth,
  type CustomerHealthInput,
  type CustomerHealthBand,
} from './health/customer-health';

// Opportunity Engine (2026-08-21 brainstorm) — the execution-package layer
// above the insight detectors. Fixtures land in ./opportunities/fixtures.
export {
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_CATEGORY_LABEL,
  OPPORTUNITY_CONFIDENCES,
  OPPORTUNITY_CONFIDENCE_LABEL,
  OPPORTUNITY_URGENCIES,
  OPPORTUNITY_URGENCY_LABEL,
  type ActionKind,
  type CoachingRequestAction,
  type EmailAction,
  type FrontDeskScriptAction,
  type HandleItPlan,
  type Opportunity,
  type OpportunityAction,
  type OpportunityCategory,
  type OpportunityConfidence,
  type OpportunityOutcome,
  type OpportunityUrgency,
  type SmsAction,
  type SocialAction,
  type StaffChallengeAction,
  type StaffTaskAction,
  type UvaluxOrderAction,
} from './opportunities/types';
export { DEMO_OPPORTUNITIES, DEMO_OUTCOMES } from './opportunities/fixtures';
export {
  DEMO_WINS,
  DEMO_WIN_NOTES,
  DEMO_WIN_ENGAGEMENT,
  DEMO_WIN_TODAY,
} from './network/fixtures';
export {
  distanceKm,
  isNonCompeting,
  rankWins,
  DEFAULT_WIN_FEED_OPTIONS,
  type SalonWin,
  type ViewerContext,
  type WinFeedOptions,
} from './network/wins';
export {
  DEMO_COMMUNITY_POSTS,
  DEMO_COMMUNITY_TODAY,
  type CommunityPostSeed,
} from './network/community';

// Front Desk Monitor (2026-08-21) — listener device → scored interactions →
// coaching insights. Demo depth: fixtures only, no audio anywhere.
export {
  INTERACTION_OUTCOMES,
  INTERACTION_OUTCOME_LABEL,
  MOMENT_KEYS,
  MOMENT_LABEL,
  type EmployeeSalesStats,
  type InteractionOutcome,
  type ListenerStatus,
  type MomentKey,
  type MomentScores,
  type MonitorFixture,
  type MonitorInsight,
  type SalesInteraction,
  type TranscriptLine,
} from './monitor/types';
export { DEMO_MONITOR } from './monitor/fixtures';

// Knowledge curation (claims, provenance, review state, the curation graph).
// This module existed but was never barrelled, so `@bask/core` did not expose
// Claim or claimConfidence — every Compass knowledge component that imported
// them failed with TS2305 "has no exported member", and the failure looked like
// the component's fault rather than a missing export here.
export {
  ALERT_KINDS,
  ALERT_LABEL,
  CLAIM_ACTIONS,
  CLAIM_CATEGORIES,
  CLAIM_MOMENTS,
  CLAIM_SHAPES,
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_KINDS,
  REVIEW_STATES,
  REVIEW_STATE_LABEL,
  claimConfidence,
  formatTimecode,
  reviewProgress,
  type AlertKind,
  type AlertSeverity,
  type Claim,
  type ClaimAction,
  type ClaimCategory,
  type ClaimEvent,
  type ClaimFilters,
  type ClaimMoment,
  type ClaimPage,
  type ClaimProvenance,
  type ClaimShape,
  type CorpusOverviewRow,
  type CurationAlert,
  type CurationGraph,
  type GraphEdge,
  type GraphEdgeKind,
  type GraphNode,
  type GraphNodeKind,
  type PaletteItem,
  type PaletteItemKind,
  type ReviewState,
} from './knowledge/curation/types';

// Method-source provenance (de-identified — app never renders an advisor's name).
export {
  METHOD_SOURCES,
  methodSourceFor,
  type MethodSource,
} from './sources/experts';

// Curation logic over the claim corpus. Pure modules — no IO, no React — so the
// API router and the Compass page can share one implementation of "what does
// this corpus look like" rather than each growing its own.
export { buildCurationGraph } from './knowledge/curation/graph';

// Retrieval over that same corpus. Both halves are exported: `retrieve` searches
// raw transcript chunks (`bask.match_knowledge`), `retrieveClaims` searches the
// distilled claims (`bask.match_claims`) and is what the product cites — see
// docs/plans/2026-08-29-rag-wiring.md §0 for why the claim, not the chunk.
// `retrieve` was written months before anything imported it; it was dead code
// only because this line was missing.
export {
  DEFAULT_MATCH_COUNT,
  DEFAULT_THRESHOLD,
  formatOffset,
  retrieve,
  toCitation,
  type Citation,
  type KnowledgeMatch,
  type QueryFn,
} from './knowledge/retrieve';
export {
  CLAIM_SOURCE_LABEL,
  dedupeClaims,
  retrieveClaims,
  toClaimCitation,
  type ClaimCitation,
  type ClaimMatch,
  type ClaimQueryFn,
} from './knowledge/retrieve-claims';
// Aliased: the module exports `generateCurationAlerts`; the rest of the codebase calls it
// `claimAlerts`. Renaming the export would be churn for no gain.
export { generateCurationAlerts as claimAlerts } from './knowledge/curation/alerts';
export { buildPaletteIndex, filterPalette } from './knowledge/curation/palette';
export {
  summariseNetworkOutcomes,
  MIN_SALONS_FOR_CONFIDENCE,
  type NetworkOutcomeRecord,
  type NetworkOutcomeSummary,
} from './network/outcomes';
// The proof shown under a prepared action. Records are a demo fixture and the
// module says so at the top; the percentages are computed, and the confidence
// floor really does suppress the card. Read that header before quoting a number.
export {
  networkProofFor,
  DEMO_NETWORK_OUTCOMES,
  type OpportunityNetworkProof,
} from './network/opportunity-proof';
