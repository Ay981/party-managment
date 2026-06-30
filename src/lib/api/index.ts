// src/lib/api/index.ts
//
// Single import point for all party API functions.
// Swap the export source to './party.api' when the real backend is ready.
// Nothing else in the codebase needs to change.
//
// Usage in hooks:
//   import { createParty, listCompanyParties } from '@/lib/api'
// ─────────────────────────────────────────────────────────────────────────────

export {
  createParty,
  updateCompanyParty,
  listCompanyParties,
  getCompanyPartyDetails,
  updatePartyStatus,
  deleteCompanyParty,
} from './party.mock'
