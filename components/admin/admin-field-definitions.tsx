"use client"

import { useState, useMemo } from "react"
import {
  Search,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Plus,
  X,
  ChevronDownIcon,
} from "lucide-react"
import {
  fieldDefinitions,
  targetForms,
  targetSystems,
  type FieldDefinition,
} from "@/lib/admin-mock-data"

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

// Data type color mapping
function getDataTypeColor(dataType: FieldDefinition["dataType"]): string {
  const colors: Record<FieldDefinition["dataType"], string> = {
    number: "bg-blue-100 text-blue-700",
    text: "bg-gray-100 text-gray-700",
    datetime: "bg-purple-100 text-purple-700",
    enum: "bg-amber-100 text-amber-700",
    latlong: "bg-green-100 text-green-700",
    duration: "bg-pink-100 text-pink-700",
  }
  return colors[dataType] || "bg-gray-100 text-gray-700"
}

type SortKey = "name" | "dataType" | "critical" | "mandatory" | "calculated" | "lastModified" | "version"
type SortDir = "asc" | "desc"

interface FilterState {
  forms: string[]
  dataTypes: FieldDefinition["dataType"][]
  critical: boolean | null
  mandatory: boolean | null
  calculated: boolean | null
}

interface AdminFieldDefinitionsProps {
  onSelectField?: (fieldId: string) => void
  onCreateField?: () => void
}

