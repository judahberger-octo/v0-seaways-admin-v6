"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  X,
  Search,
  Keyboard,
  AlertCircle,
  ExternalLink,
  Cog,
  Info,
  Filter,
  Image as ImageIcon
} from "lucide-react"
import { AdminTestingSuite } from "./admin-testing-suite"
import { VesLinkForm, CRITICAL_FIELDS_NOON_SEA } from "./veslink-form"
import { NavtorScreenshot } from "./navtor-screenshot"
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react"

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

// Field card data for the new scrollable list
interface FieldCardData {
  id: string
  fieldName: string
  fieldDefinition?: string
  status: FieldStatus
  isCritical: boolean
  mappedSource: string
  sourceTab: string
  isPopulated: boolean
  value?: string
  unit?: string
  confidence?: number
}

interface FormSection {
  id: string
  name: string
  isExpanded: boolean
  fields: FormField[]
  reviewedCount: number
  needsManualEntry?: number
}

// Mock data for the VesLink form sections
const createMockFormSections = (): FormSection[] => [
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
      { id: "ballast", label: "Ballast", value: "1896", unit: "MT", confidence: 96, status: "pending", isCritical: true, sourceTab: "Operational", sourceField: "Ballast Water" },
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
  isAdminMode?: boolean
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: "error" | "success" | "warning"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    error: "bg-[#fef2f2] border-[#fecaca] text-[#991b1b]",
    success: "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]",
    warning: "bg-[#fffbeb] border-[#fcd34d] text-[#92400e]",
  }

  const icons = {
    error: <X className="w-4 h-4" />,
    success: <Check className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
  }

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg border shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 ${colors[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Section groups for field cards
interface FieldSection {
  id: string
  name: string
  fields: FieldCardData[]
}

// Mock field data organized by sections - matching the VesLink form structure
const createFieldCardSections = (verifiedFields: Set<string>): FieldSection[] => {
  const getStatus = (fieldId: string): FieldStatus => {
    if (verifiedFields.has(fieldId)) return "verified"
    return "pending"
  }
  
  return [
    {
      id: "header",
      name: "Header",
      fields: [
        { id: "date-time", fieldName: "Date/Time", status: getStatus("date-time"), isCritical: true, mappedSource: "Report Date/Time", sourceTab: "Operational", isPopulated: true, value: "14/04/2026 12:00", confidence: 98 },
        { id: "voyage-number", fieldName: "Voyage Number", status: getStatus("voyage-number"), isCritical: true, mappedSource: "Voyage Number", sourceTab: "Operational", isPopulated: true, value: "124", confidence: 99 },
        { id: "vessel-condition", fieldName: "Vessel Condition", status: getStatus("vessel-condition"), isCritical: true, mappedSource: "Vessel Condition", sourceTab: "Operational", isPopulated: true, value: "Laden", confidence: 97 },
        { id: "vessel-name", fieldName: "Vessel Name", status: getStatus("vessel-name"), isCritical: false, mappedSource: "Vessel Name", sourceTab: "Operational", isPopulated: true, value: "SEAWAYS SKOPELOS", confidence: 99 },
        { id: "latitude", fieldName: "Latitude", status: getStatus("latitude"), isCritical: false, mappedSource: "Latitude", sourceTab: "Position", isPopulated: true, value: "35 42' 00\" N", confidence: 99 },
        { id: "longitude", fieldName: "Longitude", status: getStatus("longitude"), isCritical: false, mappedSource: "Longitude", sourceTab: "Position", isPopulated: true, value: "014 25' 00\" E", confidence: 99 },
        { id: "next-port", fieldName: "Next Port", status: getStatus("next-port"), isCritical: true, mappedSource: "Next Port", sourceTab: "Operational", isPopulated: true, value: "Fujairah", confidence: 96 },
        { id: "eta", fieldName: "ETA", status: getStatus("eta"), isCritical: true, mappedSource: "ETA", sourceTab: "Operational", isPopulated: true, value: "22/04/2026 14:00", confidence: 95 },
      ],
    },
    {
      id: "distance-vessel",
      name: "Distance and Vessel",
      fields: [
        { id: "distance-to-go", fieldName: "Distance to Go", status: getStatus("distance-to-go"), isCritical: true, mappedSource: "Distance to Go", sourceTab: "Operational", isPopulated: true, value: "2847", unit: "nm", confidence: 97 },
        { id: "cp-ordered-speed", fieldName: "CP / Ordered Speed", status: getStatus("cp-ordered-speed"), isCritical: true, mappedSource: "Ordered Speed", sourceTab: "Operational", isPopulated: true, value: "12.5", unit: "kts", confidence: 98 },
        { id: "reported-speed", fieldName: "Reported Speed", status: getStatus("reported-speed"), isCritical: true, mappedSource: "Reported Speed", sourceTab: "Operational", isPopulated: true, value: "12.3", unit: "kts", confidence: 96 },
        { id: "observed-distance", fieldName: "Observed Distance", status: getStatus("observed-distance"), isCritical: true, mappedSource: "Observed Distance", sourceTab: "Operational", isPopulated: true, value: "142.3", unit: "nm", confidence: 94 },
        { id: "time-since-last", fieldName: "Time Since Last Report", status: getStatus("time-since-last"), isCritical: true, mappedSource: "Time Since Last Report", sourceTab: "Operational", isPopulated: true, value: "24.0", unit: "hrs", confidence: 99 },
        { id: "ballast", fieldName: "Ballast", status: getStatus("ballast"), isCritical: false, mappedSource: "Ballast Water", sourceTab: "Operational", isPopulated: true, value: "1896", unit: "MT", confidence: 96 },
        { id: "displacement", fieldName: "Displacement", status: getStatus("displacement"), isCritical: false, mappedSource: "Displacement", sourceTab: "Operational", isPopulated: true, value: "172000", unit: "t", confidence: 94 },
        { id: "slip", fieldName: "Slip", status: getStatus("slip"), isCritical: false, mappedSource: "Slip %", sourceTab: "Operational", isPopulated: true, value: "0.35", unit: "%", confidence: 89 },
        { id: "fwd-draft", fieldName: "Forward Draft", status: getStatus("fwd-draft"), isCritical: false, mappedSource: "Draught Forward", sourceTab: "Operational", isPopulated: true, value: "16.6", unit: "m", confidence: 98 },
        { id: "aft-draft", fieldName: "Aft Draft", status: getStatus("aft-draft"), isCritical: false, mappedSource: "Draught Aft", sourceTab: "Operational", isPopulated: true, value: "16.6", unit: "m", confidence: 98 },
      ],
    },
    {
      id: "machinery",
      name: "Machinery",
      fields: [
        { id: "main-engine-rpm", fieldName: "Main Engine RPM", status: getStatus("main-engine-rpm"), isCritical: true, mappedSource: "ME RPM", sourceTab: "Power", isPopulated: true, value: "85.2", confidence: 96 },
        { id: "gen1-kwhrs", fieldName: "Generator 1 KWhrs", status: getStatus("gen1-kwhrs"), isCritical: false, mappedSource: "Gen 1 KWhrs", sourceTab: "Power", isPopulated: true, value: "1220", confidence: 97 },
        { id: "gen1-hrs", fieldName: "Generator 1 Hours", status: getStatus("gen1-hrs"), isCritical: false, mappedSource: "Gen 1 Hours", sourceTab: "Power", isPopulated: true, value: "4.0", confidence: 97 },
        { id: "boiler-hrs", fieldName: "Boiler Hours", status: getStatus("boiler-hrs"), isCritical: false, mappedSource: "Boiler Hours", sourceTab: "Power", isPopulated: true, value: "0.9", confidence: 95 },
      ],
    },
    {
      id: "weather",
      name: "Weather",
      fields: [
        { id: "beaufort", fieldName: "Beaufort", status: getStatus("beaufort"), isCritical: true, mappedSource: "Beaufort Scale", sourceTab: "Pos & Weather", isPopulated: true, value: "4", confidence: 95 },
        { id: "wind-direction", fieldName: "Wind Direction", status: getStatus("wind-direction"), isCritical: false, mappedSource: "Wind Direction", sourceTab: "Pos & Weather", isPopulated: true, value: "NW", confidence: 94 },
        { id: "sea-state", fieldName: "Sea State", status: getStatus("sea-state"), isCritical: false, mappedSource: "Sea State", sourceTab: "Pos & Weather", isPopulated: true, value: "Moderate", confidence: 92 },
        { id: "sea-height", fieldName: "Sea Height", status: getStatus("sea-height"), isCritical: false, mappedSource: "Sea Height", sourceTab: "Pos & Weather", isPopulated: true, value: "1.5", unit: "m", confidence: 91 },
        { id: "sea-temp", fieldName: "Sea Temperature", status: getStatus("sea-temp"), isCritical: false, mappedSource: "Sea Temperature", sourceTab: "Pos & Weather", isPopulated: true, value: "18.2", unit: "C", confidence: 93 },
      ],
    },
    {
      id: "bunkers",
      name: "Bunkers",
      fields: [
        { id: "bunkers-section", fieldName: "ROB, Consumption & Used For", fieldDefinition: "Complete bunker section including ROB, consumption breakdown, and usage allocation", status: getStatus("bunkers-section"), isCritical: true, mappedSource: "Bunker ROB Table", sourceTab: "Bunker", isPopulated: true, value: "Complete", confidence: 94 },
        { id: "ifo-rob", fieldName: "IFO ROB", status: getStatus("ifo-rob"), isCritical: false, mappedSource: "IFO Total", sourceTab: "Bunker", isPopulated: true, value: "1245", unit: "MT", confidence: 94 },
        { id: "mgo-rob", fieldName: "MGO ROB", status: getStatus("mgo-rob"), isCritical: false, mappedSource: "MGO Total", sourceTab: "Bunker", isPopulated: true, value: "342", unit: "MT", confidence: 93 },
        { id: "lsmgo-rob", fieldName: "LSMGO ROB", status: getStatus("lsmgo-rob"), isCritical: false, mappedSource: "LSMGO Total", sourceTab: "Bunker", isPopulated: true, value: "587", unit: "MT", confidence: 92 },
      ],
    },
    {
      id: "water",
      name: "Water",
      fields: [
        { id: "fresh-water-rob", fieldName: "Fresh Water ROB", status: getStatus("fresh-water-rob"), isCritical: true, mappedSource: "Fresh Water ROB", sourceTab: "Stock", isPopulated: true, value: "125.4", unit: "MT", confidence: 96 },
        { id: "distilled-water-rob", fieldName: "Distilled Water ROB", status: getStatus("distilled-water-rob"), isCritical: true, mappedSource: "Distilled Water ROB", sourceTab: "Stock", isPopulated: true, value: "48.2", unit: "MT", confidence: 95 },
        { id: "slops-rob", fieldName: "Slops ROB", status: getStatus("slops-rob"), isCritical: true, mappedSource: "Slops ROB", sourceTab: "Stock", isPopulated: true, value: "12.8", unit: "MT", confidence: 92 },
        { id: "tank-clean-chem", fieldName: "Tank Cleaning Chemical", status: getStatus("tank-clean-chem"), isCritical: false, mappedSource: "Tank Clean Chemical", sourceTab: "Stock", isPopulated: true, value: "340", unit: "LTRS", confidence: 94 },
      ],
    },
  ]
}

// Individual Field Card Component
function FieldCard({
  field,
  isSelected,
  onSelect,
  onVerify,
  onFlag,
  isSourceExpanded,
  onToggleSource,
}: {
  field: FieldCardData
  isSelected: boolean
  onSelect: () => void
  onVerify: () => void
  onFlag: () => void
  isSourceExpanded: boolean
  onToggleSource: () => void
}) {
  const getStatusChip = () => {
    switch (field.status) {
      case "verified":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full text-green-600 bg-green-50">Verified</span>
      case "flagged":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full text-red-600 bg-red-50">Flagged</span>
      default:
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full text-gray-500 bg-gray-100">Pending</span>
    }
  }

  const getStatusDot = () => {
    if (field.status === "flagged") return "bg-red-500"
    if (!field.isPopulated) return "bg-gray-300"
    return "bg-green-500"
  }

  return (
    <div 
      id={`field-card-${field.id}`}
      onClick={onSelect}
      className={`bg-white rounded-xl border p-4 mb-3 cursor-pointer transition-all ${
        isSelected 
          ? "border-l-[3px] border-l-purple-500 border-gray-100 bg-purple-50/30" 
          : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      {/* Row 1: Field Name, Status, Critical Badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900">{field.fieldName}</span>
          {field.fieldDefinition && (
            <button 
              className="text-gray-400 hover:text-gray-600"
              title={field.fieldDefinition}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getStatusChip()}
          {field.isCritical && (
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <Star className="w-3 h-3" fill="#d97706" />
              Critical
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Mapped source info + status dot */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">
          Mapped from: {field.mappedSource}
        </span>
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot()}`} />
      </div>

      {/* Source Preview Accordion */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleSource()
        }}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-3 w-full"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        <span>Source preview ({field.sourceTab})</span>
        {isSourceExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 ml-auto" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-auto" />
        )}
      </button>

      {/* Expanded Source Preview */}
      {isSourceExpanded && (
        <div className="mb-3 max-h-40 overflow-hidden rounded-lg">
          <NavtorScreenshot fieldId={field.id} className="w-full" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onVerify()
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Verify
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFlag()
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Flag
        </button>
      </div>
    </div>
  )
}

// Scrollable Field Card List Component
function FieldCardList({
  sections,
  selectedFieldId,
  onFieldSelect,
  onVerify,
  onFlag,
  avgConfidence,
}: {
  sections: FieldSection[]
  selectedFieldId: string | null
  onFieldSelect: (field: FieldCardData) => void
  onVerify: (fieldId: string) => void
  onFlag: (fieldId: string) => void
  avgConfidence: number
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.id))
  )
  const [expandedSource, setExpandedSource] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  // Auto-expand source preview for selected card
  useEffect(() => {
    if (selectedFieldId) {
      setExpandedSource(selectedFieldId)
    }
  }, [selectedFieldId])

  // Filter fields based on search
  const filteredSections = sections.map(section => ({
    ...section,
    fields: section.fields.filter(field => 
      searchQuery === "" || 
      field.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.mappedSource.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.fields.length > 0)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        {/* Avg Confidence Bar */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-gray-600">Avg. Confidence</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
              style={{ width: `${avgConfidence}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-green-600">{avgConfidence}%</span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Scrollable Field Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filteredSections.map((section, sectionIndex) => (
          <div key={section.id} className={sectionIndex > 0 ? "mt-5" : ""}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center gap-2 mb-3 w-full"
            >
              {expandedSections.has(section.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm font-medium text-gray-700">{section.name}</span>
              <span className="text-xs text-gray-400 ml-auto">{section.fields.length} fields</span>
            </button>

            {/* Field Cards */}
            {expandedSections.has(section.id) && (
              <div className="space-y-3">
                {section.fields.map(field => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => onFieldSelect(field)}
                    onVerify={() => onVerify(field.id)}
                    onFlag={() => onFlag(field.id)}
                    isSourceExpanded={expandedSource === field.id}
                    onToggleSource={() => setExpandedSource(
                      expandedSource === field.id ? null : field.id
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Submit Confirmation Dialog
function SubmitConfirmDialog({
  reportId,
  stats,
  onCancel,
  onConfirm,
}: {
  reportId: string
  stats: { autoPopulated: number; criticalVerified: number; manuallyEdited: number; flagged: number }
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[#0f172a] mb-2">Submit to VesLink?</h2>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-[#0f172a]">Report #{reportId}</span>
              <span className="text-[#64748b]">—</span>
              <span className="text-[#64748b]">Noon Report (Sea)</span>
            </div>
            <span className="text-sm text-[#64748b]">Seaways Skopelos</span>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between py-2 px-3 bg-[#f8fafc] rounded-lg">
              <span className="text-sm text-[#64748b]">Fields auto-populated</span>
              <span className="text-sm font-medium text-[#0f172a]">{stats.autoPopulated}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-[#f8fafc] rounded-lg">
              <span className="text-sm text-[#64748b]">Critical fields verified</span>
              <span className="text-sm font-medium text-[#16a34a]">{stats.criticalVerified}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-[#f8fafc] rounded-lg">
              <span className="text-sm text-[#64748b]">Fields manually edited</span>
              <span className="text-sm font-medium text-[#2563eb]">{stats.manuallyEdited}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-[#f8fafc] rounded-lg">
              <span className="text-sm text-[#64748b]">Fields flagged for review</span>
              <span className="text-sm font-medium text-[#d97706]">{stats.flagged}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-[#e2e8f0] rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

// Success State Component
function SuccessState({ reportId, onViewHistory, onNewTransfer }: { reportId: string; onViewHistory: () => void; onNewTransfer: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-7rem)]">
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-[#16a34a]" />
        </div>
        <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
          Report submitted to VesLink
        </h2>
        <p className="text-[#64748b] mb-1">
          Report #{reportId} • Noon Report (Sea) • Seaways Skopelos
        </p>
        <p className="text-sm text-[#94a3b8] mb-6">
          Submitted by Chief Officer at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onViewHistory}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View in History
          </button>
          <button
            onClick={onNewTransfer}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-colors"
          >
            Start New Transfer
          </button>
        </div>
      </div>
    </div>
  )
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
  isPulsing,
  onClick,
}: {
  field: FormField
  isSelected: boolean
  isPulsing?: boolean
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
      id={`field-${field.id}`}
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
          <Star 
            className={`w-3.5 h-3.5 text-[#f59e0b] flex-shrink-0 ${isPulsing ? "animate-pulse" : ""}`} 
            fill="#f59e0b" 
          />
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
        {field.status === "flagged" && (
          <Flag className="w-4 h-4 text-[#dc2626]" />
        )}
      </div>
    </button>
  )
}

// Form Section Component
function FormSectionComponent({
  section,
  selectedFieldId,
  pulsingFieldId,
  onFieldSelect,
  onToggle,
}: {
  section: FormSection
  selectedFieldId: string | null
  pulsingFieldId: string | null
  onFieldSelect: (field: FormField) => void
  onToggle: () => void
}) {
  const totalFields = section.fields.length
  const verifiedInSection = section.fields.filter(f => f.status === "verified" || f.status === "flagged").length

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
            {verifiedInSection}/{totalFields} reviewed
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
              isPulsing={pulsingFieldId === field.id}
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
  isAdminMode,
  onOpenAdminSuite,
}: {
  field: FormField
  sectionName: string
  onVerify: () => void
  onFlag: (reason: string, comment: string) => void
  isAdminMode?: boolean
  onOpenAdminSuite?: () => void
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
            
          </div>
        </div>

        {/* Critical Field Badge */}
        {field.isCritical && field.status !== "verified" && (
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
        <div className="p-4 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            {/* Verify button - prominent green for critical, outlined for non-critical */}
            <button
              onClick={onVerify}
              className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-lg font-medium transition-colors ${
                field.isCritical && field.status !== "verified"
                  ? "py-3 bg-[#16a34a] text-white hover:bg-[#15803d] text-base"
                  : field.isCritical
                  ? "py-2.5 bg-[#16a34a] text-white hover:bg-[#15803d]"
                  : "py-2.5 border-2 border-[#16a34a] text-[#16a34a] hover:bg-[#f0fdf4]"
              }`}
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
          {/* Admin: Edit Extraction Logic */}
          {isAdminMode && (
            <button
              onClick={onOpenAdminSuite}
              className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-[#64748b] hover:text-[#7c3aed] transition-colors"
            >
              <Cog className="w-4 h-4" />
              Edit Extraction Logic
            </button>
          )}
        </div>
      )}
    </div>
  )
}



// Critical Field Navigation Bar Component
function CriticalFieldNavBar({
  criticalVerified,
  criticalTotal,
  onPrev,
  onNext,
}: {
  criticalVerified: number
  criticalTotal: number
  onPrev: () => void
  onNext: () => void
}) {
  const allVerified = criticalVerified === criticalTotal
  
  return (
    <div className="h-9 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center gap-4 px-4 flex-shrink-0">
      {/* Label */}
      <span className="text-xs text-[#64748b]">Critical Fields:</span>
      
      {/* Count */}
      <span className={`text-xs font-semibold ${allVerified ? "text-[#16a34a]" : "text-[#0f172a]"}`}>
        {criticalVerified} of {criticalTotal} verified
        {allVerified && " \u2713"}
      </span>
      
      {/* Progress Bar */}
      <div className="w-24 h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#16a34a] transition-all duration-300"
          style={{ width: `${(criticalVerified / criticalTotal) * 100}%` }}
        />
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={allVerified}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#7c3aed] hover:bg-[#ede9fe] rounded transition-colors disabled:text-[#94a3b8] disabled:hover:bg-transparent"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          Prev
        </button>
        <button
          onClick={onNext}
          disabled={allVerified}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#7c3aed] hover:bg-[#ede9fe] rounded transition-colors disabled:text-[#94a3b8] disabled:hover:bg-transparent"
        >
          Next
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Keyboard Hint */}
      <span className="text-[11px] text-[#94a3b8]">(N/P to navigate)</span>
    </div>
  )
}

// Bottom Action Bar Component
function BottomActionBar({
  selectedField,
  onVerify,
  onEdit,
  onFlag,
  onClose,
}: {
  selectedField: FormField | null
  onVerify: () => void
  onEdit: () => void
  onFlag: () => void
  onClose: () => void
}) {
  return (
    <div className="h-12 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center gap-6 px-4 flex-shrink-0">
      <button 
        className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
        disabled={!selectedField}
      >
        <Search className="w-4 h-4" />
        <span>Navigate</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white border border-[#e2e8f0] rounded">N</kbd>
      </button>
      <div className="h-4 w-px bg-[#e2e8f0]" />
      <button 
        onClick={onVerify}
        className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#16a34a] transition-colors disabled:opacity-50"
        disabled={!selectedField}
      >
        <Check className="w-4 h-4" />
        <span>Verify</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white border border-[#e2e8f0] rounded">V</kbd>
      </button>
      <div className="h-4 w-px bg-[#e2e8f0]" />
      <button 
        onClick={onEdit}
        className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors disabled:opacity-50"
        disabled={!selectedField}
      >
        <Pencil className="w-4 h-4" />
        <span>Edit</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white border border-[#e2e8f0] rounded">E</kbd>
      </button>
      <div className="h-4 w-px bg-[#e2e8f0]" />
      <button 
        onClick={onFlag}
        className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#dc2626] transition-colors disabled:opacity-50"
        disabled={!selectedField}
      >
        <Flag className="w-4 h-4" />
        <span>Flag</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white border border-[#e2e8f0] rounded">F</kbd>
      </button>
      <div className="h-4 w-px bg-[#e2e8f0]" />
      <button 
        onClick={onClose}
        className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
      >
        <Keyboard className="w-4 h-4" />
        <span>Close</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white border border-[#e2e8f0] rounded">Esc</kbd>
      </button>
    </div>
  )
}

export function TransferReview({ reportId, onBack, isAdminMode = false }: TransferReviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sections, setSections] = useState(createMockFormSections)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [selectedReportId, setSelectedReportId] = useState("4528")
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "warning" } | null>(null)
  const [pulsingFieldId, setPulsingFieldId] = useState<string | null>(null)
  const [showAdminSuite, setShowAdminSuite] = useState(false)
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set())
  const [verifiedVesLinkFields, setVerifiedVesLinkFields] = useState<Set<string>>(new Set())

  // Get the section name for the selected field - supports VesLink field IDs
  const getFieldSectionName = (fieldId: string) => {
    // First check internal sections
    for (const section of sections) {
      if (section.fields.some((f) => f.id === fieldId)) {
        return section.name
      }
    }
    
    // Map VesLink field IDs to section names
    const vesLinkSectionMap: Record<string, string> = {
      // Header section
      "date-time": "Header",
      "voyage-number": "Header",
      "vessel-condition": "Header",
      "vessel-name": "Header",
      "latitude": "Header",
      "longitude": "Header",
      "location": "Header",
      "remarks": "Header",
      "next-port": "Header",
      "eta": "Header",
      "eta-date": "Header",
      "eta-time": "Header",
      // Distance and Vessel section
      "distance-to-go": "Distance & Vessel",
      "cp-ordered-speed": "Distance & Vessel",
      "reported-speed": "Distance & Vessel",
      "observed-distance": "Distance & Vessel",
      "time-since-last": "Distance & Vessel",
      "ballast": "Distance & Vessel",
      "displacement": "Distance & Vessel",
      "slip": "Distance & Vessel",
      "fwd-draft": "Distance & Vessel",
      "mid-draft": "Distance & Vessel",
      "aft-draft": "Distance & Vessel",
      // Machinery section
      "main-engine-rpm": "Machinery",
      "gen1-kwhrs": "Machinery",
      "gen1-hrs": "Machinery",
      "gen2-kwhrs": "Machinery",
      "gen2-hrs": "Machinery",
      "gen3-kwhrs": "Machinery",
      "gen3-hrs": "Machinery",
      "boiler-hrs": "Machinery",
      // Weather section
      "beaufort": "Weather",
      "wind-direction": "Weather",
      "sea-state": "Weather",
      "sea-height": "Weather",
      "sea-temp": "Weather",
      // Bunkers section
      "bunkers-section": "Bunkers",
      "measurement-method": "Bunkers",
      "ifo-rob": "Bunkers",
      "mgo-rob": "Bunkers",
      "lsf-rob": "Bunkers",
      "lsmgo-rob": "Bunkers",
      // Water section
      "fresh-water-rob": "Water",
      "distilled-water-rob": "Water",
      "slops-rob": "Water",
      "tank-clean-chem": "Water",
      "distilled-consumed": "Water",
      "fresh-consumed": "Water",
      "distilled-produced": "Water",
      "fresh-produced": "Water",
    }
    
    return vesLinkSectionMap[fieldId] || "VesLink Form"
  }

  // Calculate stats
  const allFields = sections.flatMap((s) => s.fields)
  const totalFields = allFields.length
  const verifiedCount = allFields.filter((f) => f.status === "verified").length
  const flaggedCount = allFields.filter((f) => f.status === "flagged").length
  const pendingCount = allFields.filter((f) => f.status === "pending").length
  const manuallyEditedCount = allFields.filter((f) => f.status === "manually-edited").length
  const criticalFields = allFields.filter((f) => f.isCritical)
  const criticalVerified = criticalFields.filter((f) => f.status === "verified").length
  const criticalTotal = criticalFields.length
  
  // VesLink critical fields - using the exported list
  const vesLinkCriticalTotal = CRITICAL_FIELDS_NOON_SEA.length
  const vesLinkCriticalVerified = verifiedVesLinkFields.size
  const canSubmit = vesLinkCriticalVerified === vesLinkCriticalTotal

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

  // Critical field metadata for proper labels and source mappings
  const getCriticalFieldMetadata = (fieldId: string) => {
    const metadata: Record<string, { label: string; sourceTab: string; sourceField: string; value: string }> = {
      "date-time": { label: "Date/Time", sourceTab: "Operational", sourceField: "Report Date/Time", value: "14/04/2026 12:00" },
      "voyage-number": { label: "Voyage Number", sourceTab: "Operational", sourceField: "Voyage Number", value: "124" },
      "vessel-condition": { label: "Vessel Condition", sourceTab: "Operational", sourceField: "Vessel Condition", value: "Laden" },
      "next-port": { label: "Next Port", sourceTab: "Operational", sourceField: "Next Port", value: "Fujairah" },
      "eta": { label: "ETA", sourceTab: "Operational", sourceField: "ETA", value: "22/04/2026 14:00" },
      "distance-to-go": { label: "Distance to Go", sourceTab: "Operational", sourceField: "Distance to Go", value: "2847" },
      "cp-ordered-speed": { label: "CP / Ordered Speed", sourceTab: "Operational", sourceField: "Ordered Speed", value: "12.5" },
      "reported-speed": { label: "Reported Speed", sourceTab: "Operational", sourceField: "Reported Speed", value: "12.3" },
      "observed-distance": { label: "Observed Distance", sourceTab: "Operational", sourceField: "Observed Distance", value: "142.3" },
      "time-since-last": { label: "Time Since Last Report", sourceTab: "Operational", sourceField: "Time Since Last Report", value: "24.0" },
      "main-engine-rpm": { label: "Main Engine RPM", sourceTab: "Power", sourceField: "ME RPM", value: "85.2" },
      "beaufort": { label: "Beaufort", sourceTab: "Pos & Weather", sourceField: "Beaufort Scale", value: "4" },
      "bunkers-section": { label: "ROB, Consumption & Used For", sourceTab: "Bunker", sourceField: "Bunker ROB Table", value: "Complete" },
      "fresh-water-rob": { label: "Fresh Water ROB", sourceTab: "Stock", sourceField: "Fresh Water ROB", value: "125.4" },
      "distilled-water-rob": { label: "Distilled Water ROB", sourceTab: "Stock", sourceField: "Distilled Water ROB", value: "48.2" },
      "slops-rob": { label: "Slops ROB", sourceTab: "Stock", sourceField: "Slops ROB", value: "12.8" },
    }
    return metadata[fieldId] || { 
      label: fieldId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      sourceTab: "Operational",
      sourceField: fieldId,
      value: ""
    }
  }

  // Helper to scroll to VesLink field
  const scrollToVesLinkField = useCallback((fieldId: string) => {
    const element = document.getElementById(`vl-field-${fieldId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      // Brief highlight effect
      element.classList.add("ring-2", "ring-[#7c3aed]")
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-[#7c3aed]")
      }, 1000)
    }
  }, [])

  // Find the next unverified critical field
  const findNextUnverifiedCritical = useCallback((currentFieldId?: string) => {
    const allFieldsFlat = sections.flatMap((s) => s.fields)
    const currentIndex = currentFieldId 
      ? allFieldsFlat.findIndex((f) => f.id === currentFieldId) 
      : -1
    
    // First look after current position
    let nextField = allFieldsFlat
      .slice(currentIndex + 1)
      .find((f) => f.isCritical && f.status !== "verified")
    
    // If not found, look from the beginning
    if (!nextField) {
      nextField = allFieldsFlat.find((f) => f.isCritical && f.status !== "verified")
    }
    
    return nextField
  }, [sections])

  // Navigate to next unverified VesLink critical field
  const navigateToNextCritical = useCallback(() => {
    const unverifiedFields = CRITICAL_FIELDS_NOON_SEA.filter(f => !verifiedVesLinkFields.has(f))
    if (unverifiedFields.length === 0) {
      setToast({ message: "All critical fields verified — ready to submit", type: "success" })
      return
    }
    
    // Find current position in critical fields
    const currentIndex = selectedField 
      ? CRITICAL_FIELDS_NOON_SEA.indexOf(selectedField.id)
      : -1
    
    // Find next unverified after current
    let nextField = CRITICAL_FIELDS_NOON_SEA.slice(currentIndex + 1).find(f => !verifiedVesLinkFields.has(f))
    
    // Wrap around if needed
    if (!nextField) {
      nextField = CRITICAL_FIELDS_NOON_SEA.find(f => !verifiedVesLinkFields.has(f))
    }
    
    if (nextField) {
      // Create a mock field object for the left panel with proper metadata
      const metadata = getCriticalFieldMetadata(nextField)
      const mockField: FormField = {
        id: nextField,
        label: metadata.label,
        value: metadata.value,
        confidence: 95 + Math.floor(Math.random() * 5),
        status: "pending",
        isCritical: true,
        sourceTab: metadata.sourceTab,
        sourceField: metadata.sourceField,
      }
      setSelectedField(mockField)
      
      // Scroll to field on VesLink form
      scrollToVesLinkField(nextField)
    }
  }, [verifiedVesLinkFields, selectedField, scrollToVesLinkField, getCriticalFieldMetadata])

  // Navigate to previous unverified VesLink critical field
  const navigateToPrevCritical = useCallback(() => {
    const unverifiedFields = CRITICAL_FIELDS_NOON_SEA.filter(f => !verifiedVesLinkFields.has(f))
    if (unverifiedFields.length === 0) {
      setToast({ message: "All critical fields verified — ready to submit", type: "success" })
      return
    }
    
    // Find current position in critical fields
    const currentIndex = selectedField 
      ? CRITICAL_FIELDS_NOON_SEA.indexOf(selectedField.id)
      : CRITICAL_FIELDS_NOON_SEA.length
    
    // Find previous unverified before current
    let prevField = CRITICAL_FIELDS_NOON_SEA.slice(0, currentIndex).reverse().find(f => !verifiedVesLinkFields.has(f))
    
    // Wrap around if needed
    if (!prevField) {
      prevField = [...CRITICAL_FIELDS_NOON_SEA].reverse().find(f => !verifiedVesLinkFields.has(f))
    }
    
    if (prevField) {
      const metadata = getCriticalFieldMetadata(prevField)
      const mockField: FormField = {
        id: prevField,
        label: metadata.label,
        value: metadata.value,
        confidence: 95 + Math.floor(Math.random() * 5),
        status: "pending",
        isCritical: true,
        sourceTab: metadata.sourceTab,
        sourceField: metadata.sourceField,
      }
      setSelectedField(mockField)
      
      scrollToVesLinkField(prevField)
    }
  }, [verifiedVesLinkFields, selectedField, scrollToVesLinkField, getCriticalFieldMetadata])

  const handleVerify = useCallback(() => {
    if (!selectedField) return
    
    const fieldId = selectedField.id
    const isCriticalField = CRITICAL_FIELDS_NOON_SEA.includes(fieldId)
    
    // Update internal sections state
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        fields: section.fields.map((f) =>
          f.id === fieldId ? { ...f, status: "verified" as FieldStatus } : f
        ),
      }))
    )
    
    // Update VesLink verified fields
    setVerifiedVesLinkFields(prev => new Set(prev).add(fieldId))
    
    // Update selected field to reflect new status
    setSelectedField({ ...selectedField, status: "verified" })
    
    // Check if this was the last critical field
    const newVerifiedCount = verifiedVesLinkFields.size + 1
    if (isCriticalField && newVerifiedCount === vesLinkCriticalTotal) {
      setToast({ message: "All critical fields verified — ready to submit", type: "success" })
      return
    }
    
    // Auto-advance to next unverified critical field after 300ms
    setTimeout(() => {
      navigateToNextCritical()
    }, 300)
  }, [selectedField, verifiedVesLinkFields, vesLinkCriticalTotal, navigateToNextCritical])

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

  const handleSubmitClick = () => {
    if (!canSubmit) {
      const remaining = vesLinkCriticalTotal - vesLinkCriticalVerified
      // Navigate to first unverified critical field
      navigateToNextCritical()
      
      // Show toast
      setToast({
        message: `${remaining} critical fields still need verification`,
        type: "warning"
      })
      return
    }
    
    setShowSubmitDialog(true)
  }

  const handleConfirmSubmit = () => {
    setShowSubmitDialog(false)
    setIsSubmitted(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.key === "v" || e.key === "V") {
        if (selectedField) handleVerify()
      } else if (e.key === "n" || e.key === "N" || e.key === "ArrowDown") {
        e.preventDefault()
        navigateToNextCritical()
      } else if (e.key === "p" || e.key === "P" || e.key === "ArrowUp") {
        e.preventDefault()
        navigateToPrevCritical()
      } else if (e.key === "Escape") {
        setSelectedField(null)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedField, handleVerify, navigateToNextCritical, navigateToPrevCritical])

  if (isLoading) {
    return <LoadingState onComplete={() => setIsLoading(false)} />
  }

  if (isSubmitted) {
    return (
      <SuccessState 
        reportId={reportId} 
        onViewHistory={onBack}
        onNewTransfer={onBack}
      />
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <SubmitConfirmDialog
          reportId={reportId}
          stats={{
            autoPopulated: totalFields - manuallyEditedCount,
            criticalVerified: vesLinkCriticalVerified,
            manuallyEdited: manuallyEditedCount,
            flagged: flaggedCount,
          }}
          onCancel={() => setShowSubmitDialog(false)}
          onConfirm={handleConfirmSubmit}
        />
      )}

      {/* Critical Field Navigation Bar */}
      <CriticalFieldNavBar
        criticalVerified={vesLinkCriticalVerified}
        criticalTotal={vesLinkCriticalTotal}
        onPrev={navigateToPrevCritical}
        onNext={navigateToNextCritical}
      />

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scrollable Field Card List */}
        <div className="w-[40%] border-r border-[#e2e8f0] flex flex-col overflow-hidden">
          <FieldCardList
            sections={createFieldCardSections(verifiedVesLinkFields)}
            selectedFieldId={selectedField?.id ?? null}
            onFieldSelect={(field) => {
              // Convert FieldCardData to FormField for the rest of the component
              const formField: FormField = {
                id: field.id,
                label: field.fieldName,
                value: field.value || "",
                unit: field.unit,
                confidence: field.confidence || 95,
                status: field.status,
                isCritical: field.isCritical,
                sourceTab: field.sourceTab,
                sourceField: field.mappedSource,
              }
              setSelectedField(formField)
              // Scroll to corresponding field on VesLink form
              scrollToVesLinkField(field.id)
            }}
            onVerify={(fieldId) => {
              // Find the field and verify it
              const metadata = getCriticalFieldMetadata(fieldId)
              const mockField: FormField = {
                id: fieldId,
                label: metadata.label,
                value: metadata.value,
                confidence: 95,
                status: "pending",
                isCritical: CRITICAL_FIELDS_NOON_SEA.includes(fieldId),
                sourceTab: metadata.sourceTab,
                sourceField: metadata.sourceField,
              }
              setSelectedField(mockField)
              // Use setTimeout to allow state update then verify
              setTimeout(() => {
                handleVerify()
              }, 0)
            }}
            onFlag={(fieldId) => {
              setToast({ message: `Field "${fieldId}" flagged for review`, type: "warning" })
            }}
            avgConfidence={96}
          />
        </div>

        {/* Right Panel - VesLink Form (authentic replica) */}
        <div className="w-[60%] flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            <VesLinkForm
              selectedFieldId={selectedField?.id ?? null}
              onFieldSelect={(fieldId) => {
                // Map VesLink field IDs to our internal field data for the left panel
                const isCritical = CRITICAL_FIELDS_NOON_SEA.includes(fieldId)
                const metadata = getCriticalFieldMetadata(fieldId)
                const mockField: FormField = {
                  id: fieldId,
                  label: metadata.label,
                  value: metadata.value,
                  confidence: 95 + Math.floor(Math.random() * 5),
                  status: verifiedVesLinkFields.has(fieldId) ? "verified" : "pending",
                  isCritical,
                  sourceTab: metadata.sourceTab,
                  sourceField: metadata.sourceField,
                }
                setSelectedField(mockField)
                
                // Scroll to corresponding field card in left panel
                const fieldCard = document.getElementById(`field-card-${fieldId}`)
                if (fieldCard) {
                  fieldCard.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              }}
              editedFields={editedFields}
              onFieldEdit={(fieldId, value) => {
                setEditedFields(prev => new Set(prev).add(fieldId))
              }}
              verifiedFields={verifiedVesLinkFields}
            />
          </div>
        </div>
      </div>

      {/* Admin Testing Suite Modal */}
      {showAdminSuite && selectedField && (
        <AdminTestingSuite
          fieldName={selectedField.label}
          fieldValue={selectedField.value}
          fieldUnit={selectedField.unit}
          sourceTab={selectedField.sourceTab || "Operational"}
          sourceField={selectedField.sourceField || ""}
          onClose={() => setShowAdminSuite(false)}
          onSave={() => {
            setShowAdminSuite(false)
            setToast({ message: "Extraction logic updated", type: "success" })
          }}
        />
      )}
    </div>
  )
}
