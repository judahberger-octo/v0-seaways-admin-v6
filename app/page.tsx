"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ReportSelection } from "@/components/report-selection"
import { TransferReview } from "@/components/transfer-review"
import { DraftsPage } from "@/components/drafts-page"
import { HistoryPage } from "@/components/history-page"
import { GenerationLoading } from "@/components/generation-loading"
import { AdminPage } from "@/components/admin/admin-page"
import { UserProvider } from "@/lib/user-context"

type AppView = "selection" | "loading" | "review"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new-transfer" | "drafts" | "history">("new-transfer")
  const [currentView, setCurrentView] = useState<AppView>("selection")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true)
  const [isViewingHistory, setIsViewingHistory] = useState(false)
  const [isAdminView, setIsAdminView] = useState(false)

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
    setCurrentView("loading")
  }

  const handleLoadingComplete = () => {
    setCurrentView("review")
  }

  const handleBackToSelection = () => {
    setCurrentView("selection")
    setSelectedReportId(null)
    setIsViewingHistory(false)
  }

  const handleViewHistoryReport = (reportId: string) => {
    setSelectedReportId(reportId)
    setIsViewingHistory(true)
    setCurrentView("review")
  }

  if (currentView === "loading" && selectedReportId) {
    return (
      <UserProvider>
        <GenerationLoading 
          reportId={selectedReportId} 
          onComplete={handleLoadingComplete} 
        />
      </UserProvider>
    )
  }

  return (
    <UserProvider>
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
          <AdminPage />
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
    </UserProvider>
  )
}
