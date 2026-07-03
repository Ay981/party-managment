'use client'

import { AuthGuard, PermissionGate } from '@/shared/components/auth/AuthRouteGuards'
import { AppShell } from '@/shared/components/layout/AppShell'
import { PartyList } from '@/modules/party-management/components/PartyList/PartyList'
import { Permission } from '@/shared/types/auth.types'

export function PartiesPageClient() {
  return (
    <AuthGuard>
      <AppShell>
        <PermissionGate permission={Permission.VIEW_PARTIES}>
          <PartyList />
        </PermissionGate>
      </AppShell>
    </AuthGuard>
  )
}
