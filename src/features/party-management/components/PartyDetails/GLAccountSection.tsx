// src/features/party-management/components/PartyDetails/GLAccountSection.tsx
//
// Section 6 — GL Account Assignments
// Displays the General Ledger accounts linked to this party.
//
// Reference: US-04 Section Field Reference → "Section 6 — GL Account Assignments"
//   Receivable Account → visible when isCustomer = true
//   Payable Account    → visible when isVendor = true
//
// Reference: US-04 Error Handling "No GL Accounts: No GL accounts assigned."
// Reference: US-04 AC-09 "GL Account Assignment information displayed when available"
// Reference: Appendix C Glossary "GL Account"
// ─────────────────────────────────────────────────────────────────────────────

import { Landmark, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CompanyParty, GLAccount } from '@/types/party.types'


// ─── Account Row ──────────────────────────────────────────────────────────────

function AccountRow({
  label,
  account,
  direction,
  accent,
}: {
  label:     string
  account:   GLAccount
  direction: 'in' | 'out'
  accent:    'sky' | 'neutral'
}) {
  const Icon = direction === 'in' ? ArrowDownLeft : ArrowUpRight

  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-zinc-100 px-4 py-3.5 dark:border-zinc-800">
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        accent === 'sky' ? 'bg-sky-50 dark:bg-sky-500/10' : 'bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700',
      )}>
        <Icon
          className={cn('h-4 w-4', accent === 'sky' ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-700 dark:text-zinc-300')}
          strokeWidth={2}
          aria-hidden
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{account.name}</p>
      </div>

      <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {account.code}
      </span>
    </div>
  )
}


// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyAccounts() {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Landmark className="h-4 w-4 text-zinc-400" strokeWidth={1.75} aria-hidden />
      </div>
      {/* Reference: US-04 Error Handling "No GL accounts assigned." */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No GL accounts assigned.</p>
    </div>
  )
}


// ─── Component ────────────────────────────────────────────────────────────────

interface GLAccountSectionProps {
  party: CompanyParty
}

export function GLAccountSection({ party }: GLAccountSectionProps) {
  // Reference: US-04 Section 6 "Visible When" conditions
  const receivableAccount = party.isCustomer ? party.customerProfile?.receivableAccount : undefined
  const payableAccount    = party.isVendor   ? party.vendorProfile?.payableAccount      : undefined

  const hasAnyAccount = !!receivableAccount || !!payableAccount

  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
          <Landmark className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">GL account assignments</h2>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Accounts used for financial postings</p>
        </div>
      </div>

      {/* Reference: US-04 AC-09 vs Error Handling empty state */}
      {!hasAnyAccount ? (
        <EmptyAccounts />
      ) : (
        <div className="space-y-2.5 px-5 py-5">
          {receivableAccount && (
            <AccountRow label="Receivable account" account={receivableAccount} direction="in"  accent="sky" />
          )}
          {payableAccount && (
            <AccountRow label="Payable account"    account={payableAccount}    direction="out" accent="neutral" />
          )}
        </div>
      )}
    </section>
  )
}
