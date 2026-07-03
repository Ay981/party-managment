import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateCompanyParty } from '@/modules/party-management/api'
import { partyKeys }          from './useParties'

import type { UpdatePartyPayload, CompanyParty, ApiError } from '@/modules/party-management/types'

interface UpdatePartyVariables {
  companyPartyId: string
  payload:        UpdatePartyPayload
}

export function useUpdateParty(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation<CompanyParty, ApiError, UpdatePartyVariables>({
    mutationFn: ({ companyPartyId, payload }) =>
      updateCompanyParty(companyId, companyPartyId, payload),

    onSuccess: (updatedParty) => {
      // Detail views should reflect the returned record immediately.
      queryClient.setQueryData(
        partyKeys.detail(companyId, updatedParty.id),
        updatedParty
      )

      queryClient.invalidateQueries({
        queryKey: partyKeys.lists(companyId),
      })

      toast.success('Company party updated successfully.')
    },

    onError: (error) => {
      // Field-level validation errors are shown inside UpdatePartyForm.
      if (!error.errors) {
        toast.error(error.message ?? 'Unable to update company party.')
      }
    },
  })
}
