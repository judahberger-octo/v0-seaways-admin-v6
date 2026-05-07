"use client"

import { useState } from "react"
import { AdminLayout, type AdminTabId } from "./admin-layout"
import { AdminOverviewContent } from "./admin-overview"
import { AdminFieldDefinitions } from "./admin-field-definitions"
import { AdminFieldDetail } from "./admin-field-detail"
import { AdminLookupTables } from "./admin-lookup-tables"
import { AdminReviewQueue } from "./admin-review-queue"
import { AdminVessels } from "./admin-vessels"

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
      {activeTab === "lookup-tables" && <AdminLookupTables />}
      {activeTab === "review-queue" && <AdminReviewQueue />}
      {activeTab === "vessels" && <AdminVessels />}
    </AdminLayout>
  )
}
