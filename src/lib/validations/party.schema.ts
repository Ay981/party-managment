import { z } from 'zod'
import { PaymentTerms, RiskLevel } from '@/types/party.types'

const partyNameSchema = z
  .string()
  .trim()
  .min(1, 'Party name is required.')
  .max(255, 'Party name must be 255 characters or fewer.')

const contactNameSchema = z
  .string()
  .trim()
  .max(255, 'Contact name must be 255 characters or fewer.')
  .optional()
  .or(z.literal(''))

const phoneSchema = z
  .string()
  .trim()
  .max(50, 'Phone must be 50 characters or fewer.')
  .optional()
  .or(z.literal(''))

const emailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address.')
  .optional()
  .or(z.literal(''))

const addressSchema = z.string().trim().optional().or(z.literal(''))

const tinSchema = z
  .string()
  .trim()
  .min(1, 'TIN is required.')
  .regex(/^\d{10}$/, 'TIN must contain exactly 10 digits.')

const paymentTermsSchema = z.union([z.nativeEnum(PaymentTerms), z.literal('')])
const riskLevelSchema = z.union([z.nativeEnum(RiskLevel), z.literal('')])

// Profiles always exist in form state; required fields are conditional by role.
export const createPartySchema = z
  .object({
    partyName:   partyNameSchema,
    contactName: contactNameSchema,
    tin:         tinSchema,
    phone:       phoneSchema,
    email:       emailSchema,
    address:     addressSchema,

    isCustomer: z.boolean(),
    isVendor:   z.boolean(),

    customerProfile: z.object({
      creditLimit:         z.string().optional(),
      paymentTerms:        paymentTermsSchema.optional(),
      riskLevel:           riskLevelSchema,
      usesWithholdingTax:  z.boolean(),
      receivableAccountId: z.string(),
    }),

    vendorProfile: z.object({
      serviceDescription: z.string().optional(),
      usesWithholdingTax: z.boolean(),
      paymentTerms:       paymentTermsSchema,
      payableAccountId:   z.string(),
    }),
  })
  .superRefine((data, ctx) => {
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

export type CreatePartyFormValues = z.infer<typeof createPartySchema>

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
      paymentTerms:        paymentTermsSchema.optional(),
      riskLevel:           riskLevelSchema,
      usesWithholdingTax:  z.boolean(),
      receivableAccountId: z.string(),
    }),
    vendorProfile: z.object({
      serviceDescription: z.string().optional(),
      usesWithholdingTax: z.boolean(),
      paymentTerms:       paymentTermsSchema,
      payableAccountId:   z.string(),
    }),
  })
  .superRefine((data, ctx) => {
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
