// src/types/party.types.ts
//
// Type definitions for the Party Management module.
// Source document: FR-VM-01 — Foundation Management / Party Management
// All section, business rule (BR), and user story (US) references below
// point directly to that document.
// ─────────────────────────────────────────────────────────────────────────────


// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Payment terms options shared across both Customer and Vendor profiles.
 *
 * Customer Profile field  → US-01, Section 3 "Payment Terms"
 * Vendor Profile field    → US-01, Section 4 "Payment Terms"
 * Displayed in details    → US-04, Section 4 & 5
 */
export enum PaymentTerms {
  CASH             = 'CASH',
  DAYS_30          = '30_DAYS',
  DAYS_60          = '60_DAYS',
  ADVANCE_PAYMENT  = 'ADVANCE_PAYMENT',
}

/**
 * Risk classification for a Customer.
 * Required field — dropdown — US-01, Section 3 "Risk Level"
 * Displayed as a badge in the details view — US-04, Section 4
 */
export enum RiskLevel {
  LOW    = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH   = 'HIGH',
}

/**
 * Auto-generated party code prefix.
 * Determined by the role(s) assigned at creation time.
 *
 * CUST-xxxxx  → Customer only
 * VEND-xxxxx  → Vendor only
 * PARTY-xxxxx → Dual role (Customer + Vendor)
 *
 * Reference: US-03 Table Columns "Party Code", US-04 Section 1 "Party Code"
 */
export enum PartyCodePrefix {
  CUSTOMER = 'CUST',
  VENDOR   = 'VEND',
  BOTH     = 'PARTY',
}

/**
 * Active/Inactive status options used in the List filter dropdown.
 * Reference: US-03 Filters Section "Active Status"
 * Options: All / Active / Inactive
 */
