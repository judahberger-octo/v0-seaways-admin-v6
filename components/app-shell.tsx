"use client"

import { useState } from "react"
import { 
  Search, 
  MessageSquare, 
  Sparkles, 
  Layers,
  Waves,
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
  
  // Nav icon overlay states
  const [showSearchOverlay, setShowSearchOverlay] = useState(false)
  const [showCommentsPane, setShowCommentsPane] = useState(false)
  
  // Handle Layers click - navigate to Report management
  const handleLayersClick = () => {
    if (isReviewMode) {
      // If in review mode, trigger back navigation (with unsaved check)
      if (hasUnsavedChanges) {
        setShowUnsavedModal(true)
      } else {
        onBackFromReview?.()
      }
    }
    // If already on Report management, do nothing (already selected)
  }
  
  // Handle Sparkles click - if on Report management, this is a no-op 
  // since Sparkles view requires opening a specific report
  const handleSparklesClick = () => {
    // Sparkles is selected when in review mode - clicking it while already
    // in review mode does nothing. From Report management, user must click
    // a specific report to enter review mode.
  }

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
      {/* Left Icon Rail - 56px wide, matches Figma spec */}
      <aside className="w-14 flex-shrink-0 flex flex-col border-r border-[#e2e8f0] bg-white">
        {/* Brand Mark - U logo with gradient, 32px, 16px top padding */}
        <div className="pt-4 pb-4 flex items-center justify-center">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)" }}
          >
            <span className="text-white font-bold text-sm">U</span>
          </div>
        </div>

        {/* Primary Nav Icons - 16px gap from logo, 8px between icons */}
        <nav className="flex flex-col items-center gap-2">
          {/* Search - opens command palette overlay */}
          <button 
            onClick={() => setShowSearchOverlay(true)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              showSearchOverlay
                ? "bg-[#f3e8ff] text-[#7c3aed]"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
            }`}
            title="Search (Cmd+K)"
          >
            <Search className="w-5 h-5" />
          </button>
          {/* Chat/Comments - opens comments pane */}
          <button 
            onClick={() => setShowCommentsPane(!showCommentsPane)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              showCommentsPane
                ? "bg-[#f3e8ff] text-[#7c3aed]"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
            }`}
            title="Comments"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          {/* Sparkles/AI - Selected when in review mode */}
          <button 
            onClick={handleSparklesClick}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              isReviewMode && !showSearchOverlay && !showCommentsPane
                ? "bg-[#f3e8ff] text-[#7c3aed]" 
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
            }`}
            title="AI Review"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          {/* Layers/Stack - Selected when on Report management */}
          <button 
            onClick={handleLayersClick}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              !isReviewMode && !showSearchOverlay && !showCommentsPane
                ? "bg-[#f3e8ff] text-[#7c3aed]" 
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
            }`}
            title="Report Management"
          >
            <Layers className="w-5 h-5" />
          </button>
          {/* Waves - Voyages/Fleet view (decorative per Figma) */}
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155] transition-colors"
            title="Voyages"
          >
            <Waves className="w-5 h-5" />
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Section - Settings gear + Avatar */}
        <div className="pb-4 flex flex-col items-center gap-4">
          {/* Settings - never selected, just hover state */}
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          {/* User Avatar - 32px purple circle with initials */}
          <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:bg-[#6d28d9] transition-colors">
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

            {/* Right - Vessel Name + Divider + Close Button */}
            <div className="flex items-center gap-3">
              {/* Vessel Name - read-only context */}
              <span className="text-sm font-medium text-[#7c3aed]">
                SEAWAYS SKOPELOS
              </span>
              {/* Vertical Divider */}
              <div className="w-px h-5 bg-[#e2e8f0]" />
              {/* Close Button */}
              <button
                onClick={handleCloseClick}
                className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>
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
      
      {/* Search Command Palette Overlay */}
      {showSearchOverlay && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSearchOverlay(false)}
          />
          {/* Search Modal */}
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e2e8f0]">
              <Search className="w-5 h-5 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search reports, fields, vessels..."
                className="flex-1 text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none"
                autoFocus
              />
              <kbd className="px-2 py-0.5 text-xs text-[#64748b] bg-[#f1f5f9] rounded">Esc</kbd>
            </div>
            {/* Results Placeholder */}
            <div className="p-8 text-center">
              <div className="text-[#94a3b8] text-sm">
                Start typing to search across all reports and fields
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Comments Pane - slides in from right */}
      {showCommentsPane && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-[#e2e8f0] shadow-lg z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#0f172a]">Comments</h3>
            <button 
              onClick={() => setShowCommentsPane(false)}
              className="p-1 hover:bg-[#f1f5f9] rounded transition-colors"
            >
              <X className="w-4 h-4 text-[#64748b]" />
            </button>
          </div>
          {/* Empty State */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-[#e2e8f0] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#64748b]">No comments yet</p>
              <p className="text-xs text-[#94a3b8] mt-1">
                Comments on this report will appear here
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
