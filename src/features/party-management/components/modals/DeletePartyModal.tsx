// src/features/party-management/components/modals/DeletePartyModal.tsx
//
// Confirmation modal for soft-deleting a company party.
// The most critical destructive action in the module —
// uses strong warning language and destructive button styling.
//
// Reads modal state from usePartyStore:
//   modal.type  → 'delete'
//   modal.party → { id, partyName, tin }
//
// Reference:
//   US-06 Delete Confirmation Modal table
//   US-06 AC-02 "Confirmation modal displays party information and warning message"
//   US-06 AC-03 "Clicking Cancel closes modal with no API request sent"
//   US-06 AC-04 "Successful deletion displays success notification"
//   US-06 AC-07 "Delete button shows loading state, prevents duplicate submissions"
//   US-06 AC-08 "API errors display appropriate error message"
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal }                from 'react-dom'
import { Trash2, X, AlertTriangle }    from 'lucide-react'

import { cn }                         from '@/lib/utils'
import { usePartyStore, selectModal } from '@/store/party.store'
import { useDeleteParty }             from '../../hooks/useDeleteParty'


interface DeletePartyModalProps {
  companyId: string
  /**
   * Set true when called from the details page.
   * Triggers redirect to /parties after deletion.
   * Reference: US-06 Post-Delete Behavior table
   */
  redirectAfter?: boolean
}

export function DeletePartyModal({ companyId, redirectAfter = false }: DeletePartyModalProps) {
  const modal      = usePartyStore(selectModal)
  const closeModal = usePartyStore(s => s.closeModal)

  const isOpen = modal.type === 'delete'
  const party  = modal.party

  const cancelRef = useRef<HTMLButtonElement>(null)

  // Typed confirmation — user must type the party name to unlock Delete
  const [confirmInput, setConfirmInput] = useState('')
  const confirmMatch = confirmInput.trim().toLowerCase() === party?.partyName.toLowerCase()

  const handleClose = useCallback(() => {
    setConfirmInput('')
    closeModal()
  }, [closeModal])

  // Focus cancel on open
  useEffect(() => {
    if (isOpen) setTimeout(() => cancelRef.current?.focus(), 50)
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [isOpen, handleClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const mutation = useDeleteParty(companyId, redirectAfter, handleClose)

  const handleDelete = () => {
    if (!party || !confirmMatch) return
    mutation.mutate({ partyId: party.id })
  }

  if (!isOpen || !party) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => !mutation.isPending && handleClose()}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
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
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2} aria-hidden />
              </div>
              <div className="pt-1">
                {/* Reference: US-06 "Title: Delete Party" */}
                <h2 id="delete-modal-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Delete party
                </h2>
                {/* Reference: US-06 Delete Confirmation Modal "Message" */}
                <p id="delete-modal-description" className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to delete this company-party relationship?
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
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

          {/* Party identity + warning — Reference: US-06 "Party Name: [name] | TIN: [tin]" */}
          <div className="mx-6 overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800">
            <div className="px-4 py-3">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {party.partyName}
              </p>
              <p className="mt-0.5 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                TIN: {party.tin}
              </p>
            </div>

            {/* Reference: US-06 Delete Confirmation Modal "Warning" */}
            <div className="flex items-start gap-2.5 border-t border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" strokeWidth={2} aria-hidden />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                This will deactivate the party for the selected company and remove it from
                active lists. Historical records will remain available for audit purposes.
              </p>
            </div>
          </div>

          {/* Typed confirmation input — unlocks the Delete button */}
          <div className="mx-6 mt-4">
            <label htmlFor="confirm-name" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Type{' '}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{party.partyName}</span>{' '}
              to confirm
            </label>
            <input
              id="confirm-name"
              type="text"
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              placeholder={party.partyName}
              autoComplete="off"
              disabled={mutation.isPending}
              className={cn(
                'mt-1.5 h-11 w-full rounded-lg border px-3 text-sm',
                'bg-white text-zinc-900 placeholder:text-zinc-500',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600',
                confirmInput && !confirmMatch
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20 dark:border-red-700'
                  : confirmMatch
                  ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-500/20 dark:border-emerald-600'
                  : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-500/15 dark:border-zinc-700',
              )}
            />
            {confirmInput && !confirmMatch && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                Name does not match - check for typos
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 p-6 pt-4">
            {/* Reference: US-06 AC-03 */}
            <button
              ref={cancelRef}
              type="button"
              onClick={handleClose}
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

            {/* Reference: US-06 "Delete (destructive styling)", AC-07 loading state */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={mutation.isPending || !confirmMatch}
              className={cn(
                'inline-flex h-11 min-w-[100px] items-center justify-center gap-2',
                'rounded-lg px-4 text-sm font-medium text-white shadow-sm',
                'bg-red-600 hover:bg-red-700 active:bg-red-800',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {mutation.isPending ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Delete
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
