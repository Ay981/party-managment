'use client'

import { AuthGuard, PermissionGate } from '@/components/auth/AuthRouteGuards'
import { AppShell } from '@/components/layout/AppShell'
import { PartyList } from '@/features/party-management/components/PartyList/PartyList'
import { Permission } from '@/types/auth.types'

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
