'use client'

import { AuthGuard, PermissionGate } from '@/components/auth/AuthRouteGuards'
import { AppShell } from '@/components/layout/AppShell'
import { UpdatePartyForm } from '@/features/party-management/components/PartyForm/UpdatePartyForm'
import { Permission } from '@/types/auth.types'

export function EditPartyPageClient({ partyId }: { partyId: string }) {
  return (
    <AuthGuard>
      <AppShell>
        <PermissionGate permission={Permission.UPDATE_PARTY}>
          <UpdatePartyForm partyId={partyId} />
        </PermissionGate>
      </AppShell>
    </AuthGuard>
  )
}
