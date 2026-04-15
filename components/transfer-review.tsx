"use client"

import { useState, useEffect } from "react"
import { 
  ArrowLeft, 
  Settings, 
  Send, 
  ChevronDown, 
  ChevronRight,
  Check,
  Star,
  FileText,
  Layers,
  Flag,
  Pencil,
  ChevronUp,
  Maximize2,
  X
} from "lucide-react"

// Field status types
type FieldStatus = "verified" | "flagged" | "pending" | "not-populated" | "manually-edited"

interface FormField {
  id: string
  label: string
  value: string
  unit?: string
  confidence: number
  status: FieldStatus
  isCritical?: boolean
  sourceTab?: string
  sourceField?: string
}

interface FormSection {
  id: string
  name: string
  isExpanded: boolean
  fields: FormField[]
  reviewedCount: number
  needsManualEntry?: number
}

// Mock source data for the NAVTOR screenshot sections
const mockSourceData: Record<string, { sectionTitle: string; fields: { label: string; value: string; unit?: string; isHighlighted?: boolean }[] }> = {
  "Operational": {
    sectionTitle: "OPERATING CONDITIONS",
    fields: [
      { label: "Draught Forward", value: "16.6", unit: "m", isHighlighted: false },
      { label: "Draught Aft", value: "16.6", unit: "m" },
      { label: "Trim", value: "0.00", unit: "" },
      { label: "Ballast Water", value: "1896", unit: "MT" },
      { label: "Displacement", value: "172000", unit: "t" },
      { label: "Observed Distance", value: "142.3", unit: "nm" },
    ],
  },
  "Pos & Weather": {
    sectionTitle: "POSITION & WEATHER",
    fields: [
      { label: "Latitude", value: "17°51'54\" N", unit: "" },
      { label: "Longitude", value: "102°11'6\" W", unit: "" },
      { label: "Beaufort Scale", value: "4", unit: "" },
      { label: "Wind Direction", value: "NE", unit: "" },
      { label: "Sea State", value: "Moderate", unit: "" },
      { label: "Sea Height", value: "2.5", unit: "m" },
    ],
  },
  "Power": {
    sectionTitle: "POWER & MACHINERY",
    fields: [
      { label: "ME RPM", value: "36.6", unit: "" },
      { label: "ME Hours", value: "0.5", unit: "hrs" },
      { label: "Gen 1 Hours", value: "24.0", unit: "hrs" },
      { label: "Gen 2 Hours", value: "0.0", unit: "hrs" },
      { label: "Boiler Hours", value: "12.5", unit: "hrs" },
    ],
  },
  "Bunker": {
    sectionTitle: "BUNKER ROB",
    fields: [
      { label: "IFO Total", value: "1245.6", unit: "MT" },
      { label: "MGO Total", value: "342.8", unit: "MT" },
      { label: "LSF Total", value: "89.4", unit: "MT" },
      { label: "LSMGO Total", value: "156.2", unit: "MT" },
    ],
  },
  "Stock": {
    sectionTitle: "STOCK & WATER",
    fields: [
      { label: "Fresh Water ROB", value: "156.0", unit: "MT" },
      { label: "Distilled Water ROB", value: "45.2", unit: "MT" },
      { label: "Slops ROB", value: "12.5", unit: "MT" },
      { label: "Tank Cleaning Chemical", value: "25.0", unit: "LTRS" },
    ],
  },
  "General": {
    sectionTitle: "GENERAL INFORMATION",
    fields: [
      { label: "Report Number", value: "4528", unit: "" },
      { label: "Voyage Number", value: "408054", unit: "" },
      { label: "Report Type", value: "Noon Report (Sea)", unit: "" },
      { label: "Report From", value: "12/04/2026 12:00", unit: "" },
      { label: "Report To", value: "13/04/2026 12:00", unit: "" },
      { label: "Time Zone", value: "UTC+02:00", unit: "" },
    ],
  },
  "Consumptions": {
    sectionTitle: "FUEL CONSUMPTION",
    fields: [
      { label: "IFO Main", value: "24.5", unit: "MT" },
      { label: "IFO Aux", value: "3.2", unit: "MT" },
      { label: "MGO Main", value: "0.0", unit: "MT" },
      { label: "MGO Aux", value: "1.8", unit: "MT" },
    ],
  },
}

