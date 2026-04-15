"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ReportSelection } from "@/components/report-selection"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new-transfer" | "in-progress" | "history">("new-transfer")
  const [, setSelectedReportIds] = useState<string[]>([])

  const handleGenerate = (reportIds: string[]) => {
    setSelectedReportIds(reportIds)
    // In future prompts, this will navigate to the review page
    console.log("[v0] Generating transfer for reports:", reportIds)
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
