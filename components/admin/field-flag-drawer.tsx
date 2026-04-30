"use client"

import { useState } from "react"
import Link from "next/link"
import {
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
} from "lucide-react"
import {
  fieldDefinitions,
  flags,
  targetSystems,
  targetForms,
  vessels,
  type Flag,
  type FieldDefinition,
} from "@/lib/admin-mock-data"

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

interface FieldFlagDrawerProps {
  fieldId: string
  onClose: () => void
}

export function FieldFlagDrawer({ fieldId, onClose }: FieldFlagDrawerProps) {
  const [isDefinitionExpanded, setIsDefinitionExpanded] = useState(true)
  const [selectedFlagIds, setSelectedFlagIds] = useState<Set<string>>(new Set())
  const [fixedFlagIds, setFixedFlagIds] = useState<Set<string>>(new Set())

  const field = fieldDefinitions.find(fd => fd.id === fieldId)
  const openFlags = flags
    .filter(f => f.fieldDefinitionId === fieldId && f.status === "open" && !fixedFlagIds.has(f.id))
    .sort((a, b) => new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime())
  
  const targetSystem = field ? targetSystems.find(ts => ts.id === field.targetSystemId) : null

  if (!field) return null

  const toggleFlagSelection = (flagId: string) => {
    setSelectedFlagIds(prev => {
      const next = new Set(prev)
      if (next.has(flagId)) {
        next.delete(flagId)
      } else {
        next.add(flagId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedFlagIds.size === openFlags.length) {
      setSelectedFlagIds(new Set())
    } else {
      setSelectedFlagIds(new Set(openFlags.map(f => f.id)))
    }
  }

  const markAsFixed = (flagId: string) => {
    setFixedFlagIds(prev => new Set(prev).add(flagId))
    setSelectedFlagIds(prev => {
      const next = new Set(prev)
      next.delete(flagId)
      return next
    })
  }

  const markSelectedAsFixed = () => {
    setFixedFlagIds(prev => {
      const next = new Set(prev)
      selectedFlagIds.forEach(id => next.add(id))
      return next
    })
    setSelectedFlagIds(new Set())
  }

  const markAllAsFixed = () => {
    setFixedFlagIds(prev => {
      const next = new Set(prev)
      openFlags.forEach(f => next.add(f.id))
      return next
    })
    setSelectedFlagIds(new Set())
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[680px] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[#e2e8f0] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[#0f172a]">{field.logicalName}</h2>
                {targetSystem && (
                  <span className="rounded-full bg-[#e0e7ff] px-2.5 py-0.5 text-xs font-medium text-[#4338ca]">
                    {targetSystem.name}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#64748b]">
                <span className="font-semibold text-[#7c3aed]">{openFlags.length}</span> open flags
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/field-definitions/${fieldId}`}
                className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
              >
                <Pencil className="h-4 w-4" />
                Edit definition
              </Link>
              <button
                onClick={markAllAsFixed}
                disabled={openFlags.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-[#22c55e] px-3 py-2 text-sm font-medium text-white hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark all as fixed
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Field summary section */}
          <div className="border-b border-[#e2e8f0] p-6">
            <button
              onClick={() => setIsDefinitionExpanded(!isDefinitionExpanded)}
              className="flex w-full items-center justify-between text-left"
            >
              <h3 className="text-sm font-semibold text-[#0f172a]">Field summary</h3>
              {isDefinitionExpanded ? (
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#64748b]" />
              )}
            </button>

            {isDefinitionExpanded && (
              <div className="mt-4 space-y-3">
                {/* Definition snippet */}
                <div className="rounded-lg bg-[#f8fafc] p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#64748b]">Data type:</span>
                      <span className="ml-2 font-medium text-[#0f172a] capitalize">{field.dataType}</span>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Criticality:</span>
                      <span className={`ml-2 font-medium ${field.isCritical ? "text-[#dc2626]" : "text-[#64748b]"}`}>
                        {field.isCritical ? "Critical" : "Standard"}
                      </span>
                    </div>
                    {field.unit && (
                      <div>
                        <span className="text-[#64748b]">Unit:</span>
                        <span className="ml-2 font-medium text-[#0f172a]">{field.unit}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#64748b]">Version:</span>
                      <span className="ml-2 font-medium text-[#0f172a]">v{field.version}</span>
                    </div>
                  </div>
                  
                  {/* Validation rules summary */}
                  {field.validationRules.length > 0 && (
                    <div className="mt-3 border-t border-[#e2e8f0] pt-3">
                      <p className="text-xs font-medium text-[#64748b]">Validation rules:</p>
                      <ul className="mt-1 space-y-1">
                        {field.validationRules.slice(0, 3).map((rule, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-[#334155]">
                            <span className={`h-1.5 w-1.5 rounded-full ${rule.severity === "block" ? "bg-[#dc2626]" : "bg-[#eab308]"}`} />
                            <span className="capitalize">{rule.kind.replace(/_/g, " ")}</span>
                          </li>
                        ))}
                        {field.validationRules.length > 3 && (
                          <li className="text-xs text-[#94a3b8]">+{field.validationRules.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Link to full definition */}
                <Link
                  href={`/admin/field-definitions/${fieldId}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#7c3aed] hover:underline"
                >
                  View full definition
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Flagged occurrences section */}
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0f172a]">Flagged occurrences</h3>
              {selectedFlagIds.size > 0 && (
                <button
                  onClick={markSelectedAsFixed}
                  className="flex items-center gap-1.5 rounded-lg bg-[#22c55e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#16a34a]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark {selectedFlagIds.size} selected as fixed
                </button>
              )}
            </div>

            {/* Select all checkbox */}
            {openFlags.length > 0 && (
              <div className="mb-3 flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
                <button
                  onClick={toggleSelectAll}
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    selectedFlagIds.size === openFlags.length && openFlags.length > 0
                      ? "border-[#7c3aed] bg-[#7c3aed]"
                      : selectedFlagIds.size > 0
                        ? "border-[#7c3aed] bg-[#f3e8ff]"
                        : "border-[#d1d5db]"
                  }`}
                >
                  {selectedFlagIds.size === openFlags.length && openFlags.length > 0 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  )}
                  {selectedFlagIds.size > 0 && selectedFlagIds.size < openFlags.length && (
                    <div className="h-2 w-2 rounded-sm bg-[#7c3aed]" />
                  )}
                </button>
                <span className="text-xs text-[#64748b]">
                  Select all ({openFlags.length})
                </span>
              </div>
            )}

            {/* Flag list */}
            <div className="space-y-3">
              {openFlags.map(flag => (
                <FlagOccurrenceRow
                  key={flag.id}
                  flag={flag}
                  isSelected={selectedFlagIds.has(flag.id)}
                  onToggleSelect={() => toggleFlagSelection(flag.id)}
                  onMarkAsFixed={() => markAsFixed(flag.id)}
                />
              ))}

              {openFlags.length === 0 && (
                <div className="rounded-lg border border-[#e2e8f0] bg-[#f0fdf4] p-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-[#22c55e]" />
                  <p className="mt-2 text-sm font-medium text-[#166534]">All flags resolved</p>
                  <p className="mt-1 text-xs text-[#64748b]">No open flags for this field</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Individual flag occurrence row
interface FlagOccurrenceRowProps {
  flag: Flag
  isSelected: boolean
  onToggleSelect: () => void
  onMarkAsFixed: () => void
}

function FlagOccurrenceRow({ flag, isSelected, onToggleSelect, onMarkAsFixed }: FlagOccurrenceRowProps) {
  const vessel = vessels.find(v => v.id === flag.vesselId)
  const form = targetForms.find(f => f.id === flag.reportId.split("-")[0]) || targetForms[0]
  const valuesMatch = flag.flaggedValue === flag.sourceValue

  return (
    <div className={`rounded-lg border p-4 ${isSelected ? "border-[#7c3aed] bg-[#faf5ff]" : "border-[#e2e8f0] bg-white"}`}>
      {/* Top row: checkbox, vessel, report, status */}
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleSelect}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
            isSelected
              ? "border-[#7c3aed] bg-[#7c3aed]"
              : "border-[#d1d5db] hover:border-[#7c3aed]"
          }`}
        >
          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
        </button>

        <div className="flex-1">
          {/* Vessel and report info */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-[#0f172a]">{vessel?.name || "Unknown Vessel"}</span>
            <span className="text-sm text-[#64748b]">
              {flag.reportId} • {form?.name || "Report"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              flag.reportStatus === "submitted"
                ? "bg-[#dcfce7] text-[#166534]"
                : "bg-[#fef3c7] text-[#92400e]"
            }`}>
              {flag.reportStatus === "submitted" ? "Submitted" : "Draft"}
            </span>
          </div>

          {/* Values comparison */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 ${!valuesMatch ? "bg-[#fee2e2]" : "bg-[#f1f5f9]"}`}>
              <p className="text-xs font-medium text-[#64748b]">Flagged value (AI extracted)</p>
              <p className={`mt-1 font-mono text-sm ${!valuesMatch ? "font-semibold text-[#dc2626]" : "text-[#0f172a]"}`}>
                {flag.flaggedValue || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-[#f1f5f9] p-3">
              <p className="text-xs font-medium text-[#64748b]">Source value (preview)</p>
              <p className="mt-1 font-mono text-sm text-[#0f172a]">
                {flag.sourceValue || "—"}
              </p>
            </div>
          </div>

          {/* Crew comment */}
          {flag.comment && (
            <div className="mt-3 rounded-lg bg-[#fffbeb] px-3 py-2">
              <p className="text-xs font-medium text-[#92400e]">Crew comment</p>
              <p className="mt-0.5 text-sm italic text-[#78350f]">&quot;{flag.comment}&quot;</p>
            </div>
          )}

          {/* Bottom row: reason, timestamp, actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Reason chip */}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
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

              {/* Timestamp */}
              <span className="flex items-center gap-1 text-xs text-[#64748b]">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(flag.flaggedAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* View report link - placeholder, links to crew view */}
              <Link
                href={`/admin/reports/${flag.reportId}`}
                className="flex items-center gap-1 text-xs font-medium text-[#7c3aed] hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                View report
              </Link>

              {/* Mark as fixed button */}
              <button
                onClick={onMarkAsFixed}
                className="flex items-center gap-1 rounded-lg border border-[#22c55e] px-2.5 py-1 text-xs font-medium text-[#22c55e] hover:bg-[#f0fdf4]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark as fixed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
