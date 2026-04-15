"use client"

import { useState, useCallback } from "react"

interface VesLinkFormProps {
  selectedFieldId: string | null
  onFieldSelect: (fieldId: string) => void
  editedFields: Set<string>
  onFieldEdit: (fieldId: string, value: string) => void
}

// Form field data structure
interface FieldData {
  id: string
  value: string
  type: "text" | "select" | "textarea"
  options?: string[]
}

// Initial form values matching real VesLink structure
const initialFormData: Record<string, FieldData> = {
  // General Information
  "vessel-name": { id: "vessel-name", value: "SEAWAYS SKOPELOS", type: "text" },
  "date": { id: "date", value: "14/04/2026", type: "text" },
  "time": { id: "time", value: "12:00", type: "text" },
  "time-period": { id: "time-period", value: "PM", type: "select", options: ["AM", "PM"] },
  "latitude": { id: "latitude", value: "35 42' 00\" N", type: "text" },
  "voyage-number": { id: "voyage-number", value: "124", type: "text" },
  "longitude": { id: "longitude", value: "014 25' 00\" E", type: "text" },
  "vessel-condition": { id: "vessel-condition", value: "Laden", type: "select", options: ["Select...", "Laden", "Ballast", "Part Laden"] },
  "location": { id: "location", value: "At Sea", type: "select", options: ["Select...", "At Sea", "In Port", "At Anchor", "Drifting"] },
  "remarks": { id: "remarks", value: "Vessel proceeding to next port as per orders.", type: "textarea" },
  
  // Distance and Vessel
  "ballast": { id: "ballast", value: "1896", type: "text" },
  "displacement": { id: "displacement", value: "172000", type: "text" },
  "observed-distance": { id: "observed-distance", value: "142.3", type: "text" },
  "fwd-draft": { id: "fwd-draft", value: "16.6", type: "text" },
  "slip": { id: "slip", value: "0.35", type: "text" },
  "mid-draft": { id: "mid-draft", value: "16.6", type: "text" },
  "time-since-last": { id: "time-since-last", value: "24.0", type: "text" },
  "aft-draft": { id: "aft-draft", value: "16.6", type: "text" },
  
  // Machinery
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
  "sea-state": { id: "sea-state", value: "Moderate", type: "select", options: ["Select...", "Calm", "Slight", "Moderate", "Rough", "Very Rough", "High", "Very High", "Phenomenal"] },
  "sea-height": { id: "sea-height", value: "1.5", type: "text" },
  "sea-temp": { id: "sea-temp", value: "18.2", type: "text" },
  
  // Bunkers - Measurement Method
  "measurement-method": { id: "measurement-method", value: "Select...", type: "select", options: ["Select...", "Sounding", "Flow Meter", "BDN"] },
  
  // Bunkers ROB and Consumption - IFO
  "ifo-rob": { id: "ifo-rob", value: "1520", type: "text" },
  "ifo-main": { id: "ifo-main", value: "", type: "text" },
  "ifo-aux": { id: "ifo-aux", value: "", type: "text" },
  "ifo-total": { id: "ifo-total", value: "", type: "text" },
  "ifo-prop": { id: "ifo-prop", value: "", type: "text" },
  "ifo-gen": { id: "ifo-gen", value: "", type: "text" },
  "ifo-disch": { id: "ifo-disch", value: "", type: "text" },
  "ifo-loading": { id: "ifo-loading", value: "", type: "text" },
  "ifo-igs": { id: "ifo-igs", value: "", type: "text" },
  "ifo-cargo-heat": { id: "ifo-cargo-heat", value: "", type: "text" },
  "ifo-bunker-heat": { id: "ifo-bunker-heat", value: "", type: "text" },
  "ifo-tank-clean": { id: "ifo-tank-clean", value: "", type: "text" },
  "ifo-other": { id: "ifo-other", value: "", type: "text" },
  "ifo-adj": { id: "ifo-adj", value: "", type: "text" },
  
  // Bunkers ROB and Consumption - MGO
  "mgo-rob": { id: "mgo-rob", value: "89", type: "text" },
  "mgo-main": { id: "mgo-main", value: "", type: "text" },
  "mgo-aux": { id: "mgo-aux", value: "", type: "text" },
  "mgo-total": { id: "mgo-total", value: "", type: "text" },
  "mgo-prop": { id: "mgo-prop", value: "", type: "text" },
  "mgo-gen": { id: "mgo-gen", value: "", type: "text" },
  "mgo-disch": { id: "mgo-disch", value: "", type: "text" },
  "mgo-loading": { id: "mgo-loading", value: "", type: "text" },
  "mgo-igs": { id: "mgo-igs", value: "", type: "text" },
  "mgo-cargo-heat": { id: "mgo-cargo-heat", value: "", type: "text" },
  "mgo-bunker-heat": { id: "mgo-bunker-heat", value: "", type: "text" },
  "mgo-tank-clean": { id: "mgo-tank-clean", value: "", type: "text" },
  "mgo-other": { id: "mgo-other", value: "", type: "text" },
  "mgo-adj": { id: "mgo-adj", value: "", type: "text" },
  
  // Bunkers ROB and Consumption - LSF
  "lsf-rob": { id: "lsf-rob", value: "0", type: "text" },
  "lsf-main": { id: "lsf-main", value: "", type: "text" },
  "lsf-aux": { id: "lsf-aux", value: "", type: "text" },
  "lsf-total": { id: "lsf-total", value: "", type: "text" },
  "lsf-prop": { id: "lsf-prop", value: "", type: "text" },
  "lsf-gen": { id: "lsf-gen", value: "", type: "text" },
  "lsf-disch": { id: "lsf-disch", value: "", type: "text" },
  "lsf-loading": { id: "lsf-loading", value: "", type: "text" },
  "lsf-igs": { id: "lsf-igs", value: "", type: "text" },
  "lsf-cargo-heat": { id: "lsf-cargo-heat", value: "", type: "text" },
  "lsf-bunker-heat": { id: "lsf-bunker-heat", value: "", type: "text" },
  "lsf-tank-clean": { id: "lsf-tank-clean", value: "", type: "text" },
  "lsf-other": { id: "lsf-other", value: "", type: "text" },
  "lsf-adj": { id: "lsf-adj", value: "", type: "text" },
  
  // Bunkers ROB and Consumption - LSMGO
  "lsmgo-rob": { id: "lsmgo-rob", value: "245", type: "text" },
  "lsmgo-main": { id: "lsmgo-main", value: "3.22", type: "text" },
  "lsmgo-aux": { id: "lsmgo-aux", value: "0.58", type: "text" },
  "lsmgo-total": { id: "lsmgo-total", value: "3.80", type: "text" },
  "lsmgo-prop": { id: "lsmgo-prop", value: "", type: "text" },
  "lsmgo-gen": { id: "lsmgo-gen", value: "", type: "text" },
  "lsmgo-disch": { id: "lsmgo-disch", value: "", type: "text" },
  "lsmgo-loading": { id: "lsmgo-loading", value: "", type: "text" },
  "lsmgo-igs": { id: "lsmgo-igs", value: "", type: "text" },
  "lsmgo-cargo-heat": { id: "lsmgo-cargo-heat", value: "", type: "text" },
  "lsmgo-bunker-heat": { id: "lsmgo-bunker-heat", value: "", type: "text" },
  "lsmgo-tank-clean": { id: "lsmgo-tank-clean", value: "", type: "text" },
  "lsmgo-other": { id: "lsmgo-other", value: "", type: "text" },
  "lsmgo-adj": { id: "lsmgo-adj", value: "", type: "text" },
  
  // Water
  "fresh-water-rob": { id: "fresh-water-rob", value: "509", type: "text" },
  "slops-rob": { id: "slops-rob", value: "0", type: "text" },
  "destilled-water-rob": { id: "destilled-water-rob", value: "0", type: "text" },
  "tank-clean-chem": { id: "tank-clean-chem", value: "0", type: "text" },
  "distilled-consumed": { id: "distilled-consumed", value: "0", type: "text" },
  "distilled-produced": { id: "distilled-produced", value: "0", type: "text" },
  "fresh-consumed": { id: "fresh-consumed", value: "12", type: "text" },
  "fresh-produced": { id: "fresh-produced", value: "0", type: "text" },
  
  // Master's Name
  "master-first": { id: "master-first", value: "JUDE LEVI", type: "text" },
  "master-last": { id: "master-last", value: "FIGUEIREDO", type: "text" },
}

