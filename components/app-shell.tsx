"use client"

import { useState } from "react"
import { 
  Ship, 
  ChevronDown, 
  User, 
  Plus, 
  RefreshCw, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Send,
  FileText
} from "lucide-react"

interface AppShellProps {
  activeTab: "new-transfer" | "in-progress" | "history"
  onTabChange: (tab: "new-transfer" | "in-progress" | "history") => void
  isAdminMode?: boolean
  onAdminModeChange?: (enabled: boolean) => void
  children: React.ReactNode
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
  isReviewMode = false,
  reviewData,
  onBackFromReview
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const navItems = [
    { id: "new-transfer" as const, label: "New Transfer", icon: Plus },
    { id: "in-progress" as const, label: "In Progress", icon: RefreshCw, badge: 2 },
    { id: "history" as const, label: "History", icon: ClipboardList },
  ]

  const sidebarWidth = isSidebarCollapsed ? "w-14" : "w-[220px]"

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Left Sidebar */}
      <aside className={`${sidebarWidth} flex-shrink-0 flex flex-col border-r border-[#e2e8f0] bg-white transition-all duration-200`}>
        {/* Logo */}
        <div className="h-12 flex items-center px-4 border-b border-[#e2e8f0]">
          {isSidebarCollapsed ? (
            <div className="w-6 h-6 rounded bg-[#7c3aed] flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xs">U</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#7c3aed]">Unframe</span>
              <span className="text-[11px] text-[#94a3b8] -mt-1">Transfer Agent</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors relative ${
                  isActive
                    ? "bg-[#ede9fe]/40 text-[#7c3aed]"
                    : "text-[#64748b] hover:bg-[#f1f5f9]"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#7c3aed] rounded-r" />
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 ${isSidebarCollapsed ? "mx-auto" : ""}`} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-[13px] font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#7c3aed] text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isSidebarCollapsed && item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-medium rounded-full bg-[#7c3aed] text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}

          {/* Current Transfer Section - only in review mode and when expanded */}
          {isReviewMode && reviewData && !isSidebarCollapsed && (
            <>
              <div className="my-3 border-t border-[#e2e8f0]" />
              <div className="px-3 py-2">
                <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wide">
                  Current
                </span>
                <div className="mt-1.5">
                  <span className="text-[13px] font-medium text-[#0f172a]">
                    #{reviewData.reportId} {reviewData.reportType}
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-2 h-1 bg-[#e2e8f0] rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-[#16a34a]" 
                    style={{ width: `${(reviewData.verified / reviewData.total) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-[#f59e0b]" 
                    style={{ width: `${(reviewData.flagged / reviewData.total) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#94a3b8] mt-1 block">
                  {reviewData.verified + reviewData.flagged}/{reviewData.total} reviewed
                </span>
              </div>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[#e2e8f0] p-3">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                <span className="text-[11px] text-[#94a3b8]">Connected</span>
              </div>
              <span className="text-[11px] text-[#94a3b8] block mt-0.5">v1.0.2</span>
            </>
          ) : (
            <div className="flex justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" title="Connected" />
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="h-8 border-t border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] hover:text-[#64748b] hover:bg-[#f8fafc] transition-colors"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-12 border-b border-[#e2e8f0] bg-white flex items-center justify-between px-4 flex-shrink-0">
          {isReviewMode && reviewData ? (
            // Transfer Review Header
            <>
              {/* Left - Back + Report Info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onBackFromReview}
                  className="p-1 hover:bg-[#f1f5f9] rounded transition-colors"
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
                <button className="px-3 py-1.5 text-xs font-medium border border-[#e2e8f0] rounded bg-white hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Save Draft
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  SUBMIT TO VESLINK
                </button>
              </div>
            </>
          ) : (
            // Standard Page Header
            <>
              {/* Left - Page Title */}
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#0f172a]">
                  {activeTab === "new-transfer" && "New Transfer"}
                  {activeTab === "in-progress" && "In Progress"}
                  {activeTab === "history" && "Transfer History"}
                </span>
              </div>

              {/* Right - Vessel & User */}
              <div className="flex items-center gap-3">
                {/* Admin Toggle */}
                <div className="flex items-center gap-2">
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
                </div>

                <div className="h-5 w-px bg-[#e2e8f0]" />

                <button className="flex items-center gap-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] px-2 py-1 rounded transition-colors">
                  <Ship className="w-4 h-4 text-[#64748b]" />
                  <span className="font-medium text-[13px]">Seaways Skopelos</span>
                  <ChevronDown className="w-3 h-3 text-[#64748b]" />
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#ede9fe] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[#7c3aed]" />
                  </div>
                  <span className="text-[13px] text-[#64748b]">Chief Officer</span>
                </div>
              </div>
            </>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
