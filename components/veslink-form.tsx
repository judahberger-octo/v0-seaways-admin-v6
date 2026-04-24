"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Check, Star } from "lucide-react"

// EXACT Critical fields for Noon-Sea reports per Avinash's list (16 fields + 3 manual-fill)
// Order matches the form flow for navigation: top to bottom
// Manual-fill fields are marked with (Manual Fill) - these require user input, not AI pre-fill
export const CRITICAL_FIELDS_NOON_SEA = [
  "date-time",           // 1. Date/Time (header section)
  "voyage-number",       // 2. Voyage Number (header section)
  "vessel-condition",    // 3. Vessel Condition (header section)
  "next-port",           // 4. Next Port (header section)
  "eta",                 // 5. ETA (header section)
  "distance-to-go",      // 6. Distance to Go (Distance and Vessel section)
  "cp-ordered-speed",    // 7. CP Ordered Speed (Distance and Vessel section)
  "reported-speed",      // 8. Reported Speed (Distance and Vessel section)
  "observed-distance",   // 9. Observed Distance (Manual Fill - not in NAVTOR)
  "engine-distance",     // 10. Engine Distance (Manual Fill - not in NAVTOR)
  "time-since-last",     // 11. Time Since Last Report (Distance and Vessel section)
  "main-engine-rpm",     // 12. Main Engine RPM (Machinery section)
  "beaufort",            // 13. Beaufort (Weather section)
  "sea-state",           // 14. Sea State (Manual Fill - not in NAVTOR)
  "bunkers-section",     // 15. ROB, Consumption & Used For (entire Bunkers section)
  "fresh-water-rob",     // 16. Fresh Water ROB (Water section)
  "distilled-water-rob", // 17. Distilled Water ROB (Water section)
  "slops-rob"            // 18. Slops ROB (Water section)
]

// Manual fill field IDs (fields that require user input, not AI pre-fill)
export const MANUAL_FILL_FIELDS = [
  "observed-distance",
  "engine-distance",
  "sea-state"
]

interface VesLinkFormProps {
  selectedFieldId: string | null
  onFieldSelect: (fieldId: string) => void
  editedFields: Set<string>
  onFieldEdit: (fieldId: string, value: string) => void
  verifiedFields?: Set<string>
  onFormReady?: (getFieldValue: (fieldId: string) => string) => void
}

// Form field data structure
interface FieldData {
  id: string
  value: string
  type: "text" | "select" | "textarea" | "date" | "time"
  options?: string[]
}