// Reusable input component that matches VesLink styling
function VLInput({ 
  id, 
  value, 
  onChange, 
  isSelected, 
  isEdited,
  onSelect,
  width = "auto",
  className = ""
}: { 
  id: string
  value: string
  onChange: (value: string) => void
  isSelected: boolean
  isEdited: boolean
  onSelect: () => void
  width?: string
  className?: string
}) {
  return (
    <div className="relative inline-block" style={{ width }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={onSelect}
        className={`
          w-full h-6 px-1.5 text-[13px] bg-white border border-[#999]
          focus:outline-none
          ${isSelected ? "ring-2 ring-[#7c3aed] ring-offset-0" : ""}
          ${className}
        `}
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      />
      {isEdited && (
        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
      )}
    </div>
  )
}

// Reusable select component
function VLSelect({ 
  id, 
  value, 
  options,
  onChange, 
  isSelected, 
  isEdited,
  onSelect,
  width = "auto"
}: { 
  id: string
  value: string
  options: string[]
  onChange: (value: string) => void
  isSelected: boolean
  isEdited: boolean
  onSelect: () => void
  width?: string
}) {
  return (
    <div className="relative inline-block" style={{ width }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={onSelect}
        className={`
          w-full h-6 px-1 text-[13px] bg-white border border-[#999]
          focus:outline-none appearance-none cursor-pointer
          ${isSelected ? "ring-2 ring-[#7c3aed] ring-offset-0" : ""}
        `}
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
      {isEdited && (
        <div className="absolute top-0.5 right-4 w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
      )}
    </div>
  )
}

// Section header badge (orange)
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#2b5797] text-white text-[13px] font-bold px-2.5 py-1 rounded-sm inline-block mb-2">
      {title}
    </div>
  )
}

