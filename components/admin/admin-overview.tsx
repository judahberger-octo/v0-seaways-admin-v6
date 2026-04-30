"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import {
  getSubmissionsLast30Days,
  getAverageConfidenceLast30Days,
  getOpenFlagCount,
  getDefinitionChangesLast7Days,
} from "@/lib/admin-mock-data"

interface KpiCardProps {
  label: string
  value: string | number
  trend: {
    direction: "up" | "down" | "neutral"
    value: string
    label: string
  }
}

function KpiCard({ label, value, trend }: KpiCardProps) {
  return (
    <div className="flex-1 rounded-xl border border-[#e2e8f0] bg-white p-5">
      <p className="text-sm font-medium text-[#64748b]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#0f172a]">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-sm text-[#94a3b8]">
        {trend.direction === "up" && (
          <TrendingUp className="h-4 w-4 text-[#22c55e]" />
        )}
        {trend.direction === "down" && (
          <TrendingDown className="h-4 w-4 text-[#ef4444]" />
        )}
        <span className={
          trend.direction === "up" 
            ? "text-[#22c55e]" 
            : trend.direction === "down" 
              ? "text-[#ef4444]" 
              : "text-[#94a3b8]"
        }>
          {trend.value}
        </span>
        <span>{trend.label}</span>
      </div>
    </div>
  )
}

export function AdminOverviewContent() {
  // Fetch KPI data from mock data
  const totalSubmissions = getSubmissionsLast30Days()
  const avgConfidence = getAverageConfidenceLast30Days()
  const openFlags = getOpenFlagCount()
  const definitionsChanged = getDefinitionChangesLast7Days()

  // Mock trend data (in real app, would compare to prior period)
  const kpis: KpiCardProps[] = [
    {
      label: "Total submissions",
      value: totalSubmissions.toLocaleString(),
      trend: {
        direction: "up",
        value: "+12%",
        label: "vs prior 30 days",
      },
    },
    {
      label: "Avg confidence at submission",
      value: `${avgConfidence}%`,
      trend: {
        direction: "up",
        value: "+3%",
        label: "vs prior 30 days",
      },
    },
    {
      label: "Open flags",
      value: openFlags.toLocaleString(),
      trend: {
        direction: "down",
        value: "-8%",
        label: "vs prior period",
      },
    },
    {
      label: "Definitions changed",
      value: definitionsChanged,
      trend: {
        direction: "neutral",
        value: "",
        label: "last 7 days",
      },
    },
  ]

  return (
    <div className="p-8">
      {/* KPI Strip */}
      <div className="flex gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Placeholder for charts - will be added in later prompts */}
      <div className="mt-8 rounded-xl border border-[#e2e8f0] bg-white p-8 text-center">
        <p className="text-[#64748b]">Charts coming soon...</p>
      </div>
    </div>
  )
}
