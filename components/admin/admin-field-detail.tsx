"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Save, RotateCcw, X, ChevronDown, Check, Plus, Trash2, AlertCircle, HelpCircle, CheckCircle2, Play, Clock, ChevronRight, Search } from "lucide-react"
import {
  fieldDefinitions,
  targetSystems,
  targetForms,
  vessels,
  getTestRunsForField,
  testReports,
  lookupTables,
  type FieldDefinition,
  type ValidationRule,
  type TestRun,
  type LookupTable,
} from "@/lib/admin-mock-data"

// Section IDs for navigation
const sections = [
  { id: "identity", label: "Identity & metadata" },
  { id: "mapping", label: "Mapping" },
  { id: "conditions", label: "Conditions" },
  { id: "notes", label: "Notes" },
  { id: "check", label: "Check" },
  { id: "test", label: "Test" },
  { id: "activity", label: "Activity" },
] as const

type SectionId = (typeof sections)[number]["id"]

interface AdminFieldDetailProps {
  fieldId: string | null // null = create mode
  onBack: () => void
}

export function AdminFieldDetail({ fieldId, onBack }: AdminFieldDetailProps) {
  const isCreateMode = fieldId === null
  const activeSystem = targetSystems[0] // VesLink for v0

  // Get field data or create empty template
  const originalField = fieldId
    ? fieldDefinitions.find((f) => f.id === fieldId)
    : null

  // Form state - start with original or empty template
  const [formData, setFormData] = useState<Partial<FieldDefinition>>(() => {
    if (originalField) {
      return { ...originalField }
    }
    return {
      logicalName: "",
      name: "",
      targetSystemId: activeSystem.id,
      appearsOnFormIds: [],
      dataType: "text",
      unit: undefined,
      isCritical: false,
      isMandatory: false,
      isCalculated: false,
      extractionHint: "",
      navtorSourcePath: undefined,
      validationRules: [],
      version: 1,
    }
  })

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Form scope toggle - same logic for all selected forms
  const [sameLogicForAllForms, setSameLogicForAllForms] = useState(true)

  // Active form tab (when in divergent mode)
  const [activeFormTab, setActiveFormTab] = useState<string | null>(null)

  // Confirmation dialog for switching back to shared logic
  const [showSharedLogicConfirm, setShowSharedLogicConfirm] = useState(false)

  // Transform type state - shared or per-form
  type MappingTransformType = 'direct' | 'lookup' | 'aggregation' | 'formula' | 'constant' | 'manual' | null
  const [sharedTransformType, setSharedTransformType] = useState<MappingTransformType>(null)
  const [perFormTransformType, setPerFormTransformType] = useState<Record<string, MappingTransformType>>({})

  // Confirmation dialog for changing transform type
  const [showTransformChangeConfirm, setShowTransformChangeConfirm] = useState<{
    newType: MappingTransformType
    formId?: string // undefined means shared mode
  } | null>(null)

  // Get current transform type for active context
  const getCurrentTransformType = (): MappingTransformType => {
    if (sameLogicForAllForms) {
      return sharedTransformType
    }
    return activeFormTab ? perFormTransformType[activeFormTab] || null : null
  }

  // Set transform type with confirmation if needed
  const handleTransformTypeChange = (newType: MappingTransformType, formId?: string) => {
    const currentType = formId ? perFormTransformType[formId] : sharedTransformType
    
    // If changing from a configured type to a different type, show confirmation
    if (currentType && currentType !== newType) {
      setShowTransformChangeConfirm({ newType, formId })
    } else {
      // No confirmation needed - first selection or same type
      applyTransformTypeChange(newType, formId)
    }
  }

  // Apply the transform type change
  const applyTransformTypeChange = (newType: MappingTransformType, formId?: string) => {
    if (formId) {
      setPerFormTransformType((prev) => ({ ...prev, [formId]: newType }))
    } else {
      setSharedTransformType(newType)
    }
    setHasUnsavedChanges(true)
    setShowTransformChangeConfirm(null)
  }

  // Direct transform configuration state
  interface DirectTransformConfig {
    sourceForm: string
    sourceField: string
  }
  const [sharedDirectConfig, setSharedDirectConfig] = useState<DirectTransformConfig>({ sourceForm: '', sourceField: '' })
  const [perFormDirectConfig, setPerFormDirectConfig] = useState<Record<string, DirectTransformConfig>>({})

  // Get current direct config for active context
  const getCurrentDirectConfig = (): DirectTransformConfig => {
    if (sameLogicForAllForms) {
      return sharedDirectConfig
    }
    return activeFormTab ? perFormDirectConfig[activeFormTab] || { sourceForm: '', sourceField: '' } : { sourceForm: '', sourceField: '' }
  }

  // Update direct config
  const updateDirectConfig = (updates: Partial<DirectTransformConfig>) => {
    if (sameLogicForAllForms) {
      setSharedDirectConfig((prev) => ({ ...prev, ...updates }))
    } else if (activeFormTab) {
      setPerFormDirectConfig((prev) => ({
        ...prev,
        [activeFormTab]: { ...(prev[activeFormTab] || { sourceForm: '', sourceField: '' }), ...updates }
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Lookup transform configuration state
  interface LookupTransformConfig {
    sourceForm: string
    sourceField: string
    lookupTableId: string
  }
  const [sharedLookupConfig, setSharedLookupConfig] = useState<LookupTransformConfig>({ sourceForm: '', sourceField: '', lookupTableId: '' })
  const [perFormLookupConfig, setPerFormLookupConfig] = useState<Record<string, LookupTransformConfig>>({})

  // Get current lookup config for active context
  const getCurrentLookupConfig = (): LookupTransformConfig => {
    if (sameLogicForAllForms) {
      return sharedLookupConfig
    }
    return activeFormTab ? perFormLookupConfig[activeFormTab] || { sourceForm: '', sourceField: '', lookupTableId: '' } : { sourceForm: '', sourceField: '', lookupTableId: '' }
  }

  // Update lookup config
  const updateLookupConfig = (updates: Partial<LookupTransformConfig>) => {
    if (sameLogicForAllForms) {
      setSharedLookupConfig((prev) => ({ ...prev, ...updates }))
    } else if (activeFormTab) {
      setPerFormLookupConfig((prev) => ({
        ...prev,
        [activeFormTab]: { ...(prev[activeFormTab] || { sourceForm: '', sourceField: '', lookupTableId: '' }), ...updates }
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Aggregation transform configuration state
  type AggregationOperator = 'sum' | 'average' | 'concat'
  interface AggregationTransformConfig {
    sourceForm: string
    operator: AggregationOperator | ''
    sourceFields: string[]
    separator: string // Only used for concat
  }
  const defaultAggregationConfig: AggregationTransformConfig = { sourceForm: '', operator: '', sourceFields: ['', ''], separator: ' ' }
  const [sharedAggregationConfig, setSharedAggregationConfig] = useState<AggregationTransformConfig>(defaultAggregationConfig)
  const [perFormAggregationConfig, setPerFormAggregationConfig] = useState<Record<string, AggregationTransformConfig>>({})

  // Get current aggregation config for active context
  const getCurrentAggregationConfig = (): AggregationTransformConfig => {
    if (sameLogicForAllForms) {
      return sharedAggregationConfig
    }
    return activeFormTab ? perFormAggregationConfig[activeFormTab] || defaultAggregationConfig : defaultAggregationConfig
  }

  // Update aggregation config
  const updateAggregationConfig = (updates: Partial<AggregationTransformConfig>) => {
    if (sameLogicForAllForms) {
      setSharedAggregationConfig((prev) => ({ ...prev, ...updates }))
    } else if (activeFormTab) {
      setPerFormAggregationConfig((prev) => ({
        ...prev,
        [activeFormTab]: { ...(prev[activeFormTab] || defaultAggregationConfig), ...updates }
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Update a single source field in the aggregation config
  const updateAggregationSourceField = (index: number, value: string) => {
    const current = getCurrentAggregationConfig()
    const newFields = [...current.sourceFields]
    newFields[index] = value
    updateAggregationConfig({ sourceFields: newFields })
  }

  // Add a new source field to the aggregation config
  const addAggregationSourceField = () => {
    const current = getCurrentAggregationConfig()
    updateAggregationConfig({ sourceFields: [...current.sourceFields, ''] })
  }

  // Remove a source field from the aggregation config
  const removeAggregationSourceField = (index: number) => {
    const current = getCurrentAggregationConfig()
    if (current.sourceFields.length <= 2) return // Minimum 2 fields required
    const newFields = current.sourceFields.filter((_, i) => i !== index)
    updateAggregationConfig({ sourceFields: newFields })
  }

  // Get sorted selected forms for tabs
  const selectedForms = (formData.appearsOnFormIds || [])
    .map((id) => targetForms.find((f) => f.id === id))
    .filter((f): f is typeof targetForms[0] => f !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Set active form tab to first form when entering divergent mode or when forms change
  useEffect(() => {
    if (!sameLogicForAllForms && selectedForms.length > 0 && !activeFormTab) {
      setActiveFormTab(selectedForms[0].id)
    }
    // If active tab is removed, switch to first form
    if (activeFormTab && !selectedForms.find((f) => f.id === activeFormTab)) {
      setActiveFormTab(selectedForms[0]?.id || null)
    }
  }, [sameLogicForAllForms, selectedForms, activeFormTab])

  // Handle toggle change with confirmation
  const handleToggleSameLogic = () => {
    if (sameLogicForAllForms) {
      // Turning OFF - no confirmation needed
      setSameLogicForAllForms(false)
    } else {
      // Turning ON - need confirmation if there are multiple forms
      if (selectedForms.length > 1) {
        setShowSharedLogicConfirm(true)
      } else {
        setSameLogicForAllForms(true)
      }
    }
  }

  // Confirm switching to shared logic
  const confirmSharedLogic = () => {
    setSameLogicForAllForms(true)
    setShowSharedLogicConfirm(false)
    setActiveFormTab(null)
  }

  // Active section for sidebar highlighting
  const [activeSection, setActiveSection] = useState<SectionId>("identity")

  

  // Track scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById("field-detail-content")
      if (!scrollContainer) return

      const scrollTop = scrollContainer.scrollTop
      const offset = 120 // Account for sticky header

      for (const section of sections) {
        const element = document.getElementById(`section-${section.id}`)
        if (element) {
          const rect = element.getBoundingClientRect()
          const containerRect = scrollContainer.getBoundingClientRect()
          const relativeTop = rect.top - containerRect.top

          if (relativeTop <= offset) {
            setActiveSection(section.id)
          }
        }
      }
    }

    const scrollContainer = document.getElementById("field-detail-content")
    scrollContainer?.addEventListener("scroll", handleScroll)
    return () => scrollContainer?.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle form changes
  const updateFormData = (updates: Partial<FieldDefinition>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  // Handle save
  const handleSave = () => {
    // In real app, this would save to backend
    console.log("Saving field:", formData)
    setHasUnsavedChanges(false)
  }

  // Handle discard
  const handleDiscard = () => {
    if (originalField) {
      setFormData({ ...originalField })
    } else {
      setFormData({
        logicalName: "",
        name: "",
        targetSystemId: activeSystem.id,
        appearsOnFormIds: [],
        dataType: "text",
        unit: undefined,
        isCritical: false,
        isMandatory: false,
        isCalculated: false,
        extractionHint: "",
        navtorSourcePath: undefined,
        validationRules: [],
        version: 1,
      })
    }
    setHasUnsavedChanges(false)
  }

  // Scroll to section
  const scrollToSection = (sectionId: SectionId) => {
    const element = document.getElementById(`section-${sectionId}`)
    const scrollContainer = document.getElementById("field-detail-content")
    if (element && scrollContainer) {
      const offset = 100
      const elementTop = element.offsetTop - offset
      scrollContainer.scrollTo({ top: elementTop, behavior: "smooth" })
    }
  }

  if (!isCreateMode && !originalField) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 text-center">
          <p className="text-[#64748b]">Field not found.</p>
          <button
            onClick={onBack}
            className="mt-4 text-sm font-medium text-[#7c3aed] hover:underline"
          >
            Back to list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky Page Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8f0] bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-6 w-px bg-[#e2e8f0]" />
          <h1 className="text-lg font-semibold text-[#0f172a]">
            {isCreateMode ? "New Field Definition" : formData.logicalName || "Untitled"}
          </h1>
          <span className="rounded-full bg-[#f3e8ff] px-3 py-1 text-xs font-medium text-[#7c3aed]">
            {activeSystem.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-[#f97316]">Unsaved changes</span>
          )}
          <button
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Section Nav */}
        <aside className="sticky top-0 w-60 flex-shrink-0 border-r border-[#e2e8f0] bg-[#f8fafc] p-4">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-[#f3e8ff] text-[#7c3aed]"
                    : "text-[#64748b] hover:bg-white hover:text-[#0f172a]"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Column - Stacked Sections */}
        <main
          id="field-detail-content"
          className="flex-1 overflow-y-auto p-8"
        >
          <div className="max-w-3xl space-y-6">
            {/* Form Scope Panel - Always visible at top */}
            <section className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-[#0f172a]">
                Forms this field appears on
              </h2>
              
              {/* Form chip picker */}
              <FormScopeChipPicker
                selectedFormIds={formData.appearsOnFormIds || []}
                onChange={(formIds) => {
                  updateFormData({ appearsOnFormIds: formIds })
                }}
              />
              
              {/* Same logic toggle */}
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#334155]">Same logic for all selected forms</p>
                  <p className="mt-0.5 text-xs text-[#64748b]">
                    When off, configure mapping per form using the tabs below.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sameLogicForAllForms}
                  onClick={handleToggleSameLogic}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 ${
                    sameLogicForAllForms ? "bg-[#7c3aed]" : "bg-[#d1d5db]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      sameLogicForAllForms ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Section 1: Identity & Metadata */}
            <section
              id="section-identity"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Identity & metadata
              </h2>
              
              <div className="space-y-5">
                {/* Logical field name */}
                <div>
                  <label 
                    htmlFor="logicalName" 
                    className="mb-1.5 block text-sm font-medium text-[#334155]"
                  >
                    Logical field name
                  </label>
                  <input
                    id="logicalName"
                    type="text"
                    value={formData.logicalName || ""}
                    onChange={(e) => updateFormData({ logicalName: e.target.value, name: e.target.value })}
                    placeholder="e.g., IFO ROB"
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  />
                </div>

                {/* Target system (read-only) */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                    Target system
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-3 py-1.5 text-sm font-medium text-[#7c3aed]">
                      {activeSystem.name}
                    </span>
                    <span className="text-xs text-[#94a3b8]">Read-only in v0</span>
                  </div>
                </div>

                {/* Data type dropdown */}
                <div>
                  <label 
                    htmlFor="dataType" 
                    className="mb-1.5 block text-sm font-medium text-[#334155]"
                  >
                    Data type
                  </label>
                  <div className="relative">
                    <select
                      id="dataType"
                      value={formData.dataType || "text"}
                      onChange={(e) => {
                        const newType = e.target.value as FieldDefinition["dataType"]
                        updateFormData({ 
                          dataType: newType,
                          // Clear unit if not applicable
                          unit: (newType === "number" || newType === "duration") ? formData.unit : undefined
                        })
                      }}
                      className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-10 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    >
                      <option value="number">Number</option>
                      <option value="text">Text</option>
                      <option value="datetime">Datetime</option>
                      <option value="enum">Enum</option>
                      <option value="latlong">Lat/Long</option>
                      <option value="duration">Duration</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                  </div>
                </div>

                {/* Unit (only for number/duration) */}
                {(formData.dataType === "number" || formData.dataType === "duration") && (
                  <div>
                    <label 
                      htmlFor="unit" 
                      className="mb-1.5 block text-sm font-medium text-[#334155]"
                    >
                      Unit
                    </label>
                    <input
                      id="unit"
                      type="text"
                      value={formData.unit || ""}
                      onChange={(e) => updateFormData({ unit: e.target.value || undefined })}
                      placeholder="e.g., kts, nm, MT, hrs"
                      className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    />
                  </div>
                )}

                {/* Toggles section */}
                <div className="space-y-4 pt-2">
                  {/* Criticality toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#334155]">Critical field</p>
                      <p className="text-xs text-[#64748b]">
                        Critical fields must be manually verified by crew before submitting.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isCritical}
                      onClick={() => updateFormData({ isCritical: !formData.isCritical })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 ${
                        formData.isCritical ? "bg-[#7c3aed]" : "bg-[#d1d5db]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.isCritical ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mandatory toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#334155]">Mandatory field</p>
                      <p className="text-xs text-[#64748b]">
                        Mandatory fields must have a value before the form can be submitted.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isMandatory}
                      onClick={() => updateFormData({ isMandatory: !formData.isMandatory })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 ${
                        formData.isMandatory ? "bg-[#7c3aed]" : "bg-[#d1d5db]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.isMandatory ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  
                </div>
              </div>
            </section>

            {/* Section 2: Mapping */}
            <TabbedSection
              id="mapping"
              title="Mapping"
              isTabbedMode={!sameLogicForAllForms}
              forms={selectedForms}
              activeFormId={activeFormTab}
              onTabChange={setActiveFormTab}
            >
              <div className="space-y-6">
                {/* Transform type picker */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#334155]">
                    Transform type
                  </label>
                  <TransformTypePicker
                    value={getCurrentTransformType()}
                    onChange={(type) => {
                      handleTransformTypeChange(
                        type,
                        sameLogicForAllForms ? undefined : activeFormTab || undefined
                      )
                    }}
                  />
                  <p className="mt-2 text-xs text-[#64748b]">
                    Select how this field&apos;s value is derived from source data.
                  </p>
                </div>

                {/* Transform-specific configuration */}
                {getCurrentTransformType() === null && (
                  <div className="rounded-lg border border-dashed border-[#d1d5db] bg-[#f8fafc] p-8 text-center">
                    <p className="text-sm text-[#64748b]">
                      Select a transform type above to configure the mapping.
                    </p>
                  </div>
                )}

                {getCurrentTransformType() === 'direct' && (
                  <div className="space-y-4">
                    {/* Source form dropdown */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Source form <span className="text-[#ef4444]">*</span>
                      </label>
                      <SourceFormDropdown
                        value={getCurrentDirectConfig().sourceForm}
                        onChange={(value) => updateDirectConfig({ sourceForm: value })}
                      />
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select which NAVTOR report type to read from.
                      </p>
                    </div>

                    {/* Source field autocomplete */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Source field <span className="text-[#ef4444]">*</span>
                      </label>
                      <SourceFieldAutocomplete
                        value={getCurrentDirectConfig().sourceField}
                        onChange={(value) => updateDirectConfig({ sourceField: value })}
                        placeholder="Search for a source field..."
                      />
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select one NAVTOR field path to map directly to this field.
                      </p>
                    </div>
                  </div>
                )}

                {getCurrentTransformType() === 'lookup' && (
                  <div className="space-y-4">
                    {/* Source form dropdown */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Source form <span className="text-[#ef4444]">*</span>
                      </label>
                      <SourceFormDropdown
                        value={getCurrentLookupConfig().sourceForm}
                        onChange={(value) => updateLookupConfig({ sourceForm: value })}
                      />
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select which NAVTOR report type to read from.
                      </p>
                    </div>

                    {/* Source field autocomplete */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Source field <span className="text-[#ef4444]">*</span>
                      </label>
                      <SourceFieldAutocomplete
                        value={getCurrentLookupConfig().sourceField}
                        onChange={(value) => updateLookupConfig({ sourceField: value })}
                        placeholder="Search for a source field..."
                      />
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select the source field whose value will be looked up.
                      </p>
                    </div>

                    {/* Lookup table dropdown */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Lookup table <span className="text-[#ef4444]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={getCurrentLookupConfig().lookupTableId}
                          onChange={(e) => updateLookupConfig({ lookupTableId: e.target.value })}
                          className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 pr-10 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        >
                          <option value="">Select lookup table...</option>
                          {lookupTables.map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                      </div>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select a lookup table to map source values to target values.
                      </p>
                    </div>

                    {/* Lookup table preview */}
                    {getCurrentLookupConfig().lookupTableId && (
                      <LookupTablePreview 
                        tableId={getCurrentLookupConfig().lookupTableId} 
                      />
                    )}
                  </div>
                )}

                {getCurrentTransformType() === 'aggregation' && (
                  <div className="space-y-4">
                    {/* Source form dropdown */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Source form <span className="text-[#ef4444]">*</span>
                      </label>
                      <SourceFormDropdown
                        value={getCurrentAggregationConfig().sourceForm}
                        onChange={(value) => updateAggregationConfig({ sourceForm: value })}
                      />
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select which NAVTOR report type to read from.
                      </p>
                    </div>

                    {/* Operator dropdown */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Operator <span className="text-[#ef4444]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={getCurrentAggregationConfig().operator}
                          onChange={(e) => updateAggregationConfig({ operator: e.target.value as AggregationOperator | '' })}
                          className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 pr-10 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        >
                          <option value="">Select operator...</option>
                          <option value="sum">Sum</option>
                          <option value="average">Average</option>
                          <option value="concat">Concat</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                      </div>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select how to aggregate the source field values.
                      </p>
                    </div>

                    {/* Source fields - repeatable list */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Source fields <span className="text-[#ef4444]">*</span>
                        <span className="ml-1 font-normal text-[#64748b]">(min 2)</span>
                      </label>
                      <div className="space-y-2">
                        {getCurrentAggregationConfig().sourceFields.map((field, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-1">
                              <SourceFieldAutocomplete
                                value={field}
                                onChange={(value) => updateAggregationSourceField(index, value)}
                                placeholder={`Source field ${index + 1}...`}
                              />
                            </div>
                            {getCurrentAggregationConfig().sourceFields.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeAggregationSourceField(index)}
                                className="flex-shrink-0 rounded-lg p-2 text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {/* Add source field button */}
                        <button
                          type="button"
                          onClick={addAggregationSourceField}
                          className="flex items-center gap-2 rounded-lg border border-dashed border-[#d1d5db] px-3 py-2 text-sm text-[#64748b] hover:border-[#7c3aed] hover:bg-[#f8fafc] hover:text-[#7c3aed]"
                        >
                          <Plus className="h-4 w-4" />
                          Add source field
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Select two or more source fields to aggregate.
                      </p>
                    </div>

                    {/* Separator input - only for concat */}
                    {getCurrentAggregationConfig().operator === 'concat' && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                          Separator
                        </label>
                        <input
                          type="text"
                          value={getCurrentAggregationConfig().separator}
                          onChange={(e) => updateAggregationConfig({ separator: e.target.value })}
                          placeholder=" "
                          className="w-32 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        />
                        <p className="mt-1 text-xs text-[#64748b]">
                          Character(s) to insert between concatenated values. Default is a space.
                        </p>
                      </div>
                    )}

                    {/* Validation message */}
                    {getCurrentAggregationConfig().sourceFields.filter(f => f).length < 2 && (
                      <div className="rounded-lg border border-[#fef3c7] bg-[#fffbeb] px-3 py-2">
                        <p className="text-xs text-[#92400e]">
                          At least 2 source fields are required for any aggregation.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {getCurrentTransformType() === 'formula' && (
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <p className="text-sm text-[#64748b]">
                      Formula transform configuration will be added in Prompt 13.
                    </p>
                  </div>
                )}

                {getCurrentTransformType() === 'constant' && (
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <p className="text-sm text-[#64748b]">
                      Constant transform configuration will be added in Prompt 14.
                    </p>
                  </div>
                )}

                {getCurrentTransformType() === 'manual' && (
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <p className="text-sm text-[#64748b]">
                      Manual transform configuration will be added in Prompt 15.
                    </p>
                  </div>
                )}
              </div>
            </TabbedSection>

            {/* Section 3: Conditions */}
            <TabbedSection
              id="conditions"
              title="Conditions"
              isTabbedMode={!sameLogicForAllForms}
              forms={selectedForms}
              activeFormId={activeFormTab}
              onTabChange={setActiveFormTab}
            >
              <div className="space-y-8">
                {/* A) Validation Rules */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[#334155]">Validation rules</h3>
                    <p className="mt-0.5 text-xs text-[#64748b]">
                      Define rules to validate this field before submission
                    </p>
                  </div>
                  
                  {/* Rules list */}
                  <div className="space-y-3">
                    {(formData.validationRules || []).map((rule, index) => (
                      <ValidationRuleRow
                        key={rule.id}
                        rule={rule}
                        onChange={(updatedRule) => {
                          const newRules = [...(formData.validationRules || [])]
                          newRules[index] = updatedRule
                          updateFormData({ validationRules: newRules })
                        }}
                        onDelete={() => {
                          const newRules = (formData.validationRules || []).filter((_, i) => i !== index)
                          updateFormData({ validationRules: newRules })
                        }}
                      />
                    ))}
                    
                    {/* Add rule button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newRule: ValidationRule = {
                          id: `rule-${Date.now()}`,
                          kind: 'between',
                          config: { min: 0, max: 100 },
                          severity: 'warn',
                        }
                        updateFormData({ 
                          validationRules: [...(formData.validationRules || []), newRule] 
                        })
                      }}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-[#d1d5db] px-3 py-2 text-sm text-[#64748b] hover:border-[#7c3aed] hover:bg-[#f8fafc] hover:text-[#7c3aed]"
                    >
                      <Plus className="h-4 w-4" />
                      Add rule
                    </button>
                  </div>
                </div>

                {/* B) Advanced Expression */}
                <AdvancedExpressionEditor
                  expression={formData.advancedExpression || ""}
                  severity={formData.advancedExpressionSeverity || "warn"}
                  onExpressionChange={(expr) => updateFormData({ advancedExpression: expr })}
                  onSeverityChange={(sev) => updateFormData({ advancedExpressionSeverity: sev })}
                />
              </div>
            </TabbedSection>

            {/* Section 4: Notes */}
            <TabbedSection
              id="notes"
              title="Notes"
              isTabbedMode={!sameLogicForAllForms}
              forms={selectedForms}
              activeFormId={activeFormTab}
              onTabChange={setActiveFormTab}
            >
              <p className="text-sm text-[#64748b]">
                Add internal notes about this field definition for your team.
              </p>
            </TabbedSection>

            {/* Section 5: Check */}
            <TabbedSection
              id="check"
              title="Check"
              isTabbedMode={!sameLogicForAllForms}
              forms={selectedForms}
              activeFormId={activeFormTab}
              onTabChange={setActiveFormTab}
            >
              <p className="text-sm text-[#64748b]">
                Define validation checks for this field.
              </p>
            </TabbedSection>

            {/* Section 6: Test */}
            <TabbedSection
              id="test"
              title="Test"
              isTabbedMode={!sameLogicForAllForms}
              forms={selectedForms}
              activeFormId={activeFormTab}
              onTabChange={setActiveFormTab}
            >
              <FieldTestPanel 
                fieldId={fieldId || ""} 
                dataType={formData.dataType || "text"}
                definitionVersion={formData.version || 1}
              />
            </TabbedSection>

            {/* Section 7: Activity - NOT tabbed, unified timeline */}
            <section
              id="section-activity"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Activity
              </h2>
              <p className="text-sm text-[#64748b]">
                View the audit log and activity history for this field.
              </p>
            </section>
          </div>
        </main>
      </div>

      {/* Confirmation Dialog for switching to shared logic */}
      {showSharedLogicConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fef3c7]">
                <AlertCircle className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#0f172a]">Switch to shared logic?</h4>
                <p className="mt-2 text-sm text-[#64748b]">
                  The configuration from <span className="font-medium text-[#334155]">{selectedForms[0]?.name || "the first form"}</span> will apply to all forms. The other tabs&apos; configurations will be discarded.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSharedLogicConfirm(false)}
                className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSharedLogic}
                className="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for changing transform type */}
      {showTransformChangeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fef3c7]">
                <AlertCircle className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#0f172a]">Change transform type?</h4>
                <p className="mt-2 text-sm text-[#64748b]">
                  Switching to <span className="font-medium text-[#334155]">{showTransformChangeConfirm.newType}</span> will clear any existing mapping configuration for this transform.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTransformChangeConfirm(null)}
                className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showTransformChangeConfirm) {
                    applyTransformTypeChange(
                      showTransformChangeConfirm.newType,
                      showTransformChangeConfirm.formId
                    )
                  }
                }}
                className="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Transform type picker - segmented control for selecting mapping transform
type TransformTypeOption = 'direct' | 'lookup' | 'aggregation' | 'formula' | 'constant' | 'manual'

const transformTypeOptions: { value: TransformTypeOption; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'lookup', label: 'Lookup' },
  { value: 'aggregation', label: 'Aggregation' },
  { value: 'formula', label: 'Formula' },
  { value: 'constant', label: 'Constant' },
  { value: 'manual', label: 'Manual' },
]

interface TransformTypePickerProps {
  value: TransformTypeOption | null
  onChange: (type: TransformTypeOption) => void
}

function TransformTypePicker({ value, onChange }: TransformTypePickerProps) {
  return (
    <div className="flex rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1">
      {transformTypeOptions.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "text-[#64748b] hover:bg-white hover:text-[#334155]"
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// Lookup table preview component - shows first 5 rows of a lookup table
interface LookupTablePreviewProps {
  tableId: string
}

function LookupTablePreview({ tableId }: LookupTablePreviewProps) {
  const table = lookupTables.find((t) => t.id === tableId)
  
  if (!table) {
    return (
      <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 text-center">
        <p className="text-sm text-[#94a3b8]">Lookup table not found</p>
      </div>
    )
  }

  const previewRows = table.rows.slice(0, 5)
  const hasMoreRows = table.rows.length > 5

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-[#334155]">{table.name}</h4>
          {table.description && (
            <p className="mt-0.5 text-xs text-[#64748b]">{table.description}</p>
          )}
        </div>
        <a
          href={`/admin?tab=lookup-tables&id=${table.id}`}
          className="text-xs font-medium text-[#7c3aed] hover:underline"
        >
          View full table
        </a>
      </div>
      
      {/* Preview table */}
      <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#64748b]">
                Source Value
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#64748b]">
                Target Value
              </th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, index) => (
              <tr 
                key={index} 
                className={index < previewRows.length - 1 ? "border-b border-[#e2e8f0]" : ""}
              >
                <td className="px-3 py-2 text-sm text-[#334155]">{row.sourceValue}</td>
                <td className="px-3 py-2 text-sm font-medium text-[#0f172a]">{row.targetValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {hasMoreRows && (
        <p className="mt-2 text-center text-xs text-[#94a3b8]">
          + {table.rows.length - 5} more rows
        </p>
      )}
    </div>
  )
}

// Form scope chip picker - shows all forms as selectable chips
interface FormScopeChipPickerProps {
  selectedFormIds: string[]
  onChange: (formIds: string[]) => void
}

function FormScopeChipPicker({ selectedFormIds, onChange }: FormScopeChipPickerProps) {
  const toggleForm = (formId: string) => {
    if (selectedFormIds.includes(formId)) {
      onChange(selectedFormIds.filter((id) => id !== formId))
    } else {
      onChange([...selectedFormIds, formId])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {targetForms.map((form) => {
        const isSelected = selectedFormIds.includes(form.id)
        return (
          <button
            key={form.id}
            type="button"
            onClick={() => toggleForm(form.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "bg-[#7c3aed] text-white"
                : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#334155]"
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {form.name}
          </button>
        )
      })}
    </div>
  )
}

// Form tabs component for tabbed mode (per-form configuration)
interface FormTabsProps {
  forms: typeof targetForms
  activeFormId: string | null
  onTabChange: (formId: string) => void
}

function FormTabs({ forms, activeFormId, onTabChange }: FormTabsProps) {
  if (forms.length === 0) return null

  return (
    <div className="flex gap-1 border-b border-[#e2e8f0]">
      {forms.map((form) => {
        const isActive = form.id === activeFormId
        return (
          <button
            key={form.id}
            type="button"
            onClick={() => onTabChange(form.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "text-[#7c3aed]"
                : "text-[#64748b] hover:text-[#334155]"
            }`}
          >
            {form.name}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// Wrapper component for tabbed sections
interface TabbedSectionProps {
  id: string
  title: string
  isTabbedMode: boolean
  forms: typeof targetForms
  activeFormId: string | null
  onTabChange: (formId: string) => void
  children: React.ReactNode
}

function TabbedSection({
  id,
  title,
  isTabbedMode,
  forms,
  activeFormId,
  onTabChange,
  children,
}: TabbedSectionProps) {
  return (
    <section
      id={`section-${id}`}
      className="rounded-xl border border-[#e2e8f0] bg-white"
    >
      {/* Header with optional tabs */}
      <div className={isTabbedMode ? "border-b border-[#e2e8f0]" : ""}>
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
        </div>
        {isTabbedMode && forms.length > 0 && (
          <div className="px-6 pt-4">
            <FormTabs
              forms={forms}
              activeFormId={activeFormId}
              onTabChange={onTabChange}
            />
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-6 pt-6">{children}</div>
    </section>
  )
}

// Multi-select component for forms (dropdown style, kept for reference)
interface FormsMultiSelectProps {
  selectedFormIds: string[]
  onChange: (formIds: string[]) => void
}

function FormsMultiSelect({ selectedFormIds, onChange }: FormsMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleForm = (formId: string) => {
    if (selectedFormIds.includes(formId)) {
      onChange(selectedFormIds.filter((id) => id !== formId))
    } else {
      onChange([...selectedFormIds, formId])
    }
  }

  const removeForm = (formId: string) => {
    onChange(selectedFormIds.filter((id) => id !== formId))
  }

  const selectedForms = targetForms.filter((f) => selectedFormIds.includes(f.id))

  return (
    <div className="relative">
      {/* Selected chips and input trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]"
      >
        {selectedForms.length === 0 ? (
          <span className="text-sm text-[#94a3b8]">Select forms...</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedForms.map((form) => (
              <span
                key={form.id}
                className="inline-flex items-center gap-1 rounded-full bg-[#f3e8ff] px-2.5 py-1 text-xs font-medium text-[#7c3aed]"
              >
                {form.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeForm(form.id)
                  }}
                  className="rounded-full p-0.5 hover:bg-[#e9d5ff]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg">
            {targetForms.map((form) => {
              const isSelected = selectedFormIds.includes(form.id)
              return (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => toggleForm(form.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f8fafc]"
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      isSelected
                        ? "border-[#7c3aed] bg-[#7c3aed]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={isSelected ? "text-[#0f172a] font-medium" : "text-[#334155]"}>
                    {form.name}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// NAVTOR source forms (report types)
const NAVTOR_SOURCE_FORMS = [
  { id: 'sea-report', name: 'NAVTOR Sea Report' },
  { id: 'port-report', name: 'NAVTOR Port Report' },
  { id: 'arrival-report', name: 'NAVTOR Arrival Report' },
  { id: 'departure-report', name: 'NAVTOR Departure Report' },
  { id: 'bunker-report', name: 'NAVTOR Bunker Report' },
  { id: 'noon-report', name: 'NAVTOR Noon Report' },
]

// NAVTOR source fields with full path display, grouped by section
interface NavtorFieldOption {
  path: string
  displayPath: string // Human-readable full path
  section: string
}

const NAVTOR_SOURCE_FIELDS: NavtorFieldOption[] = [
  // General section
  { path: 'voyageReporting.general.reportDate', displayPath: 'General → Report Date', section: 'General' },
  { path: 'voyageReporting.general.reportTime', displayPath: 'General → Report Time', section: 'General' },
  { path: 'voyageReporting.general.voyageNumber', displayPath: 'General → Voyage Number', section: 'General' },
  { path: 'voyageReporting.general.vesselCondition', displayPath: 'General → Vessel Condition', section: 'General' },
  { path: 'voyageReporting.general.portOfDeparture', displayPath: 'General → Port of Departure', section: 'General' },
  { path: 'voyageReporting.general.portOfDestination', displayPath: 'General → Port of Destination', section: 'General' },
  { path: 'voyageReporting.general.nextPort', displayPath: 'General → Next Port', section: 'General' },
  { path: 'voyageReporting.general.eta', displayPath: 'General → ETA', section: 'General' },
  
  // Position section
  { path: 'voyageReporting.position.latitude', displayPath: 'Position → Latitude', section: 'Position' },
  { path: 'voyageReporting.position.longitude', displayPath: 'Position → Longitude', section: 'Position' },
  
  // Distance & Speed section
  { path: 'voyageReporting.distanceAndSpeed.reportedSpeed', displayPath: 'Distance & Speed → Reported Speed', section: 'Distance & Speed' },
  { path: 'voyageReporting.distanceAndSpeed.averageSpeed', displayPath: 'Distance & Speed → Average Speed', section: 'Distance & Speed' },
  { path: 'voyageReporting.distanceAndSpeed.orderedSpeed', displayPath: 'Distance & Speed → Ordered Speed', section: 'Distance & Speed' },
  { path: 'voyageReporting.distanceAndSpeed.distanceToGo', displayPath: 'Distance & Speed → Distance To Go', section: 'Distance & Speed' },
  { path: 'voyageReporting.distanceAndSpeed.distanceSinceLastReport', displayPath: 'Distance & Speed → Distance Since Last Report', section: 'Distance & Speed' },
  { path: 'voyageReporting.distanceAndSpeed.totalDistance', displayPath: 'Distance & Speed → Total Distance', section: 'Distance & Speed' },
  { path: 'voyageReporting.distanceAndSpeed.timeSinceLastReport', displayPath: 'Distance & Speed → Time Since Last Report', section: 'Distance & Speed' },
  
  // Weather section
  { path: 'voyageReporting.weather.beaufort', displayPath: 'Weather → Beaufort Scale', section: 'Weather' },
  { path: 'voyageReporting.weather.windDirection', displayPath: 'Weather → Wind Direction', section: 'Weather' },
  { path: 'voyageReporting.weather.windSpeed', displayPath: 'Weather → Wind Speed', section: 'Weather' },
  { path: 'voyageReporting.weather.seaState', displayPath: 'Weather → Sea State', section: 'Weather' },
  { path: 'voyageReporting.weather.seaHeight', displayPath: 'Weather → Sea Height', section: 'Weather' },
  { path: 'voyageReporting.weather.seaTemperature', displayPath: 'Weather → Sea Temperature', section: 'Weather' },
  { path: 'voyageReporting.weather.swellHeight', displayPath: 'Weather → Swell Height', section: 'Weather' },
  
  // Main Engine section
  { path: 'machinery.mainEngine.rpm', displayPath: 'Power → Main Engine → RPM', section: 'Power' },
  { path: 'machinery.mainEngine.power', displayPath: 'Power → Main Engine → Power', section: 'Power' },
  { path: 'machinery.mainEngine.runningHours', displayPath: 'Power → Main Engine → Running Hours', section: 'Power' },
  { path: 'machinery.mainEngine.consumption.HFO', displayPath: 'Power → Main Engine → HFO Consumption', section: 'Power' },
  { path: 'machinery.mainEngine.consumption.MGO', displayPath: 'Power → Main Engine → MGO Consumption', section: 'Power' },
  { path: 'machinery.mainEngine.consumption.VLSFO', displayPath: 'Power → Main Engine → VLSFO Consumption', section: 'Power' },
  
  // Auxiliary Engine section
  { path: 'machinery.auxiliaryEngine.consumption.HFO', displayPath: 'Power → Auxiliary Engine → HFO Consumption', section: 'Power' },
  { path: 'machinery.auxiliaryEngine.consumption.MGO', displayPath: 'Power → Auxiliary Engine → MGO Consumption', section: 'Power' },
  { path: 'machinery.auxiliaryEngine.runningHours', displayPath: 'Power → Auxiliary Engine → Running Hours', section: 'Power' },
  
  // Generators section
  { path: 'machinery.generators.gen1.hours', displayPath: 'Power → Generator 1 → Running Hours', section: 'Power' },
  { path: 'machinery.generators.gen2.hours', displayPath: 'Power → Generator 2 → Running Hours', section: 'Power' },
  { path: 'machinery.generators.gen3.hours', displayPath: 'Power → Generator 3 → Running Hours', section: 'Power' },
  
  // Boiler section
  { path: 'machinery.boiler.hours', displayPath: 'Power → Boiler → Running Hours', section: 'Power' },
  { path: 'machinery.boiler.consumption.HFO', displayPath: 'Power → Boiler → HFO Consumption', section: 'Power' },
  { path: 'machinery.boiler.consumption.MGO', displayPath: 'Power → Boiler → MGO Consumption', section: 'Power' },
  
  // Bunkers ROB section
  { path: 'bunkers.ifo.rob', displayPath: 'Bunkers → IFO → ROB', section: 'Bunkers' },
  { path: 'bunkers.mgo.rob', displayPath: 'Bunkers → MGO → ROB', section: 'Bunkers' },
  { path: 'bunkers.lsfo.rob', displayPath: 'Bunkers → LSFO → ROB', section: 'Bunkers' },
  { path: 'bunkers.lsmgo.rob', displayPath: 'Bunkers → LSMGO → ROB', section: 'Bunkers' },
  { path: 'bunkers.vlsfo.rob', displayPath: 'Bunkers → VLSFO → ROB', section: 'Bunkers' },
  { path: 'bunkers.freshWater.rob', displayPath: 'Bunkers → Fresh Water → ROB', section: 'Bunkers' },
  
  // Bunkers Consumption section
  { path: 'bunkers.ifo.consumption.total', displayPath: 'Bunkers → IFO → Consumption Total', section: 'Bunkers' },
  { path: 'bunkers.ifo.consumption.mainEngine', displayPath: 'Bunkers → IFO → Consumption Main Engine', section: 'Bunkers' },
  { path: 'bunkers.ifo.consumption.auxiliary', displayPath: 'Bunkers → IFO → Consumption Auxiliary', section: 'Bunkers' },
  { path: 'bunkers.mgo.consumption.total', displayPath: 'Bunkers → MGO → Consumption Total', section: 'Bunkers' },
  
  // Bunkers Received section
  { path: 'bunkers.received.HFO', displayPath: 'Bunkers → Received → HFO', section: 'Bunkers' },
  { path: 'bunkers.received.MGO', displayPath: 'Bunkers → Received → MGO', section: 'Bunkers' },
  
  // Cargo section
  { path: 'cargo.totalCargo', displayPath: 'Cargo → Total Cargo', section: 'Cargo' },
  { path: 'cargo.loadedQuantity', displayPath: 'Cargo → Loaded Quantity', section: 'Cargo' },
  { path: 'cargo.dischargedQuantity', displayPath: 'Cargo → Discharged Quantity', section: 'Cargo' },
]

// Legacy flat paths for backward compatibility
const NAVTOR_PATHS = NAVTOR_SOURCE_FIELDS.map(f => f.path)

// Source Form Dropdown component
interface SourceFormDropdownProps {
  value: string
  onChange: (value: string) => void
}

function SourceFormDropdown({ value, onChange }: SourceFormDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 pr-10 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
      >
        <option value="">Select source form...</option>
        {NAVTOR_SOURCE_FORMS.map((form) => (
          <option key={form.id} value={form.id}>
            {form.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
    </div>
  )
}

// Source Field Autocomplete component with grouped sections
interface SourceFieldAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function SourceFieldAutocomplete({ value, onChange, placeholder }: SourceFieldAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Find the display path for current value
  const selectedField = NAVTOR_SOURCE_FIELDS.find(f => f.path === value)
  const displayValue = selectedField?.displayPath || value
  
  // Filter fields based on search (searches both path and displayPath)
  const filteredFields = NAVTOR_SOURCE_FIELDS.filter((field) => {
    const searchLower = search.toLowerCase()
    return (
      field.path.toLowerCase().includes(searchLower) ||
      field.displayPath.toLowerCase().includes(searchLower)
    )
  })
  
  // Group filtered fields by section
  const groupedFields = filteredFields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = []
    }
    acc[field.section].push(field)
    return acc
  }, {} as Record<string, NavtorFieldOption[]>)
  
  const handleSelect = (field: NavtorFieldOption) => {
    onChange(field.path)
    setSearch('')
    setIsOpen(false)
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <input
          type="text"
          value={isOpen ? search : displayValue}
          onChange={(e) => {
            setSearch(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            setSearch('')
          }}
          placeholder={placeholder || "Search source fields..."}
          className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      </div>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false)
              setSearch('')
            }} 
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg">
            {Object.keys(groupedFields).length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-[#94a3b8]">
                No fields found
              </p>
            ) : (
              Object.entries(groupedFields).map(([section, fields]) => (
                <div key={section}>
                  <div className="sticky top-0 bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    {section}
                  </div>
                  {fields.map((field) => (
                    <button
                      key={field.path}
                      type="button"
                      onClick={() => handleSelect(field)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] ${
                        field.path === value ? "bg-[#f3e8ff] text-[#7c3aed]" : "text-[#334155]"
                      }`}
                    >
                      {field.displayPath}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface NavtorPathPickerProps {
  value: string
  onChange: (value: string) => void
}

function NavtorPathPicker({ value, onChange }: NavtorPathPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value)

  const filteredPaths = NAVTOR_PATHS.filter((path) =>
    path.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (path: string) => {
    onChange(path)
    setSearch(path)
    setIsOpen(false)
  }

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="voyageReporting.general.reportDate"
        className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 font-mono text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
      />
      
      {isOpen && filteredPaths.length > 0 && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false)
              if (!NAVTOR_PATHS.includes(search)) {
                onChange(search) // Allow custom paths
              }
            }} 
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg">
            {filteredPaths.slice(0, 10).map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => handleSelect(path)}
                className={`w-full px-3 py-2 text-left font-mono text-sm hover:bg-[#f8fafc] ${
                  path === value ? "bg-[#f3e8ff] text-[#7c3aed]" : "text-[#334155]"
                }`}
              >
                {path}
              </button>
            ))}
            {filteredPaths.length > 10 && (
              <p className="px-3 py-2 text-xs text-[#94a3b8]">
                +{filteredPaths.length - 10} more results
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Rule kinds configuration
const RULE_KINDS: { value: ValidationRule['kind']; label: string }[] = [
  { value: 'sum_equals', label: 'Sum equals' },
  { value: 'between', label: 'Between' },
  { value: 'regex', label: 'Regex' },
  { value: 'enum', label: 'Enum' },
  { value: 'cross_field_equals', label: 'Cross-field equals' },
]

// Generate description from rule
function getRuleDescription(rule: ValidationRule): string {
  switch (rule.kind) {
    case 'sum_equals':
      const sumFields = (rule.config.sourceFields as string[] || []).join(' + ')
      const target = rule.config.targetField as string || 'target'
      return sumFields ? `${sumFields} must equal ${target}` : 'Configure sum fields'
    case 'between':
      return `Value must be between ${rule.config.min ?? '?'} and ${rule.config.max ?? '?'}`
    case 'regex':
      return rule.config.pattern ? `Must match pattern: ${rule.config.pattern}` : 'Configure regex pattern'
    case 'enum':
      const values = rule.config.allowedValues as string[] || []
      return values.length > 0 ? `Must be one of: ${values.join(', ')}` : 'Configure allowed values'
    case 'cross_field_equals':
      return rule.config.otherField ? `Must equal ${rule.config.otherField}` : 'Configure field reference'
    default:
      return 'Configure rule'
  }
}

interface ValidationRuleRowProps {
  rule: ValidationRule
  onChange: (rule: ValidationRule) => void
  onDelete: () => void
}

function ValidationRuleRow({ rule, onChange, onDelete }: ValidationRuleRowProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
      {/* Rule header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          {/* Kind dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={rule.kind}
                onChange={(e) => {
                  const newKind = e.target.value as ValidationRule['kind']
                  onChange({ 
                    ...rule, 
                    kind: newKind,
                    config: getDefaultConfig(newKind)
                  })
                }}
                className="appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 pr-8 text-sm font-medium text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              >
                {RULE_KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            </div>
            
            {/* Severity toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-1">
              <button
                type="button"
                onClick={() => onChange({ ...rule, severity: 'block' })}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  rule.severity === 'block'
                    ? 'bg-[#fef2f2] text-[#dc2626]'
                    : 'text-[#64748b] hover:bg-[#f1f5f9]'
                }`}
              >
                Block
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...rule, severity: 'warn' })}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  rule.severity === 'warn'
                    ? 'bg-[#fef9c3] text-[#a16207]'
                    : 'text-[#64748b] hover:bg-[#f1f5f9]'
                }`}
              >
                Warn
              </button>
            </div>
          </div>
          
          {/* Description preview */}
          <p className="text-sm text-[#64748b]">
            {getRuleDescription(rule)}
          </p>
          
          {/* Configuration fields */}
          {isExpanded && (
            <div className="pt-2">
              <RuleConfigEditor rule={rule} onChange={onChange} />
            </div>
          )}
        </div>
        
        {/* Delete button */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 rounded-lg p-2 text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function getDefaultConfig(kind: ValidationRule['kind']): Record<string, unknown> {
  switch (kind) {
    case 'sum_equals':
      return { sourceFields: [], targetField: '' }
    case 'between':
      return { min: 0, max: 100 }
    case 'regex':
      return { pattern: '' }
    case 'enum':
      return { allowedValues: [] }
    case 'cross_field_equals':
      return { otherField: '' }
    default:
      return {}
  }
}

interface RuleConfigEditorProps {
  rule: ValidationRule
  onChange: (rule: ValidationRule) => void
}

function RuleConfigEditor({ rule, onChange }: RuleConfigEditorProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({ ...rule, config: { ...rule.config, ...updates } })
  }

  switch (rule.kind) {
    case 'between':
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={rule.config.min as number ?? ''}
            onChange={(e) => updateConfig({ min: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Min"
            className="w-24 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
          <span className="text-sm text-[#64748b]">to</span>
          <input
            type="number"
            value={rule.config.max as number ?? ''}
            onChange={(e) => updateConfig({ max: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Max"
            className="w-24 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
        </div>
      )

    case 'regex':
      return (
        <input
          type="text"
          value={rule.config.pattern as string ?? ''}
          onChange={(e) => updateConfig({ pattern: e.target.value })}
          placeholder="^[A-Z]{3}[0-9]{4}$"
          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 font-mono text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      )

    case 'enum':
      return (
        <EnumValuesEditor
          values={rule.config.allowedValues as string[] || []}
          onChange={(values) => updateConfig({ allowedValues: values })}
        />
      )

    case 'sum_equals':
      return (
        <div className="space-y-2">
          <FieldReferencePicker
            label="Source fields (to sum)"
            values={rule.config.sourceFields as string[] || []}
            onChange={(fields) => updateConfig({ sourceFields: fields })}
            multiple
          />
          <FieldReferencePicker
            label="Target field (equals)"
            values={rule.config.targetField ? [rule.config.targetField as string] : []}
            onChange={(fields) => updateConfig({ targetField: fields[0] || '' })}
          />
        </div>
      )

    case 'cross_field_equals':
      return (
        <FieldReferencePicker
          label="Must equal field"
          values={rule.config.otherField ? [rule.config.otherField as string] : []}
          onChange={(fields) => updateConfig({ otherField: fields[0] || '' })}
        />
      )

    default:
      return null
  }
}

interface EnumValuesEditorProps {
  values: string[]
  onChange: (values: string[]) => void
}

function EnumValuesEditor({ values, onChange }: EnumValuesEditorProps) {
  const [inputValue, setInputValue] = useState('')

  const addValue = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()])
      setInputValue('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 rounded-full bg-[#e0e7ff] px-2.5 py-1 text-xs font-medium text-[#4338ca]"
          >
            {val}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== val))}
              className="rounded-full p-0.5 hover:bg-[#c7d2fe]"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addValue()
            }
          }}
          placeholder="Add allowed value..."
          className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
        <button
          type="button"
          onClick={addValue}
          className="rounded-lg bg-[#7c3aed] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6d28d9]"
        >
          Add
        </button>
      </div>
    </div>
  )
}

interface FieldReferencePickerProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  multiple?: boolean
}

function FieldReferencePicker({ label, values, onChange, multiple = false }: FieldReferencePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredFields = fieldDefinitions.filter((fd) =>
    fd.logicalName.toLowerCase().includes(search.toLowerCase())
  )

  const toggleField = (fieldId: string) => {
    if (multiple) {
      if (values.includes(fieldId)) {
        onChange(values.filter((v) => v !== fieldId))
      } else {
        onChange([...values, fieldId])
      }
    } else {
      onChange([fieldId])
      setIsOpen(false)
    }
  }

  const selectedNames = values
    .map((id) => fieldDefinitions.find((fd) => fd.id === id)?.logicalName || id)
    .join(', ')

  return (
    <div className="space-y-1">
      <label className="text-xs text-[#64748b]">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-left text-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        >
          {selectedNames || <span className="text-[#94a3b8]">Select field(s)...</span>}
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
              <div className="border-b border-[#e2e8f0] p-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search fields..."
                  className="w-full rounded border border-[#e2e8f0] px-2 py-1 text-sm focus:border-[#7c3aed] focus:outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {filteredFields.slice(0, 20).map((fd) => {
                  const isSelected = values.includes(fd.id)
                  return (
                    <button
                      key={fd.id}
                      type="button"
                      onClick={() => toggleField(fd.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f8fafc]"
                    >
                      {multiple && (
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            isSelected ? 'border-[#7c3aed] bg-[#7c3aed]' : 'border-[#d1d5db]'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      )}
                      <span className={isSelected ? 'font-medium text-[#7c3aed]' : 'text-[#334155]'}>
                        {fd.logicalName}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Advanced Expression Editor
interface AdvancedExpressionEditorProps {
  expression: string
  severity: 'block' | 'warn'
  onExpressionChange: (expr: string) => void
  onSeverityChange: (sev: 'block' | 'warn') => void
}

function AdvancedExpressionEditor({ 
  expression, 
  severity, 
  onExpressionChange, 
  onSeverityChange 
}: AdvancedExpressionEditorProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null)

  const validateExpression = () => {
    if (!expression.trim()) {
      setValidationResult({ valid: false, message: 'Expression is empty' })
      return
    }
    
    // Simple validation - check for balanced parentheses and valid syntax
    const parenCount = (expression.match(/\(/g) || []).length - (expression.match(/\)/g) || []).length
    if (parenCount !== 0) {
      setValidationResult({ valid: false, message: 'Unbalanced parentheses' })
      return
    }
    
    // Check for field references
    const fieldRefs = expression.match(/\$\{[^}]+\}/g) || []
    const invalidRefs = fieldRefs.filter((ref) => {
      const fieldId = ref.slice(2, -1)
      return !fieldDefinitions.some((fd) => fd.id === fieldId || fd.logicalName === fieldId)
    })
    
    if (invalidRefs.length > 0) {
      setValidationResult({ valid: false, message: `Unknown field reference: ${invalidRefs[0]}` })
      return
    }
    
    setValidationResult({ valid: true, message: 'Expression is valid' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#334155]">Advanced expression</h3>
          <p className="mt-0.5 text-xs text-[#64748b]">
            Write custom validation logic the rule builder can&apos;t express
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-1 text-sm text-[#7c3aed] hover:underline"
        >
          <HelpCircle className="h-4 w-4" />
          Expression reference
        </button>
      </div>
      
      {/* Code editor */}
      <div className="relative">
        <textarea
          value={expression}
          onChange={(e) => {
            onExpressionChange(e.target.value)
            setValidationResult(null)
          }}
          placeholder="${field.IFO_ROB} + ${field.MGO_ROB} >= 100 AND ${field.Speed} <= 25"
          rows={4}
          className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-[#1e1e1e] px-4 py-3 font-mono text-sm text-[#d4d4d4] placeholder:text-[#6b6b6b] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      </div>
      
      {/* Validation result */}
      {validationResult && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            validationResult.valid
              ? 'bg-[#f0fdf4] text-[#166534]'
              : 'bg-[#fef2f2] text-[#dc2626]'
          }`}
        >
          {validationResult.valid ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {validationResult.message}
        </div>
      )}
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Severity toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Severity:</span>
          <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-1">
            <button
              type="button"
              onClick={() => onSeverityChange('block')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                severity === 'block'
                  ? 'bg-[#fef2f2] text-[#dc2626]'
                  : 'text-[#64748b] hover:bg-[#f1f5f9]'
              }`}
            >
              Block
            </button>
            <button
              type="button"
              onClick={() => onSeverityChange('warn')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                severity === 'warn'
                  ? 'bg-[#fef9c3] text-[#a16207]'
                  : 'text-[#64748b] hover:bg-[#f1f5f9]'
              }`}
            >
              Warn
            </button>
          </div>
        </div>
        
        {/* Validate button */}
        <button
          type="button"
          onClick={validateExpression}
          className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
        >
          Validate expression
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#0f172a]">Expression Reference</h4>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <h5 className="font-medium text-[#334155]">Field References</h5>
                <p className="text-[#64748b]">Use <code className="rounded bg-[#f1f5f9] px-1 py-0.5 font-mono text-xs">{`\${field.ID}`}</code> or <code className="rounded bg-[#f1f5f9] px-1 py-0.5 font-mono text-xs">{`\${field.LogicalName}`}</code></p>
              </div>
              
              <div>
                <h5 className="font-medium text-[#334155]">Arithmetic Operators</h5>
                <p className="text-[#64748b]"><code className="font-mono">+</code> <code className="font-mono">-</code> <code className="font-mono">*</code> <code className="font-mono">/</code> <code className="font-mono">()</code></p>
              </div>
              
              <div>
                <h5 className="font-medium text-[#334155]">Comparison Operators</h5>
                <p className="text-[#64748b]"><code className="font-mono">==</code> <code className="font-mono">!=</code> <code className="font-mono">&lt;</code> <code className="font-mono">&gt;</code> <code className="font-mono">&lt;=</code> <code className="font-mono">&gt;=</code></p>
              </div>
              
              <div>
                <h5 className="font-medium text-[#334155]">Logical Operators</h5>
                <p className="text-[#64748b]"><code className="font-mono">AND</code> <code className="font-mono">OR</code> <code className="font-mono">NOT</code></p>
              </div>
              
              <div className="rounded-lg bg-[#f8fafc] p-3">
                <h5 className="font-medium text-[#334155]">Example</h5>
                <code className="text-xs text-[#64748b]">{`\${field.IFO_ROB} + \${field.MGO_ROB} >= 100 AND \${field.Speed} <= 25`}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mock NAVTOR reports for test picker
const MOCK_REPORTS = [
  { id: "RPT-2024-001", vesselId: "vessel-001", vesselName: "SEAWAYS SKOPELOS", date: "2024-01-15", type: "Noon (Sea)" },
  { id: "RPT-2024-002", vesselId: "vessel-002", vesselName: "SEAWAYS ANDROMEDA", date: "2024-01-15", type: "Arrival" },
  { id: "RPT-2024-003", vesselId: "vessel-003", vesselName: "SEAWAYS ZENITH", date: "2024-01-14", type: "Departure" },
  { id: "RPT-2024-004", vesselId: "vessel-001", vesselName: "SEAWAYS SKOPELOS", date: "2024-01-14", type: "Noon (Sea)" },
  { id: "RPT-2024-005", vesselId: "vessel-004", vesselName: "SEAWAYS ORION", date: "2024-01-13", type: "Bunkering" },
  { id: "RPT-2024-006", vesselId: "vessel-005", vesselName: "SEAWAYS PERSEUS", date: "2024-01-13", type: "Noon (Port)" },
  { id: "RPT-2024-007", vesselId: "vessel-002", vesselName: "SEAWAYS ANDROMEDA", date: "2024-01-12", type: "Noon (Sea)" },
  { id: "RPT-2024-008", vesselId: "vessel-006", vesselName: "SEAWAYS ATLAS", date: "2024-01-12", type: "SOF" },
]

interface FieldTestPanelProps {
  fieldId: string
  dataType: FieldDefinition["dataType"]
  definitionVersion: number
}

function FieldTestPanel({ fieldId, dataType, definitionVersion }: FieldTestPanelProps) {
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [expectedValue, setExpectedValue] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [runProgress, setRunProgress] = useState<Array<"pending" | "success" | "fail">>([])
  const [testResult, setTestResult] = useState<{
    correctCount: number
    outputs: Array<{ value: string; correct: boolean }>
  } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [showFullSetModal, setShowFullSetModal] = useState(false)
  const [isRunningFullSet, setIsRunningFullSet] = useState(false)
  const [fullSetResults, setFullSetResults] = useState<Array<{
    reportId: string
    vesselName: string
    score: number
    passed: boolean
  }>>([])

  // Get test history for this field
  const testHistory = fieldId ? getTestRunsForField(fieldId) : []

  const handleRunTest = async () => {
    if (!selectedReport || !expectedValue) return

    setIsRunning(true)
    setTestResult(null)
    setRunProgress(Array(10).fill("pending"))

    // Simulate 10 test runs with delays
    const outputs: Array<{ value: string; correct: boolean }> = []
    
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))
      
      // Simulate extraction result - mostly correct with some variance
      const variance = Math.random()
      let extractedValue: string
      let isCorrect: boolean
      
      if (dataType === "number") {
        const expected = parseFloat(expectedValue)
        if (variance > 0.15) {
          extractedValue = expectedValue
          isCorrect = true
        } else {
          // Introduce small variance for numeric fields
          const offset = (Math.random() - 0.5) * expected * 0.1
          extractedValue = (expected + offset).toFixed(2)
          isCorrect = false
        }
      } else {
        isCorrect = variance > 0.1
        extractedValue = isCorrect ? expectedValue : `${expectedValue}_variant`
      }
      
      outputs.push({ value: extractedValue, correct: isCorrect })
      
      setRunProgress((prev) => {
        const newProgress = [...prev]
        newProgress[i] = isCorrect ? "success" : "fail"
        return newProgress
      })
    }

    const correctCount = outputs.filter((o) => o.correct).length
    setTestResult({ correctCount, outputs })
    setIsRunning(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-[#22c55e]"
    if (score >= 6) return "text-[#eab308]"
    return "text-[#ef4444]"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 9) return "bg-[#f0fdf4]"
    if (score >= 6) return "bg-[#fef9c3]"
    return "bg-[#fef2f2]"
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Run against full test set
  const handleRunFullSet = async () => {
    setShowFullSetModal(true)
    setIsRunningFullSet(true)
    setFullSetResults([])

    // Get test reports that have this field
    const relevantReports = testReports.filter(r => 
      r.expectedValues.some(ev => ev.fieldId === fieldId)
    )

    const results: typeof fullSetResults = []

    for (const report of relevantReports) {
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
      
      // Simulate test score
      const score = Math.random() > 0.15 ? 8 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 4)
      
      results.push({
        reportId: report.id,
        vesselName: report.vesselName,
        score,
        passed: score >= 8,
      })
      
      setFullSetResults([...results])
    }

    setIsRunningFullSet(false)
  }

  return (
    <div className="space-y-6">
      {/* Instructional text */}
      <div className="rounded-lg bg-[#f8fafc] px-4 py-3">
        <p className="text-sm text-[#64748b]">
          Run the field&apos;s extraction logic against a source report 10 times and compare to the expected value. 
          Use this to verify consistency before deploying changes.
        </p>
      </div>

      {/* Test inputs */}
      <div className="space-y-4">
        {/* Source report picker */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#334155]">
            Source report
          </label>
          <ReportPicker
            selectedReportId={selectedReport}
            onChange={setSelectedReport}
          />
        </div>

        {/* Expected value input - data-type-aware */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#334155]">
            Expected value
          </label>
          <ExpectedValueInput
            dataType={dataType}
            value={expectedValue}
            onChange={setExpectedValue}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRunTest}
            disabled={!selectedReport || !expectedValue || isRunning}
            className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Run x10
          </button>
          <button
            type="button"
            onClick={handleRunFullSet}
            disabled={isRunning || isRunningFullSet}
            className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Run against full set
          </button>
        </div>
      </div>

      {/* Full Set Results Modal */}
      {showFullSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Full set test results</h3>
                <p className="text-sm text-[#64748b]">Definition v{definitionVersion}</p>
              </div>
              <button
                onClick={() => setShowFullSetModal(false)}
                disabled={isRunningFullSet}
                className="rounded-lg p-1 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Summary */}
              {fullSetResults.length > 0 && (
                <div className={`mb-4 rounded-lg p-4 ${
                  fullSetResults.filter(r => r.passed).length === fullSetResults.length 
                    ? "bg-[#f0fdf4]" 
                    : "bg-[#fef9c3]"
                }`}>
                  <p className="text-lg font-bold text-[#0f172a]">
                    Passed {fullSetResults.filter(r => r.passed).length}/{fullSetResults.length} reports
                  </p>
                  <p className="text-sm text-[#64748b]">
                    {isRunningFullSet ? "Running tests..." : "All tests complete"}
                  </p>
                </div>
              )}

              {/* Results list */}
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {fullSetResults.map((result, idx) => (
                  <div
                    key={result.reportId}
                    className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-[#334155]">
                        {result.reportId}
                      </p>
                      <p className="text-xs text-[#64748b]">{result.vesselName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${getScoreColor(result.score)}`}>
                        {result.score}/10
                      </span>
                      {result.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                      ) : (
                        <X className="h-5 w-5 text-[#ef4444]" />
                      )}
                    </div>
                  </div>
                ))}

                {isRunningFullSet && fullSetResults.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#64748b]">Starting tests...</p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-[#e2e8f0] px-6 py-4">
              <button
                onClick={() => setShowFullSetModal(false)}
                disabled={isRunningFullSet}
                className="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {(isRunning || runProgress.length > 0) && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#334155]">Progress</p>
          <div className="flex gap-1.5">
            {runProgress.map((status, index) => (
              <div
                key={index}
                className={`h-8 w-8 rounded-lg transition-colors ${
                  status === "pending"
                    ? "bg-[#e2e8f0]"
                    : status === "success"
                      ? "bg-[#22c55e]"
                      : "bg-[#ef4444]"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results card */}
      {testResult && (
        <div className={`rounded-xl border p-5 ${getScoreBgColor(testResult.correctCount)}`}>
          {/* Big score stat */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className={`text-4xl font-bold ${getScoreColor(testResult.correctCount)}`}>
                {testResult.correctCount}/10
              </p>
              <p className="text-sm text-[#64748b]">correct extractions</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#94a3b8]">Definition version</p>
              <p className="text-sm font-medium text-[#64748b]">v{definitionVersion}</p>
            </div>
          </div>

          {/* Expected value pinned at top */}
          <div className="mb-3 rounded-lg bg-white px-3 py-2 border border-[#e2e8f0]">
            <p className="text-xs text-[#64748b]">Expected value</p>
            <p className="font-mono text-sm font-semibold text-[#0f172a]">{expectedValue}</p>
          </div>

          {/* List of outputs */}
          <div className="space-y-1">
            {testResult.outputs.map((output, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
              >
                <span className="text-sm text-[#64748b]">Run {index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#0f172a]">{output.value}</span>
                  {output.correct ? (
                    <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                  ) : (
                    <X className="h-4 w-4 text-[#ef4444]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test history */}
      <div className="border-t border-[#e2e8f0] pt-6">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-sm font-medium text-[#334155]">
            Test history
            <span className="ml-2 text-[#64748b]">({testHistory.length})</span>
          </h3>
          <ChevronRight
            className={`h-4 w-4 text-[#64748b] transition-transform ${showHistory ? "rotate-90" : ""}`}
          />
        </button>

        {showHistory && testHistory.length > 0 && (
          <div className="mt-4 space-y-2">
            {testHistory.map((run) => {
              const report = MOCK_REPORTS.find((r) => r.id === run.reportId)
              const isExpanded = expandedHistoryId === run.id

              return (
                <div key={run.id} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                  <button
                    type="button"
                    onClick={() => setExpandedHistoryId(isExpanded ? null : run.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-[#334155]">{run.reportId}</span>
                      <span className="text-sm text-[#64748b]">{run.expectedValue}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${getScoreColor(run.correctCount)}`}>
                        {run.correctCount}/10
                      </span>
                      <span className="text-xs text-[#94a3b8]">v{run.definitionVersion}</span>
                      <span className="text-xs text-[#94a3b8]">{formatDate(run.ranAt)}</span>
                      <ChevronRight
                        className={`h-4 w-4 text-[#64748b] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#e2e8f0] px-4 py-3">
                      <div className="mb-2 rounded-lg bg-white px-3 py-2 border border-[#e2e8f0]">
                        <p className="text-xs text-[#64748b]">Expected value</p>
                        <p className="font-mono text-sm font-semibold text-[#0f172a]">
                          {run.expectedValue}
                        </p>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {run.runs.map((isCorrect, idx) => (
                          <div
                            key={idx}
                            className={`flex h-8 items-center justify-center rounded text-xs font-medium ${
                              isCorrect
                                ? "bg-[#dcfce7] text-[#166534]"
                                : "bg-[#fee2e2] text-[#991b1b]"
                            }`}
                          >
                            {isCorrect ? "Pass" : "Fail"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {showHistory && testHistory.length === 0 && (
          <p className="mt-4 text-sm text-[#64748b]">No test runs yet for this field.</p>
        )}
      </div>
    </div>
  )
}

// Report picker with typeahead
interface ReportPickerProps {
  selectedReportId: string
  onChange: (reportId: string) => void
}

function ReportPicker({ selectedReportId, onChange }: ReportPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredReports = MOCK_REPORTS.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.vesselName.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search)
  )

  const selectedReport = MOCK_REPORTS.find((r) => r.id === selectedReportId)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-left text-sm focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
      >
        {selectedReport ? (
          <span className="text-[#0f172a]">
            {selectedReport.id} - {selectedReport.vesselName} ({selectedReport.date})
          </span>
        ) : (
          <span className="text-[#94a3b8]">Search by report ID, vessel, or date...</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
            <div className="border-b border-[#e2e8f0] p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports..."
                autoFocus
                className="w-full rounded border border-[#e2e8f0] px-3 py-1.5 text-sm focus:border-[#7c3aed] focus:outline-none"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => {
                    onChange(report.id)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] ${
                    report.id === selectedReportId ? "bg-[#f3e8ff]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#334155]">{report.id}</span>
                    <span className="text-xs text-[#94a3b8]">{report.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#64748b]">
                    <span>{report.vesselName}</span>
                    <span>•</span>
                    <span>{report.date}</span>
                  </div>
                </button>
              ))}
              {filteredReports.length === 0 && (
                <p className="px-3 py-2 text-sm text-[#64748b]">No reports found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Data-type-aware expected value input
interface ExpectedValueInputProps {
  dataType: FieldDefinition["dataType"]
  value: string
  onChange: (value: string) => void
}

function ExpectedValueInput({ dataType, value, onChange }: ExpectedValueInputProps) {
  switch (dataType) {
    case "number":
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter expected numeric value"
          step="any"
          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      )

    case "datetime":
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      )

    case "latlong":
      return (
        <div className="flex gap-2">
          <input
            type="text"
            value={value.split(",")[0] || ""}
            onChange={(e) => {
              const parts = value.split(",")
              onChange(`${e.target.value},${parts[1] || ""}`)
            }}
            placeholder="Latitude"
            className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
          <input
            type="text"
            value={value.split(",")[1] || ""}
            onChange={(e) => {
              const parts = value.split(",")
              onChange(`${parts[0] || ""},${e.target.value}`)
            }}
            placeholder="Longitude"
            className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
        </div>
      )

    case "duration":
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Duration"
            min="0"
            className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
          <span className="text-sm text-[#64748b]">hours</span>
        </div>
      )

    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter expected value"
          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      )
  }
}
