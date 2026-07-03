import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updatePartyStatus } from '@/lib/api'
import { partyKeys }         from './useParties'

import type {
  UpdatePartyStatusPayload,
  CompanyParty,
  ApiError,
} from '@/types/party.types'

interface UpdateStatusVariables {
  partyId: string
  payload: UpdatePartyStatusPayload
}

export function useUpdatePartyStatus(
  companyId: string,
  onSuccess?: () => void
) {
  const queryClient = useQueryClient()

  return useMutation<CompanyParty, ApiError, UpdateStatusVariables>({
    mutationFn: ({ partyId, payload }) =>
      updatePartyStatus(companyId, partyId, payload),

    onSuccess: (updatedParty) => {
      queryClient.setQueryData(
        partyKeys.detail(companyId, updatedParty.id),
        updatedParty
      )

      queryClient.invalidateQueries({
        queryKey: partyKeys.all(companyId),
      })

      const message = updatedParty.isActive
        ? 'Company party activated successfully.'
        : 'Company party deactivated successfully.'

      toast.success(message)
      onSuccess?.()
    },

    onError: (error) => {
      toast.error(
        error.message ?? 'Unable to update company party status.'
      )
    },
  })
}
