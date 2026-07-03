'use client'

import { AuthGuard, PermissionGate } from '@/shared/components/auth/AuthRouteGuards'
import { AppShell } from '@/shared/components/layout/AppShell'
import { CreatePartyForm } from '@/modules/party-management/components/PartyForm/CreatePartyForm'
import { Permission } from '@/shared/types/auth.types'

export function CreatePartyPageClient() {
  return (
    <AuthGuard>
      <AppShell>
        <PermissionGate permission={Permission.CREATE_PARTY}>
          <CreatePartyForm />
        </PermissionGate>
      </AppShell>
    </AuthGuard>
  )
}
