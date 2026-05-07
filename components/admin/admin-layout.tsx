"use client"

// Admin sub-nav tabs
export type AdminTabId = 
  | "overview" 
  | "field-definitions" 
  | "review-queue" 
  | "vessels"

interface AdminTabItem {
  id: AdminTabId
  label: string
  slug: string
}

const adminTabs: AdminTabItem[] = [
  { id: "overview", label: "Overview", slug: "overview" },
  { id: "field-definitions", label: "Field Definitions", slug: "field-definitions" },
  { id: "review-queue", label: "Review Queue — TBD", slug: "review-queue" },
  { id: "vessels", label: "Vessels — WIP", slug: "vessels" },
]

interface AdminLayoutProps {
  activeTab: AdminTabId
  onTabChange: (tab: AdminTabId) => void
  hideHeader?: boolean
  children: React.ReactNode
}

export function AdminLayout({ activeTab, onTabChange, hideHeader = false, children }: AdminLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Admin Header with Sub-nav - hidden when viewing detail pages */}
      {!hideHeader && (
      <header className="border-b border-[#e2e8f0] bg-white flex-shrink-0">
        {/* Page Title */}
        <div className="px-8 pt-6 pb-4">
          <h1 className="text-xl font-semibold text-[#0f172a]">Admin</h1>
        </div>

        {/* Sub-nav Tabs */}
        <div className="px-8 flex gap-6">
          {adminTabs.map((tab) => {
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
      <main className="flex-1 overflow-auto bg-[#f8fafc]">
        {children}
      </main>
    </div>
  )
}
