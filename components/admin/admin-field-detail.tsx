"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, RotateCcw } from "lucide-react"
import {
  fieldDefinitions,
  targetSystems,
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
              {/* Placeholder - will be expanded in Prompt 11 */}
              <p className="text-sm text-[#64748b]">
                Identity section content coming soon...
              </p>
            </section>

            {/* Section 2: Extraction */}
            <section
              id="section-extraction"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Extraction
              </h2>
              {/* Placeholder - will be expanded in Prompt 12 */}
              <p className="text-sm text-[#64748b]">
                Extraction section content coming soon...
              </p>
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
