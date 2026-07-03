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

const STORAGE_KEY = 'erp_parties'
const DEMO_PARTY_COUNT = 48

const delay = (ms = 400): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

function readParties(): CompanyParty[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CompanyParty[]) : []
  } catch {
    return []
  }
}

function writeParties(parties: CompanyParty[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parties))
}

function generatePartyCode(isCustomer: boolean, isVendor: boolean): string {
  const prefix =
    isCustomer && isVendor
      ? PartyCodePrefix.BOTH
      : isCustomer
      ? PartyCodePrefix.CUSTOMER
      : PartyCodePrefix.VENDOR

  // Count deleted records too so generated codes are never reused.
  const next = readParties().length + 1
  const padded = String(next).padStart(5, '0')

  return `${prefix}-${padded}`
}

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

function resolveGLAccount(id: string): GLAccount {
  const account = MOCK_GL_ACCOUNTS.find(gl => gl.id === id)
  if (!account) {
    throw { message: `GL Account '${id}' not found.` } satisfies ApiError
  }
  return account
}

function mockError(
  message: string,
  code?: string,
  errors?: Record<string, string[]>
): ApiError {
  return { message, code, errors }
}

export async function createParty(
  companyId: string,
  payload: CreatePartyPayload
): Promise<CompanyParty> {
  await delay()

  const parties = readParties()

  // TINs may repeat across companies, but not within one active company.
  const duplicate = parties.find(
    p =>
      p.tin === payload.tin &&
      p.companyId === companyId &&
      !p.deletedAt
  )
  if (duplicate) {
    throw mockError(
      'TIN is already linked to this company.',
      'DUPLICATE_TIN'
    )
  }

  let customerProfile: CustomerProfile | null = null
  if (payload.isCustomer && payload.customerProfile) {
    customerProfile = {
      creditLimit:        payload.customerProfile.creditLimit ?? null,
      paymentTerms:       payload.customerProfile.paymentTerms ?? null,
      riskLevel:          payload.customerProfile.riskLevel,
      usesWithholdingTax: payload.customerProfile.usesWithholdingTax,
      receivableAccount:  resolveGLAccount(payload.customerProfile.receivableAccountId),
      status:             true,
    }
  }

  let vendorProfile: VendorProfile | null = null
  if (payload.isVendor && payload.vendorProfile) {
    vendorProfile = {
      serviceDescription: payload.vendorProfile.serviceDescription ?? null,
      usesWithholdingTax: payload.vendorProfile.usesWithholdingTax,
      paymentTerms:       payload.vendorProfile.paymentTerms,
      payableAccount:     resolveGLAccount(payload.vendorProfile.payableAccountId),
      status:             true,
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
    isActive:        true,
    customerProfile,
    vendorProfile,
    createdAt:       now,
    updatedAt:       now,
    deletedAt:       null,
  }

  writeParties([...parties, newParty])
  return newParty
}

export async function updateCompanyParty(
  companyId: string,
  companyPartyId: string,
  payload: UpdatePartyPayload
): Promise<CompanyParty> {
  await delay()

  const parties = readParties()
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

export async function listCompanyParties(
  companyId: string,
  filters: PartyFilters
): Promise<PaginatedResponse<CompanyParty>> {
  await delay()

  // Lists hide soft-deleted records.
  let results = readParties().filter(
    p => p.companyId === companyId && !p.deletedAt
  )

  if (filters.search.trim()) {
    const term = filters.search.trim().toLowerCase()
    results = results.filter(
      p =>
        p.partyName.toLowerCase().includes(term) ||
        p.tin.includes(term)                     ||
        (p.phone?.toLowerCase().includes(term) ?? false)
    )
  }

  if (filters.isCustomer !== null) {
    results = results.filter(p => p.isCustomer === filters.isCustomer)
  }

  if (filters.isVendor !== null) {
    results = results.filter(p => p.isVendor === filters.isVendor)
  }

  if (filters.isActive !== null) {
    results = results.filter(p => p.isActive === filters.isActive)
  }

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
      !p.deletedAt
  )

  if (index === -1) {
    throw mockError('Party record not found.', 'PARTY_NOT_FOUND')
  }

  // Soft delete: keep the record, hide it from lists.
  parties[index] = {
    ...parties[index],
    isActive:  false,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  writeParties(parties)
}

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
