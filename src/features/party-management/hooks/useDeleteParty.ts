import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast }    from 'sonner'

import { deleteCompanyParty } from '@/lib/api'
import { partyKeys }          from './useParties'

import type { ApiError } from '@/types/party.types'

interface DeletePartyVariables {
  partyId: string
}

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
      // Deleted parties should not remain readable from the detail cache.
      queryClient.removeQueries({
        queryKey: partyKeys.detail(companyId, variables.partyId),
      })

      queryClient.invalidateQueries({
        queryKey: partyKeys.all(companyId),
      })

      toast.success('Party deleted successfully.')
      onSuccess?.()

      if (redirectToList) {
        router.push('/parties')
      }
    },

    onError: (error) => {
      toast.error(
        error.message ?? 'Unable to delete party. Please try again.'
      )
    },
  })
}
