"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, RotateCcw, X, ChevronDown, Check, Plus, Trash2, AlertCircle, HelpCircle, CheckCircle2, Play, Clock, ChevronRight } from "lucide-react"
import {
  fieldDefinitions,
  targetSystems,
  targetForms,
  vessels,
  getTestRunsForField,
  testReports,
  type FieldDefinition,
  type ValidationRule,
  type TestRun,
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
              <div className="grid gap-6 lg:grid-cols-2">
                {/* A) NAVTOR Source Paths */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[#334155]">NAVTOR source paths</h3>
                    <p className="mt-0.5 text-xs text-[#64748b]">
                      Map this field to one or more NAVTOR API paths
                    </p>
                  </div>
                  
                  {/* Source paths list */}
                  <div className="space-y-2">
                    {(formData.navtorSourcePaths || []).map((path, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <NavtorPathPicker
                          value={path}
                          onChange={(newPath) => {
                            const newPaths = [...(formData.navtorSourcePaths || [])]
                            newPaths[index] = newPath
                            updateFormData({ navtorSourcePaths: newPaths })
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPaths = (formData.navtorSourcePaths || []).filter((_, i) => i !== index)
                            updateFormData({ navtorSourcePaths: newPaths })
                          }}
                          className="flex-shrink-0 rounded-lg p-2 text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add path button */}
                    <button
                      type="button"
                      onClick={() => {
                        updateFormData({ 
                          navtorSourcePaths: [...(formData.navtorSourcePaths || []), ""] 
                        })
                      }}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-[#d1d5db] px-3 py-2 text-sm text-[#64748b] hover:border-[#7c3aed] hover:bg-[#f8fafc] hover:text-[#7c3aed]"
                    >
                      <Plus className="h-4 w-4" />
                      Add source path
                    </button>
                  </div>
                  
                  {/* Aggregate toggle */}
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#334155]">
                          Aggregate across source reports
                        </p>
                        <p className="mt-1 text-xs text-[#64748b]">
                          {formData.aggregateAcrossReports 
                            ? "Sum values across all selected source reports" 
                            : "Use the value from the most recent report"}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.aggregateAcrossReports || false}
                        onClick={() => updateFormData({ aggregateAcrossReports: !formData.aggregateAcrossReports })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 ${
                          formData.aggregateAcrossReports ? "bg-[#7c3aed]" : "bg-[#d1d5db]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.aggregateAcrossReports ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* B) Extraction Hint */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[#334155]">Extraction hint</h3>
                    <p className="mt-0.5 text-xs text-[#64748b]">
                      Describe how to extract this field (included in LLM prompt). Markdown allowed.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={formData.extractionHint || ""}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          updateFormData({ extractionHint: e.target.value })
                        }
                      }}
                      placeholder="Describe how to extract this field. The hint is included in the LLM prompt. Example: 'Reported Speed in knots — found in the Distance & Speed tab. If multiple values exist, prefer the one labeled &quot;average&quot;.'"
                      rows={8}
                      className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-[#94a3b8]">
                      <span className={(formData.extractionHint?.length || 0) > 900 ? "text-[#f97316]" : ""}>
                        {formData.extractionHint?.length || 0}
                      </span>
                      /1000
                    </div>
                  </div>
                </div>
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

// Mock NAVTOR API paths for autocomplete
const NAVTOR_PATHS = [
  "voyageReporting.general.reportDate",
  "voyageReporting.general.reportTime",
  "voyageReporting.general.voyageNumber",
  "voyageReporting.general.portOfDeparture",
  "voyageReporting.general.portOfDestination",
  "voyageReporting.distanceAndSpeed.reportedSpeed",
  "voyageReporting.distanceAndSpeed.averageSpeed",
  "voyageReporting.distanceAndSpeed.distanceToGo",
  "voyageReporting.distanceAndSpeed.distanceSinceLastReport",
  "voyageReporting.distanceAndSpeed.totalDistance",
  "voyageReporting.position.latitude",
  "voyageReporting.position.longitude",
  "voyageReporting.weather.windDirection",
  "voyageReporting.weather.windSpeed",
  "voyageReporting.weather.seaState",
  "voyageReporting.weather.swellHeight",
  "machinery.mainEngine.consumption.HFO",
  "machinery.mainEngine.consumption.MGO",
  "machinery.mainEngine.consumption.VLSFO",
  "machinery.mainEngine.rpm",
  "machinery.mainEngine.power",
  "machinery.mainEngine.runningHours",
  "machinery.auxiliaryEngine.consumption.HFO",
  "machinery.auxiliaryEngine.consumption.MGO",
  "machinery.auxiliaryEngine.runningHours",
  "machinery.boiler.consumption.HFO",
  "machinery.boiler.consumption.MGO",
  "bunkers.rob.HFO",
  "bunkers.rob.MGO",
  "bunkers.rob.VLSFO",
  "bunkers.rob.freshWater",
  "bunkers.received.HFO",
  "bunkers.received.MGO",
  "cargo.totalCargo",
  "cargo.loadedQuantity",
  "cargo.dischargedQuantity",
]

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
