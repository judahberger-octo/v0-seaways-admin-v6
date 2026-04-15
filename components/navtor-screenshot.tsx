"use client"

import { useState, useEffect } from "react"

// Screenshot data for each field - defines section header, grid fields, and bounding box target
interface ScreenshotField {
  label: string
  value: string
  unit?: string
  isHighlighted?: boolean
}

interface ScreenshotRow {
  fields: ScreenshotField[]
}

interface ScreenshotData {
  sectionHeader: string
  rows: ScreenshotRow[]
  boundingBoxLabel: string
  isTableLayout?: boolean
}

// Complete screenshot data map for all critical fields
const screenshotDataMap: Record<string, ScreenshotData> = {
  // 1. Date/Time
  "date-time": {
    sectionHeader: "VOYAGE REPORTING — GENERAL",
    boundingBoxLabel: "Date/Time",
    rows: [
      { fields: [
        { label: "Report Type", value: "Noon Report (Sea)" },
        { label: "Report Date", value: "14/04/2026", isHighlighted: true },
      ]},
      { fields: [
        { label: "Report Time", value: "12:00", isHighlighted: true },
        { label: "UTC Offset", value: "+0" },
      ]},
      { fields: [
        { label: "Vessel", value: "SEAWAYS SKOPELOS" },
        { label: "IMO", value: "9462584" },
      ]},
    ],
  },
  
  // 2. Voyage Number
  "voyage-number": {
    sectionHeader: "VOYAGE REPORTING — GENERAL",
    boundingBoxLabel: "Voyage Number",
    rows: [
      { fields: [
        { label: "Vessel", value: "SEAWAYS SKOPELOS" },
        { label: "IMO", value: "9462584" },
      ]},
      { fields: [
        { label: "Voyage No.", value: "124", isHighlighted: true },
        { label: "Leg", value: "2" },
      ]},
      { fields: [
        { label: "Charter Party", value: "CP-2026-0087" },
        { label: "Trade Route", value: "AG-MED" },
      ]},
    ],
  },
  
  // 3. Vessel Condition
  "vessel-condition": {
    sectionHeader: "VOYAGE REPORTING — GENERAL",
    boundingBoxLabel: "Vessel Condition",
    rows: [
      { fields: [
        { label: "Voyage No.", value: "124" },
        { label: "Leg", value: "2" },
      ]},
      { fields: [
        { label: "Vessel Condition", value: "Laden", isHighlighted: true },
        { label: "Cargo Type", value: "Crude Oil" },
      ]},
      { fields: [
        { label: "Loading Port", value: "Fujairah" },
        { label: "Disch. Port", value: "Gibraltar" },
      ]},
    ],
  },
  
  // 4. Next Port
  "next-port": {
    sectionHeader: "VOYAGE REPORTING — ITINERARY",
    boundingBoxLabel: "Next Port",
    rows: [
      { fields: [
        { label: "Last Port", value: "Gibraltar" },
        { label: "Departure", value: "12/04/2026 08:30" },
      ]},
      { fields: [
        { label: "Next Port", value: "Fujairah", isHighlighted: true },
        { label: "ETA", value: "22/04/2026 14:00" },
      ]},
      { fields: [
        { label: "Via", value: "Suez Canal" },
        { label: "Distance Rem.", value: "2847 nm" },
      ]},
    ],
  },
  
  // 5. ETA
  "eta": {
    sectionHeader: "VOYAGE REPORTING — ITINERARY",
    boundingBoxLabel: "ETA",
    rows: [
      { fields: [
        { label: "Last Port", value: "Gibraltar" },
        { label: "Departure", value: "12/04/2026 08:30" },
      ]},
      { fields: [
        { label: "Next Port", value: "Fujairah" },
        { label: "ETA", value: "22/04/2026 14:00", isHighlighted: true },
      ]},
      { fields: [
        { label: "Via", value: "Suez Canal" },
        { label: "Distance Rem.", value: "2847 nm" },
      ]},
    ],
  },
  
  // 6. Distance to Go
  "distance-to-go": {
    sectionHeader: "VOYAGE REPORTING — DISTANCE & SPEED",
    boundingBoxLabel: "Distance to Go",
    rows: [
      { fields: [
        { label: "Distance to Go", value: "2847", unit: "nm", isHighlighted: true },
      ]},
      { fields: [
        { label: "Observed Dist.", value: "142.3", unit: "nm" },
      ]},
      { fields: [
        { label: "Slip %", value: "0.35" },
      ]},
      { fields: [
        { label: "Steaming Time", value: "24.0", unit: "hrs" },
      ]},
    ],
  },
  
  // 7. CP Ordered Speed
  "cp-ordered-speed": {
    sectionHeader: "VOYAGE REPORTING — DISTANCE & SPEED",
    boundingBoxLabel: "CP Ordered Speed",
    rows: [
      { fields: [
        { label: "CP Ordered Spd", value: "12.5", unit: "kts", isHighlighted: true },
      ]},
      { fields: [
        { label: "Reported Speed", value: "12.3", unit: "kts" },
      ]},
      { fields: [
        { label: "Avg Speed", value: "12.4", unit: "kts" },
      ]},
      { fields: [
        { label: "Distance to Go", value: "2847", unit: "nm" },
      ]},
    ],
  },
  
  // 8. Reported Speed
  "reported-speed": {
    sectionHeader: "VOYAGE REPORTING — DISTANCE & SPEED",
    boundingBoxLabel: "Reported Speed",
    rows: [
      { fields: [
        { label: "CP Ordered Spd", value: "12.5", unit: "kts" },
      ]},
      { fields: [
        { label: "Reported Speed", value: "12.3", unit: "kts", isHighlighted: true },
      ]},
      { fields: [
        { label: "Avg Speed", value: "12.4", unit: "kts" },
      ]},
      { fields: [
        { label: "Observed Dist.", value: "142.3", unit: "nm" },
      ]},
    ],
  },
  
  // 9. Observed Distance
  "observed-distance": {
    sectionHeader: "VOYAGE REPORTING — DISTANCE & SPEED",
    boundingBoxLabel: "Observed Distance",
    rows: [
      { fields: [
        { label: "Observed Dist.", value: "142.3", unit: "nm", isHighlighted: true },
      ]},
      { fields: [
        { label: "Reported Speed", value: "12.3", unit: "kts" },
      ]},
      { fields: [
        { label: "Steaming Time", value: "24.0", unit: "hrs" },
      ]},
      { fields: [
        { label: "Slip %", value: "0.35" },
      ]},
    ],
  },
  
  // 10. Time Since Last Report
  "time-since-last": {
    sectionHeader: "VOYAGE REPORTING — DISTANCE & SPEED",
    boundingBoxLabel: "Time Since Last",
    rows: [
      { fields: [
        { label: "Steaming Time", value: "24.0", unit: "hrs", isHighlighted: true },
      ]},
      { fields: [
        { label: "Observed Dist.", value: "142.3", unit: "nm" },
      ]},
      { fields: [
        { label: "Avg Speed", value: "12.4", unit: "kts" },
      ]},
      { fields: [
        { label: "Time at Anchor", value: "0.0", unit: "hrs" },
      ]},
    ],
  },
  
  // 11. Main Engine RPM
  "main-engine-rpm": {
    sectionHeader: "MACHINERY — MAIN ENGINE",
    boundingBoxLabel: "Main Engine RPM",
    rows: [
      { fields: [
        { label: "ME RPM", value: "85.2", isHighlighted: true },
      ]},
      { fields: [
        { label: "ME Power", value: "8,420", unit: "kW" },
      ]},
      { fields: [
        { label: "ME Load", value: "72.4", unit: "%" },
      ]},
      { fields: [
        { label: "Gov. Setting", value: "Auto" },
        { label: "Fuel Mode", value: "Eco" },
      ]},
    ],
  },
  
  // 12. Beaufort
  "beaufort": {
    sectionHeader: "WEATHER & SEA CONDITIONS",
    boundingBoxLabel: "Beaufort",
    rows: [
      { fields: [
        { label: "Beaufort", value: "4", isHighlighted: true },
        { label: "Wind Dir.", value: "NW" },
      ]},
      { fields: [
        { label: "Sea State", value: "Moderate" },
        { label: "Sea Height", value: "1.5 m" },
      ]},
      { fields: [
        { label: "Swell Dir.", value: "W" },
        { label: "Swell Hgt.", value: "1.2 m" },
      ]},
      { fields: [
        { label: "Sea Temp.", value: "18.2 C" },
        { label: "Air Temp.", value: "22.4 C" },
      ]},
    ],
  },
  
  // 13. ROB, Consumption & Used For (Table layout)
  "bunkers-section": {
    sectionHeader: "BUNKERS — ROB & CONSUMPTION",
    boundingBoxLabel: "ROB & Consumption",
    isTableLayout: true,
    rows: [
      { fields: [
        { label: "Type", value: "ROB" },
        { label: "Consumed", value: "Propulsion" },
        { label: "Gen (aux)", value: "", isHighlighted: true },
      ]},
      { fields: [
        { label: "IFO", value: "1,245", isHighlighted: true },
        { label: "32.4", value: "28.1", isHighlighted: true },
        { label: "4.3", value: "", isHighlighted: true },
      ]},
      { fields: [
        { label: "MGO", value: "342", isHighlighted: true },
        { label: "2.8", value: "0.0", isHighlighted: true },
        { label: "2.8", value: "", isHighlighted: true },
      ]},
      { fields: [
        { label: "LSF", value: "0", isHighlighted: true },
        { label: "0.0", value: "0.0", isHighlighted: true },
        { label: "0.0", value: "", isHighlighted: true },
      ]},
      { fields: [
        { label: "LSMGO", value: "587", isHighlighted: true },
        { label: "14.2", value: "12.6", isHighlighted: true },
        { label: "1.6", value: "", isHighlighted: true },
      ]},
    ],
  },
  
  // 14. Fresh Water ROB
  "fresh-water-rob": {
    sectionHeader: "FRESHWATER & STORES",
    boundingBoxLabel: "Fresh Water ROB",
    rows: [
      { fields: [
        { label: "Fresh Water ROB", value: "125.4", unit: "MT", isHighlighted: true },
      ]},
      { fields: [
        { label: "FW Consumed", value: "14.2", unit: "MT" },
      ]},
      { fields: [
        { label: "FW Produced", value: "10.0", unit: "MT" },
      ]},
      { fields: [
        { label: "Dist. Water ROB", value: "48.2", unit: "MT" },
      ]},
    ],
  },
  
  // 15. Distilled Water ROB
  "distilled-water-rob": {
    sectionHeader: "FRESHWATER & STORES",
    boundingBoxLabel: "Distilled Water ROB",
    rows: [
      { fields: [
        { label: "Fresh Water ROB", value: "125.4", unit: "MT" },
      ]},
      { fields: [
        { label: "FW Consumed", value: "14.2", unit: "MT" },
      ]},
      { fields: [
        { label: "Dist. Water ROB", value: "48.2", unit: "MT", isHighlighted: true },
      ]},
      { fields: [
        { label: "DW Consumed", value: "8.5", unit: "MT" },
      ]},
      { fields: [
        { label: "DW Produced", value: "6.5", unit: "MT" },
      ]},
    ],
  },
  
  // 16. Slops ROB
  "slops-rob": {
    sectionHeader: "FRESHWATER & STORES",
    boundingBoxLabel: "Slops ROB",
    rows: [
      { fields: [
        { label: "Dist. Water ROB", value: "48.2", unit: "MT" },
      ]},
      { fields: [
        { label: "Slops ROB", value: "12.8", unit: "MT", isHighlighted: true },
      ]},
      { fields: [
        { label: "Tank Chem. ROB", value: "340", unit: "LTRS" },
      ]},
      { fields: [
        { label: "Sludge ROB", value: "8.4", unit: "MT" },
      ]},
    ],
  },
  
  // Non-critical field screenshots
  "vessel-name": {
    sectionHeader: "VOYAGE REPORTING — GENERAL",
    boundingBoxLabel: "Vessel Name",
    rows: [
      { fields: [
        { label: "Vessel", value: "SEAWAYS SKOPELOS", isHighlighted: true },
        { label: "IMO", value: "9462584" },
      ]},
      { fields: [
        { label: "Flag", value: "Greece" },
        { label: "Class", value: "DNV" },
      ]},
      { fields: [
        { label: "DWT", value: "115,000" },
        { label: "Year Built", value: "2012" },
      ]},
    ],
  },
  
  "latitude": {
    sectionHeader: "POSITION",
    boundingBoxLabel: "Latitude",
    rows: [
      { fields: [
        { label: "Latitude", value: "35° 42' N", isHighlighted: true },
      ]},
      { fields: [
        { label: "Longitude", value: "014° 25' E" },
      ]},
      { fields: [
        { label: "Course", value: "087°" },
        { label: "Heading", value: "089°" },
      ]},
    ],
  },
  
  "longitude": {
    sectionHeader: "POSITION",
    boundingBoxLabel: "Longitude",
    rows: [
      { fields: [
        { label: "Latitude", value: "35° 42' N" },
      ]},
      { fields: [
        { label: "Longitude", value: "014° 25' E", isHighlighted: true },
      ]},
      { fields: [
        { label: "Course", value: "087°" },
        { label: "Heading", value: "089°" },
      ]},
    ],
  },
  
  "ballast": {
    sectionHeader: "OPERATING CONDITIONS",
    boundingBoxLabel: "Ballast",
    rows: [
      { fields: [
        { label: "Ballast", value: "0", unit: "MT", isHighlighted: true },
        { label: "Displacement", value: "142,500", unit: "t" },
      ]},
      { fields: [
        { label: "Fwd Draft", value: "14.2", unit: "m" },
        { label: "Aft Draft", value: "14.8", unit: "m" },
      ]},
      { fields: [
        { label: "Mid Draft", value: "14.5", unit: "m" },
        { label: "Trim", value: "0.6", unit: "m" },
      ]},
    ],
  },
  
  "displacement": {
    sectionHeader: "OPERATING CONDITIONS",
    boundingBoxLabel: "Displacement",
    rows: [
      { fields: [
        { label: "Ballast", value: "0", unit: "MT" },
        { label: "Displacement", value: "142,500", unit: "t", isHighlighted: true },
      ]},
      { fields: [
        { label: "Fwd Draft", value: "14.2", unit: "m" },
        { label: "Aft Draft", value: "14.8", unit: "m" },
      ]},
      { fields: [
        { label: "Mid Draft", value: "14.5", unit: "m" },
        { label: "Trim", value: "0.6", unit: "m" },
      ]},
    ],
  },
  
  "slip": {
    sectionHeader: "VOYAGE REPORTING — DISTANCE & SPEED",
    boundingBoxLabel: "Slip %",
    rows: [
      { fields: [
        { label: "Observed Dist.", value: "142.3", unit: "nm" },
      ]},
      { fields: [
        { label: "Engine Dist.", value: "142.8", unit: "nm" },
      ]},
      { fields: [
        { label: "Slip %", value: "0.35", isHighlighted: true },
      ]},
      { fields: [
        { label: "Avg Speed", value: "12.4", unit: "kts" },
      ]},
    ],
  },
  
  "fwd-draft": {
    sectionHeader: "OPERATING CONDITIONS",
    boundingBoxLabel: "Fwd Draft",
    rows: [
      { fields: [
        { label: "Fwd Draft", value: "14.2", unit: "m", isHighlighted: true },
        { label: "Aft Draft", value: "14.8", unit: "m" },
      ]},
      { fields: [
        { label: "Mid Draft", value: "14.5", unit: "m" },
        { label: "Trim", value: "0.6", unit: "m" },
      ]},
      { fields: [
        { label: "Displacement", value: "142,500", unit: "t" },
      ]},
    ],
  },
  
  "mid-draft": {
    sectionHeader: "OPERATING CONDITIONS",
    boundingBoxLabel: "Mid Draft",
    rows: [
      { fields: [
        { label: "Fwd Draft", value: "14.2", unit: "m" },
        { label: "Aft Draft", value: "14.8", unit: "m" },
      ]},
      { fields: [
        { label: "Mid Draft", value: "14.5", unit: "m", isHighlighted: true },
        { label: "Trim", value: "0.6", unit: "m" },
      ]},
      { fields: [
        { label: "Displacement", value: "142,500", unit: "t" },
      ]},
    ],
  },
  
  "aft-draft": {
    sectionHeader: "OPERATING CONDITIONS",
    boundingBoxLabel: "Aft Draft",
    rows: [
      { fields: [
        { label: "Fwd Draft", value: "14.2", unit: "m" },
        { label: "Aft Draft", value: "14.8", unit: "m", isHighlighted: true },
      ]},
      { fields: [
        { label: "Mid Draft", value: "14.5", unit: "m" },
        { label: "Trim", value: "0.6", unit: "m" },
      ]},
      { fields: [
        { label: "Displacement", value: "142,500", unit: "t" },
      ]},
    ],
  },
  
  "gen1-kwhrs": {
    sectionHeader: "MACHINERY — GENERATORS",
    boundingBoxLabel: "Gen 1 KWhrs",
    rows: [
      { fields: [
        { label: "Gen 1 KWhrs", value: "12,450", isHighlighted: true },
        { label: "Gen 1 Hrs", value: "842.5" },
      ]},
      { fields: [
        { label: "Gen 2 KWhrs", value: "11,280" },
        { label: "Gen 2 Hrs", value: "756.2" },
      ]},
      { fields: [
        { label: "Gen 3 KWhrs", value: "8,920" },
        { label: "Gen 3 Hrs", value: "612.8" },
      ]},
      { fields: [
        { label: "Boiler Hours", value: "124.5" },
      ]},
    ],
  },
  
  "gen1-hrs": {
    sectionHeader: "MACHINERY — GENERATORS",
    boundingBoxLabel: "Gen 1 Hrs",
    rows: [
      { fields: [
        { label: "Gen 1 KWhrs", value: "12,450" },
        { label: "Gen 1 Hrs", value: "842.5", isHighlighted: true },
      ]},
      { fields: [
        { label: "Gen 2 KWhrs", value: "11,280" },
        { label: "Gen 2 Hrs", value: "756.2" },
      ]},
      { fields: [
        { label: "Gen 3 KWhrs", value: "8,920" },
        { label: "Gen 3 Hrs", value: "612.8" },
      ]},
      { fields: [
        { label: "Boiler Hours", value: "124.5" },
      ]},
    ],
  },
  
  "boiler-hrs": {
    sectionHeader: "MACHINERY — GENERATORS",
    boundingBoxLabel: "Boiler Hours",
    rows: [
      { fields: [
        { label: "Gen 1 KWhrs", value: "12,450" },
        { label: "Gen 1 Hrs", value: "842.5" },
      ]},
      { fields: [
        { label: "Gen 2 KWhrs", value: "11,280" },
        { label: "Gen 2 Hrs", value: "756.2" },
      ]},
      { fields: [
        { label: "Gen 3 KWhrs", value: "8,920" },
        { label: "Gen 3 Hrs", value: "612.8" },
      ]},
      { fields: [
        { label: "Boiler Hours", value: "124.5", isHighlighted: true },
      ]},
    ],
  },
  
  "wind-direction": {
    sectionHeader: "WEATHER & SEA CONDITIONS",
    boundingBoxLabel: "Wind Direction",
    rows: [
      { fields: [
        { label: "Beaufort", value: "4" },
        { label: "Wind Dir.", value: "NW", isHighlighted: true },
      ]},
      { fields: [
        { label: "Sea State", value: "Moderate" },
        { label: "Sea Height", value: "1.5 m" },
      ]},
      { fields: [
        { label: "Swell Dir.", value: "W" },
        { label: "Swell Hgt.", value: "1.2 m" },
      ]},
    ],
  },
  
  "sea-state": {
    sectionHeader: "WEATHER & SEA CONDITIONS",
    boundingBoxLabel: "Sea State",
    rows: [
      { fields: [
        { label: "Beaufort", value: "4" },
        { label: "Wind Dir.", value: "NW" },
      ]},
      { fields: [
        { label: "Sea State", value: "Moderate", isHighlighted: true },
        { label: "Sea Height", value: "1.5 m" },
      ]},
      { fields: [
        { label: "Swell Dir.", value: "W" },
        { label: "Swell Hgt.", value: "1.2 m" },
      ]},
    ],
  },
  
  "sea-height": {
    sectionHeader: "WEATHER & SEA CONDITIONS",
    boundingBoxLabel: "Sea Height",
    rows: [
      { fields: [
        { label: "Beaufort", value: "4" },
        { label: "Wind Dir.", value: "NW" },
      ]},
      { fields: [
        { label: "Sea State", value: "Moderate" },
        { label: "Sea Height", value: "1.5 m", isHighlighted: true },
      ]},
      { fields: [
        { label: "Swell Dir.", value: "W" },
        { label: "Swell Hgt.", value: "1.2 m" },
      ]},
    ],
  },
  
  "sea-temp": {
    sectionHeader: "WEATHER & SEA CONDITIONS",
    boundingBoxLabel: "Sea Temp",
    rows: [
      { fields: [
        { label: "Sea State", value: "Moderate" },
        { label: "Sea Height", value: "1.5 m" },
      ]},
      { fields: [
        { label: "Sea Temp.", value: "18.2 C", isHighlighted: true },
        { label: "Air Temp.", value: "22.4 C" },
      ]},
      { fields: [
        { label: "Swell Dir.", value: "W" },
        { label: "Swell Hgt.", value: "1.2 m" },
      ]},
    ],
  },
}

