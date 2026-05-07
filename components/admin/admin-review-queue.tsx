"use client"

import { useState, useMemo } from "react"
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  X,
  Clock,
} from "lucide-react"
import {
  flags,
  fieldDefinitions,
  targetForms,
  targetSystems,
  vessels,
  type Flag,
  type FieldDefinition,
} from "@/lib/admin-mock-data"
import { FieldFlagDrawer } from "./field-flag-drawer"

// Reason code labels
const REASON_LABELS: Record<Flag["reason"], string> = {
  incorrect_value: "Incorrect Value",
  wrong_source: "Wrong Source",
  missing: "Missing",
  other: "Other",
}

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
  return `${Math.floor(diffDays / 7)}w ago`
}

// Aggregated field row data
interface AggregatedFieldRow {
  fieldId: string
  fieldName: string
  flagCount: number
  formIds: string[]
  vesselIds: string[]
  lastFlaggedAt: string
  mostCommonReason: Flag["reason"]
  openFlags: Flag[]
}

type SortKey = "flagCount" | "fieldName" | "lastFlagged"
type SortDir = "asc" | "desc"

export function AdminReviewQueue() {
  const [searchQuery, setSearchQuery] = useState("")
  const [formFilter, setFormFilter] = useState<string>("")
  const [systemFilter, setSystemFilter] = useState<string>("")
  const [reasonFilter, setReasonFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("both")
  const [vesselFilter, setVesselFilter] = useState<string>("")
  const [sortKey, setSortKey] = useState<SortKey>("flagCount")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  // Aggregate flags by field
  const aggregatedRows = useMemo(() => {
    // Filter to open flags only
    const openFlags = flags.filter(f => f.status === "open")
    
    // Apply filters
    const filteredFlags = openFlags.filter(flag => {
      if (statusFilter === "submitted" && flag.reportStatus !== "submitted") return false
      if (statusFilter === "draft" && flag.reportStatus !== "draft") return false
      if (reasonFilter && flag.reason !== reasonFilter) return false
      if (vesselFilter && flag.vesselId !== vesselFilter) return false
      return true
    })

    // Group by field
    const fieldMap = new Map<string, AggregatedFieldRow>()

    filteredFlags.forEach(flag => {
      const fieldDef = fieldDefinitions.find(fd => fd.id === flag.fieldDefinitionId)
      if (!fieldDef) return

      // Apply form filter
      if (formFilter && !fieldDef.appearsOnFormIds.includes(formFilter)) return

      // Apply system filter
      if (systemFilter && fieldDef.targetSystemId !== systemFilter) return

      const existing = fieldMap.get(flag.fieldDefinitionId)
      if (existing) {
        existing.flagCount++
        if (!existing.vesselIds.includes(flag.vesselId)) {
          existing.vesselIds.push(flag.vesselId)
        }
        if (new Date(flag.flaggedAt) > new Date(existing.lastFlaggedAt)) {
          existing.lastFlaggedAt = flag.flaggedAt
        }
        existing.openFlags.push(flag)
      } else {
        fieldMap.set(flag.fieldDefinitionId, {
          fieldId: flag.fieldDefinitionId,
          fieldName: fieldDef.logicalName,
          flagCount: 1,
          formIds: fieldDef.appearsOnFormIds,
          vesselIds: [flag.vesselId],
          lastFlaggedAt: flag.flaggedAt,
          mostCommonReason: flag.reason,
          openFlags: [flag],
        })
      }
    })

    // Calculate most common reason for each field
    fieldMap.forEach(row => {
      const reasonCounts = new Map<Flag["reason"], number>()
      row.openFlags.forEach(flag => {
        reasonCounts.set(flag.reason, (reasonCounts.get(flag.reason) || 0) + 1)
      })
      let maxCount = 0
      let mostCommon: Flag["reason"] = "other"
      reasonCounts.forEach((count, reason) => {
        if (count > maxCount) {
          maxCount = count
          mostCommon = reason
        }
      })
      row.mostCommonReason = mostCommon
    })

    // Apply search filter
    let rows = Array.from(fieldMap.values())
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      rows = rows.filter(row => row.fieldName.toLowerCase().includes(query))
    }

    // Sort
    rows.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "flagCount":
          cmp = a.flagCount - b.flagCount
          break
        case "fieldName":
          cmp = a.fieldName.localeCompare(b.fieldName)
          break
        case "lastFlagged":
          cmp = new Date(a.lastFlaggedAt).getTime() - new Date(b.lastFlaggedAt).getTime()
          break
      }
      return sortDir === "desc" ? -cmp : cmp
    })

    return rows
  }, [searchQuery, formFilter, systemFilter, reasonFilter, statusFilter, vesselFilter, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-[#94a3b8]" />
    return sortDir === "desc" 
      ? <ChevronDown className="h-3.5 w-3.5 text-[#7c3aed]" />
      : <ChevronUp className="h-3.5 w-3.5 text-[#7c3aed]" />
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFormFilter("")
    setSystemFilter("")
    setReasonFilter("")
    setStatusFilter("both")
    setVesselFilter("")
  }

  const hasActiveFilters = searchQuery || formFilter || systemFilter || reasonFilter || statusFilter !== "both" || vesselFilter

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto p-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0f172a]">Review Queue</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Manage flagged field mappings across all reports
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by field name..."
                className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              />
            </div>

            {/* Form filter */}
            <div className="relative">
              <select
                value={formFilter}
                onChange={e => setFormFilter(e.target.value)}
                className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              >
                <option value="">All Forms</option>
                {targetForms.map(form => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
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

            {/* Reason filter */}
            <div className="relative">
              <select
                value={reasonFilter}
                onChange={e => setReasonFilter(e.target.value)}
                className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              >
                <option value="">All Reasons</option>
                <option value="incorrect_value">Incorrect Value</option>
                <option value="wrong_source">Wrong Source</option>
                <option value="missing">Missing</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Report status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              >
                <option value="both">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="draft">Draft</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            </div>

            {/* Vessel filter */}
            <div className="relative">
              <select
                value={vesselFilter}
                onChange={e => setVesselFilter(e.target.value)}
                className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              >
                <option value="">All Vessels</option>
                {vessels.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
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
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            {aggregatedRows.length} fields with open flags
          </p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_80px_1.5fr_1.5fr_120px_140px] gap-4 border-b border-[#e2e8f0] px-4 py-3">
            <button
              onClick={() => handleSort("fieldName")}
              className="flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              Field Name
              <SortIcon column="fieldName" />
            </button>
            <button
              onClick={() => handleSort("flagCount")}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              Flags
              <SortIcon column="flagCount" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Forms
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Vessels Affected
            </span>
            <button
              onClick={() => handleSort("lastFlagged")}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
            >
              Last Flagged
              <SortIcon column="lastFlagged" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Top Reason
            </span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-[#f1f5f9]">
            {aggregatedRows.map(row => (
              <button
                key={row.fieldId}
                onClick={() => setSelectedFieldId(row.fieldId)}
                className="grid w-full grid-cols-[2fr_80px_1.5fr_1.5fr_120px_140px] gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#f8fafc]"
              >
                {/* Field name */}
                <span className="font-medium text-[#0f172a]">{row.fieldName}</span>

                {/* Flag count badge */}
                <div className="flex justify-center">
                  <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full bg-[#7c3aed] px-2.5 text-sm font-bold text-white">
                    {row.flagCount}
                  </span>
                </div>

                {/* Forms chips */}
                <div className="flex flex-wrap gap-1">
                  {row.formIds.slice(0, 2).map(formId => {
                    const form = targetForms.find(f => f.id === formId)
                    return (
                      <span
                        key={formId}
                        className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs text-[#64748b]"
                      >
                        {form?.shortName || form?.name || formId}
                      </span>
                    )
                  })}
                  {row.formIds.length > 2 && (
                    <span className="text-xs text-[#94a3b8]">
                      +{row.formIds.length - 2}
                    </span>
                  )}
                </div>

                {/* Vessels affected */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#334155]">
                    {row.vesselIds.length}
                  </span>
                  <div className="flex -space-x-1">
                    {row.vesselIds.slice(0, 3).map((vesselId, idx) => {
                      const vessel = vessels.find(v => v.id === vesselId)
                      return (
                        <span
                          key={vesselId}
                          className="flex h-6 items-center rounded-full bg-[#e0e7ff] px-2 text-xs font-medium text-[#4338ca]"
                          style={{ zIndex: 3 - idx }}
                          title={vessel?.name}
                        >
                          {vessel?.name.split(" ")[1]?.substring(0, 3) || "???"}
                        </span>
                      )
                    })}
                    {row.vesselIds.length > 3 && (
                      <span className="flex h-6 items-center rounded-full bg-[#f1f5f9] px-2 text-xs text-[#64748b]">
                        +{row.vesselIds.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Last flagged */}
                <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(row.lastFlaggedAt)}
                </div>

                {/* Most common reason */}
                <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  row.mostCommonReason === "incorrect_value"
                    ? "bg-[#fee2e2] text-[#991b1b]"
                    : row.mostCommonReason === "wrong_source"
                      ? "bg-[#fef3c7] text-[#92400e]"
                      : row.mostCommonReason === "missing"
                        ? "bg-[#e0e7ff] text-[#4338ca]"
                        : "bg-[#f1f5f9] text-[#64748b]"
                }`}>
                  {REASON_LABELS[row.mostCommonReason]}
                </span>
              </button>
            ))}

            {aggregatedRows.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-[#64748b]">No fields with open flags match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field flag drawer */}
      {selectedFieldId && (
        <FieldFlagDrawer
          fieldId={selectedFieldId}
          onClose={() => setSelectedFieldId(null)}
        />
      )}
    </div>
  )
}
