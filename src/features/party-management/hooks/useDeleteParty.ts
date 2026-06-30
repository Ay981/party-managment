// src/features/party-management/hooks/useDeleteParty.ts
//
// React Query mutation hook for soft-deleting a company party.
// Covers US-06: Soft Delete Company Party
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast }    from 'sonner'

import { deleteCompanyParty } from '@/lib/api'
import { partyKeys }          from './useParties'

import type { ApiError } from '@/types/party.types'


// ─── Mutation Variables Shape ─────────────────────────────────────────────────

interface DeletePartyVariables {
  partyId: string
}


// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useDeleteParty — mutation for soft-deleting a company party.
 *
 * What "soft delete" means (US-06 Description):
 *   - Backend sets isActive = false and deletedAt = timestamp
 *   - Record is NOT removed from the database
 *   - Historical and audit data remain intact
 *   - Record stops appearing in the active party list
 *
 * On success:
 *   1. Removes the party from the detail cache (it no longer exists for UI purposes)
 *   2. Invalidates all list queries for this company
 *   3. Shows a success toast
 *   4. Redirects to the party list (if called from the details page)
 *      OR closes the modal (if called from the list page)
 *
 * On error:
 *   1. Shows an error toast
 *   2. Makes NO UI changes
 *
 * Reference:
 *   US-06 Description — soft delete behavior
 *   US-06 AC-04 → "Successful deletion displays success notification"
 *   US-06 AC-05 → "List and detail views refresh automatically after deletion"
 *   US-06 AC-06 → "Deleted records do not appear in Active parties list"
 *   US-06 AC-07 → "Delete button shows loading state, prevents duplicate submissions"
 *   US-06 AC-08 → "API errors display appropriate error message"
 *   US-06 Error Handling → "PARTY_NOT_FOUND" code
 *   Appendix C → "Soft Delete"
 *
 * @param companyId      - The company the party belongs to
 * @param redirectToList - If true, redirects to /parties after deletion
 *                         Set true when called from details page (US-06 Post-Delete Behavior)
 *                         Set false when called from list page (just closes modal + refreshes)
 * @param onSuccess      - Optional callback — used to close DeletePartyModal
 */
export function useDeleteParty(
  companyId:      string,
  redirectToList: boolean  = false,
  onSuccess?:     () => void
) {
  const queryClient = useQueryClient()
  const router      = useRouter()

  return useMutation<void, ApiError, DeletePartyVariables>({
    mutationFn: ({ partyId }) => deleteCompanyParty(companyId, partyId),

    onSuccess: (_, variables) => {
      /**
       * Remove this party from the detail cache entirely.
       * After soft delete it should not be accessible via the details page.
       * Reference: US-06 Post-Delete Behavior "Redirect user to Company Party List page"
       */
      queryClient.removeQueries({
        queryKey: partyKeys.detail(companyId, variables.partyId),
      })

      /**
       * Invalidate all list queries.
       * The deleted record has deletedAt set, so listCompanyParties
       * will naturally exclude it from results.
       * Reference:
       *   US-06 Post-Delete Behavior "Refresh the list; remove deleted record from Active view"
       *   US-06 AC-05, AC-06
       */
      queryClient.invalidateQueries({
        queryKey: partyKeys.all(companyId),
      })

      // Reference: US-06 AC-04, Error Handling "Success: Party deleted successfully."
      toast.success('Party deleted successfully.')

      /**
       * Close the modal first, then redirect if needed.
       * Reference:
       *   US-06 Post-Delete Behavior "Company Party List" context
       *   US-06 Post-Delete Behavior "Company Party Details" context → redirect
       */
      onSuccess?.()

      if (redirectToList) {
        router.push('/parties')
      }
    },

    onError: (error) => {
      /**
       * Show error toast. Make no UI changes.
       * Reference:
       *   US-06 AC-08
       *   US-06 Error Handling "PARTY_NOT_FOUND: Party record not found."
       */
      toast.error(
        error.message ?? 'Unable to delete party. Please try again.'
      )
    },
  })
}