// Mock data for the VesLink form sections
const mockFormSections: FormSection[] = [
  {
    id: "general",
    name: "General Information",
    isExpanded: true,
    reviewedCount: 8,
    fields: [
      { id: "report-number", label: "Report Number", value: "4528", confidence: 99, status: "verified", sourceTab: "General", sourceField: "Report Number" },
      { id: "voyage-number", label: "Voyage Number", value: "408054", confidence: 99, status: "verified", sourceTab: "General", sourceField: "Voyage Number" },
      { id: "report-type", label: "Report Type", value: "Noon Report (Sea)", confidence: 98, status: "verified", sourceTab: "General", sourceField: "Report Type" },
      { id: "report-from", label: "Report From", value: "12/04/2026 12:00", confidence: 99, status: "verified", sourceTab: "General", sourceField: "Report From" },
      { id: "report-to", label: "Report To", value: "13/04/2026 12:00", confidence: 99, status: "verified", sourceTab: "General", sourceField: "Report To" },
      { id: "timezone", label: "Timezone", value: "UTC+02:00", confidence: 98, status: "verified", sourceTab: "General", sourceField: "Time Zone" },
      { id: "captain", label: "Captain", value: "Capt. JUDE LEVI DCRUZ", confidence: 97, status: "verified", sourceTab: "General", sourceField: "Master" },
      { id: "chief-engineer", label: "Chief Engineer", value: "YESHWANTH KUMAR", confidence: 97, status: "verified", sourceTab: "General", sourceField: "Chief Engineer" },
    ],
  },
  {
    id: "position-weather",
    name: "Position & Weather",
    isExpanded: false,
    reviewedCount: 10,
    needsManualEntry: 2,
    fields: [
      { id: "latitude", label: "Latitude", value: "17°51'54\" N", confidence: 99, status: "verified", sourceTab: "Pos & Weather", sourceField: "Latitude" },
      { id: "longitude", label: "Longitude", value: "102°11'6\" W", confidence: 99, status: "verified", sourceTab: "Pos & Weather", sourceField: "Longitude" },
      { id: "beaufort", label: "Beaufort", value: "4", confidence: 95, status: "pending", sourceTab: "Pos & Weather", sourceField: "Beaufort Scale" },
      { id: "wind-direction", label: "Wind Direction", value: "NE", confidence: 94, status: "pending", sourceTab: "Pos & Weather", sourceField: "Wind Direction" },
      { id: "sea-state", label: "Sea State", value: "Moderate", confidence: 92, status: "pending", sourceTab: "Pos & Weather", sourceField: "Sea State" },
      { id: "sea-height", label: "Sea Height", value: "2.5", unit: "m", confidence: 91, status: "pending", sourceTab: "Pos & Weather", sourceField: "Sea Height" },
    ],
  },
  {
    id: "distance-vessel",
    name: "Distance & Vessel",
    isExpanded: true,
    reviewedCount: 10,
    fields: [
      { id: "observed-distance", label: "Observed Distance", value: "142.3", unit: "nm", confidence: 94, status: "verified", isCritical: true, sourceTab: "Operational", sourceField: "Observed Distance" },
      { id: "engine-distance", label: "Engine Distance", value: "141.8", unit: "nm", confidence: 78, status: "pending", sourceTab: "Operational", sourceField: "Engine Distance" },
      { id: "time-since-last", label: "Time Since Last Report", value: "24.0", unit: "hrs", confidence: 99, status: "verified", sourceTab: "Operational", sourceField: "Hours Since Last Report" },
      { id: "cp-speed", label: "CP / Ordered Speed", value: "12.5", unit: "kts", confidence: 97, status: "verified", sourceTab: "Operational", sourceField: "Ordered Speed" },
      { id: "actual-speed", label: "Actual Speed", value: "11.8", unit: "kts", confidence: 95, status: "verified", sourceTab: "Operational", sourceField: "Actual Speed" },
      { id: "slip", label: "Slip", value: "0.35", unit: "%", confidence: 89, status: "pending", sourceTab: "Operational", sourceField: "Slip %" },
      { id: "forward-draft", label: "Forward Draft", value: "16.6", unit: "m", confidence: 98, status: "pending", isCritical: true, sourceTab: "Operational", sourceField: "Draught Forward" },
      { id: "aft-draft", label: "Aft Draft", value: "16.6", unit: "m", confidence: 98, status: "pending", isCritical: true, sourceTab: "Operational", sourceField: "Draught Aft" },
      { id: "trim", label: "Trim", value: "0.00", unit: "m", confidence: 99, status: "verified", sourceTab: "Operational", sourceField: "Trim" },
      { id: "cargo-weight", label: "Cargo Weight", value: "147948.45", unit: "MT", confidence: 97, status: "verified", sourceTab: "Operational", sourceField: "Cargo Weight" },
      { id: "ballast", label: "Ballast", value: "1896", unit: "MT", confidence: 96, status: "verified", isCritical: true, sourceTab: "Operational", sourceField: "Ballast Water" },
      { id: "displacement", label: "Displacement", value: "172000", unit: "t", confidence: 94, status: "verified", sourceTab: "Operational", sourceField: "Displacement" },
    ],
  },
  {
    id: "machinery",
    name: "Machinery",
    isExpanded: false,
    reviewedCount: 14,
    fields: [
      { id: "me-rpm", label: "Main Engine RPM", value: "36.6", confidence: 96, status: "verified", sourceTab: "Power", sourceField: "ME RPM" },
      { id: "me-hours", label: "Main Engine Hours", value: "0.5", confidence: 98, status: "verified", sourceTab: "Power", sourceField: "ME Hours" },
      { id: "generator-1-hrs", label: "Generator 1 Hours", value: "24.0", confidence: 97, status: "verified", sourceTab: "Power", sourceField: "Gen 1 Hours" },
      { id: "generator-2-hrs", label: "Generator 2 Hours", value: "0.0", confidence: 99, status: "verified", sourceTab: "Power", sourceField: "Gen 2 Hours" },
      { id: "boiler-hours", label: "Boiler Hours", value: "12.5", confidence: 95, status: "verified", sourceTab: "Power", sourceField: "Boiler Hours" },
    ],
  },
  {
    id: "bunker-rob",
    name: "Bunker & ROB",
    isExpanded: false,
    reviewedCount: 8,
    needsManualEntry: 4,
    fields: [
      { id: "ifo-rob", label: "IFO ROB", value: "1245.6", unit: "MT", confidence: 94, status: "pending", isCritical: true, sourceTab: "Bunker", sourceField: "IFO Total" },
      { id: "mgo-rob", label: "MGO ROB", value: "342.8", unit: "MT", confidence: 93, status: "pending", isCritical: true, sourceTab: "Bunker", sourceField: "MGO Total" },
      { id: "fresh-water-rob", label: "Fresh Water ROB", value: "156.0", unit: "MT", confidence: 96, status: "pending", isCritical: true, sourceTab: "Stock", sourceField: "Fresh Water ROB" },
      { id: "distilled-water-rob", label: "Distilled Water ROB", value: "45.2", unit: "MT", confidence: 95, status: "pending", isCritical: true, sourceTab: "Stock", sourceField: "Distilled Water ROB" },
      { id: "slops-rob", label: "Slops ROB", value: "12.5", unit: "MT", confidence: 92, status: "pending", isCritical: true, sourceTab: "Stock", sourceField: "Slops ROB" },
    ],
  },
]

