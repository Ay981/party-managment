// src/store/party.store.ts
//
// Zustand store for Party Management UI state.
// This store owns client-side state ONLY:
//   - List filter values
//   - Pagination
//   - Which modal is open and for which party
//   - Which party is selected for actions
//
// It does NOT own server data (party records, API responses).
// That is React Query's job via the hooks in:
//   src/features/party-management/hooks/
//
// Rule of thumb:
//   "Did the user do something in the UI?" → Zustand
//   "What did the server respond with?"    → React Query
//
// Usage anywhere in the app:
//   const { filters, setFilter, openModal } = usePartyStore()
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'

import type {
  PartyFilters,
  ModalState,
  CompanyParty,
} from '@/types/party.types'

import { ActiveStatusFilter } from '@/types/party.types'


// ─── Default Filter Values ────────────────────────────────────────────────────

/**
 * Initial/reset state for the party list filters.
 * Matches the default behavior described in US-03:
 *   - No search term
 *   - No role filter (show all)
 *   - No status filter (show all)
 *   - Page 1
 *   - 10 records per page
 *
 * Reference: US-03 Filters Section, Query Parameters
 */
export const DEFAULT_FILTERS: PartyFilters = {
  search:     '',
  isCustomer: null,
  isVendor:   null,
  isActive:   null,
  page:       1,
  perPage:    10,
}

/**
 * Initial modal state — nothing open, no party selected.
 * Reference: ModalState in party.types.ts
 */
const DEFAULT_MODAL: ModalState = {
  type:  null,
  party: null,
}


// ─── Store Shape ──────────────────────────────────────────────────────────────

/**
 * Full shape of the party UI store.
 * Split into two logical sections:
 *   State   → the current values
 *   Actions → functions that update the values
 */
interface PartyStoreState {

  // ── Filter & Pagination State ──────────────────────────────────────────────

  /**
   * Current filter values applied to the party list.
   * Passed directly to the useParties hook as query params.
   * Reference: PartyFilters in party.types.ts, US-03
   */
  filters: PartyFilters

  // ── Modal State ────────────────────────────────────────────────────────────

  /**
   * Tracks which confirmation modal is currently open.
   * type: 'delete'     → DeletePartyModal    (US-06)
   * type: 'activate'   → StatusChangeModal   (US-05)
   * type: 'deactivate' → StatusChangeModal   (US-05)
   * type: null         → no modal open
   *
   * Reference: ModalState in party.types.ts
   */
  modal: ModalState

  // ── Filter Actions ─────────────────────────────────────────────────────────

  /**
   * Updates a single filter field and resets pagination to page 1.
   * Always reset to page 1 when a filter changes — otherwise you
   * could be on page 5 of results that now only have 1 page.
   *
   * Usage:
   *   setFilter('search', 'Addis Trading')
   *   setFilter('isCustomer', true)
   *   setFilter('perPage', 20)
   *
   * Reference: US-03 Filters Section
   */
  setFilter: <K extends keyof PartyFilters>(
    key: K,
    value: PartyFilters[K]
  ) => void

  /**
   * Updates the current page number without touching other filters.
   * Called by pagination controls in PartyList.
   *
   * Reference: US-03 Pagination Response, AC-06
   */
  setPage: (page: number) => void

  /**
   * Resets all filters back to DEFAULT_FILTERS.
   * Called by the "Clear Filters" action shown on empty results.
   *
   * Reference: US-03 Error Handling "Empty Results — Provide a Clear Filters action"
   */
  resetFilters: () => void

  /**
   * Applies the search term from the search input.
   * Separate from setFilter because search also resets to page 1
   * and can be triggered by both button click and Enter key press.
   *
   * Reference: US-03 Filters "Search triggers on button click or Enter key press"
   */
  applySearch: (term: string) => void

  /**
   * Toggles the Customer Only checkbox filter.
   * If already true → sets to null (show all).
   * If null or false → sets to true (customers only).
   *
   * Reference: US-03 Filters "Customer Only Checkbox"
   */
  toggleCustomerFilter: () => void

  /**
   * Toggles the Vendor Only checkbox filter.
   * If already true → sets to null (show all).
   * If null or false → sets to true (vendors only).
   *
   * Reference: US-03 Filters "Vendor Only Checkbox"
   */
  toggleVendorFilter: () => void

  /**
   * Sets the active status filter from the dropdown.
   * Accepts ActiveStatusFilter enum value.
   * Converts to boolean | null for the filters object.
   *
   * ActiveStatusFilter.ALL      → isActive: null
   * ActiveStatusFilter.ACTIVE   → isActive: true
   * ActiveStatusFilter.INACTIVE → isActive: false
   *
   * Reference: US-03 Filters "Active Status Dropdown"
   */
  setStatusFilter: (status: ActiveStatusFilter) => void

