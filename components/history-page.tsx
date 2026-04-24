"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Download, Filter, MoreHorizontal, Eye, ExternalLink } from "lucide-react"

interface HistoryEntry {
  id: string
  name: string
  status: "Submitted"
  updated: string
  criticalVerified: string
}

const mockHistory: HistoryEntry[] = [
  {
    id: "#4527",
    name: "Noon (Sea)",
    status: "Submitted",
    updated: "January 25, 2026 2:03 AM",
    criticalVerified: "12/12",
  },
  {
    id: "#4526",
    name: "Noon (Sea)",
    status: "Submitted",
    updated: "January 24, 2026 1:45 PM",
    criticalVerified: "12/12",
  },
  {
    id: "#4525",
    name: "Departure",
    status: "Submitted",
    updated: "January 23, 2026 9:30 AM",
    criticalVerified: "8/8",
  },
  {
    id: "#4524",
    name: "Arrival",
    status: "Submitted",
    updated: "January 22, 2026 5:15 PM",
    criticalVerified: "8/8",
  },
]

interface HistoryPageProps {
  onViewReport?: (reportId: string) => void
}

export function HistoryPage({ onViewReport }: HistoryPageProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleRowClick = (reportId: string) => {
    // Open preview modal (read-only)
    onViewReport?.(reportId)
  }

  const handleMenuToggle = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === reportId ? null : reportId)
  }

  const handlePreview = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation()
    setOpenMenuId(null)
    onViewReport?.(reportId)
  }

  const handleViewOnVesLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(null)
    // Open external VesLink URL
    window.open("https://veslink.com", "_blank")
  }

  return (
    <div className="p-6">
      {/* Top Toolbar */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
        <div className="p-4 flex items-center justify-between border-b border-[#e2e8f0]">
          {/* Left - Search */}
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-10 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
            />
            <SlidersHorizontal className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          </div>

          {/* Right - Icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors">
              <Download className="w-5 h-5 text-[#64748b]" />
            </button>
            <button className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors">
              <Filter className="w-5 h-5 text-[#64748b]" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b] w-28">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b] w-32">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b] w-52">Updated</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b] w-36">Critical verified</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#64748b] w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockHistory.map((entry, index) => {
                const rowId = `${entry.id}-${index}`
                const isMenuOpen = openMenuId === rowId
                
                return (
                  <tr
                    key={rowId}
                    onClick={() => handleRowClick(entry.id)}
                    className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{entry.id}</td>
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{entry.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                        <span className="text-sm text-[#0f172a]">{entry.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{entry.updated}</td>
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{entry.criticalVerified}</td>
                    <td className="py-3 px-4 text-right relative">
                      <button
                        onClick={(e) => handleMenuToggle(e, rowId)}
                        className="p-1.5 hover:bg-[#e2e8f0] rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-[#64748b]" />
                      </button>

                      {/* Action Menu Popover */}
                      {isMenuOpen && (
                        <div className="absolute right-4 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-10 py-1 min-w-40">
                          <button
                            onClick={(e) => handlePreview(e, entry.id)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-[#f8fafc] flex items-center gap-2 text-[#0f172a]"
                          >
                            <Eye className="w-4 h-4 text-[#64748b]" />
                            Preview
                          </button>
                          <button
                            onClick={handleViewOnVesLink}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-[#f8fafc] flex items-center gap-2 text-[#0f172a]"
                          >
                            <ExternalLink className="w-4 h-4 text-[#64748b]" />
                            View on VesLink
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
