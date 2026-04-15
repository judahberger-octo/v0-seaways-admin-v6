"use client"

import { useState } from "react"
import { Search, Calendar, FileText, Check, ChevronDown, ChevronRight, Info } from "lucide-react"

interface Report {
  id: string
  number: string
  type: "Noon (Sea)" | "Noon (Port)" | "Departure" | "Arrival"
  status: "Ready" | "Transferred"
  transferredDate?: string
  dateRange: string
}

const mockReports: Report[] = [
  { id: "1", number: "#4530", type: "Noon (Sea)", status: "Ready", dateRange: "16/04/2026 – 17/04/2026" },
  { id: "2", number: "#4529", type: "Noon (Sea)", status: "Ready", dateRange: "15/04/2026 – 16/04/2026" },
  { id: "3", number: "#4528", type: "Noon (Sea)", status: "Ready", dateRange: "14/04/2026 – 15/04/2026" },
  { id: "4", number: "#4527", type: "Noon (Sea)", status: "Transferred", transferredDate: "13/04/2026 14:32", dateRange: "13/04/2026 – 14/04/2026" },
  { id: "5", number: "#4526", type: "Noon (Sea)", status: "Transferred", transferredDate: "12/04/2026 13:45", dateRange: "12/04/2026 – 13/04/2026" },
  { id: "6", number: "#4525", type: "Noon (Sea)", status: "Transferred", transferredDate: "11/04/2026 14:10", dateRange: "11/04/2026 – 12/04/2026" },
  { id: "7", number: "#4524", type: "Departure", status: "Transferred", transferredDate: "10/04/2026 09:15", dateRange: "10/04/2026" },
  { id: "8", number: "#4523", type: "Arrival", status: "Transferred", transferredDate: "09/04/2026 17:45", dateRange: "09/04/2026" },
]

interface ReportSelectionProps {
  onGenerate: (reportIds: string[]) => void
}