interface TransferReviewProps {
  reportId: string
  onBack: () => void
}

// Loading State Component
function LoadingState({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const steps = [
    "Reading NAVTOR report data",
    "Identifying target form fields",
    "Mapping source to target",
    "Running validation checks",
  ]

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 600)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          clearInterval(stepInterval)
          setTimeout(onComplete, 300)
          return 100
        }
        return prev + 4
      })
    }, 100)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [onComplete, steps.length])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-7rem)]">
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-8 max-w-md w-full">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-6 text-center">
          Generating VesLink form from NAVTOR Report #4528...
        </h2>

        <div className="space-y-3 mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              {index < currentStep ? (
                <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : index === currentStep ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-[#e2e8f0]" />
              )}
              <span
                className={`text-sm ${
                  index <= currentStep ? "text-[#0f172a]" : "text-[#94a3b8]"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full bg-[#e2e8f0] rounded-full h-2">
          <div
            className="bg-[#7c3aed] h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Field Row Component
function FieldRow({
  field,
  isSelected,
  onClick,
}: {
  field: FormField
  isSelected: boolean
  onClick: () => void
}) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-[#16a34a]"
    if (confidence >= 70) return "text-[#d97706]"
    return "text-[#dc2626]"
  }

  const getStatusBorder = (status: FieldStatus, confidence: number) => {
    if (status === "verified") return "border-l-[#16a34a]"
    if (status === "flagged") return "border-l-[#dc2626]"
    if (status === "manually-edited") return "border-l-[#2563eb]"
    if (status === "not-populated") return "border-l-[#e2e8f0] border-dashed"
    // pending - use confidence color
    if (confidence >= 90) return "border-l-[#16a34a]"
    if (confidence >= 70) return "border-l-[#d97706]"
    return "border-l-[#dc2626]"
  }

  const isCriticalUnverified = field.isCritical && field.status !== "verified"

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between py-2.5 px-3 border-l-[3px] transition-all text-left ${getStatusBorder(
        field.status,
        field.confidence
      )} ${
        isSelected
          ? "bg-[#ede9fe] border-l-[#7c3aed]"
          : isCriticalUnverified
          ? "bg-[#fffbeb] hover:bg-[#fef3c7]"
          : "hover:bg-[#f8fafc]"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {field.isCritical && (
          <Star className="w-3.5 h-3.5 text-[#f59e0b] flex-shrink-0" fill="#f59e0b" />
        )}
        <span className="text-sm text-[#64748b] truncate">{field.label}:</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#0f172a]">
          {field.value}
          {field.unit && <span className="text-[#64748b] ml-1">{field.unit}</span>}
        </span>
        <span className={`text-xs font-medium ${getConfidenceColor(field.confidence)}`}>
          {field.confidence}%
        </span>
        {field.status === "verified" && (
          <Check className="w-4 h-4 text-[#16a34a]" />
        )}
      </div>
    </button>
  )
}

// Form Section Component
function FormSectionComponent({
  section,
  selectedFieldId,
  onFieldSelect,
  onToggle,
}: {
  section: FormSection
  selectedFieldId: string | null
  onFieldSelect: (field: FormField) => void
  onToggle: () => void
}) {
  const totalFields = section.fields.length

  return (
    <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors"
      >
        <div className="flex items-center gap-2">
          {section.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#64748b]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#64748b]" />
          )}
          <span className="font-medium text-[#0f172a]">{section.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">
            {section.reviewedCount}/{totalFields} reviewed
          </span>
          {section.needsManualEntry && (
            <span className="text-xs text-[#d97706]">
              • {section.needsManualEntry} need manual entry
            </span>
          )}
        </div>
      </button>

      {section.isExpanded && (
        <div className="divide-y divide-[#e2e8f0]">
          {section.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              onClick={() => onFieldSelect(field)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Field Definition Panel Component
function FieldDefinitionPanel({
  field,
  sectionName,
  onVerify,
  onFlag,
}: {
  field: FormField
  sectionName: string
  onVerify: () => void
  onFlag: (reason: string, comment: string) => void
}) {
  const [isCalculationExpanded, setIsCalculationExpanded] = useState(false)
  const [isValidationExpanded, setIsValidationExpanded] = useState(true)
  const [isFlagging, setIsFlagging] = useState(false)
  const [flagReason, setFlagReason] = useState("")
  const [flagComment, setFlagComment] = useState("")

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "#16a34a"
    if (confidence >= 70) return "#d97706"
    return "#dc2626"
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return "HIGH CONFIDENCE"
    if (confidence >= 70) return "MEDIUM CONFIDENCE"
    return "LOW CONFIDENCE"
  }

  const confidenceColor = getConfidenceColor(field.confidence)
  const confidenceDots = Math.round(field.confidence / 20) // 0-5 dots

  const handleSubmitFlag = () => {
    onFlag(flagReason, flagComment)
    setIsFlagging(false)
    setFlagReason("")
    setFlagComment("")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderLeftWidth: "4px", borderLeftColor: confidenceColor }}
      >
        <span 
          className="text-xs font-semibold tracking-wide"
          style={{ color: confidenceColor }}
        >
          SELECTED FIELD
        </span>
        <span className="text-xs text-[#64748b]">{sectionName}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Field Name & Value */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#0f172a] mb-1">{field.label}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0f172a]">{field.value}</span>
            {field.unit && (
              <span className="text-lg text-[#64748b]">{field.unit}</span>
            )}
          </div>
        </div>

        {/* Source Reference */}
        <div className="mb-4 text-sm">
          <div className="flex items-center gap-2 text-[#64748b] mb-1">
            <FileText className="w-4 h-4" />
            <span>Report #4528 - {field.sourceTab} tab</span>
          </div>
          <div className="text-[#94a3b8]">
            Mapped from: <span className="text-[#64748b]">{field.sourceField}</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span 
              className="text-lg font-semibold"
              style={{ color: confidenceColor }}
            >
              {field.confidence}%
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((dot) => (
                <div
                  key={dot}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: dot <= confidenceDots ? confidenceColor : "#e2e8f0",
                  }}
                />
              ))}
            </div>
            <span 
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ 
                backgroundColor: `${confidenceColor}15`,
                color: confidenceColor 
              }}
            >
              Auto-matched
            </span>
          </div>
        </div>

        {/* Critical Field Badge */}
        {field.isCritical && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-[#fffbeb] border border-[#fcd34d] rounded-lg">
            <Star className="w-4 h-4 text-[#f59e0b]" fill="#f59e0b" />
            <span className="text-sm font-medium text-[#92400e]">
              Critical Field — requires verification
            </span>
          </div>
        )}

        {/* Validation Checks */}
        <div className="mb-4">
          <button
            onClick={() => setIsValidationExpanded(!isValidationExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-[#0f172a] mb-2"
          >
            {isValidationExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Validation Checks
          </button>
          {isValidationExpanded && (
            <div className="space-y-2 pl-6">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[#64748b]">Value populated</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[#64748b]">Within expected range</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[#64748b]">Consistent with last 5 reports</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#16a34a]" />
                <span className="text-[#64748b]">Source-target match confirmed</span>
              </div>
            </div>
          )}
        </div>

        {/* How was this calculated? */}
        <div className="mb-4">
          <button
            onClick={() => setIsCalculationExpanded(!isCalculationExpanded)}
            className="flex items-center gap-1 text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9]"
          >
            {isCalculationExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            How was this calculated?
          </button>
          {isCalculationExpanded && (
            <div className="mt-2 pl-5 text-sm text-[#64748b]">
              Direct field mapping — NAVTOR {field.sourceTab} tab → {field.sourceField}
            </div>
          )}
        </div>

        {/* Flag Form */}
        {isFlagging && (
          <div className="mb-4 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#991b1b]">Flag this field</span>
              <button 
                onClick={() => setIsFlagging(false)}
                className="text-[#991b1b] hover:text-[#7f1d1d]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <select
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg mb-2 bg-white"
            >
              <option value="">Select reason...</option>
              <option value="wrong-value">Wrong value</option>
              <option value="wrong-source">Wrong source</option>
              <option value="missing">Missing data</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={flagComment}
              onChange={(e) => setFlagComment(e.target.value)}
              placeholder="Comment (optional)"
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg mb-2 resize-none"
              rows={2}
            />
            <button
              onClick={handleSubmitFlag}
              disabled={!flagReason}
              className="w-full px-3 py-2 text-sm font-medium bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] disabled:bg-[#e2e8f0] disabled:text-[#94a3b8]"
            >
              Submit Flag
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isFlagging && (
        <div className="p-4 border-t border-[#e2e8f0] flex items-center gap-2">
          <button
            onClick={onVerify}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white rounded-lg font-medium hover:bg-[#15803d] transition-colors"
          >
            <Check className="w-4 h-4" />
            Verify
          </button>
          <button
            onClick={() => {}}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e2e8f0] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setIsFlagging(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e2e8f0] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors"
          >
            <Flag className="w-4 h-4" />
            Flag
          </button>
        </div>
      )}
    </div>
  )
}

// Source Screenshot Preview Component
function SourceScreenshotPreview({
  field,
  selectedReportId,
  onReportChange,
}: {
  field: FormField
  selectedReportId: string
  onReportChange: (id: string) => void
}) {
  const sourceTab = field.sourceTab || "Operational"
  const sourceData = mockSourceData[sourceTab]
  const tabs = ["Operational", "Pos & Weather", "Power", "Consumptions", "Bunker", "Stock"]
  const reports = [
    { id: "4528", label: "#4528", isPrimary: true },
    { id: "4527", label: "#4527", isPrimary: false },
    { id: "4526", label: "#4526", isPrimary: false },
    { id: "4525", label: "#4525", isPrimary: false },
  ]

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0f172a]">NAVTOR</span>
          <span className="text-sm text-[#64748b]">— {sourceTab} TAB</span>
        </div>
        <button className="p-1.5 hover:bg-[#f8fafc] rounded transition-colors">
          <Maximize2 className="w-4 h-4 text-[#64748b]" />
        </button>
      </div>

      {/* Tab Indicator Row */}
      <div className="px-4 py-2 border-b border-[#e2e8f0] bg-white overflow-x-auto">
        <div className="flex items-center gap-1 text-xs">
          {tabs.map((tab) => (
            <span
              key={tab}
              className={`px-2 py-1 rounded whitespace-nowrap ${
                tab === sourceTab
                  ? "bg-[#0b1120] text-white font-medium"
                  : "text-[#64748b]"
              }`}
            >
              {tab}
              {tab !== sourceTab && " ✓"}
            </span>
          ))}
        </div>
      </div>

      {/* Screenshot Area - Dark Navy NAVTOR Style */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full bg-[#0b1120] rounded-lg p-4 overflow-hidden">
          {/* Section Title */}
          <div className="flex items-center gap-2 mb-4">
            <ChevronDown className="w-4 h-4 text-[#64748b]" />
            <span className="text-sm font-medium text-[#94a3b8] tracking-wide">
              {sourceData?.sectionTitle || "OPERATING CONDITIONS"}
            </span>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            {sourceData?.fields.map((sourceField) => {
              const isHighlighted = sourceField.label === field.sourceField
              return (
                <div
                  key={sourceField.label}
                  className={`flex items-center justify-between py-2 px-3 rounded ${
                    isHighlighted
                      ? "ring-2 ring-[#f59e0b] bg-[#f59e0b]/10 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : ""
                  }`}
                >
                  <span className="text-sm text-[#94a3b8]">{sourceField.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#0f2a3d] border border-[#1e4a5f] rounded px-3 py-1.5 min-w-[100px]">
                      <span className="text-sm text-white font-medium">
                        {sourceField.value}
                      </span>
                    </div>
                    {sourceField.unit && (
                      <span className="text-sm text-[#64748b] w-8">{sourceField.unit}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="px-4 py-3 border-t border-[#e2e8f0] bg-white">
        <div className="flex items-center gap-2">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => onReportChange(report.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedReportId === report.id
                  ? "bg-[#7c3aed] text-white"
                  : "bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
              }`}
            >
              {report.label}
              {report.isPrimary && selectedReportId === report.id && (
                <span className="ml-1 text-white/70">primary</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TransferReview({ reportId, onBack }: TransferReviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sections, setSections] = useState(mockFormSections)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [selectedReportId, setSelectedReportId] = useState("4528")

  // Get the section name for the selected field
  const getFieldSectionName = (fieldId: string) => {
    for (const section of sections) {
      if (section.fields.some((f) => f.id === fieldId)) {
        return section.name
      }
    }
    return ""
  }

  // Calculate stats
  const allFields = sections.flatMap((s) => s.fields)
  const totalFields = allFields.length
  const verifiedCount = allFields.filter((f) => f.status === "verified").length
  const flaggedCount = allFields.filter((f) => f.status === "flagged").length
  const pendingCount = allFields.filter((f) => f.status === "pending").length
  const criticalFields = allFields.filter((f) => f.isCritical)
  const criticalVerified = criticalFields.filter((f) => f.status === "verified").length
  const criticalTotal = criticalFields.length
  const canSubmit = criticalVerified === criticalTotal

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      )
    )
  }

  const handleFieldSelect = (field: FormField) => {
    setSelectedField(field)
  }

  const handleVerify = () => {
    if (!selectedField) return
    
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        fields: section.fields.map((f) =>
          f.id === selectedField.id ? { ...f, status: "verified" as FieldStatus } : f
        ),
        reviewedCount: section.fields.filter(
          (f) => f.id === selectedField.id || f.status === "verified" || f.status === "flagged"
        ).length,
      }))
    )
    
    // Update selected field to reflect new status
    setSelectedField({ ...selectedField, status: "verified" })
    
    // Auto-advance to next unverified field
    const allFieldsFlat = sections.flatMap((s) => s.fields)
    const currentIndex = allFieldsFlat.findIndex((f) => f.id === selectedField.id)
    const nextUnverified = allFieldsFlat.slice(currentIndex + 1).find((f) => f.status === "pending")
    if (nextUnverified) {
      setTimeout(() => setSelectedField(nextUnverified), 300)
    }
  }

  const handleFlag = (reason: string, comment: string) => {
    if (!selectedField) return
    
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        fields: section.fields.map((f) =>
          f.id === selectedField.id ? { ...f, status: "flagged" as FieldStatus } : f
        ),
      }))
    )
    
    setSelectedField({ ...selectedField, status: "flagged" })
  }

  if (isLoading) {
    return <LoadingState onComplete={() => setIsLoading(false)} />
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header Bar */}
      <div className="h-16 border-b border-[#e2e8f0] bg-white flex items-center justify-between px-6 flex-shrink-0">
        {/* Left - Back + Report Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#64748b]" />
          </button>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#0f172a]">SEAWAYS SKOPELOS</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#dbeafe] text-[#2563eb] font-medium">
              Noon Report (Sea)
            </span>
            <span className="text-sm text-[#64748b]">
              12/04/2026 12:00 - 13/04/2026 12:00
            </span>
            <span className="text-sm text-[#94a3b8]">Report #{reportId}</span>
          </div>
        </div>

        {/* Center - Progress */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[#0f172a]">
              {verifiedCount + flaggedCount} / {totalFields} fields reviewed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-[#e2e8f0] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#16a34a]"
                style={{ width: `${(verifiedCount / totalFields) * 100}%` }}
              />
              <div
                className="h-full bg-[#d97706]"
                style={{ width: `${(flaggedCount / totalFields) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#16a34a]">{verifiedCount} verified</span>
              <span className="text-[#94a3b8]">•</span>
              <span className="text-[#d97706]">{flaggedCount} flagged</span>
              <span className="text-[#94a3b8]">•</span>
              <span className="text-[#64748b]">{pendingCount} pending</span>
            </div>
          </div>
        </div>

        {/* Right - Status + Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[#f1f5f9] text-[#64748b] font-medium">
              Draft
            </span>
            <span className="text-xs text-[#94a3b8]">
              Last edited by Chief Officer at 14:32
            </span>
          </div>
          <div className="h-6 w-px bg-[#e2e8f0]" />
          <button className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-[#64748b]" />
          </button>
          <button className="px-4 py-2 text-sm font-medium border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors">
            Save Draft
          </button>
          <button
            disabled={!canSubmit}
            title={
              !canSubmit
                ? `Verify all ${criticalTotal} critical fields to submit (${criticalTotal - criticalVerified} remaining)`
                : undefined
            }
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
              canSubmit
                ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            Submit to VesLink
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-[40%] border-r border-[#e2e8f0] flex flex-col">
          {selectedField ? (
            <>
              {/* Top Section - Field Definition (~45%) */}
              <div className="h-[45%] border-b border-[#e2e8f0] overflow-hidden bg-white">
                <FieldDefinitionPanel
                  field={selectedField}
                  sectionName={getFieldSectionName(selectedField.id)}
                  onVerify={handleVerify}
                  onFlag={handleFlag}
                />
              </div>

              {/* Bottom Section - Source Screenshot (~55%) */}
              <div className="h-[55%] overflow-hidden">
                <SourceScreenshotPreview
                  field={selectedField}
                  selectedReportId={selectedReportId}
                  onReportChange={setSelectedReportId}
                />
              </div>
            </>
          ) : (
            <>
              {/* Top Section - Placeholder */}
              <div className="flex-1 flex items-center justify-center border-b border-[#e2e8f0] p-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-[#f8fafc] flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-[#94a3b8]" />
                  </div>
                  <p className="text-[#64748b] text-sm max-w-[240px]">
                    Click any field on the target form to see its source mapping and validation.
                  </p>
                </div>
              </div>

              {/* Bottom Section - Source Preview Placeholder */}
              <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc]">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-6 h-6 text-[#94a3b8]" />
                  </div>
                  <p className="text-[#64748b] text-sm max-w-[240px] mb-4">
                    Select a field to see its NAVTOR source data
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {["Operational", "Pos & Weather", "Power", "Consumptions", "Bunker", "Stock"].map(
                      (tab) => (
                        <span
                          key={tab}
                          className="text-xs px-2 py-1 bg-white border border-[#e2e8f0] rounded text-[#94a3b8]"
                        >
                          {tab}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Target Form */}
        <div className="w-[60%] flex flex-col overflow-hidden">
          {/* VesLink Header */}
          <div className="bg-[#d97706] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">VesLink</span>
              <span className="text-white/90">Noon Report (Sea) v5.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">Target Form</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#16a34a] text-white font-medium">
                Editable
              </span>
            </div>
          </div>

          {/* Form Sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sections.map((section) => (
              <FormSectionComponent
                key={section.id}
                section={section}
                selectedFieldId={selectedField?.id ?? null}
                onFieldSelect={handleFieldSelect}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
