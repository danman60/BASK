import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import './page-container.css';

type PageContainerProps = Omit<ComponentPropsWithoutRef<'main'>, 'children'> & {
  children: ReactNode;
};

/**
 * The centred `<main>` every operator surface sits in: 1180px wide, centred,
 * and padded with the shared `--page-gutter` token.
 *
 * Analytics, Inventory, Customers and Marketing each used to ship an identical
 * copy of this rule under a different class name. Anything that varies per
 * surface (a wider max-width, a different rail) belongs in that surface's own
 * stylesheet on a child element — not as a prop here. Keeping this container
 * layout-free is what stops it drifting back into four shells.
 */
export function PageContainer({ children, className, ...rest }: PageContainerProps) {
  return (
    <main className={className ? `page-shell ${className}` : 'page-shell'} {...rest}>
      {children}
    </main>
  );
}
