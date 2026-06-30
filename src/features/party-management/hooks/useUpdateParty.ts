// src/features/party-management/hooks/useUpdateParty.ts
//
// React Query mutation hook for updating company party information.
// Covers US-02: Update Company Party Information
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateCompanyParty } from '@/lib/api'
import { partyKeys }          from './useParties'

import type { UpdatePartyPayload, CompanyParty, ApiError } from '@/types/party.types'


// ─── Mutation Variables Shape ─────────────────────────────────────────────────

/**
 * The mutation receives both the companyPartyId and the payload together
 * since useMutation only accepts a single argument to mutationFn.
 */
interface UpdatePartyVariables {
  companyPartyId: string
  payload:        UpdatePartyPayload
}


// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useUpdateParty — mutation for updating company party contact info and roles.
 *
 * Scope (from US-02):
 *   ✔ partyName, contactName, phone, email, address
 *   ✔ isCustomer, isVendor role flags
 *   ✔ isActive status flag
 *   ✖ Does NOT update CustomerProfile or VendorProfile
 *   ✖ Does NOT update GL Account Assignments
 *
 * On success:
 *   1. Updates the detail cache directly with the returned party
 *      (avoids an extra network round-trip for the detail view)
 *   2. Invalidates the list cache so the updated name/status
 *      appears in the list immediately
 *   3. Shows a success toast
 *
 * Reference:
 *   US-02 API Integration "200 OK → Show success toast; refresh detail view"
 *   US-02 AC-07 → "Success notification displayed on HTTP 200 response"
 *   US-02 AC-08 → "API errors display returned message while preserving entered values"
 *   US-02 AC-09 → "Save button shows loading state, prevents duplicate submissions"
 *   US-02 AC-10 → "Updated data appears in UI immediately without page refresh"
 *
 * @param companyId - The company the party belongs to
 */
export function useUpdateParty(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation<CompanyParty, ApiError, UpdatePartyVariables>({
    mutationFn: ({ companyPartyId, payload }) =>
      updateCompanyParty(companyId, companyPartyId, payload),

    onSuccess: (updatedParty) => {
      /**
       * Write the updated party directly into the detail cache.
       * This means the details page reflects the change immediately
       * without waiting for a refetch.
       * Reference: US-02 AC-10
       */
      queryClient.setQueryData(
        partyKeys.detail(companyId, updatedParty.id),
        updatedParty
      )

      /**
       * Invalidate the list so the updated partyName, status, or roles
       * are reflected in the list view immediately.
       */
      queryClient.invalidateQueries({
        queryKey: partyKeys.lists(companyId),
      })

      // Reference: US-02 AC-07, Error Handling "Success"
      toast.success('Company party updated successfully.')
    },

    onError: (error) => {
      /**
       * Field-level errors (400) are handled in UpdatePartyForm
       * by reading mutation.error directly.
       * Only show a toast for unexpected 500-level errors.
       * Reference: US-02 AC-08, Error Handling
       */
      if (!error.errors) {
        toast.error(error.message ?? 'Unable to update company party.')
      }
    },
  })
}
