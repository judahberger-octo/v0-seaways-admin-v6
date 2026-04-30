"use client"

import { useState } from "react"
import { AdminLayout, type AdminTabId } from "./admin-layout"
import { AdminOverviewContent } from "./admin-overview"
import { AdminFieldDefinitions } from "./admin-field-definitions"
import { AdminReviewQueue } from "./admin-review-queue"
import { AdminTestSuite } from "./admin-test-suite"
import { AdminVessels } from "./admin-vessels"
import { AdminAuditLog } from "./admin-audit-log"

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview")

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && <AdminOverviewContent />}
      {activeTab === "field-definitions" && <AdminFieldDefinitions />}
      {activeTab === "review-queue" && <AdminReviewQueue />}
      {activeTab === "test-suite" && <AdminTestSuite />}
      {activeTab === "vessels" && <AdminVessels />}
      {activeTab === "audit-log" && <AdminAuditLog />}
    </AdminLayout>
  )
}
