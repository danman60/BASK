import { Suspense } from 'react';

import { CustomersSurface } from './CustomersSurface';
import '../marketing/studio.css';
import './customers.css';

export const metadata = {
  title: 'Customers · Bask',
};

/**
 * `/customers` — list + profile, with the failed-payment recovery flow behind
 * `?view=recovery`. Insight cards deep-link straight to that view.
 *
 * Studio's stylesheet is imported for the handful of shared atoms (`.st-prov`,
 * `.st-bubble`) rather than copied — one definition, two surfaces.
 */
export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersSurface />
    </Suspense>
  );
}
