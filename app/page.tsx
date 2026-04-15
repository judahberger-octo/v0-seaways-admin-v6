"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ReportSelection } from "@/components/report-selection"
import { TransferReview } from "@/components/transfer-review"

type AppView = "selection" | "review"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new-transfer" | "in-progress" | "history">("new-transfer")
  const [currentView, setCurrentView] = useState<AppView>("selection")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  const handleGenerate = (reportIds: string[]) => {
    // For now, we only handle single report transfer
    // In future, batch processing would queue multiple reports
    setSelectedReportId(reportIds[0] || "4528")
    setCurrentView("review")
  }

  const handleBackToSelection = () => {
    setCurrentView("selection")
    setSelectedReportId(null)
  }

  // If we're in review mode, show the review page without the app shell tabs
  if (currentView === "review" && selectedReportId) {
    return (
      <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
        <TransferReview reportId={selectedReportId} onBack={handleBackToSelection} />
      </AppShell>
    )
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "new-transfer" && (
        <ReportSelection onGenerate={handleGenerate} />
      )}
      {activeTab === "in-progress" && (
        <div className="flex items-center justify-center h-full text-[#64748b]">
          <div className="text-center">
            <p className="text-lg font-medium">In Progress</p>
            <p className="text-sm">2 transfers pending review</p>
          </div>
        </div>
      )}
      {activeTab === "history" && (
        <div className="flex items-center justify-center h-full text-[#64748b]">
          <div className="text-center">
            <p className="text-lg font-medium">History</p>
            <p className="text-sm">View completed transfers</p>
          </div>
        </div>
      )}
    </AppShell>
  )
}
