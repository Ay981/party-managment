// src/features/party-management/hooks/usePartyDetails.ts
//
// React Query hook for fetching a single company party's full details.
// Covers US-04: View Company Party Details
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'

import { getCompanyPartyDetails } from '@/lib/api'
import { partyKeys } from './useParties'

import type { CompanyParty, ApiError } from '@/types/party.types'


// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * usePartyDetails — fetches full details for a single company party.
 *
 * Used by:
 *   - PartyDetails page (US-04)
 *   - Edit page (US-02) to pre-populate the form
 *
 * The returned CompanyParty contains all 6 sections from US-04:
 *   Section 1 — Party Information
 *   Section 2 — Party Roles        (derived from isCustomer / isVendor)
 *   Section 3 — Status Information
 *   Section 4 — Customer Profile   (null if not customer / not configured)
 *   Section 5 — Vendor Profile     (null if not vendor / not configured)
 *   Section 6 — GL Account Assignments (embedded in profiles)
 *
 * Reference:
 *   US-04 Screen Description
 *   US-04 AC-01 → "Party details retrieved and displayed for a valid ID"
 *   US-04 AC-11 → "Appropriate error message displayed on API failure"
 *   US-04 AC-12 → "Details page renders within approved performance standards"
 *
 * @param companyId - Company the party belongs to
 * @param partyId   - The specific party to fetch
 * @param enabled   - Set false to skip fetching (e.g. partyId not yet known)
 */
export function usePartyDetails(
  companyId: string | null,
  partyId:   string | null,
  enabled =  true
) {
  return useQuery<CompanyParty, ApiError>({
    queryKey: partyKeys.detail(companyId ?? '', partyId ?? ''),

    queryFn:  () => getCompanyPartyDetails(companyId!, partyId!),

    // Only fetch when both IDs are present and caller hasn't disabled it
    enabled: !!companyId && !!partyId && enabled,

    /**
     * Cache details for 60 seconds.
     * Details pages are read-heavy and rarely change between views.
     * Mutations (update, status change) manually invalidate this key
     * on success so the UI always reflects the latest state.
     */
    staleTime: 60 * 1000,

    /**
     * Do not retry on 404 — the party genuinely doesn't exist.
     * Retry once on other errors (network blip, 500).
     * Reference: US-04 Error Handling "404 Not Found: Party record not found"
     */
    retry: (failureCount, error) => {
      if (error.code === 'PARTY_NOT_FOUND') return false
      return failureCount < 1
    },
  })
}
