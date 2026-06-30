'use client'

import { AuthGuard, PermissionGate } from '@/components/auth/AuthRouteGuards'
import { AppShell } from '@/components/layout/AppShell'
import { PartyDetails } from '@/features/party-management/components/PartyDetails/PartyDetails'
import { Permission } from '@/types/auth.types'

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
