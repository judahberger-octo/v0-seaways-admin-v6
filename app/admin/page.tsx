"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This page redirects to the main admin dashboard
// The admin layout handles role-based protection
export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main page with admin view - the actual admin UI is rendered there
    router.replace('/?view=admin')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <p className="text-sm text-[#64748b]">Loading admin dashboard...</p>
      </div>
    </div>
  )
}