export enum ActiveStatusFilter {
  ALL      = 'ALL',
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Per-page options for the list pagination control.
 * Reference: US-03 Filters Section "Per Page"
 */
export type PerPageOption = 10 | 20 | 50 | 100


// ─── GL Account ───────────────────────────────────────────────────────────────

/**
 * A General Ledger account used for financial postings.
 *
 * Two GL accounts are assigned during party creation:
 *   - Receivable Account → required when Customer is selected (BR-07)
 *   - Payable Account    → required when Vendor is selected   (BR-08)
 *
 * Displayed in details view under Section 6 — GL Account Assignments (US-04)
 * Reference: Appendix C Glossary — "GL Account"
 */
export interface GLAccount {
  id:   string  // Used in the create payload (receivableAccountId / payableAccountId)
  code: string  // e.g. "1200", "2100"
  name: string  // e.g. "Accounts Receivable", "Accounts Payable"
}


// ─── Profiles ─────────────────────────────────────────────────────────────────

/**
 * Customer-specific profile data.
 * This section is only visible/required when isCustomer = true.
 *
 * Conditional display rules:
 *   - BR-02: Customer Profile section shown only when Customer checkbox is selected
 *   - BR-04: Shown alongside Vendor Profile when both roles are selected
 *
 * Field-level rules:
 *   - creditLimit    → optional, must be >= 0 (BR-09), US-01 Section 3
 *   - paymentTerms   → optional dropdown, US-01 Section 3
 *   - riskLevel      → REQUIRED dropdown (LOW/MEDIUM/HIGH), US-01 Section 3
 *   - usesWithholdingTax → Yes/No radio, US-01 Section 3
 *   - receivableAccount  → REQUIRED GL account selection (BR-07), US-01 Section 3
 *   - status         → Active/Inactive badge, US-04 Section 4
 *
 * Details view: US-04 Section 4 — "Customer Profile"
 */
export interface CustomerProfile {
  creditLimit:         number | null       // null when not provided at creation
  paymentTerms:        PaymentTerms | null // null when not provided at creation
  riskLevel:           RiskLevel           // always present — required field
  usesWithholdingTax:  boolean
  receivableAccount:   GLAccount           // always present — required (BR-07)
  status:              boolean             // true = Active, false = Inactive
}

/**
 * Vendor-specific profile data.
 * This section is only visible/required when isVendor = true.
 *
 * Conditional display rules:
 *   - BR-03: Vendor Profile section shown only when Vendor checkbox is selected
 *   - BR-04: Shown alongside Customer Profile when both roles are selected
 *
 * Field-level rules:
 *   - serviceDescription → optional free text, US-01 Section 4
 *   - usesWithholdingTax → Yes/No radio, US-01 Section 4
 *   - paymentTerms       → REQUIRED dropdown, US-01 Section 4
 *   - payableAccount     → REQUIRED GL account selection (BR-08), US-01 Section 4
 *   - status             → Active/Inactive badge, US-04 Section 5
 *
 * Details view: US-04 Section 5 — "Vendor Profile"
 */
export interface VendorProfile {
  serviceDescription:  string | null  // null when not provided
  usesWithholdingTax:  boolean
  paymentTerms:        PaymentTerms   // always present — required field
  payableAccount:      GLAccount      // always present — required (BR-08)
  status:              boolean        // true = Active, false = Inactive
}


// ─── Core Entity ──────────────────────────────────────────────────────────────

/**
 * CompanyParty — the primary entity this module manages.
 *
 * Represents the relationship between a global Party (business entity)
 * and a specific Company within the ERP.
 *
 * Key distinction from the FRD Glossary (Appendix C):
 *   - "Party"        → global business entity record
 *   - "CompanyParty" → the link between a Party and a specific Company
 *                      identified by company_party_id
 *
 * API base path: /api/v1/foundation/companies/{company_id}/parties
 * Reference: Module Summary, Appendix A, Appendix C
 *
 * Lifecycle covered:
 *   - Created  → US-01 (POST)
 *   - Updated  → US-02 (PATCH)
 *   - Listed   → US-03 (GET)
 *   - Viewed   → US-04 (GET /{id})
 *   - Status   → US-05 (PATCH /{id}/status)
 *   - Deleted  → US-06 (DELETE /{id}) — soft delete only
 */
export interface CompanyParty {
  /** Primary identifier for this company-party relationship. Appendix C */
  id: string

  /** The company this party belongs to. Used in every API path. */
  companyId: string

  /**
   * Auto-generated code with prefix based on role.
   * CUST-xxxxx | VEND-xxxxx | PARTY-xxxxx
   * Reference: US-03 Table Columns, US-04 Section 1, Appendix C "party_code"
   */
  partyCode: string

  /**
   * Legal name of the party. Max 255 characters.
   * Required — US-01 Section 1, US-02 UI Field Specs
   */
  partyName: string

  /**
   * Primary contact person. Max 255 characters. Optional.
   * US-01 Section 1, US-02 UI Field Specs
   */
  contactName: string | null

  /**
   * Tax Identification Number. Exactly 10 numeric digits.
   * Required at creation. Immutable after creation.
   * Validation: BR-05
   * Displayed masked in list view — US-03 Table Columns
   * Reference: Appendix C "TIN"
   */
  tin: string

  /** Contact phone number. Max 50 characters. Optional. US-01 Section 1 */
  phone: string | null

  /**
   * Email address. Must be valid format. Optional.
   * Validation: BR-06
   * US-01 Section 1
   */
  email: string | null

  /** Free text address. Optional. US-01 Section 1 */
  address: string | null

  /**
   * Whether this party has the Customer role.
   * Drives Customer Profile section visibility (BR-02)
   * Drives receivableAccount requirement (BR-07)
   * Appendix C "is_customer"
   */
  isCustomer: boolean

  /**
   * Whether this party has the Vendor role.
   * Drives Vendor Profile section visibility (BR-03)
   * Drives payableAccount requirement (BR-08)
   * Appendix C "is_vendor"
   */
  isVendor: boolean

