"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, RotateCcw, X, ChevronDown, Check, Plus, Trash2 } from "lucide-react"
import {
  fieldDefinitions,
  targetSystems,
  targetForms,
  type FieldDefinition,
} from "@/lib/admin-mock-data"

// Section IDs for navigation
const sections = [
  { id: "identity", label: "Identity & metadata" },
  { id: "extraction", label: "Extraction" },
  { id: "logic", label: "Logic" },
  { id: "test-suite", label: "Test suite" },
  { id: "version-history", label: "Version history" },
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
          {!isCreateMode && (
            <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-medium text-[#64748b]">
              v{formData.version}
            </span>
          )}
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

                {/* Appears on forms (multi-select chips) */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                    Appears on forms
                  </label>
                  <FormsMultiSelect
                    selectedFormIds={formData.appearsOnFormIds || []}
                    onChange={(formIds) => updateFormData({ appearsOnFormIds: formIds })}
                  />
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

                  {/* Read-only toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#334155]">Read-only in target</p>
                      <p className="text-xs text-[#64748b]">
                        Field cannot be edited in the target form. Read-only display only.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isReadOnlyInTarget || false}
                      onClick={() => updateFormData({ isReadOnlyInTarget: !formData.isReadOnlyInTarget })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2 ${
                        formData.isReadOnlyInTarget ? "bg-[#7c3aed]" : "bg-[#d1d5db]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.isReadOnlyInTarget ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Extraction */}
            <section
              id="section-extraction"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Extraction
              </h2>
              
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
            </section>

            {/* Section 3: Logic */}
            <section
              id="section-logic"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Logic
              </h2>
              {/* Placeholder - will be expanded in Prompt 13 */}
              <p className="text-sm text-[#64748b]">
                Logic section content coming soon...
              </p>
            </section>

            {/* Section 4: Test Suite */}
            <section
              id="section-test-suite"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Test suite
              </h2>
              {/* Placeholder - will be expanded in Prompt 14 */}
              <p className="text-sm text-[#64748b]">
                Test suite section content coming soon...
              </p>
            </section>

            {/* Section 5: Version History */}
            <section
              id="section-version-history"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Version history
              </h2>
              {/* Placeholder - will be expanded in Prompt 15 */}
              <p className="text-sm text-[#64748b]">
                Version history section content coming soon...
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

// Multi-select component for forms
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
