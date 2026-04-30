"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserProvider, useUser } from "@/lib/user-context"

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Redirect crew users to report management
    if (currentUser.role === 'crew') {
      router.replace('/report-management')
    }
  }, [currentUser.role, router])

  // Don't render admin content for crew users
  if (currentUser.role === 'crew') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <p className="text-sm text-[#64748b]">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <AdminGuard>{children}</AdminGuard>
    </UserProvider>
  )
}
