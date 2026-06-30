// src/features/party-management/hooks/useParties.ts
//
// React Query hook for fetching the paginated party list.
// Covers US-03: List Company Parties
//
// Keeps server state (the actual party records) separate from
// UI state (filters, pagination) which lives in party.store.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'

import { listCompanyParties } from '@/lib/api'

import type { PartyFilters, PaginatedResponse, CompanyParty, ApiError } from '@/types/party.types'


// ─── Query Key Factory ────────────────────────────────────────────────────────

/**
 * Centralized query key factory for party list queries.
 * Including filters in the key means React Query automatically
 * refetches when any filter value changes.
 *
 * Structure:
 *   ['parties', companyId]               → base key (for broad invalidation)
 *   ['parties', companyId, 'list', filters] → specific list with filters
 *
 * The base key is used in mutations to invalidate all party lists
 * for a company at once regardless of current filter state.
 *
 * Reference: US-03 API Integration
 */
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


// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useParties — fetches the paginated, filtered list of company parties.
 *
 * Automatically refetches when:
 *   - companyId changes
 *   - Any filter value changes (search, isCustomer, isVendor, isActive, page, perPage)
 *
 * This hook does NOT manage filter state — that lives in usePartyStore.
 * The parent component reads filters from the store and passes them here.
 *
 * Loading states:
 *   isLoading → first fetch (no cached data yet) → show skeleton table
 *   isFetching → background refetch (cached data shown) → show subtle spinner
 *
 * Reference:
 *   US-03 User Story
 *   US-03 AC-01 → "On page load, first page is retrieved and displayed"
 *   US-03 AC-08 → "Loading indicator displayed while data is being fetched"
 *   US-03 AC-09 → "API errors display appropriate error messages"
 *
 * @param companyId  - The company to fetch parties for
 * @param filters    - Current filter + pagination state from usePartyStore
 * @param enabled    - Set to false to pause the query (e.g. while not authenticated)
 */
export function useParties(
  companyId: string | null,
  filters: PartyFilters,
  enabled = true
) {
  return useQuery<PaginatedResponse<CompanyParty>, ApiError>({
    queryKey: partyKeys.list(companyId ?? '', filters),

    queryFn:  () => {
      // companyId is guaranteed non-null here because of the enabled guard
      return listCompanyParties(companyId!, filters)
    },

    // Only run when we have a companyId and the caller hasn't disabled it
    enabled: !!companyId && enabled,

    /**
     * Keep previous page data visible while fetching the next page.
     * Prevents the table from flickering to empty on pagination.
     * Reference: US-03 AC-06 "Page change loads the corresponding records"
     */
    placeholderData: (previousData) => previousData,

    /**
     * Cache the list for 30 seconds.
     * Short enough that navigating back to the list feels fresh,
     * long enough to avoid redundant fetches on quick re-renders.
     */
    staleTime: 30 * 1000,
  })
}
