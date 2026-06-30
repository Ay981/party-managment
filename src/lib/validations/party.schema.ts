// src/lib/validations/party.schema.ts
//
// Zod validation schemas for party creation and updates.
// Every rule here maps directly to a Business Rule (BR) from FR-VM-01.
//
// Two schemas:
//   createPartySchema → US-01, enforces BR-01 through BR-10
//   updatePartySchema → US-02, enforces the narrower Validation Rules section
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'
import { PaymentTerms, RiskLevel } from '@/types/party.types'


// ─── Shared Field Schemas ──────────────────────────────────────────────────────

/** Party Name — required, max 255. Shared by US-01 Section 1 and US-02. */
const partyNameSchema = z
  .string()
  .trim()
  .min(1, 'Party name is required.')
  .max(255, 'Party name must be 255 characters or fewer.')

/** Contact Name — optional, max 255. Section 1 / US-02 */
const contactNameSchema = z
  .string()
  .trim()
  .max(255, 'Contact name must be 255 characters or fewer.')
  .optional()
  .or(z.literal(''))

/** Phone — optional, max 50. Section 1 / US-02 */
const phoneSchema = z
  .string()
  .trim()
  .max(50, 'Phone must be 50 characters or fewer.')
  .optional()
  .or(z.literal(''))

/**
 * Email — optional, but valid format if provided.
 * Reference: BR-06, US-02 Validation Rules "Must be a valid email format"
 */
const emailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address.')
  .optional()
  .or(z.literal(''))

/** Address — optional free text. Section 1 / US-02 */
const addressSchema = z.string().trim().optional().or(z.literal(''))

/**
 * TIN — required, exactly 10 numeric digits.
 * Reference: BR-05 "TIN must contain exactly 10 numeric digits."
 * TIN is immutable after creation (Appendix C Glossary) — only used
 * in createPartySchema, never in updatePartySchema.
 */
const tinSchema = z
  .string()
  .trim()
  .min(1, 'TIN is required.')
  .regex(/^\d{10}$/, 'TIN must contain exactly 10 digits.')


// ─── Create Party Schema (US-01) ───────────────────────────────────────────────

/**
 * customerProfile and vendorProfile are ALWAYS present in the form's
 * default values — React Hook Form needs a stable shape to register
 * nested fields before the user checks Customer/Vendor. Required
 * sub-fields are enforced conditionally via superRefine, which turns
 * BR-02/BR-03's conditional VISIBILITY into conditional VALIDATION.
 *
 * creditLimit is kept as a string (raw input value) — controlled number
 * inputs in RHF are unreliable. Parsed to a number in onSubmit right
 * before building the payload.
 */
