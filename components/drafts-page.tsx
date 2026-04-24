"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Download, Filter, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"

interface Draft {
  id: string
  name: string
  status: "Draft"
  updated: string
  criticalVerified: string
}

const mockDrafts: Draft[] = [
  {
    id: "#4527",
    name: "Noon (Sea)",
    status: "Draft",
    updated: "January 25, 2026 2:03 AM",
    criticalVerified: "5/12",
  },
  {
    id: "#4527",
    name: "Noon (Sea)",
    status: "Draft",
    updated: "January 25, 2026 2:03 AM",
    criticalVerified: "10/12",
  },
]

interface DraftsPageProps {
  onEditDraft: (draftId: string) => void
}

export function DraftsPage({ onEditDraft }: DraftsPageProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleRowClick = (draftId: string) => {
    onEditDraft(draftId)
  }

  const handleMenuToggle = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === draftId ? null : draftId)
  }

  const handlePreview = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation()
    setOpenMenuId(null)
    // Preview logic here
  }

  const handleEditDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation()
    setOpenMenuId(null)
    onEditDraft(draftId)
  }

  const handleDeleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation()
    setOpenMenuId(null)
    // Delete logic here
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
              {mockDrafts.map((draft, index) => {
                const rowId = `${draft.id}-${index}`
                const isMenuOpen = openMenuId === rowId
                
                return (
                  <tr
                    key={rowId}
                    onClick={() => handleRowClick(draft.id)}
                    className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{draft.id}</td>
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{draft.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                        <span className="text-sm text-[#0f172a]">{draft.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{draft.updated}</td>
                    <td className="py-3 px-4 text-sm text-[#0f172a]">{draft.criticalVerified}</td>
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
                            onClick={(e) => handlePreview(e, draft.id)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-[#f8fafc] flex items-center gap-2 text-[#0f172a]"
                          >
                            <Eye className="w-4 h-4 text-[#64748b]" />
                            Preview
                          </button>
                          <button
                            onClick={(e) => handleEditDraft(e, draft.id)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-[#f8fafc] flex items-center gap-2 text-[#0f172a]"
                          >
                            <Pencil className="w-4 h-4 text-[#64748b]" />
                            Edit draft
                          </button>
                          <button
                            onClick={(e) => handleDeleteDraft(e, draft.id)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-[#f8fafc] flex items-center gap-2 text-[#ef4444]"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete draft
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