export function AdminFieldDefinitions({ onSelectField, onCreateField }: AdminFieldDefinitionsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [filters, setFilters] = useState<FilterState>({
    forms: [],
    dataTypes: [],
    critical: null,
    mandatory: null,
    calculated: null,
  })
  const [showFilters, setShowFilters] = useState(false)

  const activeSystem = targetSystems[0] // VesLink for v0

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = fieldDefinitions.filter((fd) => {
      // Search filter
      if (searchQuery && !fd.logicalName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Form filter
      if (filters.forms.length > 0 && !fd.appearsOnFormIds.some((f) => filters.forms.includes(f))) {
        return false
      }
      // Data type filter
      if (filters.dataTypes.length > 0 && !filters.dataTypes.includes(fd.dataType)) {
        return false
      }
      // Critical filter
      if (filters.critical !== null && fd.isCritical !== filters.critical) {
        return false
      }
      // Mandatory filter
      if (filters.mandatory !== null && fd.isMandatory !== filters.mandatory) {
        return false
      }
      // Calculated filter
      if (filters.calculated !== null && fd.isCalculated !== filters.calculated) {
        return false
      }
      return true
    })

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.logicalName.localeCompare(b.logicalName)
          break
        case "dataType":
          cmp = a.dataType.localeCompare(b.dataType)
          break
        case "critical":
          cmp = (a.isCritical ? 1 : 0) - (b.isCritical ? 1 : 0)
          break
        case "mandatory":
          cmp = (a.isMandatory ? 1 : 0) - (b.isMandatory ? 1 : 0)
          break
        case "calculated":
          cmp = (a.isCalculated ? 1 : 0) - (b.isCalculated ? 1 : 0)
          break
        case "lastModified":
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case "version":
          cmp = a.version - b.version
          break
      }
      return sortDir === "desc" ? -cmp : cmp
    })

    return result
  }, [searchQuery, filters, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null
    return sortDir === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
  }

  const handleRowClick = (fieldId: string) => {
    onSelectField?.(fieldId)
  }

  const activeFilterCount =
    filters.forms.length +
    filters.dataTypes.length +
    (filters.critical !== null ? 1 : 0) +
    (filters.mandatory !== null ? 1 : 0) +
    (filters.calculated !== null ? 1 : 0)

  const clearFilters = () => {
    setFilters({
      forms: [],
      dataTypes: [],
      critical: null,
      mandatory: null,
      calculated: null,
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#0f172a]">Field Definitions</h2>
          <span className="rounded-full bg-[#f3e8ff] px-3 py-1 text-xs font-medium text-[#7c3aed]">
            {activeSystem.name}
          </span>
          <span className="text-sm text-[#64748b]">{filteredData.length} fields</span>
        </div>
        <button 
          onClick={() => onCreateField?.()}
          className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9]"
        >
          <Plus className="h-4 w-4" />
          New field definition
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? "border-[#7c3aed] bg-[#f3e8ff] text-[#7c3aed]"
              : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
          }`}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7c3aed] text-xs text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#0f172a]"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <div className="grid grid-cols-5 gap-4">
            {/* Form Filter */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#64748b]">Forms</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {targetForms.map((form) => (
                  <label key={form.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.forms.includes(form.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, forms: [...filters.forms, form.id] })
                        } else {
                          setFilters({ ...filters, forms: filters.forms.filter((f) => f !== form.id) })
                        }
                      }}
                      className="rounded border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                    />
                    <span className="text-[#334155]">{form.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data Type Filter */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#64748b]">Data Type</label>
              <div className="space-y-1">
                {(["number", "text", "datetime", "enum", "latlong", "duration"] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.dataTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, dataTypes: [...filters.dataTypes, type] })
                        } else {
                          setFilters({ ...filters, dataTypes: filters.dataTypes.filter((t) => t !== type) })
                        }
                      }}
                      className="rounded border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                    />
                    <span className="text-[#334155] capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Critical Filter */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#64748b]">Critical</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="critical"
                    checked={filters.critical === null}
                    onChange={() => setFilters({ ...filters, critical: null })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">All</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="critical"
                    checked={filters.critical === true}
                    onChange={() => setFilters({ ...filters, critical: true })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">Yes</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="critical"
                    checked={filters.critical === false}
                    onChange={() => setFilters({ ...filters, critical: false })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">No</span>
                </label>
              </div>
            </div>

            {/* Mandatory Filter */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#64748b]">Mandatory</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mandatory"
                    checked={filters.mandatory === null}
                    onChange={() => setFilters({ ...filters, mandatory: null })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">All</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mandatory"
                    checked={filters.mandatory === true}
                    onChange={() => setFilters({ ...filters, mandatory: true })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">Yes</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mandatory"
                    checked={filters.mandatory === false}
                    onChange={() => setFilters({ ...filters, mandatory: false })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">No</span>
                </label>
              </div>
            </div>

            {/* Calculated Filter */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#64748b]">Calculated</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="calculated"
                    checked={filters.calculated === null}
                    onChange={() => setFilters({ ...filters, calculated: null })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">All</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="calculated"
                    checked={filters.calculated === true}
                    onChange={() => setFilters({ ...filters, calculated: true })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">Yes</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="calculated"
                    checked={filters.calculated === false}
                    onChange={() => setFilters({ ...filters, calculated: false })}
                    className="border-[#d1d5db] text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <span className="text-[#334155]">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.5fr_100px_100px_100px_100px_100px_80px] gap-4 border-b border-[#e2e8f0] px-4 py-3 text-sm font-medium text-[#64748b]">
          <button onClick={() => handleSort("name")} className="flex items-center gap-1 text-left hover:text-[#0f172a]">
            Field name <SortIcon columnKey="name" />
          </button>
          <span>Forms</span>
          <button
            onClick={() => handleSort("dataType")}
            className="flex items-center gap-1 text-left hover:text-[#0f172a]"
          >
            Data type <SortIcon columnKey="dataType" />
          </button>
          <button
            onClick={() => handleSort("critical")}
            className="flex items-center gap-1 text-left hover:text-[#0f172a]"
          >
            Critical <SortIcon columnKey="critical" />
          </button>
          <button
            onClick={() => handleSort("mandatory")}
            className="flex items-center gap-1 text-left hover:text-[#0f172a]"
          >
            Mandatory <SortIcon columnKey="mandatory" />
          </button>
          <button
            onClick={() => handleSort("calculated")}
            className="flex items-center gap-1 text-left hover:text-[#0f172a]"
          >
            Calculated <SortIcon columnKey="calculated" />
          </button>
          <button
            onClick={() => handleSort("lastModified")}
            className="flex items-center gap-1 text-left hover:text-[#0f172a]"
          >
            Modified <SortIcon columnKey="lastModified" />
          </button>
          <button
            onClick={() => handleSort("version")}
            className="flex items-center gap-1 justify-end hover:text-[#0f172a]"
          >
            Version <SortIcon columnKey="version" />
          </button>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#f1f5f9]">
          {filteredData.map((field) => {
            const formNames = field.appearsOnFormIds
              .map((formId) => targetForms.find((f) => f.id === formId)?.name)
              .filter(Boolean)

            return (
              <button
                key={field.id}
                onClick={() => handleRowClick(field.id)}
                className="grid w-full grid-cols-[2fr_1.5fr_100px_100px_100px_100px_100px_80px] gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-[#f8fafc]"
              >
                <span className="font-medium text-[#0f172a]">{field.logicalName}</span>
                <div className="flex flex-wrap gap-1">
                  {formNames.slice(0, 2).map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs text-[#64748b]"
                    >
                      {name}
                    </span>
                  ))}
                  {formNames.length > 2 && (
                    <span className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs text-[#64748b]">
                      +{formNames.length - 2}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDataTypeColor(field.dataType)}`}
                >
                  {field.dataType}
                </span>
                <span>
                  {field.isCritical && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#f97316]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Critical
                    </span>
                  )}
                </span>
                <span>
                  {field.isMandatory && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#22c55e]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Required
                    </span>
                  )}
                </span>
                <span>
                  {field.isCalculated && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#7c3aed]">
                      <Calculator className="h-3.5 w-3.5" />
                      Formula
                    </span>
                  )}
                </span>
                <span className="text-[#64748b]">{formatRelativeTime(field.updatedAt)}</span>
                <span className="text-right font-mono text-[#64748b]">v{field.version}</span>
              </button>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-[#64748b]">No fields match your filters.</p>
            <button onClick={clearFilters} className="mt-2 text-sm font-medium text-[#7c3aed] hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
