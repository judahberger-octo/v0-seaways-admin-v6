"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  ChevronDown,
  X,
  ExternalLink,
  Clock,
  User,
  GitCompare,
  Flag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import {
  definitionChanges,
  flags,
  fieldDefinitions,
  vessels,
  type DefinitionChange,
  type Flag as FlagType,
} from "@/lib/admin-mock-data"

type TabId = "definition-changes" | "flag-activity"

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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Reason code labels
const REASON_LABELS: Record<FlagType["reason"], string> = {
  incorrect_value: "Incorrect Value",
  wrong_source: "Wrong Source",
  missing: "Missing",
  other: "Other",
}

export function AdminAuditLog() {
  const [activeTab, setActiveTab] = useState<TabId>("definition-changes")
  const [searchQuery, setSearchQuery] = useState("")
  const [fieldFilter, setFieldFilter] = useState("")
  const [authorFilter, setAuthorFilter] = useState("")
  const [dateRangeFilter, setDateRangeFilter] = useState("")
  const [selectedDiff, setSelectedDiff] = useState<DefinitionChange | null>(null)

  // Get unique authors from definition changes
  const authors = useMemo(() => {
    const authorSet = new Set<string>()
    definitionChanges.forEach(dc => authorSet.add(dc.changedBy))
    return Array.from(authorSet).sort()
  }, [])

  // Filter definition changes
  const filteredChanges = useMemo(() => {
    let data = [...definitionChanges]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(dc => {
        const field = fieldDefinitions.find(fd => fd.id === dc.fieldDefinitionId)
        return (
          field?.logicalName.toLowerCase().includes(query) ||
          dc.diffSummary.toLowerCase().includes(query)
        )
      })
    }

    if (fieldFilter) {
      data = data.filter(dc => dc.fieldDefinitionId === fieldFilter)
    }

    if (authorFilter) {
      data = data.filter(dc => dc.changedBy === authorFilter)
    }

    if (dateRangeFilter) {
      const now = new Date()
      let cutoff: Date
      switch (dateRangeFilter) {
        case "24h":
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoff = new Date(0)
      }
      data = data.filter(dc => new Date(dc.changedAt) >= cutoff)
    }

    return data
  }, [searchQuery, fieldFilter, authorFilter, dateRangeFilter])

  // Filter flag activity
  const filteredFlags = useMemo(() => {
    let data = [...flags].sort((a, b) => 
      new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime()
    )

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(f => {
        const field = fieldDefinitions.find(fd => fd.id === f.fieldDefinitionId)
        const vessel = vessels.find(v => v.id === f.vesselId)
        return (
          field?.logicalName.toLowerCase().includes(query) ||
          vessel?.name.toLowerCase().includes(query) ||
          f.reportId.toLowerCase().includes(query)
        )
      })
    }

    if (fieldFilter) {
      data = data.filter(f => f.fieldDefinitionId === fieldFilter)
    }

    if (dateRangeFilter) {
      const now = new Date()
      let cutoff: Date
      switch (dateRangeFilter) {
        case "24h":
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoff = new Date(0)
      }
      data = data.filter(f => new Date(f.flaggedAt) >= cutoff)
    }

    return data
  }, [searchQuery, fieldFilter, dateRangeFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setFieldFilter("")
    setAuthorFilter("")
    setDateRangeFilter("")
  }

  const hasActiveFilters = searchQuery || fieldFilter || authorFilter || dateRangeFilter

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[#0f172a]">Audit Log</h1>
            <p className="mt-1 text-sm text-[#64748b]">
              Track all definition changes and flag activity
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1">
            <button
              onClick={() => setActiveTab("definition-changes")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "definition-changes"
                  ? "bg-white text-[#0f172a] shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Definition changes
            </button>
            <button
              onClick={() => setActiveTab("flag-activity")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "flag-activity"
                  ? "bg-white text-[#0f172a] shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Flag activity
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={activeTab === "definition-changes" ? "Search by field or summary..." : "Search by field, vessel, or report..."}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>

              {/* Field filter */}
              <div className="relative">
                <select
                  value={fieldFilter}
                  onChange={e => setFieldFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="">All Fields</option>
                  {fieldDefinitions.slice(0, 30).map(fd => (
                    <option key={fd.id} value={fd.id}>{fd.logicalName}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              </div>

              {/* Author filter (only for definition changes tab) */}
              {activeTab === "definition-changes" && (
                <div className="relative">
                  <select
                    value={authorFilter}
                    onChange={e => setAuthorFilter(e.target.value)}
                    className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  >
                    <option value="">All Authors</option>
                    {authors.map(author => (
                      <option key={author} value={author}>{author}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                </div>
              )}

              {/* Date range filter */}
              <div className="relative">
                <select
                  value={dateRangeFilter}
                  onChange={e => setDateRangeFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="">All Time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
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

          {/* Content based on active tab */}
          {activeTab === "definition-changes" ? (
            <DefinitionChangesTab
              changes={filteredChanges}
              onViewDiff={setSelectedDiff}
            />
          ) : (
            <FlagActivityTab flags={filteredFlags} />
          )}
        </div>
      </div>

      {/* Version diff side panel */}
      {selectedDiff && (
        <VersionDiffPanel
          change={selectedDiff}
          onClose={() => setSelectedDiff(null)}
        />
      )}
    </div>
  )
}

// Definition changes tab content
interface DefinitionChangesTabProps {
  changes: DefinitionChange[]
  onViewDiff: (change: DefinitionChange) => void
}

function DefinitionChangesTab({ changes, onViewDiff }: DefinitionChangesTabProps) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_80px_120px_140px_2fr_100px] gap-4 border-b border-[#e2e8f0] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
        <span>Field</span>
        <span>Version</span>
        <span>Author</span>
        <span>When</span>
        <span>Change summary</span>
        <span></span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-[#f1f5f9]">
        {changes.map(change => {
          const field = fieldDefinitions.find(fd => fd.id === change.fieldDefinitionId)
          return (
            <div
              key={change.id}
              className="grid grid-cols-[2fr_80px_120px_140px_2fr_100px] gap-4 px-4 py-3 text-sm"
            >
              {/* Field name (link) */}
              <Link
                href={`/admin/field-definitions/${change.fieldDefinitionId}`}
                className="font-medium text-[#7c3aed] hover:underline"
              >
                {field?.logicalName || change.fieldDefinitionId}
              </Link>

              {/* Version */}
              <span className="font-mono text-[#334155]">v{change.toVersion}</span>

              {/* Author */}
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#94a3b8]" />
                <span className="text-[#64748b]">{change.changedBy}</span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1.5 text-[#64748b]">
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeTime(change.changedAt)}
              </div>

              {/* Diff summary */}
              <span className="truncate text-[#64748b]" title={change.diffSummary}>
                {change.diffSummary}
              </span>

              {/* View diff button */}
              <button
                onClick={() => onViewDiff(change)}
                className="flex items-center gap-1 text-sm font-medium text-[#7c3aed] hover:underline"
              >
                <GitCompare className="h-3.5 w-3.5" />
                View diff
              </button>
            </div>
          )
        })}

        {changes.length === 0 && (
          <div className="py-12 text-center">
            <GitCompare className="mx-auto h-10 w-10 text-[#d1d5db]" />
            <p className="mt-2 text-sm text-[#64748b]">No definition changes match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Flag activity tab content
interface FlagActivityTabProps {
  flags: FlagType[]
}

function FlagActivityTab({ flags: flagList }: FlagActivityTabProps) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white">
      {/* Table header */}
      <div className="grid grid-cols-[1.5fr_1.5fr_120px_100px_120px_140px] gap-4 border-b border-[#e2e8f0] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
        <span>Field</span>
        <span>Vessel / Report</span>
        <span>Reason</span>
        <span>Status</span>
        <span>By</span>
        <span>When</span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-[#f1f5f9]">
        {flagList.map(flag => {
          const field = fieldDefinitions.find(fd => fd.id === flag.fieldDefinitionId)
          const vessel = vessels.find(v => v.id === flag.vesselId)
          
          return (
            <div
              key={flag.id}
              className="grid grid-cols-[1.5fr_1.5fr_120px_100px_120px_140px] gap-4 px-4 py-3 text-sm"
            >
              {/* Field name (link) */}
              <Link
                href={`/admin/field-definitions/${flag.fieldDefinitionId}`}
                className="font-medium text-[#7c3aed] hover:underline"
              >
                {field?.logicalName || flag.fieldDefinitionId}
              </Link>

              {/* Vessel / Report */}
              <div>
                <p className="font-medium text-[#0f172a]">{vessel?.name || "Unknown"}</p>
                <p className="text-xs text-[#64748b]">{flag.reportId}</p>
              </div>

              {/* Reason */}
              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                flag.reason === "incorrect_value"
                  ? "bg-[#fee2e2] text-[#991b1b]"
                  : flag.reason === "wrong_source"
                    ? "bg-[#fef3c7] text-[#92400e]"
                    : flag.reason === "missing"
                      ? "bg-[#e0e7ff] text-[#4338ca]"
                      : "bg-[#f1f5f9] text-[#64748b]"
              }`}>
                {REASON_LABELS[flag.reason]}
              </span>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                {flag.status === "open" ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-[#f97316]" />
                    <span className="text-[#f97316]">Open</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                    <span className="text-[#22c55e]">Resolved</span>
                  </>
                )}
              </div>

              {/* Flagged by */}
              <span className="text-[#64748b]">{flag.flaggedBy}</span>

              {/* Timestamp */}
              <div className="flex items-center gap-1.5 text-[#64748b]">
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeTime(flag.flaggedAt)}
              </div>
            </div>
          )
        })}

        {flagList.length === 0 && (
          <div className="py-12 text-center">
            <Flag className="mx-auto h-10 w-10 text-[#d1d5db]" />
            <p className="mt-2 text-sm text-[#64748b]">No flag activity matches your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Version diff side panel
interface VersionDiffPanelProps {
  change: DefinitionChange
  onClose: () => void
}

function VersionDiffPanel({ change, onClose }: VersionDiffPanelProps) {
  const field = fieldDefinitions.find(fd => fd.id === change.fieldDefinitionId)

  // Mock diff data - in a real app this would come from comparing stored versions
  const diffItems = [
    { section: "Extraction", field: "extractionHint", before: "Look for 'Total ROB' in fuel table", after: "Look for 'IFO ROB' or 'Total ROB' in fuel consumption section" },
    { section: "Validation", field: "min_value", before: "0", after: "10" },
  ]

  return (
    <div className="w-[480px] flex-shrink-0 border-l border-[#e2e8f0] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Version diff</h2>
          <p className="mt-0.5 text-sm text-[#64748b]">
            v{change.fromVersion} → v{change.toVersion}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-6" style={{ height: "calc(100% - 73px)" }}>
        {/* Field info */}
        <div className="mb-6 rounded-lg bg-[#f8fafc] p-4">
          <p className="text-sm font-medium text-[#0f172a]">{field?.logicalName}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-[#64748b]">
            <span>Changed by: {change.changedBy}</span>
            <span>{formatDateTime(change.changedAt)}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#334155]">Summary</h3>
          <p className="mt-1 text-sm text-[#64748b]">{change.diffSummary}</p>
        </div>

        {/* Diff details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#334155]">Changes</h3>
          
          {diffItems.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-[#e2e8f0]">
              <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                <span className="text-xs font-medium text-[#64748b]">{item.section}</span>
                <span className="mx-2 text-[#d1d5db]">•</span>
                <span className="font-mono text-xs text-[#334155]">{item.field}</span>
              </div>
              <div className="divide-y divide-[#f1f5f9]">
                <div className="flex gap-3 bg-[#fef2f2] px-3 py-2">
                  <span className="flex-shrink-0 font-mono text-xs text-[#dc2626]">-</span>
                  <span className="text-sm text-[#991b1b]">{item.before}</span>
                </div>
                <div className="flex gap-3 bg-[#f0fdf4] px-3 py-2">
                  <span className="flex-shrink-0 font-mono text-xs text-[#22c55e]">+</span>
                  <span className="text-sm text-[#166534]">{item.after}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Link to field definition */}
        <div className="mt-6">
          <Link
            href={`/admin/field-definitions/${change.fieldDefinitionId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7c3aed] hover:underline"
          >
            View full definition
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
