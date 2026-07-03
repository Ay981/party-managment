import { create } from 'zustand'

import type {
  PartyFilters,
  ModalState,
  CompanyParty,
} from '@/modules/party-management/types'

import { ActiveStatusFilter } from '@/modules/party-management/types'

export const DEFAULT_FILTERS: PartyFilters = {
  search:     '',
  isCustomer: null,
  isVendor:   null,
  isActive:   null,
  page:       1,
  perPage:    10,
}

const DEFAULT_MODAL: ModalState = {
  type:  null,
  party: null,
}

interface PartyStoreState {
  filters: PartyFilters
  modal: ModalState

  setFilter: <K extends keyof PartyFilters>(
    key: K,
    value: PartyFilters[K]
  ) => void
  setPage: (page: number) => void
  resetFilters: () => void
  applySearch: (term: string) => void
  toggleCustomerFilter: () => void
  toggleVendorFilter: () => void
  setStatusFilter: (status: ActiveStatusFilter) => void

  openModal: (
    type: ModalState['type'],
    party: Pick<CompanyParty, 'id' | 'partyName' | 'tin'>
  ) => void
  closeModal: () => void
}

// UI state only; fetched party data lives in React Query.
export const usePartyStore = create<PartyStoreState>()((set, get) => ({
  filters: { ...DEFAULT_FILTERS },
  modal:   { ...DEFAULT_MODAL  },

  setFilter: (key, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [key]: value,
        // Changing filters resets pagination to avoid empty later pages.
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
        page:   1,
      },
    }))
  },

  toggleCustomerFilter: () => {
    const current = get().filters.isCustomer
    set(state => ({
      filters: {
        ...state.filters,
        isCustomer: current === true ? null : true,
        page:       1,
      },
    }))
  },

  toggleVendorFilter: () => {
    const current = get().filters.isVendor
    set(state => ({
      filters: {
        ...state.filters,
        isVendor: current === true ? null : true,
        page:     1,
      },
    }))
  },

  setStatusFilter: (status) => {
    // Convert the dropdown enum into the API's boolean/null filter.
    const isActive =
      status === ActiveStatusFilter.ACTIVE   ? true  :
      status === ActiveStatusFilter.INACTIVE ? false :
      null

    set(state => ({
      filters: {
        ...state.filters,
        isActive,
        page: 1,
      },
    }))
  },

  openModal: (type, party) => {
    set({
      modal: { type, party },
    })
  },

  closeModal: () => {
    set({ modal: { ...DEFAULT_MODAL } })
  },
}))

export const selectFilters     = (s: PartyStoreState): PartyFilters => s.filters
export const selectModal       = (s: PartyStoreState): ModalState   => s.modal
export const selectSearch      = (s: PartyStoreState): string       => s.filters.search
export const selectPage        = (s: PartyStoreState): number       => s.filters.page
export const selectPerPage     = (s: PartyStoreState): number       => s.filters.perPage
export const selectIsModalOpen = (s: PartyStoreState): boolean      => s.modal.type !== null

export const selectStatusFilter = (s: PartyStoreState): ActiveStatusFilter => {
  const { isActive } = s.filters
  if (isActive === true)  return ActiveStatusFilter.ACTIVE
  if (isActive === false) return ActiveStatusFilter.INACTIVE
  return ActiveStatusFilter.ALL
}
