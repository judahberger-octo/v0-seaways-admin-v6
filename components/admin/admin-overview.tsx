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
import {
  getSubmissionsLast30Days,
  getAverageConfidenceLast30Days,
  getOpenFlagCount,
  getDefinitionChangesLast7Days,
  getVerificationAccuracyByForm,
  getMostFlaggedFields,
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

      {/* Charts Row */}
      <div className="mt-8 grid grid-cols-2 gap-6">
        {/* Verification Accuracy Chart */}
        <VerificationAccuracyChart />

        {/* Most Flagged Fields Chart */}
        <MostFlaggedFieldsChart />
      </div>

      {/* Placeholder for more charts - will be added in later prompts */}
      <div className="mt-6 rounded-xl border border-[#e2e8f0] bg-white p-8 text-center">
        <p className="text-[#64748b]">More charts coming soon...</p>
      </div>
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

function MostFlaggedFieldsChart() {
  const data = getMostFlaggedFields(10)
  const maxFlagCount = Math.max(...data.map(d => d.flagCount))

  const handleRowClick = (fieldId: string) => {
    // In the future, this will navigate to Review Queue with field-flag detail panel open
    console.log(`Navigate to Review Queue for field: ${fieldId}`)
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-6">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-[#0f172a]">
          Most-flagged fields
        </h3>
        <p className="text-sm text-[#64748b]">Last 30 days</p>
      </div>

      {/* Field rows */}
      <div className="space-y-3">
        {data.map((field) => {
          const barWidth = (field.flagCount / maxFlagCount) * 100

          return (
            <button
              key={field.fieldId}
              onClick={() => handleRowClick(field.fieldId)}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f8fafc]"
            >
              {/* Field name and form chips */}
              <div className="w-36 flex-shrink-0">
                <p className="text-sm font-medium text-[#0f172a] group-hover:text-[#7c3aed]">
                  {field.fieldName}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {field.formNames.slice(0, 2).map((formName) => (
                    <span
                      key={formName}
                      className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#64748b]"
                    >
                      {formName.length > 12 ? formName.slice(0, 12) + '...' : formName}
                    </span>
                  ))}
                  {field.formNames.length > 2 && (
                    <span className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#64748b]">
                      +{field.formNames.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="flex flex-1 items-center gap-3">
                <div className="h-6 flex-1 rounded-full bg-[#fef2f2]">
                  <div
                    className="h-full rounded-full bg-[#f97316] transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-medium text-[#0f172a]">
                  {field.flagCount}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
