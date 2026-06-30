// src/features/party-management/components/PartyForm/UpdatePartyForm.tsx
//
// Root component for the Edit Company Party screen.
// Covers US-02: Update Company Party Information
//
// Scope: partyName, contactName, phone, email, address, roles, status,
// and role profile fields when Customer/Vendor roles are selected. TIN is immutable.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, AlertCircle, ShoppingCart, Building2, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { usePartyDetails } from '../../hooks/usePartyDetails'
import { useUpdateParty }  from '../../hooks/useUpdateParty'
import { useAuthStore, selectCompanyId } from '@/store/auth.store'
import { updatePartySchema, type UpdatePartyFormValues } from '@/lib/validations/party.schema'
import { CustomerProfileFields } from './CustomerProfileFields'
import { VendorProfileFields } from './VendorProfileFields'

import type { PaymentTerms, RiskLevel, UpdatePartyPayload } from '@/types/party.types'


// ─── Local Field Wrapper ──────────────────────────────────────────────────────

function FormField({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}{required && <span className="ml-0.5 text-zinc-900">*</span>}
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
    : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-500/15 dark:border-zinc-700 dark:focus:border-zinc-500',
)


// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="h-4 w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-7 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-64 animate-pulse rounded-xl bg-zinc-50 dark:bg-zinc-900" />
    </div>
  )
}


// ─── Component ────────────────────────────────────────────────────────────────

interface UpdatePartyFormProps {
  partyId: string
}

