/**
 * Fixture row shapes.
 *
 * Plain scalar objects, one per `bask` table, deliberately *not* Prisma's
 * generated create-inputs: the bundle has to be serialisable to JSON so two
 * `demo:reset` runs can be checksummed and diffed. Every field the schema
 * defaults (`created_at`, `updated_at`, ids) is set explicitly here — a
 * database-generated default is a non-deterministic value by definition.
 */

export interface OrgRow {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalonRow {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  status: 'onboarding' | 'active' | 'paused' | 'churned';
  addressLine1: string | null;
  city: string | null;
  region: string | null;
  country: string;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  theme: string;
  openedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffRow {
  id: string;
  salonId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: 'owner' | 'manager' | 'front_desk' | 'staff' | 'uvalux_rep' | 'uvalux_leadership';
  permissions: Record<string, unknown>;
  shiftPattern: Record<string, unknown>;
  isActive: boolean;
  hiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomTypeRow {
  key: string;
  label: string;
  category: string;
  defaultMinutes: number;
  cleaningMinutes: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface RoomRow {
  id: string;
  salonId: string;
  roomTypeKey: string;
  name: string;
  state: 'ready' | 'in_session' | 'cleaning' | 'maintenance';
  maintenanceNote: string | null;
  cleaningMinutes: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentDeviceRow {
  id: string;
  salonId: string;
  roomId: string;
  driverType: 'simulated' | 'tmax' | 'other';
  address: string;
  config: Record<string, unknown>;
  status: string;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRow {
  id: string;
  salonId: string;
  name: string;
  category: string;
  roomTypeKey: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerRow {
  id: string;
  salonId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  skinType: string | null;
  status: 'active' | 'lapsed' | 'inactive';
  emailOptIn: boolean;
  smsOptIn: boolean;
  photoConsent: boolean;
  marketingConsentAt: Date | null;
  waiverSignedAt: Date | null;
  notes: string | null;
  joinedAt: Date;
  lastVisitAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipRow {
  id: string;
  salonId: string;
  customerId: string;
  tier: string;
  status: 'active' | 'frozen' | 'cancelled';
  paymentState: 'current' | 'failed' | 'past_due' | 'recovered';
  monthlyPrice: number;
  billingDayOfMonth: number;
  startedAt: Date;
  nextBillingAt: Date | null;
  lastPaymentAt: Date | null;
  failedPaymentCount: number;
  frozenAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageRow {
  id: string;
  salonId: string;
  customerId: string;
  serviceId: string | null;
  name: string;
  creditsTotal: number;
  creditsRemaining: number;
  status: 'active' | 'expired' | 'used' | 'refunded';
  pricePaid: number;
  purchasedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VisitRow {
  id: string;
  salonId: string;
  customerId: string;
  staffId: string | null;
  source: 'walk_in' | 'appointment' | 'online_booking';
  checkedInAt: Date;
  checkedOutAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface SessionRow {
  id: string;
  salonId: string;
  roomId: string;
  customerId: string | null;
  serviceId: string | null;
  visitId: string | null;
  startedByStaffId: string | null;
  startedBy: 'staff' | 'customer' | 'manual_equipment' | 'system';
  state: 'pending' | 'in_session' | 'cleaning' | 'completed' | 'cancelled' | 'faulted';
  requestedMinutes: number;
  equipmentMinutes: number | null;
  delayMinutes: number;
  startedAt: Date | null;
  endsAt: Date | null;
  endedAt: Date | null;
  cleaningEndsAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleRow {
  id: string;
  salonId: string;
  visitId: string | null;
  customerId: string | null;
  staffId: string | null;
  state: 'completed' | 'voided' | 'refunded';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  soldAt: Date;
  voidedAt: Date | null;
  createdAt: Date;
}

export interface SaleLineRow {
  id: string;
  salonId: string;
  saleId: string;
  customerId: string | null;
  productId: string | null;
  serviceId: string | null;
  giftCardId: string | null;
  staffId: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  tenderType:
    | 'cash'
    | 'card'
    | 'eft'
    | 'gift_card'
    | 'package_credit'
    | 'membership_included'
    | 'comp';
  soldAt: Date;
  createdAt: Date;
}

export interface UvaluxCatalogItemRow {
  id: string;
  officialSku: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  size: string | null;
  upc: string | null;
  wholesalePrice: number | null;
  msrp: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRow {
  id: string;
  salonId: string | null;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  size: string | null;
  retailPrice: number;
  wholesaleCost: number | null;
  uvaluxCatalogItemId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarcodeRow {
  id: string;
  salonId: string | null;
  productId: string;
  value: string;
  symbology: 'upc_a' | 'upc_e' | 'ean_13' | 'ean_8' | 'code_128' | 'qr' | 'custom';
  source: 'scanned' | 'manual' | 'printed_label' | 'catalog';
  isPrimary: boolean;
  createdAt: Date;
}

export interface InventoryLevelRow {
  id: string;
  salonId: string;
  productId: string;
  onHand: number;
  reorderPoint: number;
  parLevel: number | null;
  lastCountedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockEventRow {
  id: string;
  salonId: string;
  productId: string;
  type: 'received' | 'sold' | 'counted' | 'adjusted' | 'used_in_session';
  quantityDelta: number;
  quantityAfter: number | null;
  unitCost: number | null;
  staffId: string | null;
  sessionId: string | null;
  saleLineId: string | null;
  note: string | null;
  occurredAt: Date;
}

export interface SegmentRow {
  key: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CampaignRow {
  id: string;
  salonId: string;
  name: string;
  goal: string | null;
  segmentKey: string | null;
  segmentSnapshot: Record<string, unknown>;
  channels: string[];
  content: Record<string, unknown>;
  state: 'draft' | 'scheduled' | 'sent' | 'measured' | 'cancelled';
  scheduledFor: Date | null;
  sentAt: Date | null;
  measuredAt: Date | null;
  results: Record<string, unknown> | null;
  sourceInsightId: string | null;
  createdByStaffId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftCardRow {
  id: string;
  salonId: string;
  code: string;
  initialBalance: number;
  balance: number;
  state: 'active' | 'redeemed' | 'expired' | 'void';
  purchaserId: string | null;
  recipientId: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  issuedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityEventRow {
  id: string;
  salonId: string;
  actorType: 'staff' | 'customer' | 'system';
  actorStaffId: string | null;
  actorLabel: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export interface ConsentProfileRow {
  id: string;
  salonId: string;
  tier: 'private' | 'benchmarks' | 'coaching';
  updatedByStaffId: string | null;
  effectiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentAuditEntryRow {
  id: string;
  salonId: string;
  consentProfileId: string;
  fromTier: 'private' | 'benchmarks' | 'coaching' | null;
  toTier: 'private' | 'benchmarks' | 'coaching';
  changedByStaffId: string | null;
  note: string | null;
  changedAt: Date;
}

export interface DraftOrderRow {
  id: string;
  salonId: string;
  accountId: string | null;
  state: 'draft' | 'submitted' | 'acknowledged' | 'fulfilled' | 'cancelled';
  total: number;
  note: string | null;
  createdByStaffId: string | null;
  submittedAt: Date | null;
  acknowledgedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftOrderLineRow {
  id: string;
  draftOrderId: string;
  productId: string | null;
  uvaluxCatalogItemId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  reason: string | null;
  createdAt: Date;
}

export interface AccountRow {
  id: string;
  salonId: string;
  accountNumber: string | null;
  lifecycle: 'prospect' | 'new_opening' | 'established' | 'expansion' | 'at_risk' | 'churned';
  healthScore: number | null;
  annualWholesaleValue: number | null;
  territory: string | null;
  assignedRepId: string | null;
  lastContactAt: Date | null;
  nextTouchAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignalSnapshotRow {
  id: string;
  accountId: string;
  salonId: string;
  signalType: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  headline: string;
  metrics: Record<string, unknown>;
  evidence: Record<string, unknown>;
  forDate: Date;
  createdAt: Date;
}

export interface CoachingRequestRow {
  id: string;
  salonId: string;
  accountId: string;
  topic: string;
  message: string | null;
  state: 'open' | 'acknowledged' | 'in_progress' | 'closed';
  requestedByStaffId: string | null;
  assignedRepId: string | null;
  response: string | null;
  requestedAt: Date;
  respondedAt: Date | null;
  closedAt: Date | null;
}

export interface ContactLogRow {
  id: string;
  accountId: string;
  salonId: string;
  repId: string | null;
  channel: 'call' | 'email' | 'text' | 'visit' | 'other';
  outcome: string | null;
  notes: string | null;
  playbookKey: string | null;
  durationMinutes: number | null;
  contactedAt: Date;
  createdAt: Date;
}

export interface PlaybookRow {
  key: string;
  title: string;
  category: string | null;
  targetSignalType: string | null;
  content: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoStateRow {
  id: string;
  virtualToday: Date;
  seed: string;
  lastAdvancedAt: Date | null;
  lastPipelineRunAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The complete day-zero dataset.
 *
 * Insertion order matters: lookup tables first, then tenancy, then everything
 * that references them. `index.ts` documents the order the seeder must use.
 */
export interface FixtureBundle {
  // Lookup tables — seeded before anything that references them.
  roomTypes: RoomTypeRow[];
  segments: SegmentRow[];
  playbooks: PlaybookRow[];
  uvaluxCatalogItems: UvaluxCatalogItemRow[];

  // Tenancy
  orgs: OrgRow[];
  salons: SalonRow[];
  staff: StaffRow[];

  // Catalogue (global — salonId null)
  products: ProductRow[];
  barcodes: BarcodeRow[];

  // Hero salon operations
  rooms: RoomRow[];
  equipmentDevices: EquipmentDeviceRow[];
  services: ServiceRow[];
  customers: CustomerRow[];
  memberships: MembershipRow[];
  packages: PackageRow[];
  visits: VisitRow[];
  sessions: SessionRow[];
  sales: SaleRow[];
  saleLines: SaleLineRow[];
  inventoryLevels: InventoryLevelRow[];
  stockEvents: StockEventRow[];
  campaigns: CampaignRow[];
  giftCards: GiftCardRow[];
  activityEvents: ActivityEventRow[];

  // Consent + ordering
  consentProfiles: ConsentProfileRow[];
  consentAuditEntries: ConsentAuditEntryRow[];
  draftOrders: DraftOrderRow[];
  draftOrderLines: DraftOrderLineRow[];

  // Compass
  accounts: AccountRow[];
  signalSnapshots: SignalSnapshotRow[];
  coachingRequests: CoachingRequestRow[];
  contactLogs: ContactLogRow[];

  // Demo harness
  demoState: DemoStateRow[];
}