// Default state (no field selected)
const defaultScreenshot: ScreenshotData = {
  sectionHeader: "NAVFLEET PERFORMANCE — VESSEL OVERVIEW",
  boundingBoxLabel: "",
  rows: [
    { fields: [
      { label: "Vessel", value: "SEAWAYS SKOPELOS" },
      { label: "IMO", value: "9462584" },
    ]},
    { fields: [
      { label: "Voyage No.", value: "124" },
      { label: "Condition", value: "Laden" },
    ]},
    { fields: [
      { label: "Position", value: "35° 42' N, 014° 25' E" },
    ]},
    { fields: [
      { label: "Last Report", value: "14/04/2026 12:00 UTC" },
    ]},
  ],
}

// No mapping screenshot (for remarks, etc.)
const noMappingScreenshot: ScreenshotData = {
  sectionHeader: "NO SOURCE MAPPING",
  boundingBoxLabel: "",
  rows: [],
}

interface NavtorScreenshotProps {
  fieldId: string | null
  className?: string
}

export function NavtorScreenshot({ fieldId, className = "" }: NavtorScreenshotProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [currentFieldId, setCurrentFieldId] = useState<string | null>(fieldId)
  
  // Crossfade transition when field changes
  useEffect(() => {
    if (fieldId !== currentFieldId) {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setCurrentFieldId(fieldId)
        setIsVisible(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [fieldId, currentFieldId])
  
  const screenshot = currentFieldId 
    ? (screenshotDataMap[currentFieldId] || noMappingScreenshot)
    : defaultScreenshot
  
  const isNoMapping = !currentFieldId || !screenshotDataMap[currentFieldId]
  const showDefaultState = !currentFieldId
  const showNoMapping = currentFieldId && !screenshotDataMap[currentFieldId]
  
  return (
    <div 
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 200ms ease-in-out",
      }}
    >
      {/* Container with NAVTOR dark navy background */}
      <div 
        className="relative rounded-md overflow-hidden"
        style={{
          background: "#0b1120",
          border: "1px solid #1e3a5f",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* Scanline overlay effect */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)",
          }}
        />
        
        {/* Section header bar */}
        <div 
          className="px-3 py-2"
          style={{
            background: "#0f2a3d",
          }}
        >
          <span 
            className="font-mono text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "#7ec8e3" }}
          >
            {screenshot.sectionHeader}
          </span>
        </div>
        
        {/* Content area */}
        <div className="p-3 relative">
          {/* Default state message */}
          {showDefaultState && (
            <div className="py-6 text-center">
              <p 
                className="text-xs italic"
                style={{ color: "#6b8299" }}
              >
                Select a field to see its NAVTOR source
              </p>
            </div>
          )}
          
          {/* No mapping message */}
          {showNoMapping && (
            <div className="py-6 text-center">
              <p 
                className="text-xs italic"
                style={{ color: "#6b8299" }}
              >
                No NAVTOR source mapping — manually entered
              </p>
            </div>
          )}
          
          {/* Field rows */}
          {!showDefaultState && !showNoMapping && (
            <div className="space-y-0">
              {/* Table layout for bunkers */}
              {screenshot.isTableLayout ? (
                <div className="relative">
                  {/* Full table bounding box */}
                  <div 
                    className="absolute inset-0 -m-1 rounded z-20"
                    style={{
                      border: "2px solid #f59e0b",
                      borderRadius: "3px",
                      boxShadow: "0 0 12px rgba(245, 158, 11, 0.35), inset 0 0 6px rgba(245, 158, 11, 0.1)",
                    }}
                  >
                    {/* Tag */}
                    <span 
                      className="absolute font-mono text-[9px] font-bold px-1.5 py-0.5"
                      style={{
                        top: "-10px",
                        left: "-1px",
                        background: "#f59e0b",
                        color: "#000",
                        borderRadius: "2px",
                      }}
                    >
                      {screenshot.boundingBoxLabel}
                    </span>
                  </div>
                  
                  {/* Table content */}
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1a2a3a" }}>
                        <th className="text-left py-1.5 px-2" style={{ color: "#6b8299" }}>Type</th>
                        <th className="text-right py-1.5 px-2" style={{ color: "#6b8299" }}>ROB</th>
                        <th className="text-right py-1.5 px-2" style={{ color: "#6b8299" }}>Consumed</th>
                        <th className="text-right py-1.5 px-2" style={{ color: "#6b8299" }}>Propulsion</th>
                        <th className="text-right py-1.5 px-2" style={{ color: "#6b8299" }}>Gen (aux)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: "IFO", rob: "1,245", consumed: "32.4", prop: "28.1", gen: "4.3" },
                        { type: "MGO", rob: "342", consumed: "2.8", prop: "0.0", gen: "2.8" },
                        { type: "LSF", rob: "0", consumed: "0.0", prop: "0.0", gen: "0.0" },
                        { type: "LSMGO", rob: "587", consumed: "14.2", prop: "12.6", gen: "1.6" },
                      ].map((row) => (
                        <tr key={row.type} style={{ borderBottom: "1px solid #1a2a3a" }}>
                          <td className="py-1.5 px-2" style={{ color: "#6b8299" }}>{row.type}</td>
                          <td className="text-right py-1.5 px-2">
                            <span 
                              className="inline-block px-2 py-0.5 rounded"
                              style={{ background: "#162a3e", color: "#e8f0f8" }}
                            >
                              {row.rob}
                            </span>
                          </td>
                          <td className="text-right py-1.5 px-2">
                            <span 
                              className="inline-block px-2 py-0.5 rounded"
                              style={{ background: "#162a3e", color: "#e8f0f8" }}
                            >
                              {row.consumed}
                            </span>
                          </td>
                          <td className="text-right py-1.5 px-2">
                            <span 
                              className="inline-block px-2 py-0.5 rounded"
                              style={{ background: "#162a3e", color: "#e8f0f8" }}
                            >
                              {row.prop}
                            </span>
                          </td>
                          <td className="text-right py-1.5 px-2">
                            <span 
                              className="inline-block px-2 py-0.5 rounded"
                              style={{ background: "#162a3e", color: "#e8f0f8" }}
                            >
                              {row.gen}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Regular field rows */
                screenshot.rows.map((row, rowIndex) => {
                  const hasHighlight = row.fields.some(f => f.isHighlighted)
                  // Check if this is a multi-field highlight (like date-time)
                  const allHighlighted = row.fields.every(f => f.isHighlighted)
                  
                  return (
                    <div 
                      key={rowIndex}
                      className="relative"
                      style={{ borderBottom: rowIndex < screenshot.rows.length - 1 ? "1px solid #1a2a3a" : "none" }}
                    >
                      {/* Dim overlay for non-highlighted rows */}
                      {!hasHighlight && screenshot.boundingBoxLabel && (
                        <div 
                          className="absolute inset-0 z-10"
                          style={{ background: "rgba(0, 0, 0, 0.2)" }}
                        />
                      )}
                      
                      <div className={`flex items-center gap-4 py-2 ${row.fields.length === 1 ? "" : "justify-between"}`}>
                        {row.fields.map((field, fieldIndex) => {
                          const isHighlighted = field.isHighlighted
                          
                          return (
                            <div 
                              key={fieldIndex}
                              className={`flex items-center gap-2 relative ${row.fields.length === 1 ? "flex-1" : ""}`}
                            >
                              {/* Bounding box for highlighted field */}
                              {isHighlighted && (
                                <div 
                                  className="absolute inset-0 -m-1 rounded z-20"
                                  style={{
                                    border: "2px solid #f59e0b",
                                    borderRadius: "3px",
                                    boxShadow: "0 0 12px rgba(245, 158, 11, 0.35), inset 0 0 6px rgba(245, 158, 11, 0.1)",
                                  }}
                                >
                                  {/* Tag - only show on first highlighted field in row, or if single highlight */}
                                  {(fieldIndex === 0 || !allHighlighted) && screenshot.boundingBoxLabel && (
                                    <span 
                                      className="absolute font-mono text-[9px] font-bold px-1.5 py-0.5"
                                      style={{
                                        top: "-10px",
                                        left: "-1px",
                                        background: "#f59e0b",
                                        color: "#000",
                                        borderRadius: "2px",
                                      }}
                                    >
                                      {screenshot.boundingBoxLabel}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Label */}
                              <span 
                                className="font-mono text-[10px] whitespace-nowrap"
                                style={{ color: "#6b8299" }}
                              >
                                {field.label}
                              </span>
                              
                              {/* Value container */}
                              <div 
                                className="px-2.5 py-1 rounded min-w-[60px]"
                                style={{ 
                                  background: "#162a3e",
                                  borderRadius: "3px",
                                }}
                              >
                                <span 
                                  className="font-mono text-[13px]"
                                  style={{ color: "#e8f0f8" }}
                                >
                                  {field.value}
                                </span>
                              </div>
                              
                              {/* Unit */}
                              {field.unit && (
                                <span 
                                  className="font-mono text-[10px]"
                                  style={{ color: "#6b8299" }}
                                >
                                  {field.unit}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
