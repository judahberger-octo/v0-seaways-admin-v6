"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ReportSelection } from "@/components/report-selection"
import { TransferReview } from "@/components/transfer-review"
import { DraftsPage } from "@/components/drafts-page"
import { HistoryPage } from "@/components/history-page"
import { GenerationLoading } from "@/components/generation-loading"
import { AdminOverview } from "@/components/admin/admin-overview"

type AppView = "selection" | "loading" | "review"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new-transfer" | "drafts" | "history">("new-transfer")
  const [currentView, setCurrentView] = useState<AppView>("selection")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true) // Default to true when in review mode
  const [isViewingHistory, setIsViewingHistory] = useState(false) // True when viewing submitted report from history
  const [isAdminView, setIsAdminView] = useState(false) // True when in admin view

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
    setCurrentView("loading") // Show loading first
  }

  const handleLoadingComplete = () => {
    setCurrentView("review")
  }

  const handleBackToSelection = () => {
    setCurrentView("selection")
    setSelectedReportId(null)
    setIsViewingHistory(false) // Reset read-only state
  }

  const handleViewHistoryReport = (reportId: string) => {
    setSelectedReportId(reportId)
    setIsViewingHistory(true) // Mark as read-only history view
    setCurrentView("review")
  }

  // Show loading screen outside AppShell (no sidebar during generation)
  if (currentView === "loading" && selectedReportId) {
    return (
      <GenerationLoading 
        reportId={selectedReportId} 
        onComplete={handleLoadingComplete} 
      />
    )
  }

  return (
    <AppShell 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      isAdminMode={isAdminMode}
      onAdminModeChange={setIsAdminMode}
      isAdminView={isAdminView}
      onAdminViewChange={setIsAdminView}
      isReviewMode={currentView === "review" && !isAdminView}
      reviewData={reviewData}
      onBackFromReview={handleBackToSelection}
      hasUnsavedChanges={currentView === "review" && hasUnsavedChanges && !isViewingHistory}
      onSaveAsDraft={() => {
        setHasUnsavedChanges(false)
      }}
      isReadOnly={isViewingHistory}
      submittedAt="2:03 PM on January 25, 2026"
      submittedBy="chief.officer@seaways.com"
    >
      {isAdminView ? (
        <AdminOverview />
      ) : currentView === "review" && selectedReportId ? (
        <TransferReview 
          reportId={selectedReportId} 
          onBack={handleBackToSelection}
          isAdminMode={isAdminMode}
          isReadOnly={isViewingHistory}
          submittedAt="2:03 PM on January 25, 2026"
          submittedBy="chief.officer@seaways.com"
        />
      ) : (
        <>
          {activeTab === "new-transfer" && (
            <ReportSelection onGenerate={handleGenerate} />
          )}
          {activeTab === "drafts" && (
            <DraftsPage onEditDraft={(draftId) => {
              setSelectedReportId(draftId)
              setCurrentView("review")
            }} />
          )}
          {activeTab === "history" && (
            <HistoryPage onViewReport={handleViewHistoryReport} />
          )}
        </>
      )}
    </AppShell>
  )
}
