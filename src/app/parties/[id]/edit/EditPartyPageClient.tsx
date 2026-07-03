'use client'

import { AuthGuard, PermissionGate } from '@/shared/components/auth/AuthRouteGuards'
import { AppShell } from '@/shared/components/layout/AppShell'
import { UpdatePartyForm } from '@/modules/party-management/components/PartyForm/UpdatePartyForm'
import { Permission } from '@/shared/types/auth.types'

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
