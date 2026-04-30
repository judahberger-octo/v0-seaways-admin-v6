"use client"

import { useParams, useRouter } from "next/navigation"
import { TransferReview } from "@/components/transfer-review"
import { submissions, vessels } from "@/lib/admin-mock-data"

export default function AdminReportViewPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.reportId as string

  // Find the submission and vessel
  const submission = submissions.find(s => s.reportId === reportId) || submissions[0]
  const vessel = vessels.find(v => v.id === submission?.vesselId) || vessels[0]

  return (
    <TransferReview
      reportId={reportId}
      onBack={() => router.back()}
      isAdminMode={true}
      isReadOnly={true}
      adminReadOnlyView={true}
      vesselName={vessel?.name}
      submittedAt={submission?.submittedAt}
      submittedBy={submission?.submittedBy}
    />
  )
}
