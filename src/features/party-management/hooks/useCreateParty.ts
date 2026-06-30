// src/features/party-management/hooks/useCreateParty.ts
//
// React Query mutation hook for creating a new company party.
// Covers US-01: Create Party (Customer, Vendor, or Both)
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createParty } from '@/lib/api'
import { partyKeys }   from './useParties'

import type { CreatePartyPayload, CompanyParty, ApiError } from '@/types/party.types'


// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCreateParty — mutation for creating a new party.
 *
 * On success:
 *   1. Invalidates the party list cache for this company
 *      so the new record appears immediately on the list page
 *   2. Shows a success toast notification
 *   3. Redirects to the newly created party's details page
 *
 * Reference:
 *   US-01 API Integration "201 Created → Show success toast; redirect to Party Details"
 *   US-01 AC-01 through AC-03 → all three party type combinations work
 *   US-01 AC-12 → "System displays success notification after successful creation"
 *   US-01 AC-13 → "Save button prevents duplicate submissions while request is in progress"
 *
 * On error:
 *   - 400 → field-level validation errors displayed in the form
 *   - 409 → duplicate TIN error shown near the TIN field
 *   - 500 → generic error toast
 *
 * Reference:
 *   US-01 Error Handling section
 *   US-01 AC-11 → "System displays backend validation messages returned by the API"
 *
 * @param companyId - The company to create the party under
 */
export function useCreateParty(companyId: string) {
  const queryClient = useQueryClient()
  const router      = useRouter()

  return useMutation<CompanyParty, ApiError, CreatePartyPayload>({
    mutationFn: (payload) => createParty(companyId, payload),

    onSuccess: (createdParty) => {
      /**
       * Invalidate all party lists for this company.
       * Using the base key ['parties', companyId] invalidates every list
       * query regardless of current filter state.
       * Reference: US-01 AC-01 through AC-03
       */
      queryClient.invalidateQueries({
        queryKey: partyKeys.all(companyId),
      })

      /**
       * Success toast — mirrors the 201 Created response behavior.
       * Reference: US-01 API Integration "Show success toast"
       */
      toast.success('Party created successfully.')

      /**
       * Redirect to the new party's details page.
       * Reference: US-01 API Integration "redirect to Party Details page"
       */
      router.push(`/parties/${createdParty.id}`)
    },

    onError: (error) => {
      /**
       * Only show a generic toast for 500-level errors.
       * Field-level 400 errors and 409 duplicate TIN are handled
       * directly in the form component using mutation.error.
       * Reference: US-01 Error Handling, AC-11
       */
      if (!error.errors && error.code !== 'DUPLICATE_TIN') {
        toast.error(error.message ?? 'An unexpected error occurred.')
      }
    },
  })
}
