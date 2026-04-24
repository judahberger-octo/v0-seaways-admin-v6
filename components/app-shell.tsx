"use client"

import { 
  Search, 
  MessageSquare, 
  Sparkles, 
  Layers,
  Settings,
  User,
  ArrowLeft
} from "lucide-react"

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
  onBackFromReview
}: AppShellProps) {
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
          // Transfer Review Header
          <header className="h-14 border-b border-[#e2e8f0] bg-white flex items-center justify-between px-6 flex-shrink-0">
            {/* Left - Back + Report Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={onBackFromReview}
                className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#64748b]" />
              </button>
              <span className="font-semibold text-sm text-[#0f172a]">{reviewData.vesselName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#f97316] text-white font-medium">
                {reviewData.reportType}
              </span>
              <span className="text-xs text-[#94a3b8]">Report #{reviewData.reportId}</span>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Admin Toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#94a3b8]">Admin</span>
                <button
                  onClick={() => onAdminModeChange?.(!isAdminMode)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    isAdminMode ? "bg-[#7c3aed]" : "bg-[#e2e8f0]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                      isAdminMode ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                {isAdminMode && (
                  <span className="text-[10px] font-medium text-[#7c3aed] bg-[#ede9fe] px-1.5 py-0.5 rounded">
                    ON
                  </span>
                )}
              </div>
              
              <div className="h-4 w-px bg-[#e2e8f0]" />

              <span className="text-xs px-2 py-0.5 rounded bg-[#e2e8f0] text-[#64748b] font-medium">
                Draft
              </span>
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
    </div>
  )
}
