"use client"

import { Check, ExternalLink, Search, Filter } from "lucide-react"

interface HistoryEntry {
  id: string
  reportNumber: string
  reportType: string
  reportTypeBadge: string
  dateRange: string
  status: "accepted" | "submitted"
  submittedDate: string
  submittedBy: string
  stats: {
    auto: number
    verified: number
    edited: number
  }
}

const mockHistoryEntries: HistoryEntry[] = [
  {
    id: "1",
    reportNumber: "4527",
    reportType: "Noon (Sea)",
    reportTypeBadge: "Noon (Sea)",
    dateRange: "13/04/2026 12:00 - 14/04/2026 12:00",
    status: "accepted",
    submittedDate: "13/04/2026 14:32",
    submittedBy: "Chief Officer",
    stats: { auto: 48, verified: 13, edited: 2 },
  },
  {
    id: "2",
    reportNumber: "4526",
    reportType: "Noon (Sea)",
    reportTypeBadge: "Noon (Sea)",
    dateRange: "12/04/2026 12:00 - 13/04/2026 12:00",
    status: "accepted",
    submittedDate: "12/04/2026 13:45",
    submittedBy: "Chief Officer",
    stats: { auto: 51, verified: 13, edited: 3 },
  },
  {
    id: "3",
    reportNumber: "4525",
    reportType: "Noon (Sea)",
    reportTypeBadge: "Noon (Sea)",
    dateRange: "11/04/2026 12:00 - 12/04/2026 12:00",
    status: "accepted",
    submittedDate: "11/04/2026 14:10",
    submittedBy: "Chief Officer",
    stats: { auto: 49, verified: 13, edited: 1 },
  },
  {
    id: "4",
    reportNumber: "4524",
    reportType: "Departure",
    reportTypeBadge: "Departure",
    dateRange: "10/04/2026",
    status: "accepted",
    submittedDate: "10/04/2026 09:15",
    submittedBy: "Chief Officer",
    stats: { auto: 42, verified: 11, edited: 0 },
  },
  {
    id: "5",
    reportNumber: "4523",
    reportType: "Arrival",
    reportTypeBadge: "Arrival",
    dateRange: "09/04/2026",
    status: "submitted",
    submittedDate: "09/04/2026 17:45",
    submittedBy: "Second Officer",
    stats: { auto: 38, verified: 10, edited: 2 },
  },
  {
    id: "6",
    reportNumber: "4522",
    reportType: "Noon (Sea)",
    reportTypeBadge: "Noon (Sea)",
    dateRange: "08/04/2026 12:00 - 09/04/2026 12:00",
    status: "accepted",
    submittedDate: "08/04/2026 14:20",
    submittedBy: "Chief Officer",
    stats: { auto: 50, verified: 13, edited: 4 },
  },
]

interface HistoryPageProps {
  onViewReport?: (reportId: string) => void
}

export function HistoryPage({ onViewReport }: HistoryPageProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Transfer History</h1>
        <p className="text-[#64748b] mt-1">Previously submitted transfers</p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by report number..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* History List */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        {mockHistoryEntries.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center gap-4 p-4 hover:bg-[#f8fafc] transition-colors cursor-pointer ${
              index !== mockHistoryEntries.length - 1 ? "border-b border-[#e2e8f0]" : ""
            }`}
            onClick={() => onViewReport?.(entry.reportNumber)}
          >
            {/* Status Icon */}
            <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-[#16a34a]" />
            </div>

            {/* Report Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-[#0f172a]">Report #{entry.reportNumber}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  entry.reportType === "Noon (Sea)"
                    ? "bg-[#ede9fe] text-[#7c3aed]"
                    : entry.reportType === "Departure"
                    ? "bg-[#dbeafe] text-[#2563eb]"
                    : "bg-[#fef3c7] text-[#d97706]"
                }`}>
                  {entry.reportTypeBadge}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  entry.status === "accepted"
                    ? "bg-[#f0fdf4] text-[#16a34a]"
                    : "bg-[#fef3c7] text-[#d97706]"
                }`}>
                  {entry.status === "accepted" ? "Accepted by VesLink" : "Submitted"}
                </span>
              </div>
              <div className="text-sm text-[#64748b]">{entry.dateRange}</div>
            </div>

            {/* Submission Info */}
            <div className="text-right flex-shrink-0">
              <div className="text-sm text-[#0f172a]">Submitted {entry.submittedDate}</div>
              <div className="text-xs text-[#64748b]">by {entry.submittedBy}</div>
              <div className="text-xs text-[#94a3b8] mt-0.5">
                {entry.stats.auto} auto • {entry.stats.verified} verified • {entry.stats.edited} edited
              </div>
            </div>

            {/* External Link */}
            <button 
              className="p-2 text-[#94a3b8] hover:text-[#7c3aed] hover:bg-[#ede9fe] rounded-lg transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onViewReport?.(entry.reportNumber)
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 text-center text-sm text-[#94a3b8]">
        Showing {mockHistoryEntries.length} transfers • Seaways Skopelos
      </div>
    </div>
  )
}
