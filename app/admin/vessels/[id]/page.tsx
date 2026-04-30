import { AdminVesselDetail } from "@/components/admin/admin-vessel-detail"

interface VesselDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function VesselDetailPage({ params }: VesselDetailPageProps) {
  const { id } = await params
  return <AdminVesselDetail vesselId={id} />
}
