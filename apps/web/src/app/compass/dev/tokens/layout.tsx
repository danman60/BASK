import type { ReactNode } from 'react';
import { ForcedTheme, ThemeProvider, ThemeScript } from '@bask/ui';
import '../../../dev/design/design.css';

/**
 * Compass-pinned dev route. The provider still reads the salon's stored preference —
 * that is the point of the proof: `preference` stays Sunset or Dusk while `theme`
 * renders Compass, because <ForcedTheme> pins the subtree. Navigating away unmounts
 * it and the salon's own choice comes back.
 *
 * Scoped to /compass/dev/tokens rather than /compass so this lane never claims the
 * real /compass segment layout.
 */
export default function CompassTokensLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeScript forcedTheme="compass" />
      <ThemeProvider>
        <ForcedTheme theme="compass" />
        {children}
      </ThemeProvider>
    </>
  );
}