export function UpdatePartyForm({ partyId }: UpdatePartyFormProps) {
  const router    = useRouter()
  const companyId = useAuthStore(selectCompanyId) ?? ''

  const { data: party, isLoading } = usePartyDetails(companyId, partyId)

  const form = useForm<UpdatePartyFormValues>({
    resolver:      zodResolver(updatePartySchema),
    defaultValues: {
      partyName: '', contactName: '', phone: '', email: '', address: '',
      isCustomer: false, isVendor: false, isActive: true,
      customerProfile: {
        creditLimit: '', paymentTerms: '', riskLevel: '',
        usesWithholdingTax: false, receivableAccountId: '',
      },
      vendorProfile: {
        serviceDescription: '', usesWithholdingTax: false,
        paymentTerms: '', payableAccountId: '',
      },
    },
  })

  const {
    register, handleSubmit, watch, setValue, setError, reset,
    formState: { errors, isSubmitting, isDirty },
  } = form

  // Pre-populate once party data loads — US-02 User Flow step 4, AC-01
  useEffect(() => {
    if (party) {
      reset({
        partyName:   party.partyName,
        contactName: party.contactName ?? '',
        phone:       party.phone ?? '',
        email:       party.email ?? '',
        address:     party.address ?? '',
        isCustomer:  party.isCustomer,
        isVendor:    party.isVendor,
        isActive:    party.isActive,
        customerProfile: {
          creditLimit: party.customerProfile?.creditLimit != null
            ? String(party.customerProfile.creditLimit)
            : '',
          paymentTerms: party.customerProfile?.paymentTerms ?? '',
          riskLevel: party.customerProfile?.riskLevel ?? '',
          usesWithholdingTax: party.customerProfile?.usesWithholdingTax ?? false,
          receivableAccountId: party.customerProfile?.receivableAccount.id ?? '',
        },
        vendorProfile: {
          serviceDescription: party.vendorProfile?.serviceDescription ?? '',
          usesWithholdingTax: party.vendorProfile?.usesWithholdingTax ?? false,
          paymentTerms: party.vendorProfile?.paymentTerms ?? '',
          payableAccountId: party.vendorProfile?.payableAccount.id ?? '',
        },
      })
    }
  }, [party, reset])

  const isCustomer = watch('isCustomer')
  const isVendor   = watch('isVendor')
  const isActive   = watch('isActive')

  const updateMutation = useUpdateParty(companyId)

  // Reference: US-02 AC-08 "API errors display returned message while preserving entered values"
  useEffect(() => {
    if (updateMutation.error?.errors) {
      Object.entries(updateMutation.error.errors).forEach(([field, messages]) => {
        setError(field as keyof UpdatePartyFormValues, { message: messages[0] })
      })
    }
  }, [updateMutation.error, setError])

  const onSubmit = (values: UpdatePartyFormValues) => {
    const payload: UpdatePartyPayload = {
      partyName:   values.partyName,
      contactName: values.contactName || undefined,
      phone:       values.phone || undefined,
      email:       values.email || undefined,
      address:     values.address || undefined,
      isCustomer:  values.isCustomer,
      isVendor:    values.isVendor,
      isActive:    values.isActive,
      customerProfile: values.isCustomer ? {
        creditLimit:         values.customerProfile.creditLimit ? Number(values.customerProfile.creditLimit) : undefined,
        paymentTerms:        (values.customerProfile.paymentTerms || undefined) as PaymentTerms | undefined,
        riskLevel:           values.customerProfile.riskLevel as RiskLevel,
        usesWithholdingTax:  values.customerProfile.usesWithholdingTax,
        receivableAccountId: values.customerProfile.receivableAccountId,
      } : undefined,
      vendorProfile: values.isVendor ? {
        serviceDescription: values.vendorProfile.serviceDescription || undefined,
        usesWithholdingTax: values.vendorProfile.usesWithholdingTax,
        paymentTerms:       values.vendorProfile.paymentTerms as PaymentTerms,
        payableAccountId:   values.vendorProfile.payableAccountId,
      } : undefined,
    }
    updateMutation.mutate(
      { companyPartyId: partyId, payload },
      { onSuccess: () => router.push(`/parties/${partyId}`) },
    )
  }

  if (isLoading || !party) return <FormSkeleton />

  const partyTypeError = (errors as Record<string, { message?: string }>).partyType?.message
  const isPending      = isSubmitting || updateMutation.isPending

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 pb-28">

      <button
        type="button"
        onClick={() => router.push(`/parties/${partyId}`)}
        className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to details
      </button>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Edit company party</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {party.partyCode} · Updates apply to this company only
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          This updates this company party record only. When you add a Customer or Vendor
          role, complete the matching profile fields before saving.
        </p>
      </div>

      {/* Contact information */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Contact information</h2>

        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <FormField label="Party name" required error={errors.partyName?.message}>
            <input type="text" {...register('partyName')} className={inputCls(!!errors.partyName)} />
          </FormField>

          <FormField label="Contact name" hint="optional" error={errors.contactName?.message}>
            <input type="text" {...register('contactName')} className={inputCls(!!errors.contactName)} />
          </FormField>

          {/* TIN — read-only, immutable per Appendix C */}
          <FormField label="TIN" hint="immutable">
            <input
              type="text"
              value={party.tin}
              disabled
              className={cn(inputCls(), 'cursor-not-allowed bg-zinc-50 font-mono text-zinc-400 dark:bg-zinc-900')}
            />
          </FormField>

          <FormField label="Phone" hint="optional" error={errors.phone?.message}>
            <input type="tel" {...register('phone')} className={inputCls(!!errors.phone)} />
          </FormField>

          <FormField label="Email" hint="optional" error={errors.email?.message}>
            <input type="email" {...register('email')} className={inputCls(!!errors.email)} />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Address" hint="optional">
              <textarea rows={2} {...register('address')} className={cn(inputCls(), 'h-auto resize-none py-2')} />
            </FormField>
          </div>
        </div>
      </section>

      {/* Roles & status */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Roles & status</h2>
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">At least one role must remain selected</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setValue('isCustomer', !isCustomer, { shouldValidate: true, shouldDirty: true })}
            className={cn(
              'relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
              isCustomer
                ? 'border-sky-400 bg-sky-50 dark:border-sky-600 dark:bg-sky-500/10'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900',
            )}
          >
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', isCustomer ? 'bg-sky-500 text-zinc-900 dark:text-zinc-100' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800')}>
              <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Customer</p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Buys from your company</p>
            </div>
            {isCustomer && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500">
                <Check className="h-3 w-3 text-zinc-900 dark:text-zinc-100" strokeWidth={3} />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setValue('isVendor', !isVendor, { shouldValidate: true, shouldDirty: true })}
            className={cn(
              'relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
              isVendor
                ? 'border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-950'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900',
            )}
          >
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', isVendor ? 'bg-white text-zinc-900 ring-1 ring-zinc-300 dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-700' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800')}>
              <Building2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vendor</p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Sells to your company</p>
            </div>
            {isVendor && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-zinc-300 dark:bg-zinc-950 dark:ring-zinc-700">
                <Check className="h-3 w-3 text-zinc-900 dark:text-zinc-100" strokeWidth={3} />
              </span>
            )}
          </button>
        </div>

        {partyTypeError && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {partyTypeError}
          </p>
        )}

        {/* Active Status toggle */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Active status</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Inactive parties cannot be used in new transactions</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setValue('isActive', !isActive, { shouldDirty: true })}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
              isActive ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700',
            )}
          >
            <span className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
              isActive ? 'translate-x-[22px]' : 'translate-x-0.5',
            )} />
          </button>
        </div>
      </section>

      {isCustomer && <CustomerProfileFields />}

      {isVendor && <VendorProfileFields />}

      {/* ── Sticky action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {isDirty ? 'Unsaved changes' : 'No changes made'}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push(`/parties/${partyId}`)}
              disabled={isPending}
              className={cn(
                'inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium',
                'border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50',
                'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || !isDirty}
              className={cn(
                'inline-flex h-9 min-w-[130px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-zinc-950 shadow-sm',
                'bg-white hover:bg-zinc-50 active:bg-zinc-100 ring-1 ring-zinc-300 transition-colors dark:bg-white dark:text-zinc-950',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              {updateMutation.isPending ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
      </form>
    </FormProvider>
  )
}
