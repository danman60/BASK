/**
 * @bask/ui — shared web components.
 *
 * M0 step 8: theming runtime. M0 step 9: the Guidance Layer primitives.
 * InsightCard / RoomCard / EvidenceTile and the rest of the DESIGN_SPEC §4
 * vocabulary land in M1.
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
