"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Pencil,
  Ship,
  Clock,
  FileText,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  vessels,
  targetSystems,
  targetForms,
  crewUsers,
  submissions,
  getCrewUsersForVessel,
  getSubmissionsForVessel,
  type Submission,
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

// Format date/time
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface AdminVesselDetailProps {
  vesselId: string
}

type SubmissionSortKey = "submittedAt" | "formId" | "submittedBy" | "critical" | "flagged"
type CrewSortKey = "name" | "email" | "role" | "lastActivity"
type SortDir = "asc" | "desc"

export function AdminVesselDetail({ vesselId }: AdminVesselDetailProps) {
  const router = useRouter()
  const vessel = vessels.find(v => v.id === vesselId)
  
  // Submission table state
  const [submissionSortKey, setSubmissionSortKey] = useState<SubmissionSortKey>("submittedAt")
  const [submissionSortDir, setSubmissionSortDir] = useState<SortDir>("desc")
  
  // Crew table state
  const [crewSortKey, setCrewSortKey] = useState<CrewSortKey>("name")
  const [crewSortDir, setCrewSortDir] = useState<SortDir>("asc")

  if (!vessel) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Ship className="mx-auto h-12 w-12 text-[#d1d5db]" />
          <p className="mt-4 text-lg font-medium text-[#0f172a]">Vessel not found</p>
          <Link
            href="/admin/vessels"
            className="mt-2 inline-flex items-center gap-1 text-sm text-[#7c3aed] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to vessels
          </Link>
        </div>
      </div>
    )
  }

  // Get data for this vessel
  const vesselSubmissions = getSubmissionsForVessel(vesselId)
  const vesselCrew = getCrewUsersForVessel(vesselId)

  // Filter submissions to last 60 days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const recentSubmissions = vesselSubmissions.filter(
    s => new Date(s.submittedAt) >= sixtyDaysAgo
  )

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    const sorted = [...recentSubmissions]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (submissionSortKey) {
        case "submittedAt":
          cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
          break
        case "formId":
          cmp = a.formId.localeCompare(b.formId)
          break
        case "submittedBy":
          cmp = a.submittedBy.localeCompare(b.submittedBy)
          break
        case "critical":
          cmp = a.criticalVerifiedCount - b.criticalVerifiedCount
          break
        case "flagged":
          cmp = a.fieldsFlagged - b.fieldsFlagged
          break
      }
      return submissionSortDir === "desc" ? -cmp : cmp
    })
    return sorted
  }, [recentSubmissions, submissionSortKey, submissionSortDir])

  // Sort crew
  const sortedCrew = useMemo(() => {
    const sorted = [...vesselCrew]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (crewSortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "email":
          cmp = a.email.localeCompare(b.email)
          break
        case "role":
          cmp = a.role.localeCompare(b.role)
          break
        case "lastActivity":
          const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0
          const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0
          cmp = aTime - bTime
          break
      }
      return crewSortDir === "desc" ? -cmp : cmp
    })
    return sorted
  }, [vesselCrew, crewSortKey, crewSortDir])

  const handleSubmissionSort = (key: SubmissionSortKey) => {
    if (submissionSortKey === key) {
      setSubmissionSortDir(submissionSortDir === "asc" ? "desc" : "asc")
    } else {
      setSubmissionSortKey(key)
      setSubmissionSortDir(key === "submittedAt" ? "desc" : "asc")
    }
  }

  const handleCrewSort = (key: CrewSortKey) => {
    if (crewSortKey === key) {
      setCrewSortDir(crewSortDir === "asc" ? "desc" : "asc")
    } else {
      setCrewSortKey(key)
      setCrewSortDir(key === "lastActivity" ? "desc" : "asc")
    }
  }

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-[#94a3b8]" />
    return dir === "desc" 
      ? <ChevronDown className="h-3.5 w-3.5 text-[#7c3aed]" />
      : <ChevronUp className="h-3.5 w-3.5 text-[#7c3aed]" />
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Back link */}
        <Link
          href="/admin/vessels"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#0f172a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vessels
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0f172a]">{vessel.name}</h1>
            <div className="mt-2 flex items-center gap-4">
              <span className="font-mono text-sm text-[#64748b]">IMO {vessel.imo}</span>
              <div className="flex gap-1.5">
                {vessel.targetSystemIds.map(sysId => {
                  const sys = targetSystems.find(s => s.id === sysId)
                  return (
                    <span
                      key={sysId}
                      className="rounded-full bg-[#e0e7ff] px-2.5 py-0.5 text-xs font-medium text-[#4338ca]"
                    >
                      {sys?.name || sysId}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
          <button
            onClick={() => {/* Placeholder - no editing in v0 */}}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            <Pencil className="h-4 w-4" />
            Edit vessel
          </button>
        </div>

        {/* Section 1: Submission History */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#64748b]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Submission History</h2>
            <span className="text-sm text-[#64748b]">(Last 60 days)</span>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_200px_180px_100px_80px] gap-4 border-b border-[#e2e8f0] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                Report ID
              </span>
              <button
                onClick={() => handleSubmissionSort("formId")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Form
                <SortIcon active={submissionSortKey === "formId"} dir={submissionSortDir} />
              </button>
              <button
                onClick={() => handleSubmissionSort("submittedAt")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Submitted
                <SortIcon active={submissionSortKey === "submittedAt"} dir={submissionSortDir} />
              </button>
              <button
                onClick={() => handleSubmissionSort("submittedBy")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                By
                <SortIcon active={submissionSortKey === "submittedBy"} dir={submissionSortDir} />
              </button>
              <button
                onClick={() => handleSubmissionSort("critical")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Critical
                <SortIcon active={submissionSortKey === "critical"} dir={submissionSortDir} />
              </button>
              <button
                onClick={() => handleSubmissionSort("flagged")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Flagged
                <SortIcon active={submissionSortKey === "flagged"} dir={submissionSortDir} />
              </button>
            </div>

            {/* Table body */}
            <div className="divide-y divide-[#f1f5f9]">
              {sortedSubmissions.map(submission => {
                const form = targetForms.find(f => f.id === submission.formId)
                const submitter = crewUsers.find(cu => cu.id === submission.submittedBy)
                const allCriticalVerified = submission.criticalVerifiedCount === submission.criticalTotalCount

                return (
                  <Link
                    key={submission.id}
                    href={`/admin/reports/${submission.id}`}
                    className="grid grid-cols-[1fr_120px_200px_180px_100px_80px] gap-4 px-4 py-3 transition-colors hover:bg-[#f8fafc]"
                  >
                    <span className="font-mono text-sm font-medium text-[#334155]">
                      {submission.id}
                    </span>
                    <span className="text-sm text-[#64748b]">
                      {form?.name || submission.formId}
                    </span>
                    <span className="text-sm text-[#64748b]">
                      {formatDateTime(submission.submittedAt)}
                    </span>
                    <span className="text-sm text-[#64748b]">
                      {submitter?.name || submission.submittedBy}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {allCriticalVerified ? (
                        <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-[#eab308]" />
                      )}
                      <span className={`text-sm font-medium ${allCriticalVerified ? "text-[#22c55e]" : "text-[#eab308]"}`}>
                        {submission.criticalVerifiedCount}/{submission.criticalTotalCount}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${submission.fieldsFlagged > 0 ? "text-[#ef4444]" : "text-[#64748b]"}`}>
                      {submission.fieldsFlagged}
                    </span>
                  </Link>
                )
              })}

              {sortedSubmissions.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-[#d1d5db]" />
                  <p className="mt-2 text-sm text-[#64748b]">No submissions in the last 60 days</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Crew Users */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#64748b]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Crew Users</h2>
            <span className="text-sm text-[#64748b]">({vesselCrew.length})</span>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1.5fr_2fr_120px_140px] gap-4 border-b border-[#e2e8f0] px-4 py-3">
              <button
                onClick={() => handleCrewSort("name")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Name
                <SortIcon active={crewSortKey === "name"} dir={crewSortDir} />
              </button>
              <button
                onClick={() => handleCrewSort("email")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Email
                <SortIcon active={crewSortKey === "email"} dir={crewSortDir} />
              </button>
              <button
                onClick={() => handleCrewSort("role")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Role
                <SortIcon active={crewSortKey === "role"} dir={crewSortDir} />
              </button>
              <button
                onClick={() => handleCrewSort("lastActivity")}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b] hover:text-[#0f172a]"
              >
                Last Activity
                <SortIcon active={crewSortKey === "lastActivity"} dir={crewSortDir} />
              </button>
            </div>

            {/* Table body */}
            <div className="divide-y divide-[#f1f5f9]">
              {sortedCrew.map(crew => (
                <div
                  key={crew.id}
                  className="grid grid-cols-[1.5fr_2fr_120px_140px] gap-4 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f9] text-xs font-medium text-[#64748b]">
                      {crew.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium text-[#0f172a]">{crew.name}</span>
                  </div>
                  <span className="flex items-center text-sm text-[#64748b]">{crew.email}</span>
                  <span className="flex items-center">
                    <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-medium capitalize text-[#64748b]">
                      {crew.role}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                    {crew.lastActivityAt ? (
                      <>
                        <Clock className="h-3.5 w-3.5" />
                        {formatRelativeTime(crew.lastActivityAt)}
                      </>
                    ) : (
                      <span className="text-[#94a3b8]">Never</span>
                    )}
                  </div>
                </div>
              ))}

              {sortedCrew.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-[#d1d5db]" />
                  <p className="mt-2 text-sm text-[#64748b]">No crew assigned to this vessel</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Field-config overrides (stub) */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#64748b]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Field Configuration Overrides</h2>
          </div>

          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-8 text-center">
            <Settings className="mx-auto h-10 w-10 text-[#d1d5db]" />
            <p className="mt-3 text-sm text-[#64748b]">
              No vessel-specific overrides. Field definitions apply globally for this target system.
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Per-vessel field configuration will be available in a future update.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