  // ── Modal Actions ──────────────────────────────────────────────────────────

  /**
   * Opens a confirmation modal for a specific party.
   * Stores the modal type and the minimal party data needed
   * to render the modal content (name and TIN for confirmation message).
   *
   * Usage:
   *   openModal('delete', party)
   *   openModal('deactivate', party)
   *   openModal('activate', party)
   *
   * Reference:
   *   US-05 Confirmation Modals — "Party Name: [name]"
   *   US-06 Delete Confirmation Modal — "Party Name: [name] | TIN: [tin]"
   */
  openModal: (
    type: ModalState['type'],
    party: Pick<CompanyParty, 'id' | 'partyName' | 'tin'>
  ) => void

  /**
   * Closes whichever modal is currently open and clears the
   * selected party reference.
   *
   * Called:
   *   - When user clicks Cancel  (US-05, US-06)
   *   - After successful action  (mutation onSuccess)
   *   - On modal backdrop click
   *
   * Reference:
   *   US-06 AC-03 "Clicking Cancel closes modal with no API request sent"
   */
  closeModal: () => void
}


// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * usePartyStore — UI state for the Party Management module.
 *
 * Not persisted — filter state resets on page navigation.
 * If you want filters to survive navigation, add the persist
 * middleware here (same pattern as auth.store.ts).
 */
export const usePartyStore = create<PartyStoreState>()((set, get) => ({

  // ── Initial State ──────────────────────────────────────────────────────────

  filters: { ...DEFAULT_FILTERS },
  modal:   { ...DEFAULT_MODAL  },


  // ── Filter Actions ─────────────────────────────────────────────────────────

  setFilter: (key, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [key]: value,
        // Reset to page 1 on any filter change except page itself
        page: key === 'page' ? (value as number) : 1,
      },
    }))
  },

  setPage: (page) => {
    set(state => ({
      filters: { ...state.filters, page },
    }))
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } })
  },

  applySearch: (term) => {
    set(state => ({
      filters: {
        ...state.filters,
        search: term.trim(),
        page:   1,            // always back to page 1 on new search
      },
    }))
  },

  toggleCustomerFilter: () => {
    const current = get().filters.isCustomer
    set(state => ({
      filters: {
        ...state.filters,
        isCustomer: current === true ? null : true,
        page: 1,
      },
    }))
  },

  toggleVendorFilter: () => {
    const current = get().filters.isVendor
    set(state => ({
      filters: {
        ...state.filters,
        isVendor: current === true ? null : true,
        page: 1,
      },
    }))
  },

  setStatusFilter: (status) => {
    // Map ActiveStatusFilter enum to boolean | null for the filters object
    const isActive =
      status === ActiveStatusFilter.ACTIVE   ? true  :
      status === ActiveStatusFilter.INACTIVE ? false :
      null                                            // ALL → null

    set(state => ({
      filters: {
        ...state.filters,
        isActive,
        page: 1,
      },
    }))
  },


  // ── Modal Actions ──────────────────────────────────────────────────────────

  openModal: (type, party) => {
    set({
      modal: { type, party },
    })
  },

  closeModal: () => {
    set({ modal: { ...DEFAULT_MODAL } })
  },

}))


// ─── Derived Selectors ────────────────────────────────────────────────────────

/**
 * Granular selectors to minimize re-renders.
 * A component that only needs the search term won't re-render
 * when the page number changes.
 *
 * Usage:
 *   const filters  = usePartyStore(selectFilters)
 *   const modal    = usePartyStore(selectModal)
 *   const search   = usePartyStore(selectSearch)
 */

export const selectFilters    = (s: PartyStoreState): PartyFilters  => s.filters
export const selectModal      = (s: PartyStoreState): ModalState    => s.modal
export const selectSearch     = (s: PartyStoreState): string        => s.filters.search
export const selectPage       = (s: PartyStoreState): number        => s.filters.page
export const selectPerPage    = (s: PartyStoreState): number        => s.filters.perPage
export const selectIsModalOpen = (s: PartyStoreState): boolean      => s.modal.type !== null

/**
 * Returns the current ActiveStatusFilter enum value from the
 * boolean | null stored in filters.isActive.
 * Used to set the correct selected option in the status dropdown.
 *
 * Reference: US-03 Filters "Active Status Dropdown"
 */
export const selectStatusFilter = (s: PartyStoreState): ActiveStatusFilter => {
  const { isActive } = s.filters
  if (isActive === true)  return ActiveStatusFilter.ACTIVE
  if (isActive === false) return ActiveStatusFilter.INACTIVE
  return ActiveStatusFilter.ALL
}
