'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  FilePenLine,
  Power,
  PowerOff,
  Trash2,
  ServerCrash,
  ShieldX,
  FileQuestion,
} from 'lucide-react'
import { format } from 'date-fns'

import { cn }              from '@/shared/utils'
import { usePartyDetails } from '../../hooks/usePartyDetails'
import { usePartyStore }   from '@/modules/party-management/store/party.store'
import { useAuthStore, selectCompanyId } from '@/shared/store/auth.store'
import { Permission }      from '@/shared/types/auth.types'

import { PartyStatusBadge }       from '../shared/PartyStatusBadge'
import { PartyRoleBadge }         from '../shared/PartyRoleBadge'
import { PartyInfoSection }       from './PartyInfoSection'
import { CustomerProfileSection } from './CustomerProfileSection'
import { VendorProfileSection }   from './VendorProfileSection'
import { GLAccountSection }       from './GLAccountSection'
import { StatusChangeModal }      from '../modals/StatusChangeModal'
import { DeletePartyModal }       from '../modals/DeletePartyModal'

import type { ApiError } from '@/modules/party-management/types'

function DetailsSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex items-start justify-between">
          <div className="space-y-2.5">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-6 w-56 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-zinc-50 dark:bg-zinc-900" />
      ))}
    </div>
  )
}

// Map known API codes to the matching empty/error state.
function DetailsError({ error }: { error: ApiError }) {
  const config =
    error.code === 'PARTY_NOT_FOUND'
      ? { Icon: FileQuestion, title: 'Party not found',      message: 'Party record not found.' }
      : error.code === 'FORBIDDEN'
      ? { Icon: ShieldX,      title: 'Access restricted',    message: 'You do not have permission to view this party.' }
      : { Icon: ServerCrash,  title: 'Something went wrong', message: 'Unable to load party details. Please try again.' }

  const { Icon } = config

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-6 w-6 text-zinc-400" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{config.title}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{config.message}</p>
      </div>
      <Link
        href="/parties"
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to parties
      </Link>
    </div>
  )
}

interface PartyDetailsProps {
  partyId: string
}

export function PartyDetails({ partyId }: PartyDetailsProps) {
  const companyId     = useAuthStore(selectCompanyId)
  const hasPermission = useAuthStore(s => s.hasPermission)
  const openModal     = usePartyStore(s => s.openModal)

  const { data: party, isLoading, isError, error } = usePartyDetails(companyId, partyId)

  if (isLoading) return <DetailsSkeleton />

  if (isError || !party) {
    return (
      <DetailsError
        error={error ?? { message: 'Unable to load party details. Please try again.' }}
      />
    )
  }

  const canEdit   = hasPermission(Permission.UPDATE_PARTY)
  const canToggle = hasPermission(Permission.TOGGLE_PARTY)
  const canDelete = hasPermission(Permission.DELETE_PARTY)

  return (
    <div className="space-y-5 p-6">
      <Link
        href="/parties"
        className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to parties
      </Link>

      <div className="rounded-xl bg-white p-6 shadow-elevation dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2.5">
            <span className="font-mono text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {party.partyCode}
            </span>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {party.partyName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <PartyRoleBadge isCustomer={party.isCustomer} isVendor={party.isVendor} />
              <PartyStatusBadge isActive={party.isActive} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                href={`/parties/${party.id}/edit`}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium',
                  'border border-zinc-200 bg-white text-zinc-700',
                  'transition-[background-color,transform] duration-150 hover:bg-zinc-50 active:scale-[0.97]',
                  'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                <FilePenLine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Edit
              </Link>
            )}

            {canToggle && (
              <button
                type="button"
                onClick={() => openModal(party.isActive ? 'deactivate' : 'activate', {
                  id: party.id, partyName: party.partyName, tin: party.tin,
                })}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium',
                  'transition-[background-color,transform] duration-150 active:scale-[0.97]',
                  party.isActive
                    ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400',
                )}
              >
                {party.isActive
                  ? <PowerOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  : <Power    className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
                {party.isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => openModal('delete', { id: party.id, partyName: party.partyName, tin: party.tin })}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium',
                  'transition-[background-color,transform] duration-150 active:scale-[0.97]',
                  'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100',
                  'dark:border-red-900 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20',
                )}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1.5 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <span>
            Created{' '}
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              {format(new Date(party.createdAt), 'd MMM yyyy')}
            </span>
          </span>
          <span>
            Last updated{' '}
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              {format(new Date(party.updatedAt), 'd MMM yyyy · HH:mm')}
            </span>
          </span>
        </div>
      </div>

      <PartyInfoSection party={party} />

      {/* Role-specific panels render only when that role is enabled. */}
      {(party.isCustomer || party.isVendor) && (
        <div className={cn(
          'grid grid-cols-1 gap-5',
          party.isCustomer && party.isVendor && 'lg:grid-cols-2',
        )}>
          {party.isCustomer && <CustomerProfileSection party={party} />}
          {party.isVendor   && <VendorProfileSection   party={party} />}
        </div>
      )}

      <GLAccountSection party={party} />

      {/* Details deletion returns to the list. */}
      <StatusChangeModal companyId={companyId ?? ''} />
      <DeletePartyModal  companyId={companyId ?? ''} redirectAfter />

    </div>
  )
}
