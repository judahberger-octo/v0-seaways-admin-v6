"use client"

import { useParams, useRouter } from "next/navigation"
import { AdminFieldDetail } from "@/components/admin/admin-field-detail"

export default function FieldDefinitionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fieldId = params.id as string

  return (
    <div className="h-screen overflow-y-auto bg-[#f8fafc]">
      <AdminFieldDetail 
        fieldId={fieldId} 
        onBack={() => router.back()} 
      />
    </div>
  )
}
