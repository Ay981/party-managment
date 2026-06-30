// src/features/party-management/hooks/useUpdatePartyStatus.ts
//
// React Query mutation hook for toggling a party's active status.
// Covers US-05: Activate or Deactivate Company Party
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updatePartyStatus } from '@/lib/api'
import { partyKeys }         from './useParties'

import type {
  UpdatePartyStatusPayload,
  CompanyParty,
  ApiError,
} from '@/types/party.types'


// ─── Mutation Variables Shape ─────────────────────────────────────────────────

interface UpdateStatusVariables {
  partyId: string
  payload: UpdatePartyStatusPayload
}


// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useUpdatePartyStatus — mutation for activating or deactivating a party.
 *
 * Payload:
 *   { isActive: true  } → Activate   party
 *   { isActive: false } → Deactivate party
 *
 * On success:
 *   1. Writes the updated party directly into the detail cache
 *   2. Invalidates all list queries for this company
 *   3. Shows a contextual success toast based on the action performed
 *   4. Closes the confirmation modal (caller's responsibility via onSuccess callback)
 *
 * On error:
 *   1. Shows an error toast
 *   2. Makes NO UI changes — status badge and action menu stay as-is
 *
 * Reference:
 *   US-05 API Integration — Request Payload table
 *   US-05 AC-2  → "Deactivation sends PATCH with isActive: false, updates UI on success"
 *   US-05 AC-3  → "Activation sends PATCH with isActive: true, updates UI on success"
 *   US-05 AC-4  → "Status badge, action menu, and timestamp update immediately after success"
 *   US-05 AC-5  → "Action buttons disabled, loading indicator shown during request"
 *   US-05 AC-6  → "On API error, no UI changes made and error notification displayed"
 *
 * @param companyId - The company the party belongs to
 * @param onSuccess - Optional callback — used to close the StatusChangeModal
 */
export function useUpdatePartyStatus(
  companyId: string,
  onSuccess?: () => void
) {
  const queryClient = useQueryClient()

  return useMutation<CompanyParty, ApiError, UpdateStatusVariables>({
    mutationFn: ({ partyId, payload }) =>
      updatePartyStatus(companyId, partyId, payload),

    onSuccess: (updatedParty) => {
      /**
       * Write directly into detail cache so the details page
       * updates without a round-trip.
       * Reference: US-05 AC-4
       */
      queryClient.setQueryData(
        partyKeys.detail(companyId, updatedParty.id),
        updatedParty
      )

      /**
       * Invalidate all lists so the status badge in the list view
       * updates immediately.
       * Reference: US-05 AC-4
       */
      queryClient.invalidateQueries({
        queryKey: partyKeys.all(companyId),
      })

      /**
       * Contextual success message based on the new status.
       * Reference:
       *   US-05 Error Handling "Success (Deactivate): Company party deactivated successfully."
       *   US-05 Error Handling "Success (Activate): Company party activated successfully."
       */
      const message = updatedParty.isActive
        ? 'Company party activated successfully.'
        : 'Company party deactivated successfully.'

      toast.success(message)

      // Let the modal close itself
      onSuccess?.()
    },

    onError: (error) => {
      /**
       * On error → show toast but make NO UI changes.
       * The status badge and action menu must remain unchanged.
       * Reference: US-05 AC-6
       */
      toast.error(
        error.message ?? 'Unable to update company party status.'
      )
    },
  })
}
