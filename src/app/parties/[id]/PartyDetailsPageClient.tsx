'use client'

import { AuthGuard, PermissionGate } from '@/shared/components/auth/AuthRouteGuards'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PartyDetails } from '@/modules/party-management/components/PartyDetails/PartyDetails'
import { Permission } from '@/shared/types/auth.types'

export function PartyDetailsPageClient({ partyId }: { partyId: string }) {
  return (
    <AuthGuard>
      <AppShell>
        <PermissionGate permission={Permission.VIEW_PARTY}>
          <PartyDetails partyId={partyId} />
        </PermissionGate>
      </AppShell>
    </AuthGuard>
  )
}
