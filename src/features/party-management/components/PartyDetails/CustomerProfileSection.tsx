import { ShoppingCart, FileWarning } from 'lucide-react'

import { cn } from '@/lib/utils'
import { RiskLevel, PaymentTerms } from '@/types/party.types'
import type { CompanyParty } from '@/types/party.types'

const CURRENCY = 'ETB'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency', currency: CURRENCY, minimumFractionDigits: 2,
  }).format(amount)
}

function formatPaymentTerms(terms: PaymentTerms): string {
  const labels: Record<PaymentTerms, string> = {
    [PaymentTerms.CASH]:            'Cash',
    [PaymentTerms.DAYS_30]:         'Net 30 days',
    [PaymentTerms.DAYS_60]:         'Net 60 days',
    [PaymentTerms.ADVANCE_PAYMENT]: 'Advance payment',
  }
  return labels[terms]
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config: Record<RiskLevel, { label: string; cls: string }> = {
    [RiskLevel.LOW]: {
      label: 'Low risk',
      cls:   'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    },
    [RiskLevel.MEDIUM]: {
      label: 'Medium risk',
      cls:   'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    },
    [RiskLevel.HIGH]: {
      label: 'High risk',
      cls:   'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
    },
  }
  const { label, cls } = config[level]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', cls)}>
      {label}
    </span>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{children}</div>
    </div>
  )
}

function EmptyProfile() {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <FileWarning className="h-4 w-4 text-zinc-400" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No customer profile configured.</p>
    </div>
  )
}

interface CustomerProfileSectionProps {
  party: CompanyParty
}

export function CustomerProfileSection({ party }: CustomerProfileSectionProps) {
  const profile = party.customerProfile

  return (
    <section className="rounded-xl bg-white shadow-elevation dark:bg-zinc-950">
      <div className="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex size-7 items-center justify-center rounded-md bg-sky-50 dark:bg-sky-500/10">
          <ShoppingCart className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" strokeWidth={2} aria-hidden />
        </div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Customer profile</h2>
      </div>

      {!profile ? (
        <EmptyProfile />
      ) : (
        <div className="space-y-5 px-5 py-5">
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3.5 py-2.5 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-white/5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Customer status</span>
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
              profile.status
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                : 'bg-zinc-100 text-zinc-500 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700',
            )}>
              {profile.status ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label="Credit limit">
              {profile.creditLimit !== null
                ? <span className="font-medium tabular-nums">{formatCurrency(profile.creditLimit)}</span>
                : <span className="text-zinc-300 dark:text-zinc-600">Not set</span>}
            </Stat>

            <Stat label="Risk level">
              <RiskBadge level={profile.riskLevel} />
            </Stat>

            <Stat label="Payment terms">
              {profile.paymentTerms
                ? formatPaymentTerms(profile.paymentTerms)
                : <span className="text-zinc-300 dark:text-zinc-600">Not set</span>}
            </Stat>

            <Stat label="Withholding tax">
              <span className={cn(
                'inline-flex items-center gap-1.5',
                profile.usesWithholdingTax ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500',
              )}>
                <span className={cn('h-1.5 w-1.5 rounded-full', profile.usesWithholdingTax ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600')} />
                {profile.usesWithholdingTax ? 'Yes' : 'No'}
              </span>
            </Stat>
          </div>
        </div>
      )}
    </section>
  )
}
