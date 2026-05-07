"use client"

import { useState } from "react"
import { AdminLayout, type AdminTabId } from "./admin-layout"
import { AdminOverviewContent } from "./admin-overview"
import { AdminFieldDefinitions } from "./admin-field-definitions"
import { AdminFieldDetail } from "./admin-field-detail"
import { AdminLookupTables } from "./admin-lookup-tables"
import { AdminLookupTableDetail } from "./admin-lookup-table-detail"
import { AdminReviewQueue } from "./admin-review-queue"
import { AdminVessels } from "./admin-vessels"

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview")
  // Field detail view state: null = list view, string = edit mode, "new" = create mode
  const [selectedFieldId, setSelectedFieldId] = useState<string | null | "new">(null)
  // Lookup table detail view state: null = list view, string = edit mode, "new" = create mode
  const [selectedLookupTableId, setSelectedLookupTableId] = useState<string | null | "new">(null)

  // Handle tab changes - reset detail views when leaving tabs
  const handleTabChange = (tab: AdminTabId) => {
    setActiveTab(tab)
    if (tab !== "field-definitions") {
      setSelectedFieldId(null)
    }
    if (tab !== "lookup-tables") {
      setSelectedLookupTableId(null)
    }
  }

  // Check if we're viewing detail pages
  const isViewingFieldDetail = activeTab === "field-definitions" && selectedFieldId !== null
  const isViewingLookupTableDetail = activeTab === "lookup-tables" && selectedLookupTableId !== null

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      hideHeader={isViewingFieldDetail || isViewingLookupTableDetail}
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
      {activeTab === "lookup-tables" && (
        selectedLookupTableId !== null ? (
          <AdminLookupTableDetail
            tableId={selectedLookupTableId === "new" ? null : selectedLookupTableId}
            onBack={() => setSelectedLookupTableId(null)}
          />
        ) : (
          <AdminLookupTables
            onSelectTable={(id) => setSelectedLookupTableId(id)}
            onCreateTable={() => setSelectedLookupTableId("new")}
          />
        )
      )}
      {activeTab === "review-queue" && <AdminReviewQueue />}
      {activeTab === "vessels" && <AdminVessels />}
    </AdminLayout>
  )
}
