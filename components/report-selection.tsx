"use client"

import { useState } from "react"
import { Search, Calendar, FileText, Check, ChevronDown, Info, X, Send } from "lucide-react"

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

const targetFormOptions = [
  "Noon Report — At Sea",
  "Noon Report — In Port",
  "Arrival Notice",
  "Departure Notice",
  "Bunkering Form",
  "Cargo Handling Form",
  "Statement of Facts (SOF)",
]

export function ReportSelection({ onGenerate }: ReportSelectionProps) {
  const [selectedReports, setSelectedReports] = useState<string[]>(["1"])
  const [selectedTargetForm, setSelectedTargetForm] = useState<string>("")
  const [showInfoBox, setShowInfoBox] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleReport = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const readyReportsCount = mockReports.filter((r) => r.status === "Ready").length

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
      {/* Two Column Layout */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-6">
        {/* Left Column - Source Reports */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-[#e2e8f0]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#0f172a]">NAVTOR Source Reports</h2>
              <p className="text-sm text-[#64748b] mt-0.5">Select reports to include in the transfer</p>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search by report number..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                />
              </div>

              {/* Date Picker */}
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#0f172a] bg-white hover:bg-[#f8fafc]">
                <Calendar className="w-4 h-4 text-[#64748b]" />
                Date: 16/04/2026
              </button>

              {/* Sort by / All types */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#64748b]">Sort by</span>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#0f172a] bg-white hover:bg-[#f8fafc]">
                  All types
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />
                </button>
              </div>
            </div>
          </div>

          {/* Selection Counter */}
          <div className="px-4 py-2.5 border-b border-[#e2e8f0] flex items-center justify-between">
            <span className="text-sm text-[#64748b]">
              XX of XX reports selected
            </span>
            <button className="text-sm text-[#7c3aed] hover:underline">
              Select all ready reports ({readyReportsCount})
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
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${
                    isSelected
                      ? "bg-[#faf5ff] border-l-2 border-l-[#7c3aed]"
                      : "hover:bg-[#f8fafc] border-l-2 border-l-transparent"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-[#7c3aed] border-[#7c3aed]"
                        : "border-[#cbd5e1] bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Report Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0f172a]">
                        Report {report.number}
                      </span>
                      <div className="flex items-center gap-2">
                        {isReady ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-medium">
                            Ready
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#dbeafe] text-[#2563eb] font-medium">
                            Transferred {report.transferredDate}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getReportTypeBadgeColor(
                            report.type
                          )}`}
                        >
                          {report.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-[#64748b]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{report.dateRange.replace("–", "12:00 –")} 12:00</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column - Target System */}
        <div className="space-y-4">
          {/* Target System Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-[#0f172a] mb-3">Target system</h3>
            
            {/* VesLink - Connected */}
            <div className="border-2 border-[#7c3aed] bg-[#faf5ff] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#0f172a]">VesLink</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-medium">
                  Connected
                </span>
              </div>
              <p className="text-sm text-[#64748b] mt-0.5">Maritime data on demand</p>
            </div>
          </div>

          {/* Target Form Dropdown */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-4">
            <label className="text-sm font-medium text-[#0f172a] block mb-2">
              Select target form
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-[#e2e8f0] rounded-lg bg-white hover:border-[#94a3b8] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#94a3b8]" />
                  <span className={selectedTargetForm ? "text-[#0f172a]" : "text-[#94a3b8]"}>
                    {selectedTargetForm || "Select target form..."}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-10 py-1 max-h-64 overflow-y-auto">
                  {targetFormOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedTargetForm(option)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-[#f8fafc] flex items-center gap-2 ${
                        selectedTargetForm === option ? "bg-[#ede9fe] text-[#7c3aed]" : "text-[#0f172a]"
                      }`}
                    >
                      {selectedTargetForm === option && <Check className="w-4 h-4" />}
                      <span className={selectedTargetForm === option ? "" : "ml-6"}>{option}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transfer Summary */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-[#0f172a] mb-3">Transfer summary</h3>
            
            {/* Sources */}
            <div className="mb-3">
              <span className="text-xs text-[#64748b] block mb-1.5">Sources</span>
              {selectedReports.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedReports.map((id) => {
                    const report = mockReports.find((r) => r.id === id)
                    return report ? (
                      <span
                        key={id}
                        className="text-xs px-2 py-1 rounded bg-[#f1f5f9] text-[#0f172a] font-medium"
                      >
                        {report.number}
                      </span>
                    ) : null
                  })}
                </div>
              ) : (
                <span className="text-sm text-[#94a3b8]">No reports selected</span>
              )}
            </div>

            <div className="border-t border-[#e2e8f0] my-3" />

            {/* Target */}
            <div>
              <span className="text-xs text-[#64748b] block mb-1.5">Target</span>
              <span className="text-sm text-[#0f172a]">
                {selectedTargetForm 
                  ? `VesLink → ${selectedTargetForm.replace(" — ", " (").replace("At Sea", "Sea").replace("In Port", "Port")}${selectedTargetForm.includes("—") ? ")" : ""} v5.0`
                  : "Select a target form above"
                }
              </span>
            </div>
          </div>

          {/* Info Box */}
          {showInfoBox && (
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#3b82f6] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#1e40af] flex-1">
                This will generate a pre-filled report using AI. You will review and confirm all fields before submission.
              </p>
              <button
                onClick={() => setShowInfoBox(false)}
                className="text-[#64748b] hover:text-[#0f172a] flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={() => onGenerate(selectedReports)}
            disabled={selectedReports.length === 0 || !selectedTargetForm}
            className="w-full py-3 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#e2e8f0] disabled:text-[#94a3b8] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Generate transfer
          </button>
        </div>
      </div>
    </div>
  )
}