export const createPartySchema = z
  .object({
    // ── Section 1 — Party Information ──
    partyName:   partyNameSchema,
    contactName: contactNameSchema,
    tin:         tinSchema,
    phone:       phoneSchema,
    email:       emailSchema,
    address:     addressSchema,

    // ── Section 2 — Party Type ──
    isCustomer: z.boolean(), // BR-01
    isVendor:   z.boolean(), // BR-01

    // ── Section 3 — Customer Profile (conditionally required) ──
    customerProfile: z.object({
      creditLimit:         z.string().optional(),                               // BR-09, parsed at submit
      paymentTerms:        z.union([z.nativeEnum(PaymentTerms), z.literal('')]).optional(),
      riskLevel:           z.union([z.nativeEnum(RiskLevel), z.literal('')]),    // required when isCustomer
      usesWithholdingTax:  z.boolean(),
      receivableAccountId: z.string(),                                          // required when isCustomer — BR-07
    }),

    // ── Section 4 — Vendor Profile (conditionally required) ──
    vendorProfile: z.object({
      serviceDescription: z.string().optional(),
      usesWithholdingTax: z.boolean(),
      paymentTerms:       z.union([z.nativeEnum(PaymentTerms), z.literal('')]), // required when isVendor
      payableAccountId:   z.string(),                                           // required when isVendor — BR-08
    }),
  })

  .superRefine((data, ctx) => {
    // ── BR-01 ──
    if (!data.isCustomer && !data.isVendor) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        message: 'At least one party type (Customer or Vendor) must be selected.',
        path:    ['partyType'],
      })
    }

    if (data.isCustomer) {
      if (!data.customerProfile.riskLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Risk level is required.',
          path: ['customerProfile', 'riskLevel'],
        })
      }
      // BR-07
      if (!data.customerProfile.receivableAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Receivable account is required.',
          path: ['customerProfile', 'receivableAccountId'],
        })
      }
      // BR-09
      if (data.customerProfile.creditLimit?.trim()) {
        const parsed = Number(data.customerProfile.creditLimit)
        if (Number.isNaN(parsed) || parsed < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Credit limit must be greater than or equal to zero.',
            path: ['customerProfile', 'creditLimit'],
          })
        }
      }
    }

    if (data.isVendor) {
      if (!data.vendorProfile.paymentTerms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Payment terms are required.',
          path: ['vendorProfile', 'paymentTerms'],
        })
      }
      // BR-08
      if (!data.vendorProfile.payableAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Payable account is required.',
          path: ['vendorProfile', 'payableAccountId'],
        })
      }
    }
  })

export type CreatePartyFormValues = z.infer<typeof createPartySchema>


// ─── Update Party Schema (US-02) ───────────────────────────────────────────────

/**
 * Update schema for company-party edits. TIN remains immutable, while
 * customer/vendor profile fields are required whenever the matching role
 * is selected so a newly added role has usable profile and GL data.
 */
export const updatePartySchema = z
  .object({
    partyName:   partyNameSchema,
    contactName: contactNameSchema,
    phone:       phoneSchema,
    email:       emailSchema,
    address:     addressSchema,
    isCustomer:  z.boolean(),
    isVendor:    z.boolean(),
    isActive:    z.boolean(),
    customerProfile: z.object({
      creditLimit:         z.string().optional(),
      paymentTerms:        z.union([z.nativeEnum(PaymentTerms), z.literal('')]).optional(),
      riskLevel:           z.union([z.nativeEnum(RiskLevel), z.literal('')]),
      usesWithholdingTax:  z.boolean(),
      receivableAccountId: z.string(),
    }),
    vendorProfile: z.object({
      serviceDescription: z.string().optional(),
      usesWithholdingTax: z.boolean(),
      paymentTerms:       z.union([z.nativeEnum(PaymentTerms), z.literal('')]),
      payableAccountId:   z.string(),
    }),
  })
  .superRefine((data, ctx) => {
    // Reference: US-02 Validation Rules "At least one role must remain selected"
    if (!data.isCustomer && !data.isVendor) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        message: 'At least one role (Vendor or Customer) must be selected.',
        path:    ['partyType'],
      })
    }

    if (data.isCustomer) {
      if (!data.customerProfile.riskLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Risk level is required.',
          path: ['customerProfile', 'riskLevel'],
        })
      }
      if (!data.customerProfile.receivableAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Receivable account is required.',
          path: ['customerProfile', 'receivableAccountId'],
        })
      }
      if (data.customerProfile.creditLimit?.trim()) {
        const parsed = Number(data.customerProfile.creditLimit)
        if (Number.isNaN(parsed) || parsed < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Credit limit must be greater than or equal to zero.',
            path: ['customerProfile', 'creditLimit'],
          })
        }
      }
    }

    if (data.isVendor) {
      if (!data.vendorProfile.paymentTerms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Payment terms are required.',
          path: ['vendorProfile', 'paymentTerms'],
        })
      }
      if (!data.vendorProfile.payableAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom, message: 'Payable account is required.',
          path: ['vendorProfile', 'payableAccountId'],
        })
      }
    }
  })

export type UpdatePartyFormValues = z.infer<typeof updatePartySchema>
