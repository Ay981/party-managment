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

  // Merge only the fields in scope for US-02.
  // Spread existing record first so profiles and other fields are preserved.
  const updated: CompanyParty = {
    ...parties[index],
    partyName:   payload.partyName,
    contactName: payload.contactName ?? null,
    phone:       payload.phone       ?? null,
    email:       payload.email       ?? null,
    address:     payload.address     ?? null,
    isCustomer:  payload.isCustomer,
    isVendor:    payload.isVendor,
    isActive:    payload.isActive,
    updatedAt:   new Date().toISOString(),
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

/**
 * Seeds localStorage with sample party records for development.
 * Call this from a dev-only page or browser console:
 *
 *   import { seedParties } from '@/lib/api/party.mock'
 *   seedParties('company-abc')
 *
 * Only seeds if localStorage is currently empty — won't overwrite real data.
 */
export function seedParties(companyId: string): void {
  if (readParties().length > 0) {
    console.info('[mock] Seed skipped — data already exists.')
    return
  }

  const now = new Date().toISOString()

  const seed: CompanyParty[] = [
    {
      id:          crypto.randomUUID(),
      companyId,
      partyCode:   'CUST-00001',
      partyName:   'Addis Trading Co.',
      contactName: 'Aymen Abdulber',
      tin:          '1234567890',
      phone:        '+251911000001',
      email:        'contact@addistrading.et',
      address:      'Bole, Addis Ababa',
      isCustomer:   true,
      isVendor:     false,
      isActive:     true,
      customerProfile: {
        creditLimit:        50000,
        paymentTerms:       PaymentTerms.DAYS_30,
        riskLevel:          RiskLevel.LOW,
        usesWithholdingTax: true,
        receivableAccount:  MOCK_GL_ACCOUNTS[0],
        status:             true,
      },
      vendorProfile: null,
      createdAt:   now,
      updatedAt:   now,
      deletedAt:   null,
    },
    {
      id:          crypto.randomUUID(),
      companyId,
      partyCode:   'VEND-00002',
      partyName:   'Nile Supplies Ltd.',
      contactName: 'Sara Tesfaye',
      tin:          '0987654321',
      phone:        '+251922000002',
      email:        'info@nilesupplies.et',
      address:      'Piazza, Addis Ababa',
      isCustomer:   false,
      isVendor:     true,
      isActive:     true,
      customerProfile: null,
      vendorProfile: {
        serviceDescription: 'Office and IT supplies',
        usesWithholdingTax: false,
        paymentTerms:       PaymentTerms.CASH,
        payableAccount:     MOCK_GL_ACCOUNTS[2],
        status:             true,
      },
      createdAt:   now,
      updatedAt:   now,
      deletedAt:   null,
    },
    {
      id:          crypto.randomUUID(),
      companyId,
      partyCode:   'PARTY-00003',
      partyName:   'Horn Logistics PLC',
      contactName: 'Dawit Haile',
      tin:          '1122334455',
      phone:        '+251933000003',
      email:        'ops@hornlogistics.et',
      address:      'CMC, Addis Ababa',
      isCustomer:   true,
      isVendor:     true,
      isActive:     false,
      customerProfile: {
        creditLimit:        100000,
        paymentTerms:       PaymentTerms.DAYS_60,
        riskLevel:          RiskLevel.MEDIUM,
        usesWithholdingTax: true,
        receivableAccount:  MOCK_GL_ACCOUNTS[1],
        status:             false,
      },
      vendorProfile: {
        serviceDescription: 'Freight and warehousing',
        usesWithholdingTax: true,
        paymentTerms:       PaymentTerms.DAYS_30,
        payableAccount:     MOCK_GL_ACCOUNTS[3],
        status:             false,
      },
      createdAt:   now,
      updatedAt:   now,
      deletedAt:   null,
    },
  ]

  writeParties(seed)
  console.info(`[mock] Seeded ${seed.length} parties for company ${companyId}.`)
}
