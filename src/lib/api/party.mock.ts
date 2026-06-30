// src/lib/api/party.mock.ts
//
// localStorage mock for the full Party Management API.
// Mirrors the exact function signatures that party.api.ts will use.
// Swap the import in lib/api/index.ts when the real backend is ready —
// zero changes needed in hooks or components.
//
// All 6 user stories are covered:
//   US-01 → createParty
//   US-02 → updateCompanyParty
//   US-03 → listCompanyParties
//   US-04 → getCompanyPartyDetails
//   US-05 → updatePartyStatus
//   US-06 → deleteCompanyParty
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CompanyParty,
  CreatePartyPayload,
  UpdatePartyPayload,
  UpdatePartyStatusPayload,
  PartyFilters,
  PaginatedResponse,
  GLAccount,
  CustomerProfile,
  VendorProfile,
  ApiError,
} from '@/types/party.types'

import { PartyCodePrefix, PaymentTerms, RiskLevel } from '@/types/party.types'


// ─── Storage Key ──────────────────────────────────────────────────────────────

/**
 * The key under which all party records are stored in localStorage.
 * Value is CompanyParty[] serialized as JSON.
 */
const STORAGE_KEY = 'erp_parties'
const DEMO_PARTY_COUNT = 48


// ─── Simulated Network Delay ──────────────────────────────────────────────────

/**
 * Simulates real API latency so loading states and spinners
 * actually render during development. Default 400ms feels natural.
 */
const delay = (ms = 400): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))


// ─── localStorage Helpers ─────────────────────────────────────────────────────

/**
 * Reads all party records from localStorage.
 * Returns empty array if:
 *   - Running on the server (Next.js SSR — window is undefined)
 *   - Key does not exist yet
 *   - JSON is corrupted
 */
function readParties(): CompanyParty[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CompanyParty[]) : []
  } catch {
    // Corrupted JSON — start fresh
    return []
  }
}

/**
 * Writes the full party array back to localStorage.
 * Always replaces the entire array (last-write-wins).
 */
function writeParties(parties: CompanyParty[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parties))
}


// ─── Party Code Generator ─────────────────────────────────────────────────────

/**
 * Generates the auto-assigned party code based on role assignment.
 *
 * Format:
 *   CUST-00001  → Customer only  (PartyCodePrefix.CUSTOMER)
 *   VEND-00001  → Vendor only    (PartyCodePrefix.VENDOR)
 *   PARTY-00001 → Both roles     (PartyCodePrefix.BOTH)
 *
 * The numeric suffix is zero-padded to 5 digits and based on
 * total records ever created (not just active ones).
 *
 * Reference: US-03 Table Columns "Party Code", US-04 Section 1
 */
function generatePartyCode(isCustomer: boolean, isVendor: boolean): string {
  const prefix =
    isCustomer && isVendor
      ? PartyCodePrefix.BOTH
      : isCustomer
      ? PartyCodePrefix.CUSTOMER
      : PartyCodePrefix.VENDOR

  const allParties = readParties()

  // Use total count (including deleted) so codes are never reused
  const next = allParties.length + 1
  const padded = String(next).padStart(5, '0')

  return `${prefix}-${padded}`
}


// ─── Mock GL Accounts ─────────────────────────────────────────────────────────

/**
 * Seeded GL accounts for dropdown selection during party creation.
 * In production these come from a dedicated GL Account endpoint.
 *
 * Receivable accounts → shown when isCustomer = true (BR-07, US-01 Section 3)
 * Payable accounts    → shown when isVendor = true   (BR-08, US-01 Section 4)
 */
export const MOCK_GL_ACCOUNTS: GLAccount[] = [
  { id: 'gl-1200', code: '1200', name: 'Accounts Receivable' },
  { id: 'gl-1201', code: '1201', name: 'Trade Receivables'   },
  { id: 'gl-2100', code: '2100', name: 'Accounts Payable'    },
  { id: 'gl-2101', code: '2101', name: 'Trade Payables'      },
]

