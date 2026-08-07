/**
 * @bask/ui — shared web components.
 *
 * M0 step 8: theming runtime. M0 step 9: the Guidance Layer primitives.
 * InsightCard / RoomCard / EvidenceTile and the rest of the DESIGN_SPEC §4
 * vocabulary land in M1.
 *
 * Stylesheets are separate entry points so an app opts in explicitly:
 *   import '@bask/tokens/index.css';
 *   import '@bask/ui/guidance.css';
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

export { Guided } from './guidance/Guided';
export { WhisperNote } from './guidance/WhisperNote';
export { TeachingEmptyState } from './guidance/TeachingEmptyState';
export { Tour, useTourSeen } from './guidance/Tour';

export {
  EMPTY_STATES,
  GUIDED_UI,
  METRICS,
  TIPS,
  TOURS,
  TOUR_UI,
  WHISPERS,
  type EmptyState,
  type EmptyStateKey,
  type MetricExplainer,
  type MetricKey,
  type Tip,
  type TipKey,
  type Tour as TourDef,
  type TourKey,
  type TourStep,
  type WhisperKey,
} from './guidance/guidance';
