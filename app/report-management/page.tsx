"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReportManagementPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main page which shows the report management UI
    router.replace('/')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <p className="text-sm text-[#64748b]">Loading report management...</p>
      </div>
    </div>
  )
}
