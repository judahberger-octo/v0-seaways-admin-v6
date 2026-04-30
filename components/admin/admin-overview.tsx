"use client"

import { ShieldCheck } from "lucide-react"

// Placeholder admin overview - will be expanded in later prompts
export function AdminOverview() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#f3e8ff] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#7c3aed]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">Admin Overview</h1>
          <p className="text-sm text-[#64748b]">Monitor extraction performance and manage field definitions</p>
        </div>
      </div>
      
      {/* Placeholder content - will be replaced with KPI strip and charts in later prompts */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 text-center">
        <p className="text-[#64748b]">Admin dashboard content coming soon...</p>
      </div>
    </div>
  )
}
