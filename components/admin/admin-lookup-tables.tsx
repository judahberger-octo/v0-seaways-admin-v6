"use client"

import { Table } from "lucide-react"

export function AdminLookupTables() {
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#0f172a]">Lookup Tables</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Manage value mapping tables used by Lookup transforms
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-12 text-center">
        <div className="w-12 h-12 bg-[#f1f5f9] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Table className="w-6 h-6 text-[#64748b]" />
        </div>
        <h3 className="text-base font-medium text-[#0f172a] mb-2">No tables yet</h3>
        <p className="text-sm text-[#64748b] max-w-md mx-auto">
          Lookup tables will appear here once created. They map source values to target values for field transformations.
        </p>
      </div>
    </div>
  )
}