export const MOCK_RECEIVABLE_ACCOUNTS = MOCK_GL_ACCOUNTS.filter(gl =>
  ['gl-1200', 'gl-1201'].includes(gl.id)
)

export const MOCK_PAYABLE_ACCOUNTS = MOCK_GL_ACCOUNTS.filter(gl =>
  ['gl-2100', 'gl-2101'].includes(gl.id)
)

/**
 * Resolves a GL account id to the full GLAccount object.
 * Throws if the id is not in our mock list — same behavior as a real 400.
 */
function resolveGLAccount(id: string): GLAccount {
  const account = MOCK_GL_ACCOUNTS.find(gl => gl.id === id)
  if (!account) {
    throw { message: `GL Account '${id}' not found.` } satisfies ApiError
  }
  return account
}


// ─── Error Builder ────────────────────────────────────────────────────────────

/**
 * Builds a typed ApiError object to throw.
 * Keeps error shapes consistent with what party.api.ts will throw.
 */
function mockError(
  message: string,
  code?: string,
  errors?: Record<string, string[]>
): ApiError {
  return { message, code, errors }
}


// ─────────────────────────────────────────────────────────────────────────────
// US-01: Create Party
// POST /api/v1/companies/{companyId}/parties
// Reference: US-01 API Integration, Business Rules BR-01 through BR-10
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new CompanyParty record.
 *
 * Checks enforced here (matching real API behavior):
 *   - Duplicate TIN within this company → 409 equivalent
 *   - GL account resolution for profiles
 *
 * Note: BR-01 through BR-10 are enforced on the frontend via zod
 * before this function is ever called. This layer only handles
 * server-side concerns (duplicate TIN, GL resolution).
 *
 * On success → returns the created CompanyParty (mirrors 201 Created)
 * On failure → throws ApiError (mirrors 400 / 409 / 500)
 */
export async function createParty(
  companyId: string,
  payload: CreatePartyPayload
): Promise<CompanyParty> {
  await delay()

  const parties = readParties()

  // ── 409: Duplicate TIN within this company ──────────────────────────────
  // A TIN can exist in different companies but not twice in the same one.
  // Reference: US-01 Error Handling "Duplicate TIN"
  const duplicate = parties.find(
    p =>
      p.tin === payload.tin &&
      p.companyId === companyId &&
      !p.deletedAt  // soft-deleted records don't count
  )
  if (duplicate) {
    throw mockError(
      'TIN is already linked to this company.',
      'DUPLICATE_TIN'
    )
  }

  // ── Build Customer Profile ───────────────────────────────────────────────
  // Only constructed when isCustomer = true AND customerProfile is provided.
  // BR-02, BR-07 — US-01 Section 3
  let customerProfile: CustomerProfile | null = null
  if (payload.isCustomer && payload.customerProfile) {
    customerProfile = {
      creditLimit:        payload.customerProfile.creditLimit ?? null,
      paymentTerms:       payload.customerProfile.paymentTerms ?? null,
      riskLevel:          payload.customerProfile.riskLevel,
      usesWithholdingTax: payload.customerProfile.usesWithholdingTax,
      receivableAccount:  resolveGLAccount(payload.customerProfile.receivableAccountId),
      status:             true, // always Active on creation
    }
  }

  // ── Build Vendor Profile ─────────────────────────────────────────────────
  // Only constructed when isVendor = true AND vendorProfile is provided.
  // BR-03, BR-08 — US-01 Section 4
  let vendorProfile: VendorProfile | null = null
  if (payload.isVendor && payload.vendorProfile) {
    vendorProfile = {
      serviceDescription: payload.vendorProfile.serviceDescription ?? null,
      usesWithholdingTax: payload.vendorProfile.usesWithholdingTax,
      paymentTerms:       payload.vendorProfile.paymentTerms,
      payableAccount:     resolveGLAccount(payload.vendorProfile.payableAccountId),
      status:             true, // always Active on creation
    }
  }

  const now = new Date().toISOString()

  const newParty: CompanyParty = {
    id:              crypto.randomUUID(),
    companyId,
    partyCode:       generatePartyCode(payload.isCustomer, payload.isVendor),
    partyName:       payload.partyName,
    contactName:     payload.contactName  ?? null,
    tin:             payload.tin,
    phone:           payload.phone        ?? null,
    email:           payload.email        ?? null,
    address:         payload.address      ?? null,
    isCustomer:      payload.isCustomer,
    isVendor:        payload.isVendor,
    isActive:        true,  // always Active on creation
    customerProfile,
    vendorProfile,
    createdAt:       now,
    updatedAt:       now,
    deletedAt:       null,
  }

  writeParties([...parties, newParty])
  return newParty
}


