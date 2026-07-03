import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createParty } from '@/lib/api'
import { partyKeys }   from './useParties'

import type { CreatePartyPayload, CompanyParty, ApiError } from '@/types/party.types'

export function useCreateParty(companyId: string) {
  const queryClient = useQueryClient()
  const router      = useRouter()

  return useMutation<CompanyParty, ApiError, CreatePartyPayload>({
    mutationFn: (payload) => createParty(companyId, payload),

    onSuccess: (createdParty) => {
      queryClient.invalidateQueries({
        queryKey: partyKeys.all(companyId),
      })

      toast.success('Party created successfully.')
      router.push(`/parties/${createdParty.id}`)
    },

    onError: (error) => {
      // Field errors and duplicate TIN are rendered inline by the form.
      if (!error.errors && error.code !== 'DUPLICATE_TIN') {
        toast.error(error.message ?? 'An unexpected error occurred.')
      }
    },
  })
}
