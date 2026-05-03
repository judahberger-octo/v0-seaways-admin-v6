"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts"
import { useState, useMemo } from "react"
import { Search, ChevronUp, ChevronDown, X } from "lucide-react"
import {
  getSubmissionsLast30Days,
  getAverageConfidenceLast30Days,
  getOpenFlagCount,
  getDefinitionChangesLast7Days,
  getVerificationAccuracyByForm,
  getVesselsByAdoption,
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

      {/* Verification Accuracy Chart - full width */}
      <div className="mt-8">
        <VerificationAccuracyChart />
      </div>

      {/* Crew Adoption Chart - full width */}
      <CrewAdoptionChart />
    </div>
  )
}

// Colors for the stacked bar chart segments
const COLORS = {
  verified: "#22c55e",      // green - crew confirmed correct
  autoAccepted: "#86efac",  // light green - no flag, submitted as-prefilled
  flagged: "#f97316",       // orange - crew marked incorrect
}

function VerificationAccuracyChart() {
  const data = getVerificationAccuracyByForm()

  // Transform data for stacked bar chart
  const chartData = data.map(item => ({
    formName: item.formName,
    formId: item.formId,
    verified: item.verifiedPct,
    autoAccepted: item.autoAcceptedPct,
    flagged: item.flaggedPct,
    total: item.total,
  }))

  const handleBarClick = (formId: string) => {
    // In the future, this will navigate to Review Queue filtered by form type
    console.log(`Navigate to Review Queue for form: ${formId}`)
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-6">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-[#0f172a]">
          Verification accuracy by form type
        </h3>
        <p className="text-sm text-[#64748b]">Last 30 days</p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.verified }} />
          <span className="text-sm text-[#64748b]">Verified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.autoAccepted }} />
          <span className="text-sm text-[#64748b]">Auto-accepted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.flagged }} />
          <span className="text-sm text-[#64748b]">Flagged</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 80, left: 120, bottom: 0 }}
            barCategoryGap="20%"
          >
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              hide 
            />
            <YAxis 
              type="category" 
              dataKey="formName" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "#334155" }}
              width={110}
            />
            <Bar 
              dataKey="verified" 
              stackId="stack" 
              fill={COLORS.verified}
              radius={[4, 0, 0, 4]}
              onClick={(data) => handleBarClick(data.formId)}
              className="cursor-pointer"
            >
              <LabelList 
                dataKey="verified" 
                position="center" 
                fill="#fff" 
                fontSize={11}
                fontWeight={500}
                formatter={(value: number) => value > 8 ? `${value}%` : ''}
              />
            </Bar>
            <Bar 
              dataKey="autoAccepted" 
              stackId="stack" 
              fill={COLORS.autoAccepted}
              onClick={(data) => handleBarClick(data.formId)}
              className="cursor-pointer"
            >
              <LabelList 
                dataKey="autoAccepted" 
                position="center" 
                fill="#166534" 
                fontSize={11}
                fontWeight={500}
                formatter={(value: number) => value > 8 ? `${value}%` : ''}
              />
            </Bar>
            <Bar 
              dataKey="flagged" 
              stackId="stack" 
              fill={COLORS.flagged}
              radius={[0, 4, 4, 0]}
              onClick={(data) => handleBarClick(data.formId)}
              className="cursor-pointer"
            >
              <LabelList 
                dataKey="flagged" 
                position="center" 
                fill="#fff" 
                fontSize={11}
                fontWeight={500}
                formatter={(value: number) => value > 5 ? `${value}%` : ''}
              />
              {/* Total field events shown after the bar */}
              <LabelList 
                dataKey="total" 
                position="right" 
                fill="#94a3b8" 
                fontSize={12}
                formatter={(value: number) => `${value.toLocaleString()} fields`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Get adoption bar color based on percentage
function getAdoptionColor(rate: number): string {
  if (rate === 0) return "#d1d5db" // grey
  if (rate < 30) return "#ef4444"  // red
  if (rate < 80) return "#eab308"  // yellow
  return "#22c55e"                  // green
}

// Format relative time
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

type SortKey = "vessel" | "adoption" | "submissions" | "lastActivity"
type SortDir = "asc" | "desc"

function CrewAdoptionChart() {
  const allData = getVesselsByAdoption()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("adoption")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [showZeroModal, setShowZeroModal] = useState(false)

  // Summary stats
  const topAdopter = allData.find(d => d.adoptionRate > 0)
  const activeAdopters = allData.filter(d => d.adoptionRate > 0)
  const lowestActiveAdopter = activeAdopters[activeAdopters.length - 1]
  const zeroAdopters = allData.filter(d => d.adoptionRate === 0)

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = allData.filter(d => 
      d.vessel.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "vessel":
          cmp = a.vessel.name.localeCompare(b.vessel.name)
          break
        case "adoption":
          cmp = a.adoptionRate - b.adoptionRate
          break
        case "submissions":
          cmp = a.submissionCount - b.submissionCount
          break
        case "lastActivity":
          const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
          const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
          cmp = aTime - bTime
          break
      }
      return sortDir === "desc" ? -cmp : cmp
    })

    return result
  }, [allData, searchQuery, sortKey, sortDir])

  const displayData = showAll ? filteredData : filteredData.slice(0, 12)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null
    return sortDir === "desc" 
      ? <ChevronDown className="h-4 w-4" /> 
      : <ChevronUp className="h-4 w-4" />
  }

  return (
    <div className="mt-6 rounded-xl border border-[#e2e8f0] bg-white p-6">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-[#0f172a]">
          Crew adoption by vessel
        </h3>
        <p className="text-sm text-[#64748b]">Last 30 days</p>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <input
          type="text"
          placeholder="Search vessels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_2fr_80px_100px_120px] gap-4 border-b border-[#e2e8f0] pb-2 text-sm font-medium text-[#64748b]">
        <button 
          onClick={() => handleSort("vessel")}
          className="flex items-center gap-1 text-left hover:text-[#0f172a]"
        >
          Vessel <SortIcon columnKey="vessel" />
        </button>
        <button 
          onClick={() => handleSort("adoption")}
          className="flex items-center gap-1 text-left hover:text-[#0f172a]"
        >
          Adoption <SortIcon columnKey="adoption" />
        </button>
        <span className="text-right">%</span>
        <button 
          onClick={() => handleSort("submissions")}
          className="flex items-center justify-end gap-1 hover:text-[#0f172a]"
        >
          Submissions <SortIcon columnKey="submissions" />
        </button>
        <button 
          onClick={() => handleSort("lastActivity")}
          className="flex items-center justify-end gap-1 hover:text-[#0f172a]"
        >
          Last activity <SortIcon columnKey="lastActivity" />
        </button>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#f1f5f9]">
        {displayData.map((item) => (
          <div
            key={item.vessel.id}
            className="grid grid-cols-[1fr_2fr_80px_100px_120px] gap-4 py-3 text-sm"
          >
            <span className="font-medium text-[#0f172a] truncate" title={item.vessel.name}>
              {item.vessel.name}
            </span>
            <div className="flex items-center">
              <div className="h-2 w-full rounded-full bg-[#f1f5f9]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.adoptionRate}%`,
                    backgroundColor: getAdoptionColor(item.adoptionRate),
                  }}
                />
              </div>
            </div>
            <span 
              className="text-right font-semibold"
              style={{ color: getAdoptionColor(item.adoptionRate) }}
            >
              {item.adoptionRate}%
            </span>
            <span className="text-right text-[#64748b]">
              {item.submissionCount}
            </span>
            <span className="text-right text-[#64748b]">
              {formatRelativeTime(item.lastActivity)}
            </span>
          </div>
        ))}
      </div>

      {/* Show All Toggle */}
      {filteredData.length > 12 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full rounded-lg border border-[#e2e8f0] py-2 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
        >
          {showAll ? "Show less" : `Show all ${filteredData.length}`}
        </button>
      )}

      {/* Zero Adopters Modal */}
      {showZeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#0f172a]">
                Vessels at 0% adoption
              </h4>
              <button
                onClick={() => setShowZeroModal(false)}
                className="rounded-lg p-1 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {zeroAdopters.length === 0 ? (
                <p className="text-sm text-[#64748b]">No vessels at 0% adoption.</p>
              ) : (
                <ul className="space-y-2">
                  {zeroAdopters.map((item) => (
                    <li
                      key={item.vessel.id}
                      className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm text-[#0f172a]"
                    >
                      {item.vessel.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
