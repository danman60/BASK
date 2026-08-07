'use client';

/**
 * Accounts — the roster (PRODUCT_SPEC §14).
 *
 * Health band, trend arrows, order recency, and a consent badge on EVERY row.
 * The badge is not decoration: a rep looking at a row with three dashes needs to
 * know instantly that the salon chose that, rather than assuming Compass is
 * broken. Rivière Lumière is the row that proves it.
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  BAND_LABEL,
  BandDot,
  CompassEmpty,
  ConsentBadge,
  TrendArrow,
} from '@/components/compass/primitives';
import { ROLE_PARAM } from '@/lib/demo-scope';
import { trpc } from '@/lib/trpc';

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get(ROLE_PARAM) ?? 'uvalux_rep';
  const accounts = trpc.compass.accounts.useQuery();

  if (accounts.error) {
    return <CompassEmpty title="Accounts could not load" body={accounts.error.message} />;
  }
  if (!accounts.data) return <p className="cp-note">Reading the roster…</p>;

  const rows = accounts.data.accounts;
  const shared = rows.filter((row) => row.consentTier === 'coaching').length;

  return (
    <>
      <div className="cp-head">
        <h1>
          Accounts. <em>{rows.length}</em> on the book.
        </h1>
        <p>
          {shared} share business signals. The rest show what they agreed to and nothing more — the
          dashes are the setting working, not a gap in the data.
        </p>
      </div>

      <div className="cp-card" style={{ padding: 'var(--space-5) var(--space-4)' }}>
        <table className="cp-table">
          <thead>
            <tr>
              <th>Salon</th>
              <th>Where</th>
              <th>Health</th>
              <th>Sales</th>
              <th>Members</th>
              <th>Last order</th>
              <th>Sharing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.envelope.accountId}>
                <td>
                  <Link href={`/compass/accounts/${row.envelope.salonSlug}?${ROLE_PARAM}=${role}`}>
                    {row.account.salonName}
                  </Link>
                  {row.openDraftOrderCount > 0 && (
                    <div className="cp-note">
                      {row.openDraftOrderCount} order{row.openDraftOrderCount === 1 ? '' : 's'} in
                    </div>
                  )}
                  {row.openCoachingCount > 0 && (
                    <div className="cp-note">Asked for coaching</div>
                  )}
                </td>
                <td className="num">{row.account.region}</td>
                <td>
                  {row.account.healthBand ? (
                    <>
                      <BandDot band={row.account.healthBand} /> {BAND_LABEL[row.account.healthBand]}
                    </>
                  ) : (
                    <span className="cp-note">—</span>
                  )}
                </td>
                <td>
                  {row.account.revenueTrendDirection ? (
                    <TrendArrow direction={row.account.revenueTrendDirection} />
                  ) : (
                    <span className="cp-note">—</span>
                  )}
                </td>
                <td>
                  {row.account.membershipTrendDirection ? (
                    <TrendArrow direction={row.account.membershipTrendDirection} />
                  ) : (
                    <span className="cp-note">—</span>
                  )}
                </td>
                <td className="num">
                  {row.account.orderRecencyDays !== undefined && row.account.orderRecencyDays !== null
                    ? `${row.account.orderRecencyDays} days ago`
                    : '—'}
                </td>
                <td>
                  <ConsentBadge tier={row.consentTier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