// Form row with label and input
function FormRow({ 
  label, 
  children,
  labelWidth = "auto"
}: { 
  label: string
  children: React.ReactNode
  labelWidth?: string
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label 
        className="text-[13px] text-[#333] text-right shrink-0"
        style={{ width: labelWidth, fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export function VesLinkForm({ 
  selectedFieldId, 
  onFieldSelect,
  editedFields,
  onFieldEdit 
}: VesLinkFormProps) {
  const [formData, setFormData] = useState(initialFormData)
  
  const handleFieldChange = useCallback((id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: { ...prev[id], value }
    }))
    onFieldEdit(id, value)
  }, [onFieldEdit])
  
  const isSelected = (id: string) => selectedFieldId === id
  const isEdited = (id: string) => editedFields.has(id)
  
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
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-6">
          <FormRow label="Vessel Name:" labelWidth="100px">
            <VLInput 
              id="vessel-name" 
              value={formData["vessel-name"].value}
              onChange={(v) => handleFieldChange("vessel-name", v)}
              isSelected={isSelected("vessel-name")}
              isEdited={isEdited("vessel-name")}
              onSelect={() => onFieldSelect("vessel-name")}
              width="160px"
            />
          </FormRow>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] text-[#333] text-right shrink-0" style={{ width: "70px" }}>Date/Time :</label>
            <VLInput 
              id="date" 
              value={formData["date"].value}
              onChange={(v) => handleFieldChange("date", v)}
              isSelected={isSelected("date")}
              isEdited={isEdited("date")}
              onSelect={() => onFieldSelect("date")}
              width="90px"
            />
            <VLInput 
              id="time" 
              value={formData["time"].value}
              onChange={(v) => handleFieldChange("time", v)}
              isSelected={isSelected("time")}
              isEdited={isEdited("time")}
              onSelect={() => onFieldSelect("time")}
              width="50px"
            />
            <VLSelect 
              id="time-period" 
              value={formData["time-period"].value}
              options={formData["time-period"].options || []}
              onChange={(v) => handleFieldChange("time-period", v)}
              isSelected={isSelected("time-period")}
              isEdited={isEdited("time-period")}
              onSelect={() => onFieldSelect("time-period")}
              width="55px"
            />
          </div>
          
          <FormRow label="Latitude:" labelWidth="100px">
            <VLInput 
              id="latitude" 
              value={formData["latitude"].value}
              onChange={(v) => handleFieldChange("latitude", v)}
              isSelected={isSelected("latitude")}
              isEdited={isEdited("latitude")}
              onSelect={() => onFieldSelect("latitude")}
              width="140px"
            />
          </FormRow>
          <FormRow label="Voyage Number:" labelWidth="70px">
            <VLInput 
              id="voyage-number" 
              value={formData["voyage-number"].value}
              onChange={(v) => handleFieldChange("voyage-number", v)}
              isSelected={isSelected("voyage-number")}
              isEdited={isEdited("voyage-number")}
              onSelect={() => onFieldSelect("voyage-number")}
              width="100px"
            />
          </FormRow>
          
          <FormRow label="Longitude:" labelWidth="100px">
            <VLInput 
              id="longitude" 
              value={formData["longitude"].value}
              onChange={(v) => handleFieldChange("longitude", v)}
              isSelected={isSelected("longitude")}
              isEdited={isEdited("longitude")}
              onSelect={() => onFieldSelect("longitude")}
              width="140px"
            />
          </FormRow>
          <FormRow label="Vessel Condition:" labelWidth="70px">
            <VLSelect 
              id="vessel-condition" 
              value={formData["vessel-condition"].value}
              options={formData["vessel-condition"].options || []}
              onChange={(v) => handleFieldChange("vessel-condition", v)}
              isSelected={isSelected("vessel-condition")}
              isEdited={isEdited("vessel-condition")}
              onSelect={() => onFieldSelect("vessel-condition")}
              width="120px"
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
              onSelect={() => onFieldSelect("location")}
              width="140px"
            />
          </FormRow>
          <div />
        </div>
        
        {/* Remarks - full width */}
        <div className="mb-6">
          <div className="flex items-start gap-1.5">
            <label className="text-[13px] text-[#333] text-right shrink-0 pt-1" style={{ width: "100px" }}>Remarks:</label>
            <div className="relative flex-1">
              <textarea
                value={formData["remarks"].value}
                onChange={(e) => handleFieldChange("remarks", e.target.value)}
                onClick={() => onFieldSelect("remarks")}
                rows={4}
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
        
        {/* Distance and Vessel Section */}
        <SectionHeader title="Distance and Vessel" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            <FormRow label="Ballast (MT):" labelWidth="150px">
              <VLInput id="ballast" value={formData["ballast"].value}
                onChange={(v) => handleFieldChange("ballast", v)}
                isSelected={isSelected("ballast")} isEdited={isEdited("ballast")}
                onSelect={() => onFieldSelect("ballast")} width="100px" />
            </FormRow>
            <FormRow label="Displacement (t):" labelWidth="130px">
              <VLInput id="displacement" value={formData["displacement"].value}
                onChange={(v) => handleFieldChange("displacement", v)}
                isSelected={isSelected("displacement")} isEdited={isEdited("displacement")}
                onSelect={() => onFieldSelect("displacement")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
            
            <FormRow label="Observed Distance (nm):" labelWidth="150px">
              <VLInput id="observed-distance" value={formData["observed-distance"].value}
                onChange={(v) => handleFieldChange("observed-distance", v)}
                isSelected={isSelected("observed-distance")} isEdited={isEdited("observed-distance")}
                onSelect={() => onFieldSelect("observed-distance")} width="100px" />
            </FormRow>
            <FormRow label="Fwd Draft (m):" labelWidth="130px">
              <VLInput id="fwd-draft" value={formData["fwd-draft"].value}
                onChange={(v) => handleFieldChange("fwd-draft", v)}
                isSelected={isSelected("fwd-draft")} isEdited={isEdited("fwd-draft")}
                onSelect={() => onFieldSelect("fwd-draft")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
            
            <FormRow label="Slip %:" labelWidth="150px">
              <VLInput id="slip" value={formData["slip"].value}
                onChange={(v) => handleFieldChange("slip", v)}
                isSelected={isSelected("slip")} isEdited={isEdited("slip")}
                onSelect={() => onFieldSelect("slip")} width="100px" />
            </FormRow>
            <FormRow label="Mid Draft (m):" labelWidth="130px">
              <VLInput id="mid-draft" value={formData["mid-draft"].value}
                onChange={(v) => handleFieldChange("mid-draft", v)}
                isSelected={isSelected("mid-draft")} isEdited={isEdited("mid-draft")}
                onSelect={() => onFieldSelect("mid-draft")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
            
            <FormRow label="Time Since Last Report (hrs):" labelWidth="150px">
              <VLInput id="time-since-last" value={formData["time-since-last"].value}
                onChange={(v) => handleFieldChange("time-since-last", v)}
                isSelected={isSelected("time-since-last")} isEdited={isEdited("time-since-last")}
                onSelect={() => onFieldSelect("time-since-last")} width="100px" />
            </FormRow>
            <FormRow label="Aft Draft (m):" labelWidth="130px">
              <VLInput id="aft-draft" value={formData["aft-draft"].value}
                onChange={(v) => handleFieldChange("aft-draft", v)}
                isSelected={isSelected("aft-draft")} isEdited={isEdited("aft-draft")}
                onSelect={() => onFieldSelect("aft-draft")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
          </div>
        </div>
        
        {/* Machinery Section */}
        <SectionHeader title="Machinery" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            <FormRow label="Generator 1 KWhrs:" labelWidth="130px">
              <VLInput id="gen1-kwhrs" value={formData["gen1-kwhrs"].value}
                onChange={(v) => handleFieldChange("gen1-kwhrs", v)}
                isSelected={isSelected("gen1-kwhrs")} isEdited={isEdited("gen1-kwhrs")}
                onSelect={() => onFieldSelect("gen1-kwhrs")} width="100px" />
            </FormRow>
            <FormRow label="Generator 1 Hrs:" labelWidth="110px">
              <VLInput id="gen1-hrs" value={formData["gen1-hrs"].value}
                onChange={(v) => handleFieldChange("gen1-hrs", v)}
                isSelected={isSelected("gen1-hrs")} isEdited={isEdited("gen1-hrs")}
                onSelect={() => onFieldSelect("gen1-hrs")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
            
            <FormRow label="Generator 2 KWhrs:" labelWidth="130px">
              <VLInput id="gen2-kwhrs" value={formData["gen2-kwhrs"].value}
                onChange={(v) => handleFieldChange("gen2-kwhrs", v)}
                isSelected={isSelected("gen2-kwhrs")} isEdited={isEdited("gen2-kwhrs")}
                onSelect={() => onFieldSelect("gen2-kwhrs")} width="100px" />
            </FormRow>
            <FormRow label="Generator 2 Hrs:" labelWidth="110px">
              <VLInput id="gen2-hrs" value={formData["gen2-hrs"].value}
                onChange={(v) => handleFieldChange("gen2-hrs", v)}
                isSelected={isSelected("gen2-hrs")} isEdited={isEdited("gen2-hrs")}
                onSelect={() => onFieldSelect("gen2-hrs")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
            
            <FormRow label="Generator 3 KWhrs:" labelWidth="130px">
              <VLInput id="gen3-kwhrs" value={formData["gen3-kwhrs"].value}
                onChange={(v) => handleFieldChange("gen3-kwhrs", v)}
                isSelected={isSelected("gen3-kwhrs")} isEdited={isEdited("gen3-kwhrs")}
                onSelect={() => onFieldSelect("gen3-kwhrs")} width="100px" />
            </FormRow>
            <FormRow label="Generator 3 Hrs:" labelWidth="110px">
              <VLInput id="gen3-hrs" value={formData["gen3-hrs"].value}
                onChange={(v) => handleFieldChange("gen3-hrs", v)}
                isSelected={isSelected("gen3-hrs")} isEdited={isEdited("gen3-hrs")}
                onSelect={() => onFieldSelect("gen3-hrs")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
            
            <div />
            <FormRow label="Boiler Hours:" labelWidth="110px">
              <VLInput id="boiler-hrs" value={formData["boiler-hrs"].value}
                onChange={(v) => handleFieldChange("boiler-hrs", v)}
                isSelected={isSelected("boiler-hrs")} isEdited={isEdited("boiler-hrs")}
                onSelect={() => onFieldSelect("boiler-hrs")} width="100px"
                className="border-[#f97316]" />
            </FormRow>
          </div>
        </div>
        
        {/* Weather Section */}
        <SectionHeader title="Weather" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            <FormRow label="Beaufort:" labelWidth="100px">
              <VLSelect id="beaufort" value={formData["beaufort"].value}
                options={formData["beaufort"].options || []}
                onChange={(v) => handleFieldChange("beaufort", v)}
                isSelected={isSelected("beaufort")} isEdited={isEdited("beaufort")}
                onSelect={() => onFieldSelect("beaufort")} width="120px" />
            </FormRow>
            <FormRow label="Wind Direction (deg):" labelWidth="130px">
              <VLSelect id="wind-direction" value={formData["wind-direction"].value}
                options={formData["wind-direction"].options || []}
                onChange={(v) => handleFieldChange("wind-direction", v)}
                isSelected={isSelected("wind-direction")} isEdited={isEdited("wind-direction")}
                onSelect={() => onFieldSelect("wind-direction")} width="140px" />
            </FormRow>
            
            <FormRow label="Sea State:" labelWidth="100px">
              <VLSelect id="sea-state" value={formData["sea-state"].value}
                options={formData["sea-state"].options || []}
                onChange={(v) => handleFieldChange("sea-state", v)}
                isSelected={isSelected("sea-state")} isEdited={isEdited("sea-state")}
                onSelect={() => onFieldSelect("sea-state")} width="120px" />
            </FormRow>
            <FormRow label="Sea Height:" labelWidth="130px">
              <VLInput id="sea-height" value={formData["sea-height"].value}
                onChange={(v) => handleFieldChange("sea-height", v)}
                isSelected={isSelected("sea-height")} isEdited={isEdited("sea-height")}
                onSelect={() => onFieldSelect("sea-height")} width="100px" />
            </FormRow>
            
            <div />
            <FormRow label="Sea Temperature (deg C):" labelWidth="130px">
              <VLInput id="sea-temp" value={formData["sea-temp"].value}
                onChange={(v) => handleFieldChange("sea-temp", v)}
                isSelected={isSelected("sea-temp")} isEdited={isEdited("sea-temp")}
                onSelect={() => onFieldSelect("sea-temp")} width="100px" />
            </FormRow>
          </div>
        </div>
        
        {/* Bunkers Section */}
        <SectionHeader title="Bunkers" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="mb-3">
            <FormRow label="Measurement method:" labelWidth="130px">
              <VLSelect id="measurement-method" value={formData["measurement-method"].value}
                options={formData["measurement-method"].options || []}
                onChange={(v) => handleFieldChange("measurement-method", v)}
                isSelected={isSelected("measurement-method")} isEdited={isEdited("measurement-method")}
                onSelect={() => onFieldSelect("measurement-method")} width="140px" />
            </FormRow>
          </div>
          
          <div className="text-[12px] font-medium text-[#333] mb-1.5">Bunkers ROB:</div>
          
          {/* Bunkers Table */}
          <div className="overflow-x-auto">
            <table className="text-[11px] border-collapse" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              <thead>
                <tr className="bg-[#5a7a9a] text-white">
                  <th className="border border-[#999] px-1.5 py-1 text-left font-normal" rowSpan={2}>Type<br/>(Unit)</th>
                  <th className="border border-[#999] px-1.5 py-1 text-center font-normal" rowSpan={2}>ROB<br/>8/23/2024 21:53</th>
                  <th className="border border-[#999] px-1.5 py-1 text-center font-normal" colSpan={3}>Consumption</th>
                  <th className="border border-[#999] px-1.5 py-1 text-center font-normal" colSpan={6}>Used For</th>
                </tr>
                <tr className="bg-[#5a7a9a] text-white">
                  <th className="border border-[#999] px-1 py-0.5 text-center font-normal text-[10px]">Eng Breakdown</th>
                  <th className="border border-[#999] px-1 py-0.5 text-center font-normal text-[10px]">Propulsion (ME)</th>
                  <th className="border border-[#999] px-1 py-0.5 text-center font-normal text-[10px]">Generator (aux)</th>
                  <th className="border border-[#999] px-1 py-0.5 text-center font-normal text-[10px]">Disch. Pumps</th>
                  <th className="border border-[#999] px-1 py-0.5 text-center font-normal text-[10px]">Loading</th>
                  <th className="border border-[#999] px-1 py-0.5 text-center font-normal text-[10px]">IGS</th>
                </tr>
              </thead>
              <tbody>
                {/* IFO Rows */}
                <BunkerFuelRows 
                  fuelType="IFO" 
                  unit="MT"
                  formData={formData}
                  prefix="ifo"
                  isSelected={isSelected}
                  isEdited={isEdited}
                  onFieldSelect={onFieldSelect}
                  handleFieldChange={handleFieldChange}
                />
                {/* MGO Rows */}
                <BunkerFuelRows 
                  fuelType="MGO" 
                  unit="MT"
                  formData={formData}
                  prefix="mgo"
                  isSelected={isSelected}
                  isEdited={isEdited}
                  onFieldSelect={onFieldSelect}
                  handleFieldChange={handleFieldChange}
                />
                {/* LSF Rows */}
                <BunkerFuelRows 
                  fuelType="LSF" 
                  unit="MT"
                  formData={formData}
                  prefix="lsf"
                  isSelected={isSelected}
                  isEdited={isEdited}
                  onFieldSelect={onFieldSelect}
                  handleFieldChange={handleFieldChange}
                />
                {/* LSMGO Rows */}
                <BunkerFuelRows 
                  fuelType="LSMGO" 
                  unit="MT"
                  formData={formData}
                  prefix="lsmgo"
                  isSelected={isSelected}
                  isEdited={isEdited}
                  onFieldSelect={onFieldSelect}
                  handleFieldChange={handleFieldChange}
                />
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Water Section */}
        <SectionHeader title="Water" />
        <div className="border border-[#ddd] p-3 mb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            <FormRow label="Fresh Water ROB (MT):" labelWidth="170px">
              <VLInput id="fresh-water-rob" value={formData["fresh-water-rob"].value}
                onChange={(v) => handleFieldChange("fresh-water-rob", v)}
                isSelected={isSelected("fresh-water-rob")} isEdited={isEdited("fresh-water-rob")}
                onSelect={() => onFieldSelect("fresh-water-rob")} width="100px" />
            </FormRow>
            <FormRow label="Slops ROB (MT):" labelWidth="180px">
              <VLInput id="slops-rob" value={formData["slops-rob"].value}
                onChange={(v) => handleFieldChange("slops-rob", v)}
                isSelected={isSelected("slops-rob")} isEdited={isEdited("slops-rob")}
                onSelect={() => onFieldSelect("slops-rob")} width="100px" />
            </FormRow>
            
            <FormRow label="Destilled Water ROB (MT):" labelWidth="170px">
              <VLInput id="destilled-water-rob" value={formData["destilled-water-rob"].value}
                onChange={(v) => handleFieldChange("destilled-water-rob", v)}
                isSelected={isSelected("destilled-water-rob")} isEdited={isEdited("destilled-water-rob")}
                onSelect={() => onFieldSelect("destilled-water-rob")} width="100px" />
            </FormRow>
            <FormRow label="Tank Cleaning Chemical ROB (LTRS):" labelWidth="180px">
              <VLInput id="tank-clean-chem" value={formData["tank-clean-chem"].value}
                onChange={(v) => handleFieldChange("tank-clean-chem", v)}
                isSelected={isSelected("tank-clean-chem")} isEdited={isEdited("tank-clean-chem")}
                onSelect={() => onFieldSelect("tank-clean-chem")} width="100px" />
            </FormRow>
            
            <FormRow label="Distilled Water Consumed (MT):" labelWidth="170px">
              <VLInput id="distilled-consumed" value={formData["distilled-consumed"].value}
                onChange={(v) => handleFieldChange("distilled-consumed", v)}
                isSelected={isSelected("distilled-consumed")} isEdited={isEdited("distilled-consumed")}
                onSelect={() => onFieldSelect("distilled-consumed")} width="100px" />
            </FormRow>
            <FormRow label="Distilled Water Produced (MT):" labelWidth="180px">
              <VLInput id="distilled-produced" value={formData["distilled-produced"].value}
                onChange={(v) => handleFieldChange("distilled-produced", v)}
                isSelected={isSelected("distilled-produced")} isEdited={isEdited("distilled-produced")}
                onSelect={() => onFieldSelect("distilled-produced")} width="100px" />
            </FormRow>
            
            <FormRow label="Fresh Water Consumed (MT):" labelWidth="170px">
              <VLInput id="fresh-consumed" value={formData["fresh-consumed"].value}
                onChange={(v) => handleFieldChange("fresh-consumed", v)}
                isSelected={isSelected("fresh-consumed")} isEdited={isEdited("fresh-consumed")}
                onSelect={() => onFieldSelect("fresh-consumed")} width="100px" />
            </FormRow>
            <FormRow label="Fresh Water Produced (MT):" labelWidth="180px">
              <VLInput id="fresh-produced" value={formData["fresh-produced"].value}
                onChange={(v) => handleFieldChange("fresh-produced", v)}
                isSelected={isSelected("fresh-produced")} isEdited={isEdited("fresh-produced")}
                onSelect={() => onFieldSelect("fresh-produced")} width="100px" />
            </FormRow>
          </div>
        </div>
        
        {/* Master's Name Section */}
        <div className="bg-[#ffeeba] border border-[#ffc107] p-3 mb-6 inline-block">
          <div className="flex items-center gap-4">
            <span className="text-[#d9831f] font-bold text-[14px]">Master&apos;s Name</span>
            <div className="flex items-center gap-1.5">
              <label className="text-[13px] text-[#333]">First:</label>
              <VLInput id="master-first" value={formData["master-first"].value}
                onChange={(v) => handleFieldChange("master-first", v)}
                isSelected={isSelected("master-first")} isEdited={isEdited("master-first")}
                onSelect={() => onFieldSelect("master-first")} width="100px" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[13px] text-[#333]">Last:</label>
              <VLInput id="master-last" value={formData["master-last"].value}
                onChange={(v) => handleFieldChange("master-last", v)}
                isSelected={isSelected("master-last")} isEdited={isEdited("master-last")}
                onSelect={() => onFieldSelect("master-last")} width="120px" />
            </div>
          </div>
        </div>
        
        {/* Bottom Action Buttons */}
        <div className="flex gap-2 justify-center">
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
      </div>
    </div>
  )
}

// Bunker fuel rows component for the consumption table
function BunkerFuelRows({
  fuelType,
  unit,
  formData,
  prefix,
  isSelected,
  isEdited,
  onFieldSelect,
  handleFieldChange,
}: {
  fuelType: string
  unit: string
  formData: Record<string, FieldData>
  prefix: string
  isSelected: (id: string) => boolean
  isEdited: (id: string) => boolean
  onFieldSelect: (id: string) => void
  handleFieldChange: (id: string, value: string) => void
}) {
  const cellClass = "border border-[#ccc] px-0.5 py-0.5 text-center"
  const inputClass = (id: string) => `
    w-14 h-5 px-1 text-[11px] border border-[#999] bg-white text-center
    focus:outline-none
    ${isSelected(id) ? "ring-2 ring-[#7c3aed]" : ""}
  `
  
  return (
    <>
      {/* Main row */}
      <tr className="bg-white">
        <td className={`${cellClass} font-medium text-left`} rowSpan={3}>
          {fuelType}<br/>({unit})
        </td>
        <td className={cellClass} rowSpan={3}>
          <div className="relative inline-block">
            <input
              type="text"
              value={formData[`${prefix}-rob`]?.value || ""}
              onChange={(e) => handleFieldChange(`${prefix}-rob`, e.target.value)}
              onClick={() => onFieldSelect(`${prefix}-rob`)}
              className={inputClass(`${prefix}-rob`)}
              style={{ fontFamily: "Arial" }}
            />
            {isEdited(`${prefix}-rob`) && (
              <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
            )}
          </div>
        </td>
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>Main</td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-main`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-main`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-main`)} className={inputClass(`${prefix}-main`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-prop`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-prop`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-prop`)} className={inputClass(`${prefix}-prop`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-gen`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-gen`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-gen`)} className={inputClass(`${prefix}-gen`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-disch`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-disch`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-disch`)} className={inputClass(`${prefix}-disch`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-loading`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-loading`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-loading`)} className={inputClass(`${prefix}-loading`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-igs`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-igs`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-igs`)} className={inputClass(`${prefix}-igs`)} style={{ fontFamily: "Arial" }} />
        </td>
      </tr>
      {/* Aux row */}
      <tr className="bg-white">
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>Aux</td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-aux`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-aux`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-aux`)} className={inputClass(`${prefix}-aux`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>Cargo Heating</td>
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>Bunker Heating</td>
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>TankCleaning</td>
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>Other(Specify)</td>
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>Adj.</td>
      </tr>
      {/* Total row */}
      <tr className="bg-white">
        <td className={`${cellClass} bg-[#f0f0f0] text-[10px]`}>Total</td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-total`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-total`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-total`)} className={inputClass(`${prefix}-total`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-cargo-heat`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-cargo-heat`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-cargo-heat`)} className={inputClass(`${prefix}-cargo-heat`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-bunker-heat`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-bunker-heat`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-bunker-heat`)} className={inputClass(`${prefix}-bunker-heat`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-tank-clean`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-tank-clean`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-tank-clean`)} className={inputClass(`${prefix}-tank-clean`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-other`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-other`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-other`)} className={inputClass(`${prefix}-other`)} style={{ fontFamily: "Arial" }} />
        </td>
        <td className={cellClass}>
          <input type="text" value={formData[`${prefix}-adj`]?.value || ""} onChange={(e) => handleFieldChange(`${prefix}-adj`, e.target.value)} onClick={() => onFieldSelect(`${prefix}-adj`)} className={inputClass(`${prefix}-adj`)} style={{ fontFamily: "Arial" }} />
        </td>
      </tr>
    </>
  )
}
