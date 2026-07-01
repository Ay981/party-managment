// src/features/party-management/components/PartyDetails/PartyInfoSection.tsx
//
// Section 1 — Party Information
// Read-only display of core party master fields.
//
// Reference: US-04 Section Field Reference → "Section 1 — Party Information"
// Fields: Party Code, Party Name, Contact Name, TIN, Phone, Email, Address
// All fields are read-only text per the FRD.
//
// Reference: US-04 AC-02 "Party Code, Name, Contact, TIN, Phone, Email, and
// Address are all displayed."
// ─────────────────────────────────────────────────────────────────────────────

import { Hash, Building2, User, Phone, Mail, MapPin, Landmark } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CompanyParty } from '@/types/party.types'


// ─── Field Row ────────────────────────────────────────────────────────────────

function Field({
  icon: Icon,
  label,
  value,
  mono = false,
  wide = false,
}: {
  icon:   typeof Hash
  label:  string
  value:  string | null
  mono?:  boolean
  wide?:  boolean
}) {
  return (
    <div className={cn('flex items-start gap-3 py-3', wide && 'sm:col-span-2')}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{label}</p>
        <p
          className={cn(
            'mt-0.5 text-sm text-zinc-900 dark:text-zinc-100',
            mono && 'font-mono text-[13px]',
            !value && 'text-zinc-300 dark:text-zinc-600',
          )}
        >
          {value || '—'}
        </p>
      </div>
    </div>
  )
}


// ─── Component ────────────────────────────────────────────────────────────────

interface PartyInfoSectionProps {
  party: CompanyParty
}

export function PartyInfoSection({ party }: PartyInfoSectionProps) {
  return (
    <section className="rounded-xl bg-white shadow-elevation dark:bg-zinc-950">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Party information</h2>
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Master record details for this party</p>
      </div>

      {/* Reference: US-04 Section 1 field list */}
      <div className="grid grid-cols-1 gap-x-6 divide-y divide-zinc-50 px-5 sm:grid-cols-2 sm:divide-y-0 dark:divide-zinc-900">
        <Field icon={Hash}      label="Party code"   value={party.partyCode}   mono />
        <Field icon={Building2} label="Party name"   value={party.partyName} />
        <Field icon={User}      label="Contact name" value={party.contactName} />
        <Field icon={Landmark}  label="TIN"          value={party.tin}         mono />
        <Field icon={Phone}     label="Phone"        value={party.phone} />
        <Field icon={Mail}      label="Email"        value={party.email} />
        <Field icon={MapPin}    label="Address"      value={party.address}     wide />
      </div>

      <div className="h-2" />
    </section>
  )
}
