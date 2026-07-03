import { useQuery } from '@tanstack/react-query'

import { getCompanyPartyDetails } from '@/modules/party-management/api'
import { partyKeys } from './useParties'

import type { CompanyParty, ApiError } from '@/modules/party-management/types'

export function usePartyDetails(
  companyId: string | null,
  partyId:   string | null,
  enabled =  true
) {
  return useQuery<CompanyParty, ApiError>({
    queryKey: partyKeys.detail(companyId ?? '', partyId ?? ''),

    queryFn:  () => getCompanyPartyDetails(companyId!, partyId!),

    enabled: !!companyId && !!partyId && enabled,

    staleTime: 60 * 1000,

    // A missing party is final; transient errors get one retry.
    retry: (failureCount, error) => {
      if (error.code === 'PARTY_NOT_FOUND') return false
      return failureCount < 1
    },
  })
}
