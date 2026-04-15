"use client"

import { Ship, ChevronDown, User } from "lucide-react"

interface AppShellProps {
  activeTab: "new-transfer" | "in-progress" | "history"
  onTabChange: (tab: "new-transfer" | "in-progress" | "history") => void
  isAdminMode?: boolean
  onAdminModeChange?: (enabled: boolean) => void
  children: React.ReactNode
}

export function AppShell({ activeTab, onTabChange, isAdminMode = false, onAdminModeChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <header className="h-14 border-b border-[#e2e8f0] bg-white flex items-center justify-between px-6">
        {/* Left - Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-[#7c3aed]">Unframe</span>
          <span className="text-sm text-[#64748b]">Transfer Agent</span>
        </div>

        {/* Center - Navigation Tabs */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => onTabChange("new-transfer")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === "new-transfer"
                ? "bg-[#7c3aed] text-white"
                : "text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            New Transfer
          </button>
          <button
            onClick={() => onTabChange("in-progress")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "in-progress"
                ? "bg-[#7c3aed] text-white"
                : "text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            In Progress
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === "in-progress"
                ? "bg-white/20 text-white"
                : "bg-[#e2e8f0] text-[#64748b]"
            }`}>
              2
            </span>
          </button>
          <button
            onClick={() => onTabChange("history")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-[#7c3aed] text-white"
                : "text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            History
          </button>
        </nav>

        {/* Right - Admin Toggle, Vessel & User */}
        <div className="flex items-center gap-4">
          {/* Admin Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94a3b8]">Admin</span>
            <button
              onClick={() => onAdminModeChange?.(!isAdminMode)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                isAdminMode ? "bg-[#7c3aed]" : "bg-[#e2e8f0]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  isAdminMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="h-6 w-px bg-[#e2e8f0]" />

          <button className="flex items-center gap-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] px-3 py-1.5 rounded-lg transition-colors">
            <Ship className="w-4 h-4 text-[#64748b]" />
            <span className="font-medium">Seaways Skopelos</span>
            <ChevronDown className="w-4 h-4 text-[#64748b]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ede9fe] flex items-center justify-center">
              <User className="w-4 h-4 text-[#7c3aed]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-[#64748b]">Chief Officer</span>
              {isAdminMode && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#7c3aed] text-white">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between px-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-[#64748b]">NAVTOR Connected</span>
          <span className="text-[#94a3b8]">•</span>
          <span className="text-[#94a3b8]">Last sync: 5 min ago</span>
        </div>
        <span className="text-[#94a3b8]">v1.0.2</span>
      </footer>
    </div>
  )
}
