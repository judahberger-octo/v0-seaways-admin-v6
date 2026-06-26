"use client"

import { useState, useMemo } from "react"
import { Search, Ship, Users, Settings2, RefreshCw } from "lucide-react"
import { vessels } from "@/lib/admin-mock-data"
import { managedUsers } from "@/lib/managed-users"

// Vessel Groups page (SOLD-1502): lists vessels auto-populated from the Navtor
// integration. Each row shows the vessel, its assigned crew count, and a manage
// action. Reuses the existing Groups concept, tailored for vessels.
export function AdminVesselGroups() {
  const [searchQuery, setSearchQuery] = useState("")

  // Crew counts derived from managed users assigned to each vessel
  const rows = useMemo(() => {
    return vessels.map((vessel) => {
      const assignedCrew = managedUsers.filter((u) => u.vesselId === vessel.id)
      return {
        vessel,
        crewCount: assignedCrew.length,
        crewNames: assignedCrew.map((u) => u.name),
      }
    })
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter(
      (r) => r.vessel.name.toLowerCase().includes(q) || r.vessel.imo.includes(q),
    )
  }, [rows, searchQuery])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#0f172a]">Vessel Groups</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#64748b]">
              <RefreshCw className="h-3.5 w-3.5" />
              {vessels.length} vessels auto-populated from the Navtor API
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 rounded-xl border border-[#e2e8f0] bg-white p-4">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vessel name or IMO..."
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>
        </div>

        <div className="mb-2 text-sm text-[#64748b]">
          {filtered.length} vessel{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-xl border border-[#e2e8f0] bg-white">
          {/* Header */}
          <div className="grid grid-cols-[2fr_120px_1fr_120px] gap-4 border-b border-[#e2e8f0] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Vessel</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">IMO</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Assigned Crew</span>
            <span className="text-right text-xs font-semibold uppercase tracking-wide text-[#64748b]">Actions</span>
          </div>

          {/* Rows */}
          {filtered.map(({ vessel, crewCount, crewNames }) => (
            <div
              key={vessel.id}
              className="grid grid-cols-[2fr_120px_1fr_120px] items-center gap-4 border-b border-[#f1f5f9] px-4 py-3 last:border-b-0 hover:bg-[#f8fafc]"
            >
              {/* Vessel name */}
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#64748b]">
                  <Ship className="h-4 w-4" />
                </span>
                <span className="font-medium text-[#0f172a]">{vessel.name}</span>
              </div>

              {/* IMO */}
              <span className="font-mono text-sm text-[#64748b]">{vessel.imo}</span>

              {/* Crew count */}
              <div className="flex items-center gap-1.5 text-sm text-[#334155]" title={crewNames.join(", ")}>
                <Users className="h-3.5 w-3.5 text-[#94a3b8]" />
                {crewCount === 0 ? (
                  <span className="text-[#94a3b8]">No crew assigned</span>
                ) : (
                  <span>
                    {crewCount} crew member{crewCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Manage */}
              <div className="flex justify-end">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-medium text-[#334155] transition-colors hover:bg-[#f1f5f9]">
                  <Settings2 className="h-3.5 w-3.5" />
                  Manage
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex h-48 items-center justify-center">
              <div className="text-center">
                <Ship className="mx-auto h-10 w-10 text-[#d1d5db]" />
                <p className="mt-2 text-sm text-[#64748b]">No vessels match your search</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