// Initial form values matching real VesLink structure with new fields added
const initialFormData: Record<string, FieldData> = {
  // General Information
  "vessel-name": { id: "vessel-name", value: "SEAWAYS SKOPELOS", type: "text" },
  "date-time": { id: "date-time", value: "14/04/2026 12:00", type: "text" },
  "latitude": { id: "latitude", value: "35 42' 00\" N", type: "text" },
  "voyage-number": { id: "voyage-number", value: "124", type: "text" },
  "longitude": { id: "longitude", value: "014 25' 00\" E", type: "text" },
  "vessel-condition": { id: "vessel-condition", value: "Laden", type: "select", options: ["Select...", "Laden", "Ballast", "Part Laden"] },
  "location": { id: "location", value: "At Sea", type: "select", options: ["Select...", "At Sea", "In Port", "At Anchor", "Drifting"] },
  "remarks": { id: "remarks", value: "Vessel proceeding to next port as per orders.", type: "textarea" },
  // NEW: Next Port & ETA
  "next-port": { id: "next-port", value: "Fujairah", type: "text" },
  "eta-date": { id: "eta-date", value: "22/04/2026", type: "text" },
  "eta-time": { id: "eta-time", value: "14:00", type: "text" },
  "eta": { id: "eta", value: "22/04/2026 14:00", type: "text" }, // Combined for critical field tracking
  
  // Distance and Vessel - with NEW fields (including Manual Fill fields)
  "distance-to-go": { id: "distance-to-go", value: "2847", type: "text" },
  "cp-ordered-speed": { id: "cp-ordered-speed", value: "12.5", type: "text" },
  "reported-speed": { id: "reported-speed", value: "12.3", type: "text" },
  "observed-distance": { id: "observed-distance", value: "", type: "text" }, // Manual Fill - empty by default
  "engine-distance": { id: "engine-distance", value: "", type: "text" }, // Manual Fill - empty by default
  "ballast": { id: "ballast", value: "1896", type: "text" },
  "displacement": { id: "displacement", value: "172000", type: "text" },
  "slip": { id: "slip", value: "0.35", type: "text" },
  "time-since-last": { id: "time-since-last", value: "24.0", type: "text" },
  "fwd-draft": { id: "fwd-draft", value: "16.6", type: "text" },
  "mid-draft": { id: "mid-draft", value: "16.6", type: "text" },
  "aft-draft": { id: "aft-draft", value: "16.6", type: "text" },
  
  // Machinery - with NEW Main Engine RPM
  "main-engine-rpm": { id: "main-engine-rpm", value: "85.2", type: "text" },
  "gen1-kwhrs": { id: "gen1-kwhrs", value: "1220", type: "text" },
  "gen1-hrs": { id: "gen1-hrs", value: "4.0", type: "text" },
  "gen2-kwhrs": { id: "gen2-kwhrs", value: "0", type: "text" },
  "gen2-hrs": { id: "gen2-hrs", value: "0.0", type: "text" },
  "gen3-kwhrs": { id: "gen3-kwhrs", value: "1220", type: "text" },
  "gen3-hrs": { id: "gen3-hrs", value: "4.0", type: "text" },
  "boiler-hrs": { id: "boiler-hrs", value: "0.9", type: "text" },
  
  // Weather
  "beaufort": { id: "beaufort", value: "4", type: "select", options: ["Select...", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] },
  "wind-direction": { id: "wind-direction", value: "NW", type: "select", options: ["Select...", "N", "NE", "E", "SE", "S", "SW", "W", "NW"] },
  // Manual Fill - Sea State with Douglas Scale options
  "sea-state": { id: "sea-state", value: "", type: "select", options: ["Select...", "00 CALM (GLASSY)", "01 CALM (RIPPLED)", "02 SMOOTH", "03 SLIGHT", "04 MODERATE", "05 ROUGH", "06 VERY ROUGH", "07 HIGH", "08 VERY HIGH", "09 PHENOMENAL", "10 NOT APPLICABLE"] },
  "sea-height": { id: "sea-height", value: "1.5", type: "text" },
  "sea-temp": { id: "sea-temp", value: "18.2", type: "text" },
  
  // Bunkers - Measurement Method
  "measurement-method": { id: "measurement-method", value: "Sounding", type: "select", options: ["Select...", "Sounding", "Flow Meter", "BDN"] },
  "bunkers-section": { id: "bunkers-section", value: "complete", type: "text" }, // Meta field for critical tracking
  
  // Bunkers ROB - simplified values per spec
  "ifo-rob": { id: "ifo-rob", value: "1245", type: "text" },
  "mgo-rob": { id: "mgo-rob", value: "342", type: "text" },
  "lsf-rob": { id: "lsf-rob", value: "0", type: "text" },
  "lsmgo-rob": { id: "lsmgo-rob", value: "587", type: "text" },
  
  // Bunkers consumption fields (IFO)
  "ifo-main": { id: "ifo-main", value: "28.5", type: "text" },
  "ifo-aux": { id: "ifo-aux", value: "2.1", type: "text" },
  "ifo-total": { id: "ifo-total", value: "30.6", type: "text" },
  "ifo-prop": { id: "ifo-prop", value: "28.5", type: "text" },
  "ifo-gen": { id: "ifo-gen", value: "0", type: "text" },
  "ifo-disch": { id: "ifo-disch", value: "0", type: "text" },
  "ifo-loading": { id: "ifo-loading", value: "0", type: "text" },
  "ifo-igs": { id: "ifo-igs", value: "0", type: "text" },
  "ifo-cargo-heat": { id: "ifo-cargo-heat", value: "0", type: "text" },
  "ifo-bunker-heat": { id: "ifo-bunker-heat", value: "0", type: "text" },
  "ifo-tank-clean": { id: "ifo-tank-clean", value: "0", type: "text" },
  "ifo-other": { id: "ifo-other", value: "0", type: "text" },
  "ifo-adj": { id: "ifo-adj", value: "0", type: "text" },
  
  // MGO consumption
  "mgo-main": { id: "mgo-main", value: "0", type: "text" },
  "mgo-aux": { id: "mgo-aux", value: "3.2", type: "text" },
  "mgo-total": { id: "mgo-total", value: "3.2", type: "text" },
  "mgo-prop": { id: "mgo-prop", value: "0", type: "text" },
  "mgo-gen": { id: "mgo-gen", value: "3.2", type: "text" },
  "mgo-disch": { id: "mgo-disch", value: "0", type: "text" },
  "mgo-loading": { id: "mgo-loading", value: "0", type: "text" },
  "mgo-igs": { id: "mgo-igs", value: "0", type: "text" },
  "mgo-cargo-heat": { id: "mgo-cargo-heat", value: "0", type: "text" },
  "mgo-bunker-heat": { id: "mgo-bunker-heat", value: "0", type: "text" },
  "mgo-tank-clean": { id: "mgo-tank-clean", value: "0", type: "text" },
  "mgo-other": { id: "mgo-other", value: "0", type: "text" },
  "mgo-adj": { id: "mgo-adj", value: "0", type: "text" },
  
  // LSF consumption
  "lsf-main": { id: "lsf-main", value: "0", type: "text" },
  "lsf-aux": { id: "lsf-aux", value: "0", type: "text" },
  "lsf-total": { id: "lsf-total", value: "0", type: "text" },
  "lsf-prop": { id: "lsf-prop", value: "0", type: "text" },
  "lsf-gen": { id: "lsf-gen", value: "0", type: "text" },
  "lsf-disch": { id: "lsf-disch", value: "0", type: "text" },
  "lsf-loading": { id: "lsf-loading", value: "0", type: "text" },
  "lsf-igs": { id: "lsf-igs", value: "0", type: "text" },
  "lsf-cargo-heat": { id: "lsf-cargo-heat", value: "0", type: "text" },
  "lsf-bunker-heat": { id: "lsf-bunker-heat", value: "0", type: "text" },
  "lsf-tank-clean": { id: "lsf-tank-clean", value: "0", type: "text" },
  "lsf-other": { id: "lsf-other", value: "0", type: "text" },
  "lsf-adj": { id: "lsf-adj", value: "0", type: "text" },
  
  // LSMGO consumption
  "lsmgo-main": { id: "lsmgo-main", value: "0", type: "text" },
  "lsmgo-aux": { id: "lsmgo-aux", value: "0.8", type: "text" },
  "lsmgo-total": { id: "lsmgo-total", value: "0.8", type: "text" },
  "lsmgo-prop": { id: "lsmgo-prop", value: "0", type: "text" },
  "lsmgo-gen": { id: "lsmgo-gen", value: "0.8", type: "text" },
  "lsmgo-disch": { id: "lsmgo-disch", value: "0", type: "text" },
  "lsmgo-loading": { id: "lsmgo-loading", value: "0", type: "text" },
  "lsmgo-igs": { id: "lsmgo-igs", value: "0", type: "text" },
  "lsmgo-cargo-heat": { id: "lsmgo-cargo-heat", value: "0", type: "text" },
  "lsmgo-bunker-heat": { id: "lsmgo-bunker-heat", value: "0", type: "text" },
  "lsmgo-tank-clean": { id: "lsmgo-tank-clean", value: "0", type: "text" },
  "lsmgo-other": { id: "lsmgo-other", value: "0", type: "text" },
  "lsmgo-adj": { id: "lsmgo-adj", value: "0", type: "text" },
  
  // Water - with all fields per spec
  "fresh-water-rob": { id: "fresh-water-rob", value: "125.4", type: "text" },
  "distilled-water-rob": { id: "distilled-water-rob", value: "48.2", type: "text" },
  "slops-rob": { id: "slops-rob", value: "12.8", type: "text" },
  "tank-clean-chem": { id: "tank-clean-chem", value: "340", type: "text" },
  "distilled-consumed": { id: "distilled-consumed", value: "8.5", type: "text" },
  "fresh-consumed": { id: "fresh-consumed", value: "14.2", type: "text" },
  "distilled-produced": { id: "distilled-produced", value: "6.5", type: "text" },
  "fresh-produced": { id: "fresh-produced", value: "10.0", type: "text" },
  
  // Master's Name
  "master-first": { id: "master-first", value: "JUDE LEVI", type: "text" },
  "master-last": { id: "master-last", value: "FIGUEIREDO", type: "text" },
}

// Critical/Manual-fill field indicator component
// Shows orange star for manual-fill (not verified), red star for critical pending, green check for verified
function CriticalIndicator({ fieldId, isVerified, isManualFill = false }: { fieldId: string; isVerified: boolean; isManualFill?: boolean }) {
  const isCritical = CRITICAL_FIELDS_NOON_SEA.includes(fieldId)
  if (!isCritical) return null
  
  if (isVerified) {
    // Verified/Confirmed - green check
    return <Check className="w-3.5 h-3.5 text-[#16a34a] flex-shrink-0" />
  }
  
  if (isManualFill) {
    // Manual fill pending - orange star (distinct from critical red)
    return <Star className="w-3.5 h-3.5 text-[#f97316] flex-shrink-0" fill="#f97316" />
  }
  
  // Critical pending - red star
  return <Star className="w-3.5 h-3.5 text-[#dc2626] flex-shrink-0" fill="#dc2626" />
}

// Validation function type for soft warnings
type ValidationFn = (value: string) => string | null

