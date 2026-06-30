import { PartyDetailsPageClient } from './PartyDetailsPageClient'

interface PartyDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function PartyDetailsPage({ params }: PartyDetailsPageProps) {
  const { id } = await params

  return <PartyDetailsPageClient partyId={id} />
}
