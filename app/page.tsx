"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ReportSelection } from "@/components/report-selection"
import { TransferReview } from "@/components/transfer-review"
import { HistoryPage } from "@/components/history-page"

type AppView = "selection" | "review"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new-transfer" | "drafts" | "history">("new-transfer")
  const [currentView, setCurrentView] = useState<AppView>("selection")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)

  // Mock review data - in real app this would come from the TransferReview state
  const reviewData = currentView === "review" ? {
    reportId: selectedReportId || "4528",
    reportType: "Noon (Sea)",
    vesselName: "SEAWAYS SKOPELOS",
    verified: 22,
    flagged: 0,
    pending: 14,
    total: 36
  } : undefined

  const handleGenerate = (reportIds: string[]) => {
    setSelectedReportId(reportIds[0] || "4528")
    setCurrentView("review")
  }

  const handleBackToSelection = () => {
    setCurrentView("selection")
    setSelectedReportId(null)
  }

  const handleViewHistoryReport = (reportId: string) => {
    setSelectedReportId(reportId)
    setCurrentView("review")
  }

  return (
    <AppShell 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      isAdminMode={isAdminMode}
      onAdminModeChange={setIsAdminMode}
      isReviewMode={currentView === "review"}
      reviewData={reviewData}
      onBackFromReview={handleBackToSelection}
    >
      {currentView === "review" && selectedReportId ? (
        <TransferReview 
          reportId={selectedReportId} 
          onBack={handleBackToSelection}
          isAdminMode={isAdminMode}
        />
      ) : (
        <>
          {activeTab === "new-transfer" && (
            <ReportSelection onGenerate={handleGenerate} />
          )}
          {activeTab === "drafts" && (
            <div className="flex items-center justify-center h-full text-[#64748b]">
              <div className="text-center">
                <p className="text-lg font-medium">Drafts</p>
                <p className="text-sm">2 transfers pending review</p>
              </div>
            </div>
          )}
          {activeTab === "history" && (
            <HistoryPage onViewReport={handleViewHistoryReport} />
          )}
        </>
      )}
    </AppShell>
  )
}
