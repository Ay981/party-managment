'use client'

import { useEffect, useRef } from 'react'
import { createPortal }      from 'react-dom'
import { PowerOff, Power, X } from 'lucide-react'

import { cn }                           from '@/shared/utils'
import { usePartyStore, selectModal }   from '@/modules/party-management/store/party.store'
import { useUpdatePartyStatus }         from '../../hooks/useUpdatePartyStatus'


interface StatusChangeModalProps {
  companyId: string
}

export function StatusChangeModal({ companyId }: StatusChangeModalProps) {
  const modal      = usePartyStore(selectModal)
  const closeModal = usePartyStore(s => s.closeModal)

  const isOpen     = modal.type === 'activate' || modal.type === 'deactivate'
  const isDeactivate = modal.type === 'deactivate'
  const party      = modal.party

  const cancelRef  = useRef<HTMLButtonElement>(null)

  // Focus the safe action first.
  useEffect(() => {
    if (isOpen) setTimeout(() => cancelRef.current?.focus(), 50)
  }, [isOpen])

  // ESC closes the modal.
  useEffect(() => {
    if (!isOpen) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [isOpen, closeModal])

  // Keep the background fixed while the modal is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const mutation = useUpdatePartyStatus(companyId, closeModal)

  const handleConfirm = () => {
    if (!party) return
    mutation.mutate({
      partyId: party.id,
      payload: { isActive: modal.type === 'activate' },
    })
  }

  if (!isOpen || !party) return null

  const config = isDeactivate
    ? {
        title:       'Deactivate company party',
        description: 'This party will no longer be available for business transactions within your company.',
        actionLabel: 'Deactivate',
        Icon:        PowerOff,
        iconBg:      'bg-amber-50 dark:bg-amber-500/10',
        iconColor:   'text-amber-600 dark:text-amber-400',
        btnBase:     'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 focus-visible:ring-amber-500',
      }
    : {
        title:       'Activate company party',
        description: 'This party will be made available for business transactions within your company.',
        actionLabel: 'Activate',
        Icon:        Power,
        iconBg:      'bg-emerald-50 dark:bg-emerald-500/10',
        iconColor:   'text-emerald-600 dark:text-emerald-400',
        btnBase:     'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500',
      }

  const { Icon } = config

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={closeModal}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        aria-describedby="status-modal-description"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className={cn(
            'pointer-events-auto w-full max-w-md',
            'rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/15',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-900/50',
            'animate-in fade-in-0 zoom-in-95 duration-150',
          )}
        >
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.iconBg)}>
                <Icon className={cn('h-5 w-5', config.iconColor)} strokeWidth={2} aria-hidden />
              </div>
              <div className="pt-1">
                <h2 id="status-modal-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {config.title}
                </h2>
                <p id="status-modal-description" className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {config.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              disabled={mutation.isPending}
              aria-label="Close"
              className={cn(
                'ml-4 shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors',
                'hover:bg-zinc-100 hover:text-zinc-600',
                'dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="mx-6 mb-5 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{party.partyName}</p>
            <p className="mt-0.5 font-mono text-xs text-zinc-400 dark:text-zinc-500">TIN: {party.tin}</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <button
              ref={cancelRef}
              type="button"
              onClick={closeModal}
              disabled={mutation.isPending}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium',
                'border border-zinc-200 bg-white text-zinc-700 shadow-sm',
                'hover:bg-zinc-50 hover:text-zinc-900 transition-colors',
                'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className={cn(
                'inline-flex h-11 min-w-[110px] items-center justify-center gap-2',
                'rounded-lg px-4 text-sm font-medium text-white shadow-sm',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-70',
                config.btnBase,
              )}
            >
              {mutation.isPending ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {config.actionLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
