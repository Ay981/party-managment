export enum PaymentTerms {
  CASH            = 'CASH',
  DAYS_30         = '30_DAYS',
  DAYS_60         = '60_DAYS',
  ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
}

export enum RiskLevel {
  LOW    = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH   = 'HIGH',
}

export enum PartyCodePrefix {
  CUSTOMER = 'CUST',
  VENDOR   = 'VEND',
  BOTH     = 'PARTY',
}

export enum ActiveStatusFilter {
  ALL      = 'ALL',
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type PerPageOption = 10 | 20 | 50 | 100

export interface GLAccount {
  id: string
  code: string
  name: string
}

export interface CustomerProfile {
  creditLimit:        number | null
  paymentTerms:       PaymentTerms | null
  riskLevel:          RiskLevel
  usesWithholdingTax: boolean
  receivableAccount:  GLAccount
  status:             boolean
}

export interface VendorProfile {
  serviceDescription: string | null
  usesWithholdingTax: boolean
  paymentTerms:       PaymentTerms
  payableAccount:     GLAccount
  status:             boolean
}

export interface CompanyParty {
  id: string
  companyId: string
  partyCode: string
  partyName: string
  contactName: string | null
  // TIN is immutable after creation.
  tin: string
  phone: string | null
  email: string | null
  address: string | null
  isCustomer: boolean
  isVendor: boolean
  isActive: boolean
  // Profiles are present only when the matching role is enabled.
  customerProfile: CustomerProfile | null
  vendorProfile: VendorProfile | null
  createdAt: string
  updatedAt: string
  // Soft deletes keep the record for history while hiding it from lists.
  deletedAt: string | null
}

export interface CreateCustomerProfilePayload {
  creditLimit?:        number
  paymentTerms?:       PaymentTerms
  riskLevel:           RiskLevel
  usesWithholdingTax:  boolean
  receivableAccountId: string
}

export interface CreateVendorProfilePayload {
  serviceDescription?: string
  usesWithholdingTax:  boolean
  paymentTerms:        PaymentTerms
  payableAccountId:    string
}

export interface CreatePartyPayload {
  partyName: string
  contactName?: string
  tin: string
  phone?: string
  email?: string
  address?: string
  isCustomer: boolean
  isVendor: boolean
  customerProfile?: CreateCustomerProfilePayload
  vendorProfile?: CreateVendorProfilePayload
}

export interface UpdatePartyPayload {
  partyName: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  isCustomer: boolean
  isVendor: boolean
  isActive: boolean
  customerProfile?: CreateCustomerProfilePayload
  vendorProfile?: CreateVendorProfilePayload
}

export interface UpdatePartyStatusPayload {
  isActive: boolean
}

export interface PartyFilters {
  search: string
  isCustomer: boolean | null
  isVendor: boolean | null
  isActive: boolean | null
  page: number
  perPage: PerPageOption
}

export interface PaginationMeta {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  code?: string
}

export interface ModalState {
  type: 'delete' | 'activate' | 'deactivate' | null
  party: Pick<CompanyParty, 'id' | 'partyName' | 'tin'> | null
}
