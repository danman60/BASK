import type { ReactNode } from 'react';
import { ForcedTheme } from '@bask/ui';
import '../../../dev/design/design.css';

/**
 * Compass-pinned dev route. The root ThemeProvider still holds the salon's stored
 * preference — that is the proof: `preference` stays Sunset or Dusk while `theme`
 * renders Compass, because <ForcedTheme> pins this subtree. Navigating away
 * unmounts it and the salon's own choice comes back.
 *
 * Scoped to /compass/dev/tokens rather than /compass so this never claims the real
 * /compass segment layout.
 */
export default function CompassTokensLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ForcedTheme theme="compass" />
      {children}
    </>
  );
}
