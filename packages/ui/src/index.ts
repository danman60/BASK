/**
 * @bask/ui — shared web components.
 *
 * M0 step 8: theming runtime. M0 step 9: the Guidance Layer primitives.
 * M1 lane 1: the Today/Daybreak half of the DESIGN_SPEC §4 vocabulary —
 * InsightCard, ImpactChip, Sparkline, StatRow, PulseCard/PulseChips,
 * ComparisonCard, EvidenceDrilldown, UndoToast. RoomCard / CheckinPanel /
 * EvidenceTile / SuggestBlock / GapSlider land with their own lanes; add them
 * here rather than in an app so there is one vocabulary, not six.
 *
 * Stylesheets are separate entry points so an app opts in explicitly:
 *   import '@bask/tokens/index.css';
 *   import '@bask/ui/guidance.css';
 *   import '@bask/ui/components.css';
 */

export {
  ForcedTheme,
  ThemeProvider,
  ThemeScript,
  THEME_STORAGE_KEY,
  resolveBrandVars,
  useTheme,
  type SalonBrand,
  type ThemeProviderProps,
} from './theme/ThemeProvider';

export { ThemeToggle } from './theme/ThemeToggle';

export { Guided, type GuidedAffordance } from './guidance/Guided';
export { WhisperNote } from './guidance/WhisperNote';
export { TeachingEmptyState } from './guidance/TeachingEmptyState';
export { Tour, useTourSeen } from './guidance/Tour';

export {
  BandChip,
  type BandChipProps,
  type ChipBand,
  type HealthBand,
  type PositionBand,
} from './components/BandChip';
export { HealthBandTiles, type HealthBandCount, type HealthBandTilesProps } from './components/HealthBandTiles';
export { HealthGrid, type HealthGridCell, type HealthGridProps } from './components/HealthGrid';
export { SlippingList, type SlippingListProps, type SlippingRow } from './components/SlippingList';
export { MetricTile, MetricRow, type MetricTileProps, type MetricRowProps } from './components/MetricTile';
export { CohortTable, type CohortRow, type CohortTableProps } from './components/CohortTable';
export { CommunityFeed, type CommunityFeedProps, type CommunityPost } from './components/CommunityFeed';
export { default as CitationCard, type CitationCardProps } from './components/CitationCard';

export {
  EMPTY_STATES,
  GUIDED_UI,
  INSIGHT_UI,
  METRICS,
  SHELL_UI,
  TIPS,
  TODAY_UI,
  TOURS,
  TOUR_UI,
  WHISPERS,
  type DismissReasonKey,
  type EmptyState,
  type EmptyStateKey,
  type MetricExplainer,
  type MetricKey,
  type NavKey,
  type Tip,
  type TipKey,
  type Tour as TourDef,
  type TourKey,
  type TourStep,
  type WhisperKey,
} from './guidance/guidance';

// DESIGN_SPEC §4 component vocabulary (M1 lane 1)
export { InsightCard, renderBoldFacts, type InsightCardProps } from './components/InsightCard';
export {
  EvidenceDrilldown,
  type EvidenceDrilldownProps,
} from './components/EvidenceDrilldown';
export { ImpactChip, type ImpactChipProps } from './components/ImpactChip';
export { Sparkline, sparklinePoints, type SparklineProps } from './components/Sparkline';
export { StatRow, type StatRowProps } from './components/StatRow';
export {
  PulseCard,
  PulseChips,
  type PulseCardProps,
  type PulseChipsProps,
  type PulseRow,
} from './components/PulseCard';
export {
  ComparisonCard,
  type ComparisonCardProps,
  type ComparisonMetric,
} from './components/ComparisonCard';
export { UndoToast, type UndoToastProps } from './components/UndoToast';

// Opportunity Engine + Front Desk Monitor (2026-08-21 build). Presentational;
// data comes from @bask/core fixtures. Sections compose the cards.
export { ActionRow, type ActionRowProps } from './components/ActionRow';
export { OpportunityCard, type OpportunityCardProps } from './components/OpportunityCard';
export { SmsPreviewCard, type SmsPreviewCardProps } from './components/SmsPreviewCard';
export { EmailPreviewCard, type EmailPreviewCardProps } from './components/EmailPreviewCard';
export { SocialPostCard, type SocialPostCardProps } from './components/SocialPostCard';
export { StaffTaskCard, type StaffTaskCardProps } from './components/StaffTaskCard';
export {
  FrontDeskScriptCard,
  type FrontDeskScriptCardProps,
} from './components/FrontDeskScriptCard';
export {
  StaffChallengeCard,
  type StaffChallengeCardProps,
} from './components/StaffChallengeCard';
export { OutcomeCard, type OutcomeCardProps } from './components/OutcomeCard';
export { HandleItPlanCard, type HandleItPlanCardProps } from './components/HandleItPlanCard';
export {
  ListenerStatusCard,
  type ListenerStatusCardProps,
} from './components/ListenerStatusCard';
export { InteractionCard, type InteractionCardProps } from './components/InteractionCard';
export {
  EmployeeSalesTable,
  type EmployeeSalesTableProps,
} from './components/EmployeeSalesTable';
export {
  MonitorInsightCard,
  type MonitorInsightCardProps,
} from './components/MonitorInsightCard';
export {
  ConsentPledgeCard,
  PLEDGE_LINES,
  type ConsentPledgeCardProps,
} from './components/ConsentPledgeCard';
export {
  OpportunityFeedSection,
  type OpportunityFeedSectionProps,
} from './components/OpportunityFeedSection';
export { MonitorSurface, type MonitorSurfaceProps } from './components/MonitorSurface';

// Previous build (2026-08-19/20) components that never got their export line —
// the queue deliberately left index.ts to the supervisor.
export { CoachAnswer, type CoachAnswerProps } from './components/CoachAnswer';
export {
  CustomerHealthSection,
  type CustomerHealthSectionProps,
} from './components/CustomerHealthSection';
export {
  ScoreboardSection,
  type ScoreboardMetric,
  type ScoreboardSectionProps,
} from './components/ScoreboardSection';
