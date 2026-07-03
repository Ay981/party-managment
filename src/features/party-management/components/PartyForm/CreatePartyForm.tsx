'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingCart, Building2, AlertCircle, ArrowLeft, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useCreateParty } from '../../hooks/useCreateParty'
import { useAuthStore, selectCompanyId } from '@/store/auth.store'
import { createPartySchema, type CreatePartyFormValues } from '@/lib/validations/party.schema'
import { CustomerProfileFields } from './CustomerProfileFields'
import { VendorProfileFields }   from './VendorProfileFields'

import type { CreatePartyPayload, PaymentTerms, RiskLevel } from '@/types/party.types'

const DEFAULT_VALUES: CreatePartyFormValues = {
  partyName: '', contactName: '', tin: '', phone: '', email: '', address: '',
  isCustomer: false, isVendor: false,
  customerProfile: {
    creditLimit: '', paymentTerms: '', riskLevel: '',
    usesWithholdingTax: false, receivableAccountId: '',
  },
  vendorProfile: {
    serviceDescription: '', usesWithholdingTax: false,
    paymentTerms: '', payableAccountId: '',
  },
}


function FormField({
  id, label, required, error, hint, children,
}: {
  id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}{required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
          {required && <span className="sr-only">(required)</span>}
        </span>
        {hint && <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{hint}</span>}
      </label>
      <div className="mt-1.5" data-error-id={errorId}>{children}</div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (hasError?: boolean) => cn(
  'h-10 w-full rounded-lg border bg-zinc-50 px-3 text-sm text-zinc-900',
  'placeholder:text-zinc-400 transition-[border-color,background-color,box-shadow] duration-150',
  'focus:bg-white focus:outline-none focus:ring-2 focus:ring-offset-0',
  'dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800',
  hasError
    ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20 dark:border-red-800'
    : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-500/15 dark:border-zinc-700 dark:focus:border-zinc-500',
)

export function CreatePartyForm() {
  const router    = useRouter()
  const companyId = useAuthStore(selectCompanyId) ?? ''

  const form = useForm<CreatePartyFormValues>({
    resolver:      zodResolver(createPartySchema),
    defaultValues: DEFAULT_VALUES,
    mode:          'onBlur',
  })

  const {
    register, handleSubmit, watch, setValue, setError,
    formState: { errors, isSubmitting },
  } = form

  const isCustomer = watch('isCustomer')
  const isVendor   = watch('isVendor')

  const createMutation = useCreateParty(companyId)

  // Show backend errors inline.
  useEffect(() => {
    if (createMutation.error?.code === 'DUPLICATE_TIN') {
      setError('tin', { message: createMutation.error.message })
    }
    if (createMutation.error?.errors) {
      Object.entries(createMutation.error.errors).forEach(([field, messages]) => {
        setError(field as keyof CreatePartyFormValues, { message: messages[0] })
      })
    }
  }, [createMutation.error, setError])

  const onSubmit = (values: CreatePartyFormValues) => {
    const payload: CreatePartyPayload = {
      partyName:   values.partyName,
      contactName: values.contactName || undefined,
      tin:         values.tin,
      phone:       values.phone || undefined,
      email:       values.email || undefined,
      address:     values.address || undefined,
      isCustomer:  values.isCustomer,
      isVendor:    values.isVendor,
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
    createMutation.mutate(payload)
  }

  const partyTypeError = (errors as Record<string, { message?: string }>).partyType?.message
  const isPending      = isSubmitting || createMutation.isPending

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 pb-28">

        <button
          type="button"
          onClick={() => router.push('/parties')}
          className="inline-flex h-9 items-center gap-1 text-xs font-medium text-zinc-500 transition-[color,transform] duration-150 active:scale-[0.97] hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to parties
        </button>

        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create party</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Register a new customer, vendor, or dual-role party
          </p>
        </div>

        <section className="rounded-xl bg-white p-5 shadow-elevation dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Party type</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Select the transaction roles this master record can use.</p>

          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setValue('isCustomer', !isCustomer, { shouldValidate: true })}
              aria-pressed={isCustomer}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3.5 text-left',
                'transition-[background-color] duration-150',
                isCustomer
                  ? 'bg-sky-50 dark:bg-sky-500/10'
                  : 'bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900/60',
              )}
            >
              <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150',
                isCustomer ? 'bg-sky-500 text-white' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500',
              )}>
                <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium leading-tight', isCustomer ? 'text-sky-700 dark:text-sky-300' : 'text-zinc-800 dark:text-zinc-200')}>
                  Customer
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Buys from your company</p>
              </div>
              <div className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                isCustomer ? 'bg-sky-500 text-white' : 'border border-zinc-300 dark:border-zinc-600',
              )}>
                {isCustomer && <Check className="h-3 w-3" strokeWidth={3} />}
              </div>
            </button>

            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            <button
              type="button"
              onClick={() => setValue('isVendor', !isVendor, { shouldValidate: true })}
              aria-pressed={isVendor}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3.5 text-left',
                'transition-[background-color] duration-150',
                isVendor
                  ? 'bg-zinc-900/5 dark:bg-zinc-100/5'
                  : 'bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900/60',
              )}
            >
              <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150',
                isVendor ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500',
              )}>
                <Building2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium leading-tight', isVendor ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-800 dark:text-zinc-200')}>
                  Vendor
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Sells to your company</p>
              </div>
              <div className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                isVendor ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'border border-zinc-300 dark:border-zinc-600',
              )}>
                {isVendor && <Check className="h-3 w-3" strokeWidth={3} />}
              </div>
            </button>
          </div>

          {partyTypeError && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {partyTypeError}
            </p>
          )}
          {(isCustomer || isVendor) && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" strokeWidth={2} aria-hidden />
              <p>
                {isCustomer && isVendor
                  ? 'Dual-role parties require both customer receivable settings and vendor payable settings before transactions can post.'
                  : isCustomer
                    ? 'Customer parties require risk level and receivable GL account before sales transactions can post.'
                    : 'Vendor parties require payment terms and payable GL account before procurement transactions can post.'}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-elevation dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Party information</h2>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Master record details — visible across all companies</p>

          <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <FormField id="party-name" label="Party name" required error={errors.partyName?.message}>
              <input id="party-name" type="text" placeholder="e.g. Addis Trading Co." {...register('partyName')} className={inputCls(!!errors.partyName)} />
            </FormField>

            <FormField id="contact-name" label="Contact name" hint="optional" error={errors.contactName?.message}>
              <input id="contact-name" type="text" placeholder="e.g. Aymen Abdulber" {...register('contactName')} className={inputCls(!!errors.contactName)} />
            </FormField>

            <FormField id="tin" label="TIN" required hint="10 digits" error={errors.tin?.message}>
              <input
                id="tin"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="1234567890"
                {...register('tin')}
                className={cn(inputCls(!!errors.tin), 'font-mono')}
              />
            </FormField>

            <FormField id="phone" label="Phone" hint="optional" error={errors.phone?.message}>
              <input id="phone" type="tel" placeholder="+251 9XX XXX XXX" {...register('phone')} className={inputCls(!!errors.phone)} />
            </FormField>

            <FormField id="email" label="Email" hint="optional" error={errors.email?.message}>
              <input id="email" type="email" placeholder="contact@company.com" {...register('email')} className={inputCls(!!errors.email)} />
            </FormField>

            <div className="sm:col-span-2">
              <FormField id="address" label="Address" hint="optional">
                <textarea id="address" rows={2} placeholder="Street, city, region..." {...register('address')} className={cn(inputCls(), 'h-auto min-h-24 resize-none py-2')} />
              </FormField>
            </div>
          </div>
        </section>

        {isCustomer && <CustomerProfileFields />}

        {isVendor && <VendorProfileFields />}

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Fields marked <span className="font-semibold text-zinc-900 dark:text-zinc-100">*</span> are required. GL and tax fields control downstream posting defaults.
            </p>
            <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
              <button
                type="button"
                onClick={() => router.push('/parties')}
                disabled={isPending}
                className={cn(
                  'inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium',
                  'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  'transition-[background-color,transform] duration-150 active:scale-[0.97]',
                  'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending}
                className={cn(
                  'inline-flex h-9 min-w-[120px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white',
                  'bg-zinc-950 hover:bg-zinc-800 active:scale-[0.97]',
                  'transition-[background-color,transform] duration-150',
                  'dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:active:bg-zinc-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                {createMutation.isPending ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating…
                  </>
                ) : 'Create party'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