  /**
   * Whether this party is available for business transactions.
   * Toggled via US-05. Set to false on soft delete (US-06).
   * Appendix C "is_active"
   */
  isActive: boolean

  /**
   * Customer-specific profile. null if party is not a Customer,
   * or if profile has not been configured yet.
   * US-04 Section 4 — shows empty state if null
   */
  customerProfile: CustomerProfile | null

  /**
   * Vendor-specific profile. null if party is not a Vendor,
   * or if profile has not been configured yet.
   * US-04 Section 5 — shows empty state if null
   */
  vendorProfile: VendorProfile | null

  /** Record creation timestamp. Displayed in US-04 Section 3. ISO 8601 string */
  createdAt: string

  /** Last update timestamp. Displayed in US-03 table and US-04 Section 3. ISO 8601 */
  updatedAt: string

  /**
   * Set on soft delete. null means record is active.
   * Backend sets this on DELETE request — US-06
   * Appendix C "Soft Delete"
   */
  deletedAt: string | null
}


// ─── Request Payloads ─────────────────────────────────────────────────────────

/**
 * Customer profile fields sent during party creation.
 * Only included in the request when isCustomer = true (BR-02, BR-07).
 * Reference: US-01 Section 3
 */
export interface CreateCustomerProfilePayload {
  creditLimit?:         number        // optional, >= 0 enforced by BR-09
  paymentTerms?:        PaymentTerms  // optional
  riskLevel:            RiskLevel     // required
  usesWithholdingTax:   boolean       // required
  receivableAccountId:  string        // required GL account id (BR-07)
}

/**
 * Vendor profile fields sent during party creation.
 * Only included in the request when isVendor = true (BR-03, BR-08).
 * Reference: US-01 Section 4
 */
export interface CreateVendorProfilePayload {
  serviceDescription?:  string        // optional
  usesWithholdingTax:   boolean       // required
  paymentTerms:         PaymentTerms  // required
  payableAccountId:     string        // required GL account id (BR-08)
}

/**
 * Full payload for creating a new party.
 * Sent to: POST /api/v1/companies/{companyId}/parties
 *
 * Business rules enforced before submission:
 *   BR-01 — at least one of isCustomer or isVendor must be true
 *   BR-05 — tin must be exactly 10 digits
 *   BR-06 — email must be valid format if provided
 *   BR-07 — customerProfile.receivableAccountId required when isCustomer = true
 *   BR-08 — vendorProfile.payableAccountId required when isVendor = true
 *   BR-09 — creditLimit >= 0 if provided
 *   BR-10 — Save button disabled until all required fields are valid
 *
 * Reference: US-01 API Integration, Appendix A
 */
export interface CreatePartyPayload {
  partyName:        string
  contactName?:     string
  tin:              string                       // exactly 10 digits (BR-05)
  phone?:           string
  email?:           string                       // valid format (BR-06)
  address?:         string
  isCustomer:       boolean                      // BR-01
  isVendor:         boolean                      // BR-01
  customerProfile?: CreateCustomerProfilePayload // required when isCustomer (BR-07)
  vendorProfile?:   CreateVendorProfilePayload   // required when isVendor (BR-08)
}

/**
 * Payload for updating basic company-party information.
 * Sent to: PATCH /api/v1/foundation/companies/{company_id}/parties/{company_party_id}
 *
 * Important scoping note from US-02:
 *   - Updates ONLY the company-party relationship record
 *   - Does NOT update the global party master record
 *   - Updates CustomerProfile / VendorProfile when the matching role is selected
 *   - Updates required GL Account Assignments for selected roles
 *
 * Validation rules (US-02):
 *   - partyName: required, max 255 chars
 *   - email: valid format if provided
 *   - isCustomer / isVendor: at least one must remain true
 *
 * Reference: US-02 API Integration, Appendix A
 */
export interface UpdatePartyPayload {
  partyName:     string
  contactName?:  string
  phone?:        string
  email?:        string
  address?:      string
  isCustomer:    boolean  // at least one role must stay selected (US-02 Validation)
  isVendor:      boolean  // at least one role must stay selected (US-02 Validation)
  isActive:      boolean
  customerProfile?: CreateCustomerProfilePayload
  vendorProfile?:   CreateVendorProfilePayload
}

/**
 * Payload for toggling party active status.
 * Sent to: PATCH /api/v1/foundation/companies/{company_id}/parties/{id}/status
 *
 * Activate:   { isActive: true }  → 200 OK
 * Deactivate: { isActive: false } → 200 OK
 *
 * Reference: US-05 API Integration, Request Payload table
 */
export interface UpdatePartyStatusPayload {
  isActive: boolean
}


// ─── List & Filters ───────────────────────────────────────────────────────────

/**
 * Client-side filter state for the Party List screen.
 * Stored in Zustand (party.store.ts) and passed to useParties hook.
 *
 * Maps directly to query parameters on:
 * GET /api/v1/foundation/companies/{company_id}/parties
 *
 * Reference: US-03 Filters Section, US-03 API Integration "Query Parameters"
 */
export interface PartyFilters {
  /** Searches by Party Name, TIN, or Phone Number — US-03 Filters */
  search:     string

