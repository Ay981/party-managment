'use client'

import { AuthGuard, PermissionGate } from '@/components/auth/AuthRouteGuards'
import { AppShell } from '@/components/layout/AppShell'
import { CreatePartyForm } from '@/features/party-management/components/PartyForm/CreatePartyForm'
import { Permission } from '@/types/auth.types'

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
