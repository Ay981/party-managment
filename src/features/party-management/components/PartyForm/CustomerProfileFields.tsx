// src/features/party-management/components/PartyForm/CustomerProfileFields.tsx
//
// Section 3 — Customer Profile fields for the Create Party form.
// Rendered only when the Customer party type checkbox is checked.
//
// Reference: US-01 Section 3 — Customer Profile field table
//   Credit Limit         — Currency Input, optional, >= 0 (BR-09)
//   Payment Terms        — Dropdown, optional
//   Risk Level           — Dropdown, REQUIRED
//   Uses Withholding Tax — Radio Button, optional, Yes/No
//   Receivable Account   — Dropdown, REQUIRED GL account (BR-07)
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useFormContext } from 'react-hook-form'
import { ShoppingCart, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PaymentTerms, RiskLevel } from '@/types/party.types'
import { MOCK_RECEIVABLE_ACCOUNTS } from '@/lib/api/party.mock'

import type { CreatePartyFormValues } from '@/lib/validations/party.schema'


// ─── Option Lists ─────────────────────────────────────────────────────────────

const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string }[] = [
  { value: PaymentTerms.CASH,            label: 'Cash'            },
  { value: PaymentTerms.DAYS_30,         label: 'Net 30 days'     },
  { value: PaymentTerms.DAYS_60,         label: 'Net 60 days'     },
  { value: PaymentTerms.ADVANCE_PAYMENT, label: 'Advance payment' },
]

const RISK_LEVEL_OPTIONS: { value: RiskLevel; label: string; dot: string }[] = [
  { value: RiskLevel.LOW,    label: 'Low',    dot: 'bg-emerald-500' },
  { value: RiskLevel.MEDIUM, label: 'Medium', dot: 'bg-amber-500'   },
  { value: RiskLevel.HIGH,   label: 'High',   dot: 'bg-red-500'     },
]


// ─── Local Field Wrapper ───────────────────────────────────────────────────────

function FormField({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
          {required && <span className="ml-0.5 text-sky-500">*</span>}
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
  'h-9 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900',
  'placeholder:text-zinc-300 transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-offset-0',
  'dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600',
  hasError
    ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20 dark:border-red-800'
    : 'border-zinc-200 focus:border-sky-400 focus:ring-sky-500/20 dark:border-zinc-700 dark:focus:border-sky-600',
)


// ─── Component ────────────────────────────────────────────────────────────────

export function CustomerProfileFields() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreatePartyFormValues>()

  const usesWithholdingTax = watch('customerProfile.usesWithholdingTax')
  const riskLevel          = watch('customerProfile.riskLevel')
  const fieldErrors        = errors.customerProfile

  return (
    <section className="rounded-xl border border-sky-200/70 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-500/[0.03]">

      <div className="flex items-center gap-2.5 border-b border-sky-200/70 px-5 py-3.5 dark:border-sky-900/40">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 dark:bg-sky-500/15">
          <ShoppingCart className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Customer profile</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Financial details for transacting as a customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 p-5 sm:grid-cols-2">

        {/* Credit Limit — BR-09 */}
        <FormField label="Credit limit" hint="optional · ETB" error={fieldErrors?.creditLimit?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
              ETB
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              {...register('customerProfile.creditLimit')}
              className={cn(inputCls(!!fieldErrors?.creditLimit), 'pl-11')}
            />
          </div>
        </FormField>

        {/* Payment Terms — optional */}
        <FormField label="Payment terms" hint="optional">
          <select
            {...register('customerProfile.paymentTerms')}
            className={cn(inputCls(), 'cursor-pointer')}
          >
            <option value="">Select payment terms…</option>
            {PAYMENT_TERMS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Risk Level — REQUIRED */}
        <FormField label="Risk level" required error={fieldErrors?.riskLevel?.message}>
          <div className="flex gap-1.5">
            {RISK_LEVEL_OPTIONS.map(opt => {
              const selected = riskLevel === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('customerProfile.riskLevel', opt.value, { shouldValidate: true })}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all',
                    selected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', opt.dot)} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </FormField>

        {/* Receivable Account — REQUIRED, BR-07 */}
        <FormField label="Receivable account" required error={fieldErrors?.receivableAccountId?.message}>
          <select
            {...register('customerProfile.receivableAccountId')}
            className={cn(inputCls(!!fieldErrors?.receivableAccountId), 'cursor-pointer')}
          >
            <option value="">Select GL account…</option>
            {MOCK_RECEIVABLE_ACCOUNTS.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} — {acc.name}</option>
            ))}
          </select>
        </FormField>

        {/* Uses Withholding Tax */}
        <FormField label="Uses withholding tax" hint="optional">
          <div className="flex gap-1.5">
            {([{ label: 'Yes', value: true }, { label: 'No', value: false }] as const).map(opt => {
              const selected = usesWithholdingTax === opt.value
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setValue('customerProfile.usesWithholdingTax', opt.value, { shouldValidate: true })}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                    selected
                      ? 'border-sky-400 bg-sky-100 text-sky-700 dark:border-sky-600 dark:bg-sky-500/15 dark:text-sky-400'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </FormField>
      </div>
    </section>
  )
}