// ─────────────────────────────────────────────────────────────────────────────
// US-02: Update Company Party
// PATCH /api/v1/foundation/companies/{company_id}/parties/{company_party_id}
// Reference: US-02 API Integration, Validation Rules, Scope
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates contact information and role/status flags for a company party.
 *
 * Scope (from US-02):
 *   ✔ partyName, contactName, phone, email, address
 *   ✔ isCustomer, isVendor role flags
 *   ✔ isActive status flag
 *   ✖ Does NOT touch customerProfile or vendorProfile
 *   ✖ Does NOT touch GL Account Assignments
 *   ✖ Does NOT affect the global Party master record
 *
 * On success → returns the updated CompanyParty (mirrors 200 OK)
 * On failure → throws ApiError (mirrors 400 / 404 / 500)
 */
export async function updateCompanyParty(
  companyId: string,
  companyPartyId: string,
  payload: UpdatePartyPayload
): Promise<CompanyParty> {
  await delay()

  const parties = readParties()

  // ── 404: Party not found ─────────────────────────────────────────────────
  const index = parties.findIndex(
    p =>
      p.id === companyPartyId &&
      p.companyId === companyId &&
      !p.deletedAt
  )
  if (index === -1) {
    throw mockError('Party record not found.', 'PARTY_NOT_FOUND')
  }

  let customerProfile: CustomerProfile | null = parties[index].customerProfile
  if (payload.isCustomer && payload.customerProfile) {
    customerProfile = {
      creditLimit:        payload.customerProfile.creditLimit ?? null,
      paymentTerms:       payload.customerProfile.paymentTerms ?? null,
      riskLevel:          payload.customerProfile.riskLevel,
      usesWithholdingTax: payload.customerProfile.usesWithholdingTax,
      receivableAccount:  resolveGLAccount(payload.customerProfile.receivableAccountId),
      status:             parties[index].customerProfile?.status ?? payload.isActive,
    }
  }
  if (!payload.isCustomer) {
    customerProfile = null
  }

  let vendorProfile: VendorProfile | null = parties[index].vendorProfile
  if (payload.isVendor && payload.vendorProfile) {
    vendorProfile = {
      serviceDescription: payload.vendorProfile.serviceDescription ?? null,
      usesWithholdingTax: payload.vendorProfile.usesWithholdingTax,
      paymentTerms:       payload.vendorProfile.paymentTerms,
      payableAccount:     resolveGLAccount(payload.vendorProfile.payableAccountId),
      status:             parties[index].vendorProfile?.status ?? payload.isActive,
    }
  }
  if (!payload.isVendor) {
    vendorProfile = null
  }

  const updated: CompanyParty = {
    ...parties[index],
    partyName:       payload.partyName,
    contactName:     payload.contactName ?? null,
    phone:           payload.phone       ?? null,
    email:           payload.email       ?? null,
    address:         payload.address     ?? null,
    isCustomer:      payload.isCustomer,
    isVendor:        payload.isVendor,
    isActive:        payload.isActive,
    customerProfile,
    vendorProfile,
    updatedAt:       new Date().toISOString(),
  }

  parties[index] = updated
  writeParties(parties)
  return updated
}


