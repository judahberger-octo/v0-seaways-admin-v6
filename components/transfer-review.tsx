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
  Image as ImageIcon,
  Sparkles,
  MessageSquare
} from "lucide-react"
import { AdminTestingSuite } from "./admin-testing-suite"
import { VesLinkForm, CRITICAL_FIELDS_NOON_SEA, MANUAL_FILL_FIELDS } from "./veslink-form"
import { NavtorScreenshot } from "./navtor-screenshot"
import { 
  UnsavedReportModal, 
  DiscardReportModal, 
  FlagFieldModal 
} from "./modals"
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react"

// Field status types
type FieldStatus = "verified" | "flagged" | "pending" | "not-populated" | "manually-edited"
type FieldType = "standard" | "critical" | "manualFill"
type ManualFillStatus = "awaiting" | "entered" | "confirmed"

interface FormField {
  id: string
  label: string
  value: string
  unit?: string
  confidence: number
  status: FieldStatus
  isCritical?: boolean
  fieldType?: FieldType
  sourceAvailable?: boolean
  manualFillStatus?: ManualFillStatus
  sourceTab?: string
  sourceField?: string
  whyNeeded?: string
  whereToFind?: string
  inputKind?: "text" | "select"
  options?: string[]
}

// Field card data for the new scrollable list
interface FieldCardData {
  id: string
  fieldName: string
  fieldDefinition?: string
  status: FieldStatus
  isCritical: boolean
  fieldType?: FieldType
  sourceAvailable?: boolean
  manualFillStatus?: ManualFillStatus
  mappedSource: string
  sourceTab: string
  isPopulated: boolean
  value?: string
  unit?: string
  confidence?: number
  whyNeeded?: string
  whereToFind?: string
  inputKind?: "text" | "select"
  options?: string[]
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

// Toast notification component - Dark style matching Figma
type ToastType = "error" | "success" | "warning" | "delete" | "flag" | "save" | "submit"

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Get the appropriate icon based on toast type
  const getIcon = () => {
    switch (type) {
      case "delete":
        return <Trash2 className="w-4 h-4" />
      case "flag":
      case "warning":
        return <Flag className="w-4 h-4" />
      case "save":
      case "success":
        return <Check className="w-4 h-4" />
      case "submit":
        return <Send className="w-4 h-4" />
      case "error":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Check className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
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
        { id: "observed-distance", fieldName: "Observed Distance (nm)", status: "pending", isCritical: false, fieldType: "manualFill", sourceAvailable: false, manualFillStatus: "awaiting", mappedSource: "", sourceTab: "", isPopulated: false, value: "", unit: "nm", whyNeeded: "Observed distance is the actual distance the vessel has travelled through the water since the last noon report, as read directly from the ship's log. It anchors fuel-per-mile and slip calculations, and is a regulated input for charter-party performance reporting. NAVTOR does not have access to this value, so it must be entered manually from the ship's log.", whereToFind: "Read from the doppler speed log or deck log. Officer on watch at noon typically records the cumulative reading." },
        { id: "engine-distance", fieldName: "Engine Distance (nm)", status: "pending", isCritical: false, fieldType: "manualFill", sourceAvailable: false, manualFillStatus: "awaiting", mappedSource: "", sourceTab: "", isPopulated: false, value: "", unit: "nm", whyNeeded: "Engine distance is the theoretical distance based on main-engine revolutions, derived from RPM × pitch × hours. Together with observed distance it's used to compute propeller slip — a core indicator of hull and propeller performance. NAVTOR does not capture this value; it comes from the engine room log.", whereToFind: "Engine room log; 2nd Engineer typically records engine distance at noon." },
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
        { id: "sea-state", fieldName: "Sea State", status: "pending", isCritical: false, fieldType: "manualFill", sourceAvailable: false, manualFillStatus: "awaiting", inputKind: "select", options: ["Select...", "00 CALM (GLASSY)", "01 CALM (RIPPLED)", "02 SMOOTH", "03 SLIGHT", "04 MODERATE", "05 ROUGH", "06 VERY ROUGH", "07 HIGH", "08 VERY HIGH", "09 PHENOMENAL", "10 NOT APPLICABLE"], mappedSource: "", sourceTab: "", isPopulated: false, value: "", whyNeeded: "Sea State describes the surface condition of the sea on the Douglas scale (0–9, plus Not Applicable). It's used to contextualise vessel performance metrics — fuel consumption, speed loss, and slip all vary materially with sea state. Charterers and regulators require this value on every noon report. NAVTOR does not provide an automated Douglas-scale classification, so the watch officer enters it based on visual observation.", whereToFind: "Officer on watch observes at the time of the report and selects from the Douglas scale." },
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

// Single Field Focus Pane Component - shows ONE field at a time
function SingleFieldFocusPane({
  field,
  currentIndex,
  totalCount,
  onVerify,
  onFlag,
  onNavigate,
  onConfirmEntry,
  sourceReports = ["#4528", "#4529", "#4530"],
  manualFillValue,
  onScrollToField,
}: {
  field: FieldCardData | null
  currentIndex: number
  totalCount: number
  onVerify: () => void
  onFlag: () => void
  onNavigate: (direction: "prev" | "next") => void
  onConfirmEntry?: () => void
  sourceReports?: string[]
  manualFillValue?: string
  onScrollToField?: () => void
}) {
  const [validationExpanded, setValidationExpanded] = useState(false)
  const [sourcePreviewExpanded, setSourcePreviewExpanded] = useState(true)
  const [whyNeededExpanded, setWhyNeededExpanded] = useState(false)
  const [sourcePreviewIndex, setSourcePreviewIndex] = useState(0)
  const sourcePreviewCount = sourceReports.length
  
  // Check if this is a manual-fill field
  const isManualFill = field?.fieldType === "manualFill"

  if (!field) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Select a field to review</p>
      </div>
    )
  }

  const getStatusPillColor = () => {
    switch (field.status) {
      case "verified":
        return "bg-green-50 text-green-700 border-green-200"
      case "flagged":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  // Get manual fill status
  const getManualFillStatus = (): ManualFillStatus => {
    if (field.manualFillStatus === "confirmed" || field.status === "verified") return "confirmed"
    if (manualFillValue && manualFillValue.trim() !== "" && manualFillValue !== "Select...") return "entered"
    return "awaiting"
  }

  const manualFillStatus = isManualFill ? getManualFillStatus() : null

  const getFieldTypePillColor = () => {
    // Use color family matching the border system
    if (isManualFill) {
      if (manualFillStatus === "confirmed") return "bg-green-50 text-green-700 border-green-200"
      return "bg-orange-50 text-orange-700 border-orange-200" // Manual fill = orange
    }
    if (isVerified) return "bg-green-50 text-green-700 border-green-200"
    if (field.isCritical) return "bg-red-50 text-red-700 border-red-200" // Critical pending = red
    return "bg-amber-50 text-amber-700 border-amber-200" // Standard = amber
  }

  const confidencePercent = field.confidence || 98
  const isVerified = field.status === "verified" || (isManualFill && manualFillStatus === "confirmed")
  const isFlagged = field.status === "flagged"

  // Get the left border color based on field status
  const getLeftBorderColor = () => {
    if (isVerified) return "border-l-green-500"
    if (isFlagged) return "border-l-red-500"
    if (isManualFill) return "border-l-orange-500" // Manual fill = orange
    if (field.isCritical) return "border-l-red-500" // Critical pending = red
    return "border-l-amber-500" // Standard/pending = amber
  }

  // Get background tint based on status
  const getBackgroundTint = () => {
    if (isVerified) return "bg-green-50/30"
    if (isFlagged) return "bg-red-50/30"
    if (isManualFill) return "bg-orange-50/30"
    if (field.isCritical) return "bg-red-50/30"
    return "bg-amber-50/30"
  }

  return (
    <div className={`flex flex-col h-full border-l-4 ${getLeftBorderColor()} ${getBackgroundTint()} transition-colors duration-300`}>
      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Header Row: Field name with help icon, Field type pill */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500">Field name</span>
            <button className="text-gray-400 hover:text-gray-600" title="Field definition">
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Only show Status pill for critical fields, not manual-fill */}
            {!isManualFill && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusPillColor()}`}>
                {field.status === "verified" ? "Verified" : field.status === "flagged" ? "Flagged" : "Status"}
              </span>
            )}
            {/* Field Type Pill */}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${getFieldTypePillColor()}`}>
              <Star className="w-3 h-3" fill="currentColor" />
              {isManualFill ? "Manual fill" : field.isCritical ? "Critical field" : "Standard field"}
            </span>
          </div>
        </div>

        {/* Large Value Display */}
        <h2 className="text-3xl font-semibold text-gray-900 mb-3">
          {isManualFill ? (manualFillValue || "—") : (field.value || "—")}
          {field.unit && <span className="text-xl text-gray-500 ml-1">{field.unit}</span>}
        </h2>

        {/* Source Report Chips OR Manual Fill Caption */}
        {isManualFill ? (
          <div className="flex items-center gap-2 mb-5 text-sm text-gray-500 italic">
            <span>Not available in NAVTOR source — enter value in the VesLink form on the right</span>
            {onScrollToField && (
              <button 
                onClick={onScrollToField}
                className="text-purple-600 hover:text-purple-700 underline not-italic"
              >
                →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mb-5 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Report {sourceReports.join(", Report ")}</span>
          </div>
        )}

        {/* Status Row for Manual Fill (replaces Confidence Bar) */}
        {isManualFill ? (
          <div className="mb-5">
            <div className="flex items-center gap-2">
              {manualFillStatus === "awaiting" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm font-medium text-orange-600">Status: Awaiting input</span>
                </>
              )}
              {manualFillStatus === "entered" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-blue-600">Status: Entered — confirm below</span>
                </>
              )}
              {manualFillStatus === "confirmed" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-600">Status: Confirmed</span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Confidence Bar (only for non-manual-fill fields) */
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Confidence</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${confidencePercent >= 90 ? "text-green-600" : confidencePercent >= 70 ? "text-amber-600" : "text-red-600"}`}>
                  {confidencePercent}%
                </span>
                {isVerified ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    Pending
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${confidencePercent >= 90 ? "bg-green-500" : confidencePercent >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Validation Checks Accordion */}
        <div className="border border-gray-200 rounded-lg mb-4">
          <button
            onClick={() => setValidationExpanded(!validationExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span>Validation checks</span>
            {validationExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {validationExpanded && (
            <div className="px-4 pb-3 border-t border-gray-100">
              <div className="pt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Value within expected range</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Format validation passed</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Cross-reference check passed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Source Preview Accordion OR Why this field is needed (for manual-fill) */}
        {isManualFill ? (
          /* Why This Field is Needed Accordion - for manual-fill fields */
          <div className="border border-orange-200 rounded-lg bg-orange-50/30">
            <button
              onClick={() => setWhyNeededExpanded(!whyNeededExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-500" />
                <span>Why this field is needed</span>
              </div>
              {whyNeededExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {whyNeededExpanded && (
              <div className="px-4 pb-4 border-t border-orange-100">
                <div className="pt-3 space-y-3">
                  {/* Primary explanation */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {field.whyNeeded || "This field is required by VesLink but is not available in the NAVTOR source data. Please enter the value manually based on vessel records."}
                  </p>
                  {/* Where to find it */}
                  {field.whereToFind && (
                    <>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Where to find it on the vessel</p>
                      <p className="text-sm text-gray-600">
                        {field.whereToFind}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Source Preview Accordion - for critical/standard fields */
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setSourcePreviewExpanded(!sourcePreviewExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>Source preview ({sourcePreviewCount})</span>
              {sourcePreviewExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {sourcePreviewExpanded && (
              <div className="p-3 border-t border-gray-100">
                {/* Dark NAVTOR Preview with navigation */}
                <div className="relative">
                  {/* Left Arrow */}
                  <button
                    onClick={() => setSourcePreviewIndex(Math.max(0, sourcePreviewIndex - 1))}
                    disabled={sourcePreviewIndex === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* NAVTOR Screenshot */}
                  <div className="rounded-lg overflow-hidden">
                    <NavtorScreenshot fieldId={field.id} className="w-full" />
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => setSourcePreviewIndex(Math.min(sourcePreviewCount - 1, sourcePreviewIndex + 1))}
                    disabled={sourcePreviewIndex === sourcePreviewCount - 1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Expand Icon */}
                  <button className="absolute top-2 right-2 w-7 h-7 rounded bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-white">
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>

                {/* Pagination indicator */}
                <div className="flex items-center justify-center mt-3">
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
                    {sourcePreviewIndex + 1}/{sourcePreviewCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Action Bar - Fixed at bottom */}
      <div className="border-t border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Verify/Confirm Entry Button */}
          {isManualFill ? (
            <button
              onClick={onConfirmEntry}
              disabled={manualFillStatus === "awaiting"}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors border ${
                manualFillStatus === "confirmed"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : manualFillStatus === "entered"
                  ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 animate-pulse"
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" />
              {manualFillStatus === "confirmed" ? "Confirmed" : "Confirm entry"}
            </button>
          ) : (
            <button
              onClick={onVerify}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors border ${
                isVerified
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
              }`}
            >
              <Check className="w-4 h-4" />
              Verify field
            </button>
          )}

          {/* Navigation Paginator */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
            <button
              onClick={() => onNavigate("prev")}
              className="p-2 hover:bg-gray-50 rounded-l-lg"
            >
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 font-medium px-2 min-w-[48px] text-center">
              {currentIndex}/{totalCount}
            </span>
            <button
              onClick={() => onNavigate("next")}
              className="p-2 hover:bg-gray-50 rounded-r-lg"
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Flag Button */}
          <button
            onClick={onFlag}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors border ${
              isFlagged
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            }`}
          >
            <Flag className="w-4 h-4" />
            Flag
          </button>
        </div>
      </div>
    </div>
  )
}

// Scrollable Field Card List Component (kept for potential future use)
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
// Icon Rail Component (far left sidebar)
type IconRailItem = "search" | "chat" | "ai" | "layers" | "settings"

function IconRail({
  activeItem,
  onItemClick,
  onLayersClick,
  userInitials = "JD",
}: {
  activeItem: IconRailItem
  onItemClick: (item: IconRailItem) => void
  onLayersClick: () => void
  userInitials?: string
}) {
  const icons: { id: IconRailItem; icon: React.ReactNode; label: string }[] = [
    { id: "search", icon: <Search className="w-5 h-5" />, label: "Search" },
    { id: "chat", icon: <MessageSquare className="w-5 h-5" />, label: "Comments" },
    { id: "ai", icon: <Sparkles className="w-5 h-5" />, label: "AI Features" },
    { id: "layers", icon: <Layers className="w-5 h-5" />, label: "Navigation" },
  ]

  return (
    <div className="w-12 bg-white border-r border-gray-100 flex flex-col items-center py-4 flex-shrink-0">
      {/* Top icons */}
      <div className="flex flex-col items-center gap-6">
        {icons.map((item) => (
          <button
            key={item.id}
            onClick={() => item.id === "layers" ? onLayersClick() : onItemClick(item.id)}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors group"
            title={item.label}
          >
            {/* Active indicator */}
            {activeItem === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-600 rounded-r" />
            )}
            <span className={`${
              activeItem === item.id 
                ? "text-purple-600" 
                : "text-gray-400 group-hover:text-purple-600"
            } transition-colors`}>
              {item.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={() => onItemClick("settings")}
          className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors group"
          title="Settings"
        >
          {activeItem === "settings" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-600 rounded-r" />
          )}
          <Settings className={`w-5 h-5 ${
            activeItem === "settings" 
              ? "text-purple-600" 
              : "text-gray-400 group-hover:text-purple-600"
          } transition-colors`} />
        </button>

        {/* User Avatar */}
        <div 
          className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-purple-200 transition-colors"
          title="User Profile"
        >
          {userInitials}
        </div>
      </div>
    </div>
  )
}

// Highlights Navigation Bar Component (for right panel)
function HighlightsNavBar({
  vesselName,
  currentIndex,
  totalCount,
  pendingCount,
  verifiedCount,
  activeFilter,
  onFilterChange,
  onPrev,
  onNext,
  onVesselClick,
}: {
  vesselName: string
  currentIndex: number
  totalCount: number
  pendingCount: number
  verifiedCount: number
  activeFilter: "pending" | "verified"
  onFilterChange: (filter: "pending" | "verified") => void
  onPrev: () => void
  onNext: () => void
  onVesselClick: () => void
}) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      {/* Left side - Highlights label + vessel name */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Highlights:</span>
        <button 
          onClick={onVesselClick}
          className="text-xs text-purple-600 font-medium hover:text-purple-700 hover:underline transition-colors"
        >
          {vesselName}
        </button>
      </div>
      
      {/* Right side - Status toggle + Counter + navigation */}
      <div className="flex items-center gap-4">
        {/* Status Filter Toggle - Pending/Verified */}
        <div className="flex items-center bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => onFilterChange("pending")}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-full transition-all ${
              activeFilter === "pending"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending ({pendingCount})
          </button>
          <span className="text-gray-300 mx-0.5">/</span>
          <button
            onClick={() => onFilterChange("verified")}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-full transition-all ${
              activeFilter === "verified"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Check className="w-3 h-3" />
            Verified ({verifiedCount})
          </button>
        </div>

        {/* Counter + navigation */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 font-medium mr-1">
            {currentIndex} / {totalCount}
          </span>
          <button
            onClick={onPrev}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Previous critical field (P)"
          >
            <ChevronUp className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onNext}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Next critical field (N)"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
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
  const [isLoading, setIsLoading] = useState(false) // Loading now handled at page level
  const [sections, setSections] = useState(createMockFormSections)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [selectedReportId, setSelectedReportId] = useState("4528")
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [pulsingFieldId, setPulsingFieldId] = useState<string | null>(null)
  const [showAdminSuite, setShowAdminSuite] = useState(false)
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set())
  const [verifiedVesLinkFields, setVerifiedVesLinkFields] = useState<Set<string>>(new Set())
  const [currentCriticalIndex, setCurrentCriticalIndex] = useState(0)
  const [activeIconRailItem, setActiveIconRailItem] = useState<IconRailItem>("ai")
  const [showNavSidebar, setShowNavSidebar] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"pending" | "verified">("pending")
  const [showValidationMessage, setShowValidationMessage] = useState(true)
  
  // Modal states
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [fieldToFlag, setFieldToFlag] = useState<{ id: string; name: string } | null>(null)

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
  
  // VesLink critical and manual-fill field tracking
  const vesLinkCriticalTotal = CRITICAL_FIELDS_NOON_SEA.length
  const vesLinkCriticalVerified = verifiedVesLinkFields.size
  
  // Manual fill fields - track separately
  const manualFillFieldIds = MANUAL_FILL_FIELDS
  const manualFillVerified = manualFillFieldIds.filter(id => verifiedVesLinkFields.has(id)).length
  const manualFillTotal = manualFillFieldIds.length
  
  // Critical fields (excluding manual-fill)
  const criticalOnlyFieldIds = CRITICAL_FIELDS_NOON_SEA.filter(id => !MANUAL_FILL_FIELDS.includes(id))
  const criticalOnlyVerified = criticalOnlyFieldIds.filter(id => verifiedVesLinkFields.has(id)).length
  const criticalOnlyTotal = criticalOnlyFieldIds.length
  
  // Updated counts for Pending/Verified toggle
  // Pending = critical-pending + manualFill-pending + manualFill-entered-not-confirmed
  // Verified = critical-verified + manualFill-confirmed
  const displayPendingCount = (criticalOnlyTotal - criticalOnlyVerified) + (manualFillTotal - manualFillVerified)
  const displayVerifiedCount = criticalOnlyVerified + manualFillVerified
  
  // Submit gating: ALL critical fields verified/flagged AND ALL manualFill fields confirmed/flagged
  const allCriticalDone = criticalOnlyVerified === criticalOnlyTotal
  const allManualFillDone = manualFillVerified === manualFillTotal
  const canSubmit = allCriticalDone && allManualFillDone

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

  // Field metadata for proper labels and source mappings (includes both critical and manual-fill)
  const getFieldMetadata = (fieldId: string) => {
    type FieldMetadata = { 
      label: string
      sourceTab: string
      sourceField: string
      value: string
      fieldType?: FieldType
      unit?: string
      whyNeeded?: string
      whereToFind?: string
      inputKind?: "text" | "select"
      options?: string[]
    }
    
    const metadata: Record<string, FieldMetadata> = {
      // Critical fields
      "date-time": { label: "Date/Time", sourceTab: "Operational", sourceField: "Report Date/Time", value: "14/04/2026 12:00" },
      "voyage-number": { label: "Voyage Number", sourceTab: "Operational", sourceField: "Voyage Number", value: "124" },
      "vessel-condition": { label: "Vessel Condition", sourceTab: "Operational", sourceField: "Vessel Condition", value: "Laden" },
      "next-port": { label: "Next Port", sourceTab: "Operational", sourceField: "Next Port", value: "Fujairah" },
      "eta": { label: "ETA", sourceTab: "Operational", sourceField: "ETA", value: "22/04/2026 14:00" },
      "distance-to-go": { label: "Distance to Go", sourceTab: "Operational", sourceField: "Distance to Go", value: "2847" },
      "cp-ordered-speed": { label: "CP / Ordered Speed", sourceTab: "Operational", sourceField: "Ordered Speed", value: "12.5" },
      "reported-speed": { label: "Reported Speed", sourceTab: "Operational", sourceField: "Reported Speed", value: "12.3" },
      "time-since-last": { label: "Time Since Last Report", sourceTab: "Operational", sourceField: "Time Since Last Report", value: "24.0" },
      "main-engine-rpm": { label: "Main Engine RPM", sourceTab: "Power", sourceField: "ME RPM", value: "85.2" },
      "beaufort": { label: "Beaufort", sourceTab: "Pos & Weather", sourceField: "Beaufort Scale", value: "4" },
      "bunkers-section": { label: "ROB, Consumption & Used For", sourceTab: "Bunker", sourceField: "Bunker ROB Table", value: "Complete" },
      "fresh-water-rob": { label: "Fresh Water ROB", sourceTab: "Stock", sourceField: "Fresh Water ROB", value: "125.4" },
      "distilled-water-rob": { label: "Distilled Water ROB", sourceTab: "Stock", sourceField: "Distilled Water ROB", value: "48.2" },
      "slops-rob": { label: "Slops ROB", sourceTab: "Stock", sourceField: "Slops ROB", value: "12.8" },
      // Manual-fill fields
      "observed-distance": { 
        label: "Observed Distance (nm)", 
        sourceTab: "", 
        sourceField: "", 
        value: "",
        fieldType: "manualFill",
        unit: "nm",
        whyNeeded: "Observed distance is the actual distance the vessel has travelled through the water since the last noon report, as read directly from the ship's log. It anchors fuel-per-mile and slip calculations, and is a regulated input for charter-party performance reporting. NAVTOR does not have access to this value, so it must be entered manually from the ship's log.",
        whereToFind: "Read from the doppler speed log or deck log. Officer on watch at noon typically records the cumulative reading."
      },
      "engine-distance": { 
        label: "Engine Distance (nm)", 
        sourceTab: "", 
        sourceField: "", 
        value: "",
        fieldType: "manualFill",
        unit: "nm",
        whyNeeded: "Engine distance is the theoretical distance based on main-engine revolutions, derived from RPM × pitch × hours. Together with observed distance it's used to compute propeller slip — a core indicator of hull and propeller performance. NAVTOR does not capture this value; it comes from the engine room log.",
        whereToFind: "Engine room log; 2nd Engineer typically records engine distance at noon."
      },
      "sea-state": { 
        label: "Sea State", 
        sourceTab: "", 
        sourceField: "", 
        value: "",
        fieldType: "manualFill",
        inputKind: "select",
        options: ["Select...", "00 CALM (GLASSY)", "01 CALM (RIPPLED)", "02 SMOOTH", "03 SLIGHT", "04 MODERATE", "05 ROUGH", "06 VERY ROUGH", "07 HIGH", "08 VERY HIGH", "09 PHENOMENAL", "10 NOT APPLICABLE"],
        whyNeeded: "Sea State describes the surface condition of the sea on the Douglas scale (0–9, plus Not Applicable). It's used to contextualise vessel performance metrics — fuel consumption, speed loss, and slip all vary materially with sea state. Charterers and regulators require this value on every noon report. NAVTOR does not provide an automated Douglas-scale classification, so the watch officer enters it based on visual observation.",
        whereToFind: "Officer on watch observes at the time of the report and selects from the Douglas scale."
      },
    }
    return metadata[fieldId] || { 
      label: fieldId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      sourceTab: "Operational",
      sourceField: fieldId,
      value: ""
    }
  }
  
  // Alias for backwards compatibility
  const getCriticalFieldMetadata = getFieldMetadata

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

  // Compute sorted field order for navigation:
  // (1) critical-pending, (2) manualFill-pending/entered, (3) flagged, (4) verified/everything else
  const getSortedFieldIds = useCallback(() => {
    const criticalPending: string[] = []
    const manualFillPending: string[] = []
    const flagged: string[] = []
    const verified: string[] = []
    
    CRITICAL_FIELDS_NOON_SEA.forEach(fieldId => {
      const isVerified = verifiedVesLinkFields.has(fieldId)
      const isManualFillField = MANUAL_FILL_FIELDS.includes(fieldId)
      
      // For now, we don't have a separate flagged state tracking, so treat all non-verified as pending
      if (isVerified) {
        verified.push(fieldId)
      } else if (isManualFillField) {
        manualFillPending.push(fieldId)
      } else {
        criticalPending.push(fieldId)
      }
    })
    
    // Return in priority order: critical-pending -> manualFill-pending -> flagged -> verified
    return [...criticalPending, ...manualFillPending, ...flagged, ...verified]
  }, [verifiedVesLinkFields])

  // Navigate to next critical field (cycles through all critical fields in priority order)
  const navigateToNextCritical = useCallback(() => {
    const sortedFields = getSortedFieldIds()
    const totalCritical = sortedFields.length
    const nextIndex = (currentCriticalIndex % totalCritical) + 1
    const nextFieldId = sortedFields[nextIndex - 1]
    
    if (nextFieldId) {
      // Create a mock field object for the left panel with proper metadata
      const metadata = getFieldMetadata(nextFieldId)
      const isManualFill = metadata.fieldType === "manualFill"
      const mockField: FormField = {
        id: nextFieldId,
        label: metadata.label,
        value: metadata.value,
        unit: metadata.unit,
        confidence: isManualFill ? 0 : 95 + Math.floor(Math.random() * 5),
        status: verifiedVesLinkFields.has(nextFieldId) ? "verified" : "pending",
        isCritical: !isManualFill,
        fieldType: metadata.fieldType,
        sourceAvailable: !isManualFill,
        manualFillStatus: isManualFill ? "awaiting" : undefined,
        sourceTab: metadata.sourceTab,
        sourceField: metadata.sourceField,
        whyNeeded: metadata.whyNeeded,
        whereToFind: metadata.whereToFind,
        inputKind: metadata.inputKind,
        options: metadata.options,
      }
      setSelectedField(mockField)
      setCurrentCriticalIndex(nextIndex)
      
      // Scroll to field on VesLink form
      scrollToVesLinkField(nextFieldId)
      
      // Also scroll to field card in left panel
      const fieldCard = document.getElementById(`field-card-${nextFieldId}`)
      if (fieldCard) {
        fieldCard.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [currentCriticalIndex, verifiedVesLinkFields, scrollToVesLinkField, getSortedFieldIds])

  // Navigate to previous critical field (cycles through all critical fields in priority order)
  const navigateToPrevCritical = useCallback(() => {
    const sortedFields = getSortedFieldIds()
    const totalCritical = sortedFields.length
    const prevIndex = currentCriticalIndex <= 1 ? totalCritical : currentCriticalIndex - 1
    const prevFieldId = sortedFields[prevIndex - 1]
    
    if (prevFieldId) {
      const metadata = getFieldMetadata(prevFieldId)
      const isManualFill = metadata.fieldType === "manualFill"
      const mockField: FormField = {
        id: prevFieldId,
        label: metadata.label,
        value: metadata.value,
        unit: metadata.unit,
        confidence: isManualFill ? 0 : 95 + Math.floor(Math.random() * 5),
        status: verifiedVesLinkFields.has(prevFieldId) ? "verified" : "pending",
        isCritical: !isManualFill,
        fieldType: metadata.fieldType,
        sourceAvailable: !isManualFill,
        manualFillStatus: isManualFill ? "awaiting" : undefined,
        sourceTab: metadata.sourceTab,
        sourceField: metadata.sourceField,
        whyNeeded: metadata.whyNeeded,
        whereToFind: metadata.whereToFind,
        inputKind: metadata.inputKind,
        options: metadata.options,
      }
      setSelectedField(mockField)
      setCurrentCriticalIndex(prevIndex)
      
      // Scroll to field on VesLink form
      scrollToVesLinkField(prevFieldId)
      
      // Also scroll to field card in left panel
      const fieldCard = document.getElementById(`field-card-${prevFieldId}`)
      if (fieldCard) {
        fieldCard.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [currentCriticalIndex, verifiedVesLinkFields, scrollToVesLinkField, getSortedFieldIds])

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
    
    // Check if this was the last required field (critical + manual-fill)
    const newVerifiedCount = verifiedVesLinkFields.size + 1
    const allCriticalNowDone = criticalOnlyFieldIds.filter(id => verifiedVesLinkFields.has(id) || id === fieldId).length === criticalOnlyTotal
    const allManualFillNowDone = manualFillFieldIds.filter(id => verifiedVesLinkFields.has(id) || id === fieldId).length === manualFillTotal
    
    if (allCriticalNowDone && allManualFillNowDone) {
      setToast({ message: "All required fields confirmed — ready to submit", type: "success" })
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

      {/* Main Content - Three Column Layout (Icon Rail + Field List + VesLink Form) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Icon Rail - Far Left */}
        <IconRail
          activeItem={activeIconRailItem}
          onItemClick={setActiveIconRailItem}
          onLayersClick={() => setShowNavSidebar(!showNavSidebar)}
          userInitials="JD"
        />

        {/* Navigation Sidebar Overlay */}
        {showNavSidebar && (
          <>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 z-20"
              onClick={() => setShowNavSidebar(false)}
            />
            {/* Sidebar Panel */}
            <div className="absolute left-12 top-0 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg z-30 overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Navigation</h3>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => setShowNavSidebar(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  New Transfer
                </button>
                <button 
                  onClick={() => setShowNavSidebar(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 text-sm mt-1"
                >
                  <Layers className="w-4 h-4" />
                  In Progress (3)
                </button>
                <button 
                  onClick={() => setShowNavSidebar(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 text-sm mt-1"
                >
                  <Check className="w-4 h-4" />
                  History
                </button>
              </div>
            </div>
          </>
        )}

        {/* Left Panel - Single Field Focus View */}
        <div className="flex-1 min-w-0 max-w-[40%] border-r border-[#e2e8f0] flex flex-col overflow-hidden bg-white">
          <SingleFieldFocusPane
            field={selectedField ? {
              id: selectedField.id,
              fieldName: selectedField.label,
              status: selectedField.status,
              isCritical: selectedField.isCritical || false,
              fieldType: selectedField.fieldType,
              sourceAvailable: selectedField.sourceAvailable,
              manualFillStatus: selectedField.manualFillStatus,
              mappedSource: selectedField.sourceField || "",
              sourceTab: selectedField.sourceTab || "",
              isPopulated: !!selectedField.value,
              value: selectedField.value,
              unit: selectedField.unit,
              confidence: selectedField.confidence,
              whyNeeded: selectedField.whyNeeded,
              whereToFind: selectedField.whereToFind,
              inputKind: selectedField.inputKind,
              options: selectedField.options,
            } : null}
            currentIndex={currentCriticalIndex}
            totalCount={vesLinkCriticalTotal}
            onVerify={handleVerify}
            onFlag={() => {
              if (selectedField) {
                setFieldToFlag({ id: selectedField.id, name: selectedField.label })
                setShowFlagModal(true)
              }
            }}
            onNavigate={(direction) => {
              if (direction === "next") {
                navigateToNextCritical()
              } else {
                navigateToPrevCritical()
              }
            }}
            onConfirmEntry={() => {
              if (selectedField?.fieldType === "manualFill") {
                setSelectedField({ ...selectedField, status: "verified", manualFillStatus: "confirmed" })
                // Navigate to next pending field
                navigateToNextCritical()
              }
            }}
            manualFillValue={selectedField?.value}
            onScrollToField={() => {
              // Scroll the VesLink input into view
              const inputEl = document.getElementById(`vl-field-${selectedField?.id}`)
              if (inputEl) {
                inputEl.scrollIntoView({ behavior: "smooth", block: "center" })
                inputEl.focus()
              }
            }}
            sourceReports={["#4528", "#4529", "#4530"]}
          />
        </div>

        {/* Right Panel - VesLink Form (authentic replica) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Highlights Navigation Bar */}
          <HighlightsNavBar
            vesselName="SEAWAYS SKOPELOS"
            currentIndex={currentCriticalIndex}
            totalCount={vesLinkCriticalTotal}
            pendingCount={displayPendingCount}
            verifiedCount={displayVerifiedCount}
            activeFilter={statusFilter}
            onFilterChange={(filter) => {
              setStatusFilter(filter)
            }}
            onPrev={navigateToPrevCritical}
            onNext={navigateToNextCritical}
            onVesselClick={() => {
              // Scroll to vessel name field
              scrollToVesLinkField("vessel-name")
            }}
          />
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
                
                // Update critical field index if this is a critical field
                if (isCritical) {
                  const criticalIndex = CRITICAL_FIELDS_NOON_SEA.indexOf(fieldId)
                  if (criticalIndex !== -1) {
                    setCurrentCriticalIndex(criticalIndex + 1)
                  }
                }
                
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
              statusFilter={statusFilter}
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

      {/* Sticky Bottom Action Bar with Validation Message */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        {/* Validation Message Banner */}
        {!canSubmit && showValidationMessage && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 border-b border-gray-100">
            <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              All <span className="font-semibold text-amber-600">required fields</span> must be confirmed before submitting
            </span>
            <button
              onClick={() => setShowValidationMessage(false)}
              className="ml-2 p-0.5 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="px-6 py-3 flex justify-center gap-3">
          <button
            onClick={() => {
              const now = new Date()
              const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              setToast({ message: `Draft saved at ${time}`, type: "save" })
            }}
            className="border border-gray-300 rounded-lg px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[140px]"
          >
            Save as draft
          </button>
          <button
            onClick={handleSubmitClick}
            disabled={!canSubmit}
            className={`rounded-lg px-6 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors min-w-[180px] ${
              canSubmit
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            Submit to veslink
          </button>
        </div>
      </div>

      {/* Flag Field Modal */}
      <FlagFieldModal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false)
          setFieldToFlag(null)
        }}
        fieldName={fieldToFlag?.name || ""}
        onCancel={() => {
          setShowFlagModal(false)
          setFieldToFlag(null)
        }}
        onSubmit={(reason, comment) => {
          setShowFlagModal(false)
          setToast({ 
            message: `Field "${fieldToFlag?.name}" flagged for review`, 
            type: "flag" 
          })
          setFieldToFlag(null)
        }}
      />
    </div>
  )
}
