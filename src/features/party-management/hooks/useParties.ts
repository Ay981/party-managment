import { useQuery } from '@tanstack/react-query'

import { listCompanyParties } from '@/lib/api'

import type { PartyFilters, PaginatedResponse, CompanyParty, ApiError } from '@/types/party.types'

export const partyKeys = {
  all:     (companyId: string) =>
    ['parties', companyId] as const,

  lists:   (companyId: string) =>
    ['parties', companyId, 'list'] as const,

  list:    (companyId: string, filters: PartyFilters) =>
    ['parties', companyId, 'list', filters] as const,

  details: (companyId: string) =>
    ['parties', companyId, 'detail'] as const,

  detail:  (companyId: string, partyId: string) =>
    ['parties', companyId, 'detail', partyId] as const,
}

export function useParties(
  companyId: string | null,
  filters: PartyFilters,
  enabled = true
) {
  return useQuery<PaginatedResponse<CompanyParty>, ApiError>({
    queryKey: partyKeys.list(companyId ?? '', filters),

    queryFn:  () => listCompanyParties(companyId!, filters),

    enabled: !!companyId && enabled,

    // Keep the current table visible while the next page/filter loads.
    placeholderData: (previousData) => previousData,

    staleTime: 30 * 1000,
  })
}
