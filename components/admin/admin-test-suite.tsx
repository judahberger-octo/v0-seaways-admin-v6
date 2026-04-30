"use client"

import { useState } from "react"
import {
  Plus,
  Play,
  CheckCircle2,
  X,
  Search,
  ChevronRight,
  FileText,
  Clock,
} from "lucide-react"
import {
  testReports,
  fieldDefinitions,
  vessels,
  type TestReport,
  type TestReportExpectedValue,
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

function getScoreColor(score: number): string {
  if (score >= 9) return "text-[#22c55e]"
  if (score >= 6) return "text-[#eab308]"
  return "text-[#ef4444]"
}

function getScoreBgColor(score: number): string {
  if (score >= 9) return "bg-[#dcfce7]"
  if (score >= 6) return "bg-[#fef9c3]"
  return "bg-[#fee2e2]"
}

export function AdminTestSuite() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [runProgress, setRunProgress] = useState<Map<string, "pending" | "running" | "done">>(new Map())
  const [runResults, setRunResults] = useState<Map<string, number>>(new Map())

  const selectedReport = selectedReportId 
    ? testReports.find(r => r.id === selectedReportId) 
    : null

  const handleRunAll = async () => {
    if (!selectedReport) return
    
    setIsRunningAll(true)
    setRunProgress(new Map())
    setRunResults(new Map())

    // Initialize all fields as pending
    const initialProgress = new Map<string, "pending" | "running" | "done">()
    selectedReport.expectedValues.forEach(ev => {
      initialProgress.set(ev.fieldId, "pending")
    })
    setRunProgress(initialProgress)

    // Run tests sequentially with delays
    for (const ev of selectedReport.expectedValues) {
      setRunProgress(prev => new Map(prev).set(ev.fieldId, "running"))
      
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))
      
      // Simulate test result (mostly passing)
      const score = Math.random() > 0.2 ? 8 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 4)
      
      setRunResults(prev => new Map(prev).set(ev.fieldId, score))
      setRunProgress(prev => new Map(prev).set(ev.fieldId, "done"))
    }

    setIsRunningAll(false)
  }

  return (
    <div className="flex h-full">
      {/* Left pane: Test reports list */}
      <div className="w-80 flex-shrink-0 border-r border-[#e2e8f0] bg-[#f8fafc]">
        <div className="p-4 border-b border-[#e2e8f0]">
          <h2 className="text-base font-semibold text-[#0f172a]">Test reports</h2>
          <p className="mt-1 text-xs text-[#64748b]">
            Curated reports with known-correct values
          </p>
        </div>

        <div className="p-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#d1d5db] py-2.5 text-sm font-medium text-[#64748b] hover:border-[#7c3aed] hover:bg-white hover:text-[#7c3aed]"
          >
            <Plus className="h-4 w-4" />
            Add source report
          </button>
        </div>

        <div className="overflow-y-auto">
          {testReports.map(report => {
            const isSelected = selectedReportId === report.id
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReportId(report.id)}
                className={`w-full px-4 py-3 text-left border-b border-[#e2e8f0] transition-colors ${
                  isSelected 
                    ? "bg-[#f3e8ff] border-l-2 border-l-[#7c3aed]" 
                    : "hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-[#334155]">
                    {report.id}
                  </span>
                  <span className="rounded-full bg-[#e0e7ff] px-2 py-0.5 text-xs font-medium text-[#4338ca]">
                    {report.expectedValues.length} fields
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#0f172a]">{report.vesselName}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#64748b]">
                  <span>{report.reportDate}</span>
                  <span>•</span>
                  <span>{report.reportType}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right pane: Selected report details */}
      <div className="flex-1 overflow-y-auto">
        {selectedReport ? (
          <div className="p-6">
            {/* Report header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    {selectedReport.id}
                  </h2>
                  <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-medium text-[#64748b]">
                    {selectedReport.reportType}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#64748b]">
                  {selectedReport.vesselName} • {selectedReport.reportDate}
                </p>
              </div>
              <button
                onClick={handleRunAll}
                disabled={isRunningAll}
                className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {isRunningAll ? "Running..." : "Run all"}
              </button>
            </div>

            {/* Field table */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1.5fr_100px_100px_140px] gap-4 border-b border-[#e2e8f0] px-4 py-3 text-xs font-medium text-[#64748b]">
                <span>Field</span>
                <span>Expected value</span>
                <span className="text-center">Last result</span>
                <span className="text-center">Version</span>
                <span className="text-right">Last run</span>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-[#f1f5f9]">
                {selectedReport.expectedValues.map(ev => {
                  const field = fieldDefinitions.find(f => f.id === ev.fieldId)
                  const progress = runProgress.get(ev.fieldId)
                  const result = runResults.get(ev.fieldId)
                  const displayScore = result ?? ev.lastTestScore
                  const displayVersion = result ? field?.version : ev.lastTestVersion
                  const displayTime = result ? "Just now" : (ev.lastTestRunAt ? formatRelativeTime(ev.lastTestRunAt) : "—")

                  return (
                    <div
                      key={ev.fieldId}
                      className={`grid grid-cols-[2fr_1.5fr_100px_100px_140px] gap-4 px-4 py-3 text-sm ${
                        progress === "running" ? "bg-[#fef9c3]" : ""
                      }`}
                    >
                      <span className="font-medium text-[#0f172a] truncate">
                        {field?.logicalName || ev.fieldId}
                      </span>
                      <span className="font-mono text-[#64748b] truncate" title={ev.expectedValue}>
                        {ev.expectedValue}
                      </span>
                      <div className="flex justify-center">
                        {progress === "running" ? (
                          <span className="text-[#a16207]">Running...</span>
                        ) : displayScore !== undefined ? (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getScoreBgColor(displayScore)} ${getScoreColor(displayScore)}`}>
                            {displayScore}/10
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </div>
                      <div className="text-center text-[#64748b]">
                        {displayVersion ? `v${displayVersion}` : "—"}
                      </div>
                      <div className="text-right text-[#64748b]">
                        {displayTime}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary stats after run */}
            {!isRunningAll && runResults.size > 0 && (
              <div className="mt-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
                <h3 className="text-sm font-semibold text-[#0f172a]">Run Summary</h3>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-[#22c55e]">
                      {Array.from(runResults.values()).filter(s => s >= 8).length}
                    </p>
                    <p className="text-xs text-[#64748b]">Passed (≥8/10)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#ef4444]">
                      {Array.from(runResults.values()).filter(s => s < 8).length}
                    </p>
                    <p className="text-xs text-[#64748b]">Failed (&lt;8/10)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0f172a]">
                      {Math.round(
                        Array.from(runResults.values()).reduce((a, b) => a + b, 0) / runResults.size * 10
                      )}%
                    </p>
                    <p className="text-xs text-[#64748b]">Avg accuracy</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-[#d1d5db]" />
              <p className="mt-4 text-sm text-[#64748b]">
                Select a test report to view fields and run tests
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add source report modal */}
      {showAddModal && (
        <AddTestReportModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

// Modal for adding a new test report
function AddTestReportModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("")

  // Mock available reports that aren't already in the test set
  const availableReports = [
    { id: "RPT-2024-010", vesselName: "SEAWAYS NOVA", date: "2024-01-20", type: "Noon (Sea)" },
    { id: "RPT-2024-011", vesselName: "SEAWAYS COSMOS", date: "2024-01-19", type: "Arrival" },
    { id: "RPT-2024-012", vesselName: "SEAWAYS HORIZON", date: "2024-01-18", type: "Departure" },
    { id: "RPT-2024-013", vesselName: "SEAWAYS PIONEER", date: "2024-01-17", type: "Bunkering" },
    { id: "RPT-2024-014", vesselName: "SEAWAYS VOYAGER", date: "2024-01-16", type: "Noon (Port)" },
  ]

  const filteredReports = availableReports.filter(
    r =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.vesselName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">Add source report</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by report ID or vessel..."
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredReports.map(report => (
              <button
                key={report.id}
                onClick={() => {
                  // In real app, would add to testReports
                  onClose()
                }}
                className="w-full rounded-lg border border-[#e2e8f0] p-3 text-left hover:border-[#7c3aed] hover:bg-[#f8fafc]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-[#334155]">
                    {report.id}
                  </span>
                  <span className="text-xs text-[#94a3b8]">{report.type}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-[#64748b]">
                  <span>{report.vesselName}</span>
                  <span>•</span>
                  <span>{report.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e2e8f0] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
