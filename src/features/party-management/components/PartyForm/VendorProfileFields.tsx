// src/features/party-management/components/PartyForm/VendorProfileFields.tsx
//
// Section 4 — Vendor Profile fields for the Create Party form.
// Rendered only when the Vendor party type checkbox is checked.
//
// Reference: US-01 Section 4 — Vendor Profile field table
//   Service Description  — Text Area, optional
//   Uses Withholding Tax — Radio Button, optional, Yes/No
//   Payment Terms        — Dropdown, REQUIRED
//   Payable Account      — Dropdown, REQUIRED GL account (BR-08)
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useFormContext } from 'react-hook-form'
import { Building2, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PaymentTerms } from '@/types/party.types'
import { MOCK_PAYABLE_ACCOUNTS } from '@/lib/api/party.mock'

import type { CreatePartyFormValues, UpdatePartyFormValues } from '@/lib/validations/party.schema'


const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string }[] = [
  { value: PaymentTerms.CASH,            label: 'Cash'            },
  { value: PaymentTerms.DAYS_30,         label: 'Net 30 days'     },
  { value: PaymentTerms.DAYS_60,         label: 'Net 60 days'     },
  { value: PaymentTerms.ADVANCE_PAYMENT, label: 'Advance payment' },
]


function FormField({
  id, label, required, error, hint, children,
}: {
  id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
          {required && <span className="ml-0.5 text-zinc-900">*</span>}
        </span>
        {hint && <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{hint}</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (hasError?: boolean) => cn(
  'h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900',
  'placeholder:text-zinc-500 transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-offset-0',
  'dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400',
  hasError
    ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20 dark:border-red-800'
    : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-500/15 dark:border-zinc-700 dark:focus:border-zinc-500',
)


export function VendorProfileFields() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreatePartyFormValues | UpdatePartyFormValues>()

  const usesWithholdingTax = watch('vendorProfile.usesWithholdingTax')
  const fieldErrors        = errors.vendorProfile

  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">

      <div className="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
          <Building2 className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vendor profile</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Payable, tax, and terms defaults for procurement posting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 p-5 sm:grid-cols-2">

        {/* Payment Terms — REQUIRED */}
        <FormField id="vendor-payment-terms" label="Payment terms" required error={fieldErrors?.paymentTerms?.message}>
          <select
            id="vendor-payment-terms"
            {...register('vendorProfile.paymentTerms')}
            className={cn(inputCls(!!fieldErrors?.paymentTerms), 'cursor-pointer')}
          >
            <option value="">Select payment terms…</option>
            {PAYMENT_TERMS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Payable Account — REQUIRED, BR-08 */}
        <FormField id="vendor-payable-account" label="Payable account" required error={fieldErrors?.payableAccountId?.message}>
          <select
            id="vendor-payable-account"
            {...register('vendorProfile.payableAccountId')}
            className={cn(inputCls(!!fieldErrors?.payableAccountId), 'cursor-pointer')}
          >
            <option value="">Select GL account…</option>
            {MOCK_PAYABLE_ACCOUNTS.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} — {acc.name}</option>
            ))}
          </select>
        </FormField>

        {/* Uses Withholding Tax */}
        <FormField id="vendor-withholding-tax" label="Uses withholding tax" hint="optional">
          <div id="vendor-withholding-tax" className="flex gap-1.5" role="group" aria-label="Vendor withholding tax">
            {([{ label: 'Yes', value: true }, { label: 'No', value: false }] as const).map(opt => {
              const selected = usesWithholdingTax === opt.value
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setValue('vendorProfile.usesWithholdingTax', opt.value, { shouldValidate: true })}
                  aria-pressed={selected}
                  className={cn(
                    'min-h-11 flex-1 rounded-lg border px-3 text-xs font-medium transition-all',
                    selected
                      ? 'border-zinc-900 bg-white text-zinc-950 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </FormField>

        {/* Service Description — full width, free text */}
        <div className="sm:col-span-2">
          <FormField id="vendor-service-description" label="Service description" hint="optional">
            <textarea
              id="vendor-service-description"
              rows={3}
              placeholder="Describe the goods or services this vendor provides..."
              {...register('vendorProfile.serviceDescription')}
              className={cn(inputCls(), 'h-auto min-h-28 resize-none py-2')}
            />
          </FormField>
        </div>
      </div>
    </section>
  )
}
