/**
 * salons.csv → one Org + six SalonInput. IDs are remapped deterministically so
 * every other mapper's salonId foreign key matches. Pure — the orchestrator
 * reads the CSV and inserts; this only shapes rows.
 */

import { remapId, SALON_STATUS, type OrgInput, type SalonInput } from './contract';

/**
 * Org identity is overridable so a second dataset can be loaded alongside the
 * practice one without colliding on the unique slug. Defaults unchanged.
 */
const ORG_KEY = process.env.INGEST_ORG_SLUG || 'uvalux-practice';
const ORG_NAME = process.env.INGEST_ORG_NAME || 'UVALUX Practice';

export function mapOrg(): OrgInput {
  return { id: remapId('org', ORG_KEY), name: ORG_NAME, slug: ORG_KEY };
}

export function mapSalons(rows: Record<string, string>[]): SalonInput[] {
  return rows.map((r) => ({
    id: remapId('salon', r.salon_id),
    orgId: remapId('org', ORG_KEY),
    name: r.salon_name,
    slug: r.salon_id.toLowerCase(),
    status: SALON_STATUS,
    country: 'CA',
    timezone: 'America/Toronto',
    theme: 'sunset',
  }));
}