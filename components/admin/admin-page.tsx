"use client"

import { useState } from "react"
import { AdminLayout, type AdminTabId } from "./admin-layout"
import { AdminOverviewContent } from "./admin-overview"
import { AdminFieldDefinitions } from "./admin-field-definitions"
import { AdminFieldDetail } from "./admin-field-detail"
import { AdminReviewQueue } from "./admin-review-queue"
import { AdminTestSuite } from "./admin-test-suite"
import { AdminVessels } from "./admin-vessels"
import { AdminAuditLog } from "./admin-audit-log"

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview")
  // Field detail view state: null = list view, string = edit mode, "new" = create mode
  const [selectedFieldId, setSelectedFieldId] = useState<string | null | "new">(null)

  // Handle tab changes - reset field detail view when leaving field definitions
  const handleTabChange = (tab: AdminTabId) => {
    setActiveTab(tab)
    if (tab !== "field-definitions") {
      setSelectedFieldId(null)
    }
  }

  // Check if we're viewing field detail
  const isViewingFieldDetail = activeTab === "field-definitions" && selectedFieldId !== null

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      hideHeader={isViewingFieldDetail}
    >
      {activeTab === "overview" && <AdminOverviewContent />}
      {activeTab === "field-definitions" && (
        selectedFieldId !== null ? (
          <AdminFieldDetail 
            fieldId={selectedFieldId === "new" ? null : selectedFieldId}
            onBack={() => setSelectedFieldId(null)}
          />
        ) : (
          <AdminFieldDefinitions 
            onSelectField={(id) => setSelectedFieldId(id)}
            onCreateField={() => setSelectedFieldId("new")}
          />
        )
      )}
      {activeTab === "review-queue" && <AdminReviewQueue />}
      {activeTab === "test-suite" && <AdminTestSuite />}
      {activeTab === "vessels" && <AdminVessels />}
      {activeTab === "audit-log" && <AdminAuditLog />}
    </AdminLayout>
  )
}
