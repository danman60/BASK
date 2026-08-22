/**
 * salons.csv → one Org + six SalonInput. IDs are remapped deterministically so
 * every other mapper's salonId foreign key matches. Pure — the orchestrator
 * reads the CSV and inserts; this only shapes rows.
 */

import { remapId, SALON_STATUS, type OrgInput, type SalonInput } from './contract';

export function mapOrg(): OrgInput {
  return { id: remapId('org', 'uvalux-practice'), name: 'UVALUX Practice', slug: 'uvalux-practice' };
}

export function mapSalons(rows: Record<string, string>[]): SalonInput[] {
  return rows.map((r) => ({
    id: remapId('salon', r.salon_id),
    orgId: remapId('org', 'uvalux-practice'),
    name: r.salon_name,
    slug: r.salon_id.toLowerCase(),
    status: SALON_STATUS,
    country: 'CA',
    timezone: 'America/Toronto',
    theme: 'sunset',
  }));
}