// ─────────────────────────────────────────────────────────────────────────────
// US-03: List Company Parties
// GET /api/v1/foundation/companies/{company_id}/parties
// Reference: US-03 UI Field Specs, Query Parameters, Pagination Response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a paginated, filtered list of active company parties.
 *
 * Filtering order:
 *   1. Exclude soft-deleted records (deletedAt !== null)
 *   2. Scope to companyId
 *   3. Search term (partyName, TIN, phone)
 *   4. Role filters (isCustomer, isVendor)
 *   5. Status filter (isActive)
 *   6. Paginate
 *
 * Reference:
 *   Filters    → US-03 Filters Section
 *   Columns    → US-03 Table Columns
 *   Pagination → US-03 Pagination Response
 */
export async function listCompanyParties(
  companyId: string,
  filters: PartyFilters
): Promise<PaginatedResponse<CompanyParty>> {
  await delay()

  // Start: all non-deleted parties belonging to this company
  let results = readParties().filter(
    p => p.companyId === companyId && !p.deletedAt
  )

  // ── Search ───────────────────────────────────────────────────────────────
  // Searches partyName, TIN, or phone — US-03 Filters "Search"
  if (filters.search.trim()) {
    const term = filters.search.trim().toLowerCase()
    results = results.filter(
      p =>
        p.partyName.toLowerCase().includes(term) ||
        p.tin.includes(term)                     ||
        (p.phone?.toLowerCase().includes(term) ?? false)
    )
  }

  // ── Customer filter ──────────────────────────────────────────────────────
  // null = show all; true = Customer Only checkbox — US-03 Filters
  if (filters.isCustomer !== null) {
    results = results.filter(p => p.isCustomer === filters.isCustomer)
  }

  // ── Vendor filter ────────────────────────────────────────────────────────
  // null = show all; true = Vendor Only checkbox — US-03 Filters
  if (filters.isVendor !== null) {
    results = results.filter(p => p.isVendor === filters.isVendor)
  }

  // ── Active status filter ─────────────────────────────────────────────────
  // null = All; true = Active; false = Inactive — US-03 Filters
  if (filters.isActive !== null) {
    results = results.filter(p => p.isActive === filters.isActive)
  }

  // ── Pagination ───────────────────────────────────────────────────────────
  const total      = results.length
  const totalPages = Math.max(1, Math.ceil(total / filters.perPage))
  const start      = (filters.page - 1) * filters.perPage
  const paginated  = results.slice(start, start + filters.perPage)

  return {
    data: paginated,
    pagination: {
      total,
      page:       filters.page,
      perPage:    filters.perPage,
      totalPages,
    },
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// US-04: View Company Party Details
// GET /api/v1/foundation/companies/{company_id}/parties/{id}
// Reference: US-04 Screen Description, Section Field Reference
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns full detail of a single company party.
 *
 * The response includes all 6 sections from US-04:
 *   Section 1 — Party Information
 *   Section 2 — Party Roles (derived from isCustomer / isVendor flags)
 *   Section 3 — Status Information
 *   Section 4 — Customer Profile (null if not a customer or not configured)
 *   Section 5 — Vendor Profile   (null if not a vendor or not configured)
 *   Section 6 — GL Account Assignments (embedded in profiles)
 *
 * On success → returns CompanyParty (mirrors 200 OK)
 * On failure → throws ApiError (mirrors 403 / 404 / 500)
 */
export async function getCompanyPartyDetails(
  companyId: string,
  partyId: string
): Promise<CompanyParty> {
  await delay()

  const party = readParties().find(
    p =>
      p.id        === partyId   &&
      p.companyId === companyId &&
      !p.deletedAt
  )

  if (!party) {
    throw mockError('Party record not found.', 'PARTY_NOT_FOUND')
  }

  return party
}


// ─────────────────────────────────────────────────────────────────────────────
// US-05: Activate or Deactivate Company Party
// PATCH /api/v1/foundation/companies/{company_id}/parties/{id}/status
// Reference: US-05 API Integration, Request Payload, UI Behavior
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggles the isActive status of a company party.
 *
 * Payload:
 *   { isActive: false } → Deactivate (mirrors US-05 table row 1)
 *   { isActive: true  } → Activate   (mirrors US-05 table row 2)
 *
 * Both return the updated CompanyParty on success.
 * UI updates status badge, actions menu, and timestamp — US-05 AC-4
 *
 * On success → returns updated CompanyParty (mirrors 200 OK)
 * On failure → throws ApiError (mirrors 404 / 500)
 */
export async function updatePartyStatus(
  companyId: string,
  partyId: string,
  payload: UpdatePartyStatusPayload
): Promise<CompanyParty> {
  await delay()

  const parties = readParties()

  const index = parties.findIndex(
    p =>
      p.id        === partyId   &&
      p.companyId === companyId &&
      !p.deletedAt
  )

  if (index === -1) {
    throw mockError('Company party not found.', 'PARTY_NOT_FOUND')
  }

  parties[index] = {
    ...parties[index],
    isActive:  payload.isActive,
    updatedAt: new Date().toISOString(),
  }

  writeParties(parties)
  return parties[index]
}


// ─────────────────────────────────────────────────────────────────────────────
// US-06: Soft Delete Company Party
// DELETE /api/v1/foundation/companies/{company_id}/parties/{id}
// Reference: US-06 Description, API Integration, Post-Delete Behavior
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soft-deletes a company party.
 *
 * What happens on the record (from US-06 Description):
 *   isActive  → set to false
 *   deletedAt → set to current timestamp
 *
 * The record is NOT removed from localStorage — it remains for
 * historical and audit purposes. It just stops appearing in list results
 * because listCompanyParties always filters out records where deletedAt !== null.
 *
 * Reference: Appendix C "Soft Delete"
 *
 * On success → void (mirrors 200 OK with no body)
 * On failure → throws ApiError with code PARTY_NOT_FOUND (mirrors 404)
 */
export async function deleteCompanyParty(
  companyId: string,
  partyId: string
): Promise<void> {
  await delay()

  const parties = readParties()

  const index = parties.findIndex(
    p =>
      p.id        === partyId   &&
      p.companyId === companyId &&
      !p.deletedAt  // can't delete an already-deleted record
  )

  if (index === -1) {
    // Error code matches US-06 Error Handling table: PARTY_NOT_FOUND
    throw mockError('Party record not found.', 'PARTY_NOT_FOUND')
  }

  // Soft delete — set flags, keep the record
  parties[index] = {
    ...parties[index],
    isActive:  false,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  writeParties(parties)
}


// ─── Dev Utility — Seed Data ──────────────────────────────────────────────────

const demoNamePrefixes = [
  'Addis',
  'Nile',
  'Horn',
  'Merkato',
  'Sheba',
  'Abyssinia',
  'Ethio',
  'Bole',
  'Rift',
  'Blue Nile',
  'Unity',
  'Capital',
]

const demoNameSuffixes = [
  'Trading Co.',
  'Supplies PLC',
  'Logistics Ltd.',
  'Manufacturing',
  'Foods Enterprise',
  'Textiles',
  'Construction',
  'Pharma Distribution',
]

const demoContacts = [
  'Aymen Abdulber',
  'Sara Tesfaye',
  'Dawit Haile',
  'Mekdes Alemu',
  'Yonatan Bekele',
  'Hana Girma',
  'Samuel Tadesse',
  'Liya Kebede',
  'Fitsum Getachew',
  'Rahel Mohammed',
  'Natnael Mulugeta',
  'Selamawit Abebe',
]

const demoAreas = [
  'Bole, Addis Ababa',
  'Piazza, Addis Ababa',
  'CMC, Addis Ababa',
  'Kazanchis, Addis Ababa',
  'Sarbet, Addis Ababa',
  'Megenagna, Addis Ababa',
  'Mexico, Addis Ababa',
  'Lideta, Addis Ababa',
]

const demoServices = [
  'Office and IT supplies',
  'Freight and warehousing',
  'Facility maintenance',
  'Packaging materials',
  'Raw material sourcing',
  'Professional services',
  'Distribution and delivery',
  'Equipment rental',
]

function buildDemoParty(companyId: string, index: number, nowMs: number): CompanyParty {
  const sequence = index + 1
  const role = index % 3
  const isCustomer = role !== 1
  const isVendor = role !== 0
  const isActive = index % 9 !== 7
  const prefix =
    isCustomer && isVendor
      ? PartyCodePrefix.BOTH
      : isCustomer
      ? PartyCodePrefix.CUSTOMER
      : PartyCodePrefix.VENDOR

  const namePrefix = demoNamePrefixes[index % demoNamePrefixes.length]
  const nameSuffix = demoNameSuffixes[index % demoNameSuffixes.length]
  const branch = Math.floor(index / demoNamePrefixes.length) + 1
  const partyName = `${namePrefix} ${nameSuffix}${branch > 1 ? ` ${branch}` : ''}`
  const slug = partyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const timestamp = new Date(nowMs - index * 24 * 60 * 60 * 1000).toISOString()

  return {
    id:          crypto.randomUUID(),
    companyId,
    partyCode:   `${prefix}-${String(sequence).padStart(5, '0')}`,
    partyName,
    contactName: demoContacts[index % demoContacts.length],
    tin:          String(7000000000 + sequence),
    phone:        `+251911${String(100000 + sequence).slice(-6)}`,
    email:        `${slug}@demo.local`,
    address:      demoAreas[index % demoAreas.length],
    isCustomer,
    isVendor,
    isActive,
    customerProfile: isCustomer
      ? {
          creditLimit:        25000 + (index % 8) * 15000,
          paymentTerms:       [PaymentTerms.CASH, PaymentTerms.DAYS_30, PaymentTerms.DAYS_60][index % 3],
          riskLevel:          [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH][index % 3],
          usesWithholdingTax: index % 2 === 0,
          receivableAccount:  MOCK_RECEIVABLE_ACCOUNTS[index % MOCK_RECEIVABLE_ACCOUNTS.length],
          status:             isActive,
        }
      : null,
    vendorProfile: isVendor
      ? {
          serviceDescription: demoServices[index % demoServices.length],
          usesWithholdingTax: index % 2 !== 0,
          paymentTerms:       [PaymentTerms.CASH, PaymentTerms.DAYS_30, PaymentTerms.ADVANCE_PAYMENT][index % 3],
          payableAccount:     MOCK_PAYABLE_ACCOUNTS[index % MOCK_PAYABLE_ACCOUNTS.length],
          status:             isActive,
        }
      : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  }
}

/**
 * Seeds localStorage with demo party records for one company.
 * Returns the number of records added. Existing visible company data is left alone.
 */
export function seedParties(companyId: string): number {
  const parties = readParties()
  const hasCompanyParties = parties.some(
    p => p.companyId === companyId && !p.deletedAt
  )

  if (hasCompanyParties) {
    console.info(`[mock] Seed skipped - company ${companyId} already has parties.`)
    return 0
  }

  const nowMs = Date.now()
  const seed = Array.from({ length: DEMO_PARTY_COUNT }, (_, index) =>
    buildDemoParty(companyId, index, nowMs)
  )

  writeParties([...parties, ...seed])
  console.info(`[mock] Seeded ${seed.length} parties for company ${companyId}.`)
  return seed.length
}
