"use client"

import { useState } from "react"
import { 
  Search, 
  MessageSquare, 
  Sparkles, 
  Layers,
  Settings,
  Calendar,
  FileText,
  Pencil,
  X
} from "lucide-react"
import { UnsavedReportModal, DiscardReportModal } from "./modals"

interface AppShellProps {
  activeTab: "new-transfer" | "drafts" | "history"
  onTabChange: (tab: "new-transfer" | "drafts" | "history") => void
  isAdminMode?: boolean
  onAdminModeChange?: (enabled: boolean) => void
  children: React.ReactNode
  // Tab counts
  newTransferCount?: number
  draftsCount?: number
  historyCount?: number
  // For transfer review context
  isReviewMode?: boolean
  reviewData?: {
    reportId: string
    reportType: string
    vesselName: string
    verified: number
    flagged: number
    pending: number
    total: number
  }
  onBackFromReview?: () => void
  hasUnsavedChanges?: boolean
  onSaveAsDraft?: () => void
}

export function AppShell({ 
  activeTab, 
  onTabChange, 
  isAdminMode = false, 
  onAdminModeChange, 
  children,
  newTransferCount = 8,
  draftsCount = 2,
  historyCount = 15,
  isReviewMode = false,
  reviewData,
  onBackFromReview,
  hasUnsavedChanges = false,
  onSaveAsDraft
}: AppShellProps) {
  // Modal states for close flow
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)

  // Handle close button click
  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true)
    } else {
      onBackFromReview?.()
    }
  }

  // Handle save as draft from unsaved modal
  const handleSaveAsDraft = () => {
    onSaveAsDraft?.()
    setShowUnsavedModal(false)
    onBackFromReview?.()
  }

  // Handle discard click (shows confirmation)
  const handleDiscardClick = () => {
    setShowUnsavedModal(false)
    setShowDiscardModal(true)
  }

  // Handle final discard confirmation
  const handleConfirmDiscard = () => {
    setShowDiscardModal(false)
    onBackFromReview?.()
  }

  const tabs = [
    { id: "new-transfer" as const, label: "New transfer", count: newTransferCount },
    { id: "drafts" as const, label: "Drafts", count: draftsCount },
    { id: "history" as const, label: "History", count: historyCount },
  ]

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden">
      {/* Left Icon Rail */}
      <aside className="w-14 flex-shrink-0 flex flex-col border-r border-[#e2e8f0] bg-white">
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-[#e2e8f0]">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
        </div>

        {/* Icon Navigation */}
        <nav className="flex-1 py-3 flex flex-col items-center gap-1">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            <Sparkles className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            <Layers className="w-5 h-5" />
          </button>
        </nav>

        {/* Bottom Icons */}
        <div className="py-3 flex flex-col items-center gap-1 border-t border-[#e2e8f0]">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-xs font-medium">
            EM
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isReviewMode && reviewData ? (
          // Transfer Review Header - Redesigned per PROMPT 6
          <header className="h-12 border-b border-[#e2e8f0] bg-white flex items-center justify-between px-6 flex-shrink-0">
            {/* Left - Last Saved Timestamp */}
            <div className="flex items-center gap-2 group relative">
              <Calendar className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#64748b]">
                Last saved: January 25, 2026 2:03 AM
              </span>
              {/* Tooltip on hover */}
              <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-[#0f172a] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                Saved by chief.officer@seaways.com at 2:03 AM
                <div className="absolute -top-1 left-4 w-2 h-2 bg-[#0f172a] rotate-45" />
              </div>
            </div>

            {/* Center - Form Title + Edit + Status */}
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm font-medium text-[#0f172a]">
                Form - In Port Noon Report Unav 5.0
              </span>
              <button className="p-1 hover:bg-[#f1f5f9] rounded transition-colors">
                <Pencil className="w-3.5 h-3.5 text-[#64748b]" />
              </button>
              <span className="text-[#94a3b8] mx-1">•</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                Draft
              </span>
            </div>

            {/* Right - Close Button */}
            <button
              onClick={handleCloseClick}
              className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#64748b]" />
            </button>
          </header>
        ) : (
          // Standard Page Header with Tabs
          <header className="border-b border-[#e2e8f0] bg-white flex-shrink-0">
            {/* Page Title */}
            <div className="px-8 pt-6 pb-4">
              <h1 className="text-xl font-semibold text-[#0f172a]">Report management</h1>
            </div>

            {/* Tabs */}
            <div className="px-8 flex gap-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative pb-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-[#7c3aed]"
                        : "text-[#64748b] hover:text-[#0f172a]"
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1 ${isActive ? "text-[#7c3aed]" : "text-[#94a3b8]"}`}>
                      ({tab.count})
                    </span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed] rounded-t" />
                    )}
                  </button>
                )
              })}
            </div>
          </header>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Modals */}
      <UnsavedReportModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onSaveAsDraft={handleSaveAsDraft}
        onDiscard={handleDiscardClick}
      />
      <DiscardReportModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onCancel={() => {
          setShowDiscardModal(false)
          setShowUnsavedModal(true)
        }}
        onConfirmDiscard={handleConfirmDiscard}
      />
    </div>
  )
}