export function ReportSelection({ onGenerate }: ReportSelectionProps) {
  const [selectedReports, setSelectedReports] = useState<string[]>(["1"])
  const [showPrecedingReports, setShowPrecedingReports] = useState(false)

  const toggleReport = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const readyReportsCount = mockReports.filter((r) => r.status === "Ready").length
  const selectedReport = mockReports.find((r) => selectedReports.includes(r.id))

  const getReportTypeBadgeColor = (type: Report["type"]) => {
    switch (type) {
      case "Noon (Sea)":
        return "bg-[#dbeafe] text-[#2563eb]"
      case "Noon (Port)":
        return "bg-[#fef3c7] text-[#d97706]"
      case "Departure":
        return "bg-[#dcfce7] text-[#16a34a]"
      case "Arrival":
        return "bg-[#f3e8ff] text-[#7c3aed]"
      default:
        return "bg-[#f1f5f9] text-[#64748b]"
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0f172a]">
          New Transfer — Seaways Skopelos
        </h1>
        <p className="text-[#64748b] mt-1">Select a source report to transfer</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-6">
        {/* Left Column - Source Reports */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#0f172a]">NAVTOR Source Reports</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-medium">
                  Connected
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search by report number"
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc]">
                All Types
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f8fafc]">
                <Calendar className="w-3.5 h-3.5" />
                Date Range
              </button>
            </div>
          </div>

          {/* Selection Counter */}
          <div className="px-4 py-2 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
            <span className="text-sm text-[#64748b]">
              {selectedReports.length} of {mockReports.length} reports selected
            </span>
            <button className="text-sm text-[#7c3aed] hover:underline">
              Select all ready ({readyReportsCount})
            </button>
          </div>

          {/* Report List */}
          <div className="divide-y divide-[#e2e8f0] max-h-[480px] overflow-y-auto">
            {mockReports.map((report) => {
              const isSelected = selectedReports.includes(report.id)
              const isReady = report.status === "Ready"

              return (
                <button
                  key={report.id}
                  onClick={() => toggleReport(report.id)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${
                    isSelected
                      ? "bg-[#ede9fe] border-l-2 border-l-[#7c3aed]"
                      : "hover:bg-[#f8fafc]"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-[#7c3aed] border-[#7c3aed]"
                        : "border-[#e2e8f0]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Report Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isReady ? "bg-[#ede9fe]" : "bg-[#f1f5f9]"
                    }`}
                  >
                    <FileText
                      className={`w-5 h-5 ${
                        isReady ? "text-[#7c3aed]" : "text-[#94a3b8]"
                      }`}
                    />
                  </div>

                  {/* Report Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0f172a]">
                        Report {report.number}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getReportTypeBadgeColor(
                          report.type
                        )}`}
                      >
                        {report.type}
                      </span>
                      {isReady ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-medium">
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#dbeafe] text-[#2563eb] font-medium">
                          Transferred {report.transferredDate}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748b] mt-0.5">
                      {report.dateRange}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column - Target System */}
        <div className="space-y-4">
          {/* Target System Selection */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold text-[#0f172a] mb-1">Target System</h2>
            <p className="text-sm text-[#64748b] mb-4">
              Select where to transfer the report data
            </p>

            <div className="space-y-2">
              {/* VesLink - Selected */}
              <div className="border-2 border-[#7c3aed] bg-[#ede9fe] rounded-lg p-3 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0f172a]">VesLink</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#7c3aed] text-white font-medium">
                        Primary
                      </span>
                    </div>
                    <p className="text-sm text-[#64748b]">Maritime data on demand</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* VPS - Disabled */}
              <div className="border border-[#e2e8f0] bg-[#f8fafc] rounded-lg p-3 opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#64748b]">VPS</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#e2e8f0] text-[#64748b] font-medium">
                        Coming MS3
                      </span>
                    </div>
                    <p className="text-sm text-[#94a3b8]">Vessel Performance System</p>
                  </div>
                </div>
              </div>

              {/* BOSS - Disabled */}
              <div className="border border-[#e2e8f0] bg-[#f8fafc] rounded-lg p-3 opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#64748b]">BOSS</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#e2e8f0] text-[#64748b] font-medium">
                        Coming MS3
                      </span>
                    </div>
                    <p className="text-sm text-[#94a3b8]">Back Office Support System</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Target Form */}
          <div className="bg-white border border-[#e2e8f0] border-l-4 border-l-[#16a34a] rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#16a34a] uppercase tracking-wide">
                Detected Target Form
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#0f172a]">
                  VesLink Noon Report (Sea) v5.0
                </p>
                <p className="text-sm text-[#64748b]">
                  Based on NAVTOR report type: Noon (Sea)
                </p>
              </div>
              <button className="text-sm text-[#7c3aed] hover:underline">Change</button>
            </div>
          </div>

          {/* Source Reports Summary */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3 uppercase tracking-wide">
              Source Reports for this Transfer
            </h3>
            
            {selectedReports.length === 1 && selectedReport ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[#0f172a]">
                    Report {selectedReport.number}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#7c3aed] text-white font-medium">
                    Primary
                  </span>
                </div>
                <p className="text-sm text-[#64748b] mb-3">
                  {selectedReport.type}, {selectedReport.dateRange.split(" – ")[0]}
                </p>

                <button
                  onClick={() => setShowPrecedingReports(!showPrecedingReports)}
                  className="flex items-center gap-1 text-sm text-[#7c3aed] hover:underline mb-2"
                >
                  {showPrecedingReports ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  3 preceding reports included
                </button>

                {showPrecedingReports && (
                  <div className="ml-5 space-y-1 mb-3">
                    <p className="text-sm text-[#64748b]">#4529 • Noon (Sea)</p>
                    <p className="text-sm text-[#64748b]">#4528 • Noon (Sea)</p>
                    <p className="text-sm text-[#64748b]">#4527 • Noon (Sea)</p>
                  </div>
                )}

                <div className="flex items-start gap-2 p-2 bg-[#f8fafc] rounded-lg">
                  <Info className="w-4 h-4 text-[#64748b] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#64748b]">
                    Some target fields require data from previous reports (e.g., distance since last report, cumulative consumption)
                  </p>
                </div>
              </div>
            ) : selectedReports.length > 1 ? (
              <div>
                <p className="font-medium text-[#0f172a] mb-1">
                  {selectedReports.length} reports selected
                </p>
                <p className="text-sm text-[#64748b] mb-3">
                  {selectedReports
                    .map((id) => {
                      const r = mockReports.find((rep) => rep.id === id)
                      return r ? `${r.number} (${r.type})` : ""
                    })
                    .join(" • ")}
                </p>
                <div className="flex items-start gap-2 p-2 bg-[#f8fafc] rounded-lg">
                  <Info className="w-4 h-4 text-[#64748b] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#64748b]">
                    These will be processed as a batch. Each report generates its own VesLink form for individual review and submission.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#94a3b8]">No reports selected</p>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={() => onGenerate(selectedReports)}
            disabled={selectedReports.length === 0}
            className="w-full py-3 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#e2e8f0] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            {selectedReports.length > 1
              ? `Generate ${selectedReports.length} Transfers`
              : "Generate Transfer"}
          </button>
          <p className="text-xs text-[#64748b] text-center">
            AI will populate a VesLink form for each selected report. You&apos;ll review them one at a time.
          </p>
        </div>
      </div>
    </div>
  )
}