  /** Filters to is_customer = true when set — US-03 Filters "Customer Only" */
  isCustomer: boolean | null

  /** Filters to is_vendor = true when set — US-03 Filters "Vendor Only" */
  isVendor:   boolean | null

  /** null = show all, true = Active only, false = Inactive only — US-03 Filters */
  isActive:   boolean | null

  /** Current page number. Default: 1 — US-03 API Query Parameters */
  page:       number

  /** Records per page. Options: 10/20/50/100 — US-03 Filters "Per Page" */
  perPage:    PerPageOption
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/**
 * Pagination metadata returned with every list response.
 * Reference: US-03 API Integration "Pagination Response"
 */
export interface PaginationMeta {
  total:      number  // pagination.total      — total matching records
  page:       number  // pagination.page       — current page
  perPage:    number  // pagination.per_page   — records per page
  totalPages: number  // pagination.total_pages
}

/**
 * Generic paginated API response wrapper.
 * Used by useParties hook for the list endpoint.
 * Reference: US-03 API Integration
 */
export interface PaginatedResponse<T> {
  data:       T[]
  pagination: PaginationMeta
}


// ─── API Errors ───────────────────────────────────────────────────────────────

/**
 * Standard API error shape returned by the backend.
 *
 * HTTP codes and their meanings across the module:
 *   400 → validation error — errors map contains field-level messages
 *   401 → unauthorized — no permission to view (US-03)
 *   403 → forbidden — no permission for specific record (US-04)
 *   404 → party not found (US-04, US-05, US-06)
 *   409 → conflict — duplicate TIN within this company (US-01)
 *   500 → unexpected server error (all user stories)
 *
 * Reference: Error Handling sections across US-01 through US-06
 */
export interface ApiError {
  message: string                        // human-readable error message
  errors?: Record<string, string[]>      // field-level validation errors (400 only)
  code?:   string                        // e.g. "PARTY_NOT_FOUND" — US-06
}


// ─── Modal State ──────────────────────────────────────────────────────────────

/**
 * Tracks which confirmation modal is open and for which party.
 * Stored in Zustand (party.store.ts).
 *
 * Used by:
 *   - DeletePartyModal    → US-06 Delete Confirmation Modal
 *   - StatusChangeModal   → US-05 Confirmation Modals
 */
export interface ModalState {
  type:  'delete' | 'activate' | 'deactivate' | null
  party: Pick<CompanyParty, 'id' | 'partyName' | 'tin'> | null
}
