/**
 * Staff roster and customer name pools.
 *
 * All names are invented. Nothing here should ever resemble a real UVALUX
 * employee or customer — the dataset is shown on a screen in a pitch meeting.
 */

/** 12 staff-shift patterns (PRODUCT_SPEC §20). */
export interface StaffSeed {
  key: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'front_desk' | 'staff';
  /** Weekdays worked, 0 = Sunday. */
  days: number[];
  /** Shift window, salon-local `[start, end)`. */
  shift: [number, number];
  hiredMonthsAgo: number;
}

/**
 * `tamsin` and `reece` carry the retail-attachment decline (ARCS.attachment).
 * Their shifts deliberately cover Tuesday and Thursday evenings so the evidence
 * sentence — "mostly on Tuesday and Thursday evening shifts" — is derived from
 * the data rather than asserted over it.
 */
export const STAFF: StaffSeed[] = [
  { key: 'dana', firstName: 'Dana', lastName: 'Whitfield', role: 'owner', days: [1, 2, 3, 4, 5], shift: [9, 17], hiredMonthsAgo: 74 },
  { key: 'marguerite', firstName: 'Marguerite', lastName: 'Oyelaran', role: 'manager', days: [1, 2, 3, 4, 6], shift: [9, 18], hiredMonthsAgo: 41 },
  { key: 'joss', firstName: 'Joss', lastName: 'Hartline', role: 'front_desk', days: [1, 3, 5], shift: [9, 15], hiredMonthsAgo: 28 },
  { key: 'priya', firstName: 'Priya', lastName: 'Raghunathan', role: 'front_desk', days: [2, 4, 6], shift: [9, 15], hiredMonthsAgo: 22 },
  { key: 'tamsin', firstName: 'Tamsin', lastName: 'Brody', role: 'front_desk', days: [2, 4, 5], shift: [15, 21], hiredMonthsAgo: 19 },
  { key: 'reece', firstName: 'Reece', lastName: 'Vandermolen', role: 'front_desk', days: [2, 4, 6], shift: [14, 21], hiredMonthsAgo: 9 },
  { key: 'lenore', firstName: 'Lenore', lastName: 'Fitzgibbon', role: 'staff', days: [1, 3, 5], shift: [15, 21], hiredMonthsAgo: 33 },
  { key: 'kwame', firstName: 'Kwame', lastName: 'Asante-Boadi', role: 'staff', days: [0, 6], shift: [11, 19], hiredMonthsAgo: 26 },
  { key: 'sable', firstName: 'Sable', lastName: 'Ng', role: 'staff', days: [3, 5, 6], shift: [12, 19], hiredMonthsAgo: 14 },
  { key: 'ondine', firstName: 'Ondine', lastName: 'Marchetti', role: 'staff', days: [0, 1, 4], shift: [11, 18], hiredMonthsAgo: 11 },
  { key: 'bertram', firstName: 'Bertram', lastName: 'Okonkwo', role: 'staff', days: [2, 3, 6], shift: [9, 16], hiredMonthsAgo: 7 },
  { key: 'juniper', firstName: 'Juniper', lastName: 'Calloway', role: 'staff', days: [0, 4, 5], shift: [13, 20], hiredMonthsAgo: 4 },
];

export function staffOnShift(weekday: number, hour: number): StaffSeed[] {
  return STAFF.filter(
    (s) => s.days.includes(weekday) && hour >= s.shift[0] && hour < s.shift[1],
  );
}

/** UVALUX-side people. `salon_id` is null for these (schema: null = global). */
export const UVALUX_STAFF = [
  {
    key: 'rep-carrow',
    firstName: 'Nadia',
    lastName: 'Carrow',
    role: 'uvalux_rep' as const,
    territory: 'BC Interior',
  },
  {
    key: 'rep-delacroix',
    firstName: 'Émile',
    lastName: 'Delacroix',
    role: 'uvalux_rep' as const,
    territory: 'Québec',
  },
  {
    key: 'rep-halloran',
    firstName: 'Fintan',
    lastName: 'Halloran',
    role: 'uvalux_rep' as const,
    territory: 'Ontario',
  },
  {
    key: 'leadership-nick',
    firstName: 'Nick',
    lastName: 'Ostrander',
    role: 'uvalux_leadership' as const,
    territory: null,
  },
];

export const FIRST_NAMES: readonly string[] = [
  'Sarah', 'Marc', 'Jenna', 'Priya', 'Devon', 'Aisha', 'Callum', 'Mireille', 'Theo', 'Rowan',
  'Bianca', 'Nadia', 'Emeka', 'Sylvie', 'Grant', 'Yuki', 'Lorenzo', 'Fatima', 'Beatrix', 'Hugo',
  'Delphine', 'Omar', 'Georgia', 'Tobias', 'Anneke', 'Rafael', 'Clementine', 'Idris', 'Marlowe',
  'Saoirse', 'Dmitri', 'Wren', 'Xiomara', 'Caleb', 'Ingrid', 'Nolan', 'Tabitha', 'Everett',
  'Noor', 'Percival', 'Linnea', 'Kai', 'Rosalind', 'Amara', 'Soren', 'Elodie', 'Gideon', 'Maren',
  'Cassian', 'Verity', 'Lucas', 'Sienna', 'Arjun', 'Freya', 'Malik', 'Cordelia', 'Bodhi', 'Isla',
  'Rhys', 'Oona', 'Nikolai', 'Tamar', 'Ezra', 'Bridget', 'Jamal', 'Anouk', 'Wesley', 'Solveig',
];

export const LAST_NAMES: readonly string[] = [
  'Merriweather', 'Vasquez', 'Okafor', 'Lindqvist', 'Boucher', 'Kaur', 'Thistlewood', 'Nakamura',
  'Delgado', 'Fairbanks', 'Achebe', 'Rosenthal', 'Kowalczyk', 'Mbeki', 'Sorenson', 'Beaumont',
  'Chakrabarti', 'Villanueva', 'Halloway', 'Petrossian', 'Adeyemi', 'Lindgren', 'Castellanos',
  'Whitcombe', 'Nakagawa', 'Ferreira', 'Blackwood', 'Osei', 'Dubois', 'Marchetti', 'Sandoval',
  'Pemberton', 'Iwuchukwu', 'Novotny', 'Ashworth', 'Rivera', 'Van Dijk', 'Okonjo', 'Larsson',
  'Cortez', 'Farrington', 'Bhattacharya', 'Yamamoto', 'Kilbride', 'Moreau', 'Ntanda', 'Sinclair',
  'Ravensworth', 'Guzman', 'Oyelowo', 'Hollingsworth', 'Tremblay', 'Bergström', 'Adebayo',
];
