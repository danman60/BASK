/**
 * customers.csv (+ visits for recency) → CustomerInput[]. Names are synthesized
 * deterministically from customer_id (the source is anonymized). status is
 * derived from days since last visit against `asOf`: <=45 active, <=120 lapsed,
 * else inactive. Pure.
 */
import { remapId, bool, parseDate, type CustomerInput } from './contract';

/* 10 x 10 gave 100 combinations. Against this salon's 9,382 customers that is
   ~94 people per name, and the customer list sorts alphabetically — so the
   screen filled with an unbroken wall of the same person. The hash was never
   the problem (it distributes evenly); the pool was. 48 x 48 = 2,304 pairs
   puts repeats at roughly four per name across 20k, which is what a real
   customer list looks like. */
const FIRST = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Jamie', 'Avery', 'Quinn',
  'Dana', 'Elliot', 'Frankie', 'Harper', 'Indigo', 'Jesse', 'Kai', 'Logan', 'Marlow', 'Noor',
  'Odessa', 'Parker', 'Rowan', 'Sasha', 'Toby', 'Umi', 'Vivian', 'Wren', 'Xiomara', 'Yuki',
  'Zara', 'Adrian', 'Bianca', 'Cormac', 'Delphine', 'Emeka', 'Farid', 'Greta', 'Hana', 'Ines',
  'Joaquin', 'Katya', 'Lucian', 'Mira', 'Nikolai', 'Priya', 'Rafael', 'Soraya',
];
const LAST = [
  'Lee', 'Patel', 'Nguyen', 'Brown', 'Silva', 'Cohen', 'Reyes', 'Khan', 'Walsh', 'Diaz',
  'Okafor', 'Berg', 'Castellanos', 'Dumont', 'Eriksen', 'Ferrara', 'Gallagher', 'Haddad',
  'Ibrahim', 'Jansen', 'Kowalski', 'Lindqvist', 'Moreau', 'Novak', 'Oyelaran', 'Petrov',
  'Quintero', 'Rasmussen', 'Sandoval', 'Tremblay', 'Ueda', 'Vasquez', 'Whitfield', 'Xu',
  'Yamamoto', 'Zielinski', 'Abbott', 'Bouchard', 'Chaudhry', 'Delacroix', 'Escobar', 'Fontaine',
  'Grimaldi', 'Halvorsen', 'Iqbal', 'Jimenez', 'Kaur', 'Lombardi',
];
function nameFor(id: string): { firstName: string; lastName: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { firstName: FIRST[h % FIRST.length], lastName: LAST[(h >>> 11) % LAST.length] };
}

export function mapCustomers(
  customerRows: Record<string, string>[],
  visitRows: Record<string, string>[],
  asOf: Date,
): CustomerInput[] {
  const lastVisit = new Map<string, string>();
  for (const v of visitRows) {
    const cur = lastVisit.get(v.customer_id);
    if (!cur || v.check_in_at > cur) lastVisit.set(v.customer_id, v.check_in_at);
  }
  return customerRows.map((r) => {
    const lv = lastVisit.get(r.customer_id) ?? null;
    const lvDate = parseDate(lv ?? undefined);
    let status = 'inactive';
    if (lvDate) {
      const days = (asOf.getTime() - lvDate.getTime()) / 86400000;
      status = days <= 45 ? 'active' : days <= 120 ? 'lapsed' : 'inactive';
    }
    const { firstName, lastName } = nameFor(r.customer_id);
    return {
      id: remapId('customer', r.customer_id),
      salonId: remapId('salon', r.salon_id),
      firstName,
      lastName,
      status,
      emailOptIn: bool(r.marketing_opt_in) && (r.preferred_channel || '').toLowerCase() === 'email',
      smsOptIn: bool(r.marketing_opt_in) && (r.preferred_channel || '').toLowerCase() === 'sms',
      photoConsent: false,
      joinedAt: parseDate(r.signup_date) ?? asOf,
      lastVisitAt: lvDate,
    };
  });
}