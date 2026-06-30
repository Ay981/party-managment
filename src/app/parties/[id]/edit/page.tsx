import { EditPartyPageClient } from './EditPartyPageClient'

interface EditPartyPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPartyPage({ params }: EditPartyPageProps) {
  const { id } = await params

  return <EditPartyPageClient partyId={id} />
}