// Reusable input component that matches VesLink styling with color-coded borders
function VLInput({ 
  id, 
  value, 
  onChange, 
  isSelected, 
  isEdited,
  isVerified,
  onSelect,
  width = "auto",
  className = "",
  isCritical = false,
  isManualFill = false,
  validate
}: { 
  id: string
  value: string
  onChange: (value: string) => void
  isSelected: boolean
  isEdited: boolean
  isVerified: boolean
  onSelect: () => void
  width?: string
  className?: string
  isCritical?: boolean
  isManualFill?: boolean
  validate?: ValidationFn
}) {
  // Compute validation warning
  const validationWarning = validate && value ? validate(value) : null
  
  // For manual-fill fields, auto-complete when value is non-empty (no confirm button needed)
  const isManualFillComplete = isManualFill && value && value.trim() !== ""
  const effectivelyVerified = isVerified || isManualFillComplete
  
  // Determine border color based on field state
  const getBorderStyle = () => {
    if (effectivelyVerified) {
      // Verified/Complete = green border
      return isSelected 
        ? "border-2 border-[#16a34a] ring-2 ring-[#16a34a]/30 shadow-[0_0_8px_rgba(22,163,74,0.4)]" 
        : "border-2 border-[#16a34a]"
    }
    if (isManualFill) {
      // Manual fill field (empty/awaiting) = orange border
      return isSelected 
        ? "border-2 border-[#f97316] ring-2 ring-[#f97316]/30 shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
        : "border-2 border-[#f97316]"
    }
    if (isCritical) {
      // Critical pending = red border
      return isSelected 
        ? "border-2 border-[#dc2626] ring-2 ring-[#dc2626]/30 shadow-[0_0_8px_rgba(220,38,38,0.4)]" 
        : "border-2 border-[#dc2626]"
    }
    if (isEdited) {
      // Edited field = amber border
      return isSelected 
        ? "border-2 border-[#f59e0b] ring-2 ring-[#f59e0b]/30 shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
        : "border-2 border-[#f59e0b]"
    }
    // Standard/default = neutral border
    return isSelected 
      ? "border border-[#7c3aed] ring-2 ring-[#7c3aed]/30 shadow-[0_0_8px_rgba(124,58,237,0.3)]" 
      : "border border-[#999]"
  }
  
  // Get indicator icon for manual fill fields
  const getIndicatorIcon = () => {
    if (isManualFill && !effectivelyVerified) return "orange" // orange star for empty
    if (effectivelyVerified) return "green" // green check for complete
    return null
  }
  
  return (
    <div className="relative inline-flex flex-col" style={{ width }}>
      <input
        id={`vl-field-${id}`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={onSelect}
        className={`
          w-full h-6 px-1.5 text-[13px] bg-white transition-all duration-300
          focus:outline-none
          ${getBorderStyle()}
          ${className}
        `}
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      />
      {isEdited && !isVerified && (
        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
      )}
      {/* Validation warning - soft warning, non-blocking */}
      {validationWarning && (
        <span className="text-[10px] text-amber-600 mt-0.5 leading-tight whitespace-nowrap">
          {validationWarning}
        </span>
      )}
    </div>
  )
}

// Reusable select component with color-coded borders
function VLSelect({ 
  id, 
  value, 
  options,
  onChange, 
  isSelected, 
  isEdited,
  isVerified,
  onSelect,
  width = "auto",
  isCritical = false,
  isManualFill = false,
  validate
}: { 
  id: string
  value: string
  options: string[]
  onChange: (value: string) => void
  isSelected: boolean
  isEdited: boolean
  isVerified: boolean
  onSelect: () => void
  width?: string
  isCritical?: boolean
  isManualFill?: boolean
  validate?: ValidationFn
}) {
  // Compute validation warning
  const validationWarning = validate && value ? validate(value) : null
  
  // For manual-fill dropdowns, auto-complete when a real option is selected (not placeholder)
  const isManualFillComplete = isManualFill && value && value.trim() !== "" && value !== "Select..."
  const effectivelyVerified = isVerified || isManualFillComplete
  
  // Determine border color based on field state
  const getBorderStyle = () => {
    if (effectivelyVerified) {
      // Verified/Complete = green border
      return isSelected 
        ? "border-2 border-[#16a34a] ring-2 ring-[#16a34a]/30 shadow-[0_0_8px_rgba(22,163,74,0.4)]" 
        : "border-2 border-[#16a34a]"
    }
    if (isManualFill) {
      // Manual fill field (empty/awaiting) = orange border
      return isSelected 
        ? "border-2 border-[#f97316] ring-2 ring-[#f97316]/30 shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
        : "border-2 border-[#f97316]"
    }
    if (isCritical) {
      // Critical pending = red border
      return isSelected 
        ? "border-2 border-[#dc2626] ring-2 ring-[#dc2626]/30 shadow-[0_0_8px_rgba(220,38,38,0.4)]" 
        : "border-2 border-[#dc2626]"
    }
    if (isEdited) {
      // Edited field = amber border
      return isSelected 
        ? "border-2 border-[#f59e0b] ring-2 ring-[#f59e0b]/30 shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
        : "border-2 border-[#f59e0b]"
    }
    // Standard/default = neutral border
    return isSelected 
      ? "border border-[#7c3aed] ring-2 ring-[#7c3aed]/30 shadow-[0_0_8px_rgba(124,58,237,0.3)]" 
      : "border border-[#999]"
  }
  
  return (
    <div className="relative inline-flex flex-col" style={{ width }}>
      <div className="relative">
        <select
          id={`vl-field-${id}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={onSelect}
          className={`
            w-full h-6 px-1 text-[13px] bg-white transition-all duration-300
            focus:outline-none appearance-none cursor-pointer
            ${getBorderStyle()}
          `}
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
        {isEdited && !isVerified && (
          <div className="absolute top-0.5 right-4 w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
        )}
      </div>
      {/* Validation warning - soft warning, non-blocking */}
      {validationWarning && (
        <span className="text-[10px] text-amber-600 mt-0.5 leading-tight whitespace-nowrap">
          {validationWarning}
        </span>
      )}
    </div>
  )
}

// Section header badge (dark blue)
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#2b5797] text-white text-[13px] font-bold px-2.5 py-1 rounded-sm inline-block mb-2">
      {title}
    </div>
  )
}

// Form row with label and input - now with critical and manual-fill indicators
function FormRow({ 
  label, 
  fieldId,
  children,
  labelWidth = "auto",
  isVerified = false,
  isManualFill = false
}: { 
  label: string
  fieldId?: string
  children: React.ReactNode
  labelWidth?: string
  isVerified?: boolean
  isManualFill?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <div className="flex items-center gap-1 shrink-0" style={{ width: labelWidth }}>
        {fieldId && <CriticalIndicator fieldId={fieldId} isVerified={isVerified} isManualFill={isManualFill} />}
        <label 
          className="text-[13px] text-[#333] text-right flex-1"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {label}
        </label>
      </div>
      {children}
    </div>
  )
}

// Bunker section header with critical indicator
function BunkerSectionHeader({ 
  title, 
  fieldId, 
  isVerified,
  isSelected,
  onSelect
}: { 
  title: string
  fieldId: string
  isVerified: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div 
      className={`bg-[#2b5797] text-white text-[13px] font-bold px-2.5 py-1 rounded-sm inline-flex items-center gap-2 mb-2 cursor-pointer ${
        isSelected ? "ring-2 ring-[#7c3aed]" : ""
      }`}
      onClick={onSelect}
      id={`vl-field-${fieldId}`}
    >
      <CriticalIndicator fieldId={fieldId} isVerified={isVerified} />
      <span>{title}</span>
    </div>
  )
}

// Simplified bunker table for display
function BunkerTable({
  formData,
  isSelected,
  isEdited,
  isVerified,
  onFieldSelect,
  handleFieldChange,
}: {
  formData: Record<string, FieldData>
  isSelected: (id: string) => boolean
  isEdited: (id: string) => boolean
  isVerified: (id: string) => boolean
  onFieldSelect: (id: string) => void
  handleFieldChange: (id: string, value: string) => void
}) {
  const fuelTypes = [
    { prefix: "ifo", name: "IFO", unit: "MT" },
    { prefix: "mgo", name: "MGO", unit: "MT" },
    { prefix: "lsf", name: "LSF", unit: "MT" },
    { prefix: "lsmgo", name: "LSMGO", unit: "MT" },
  ]
  
  return (
    <div className="overflow-x-auto">
      <table className="text-[11px] border-collapse" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <thead>
          <tr className="bg-[#4a5568] text-white">
            <th className="border border-[#999] px-1.5 py-1 text-left">Type<br/>(Unit)</th>
            <th className="border border-[#999] px-1.5 py-1 text-center">ROB</th>
            <th className="border border-[#999] px-1.5 py-1 text-center" colSpan={2}>Consumption</th>
            <th className="border border-[#999] px-1.5 py-1 text-center" colSpan={5}>Used For</th>
          </tr>
          <tr className="bg-[#4a5568] text-white text-[10px]">
            <th className="border border-[#999] px-1 py-0.5"></th>
            <th className="border border-[#999] px-1 py-0.5"></th>
            <th className="border border-[#999] px-1 py-0.5">Eng Breakdown</th>
            <th className="border border-[#999] px-1 py-0.5">Propulsion (ME)</th>
            <th className="border border-[#999] px-1 py-0.5">Generator (aux)</th>
            <th className="border border-[#999] px-1 py-0.5">Disch. Pumps</th>
            <th className="border border-[#999] px-1 py-0.5">Loading</th>
            <th className="border border-[#999] px-1 py-0.5">IGS</th>
          </tr>
        </thead>
        <tbody>
          {fuelTypes.map(fuel => (
            <BunkerFuelRow
              key={fuel.prefix}
              prefix={fuel.prefix}
              name={fuel.name}
              unit={fuel.unit}
              formData={formData}
              isSelected={isSelected}
              isEdited={isEdited}
              isVerified={isVerified}
              onFieldSelect={onFieldSelect}
              handleFieldChange={handleFieldChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Single fuel row in bunker table
function BunkerFuelRow({
  prefix,
  name,
  unit,
  formData,
  isSelected,
  isEdited,
  isVerified,
  onFieldSelect,
  handleFieldChange,
}: {
  prefix: string
  name: string
  unit: string
  formData: Record<string, FieldData>
  isSelected: (id: string) => boolean
  isEdited: (id: string) => boolean
  isVerified: (id: string) => boolean
  onFieldSelect: (id: string) => void
  handleFieldChange: (id: string, value: string) => void
}) {
  const robId = `${prefix}-rob`
  
  return (
    <>
      {/* Main row */}
      <tr>
        <td className="border border-[#999] px-1.5 py-1 bg-[#f5f5f5] font-medium" rowSpan={3}>
          {name}<br/>({unit})
        </td>
        <td className="border border-[#999] px-1 py-0.5 bg-[#f5f5f5]" rowSpan={3}>
          <VLInput
            id={robId}
            value={formData[robId]?.value || ""}
            onChange={(v) => handleFieldChange(robId, v)}
            isSelected={isSelected(robId)}
            isEdited={isEdited(robId)}
            isVerified={isVerified(robId)}
            onSelect={() => onFieldSelect(robId)}
            width="55px"
          />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5 text-[9px] text-[#666]">Main</td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-main`} value={formData[`${prefix}-main`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-main`, v)}
            isSelected={isSelected(`${prefix}-main`)} isEdited={isEdited(`${prefix}-main`)} isVerified={isVerified(`${prefix}-main`)}
            onSelect={() => onFieldSelect(`${prefix}-main`)} width="40px" />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-prop`} value={formData[`${prefix}-prop`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-prop`, v)}
            isSelected={isSelected(`${prefix}-prop`)} isEdited={isEdited(`${prefix}-prop`)} isVerified={isVerified(`${prefix}-prop`)}
            onSelect={() => onFieldSelect(`${prefix}-prop`)} width="40px" />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-gen`} value={formData[`${prefix}-gen`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-gen`, v)}
            isSelected={isSelected(`${prefix}-gen`)} isEdited={isEdited(`${prefix}-gen`)} isVerified={isVerified(`${prefix}-gen`)}
            onSelect={() => onFieldSelect(`${prefix}-gen`)} width="40px" />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-disch`} value={formData[`${prefix}-disch`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-disch`, v)}
            isSelected={isSelected(`${prefix}-disch`)} isEdited={isEdited(`${prefix}-disch`)} isVerified={isVerified(`${prefix}-disch`)}
            onSelect={() => onFieldSelect(`${prefix}-disch`)} width="40px" />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-loading`} value={formData[`${prefix}-loading`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-loading`, v)}
            isSelected={isSelected(`${prefix}-loading`)} isEdited={isEdited(`${prefix}-loading`)} isVerified={isVerified(`${prefix}-loading`)}
            onSelect={() => onFieldSelect(`${prefix}-loading`)} width="40px" />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-igs`} value={formData[`${prefix}-igs`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-igs`, v)}
            isSelected={isSelected(`${prefix}-igs`)} isEdited={isEdited(`${prefix}-igs`)} isVerified={isVerified(`${prefix}-igs`)}
            onSelect={() => onFieldSelect(`${prefix}-igs`)} width="40px" />
        </td>
      </tr>
      {/* Aux row */}
      <tr>
        <td className="border border-[#999] px-0.5 py-0.5 text-[9px] text-[#666]">Aux</td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-aux`} value={formData[`${prefix}-aux`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-aux`, v)}
            isSelected={isSelected(`${prefix}-aux`)} isEdited={isEdited(`${prefix}-aux`)} isVerified={isVerified(`${prefix}-aux`)}
            onSelect={() => onFieldSelect(`${prefix}-aux`)} width="40px" />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5 text-[9px] text-[#666]" colSpan={5}>
          Cargo Heat | Bunker Heat | Tank Clean | Other | Adj.
        </td>
      </tr>
      {/* Total row */}
      <tr>
        <td className="border border-[#999] px-0.5 py-0.5 text-[9px] text-[#666]">Total</td>
        <td className="border border-[#999] px-0.5 py-0.5">
          <VLInput id={`${prefix}-total`} value={formData[`${prefix}-total`]?.value || ""}
            onChange={(v) => handleFieldChange(`${prefix}-total`, v)}
            isSelected={isSelected(`${prefix}-total`)} isEdited={isEdited(`${prefix}-total`)} isVerified={isVerified(`${prefix}-total`)}
            onSelect={() => onFieldSelect(`${prefix}-total`)} width="40px" />
        </td>
        <td className="border border-[#999] px-0.5 py-0.5" colSpan={5}>
          <div className="flex gap-1">
            <VLInput id={`${prefix}-cargo-heat`} value={formData[`${prefix}-cargo-heat`]?.value || ""}
              onChange={(v) => handleFieldChange(`${prefix}-cargo-heat`, v)}
              isSelected={isSelected(`${prefix}-cargo-heat`)} isEdited={isEdited(`${prefix}-cargo-heat`)} isVerified={isVerified(`${prefix}-cargo-heat`)}
              onSelect={() => onFieldSelect(`${prefix}-cargo-heat`)} width="35px" />
            <VLInput id={`${prefix}-bunker-heat`} value={formData[`${prefix}-bunker-heat`]?.value || ""}
              onChange={(v) => handleFieldChange(`${prefix}-bunker-heat`, v)}
              isSelected={isSelected(`${prefix}-bunker-heat`)} isEdited={isEdited(`${prefix}-bunker-heat`)} isVerified={isVerified(`${prefix}-bunker-heat`)}
              onSelect={() => onFieldSelect(`${prefix}-bunker-heat`)} width="35px" />
            <VLInput id={`${prefix}-tank-clean`} value={formData[`${prefix}-tank-clean`]?.value || ""}
              onChange={(v) => handleFieldChange(`${prefix}-tank-clean`, v)}
              isSelected={isSelected(`${prefix}-tank-clean`)} isEdited={isEdited(`${prefix}-tank-clean`)} isVerified={isVerified(`${prefix}-tank-clean`)}
              onSelect={() => onFieldSelect(`${prefix}-tank-clean`)} width="35px" />
            <VLInput id={`${prefix}-other`} value={formData[`${prefix}-other`]?.value || ""}
              onChange={(v) => handleFieldChange(`${prefix}-other`, v)}
              isSelected={isSelected(`${prefix}-other`)} isEdited={isEdited(`${prefix}-other`)} isVerified={isVerified(`${prefix}-other`)}
              onSelect={() => onFieldSelect(`${prefix}-other`)} width="35px" />
            <VLInput id={`${prefix}-adj`} value={formData[`${prefix}-adj`]?.value || ""}
              onChange={(v) => handleFieldChange(`${prefix}-adj`, v)}
              isSelected={isSelected(`${prefix}-adj`)} isEdited={isEdited(`${prefix}-adj`)} isVerified={isVerified(`${prefix}-adj`)}
              onSelect={() => onFieldSelect(`${prefix}-adj`)} width="35px" />
          </div>
        </td>
      </tr>
    </>
  )
}

// Export component
export function VesLinkForm({ 
  selectedFieldId, 
  onFieldSelect,
  editedFields,
  onFieldEdit,
  verifiedFields = new Set(),
  onFormReady
}: VesLinkFormProps) {
  const [formData, setFormData] = useState(initialFormData)
  
  // Expose getFieldValue to parent component
  const getFieldValue = useCallback((fieldId: string) => {
    return formData[fieldId]?.value || ""
  }, [formData])
  
  // Call onFormReady when form is ready
  useEffect(() => {
    if (onFormReady) {
      onFormReady(getFieldValue)
    }
  }, [onFormReady, getFieldValue])
  
  const handleFieldChange = useCallback((id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: { ...prev[id], value }
    }))
    onFieldEdit(id, value)
  }, [onFieldEdit])
  
  const isSelected = (id: string) => selectedFieldId === id
  const isEdited = (id: string) => editedFields.has(id)
  const isVerifiedField = (id: string) => verifiedFields.has(id)
  const isCritical = (id: string) => CRITICAL_FIELDS_NOON_SEA.includes(id)
  
  return (
    <div className="bg-white font-sans text-[13px]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* VesLink Header */}
      <div className="bg-[#2b3e50] px-4 py-3">
        <div className="text-white text-2xl font-normal tracking-wide">
          <span className="font-light">ves</span><span className="text-[#5bc0de]">link</span>
        </div>
        <div className="text-[#5bc0de] text-xs mt-0.5">maritime data on demand</div>
      </div>
      
      {/* Form Content */}
      <div className="p-4">
        {/* Report Title */}
        <h1 className="text-[#d9831f] text-xl font-normal mb-4">Noon Report Unav 4.0</h1>
        
        {/* Top Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button disabled className="px-3 py-1 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Format for Print
          </button>
          <button disabled className="px-3 py-1 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Save Draft
          </button>
          <button disabled className="px-3 py-1 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Save a Copy
          </button>
          <button disabled className="px-3 py-1 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Submit
          </button>
        </div>
        <p className="text-[11px] text-[#666] italic -mt-4 mb-6">Submission handled by Unframe Transfer Agent</p>
        
        {/* General Information - 2 column grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-4">
          <FormRow label="Vessel Name:" labelWidth="100px">
            <VLInput 
              id="vessel-name" 
              value={formData["vessel-name"].value}
              onChange={(v) => handleFieldChange("vessel-name", v)}
              isSelected={isSelected("vessel-name")}
              isEdited={isEdited("vessel-name")}
              isVerified={isVerifiedField("vessel-name")}
              onSelect={() => onFieldSelect("vessel-name")}
              width="160px"
            />
          </FormRow>
          <FormRow label="Date/Time:" fieldId="date-time" labelWidth="90px" isVerified={verifiedFields.has("date-time")}>
            <VLInput 
              id="date-time" 
              value={formData["date-time"].value}
              onChange={(v) => handleFieldChange("date-time", v)}
              isSelected={isSelected("date-time")}
              isEdited={isEdited("date-time")}
              isVerified={isVerifiedField("date-time")}
              onSelect={() => onFieldSelect("date-time")}
              width="140px"
              isCritical={true}
            />
          </FormRow>
          
          <FormRow label="Latitude:" labelWidth="100px">
            <VLInput 
              id="latitude" 
              value={formData["latitude"].value}
              onChange={(v) => handleFieldChange("latitude", v)}
              isSelected={isSelected("latitude")}
              isEdited={isEdited("latitude")}
              isVerified={isVerifiedField("latitude")}
              onSelect={() => onFieldSelect("latitude")}
              width="140px"
              
            />
          </FormRow>
          <FormRow label="Voyage Number:" fieldId="voyage-number" labelWidth="90px" isVerified={verifiedFields.has("voyage-number")}>
            <VLInput 
              id="voyage-number" 
              value={formData["voyage-number"].value}
              onChange={(v) => handleFieldChange("voyage-number", v)}
              isSelected={isSelected("voyage-number")}
              isEdited={isEdited("voyage-number")}
              isVerified={isVerifiedField("voyage-number")}
              onSelect={() => onFieldSelect("voyage-number")}
              width="100px"
              isCritical={true}
            />
          </FormRow>
          
          <FormRow label="Longitude:" labelWidth="100px">
            <VLInput 
              id="longitude" 
              value={formData["longitude"].value}
              onChange={(v) => handleFieldChange("longitude", v)}
              isSelected={isSelected("longitude")}
              isEdited={isEdited("longitude")}
              isVerified={isVerifiedField("longitude")}
              onSelect={() => onFieldSelect("longitude")}
              width="140px"
            />
          </FormRow>
          <FormRow label="Vessel Condition:" fieldId="vessel-condition" labelWidth="90px" isVerified={verifiedFields.has("vessel-condition")}>
            <VLSelect 
              id="vessel-condition" 
              value={formData["vessel-condition"].value}
              options={formData["vessel-condition"].options || []}
              onChange={(v) => handleFieldChange("vessel-condition", v)}
              isSelected={isSelected("vessel-condition")}
              isEdited={isEdited("vessel-condition")}
              isVerified={isVerifiedField("vessel-condition")}
              onSelect={() => onFieldSelect("vessel-condition")}
              width="120px"
              isCritical={true}
            />
          </FormRow>
          
          <FormRow label="Location:" labelWidth="100px">
            <VLSelect 
              id="location" 
              value={formData["location"].value}
              options={formData["location"].options || []}
              onChange={(v) => handleFieldChange("location", v)}
              isSelected={isSelected("location")}
              isEdited={isEdited("location")}
              isVerified={isVerifiedField("location")}
              onSelect={() => onFieldSelect("location")}
              width="140px"
            />
          </FormRow>
          <div />
        </div>
        
        {/* NEW: Next Port & ETA row */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-4">
          <FormRow label="Next Port:" fieldId="next-port" labelWidth="100px" isVerified={isVerifiedField("next-port")}>
            <VLInput 
              id="next-port" 
              value={formData["next-port"].value}
              onChange={(v) => handleFieldChange("next-port", v)}
              isSelected={isSelected("next-port")}
              isEdited={isEdited("next-port")}
              isVerified={isVerifiedField("next-port")}
              onSelect={() => onFieldSelect("next-port")}
              width="140px"
              isCritical={true}
            />
          </FormRow>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 shrink-0" style={{ width: "90px" }}>
              <CriticalIndicator fieldId="eta" isVerified={isVerifiedField("eta")} />
              <label className="text-[13px] text-[#333] text-right flex-1" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>ETA:</label>
            </div>
            <VLInput 
              id="eta" 
              value={formData["eta-date"].value}
              onChange={(v) => handleFieldChange("eta-date", v)}
              isSelected={isSelected("eta")}
              isEdited={isEdited("eta-date")}
              isVerified={isVerifiedField("eta")}
              onSelect={() => onFieldSelect("eta")}
              width="90px"
              isCritical={true}
            />
            <VLInput 
              id="eta-time" 
              value={formData["eta-time"].value}
              onChange={(v) => handleFieldChange("eta-time", v)}
              isSelected={isSelected("eta")}
              isEdited={isEdited("eta-time")}
              isVerified={isVerifiedField("eta")}
              onSelect={() => onFieldSelect("eta")}
              width="60px"
              isCritical={true}
            />
          </div>
        </div>
        
        {/* Remarks - full width */}
        <div className="mb-6">
          <div className="flex items-start gap-1.5">
            <label className="text-[13px] text-[#333] text-right shrink-0 pt-1" style={{ width: "100px", fontFamily: "Arial, Helvetica, sans-serif" }}>Remarks:</label>
            <div className="relative flex-1">
              <textarea
                id="vl-field-remarks"
                value={formData["remarks"].value}
                onChange={(e) => handleFieldChange("remarks", e.target.value)}
                onClick={() => onFieldSelect("remarks")}
                rows={3}
                className={`
                  w-full px-2 py-1.5 text-[13px] bg-white border border-[#999] resize-y
                  focus:outline-none
                  ${isSelected("remarks") ? "ring-2 ring-[#7c3aed] ring-offset-0" : ""}
                `}
                style={{ fontFamily: "Arial, Helvetica, sans-serif", maxWidth: "500px" }}
              />
              {isEdited("remarks") && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
              )}
            </div>
          </div>
        </div>
        
        {/* Distance and Vessel Section - with NEW fields */}
        <SectionHeader title="Distance and Vessel" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {/* NEW: Distance to Go and CP Ordered Speed */}
            <FormRow label="Distance to Go (nm):" fieldId="distance-to-go" labelWidth="150px" isVerified={isVerifiedField("distance-to-go")}>
              <VLInput id="distance-to-go" value={formData["distance-to-go"].value}
                onChange={(v) => handleFieldChange("distance-to-go", v)}
                isSelected={isSelected("distance-to-go")} isEdited={isEdited("distance-to-go")} isVerified={isVerifiedField("distance-to-go")}
                onSelect={() => onFieldSelect("distance-to-go")} width="100px" isCritical={true} />
            </FormRow>
            <FormRow label="CP / Ordered Speed (kts):" fieldId="cp-ordered-speed" labelWidth="150px" isVerified={isVerifiedField("cp-ordered-speed")}>
              <VLInput id="cp-ordered-speed" value={formData["cp-ordered-speed"].value}
                onChange={(v) => handleFieldChange("cp-ordered-speed", v)}
                isSelected={isSelected("cp-ordered-speed")} isEdited={isEdited("cp-ordered-speed")} isVerified={isVerifiedField("cp-ordered-speed")}
                onSelect={() => onFieldSelect("cp-ordered-speed")} width="100px" isCritical={true} />
            </FormRow>
            
            {/* NEW: Reported Speed */}
            <FormRow label="Reported Speed (kts):" fieldId="reported-speed" labelWidth="150px" isVerified={isVerifiedField("reported-speed")}>
              <VLInput id="reported-speed" value={formData["reported-speed"].value}
                onChange={(v) => handleFieldChange("reported-speed", v)}
                isSelected={isSelected("reported-speed")} isEdited={isEdited("reported-speed")} isVerified={isVerifiedField("reported-speed")}
                onSelect={() => onFieldSelect("reported-speed")} width="100px" isCritical={true} />
            </FormRow>
            <div />
            
            {/* Manual Fill Fields - Observed Distance and Engine Distance */}
            <FormRow label="Observed Distance (nm):" fieldId="observed-distance" labelWidth="150px" isVerified={isVerifiedField("observed-distance")} isManualFill={true}>
              <VLInput id="observed-distance" value={formData["observed-distance"].value}
                onChange={(v) => handleFieldChange("observed-distance", v)}
                isSelected={isSelected("observed-distance")} isEdited={isEdited("observed-distance")} isVerified={isVerifiedField("observed-distance")}
                onSelect={() => onFieldSelect("observed-distance")} width="100px" isManualFill={!isVerifiedField("observed-distance")}
                validate={(v) => {
                  const num = parseFloat(v)
                  if (isNaN(num)) return "Must be a number"
                  if (num < 0) return "Must be >= 0"
                  if (num > 1200) return "Unusually high for noon-to-noon"
                  return null
                }} />
            </FormRow>
            <FormRow label="Engine Distance (nm):" fieldId="engine-distance" labelWidth="150px" isVerified={isVerifiedField("engine-distance")} isManualFill={true}>
              <VLInput id="engine-distance" value={formData["engine-distance"]?.value || ""}
                onChange={(v) => handleFieldChange("engine-distance", v)}
                isSelected={isSelected("engine-distance")} isEdited={isEdited("engine-distance")} isVerified={isVerifiedField("engine-distance")}
                onSelect={() => onFieldSelect("engine-distance")} width="100px" isManualFill={!isVerifiedField("engine-distance")}
                validate={(v) => {
                  const num = parseFloat(v)
                  if (isNaN(num)) return "Must be a number"
                  if (num < 0) return "Must be >= 0"
                  if (num > 1200) return "Unusually high for noon-to-noon"
                  // Cross-field check: compare with observed distance
                  const obsVal = parseFloat(formData["observed-distance"]?.value || "")
                  if (!isNaN(obsVal) && obsVal > 0) {
                    const diff = Math.abs(num - obsVal) / obsVal
                    if (diff > 0.15) return "Diverges >15% from observed — check log"
                  }
                  return null
                }} />
            </FormRow>
            <FormRow label="Ballast (MT):" labelWidth="150px">
              <VLInput id="ballast" value={formData["ballast"].value}
                onChange={(v) => handleFieldChange("ballast", v)}
                isSelected={isSelected("ballast")} isEdited={isEdited("ballast")} isVerified={isVerifiedField("ballast")}
                onSelect={() => onFieldSelect("ballast")} width="100px" />
            </FormRow>
            
            <FormRow label="Time Since Last Report (hrs):" fieldId="time-since-last" labelWidth="150px" isVerified={isVerifiedField("time-since-last")}>
              <VLInput id="time-since-last" value={formData["time-since-last"].value}
                onChange={(v) => handleFieldChange("time-since-last", v)}
                isSelected={isSelected("time-since-last")} isEdited={isEdited("time-since-last")} isVerified={isVerifiedField("time-since-last")}
                onSelect={() => onFieldSelect("time-since-last")} width="100px" isCritical={true} />
            </FormRow>
            <FormRow label="Displacement (t):" labelWidth="150px">
              <VLInput id="displacement" value={formData["displacement"].value}
                onChange={(v) => handleFieldChange("displacement", v)}
                isSelected={isSelected("displacement")} isEdited={isEdited("displacement")} isVerified={isVerifiedField("displacement")}
                onSelect={() => onFieldSelect("displacement")} width="100px" />
            </FormRow>
            
            <FormRow label="Slip %:" labelWidth="150px">
              <VLInput id="slip" value={formData["slip"].value}
                onChange={(v) => handleFieldChange("slip", v)}
                isSelected={isSelected("slip")} isEdited={isEdited("slip")} isVerified={isVerifiedField("slip")}
                onSelect={() => onFieldSelect("slip")} width="100px" />
            </FormRow>
            <FormRow label="Fwd Draft (m):" labelWidth="150px">
              <VLInput id="fwd-draft" value={formData["fwd-draft"].value}
                onChange={(v) => handleFieldChange("fwd-draft", v)}
                isSelected={isSelected("fwd-draft")} isEdited={isEdited("fwd-draft")} isVerified={isVerifiedField("fwd-draft")}
                onSelect={() => onFieldSelect("fwd-draft")} width="100px" />
            </FormRow>
            
            <div />
            <FormRow label="Mid Draft (m):" labelWidth="150px">
              <VLInput id="mid-draft" value={formData["mid-draft"].value}
                onChange={(v) => handleFieldChange("mid-draft", v)}
                isSelected={isSelected("mid-draft")} isEdited={isEdited("mid-draft")} isVerified={isVerifiedField("mid-draft")}
                onSelect={() => onFieldSelect("mid-draft")} width="100px" />
            </FormRow>
            
            <div />
            <FormRow label="Aft Draft (m):" labelWidth="150px">
              <VLInput id="aft-draft" value={formData["aft-draft"].value}
                onChange={(v) => handleFieldChange("aft-draft", v)}
                isSelected={isSelected("aft-draft")} isEdited={isEdited("aft-draft")} isVerified={isVerifiedField("aft-draft")}
                onSelect={() => onFieldSelect("aft-draft")} width="100px" />
            </FormRow>
          </div>
        </div>
        
        {/* Machinery Section - with NEW Main Engine RPM */}
        <SectionHeader title="Machinery" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {/* NEW: Main Engine RPM */}
            <FormRow label="Main Engine RPM:" fieldId="main-engine-rpm" labelWidth="130px" isVerified={isVerifiedField("main-engine-rpm")}>
              <VLInput id="main-engine-rpm" value={formData["main-engine-rpm"].value}
                onChange={(v) => handleFieldChange("main-engine-rpm", v)}
                isSelected={isSelected("main-engine-rpm")} isEdited={isEdited("main-engine-rpm")} isVerified={isVerifiedField("main-engine-rpm")}
                onSelect={() => onFieldSelect("main-engine-rpm")} width="100px" isCritical={true} />
            </FormRow>
            <div />
            
            <FormRow label="Generator 1 KWhrs:" labelWidth="130px">
              <VLInput id="gen1-kwhrs" value={formData["gen1-kwhrs"].value}
                onChange={(v) => handleFieldChange("gen1-kwhrs", v)}
                isSelected={isSelected("gen1-kwhrs")} isEdited={isEdited("gen1-kwhrs")} isVerified={isVerifiedField("gen1-kwhrs")}
                onSelect={() => onFieldSelect("gen1-kwhrs")} width="100px" />
            </FormRow>
            <FormRow label="Generator 1 Hrs:" labelWidth="110px">
              <VLInput id="gen1-hrs" value={formData["gen1-hrs"].value}
                onChange={(v) => handleFieldChange("gen1-hrs", v)}
                isSelected={isSelected("gen1-hrs")} isEdited={isEdited("gen1-hrs")} isVerified={isVerifiedField("gen1-hrs")}
                onSelect={() => onFieldSelect("gen1-hrs")} width="100px" />
            </FormRow>
            
            <FormRow label="Generator 2 KWhrs:" labelWidth="130px">
              <VLInput id="gen2-kwhrs" value={formData["gen2-kwhrs"].value}
                onChange={(v) => handleFieldChange("gen2-kwhrs", v)}
                isSelected={isSelected("gen2-kwhrs")} isEdited={isEdited("gen2-kwhrs")} isVerified={isVerifiedField("gen2-kwhrs")}
                onSelect={() => onFieldSelect("gen2-kwhrs")} width="100px" />
            </FormRow>
            <FormRow label="Generator 2 Hrs:" labelWidth="110px">
              <VLInput id="gen2-hrs" value={formData["gen2-hrs"].value}
                onChange={(v) => handleFieldChange("gen2-hrs", v)}
                isSelected={isSelected("gen2-hrs")} isEdited={isEdited("gen2-hrs")} isVerified={isVerifiedField("gen2-hrs")}
                onSelect={() => onFieldSelect("gen2-hrs")} width="100px" />
            </FormRow>
            
            <FormRow label="Generator 3 KWhrs:" labelWidth="130px">
              <VLInput id="gen3-kwhrs" value={formData["gen3-kwhrs"].value}
                onChange={(v) => handleFieldChange("gen3-kwhrs", v)}
                isSelected={isSelected("gen3-kwhrs")} isEdited={isEdited("gen3-kwhrs")} isVerified={isVerifiedField("gen3-kwhrs")}
                onSelect={() => onFieldSelect("gen3-kwhrs")} width="100px" />
            </FormRow>
            <FormRow label="Generator 3 Hrs:" labelWidth="110px">
              <VLInput id="gen3-hrs" value={formData["gen3-hrs"].value}
                onChange={(v) => handleFieldChange("gen3-hrs", v)}
                isSelected={isSelected("gen3-hrs")} isEdited={isEdited("gen3-hrs")} isVerified={isVerifiedField("gen3-hrs")}
                onSelect={() => onFieldSelect("gen3-hrs")} width="100px" />
            </FormRow>
            
            <div />
            <FormRow label="Boiler Hours:" labelWidth="110px">
              <VLInput id="boiler-hrs" value={formData["boiler-hrs"].value}
                onChange={(v) => handleFieldChange("boiler-hrs", v)}
                isSelected={isSelected("boiler-hrs")} isEdited={isEdited("boiler-hrs")} isVerified={isVerifiedField("boiler-hrs")}
                onSelect={() => onFieldSelect("boiler-hrs")} width="100px" />
            </FormRow>
          </div>
        </div>
        
        {/* Weather Section */}
        <SectionHeader title="Weather" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            <FormRow label="Beaufort:" fieldId="beaufort" labelWidth="130px" isVerified={isVerifiedField("beaufort")}>
              <VLSelect id="beaufort" value={formData["beaufort"].value}
                options={formData["beaufort"].options || []}
                onChange={(v) => handleFieldChange("beaufort", v)}
                isSelected={isSelected("beaufort")} isEdited={isEdited("beaufort")} isVerified={isVerifiedField("beaufort")}
                onSelect={() => onFieldSelect("beaufort")} width="100px" isCritical={true} />
            </FormRow>
            <FormRow label="Wind Direction (deg):" labelWidth="130px">
              <VLSelect id="wind-direction" value={formData["wind-direction"].value}
                options={formData["wind-direction"].options || []}
                onChange={(v) => handleFieldChange("wind-direction", v)}
                isSelected={isSelected("wind-direction")} isEdited={isEdited("wind-direction")} isVerified={isVerifiedField("wind-direction")}
                onSelect={() => onFieldSelect("wind-direction")} width="100px" />
            </FormRow>
            
            <FormRow label="Sea State:" fieldId="sea-state" labelWidth="130px" isVerified={isVerifiedField("sea-state")} isManualFill={true}>
              <VLSelect id="sea-state" value={formData["sea-state"].value}
                options={formData["sea-state"].options || []}
                onChange={(v) => handleFieldChange("sea-state", v)}
                isSelected={isSelected("sea-state")} isEdited={isEdited("sea-state")} isVerified={isVerifiedField("sea-state")}
                onSelect={() => onFieldSelect("sea-state")} width="160px" isManualFill={!isVerifiedField("sea-state")}
                validate={(v) => {
                  if (!v || v === "Select...") return "Selection required"
                  return null
                }} />
            </FormRow>
            <FormRow label="Sea Height:" labelWidth="130px">
              <VLInput id="sea-height" value={formData["sea-height"].value}
                onChange={(v) => handleFieldChange("sea-height", v)}
                isSelected={isSelected("sea-height")} isEdited={isEdited("sea-height")} isVerified={isVerifiedField("sea-height")}
                onSelect={() => onFieldSelect("sea-height")} width="100px" />
            </FormRow>
            
            <div />
            <FormRow label="Sea Temperature (deg C):" labelWidth="130px">
              <VLInput id="sea-temp" value={formData["sea-temp"].value}
                onChange={(v) => handleFieldChange("sea-temp", v)}
                isSelected={isSelected("sea-temp")} isEdited={isEdited("sea-temp")} isVerified={isVerifiedField("sea-temp")}
                onSelect={() => onFieldSelect("sea-temp")} width="100px" />
            </FormRow>
          </div>
        </div>
        
        {/* Bunkers Section - with critical indicator on section header */}
        <BunkerSectionHeader 
          title="Bunkers" 
          fieldId="bunkers-section" 
          isVerified={isVerifiedField("bunkers-section")}
          isSelected={isSelected("bunkers-section")}
          onSelect={() => onFieldSelect("bunkers-section")}
        />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="mb-3">
            <FormRow label="Measurement method:" labelWidth="130px">
              <VLSelect id="measurement-method" value={formData["measurement-method"].value}
                options={formData["measurement-method"].options || []}
                onChange={(v) => handleFieldChange("measurement-method", v)}
                isSelected={isSelected("measurement-method")} isEdited={isEdited("measurement-method")} isVerified={isVerifiedField("measurement-method")}
                onSelect={() => onFieldSelect("measurement-method")} width="140px" />
            </FormRow>
          </div>
          
          <p className="text-[12px] text-[#666] mb-2">Bunkers ROB:</p>
          
          <BunkerTable
            formData={formData}
            isSelected={isSelected}
            isEdited={isEdited}
            isVerified={isVerifiedField}
            onFieldSelect={onFieldSelect}
            handleFieldChange={handleFieldChange}
          />
        </div>
        
        {/* Water Section */}
        <SectionHeader title="Water" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            <FormRow label="Fresh Water ROB (MT):" fieldId="fresh-water-rob" labelWidth="160px" isVerified={isVerifiedField("fresh-water-rob")}>
              <VLInput id="fresh-water-rob" value={formData["fresh-water-rob"].value}
                onChange={(v) => handleFieldChange("fresh-water-rob", v)}
                isSelected={isSelected("fresh-water-rob")} isEdited={isEdited("fresh-water-rob")} isVerified={isVerifiedField("fresh-water-rob")}
                onSelect={() => onFieldSelect("fresh-water-rob")} width="100px" isCritical={true} />
            </FormRow>
            <FormRow label="Slops ROB (MT):" fieldId="slops-rob" labelWidth="160px" isVerified={isVerifiedField("slops-rob")}>
              <VLInput id="slops-rob" value={formData["slops-rob"].value}
                onChange={(v) => handleFieldChange("slops-rob", v)}
                isSelected={isSelected("slops-rob")} isEdited={isEdited("slops-rob")} isVerified={isVerifiedField("slops-rob")}
                onSelect={() => onFieldSelect("slops-rob")} width="100px" isCritical={true} />
            </FormRow>
            
            <FormRow label="Distilled Water ROB (MT):" fieldId="distilled-water-rob" labelWidth="160px" isVerified={isVerifiedField("distilled-water-rob")}>
              <VLInput id="distilled-water-rob" value={formData["distilled-water-rob"].value}
                onChange={(v) => handleFieldChange("distilled-water-rob", v)}
                isSelected={isSelected("distilled-water-rob")} isEdited={isEdited("distilled-water-rob")} isVerified={isVerifiedField("distilled-water-rob")}
                onSelect={() => onFieldSelect("distilled-water-rob")} width="100px" isCritical={true} />
            </FormRow>
            <FormRow label="Tank Cleaning Chemical ROB (LTRS):" labelWidth="160px">
              <VLInput id="tank-clean-chem" value={formData["tank-clean-chem"].value}
                onChange={(v) => handleFieldChange("tank-clean-chem", v)}
                isSelected={isSelected("tank-clean-chem")} isEdited={isEdited("tank-clean-chem")} isVerified={isVerifiedField("tank-clean-chem")}
                onSelect={() => onFieldSelect("tank-clean-chem")} width="100px" />
            </FormRow>
            
            <FormRow label="Distilled Water Consumed (MT):" labelWidth="160px">
              <VLInput id="distilled-consumed" value={formData["distilled-consumed"].value}
                onChange={(v) => handleFieldChange("distilled-consumed", v)}
                isSelected={isSelected("distilled-consumed")} isEdited={isEdited("distilled-consumed")} isVerified={isVerifiedField("distilled-consumed")}
                onSelect={() => onFieldSelect("distilled-consumed")} width="100px" />
            </FormRow>
            <FormRow label="Distilled Water Produced (MT):" labelWidth="160px">
              <VLInput id="distilled-produced" value={formData["distilled-produced"].value}
                onChange={(v) => handleFieldChange("distilled-produced", v)}
                isSelected={isSelected("distilled-produced")} isEdited={isEdited("distilled-produced")} isVerified={isVerifiedField("distilled-produced")}
                onSelect={() => onFieldSelect("distilled-produced")} width="100px" />
            </FormRow>
            
            <FormRow label="Fresh Water Consumed (MT):" labelWidth="160px">
              <VLInput id="fresh-consumed" value={formData["fresh-consumed"].value}
                onChange={(v) => handleFieldChange("fresh-consumed", v)}
                isSelected={isSelected("fresh-consumed")} isEdited={isEdited("fresh-consumed")} isVerified={isVerifiedField("fresh-consumed")}
                onSelect={() => onFieldSelect("fresh-consumed")} width="100px" />
            </FormRow>
            <FormRow label="Fresh Water Produced (MT):" labelWidth="160px">
              <VLInput id="fresh-produced" value={formData["fresh-produced"].value}
                onChange={(v) => handleFieldChange("fresh-produced", v)}
                isSelected={isSelected("fresh-produced")} isEdited={isEdited("fresh-produced")} isVerified={isVerifiedField("fresh-produced")}
                onSelect={() => onFieldSelect("fresh-produced")} width="100px" />
            </FormRow>
          </div>
        </div>
        
        {/* Master's Name Section */}
        <div className="bg-[#fffbeb] border-l-4 border-[#f59e0b] p-3 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-semibold text-[#92400e]">Master&apos;s Name</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px]">First:</span>
              <VLInput id="master-first" value={formData["master-first"].value}
                onChange={(v) => handleFieldChange("master-first", v)}
                isSelected={isSelected("master-first")} isEdited={isEdited("master-first")} isVerified={isVerifiedField("master-first")}
                onSelect={() => onFieldSelect("master-first")} width="120px" />
              <span className="text-[13px]">Last:</span>
              <VLInput id="master-last" value={formData["master-last"].value}
                onChange={(v) => handleFieldChange("master-last", v)}
                isSelected={isSelected("master-last")} isEdited={isEdited("master-last")} isVerified={isVerifiedField("master-last")}
                onSelect={() => onFieldSelect("master-last")} width="120px" />
            </div>
          </div>
        </div>
        
        {/* Bottom Action Buttons */}
        <div className="flex justify-center gap-2 mt-6">
          <button disabled className="px-4 py-1.5 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Format for Print
          </button>
          <button disabled className="px-4 py-1.5 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Save Draft
          </button>
          <button disabled className="px-4 py-1.5 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Save a Copy
          </button>
          <button disabled className="px-4 py-1.5 text-[12px] border border-[#999] bg-[#f5f5f5] text-[#999] cursor-not-allowed">
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
