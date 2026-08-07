/**
 * Floor copy (IMPLEMENTATION_SPEC §3.7 — user-facing strings live in a copy
 * module, never inline in JSX, so a tone pass is a one-file job and i18n stays
 * possible).
 *
 * This is the Floor's leaf of the dictionary rather than an entry in
 * `@bask/ui/guidance` because `packages/ui` belongs to lane 1 under the M1 merge
 * protocol. The register is the same one `guidance.ts` sets: grade-7 reading
 * level, buttons state outcomes, consequences are concrete and count real
 * people. Promoting these keys into the shared dictionary is a move, not a
 * rewrite.
 */

export const FLOOR = {
  title: 'The Floor',
  tabs: {
    board: 'Room Board',
    checkin: 'Check-in',
    pos: 'POS',
    schedule: 'Schedule',
  },
  scanner: {
    ready: 'Scanner ready — scan any product',
    listening: 'Reading a scan…',
    unknown: 'That barcode is not in the catalogue yet.',
    addProduct: 'Add it now',
    addedToCart: (name: string) => `${name} added to the cart.`,
    received: (name: string, onHand: number) => `${name} — ${onHand} on the shelf.`,
    lookup: (name: string, price: string) => `${name} · ${price}`,
    modeLabel: 'What a scan does right now',
    receivingToggle: 'Stocking up',
    modes: {
      pos: 'Adds to the cart',
      receiving: 'Adds one to the shelf',
      lookup: 'Shows the price',
    },
  },
  legend: {
    ready: 'Ready',
    inSession: 'In session',
    cleaning: 'Cleaning',
    maintenance: 'Maintenance',
  },
  board: {
    left: 'left',
    manual: 'Started on the bed — no check-in',
    emptyTitle: 'No rooms set up yet',
    emptyBody:
      'Every bed, booth and room you have shows up here with what it is doing right now — who is in it and how long is left. Add your rooms and the board fills itself.',
    emptyAction: 'Add a room',
    endSession: 'End early',
    outOfService: 'Out of service',
    backInService: 'Back in service',
  },
  checkin: {
    searchLabel: 'Find a customer',
    searchPlaceholder: 'Name, phone or email',
    searchHint: 'Start typing — the list narrows as you go.',
    noMatch: 'Nobody matches that yet.',
    emptyTitle: 'Pick somebody to check in',
    emptyBody:
      'Search a name and their card appears here: what they are on, when they were last in, and whether they are clear to tan today. Then pick a service and a free room.',
    emptyAction: 'Search a customer',
    lastVisit: 'Last visit',
    visitsThisMonth: 'Visits this month',
    packageLabel: 'Package',
    noPackage: 'No package',
    timing: 'Session timing',
    service: 'Service',
    readyRooms: 'Ready rooms',
    noReadyRooms: 'Nothing free right now — the next room opens as soon as a session ends.',
    start: (room: string, minutes: number) => `Start session — ${room} · ${minutes} minutes`,
    startBlocked: 'Pick a service and a room',
    started: (name: string, room: string) => `${name} is in ${room}.`,
    dismissUpsell: 'Hide this',
    arrivingTitle: 'Booked in the next two hours',
    arrivingEmpty: 'Nothing booked in the next two hours.',
    checkInBooked: 'Check in',
  },
  waiver: {
    open: 'Take a signature',
    view: 'See the signature',
    title: 'Waiver signature',
    prompt: 'Sign with your finger',
    nameLabel: 'Name as signed',
    clear: 'Start over',
    save: 'Save signature',
    saved: 'Signature saved.',
    incomplete: 'Sign in the box and type the name before saving.',
    onFile: (when: string) => `Signed ${when}`,
    none: 'No signature on file yet.',
    consequence: 'This is kept with their record and can be pulled up any time.',
  },
  pos: {
    title: 'Sell something',
    searchPlaceholder: 'Search products, or scan one',
    cartTitle: 'Cart',
    cartEmptyTitle: 'Nothing in the cart',
    cartEmptyBody:
      'Scan a bottle or tap a product and it lands here. If somebody is checked in, the sale goes on their record so you can see what they actually buy.',
    cartEmptyAction: 'Scan a product',
    attachedTo: (name: string) => `Selling to ${name}`,
    noCustomer: 'No customer attached — this sale will not show on anyone’s record.',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    discountLabel: 'Take off',
    tender: 'How are they paying?',
    giftCardCode: 'Gift card code',
    cashTendered: 'Cash given',
    charge: (total: string, tender: string) => `Take ${total} — ${tender}`,
    outOfStock: 'None on the shelf',
    remove: 'Remove',
    sellGiftCard: 'Gift card',
    giftCardAmount: 'Amount',
    receiptTitle: 'Done',
    receiptSub: (total: string, tender: string) => `${total} on ${tender.toLowerCase()}.`,
    changeDue: (amount: string) => `Change due ${amount}`,
    newSale: 'Start another sale',
    tenders: {
      card: 'Card',
      cash: 'Cash',
      gift_card: 'Gift card',
      package_credit: 'Package credit',
      membership_included: 'Membership',
    },
    errors: {
      empty_cart: 'There is nothing in the cart yet.',
      gift_card_not_found: 'No active gift card with that code.',
      gift_card_insufficient: 'That gift card does not have enough left to cover this.',
      package_needs_customer: 'Attach a customer before using package credit.',
      no_package_credits: 'They have no package credits left.',
    } as Record<string, string>,
  },
  quickCreate: {
    title: 'New product?',
    body: (code: string) => `Nothing in the catalogue uses ${code}. Add it and it is ready to sell.`,
    name: 'What is it called?',
    price: 'Price',
    category: 'Kind',
    brand: 'Brand (optional)',
    size: 'Size (optional)',
    onHand: 'How many do you have?',
    save: 'Add it and put it in the cart',
    saved: (name: string, sku: string) => `${name} added as ${sku}.`,
  },
  schedule: {
    title: 'Schedule',
    day: 'Day',
    week: 'Week',
    today: 'Today',
    prev: 'Back',
    next: 'Forward',
    walkIn: 'Walk-in',
    booked: 'Booked',
    dragHint: 'Drag a booking to move it. Shading shows how full each hour is.',
    moved: (who: string, time: string) => `${who} moved to ${time}.`,
    emptyTitle: 'Nothing booked yet',
    emptyBody:
      'Bookings show up here by room and time, with walk-ins marked so you can tell what was planned from what just turned up.',
    emptyAction: 'Look at another day',
    capacity: 'How full',
  },
  handoff: {
    open: 'End of shift',
    title: 'Shift handoff',
    sub: (date: string) => `What happened on ${date}.`,
    sales: 'Money taken',
    saleCount: 'Sales',
    retail: 'Products sold',
    attachment: 'Sold with a session',
    checkIns: 'Check-ins',
    sessions: 'Sessions run',
    incidents: 'Rooms out of service',
    noIncidents: 'Nothing broke today.',
    lowStock: 'Running low',
    noLowStock: 'Nothing needs reordering.',
    tomorrow: 'First three tomorrow',
    noTomorrow: 'Nothing booked tomorrow yet.',
    noteLabel: 'Anything the next person should know?',
    notePlaceholder: 'Bed 3 buzzes when it starts. Told the customer we would look at it.',
    post: 'Post the handoff',
    posted: (when: string) => `Posted ${when}.`,
    postedToast: 'Handoff posted. The next shift sees it when they open.',
  },
  /**
   * One human sentence per real refusal code (IMPLEMENTATION_SPEC §3.6 — never a
   * bare code). The keys are the actual constants the session machine and the
   * driver return: `TRANSITION_REJECTED` in `@bask/core/sessions/machine` and
   * `DRIVER_ERROR` in `.../driver`. Every one of them says what happened AND
   * what to do, because a staffer reading it has somebody standing in front of
   * them.
   */
  errors: {
    // engine / route
    unknown_room: 'That room is not on this floor.',
    unknown_customer: 'That customer is not on file.',
    unknown_booking: 'That booking is no longer there — the schedule may have moved on.',
    engine_not_ready: 'The floor is still waking up — try that again in a second.',
    driver_rejected: 'The bed would not take the start. Check the unit and try again.',
    bad_time: 'That is not a time the schedule can use.',
    // room state machine
    room_not_ready: 'Somebody just took that room. Pick another one.',
    room_in_maintenance: 'That room is out of service, so nobody can go in it.',
    no_session_running: 'Nothing is running in that room right now.',
    not_cleaning: 'That room is not being cleaned right now.',
    cannot_service_occupied_room: 'Somebody is in that room — end the session first.',
    not_in_maintenance: 'That room is already back in service.',
    minutes_out_of_range: 'That session length is outside what this equipment takes.',
    // equipment driver
    unit_busy: 'That bed is already running. Pick another room.',
    unknown_unit: 'The system cannot find that bed. Tell whoever looks after the equipment.',
    unit_faulted: 'That bed is reporting a fault. Take it out of service and use another.',
    nothing_to_cancel: 'That bed is not running anything to stop.',
    delay_unsupported: 'That bed cannot start on a delay.',
    // waiver
    bad_signature_format: 'The signature did not save properly. Try signing again.',
    signature_too_large: 'That signature is too big to store. Sign again with fewer strokes.',
    signature_incomplete: 'Sign in the box and type the name before saving.',
    generic: 'That did not go through. Try it again.',
  } as Record<string, string>,
} as const;

/** Human errors, never a bare code (IMPLEMENTATION_SPEC §3.6). */
export function floorError(code: string | undefined): string {
  if (!code) return FLOOR.errors.generic!;
  return FLOOR.errors[code] ?? FLOOR.pos.errors[code] ?? FLOOR.errors.generic!;
}

export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}
