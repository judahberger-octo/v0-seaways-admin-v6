"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  X,
  Ship,
  Clock,
} from "lucide-react"
import {
  vessels,
  crewUsers,
  submissions,
  targetSystems,
  type Vessel,
  type CrewUser,
} from "@/lib/admin-mock-data"

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// Vessel row data with computed stats
interface VesselRowData {
  vessel: Vessel
  crewUsers: CrewUser[]
  submissions30d: number
  adoptionPercent: number
  lastActivity: string | null
}

type SortKey = "name" | "imo" | "crew" | "submissions" | "adoption" | "lastActivity"
type SortDir = "asc" | "desc"
type AdoptionBucket = "all" | "high" | "medium" | "low" | "zero"

// Calculate last 30 days range
const now = new Date()
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

export function AdminVessels() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [systemFilter, setSystemFilter] = useState("")
  const [adoptionFilter, setAdoptionFilter] = useState<AdoptionBucket>("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  
  // Virtualization state
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const rowHeight = 64
  const headerHeight = 48
  const visibleRowCount = 15

  // Compute vessel row data
  const vesselData = useMemo(() => {
    return vessels.map(vessel => {
      const vesselCrew = crewUsers.filter(cu => cu.vesselId === vessel.id)
      const vesselSubmissions = submissions.filter(s => {
        const submitDate = new Date(s.submittedAt)
        return s.vesselId === vessel.id && submitDate >= thirtyDaysAgo
      })
      
      // Calculate adoption % (submissions / expected reports in 30 days)
      // Assume ~2 reports per day expected = ~60 reports in 30 days
      const expectedReports = 60
      const adoptionPercent = Math.min(100, Math.round((vesselSubmissions.length / expectedReports) * 100))
      
      // Get last activity from most recent submission or crew activity
      const lastSubmission = submissions
        .filter(s => s.vesselId === vessel.id)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]
      const lastCrewActivity = vesselCrew
        .filter(cu => cu.lastActivityAt)
        .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime())[0]
      
      let lastActivity: string | null = null
      if (lastSubmission && lastCrewActivity?.lastActivityAt) {
        lastActivity = new Date(lastSubmission.submittedAt) > new Date(lastCrewActivity.lastActivityAt)
          ? lastSubmission.submittedAt
          : lastCrewActivity.lastActivityAt
      } else if (lastSubmission) {
        lastActivity = lastSubmission.submittedAt
      } else if (lastCrewActivity?.lastActivityAt) {
        lastActivity = lastCrewActivity.lastActivityAt
      }
      
      return {
        vessel,
        crewUsers: vesselCrew,
        submissions30d: vesselSubmissions.length,
        adoptionPercent,
        lastActivity,
      }
    })
  }, [])

  // Filter and sort
  const filteredData = useMemo(() => {
    let data = [...vesselData]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(d => 
        d.vessel.name.toLowerCase().includes(query) ||
        d.vessel.imo.includes(query)
      )
    }

    // System filter
    if (systemFilter) {
      data = data.filter(d => d.vessel.targetSystemIds.includes(systemFilter))
    }

    // Adoption bucket filter
    switch (adoptionFilter) {
      case "high":
        data = data.filter(d => d.adoptionPercent >= 80)
        break
      case "medium":
        data = data.filter(d => d.adoptionPercent >= 30 && d.adoptionPercent < 80)
        break
      case "low":
        data = data.filter(d => d.adoptionPercent > 0 && d.adoptionPercent < 30)
        break
      case "zero":
        data = data.filter(d => d.adoptionPercent === 0)
        break
    }

    // Sort
    data.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.vessel.name.localeCompare(b.vessel.name)
          break
        case "imo":
          cmp = a.vessel.imo.localeCompare(b.vessel.imo)
          break
        case "crew":
          cmp = a.crewUsers.length - b.crewUsers.length
          break
        case "submissions":
          cmp = a.submissions30d - b.submissions30d
          break
        case "adoption":
          cmp = a.adoptionPercent - b.adoptionPercent
          break
        case "lastActivity":
          const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
          const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
          cmp = aTime - bTime
          break
      }
      return sortDir === "desc" ? -cmp : cmp
    })

    return data
  }, [vesselData, searchQuery, systemFilter, adoptionFilter, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir(key === "name" || key === "imo" ? "asc" : "desc")
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSystemFilter("")
    setAdoptionFilter("all")
  }

  const hasActiveFilters = searchQuery || systemFilter || adoptionFilter !== "all"

  // Virtualization calculations
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const startIndex = Math.floor(scrollTop / rowHeight)
  const endIndex = Math.min(startIndex + visibleRowCount + 2, filteredData.length)
  const visibleData = filteredData.slice(startIndex, endIndex)
  const totalHeight = filteredData.length * rowHeight
  const offsetY = startIndex * rowHeight

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-[#94a3b8]" />
    return sortDir === "desc" 
      ? <ChevronDown className="h-3.5 w-3.5 text-[#7c3aed]" />
      : <ChevronUp className="h-3.5 w-3.5 text-[#7c3aed]" />
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0f172a]">Vessels</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            {vessels.length} vessels in the fleet
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 rounded-xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by vessel name or IMO..."
                className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              />
            </div>

            {/* System filter */}
            <div className="relative">
              <select
                value={systemFilter}
                onChange={e => setSystemFilter(e.target.value)}
                className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              >
                <option value="">All Systems</option>
                {targetSystems.map(sys => (
                  <option key={sys.id} value={sys.id}>{sys.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Adoption filter */}
            <div className="relative">
              <select
                value={adoptionFilter}
                onChange={e => setAdoptionFilter(e.target.value as AdoptionBucket)}
                className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              >
                <option value="all">All Adoption</option>
                <option value="high">High (≥80%)</option>
                <option value="medium">Medium (30-79%)</option>
                <option value="low">Low (&lt;30%)</option>
                <option value="zero">None (0%)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-2 text-sm text-[#64748b]">
          {filteredData.length} vessel{filteredData.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Virtualized table */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full rounded-xl border border-[#e2e8f0] bg-white">
          {/* Table header */}
          <div 
            className="grid grid-cols-[2fr_100px_1fr_140px_100px_140px_120px] gap-4 border-b border-[#e2e8f0] px-4"
            style={{ height: headerHeight }}
          >
            <button
              onClick={() => handleSort("name")}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              Vessel Name
              <SortIcon column="name" />
            </button>
            <button
              onClick={() => handleSort("imo")}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              IMO
              <SortIcon column="imo" />
            </button>
            <span className="flex items-center text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Target Systems
            </span>
            <button
              onClick={() => handleSort("crew")}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              Crew
              <SortIcon column="crew" />
            </button>
            <button
              onClick={() => handleSort("submissions")}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              30d
              <SortIcon column="submissions" />
            </button>
            <button
              onClick={() => handleSort("adoption")}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              Adoption
              <SortIcon column="adoption" />
            </button>
            <button
              onClick={() => handleSort("lastActivity")}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              Last Active
              <SortIcon column="lastActivity" />
            </button>
          </div>

          {/* Scrollable body */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ height: `calc(100% - ${headerHeight}px)` }}
          >
            <div style={{ height: totalHeight, position: "relative" }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleData.map(data => (
                  <VesselRow
                    key={data.vessel.id}
                    data={data}
                    height={rowHeight}
                    onClick={() => router.push(`/admin/vessels/${data.vessel.id}`)}
                  />
                ))}
              </div>
            </div>

            {filteredData.length === 0 && (
              <div className="flex h-48 items-center justify-center">
                <div className="text-center">
                  <Ship className="mx-auto h-10 w-10 text-[#d1d5db]" />
                  <p className="mt-2 text-sm text-[#64748b]">No vessels match your filters</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual vessel row
interface VesselRowProps {
  data: VesselRowData
  height: number
  onClick: () => void
}

function VesselRow({ data, height, onClick }: VesselRowProps) {
  const { vessel, crewUsers: crew, submissions30d, adoptionPercent, lastActivity } = data

  // Get adoption bar color
  const getAdoptionColor = (pct: number) => {
    if (pct >= 80) return "bg-[#22c55e]"
    if (pct >= 30) return "bg-[#eab308]"
    if (pct > 0) return "bg-[#f97316]"
    return "bg-[#e2e8f0]"
  }

  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[2fr_100px_1fr_140px_100px_140px_120px] gap-4 border-b border-[#f1f5f9] px-4 text-left transition-colors hover:bg-[#f8fafc]"
      style={{ height }}
    >
      {/* Vessel name */}
      <div className="flex items-center">
        <span className="font-medium text-[#0f172a]">{vessel.name}</span>
      </div>

      {/* IMO */}
      <div className="flex items-center">
        <span className="font-mono text-sm text-[#64748b]">{vessel.imo}</span>
      </div>

      {/* Target systems */}
      <div className="flex items-center gap-1">
        {vessel.targetSystemIds.map(sysId => {
          const sys = targetSystems.find(s => s.id === sysId)
          return (
            <span
              key={sysId}
              className="rounded-full bg-[#e0e7ff] px-2 py-0.5 text-xs font-medium text-[#4338ca]"
            >
              {sys?.name || sysId}
            </span>
          )
        })}
      </div>

      {/* Crew */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#334155]">{crew.length}</span>
        <div className="flex -space-x-1.5">
          {crew.slice(0, 3).map((cu, idx) => (
            <div
              key={cu.id}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#f1f5f9] text-[10px] font-medium text-[#64748b]"
              style={{ zIndex: 3 - idx }}
              title={cu.name}
            >
              {cu.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
          ))}
          {crew.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#e2e8f0] text-[10px] font-medium text-[#64748b]">
              +{crew.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Submissions 30d */}
      <div className="flex items-center">
        <span className="text-sm text-[#334155]">{submissions30d}</span>
      </div>

      {/* Adoption */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-[#e2e8f0]">
          <div
            className={`h-full ${getAdoptionColor(adoptionPercent)}`}
            style={{ width: `${adoptionPercent}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${
          adoptionPercent >= 80 ? "text-[#22c55e]" :
          adoptionPercent >= 30 ? "text-[#eab308]" :
          adoptionPercent > 0 ? "text-[#f97316]" : "text-[#94a3b8]"
        }`}>
          {adoptionPercent}%
        </span>
      </div>

      {/* Last activity */}
      <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
        {lastActivity ? (
          <>
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(lastActivity)}
          </>
        ) : (
          <span className="text-[#94a3b8]">Never</span>
        )}
      </div>
    </button>
  )
}
