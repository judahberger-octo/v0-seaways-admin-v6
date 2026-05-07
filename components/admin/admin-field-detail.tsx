"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Save, RotateCcw, X, ChevronDown, Check, Plus, Trash2, AlertCircle, HelpCircle, CheckCircle2, Play, Clock, ChevronRight, Search, Flag } from "lucide-react"
import {
  fieldDefinitions,
  targetSystems,
  targetForms,
  vessels,
  lookupTables,
  type FieldDefinition,
  type ValidationRule,
  type LookupTable,
} from "@/lib/admin-mock-data"

// Section IDs for navigation
const sections = [
  { id: "identity", label: "Identity & metadata" },
  { id: "properties", label: "Properties" },
  { id: "mapping", label: "Mapping" },
  { id: "notes", label: "Notes" },
  { id: "validation", label: "Validation" },
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

  // Formula transform configuration state
  type FormulaOperator = '+' | '-' | '×' | '÷'
  interface FormulaOperand {
    type: 'field' | 'constant'
    value: string // field path or constant value
  }
interface FormulaTransformConfig {
  sourceForm: string
  operands: FormulaOperand[]
  operators: FormulaOperator[]
  expression?: string // Advanced mode: free-form expression with IF, comparisons, etc.
  useAdvancedMode?: boolean
  }
  const defaultFormulaConfig: FormulaTransformConfig = { 
    sourceForm: '', 
    operands: [{ type: 'field', value: '' }, { type: 'field', value: '' }],
    operators: ['+']
  }
  const [sharedFormulaConfig, setSharedFormulaConfig] = useState<FormulaTransformConfig>(defaultFormulaConfig)
  const [perFormFormulaConfig, setPerFormFormulaConfig] = useState<Record<string, FormulaTransformConfig>>({})

  // Get current formula config for active context
  const getCurrentFormulaConfig = (): FormulaTransformConfig => {
    if (sameLogicForAllForms) {
      return sharedFormulaConfig
    }
    return activeFormTab ? perFormFormulaConfig[activeFormTab] || defaultFormulaConfig : defaultFormulaConfig
  }

  // Update formula config
  const updateFormulaConfig = (updates: Partial<FormulaTransformConfig>) => {
    if (sameLogicForAllForms) {
      setSharedFormulaConfig((prev) => ({ ...prev, ...updates }))
    } else if (activeFormTab) {
      setPerFormFormulaConfig((prev) => ({
        ...prev,
        [activeFormTab]: { ...(prev[activeFormTab] || defaultFormulaConfig), ...updates }
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Update a single operand in the formula config
  const updateFormulaOperand = (index: number, updates: Partial<FormulaOperand>) => {
    const current = getCurrentFormulaConfig()
    const newOperands = [...current.operands]
    newOperands[index] = { ...newOperands[index], ...updates }
    updateFormulaConfig({ operands: newOperands })
  }

  // Update an operator in the formula config
  const updateFormulaOperator = (index: number, value: FormulaOperator) => {
    const current = getCurrentFormulaConfig()
    const newOperators = [...current.operators]
    newOperators[index] = value
    updateFormulaConfig({ operators: newOperators })
  }

  // Add a new operand to the formula config
  const addFormulaOperand = () => {
    const current = getCurrentFormulaConfig()
    updateFormulaConfig({ 
      operands: [...current.operands, { type: 'field', value: '' }],
      operators: [...current.operators, '+']
    })
  }

  // Remove an operand from the formula config
  const removeFormulaOperand = (index: number) => {
    const current = getCurrentFormulaConfig()
    if (current.operands.length <= 2) return // Minimum 2 operands required
    const newOperands = current.operands.filter((_, i) => i !== index)
    // Remove the operator before this operand (or after if it's the first)
    const operatorIndex = index === 0 ? 0 : index - 1
    const newOperators = current.operators.filter((_, i) => i !== operatorIndex)
    updateFormulaConfig({ operands: newOperands, operators: newOperators })
  }

  // Constant transform configuration state
  interface ConstantTransformConfig {
    value: string
  }
  const [sharedConstantConfig, setSharedConstantConfig] = useState<ConstantTransformConfig>({ value: '' })
  const [perFormConstantConfig, setPerFormConstantConfig] = useState<Record<string, ConstantTransformConfig>>({})

  // Get current constant config for active context
  const getCurrentConstantConfig = (): ConstantTransformConfig => {
    if (sameLogicForAllForms) {
      return sharedConstantConfig
    }
    return activeFormTab ? perFormConstantConfig[activeFormTab] || { value: '' } : { value: '' }
  }

  // Update constant config
  const updateConstantConfig = (updates: Partial<ConstantTransformConfig>) => {
    if (sameLogicForAllForms) {
      setSharedConstantConfig((prev) => ({ ...prev, ...updates }))
    } else if (activeFormTab) {
      setPerFormConstantConfig((prev) => ({
        ...prev,
        [activeFormTab]: { ...(prev[activeFormTab] || { value: '' }), ...updates }
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Manual transform configuration state
  interface ManualTransformConfig {
    crewInstruction: string
  }
  const [sharedManualConfig, setSharedManualConfig] = useState<ManualTransformConfig>({ crewInstruction: '' })
  const [perFormManualConfig, setPerFormManualConfig] = useState<Record<string, ManualTransformConfig>>({})

  // Get current manual config for active context
  const getCurrentManualConfig = (): ManualTransformConfig => {
    if (sameLogicForAllForms) {
      return sharedManualConfig
    }
    return activeFormTab ? perFormManualConfig[activeFormTab] || { crewInstruction: '' } : { crewInstruction: '' }
  }

  // Update manual config
  const updateManualConfig = (updates: Partial<ManualTransformConfig>) => {
    if (sameLogicForAllForms) {
      setSharedManualConfig((prev) => ({ ...prev, ...updates }))
    } else if (activeFormTab) {
      setPerFormManualConfig((prev) => ({
        ...prev,
        [activeFormTab]: { ...(prev[activeFormTab] || { crewInstruction: '' }), ...updates }
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Notes state (engineering handoff)
  const [sharedNotes, setSharedNotes] = useState('')
  const [perFormNotes, setPerFormNotes] = useState<Record<string, string>>({})

  // Get current notes for active context
  const getCurrentNotes = (): string => {
    if (sameLogicForAllForms) {
      return sharedNotes
    }
    return activeFormTab ? perFormNotes[activeFormTab] || '' : ''
  }

  // Update notes
  const updateNotes = (value: string) => {
    if (sameLogicForAllForms) {
      setSharedNotes(value)
    } else if (activeFormTab) {
      setPerFormNotes((prev) => ({
        ...prev,
        [activeFormTab]: value
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Check (verification rules) state
  type CheckRuleKind = 'sum_equals' | 'between' | 'regex' | 'enum' | 'cross_field_equals' | 'data_type_match' | 'match_mapping'
  type CheckSeverity = 'warn' | 'block'
  interface CheckRule {
    id: string
    kind: CheckRuleKind
    config: Record<string, string | number | string[]> // Varies by rule kind
    severity: CheckSeverity
    divergedFromMapping?: boolean // True if user edited away from auto-generated
  }
  interface CheckConfig {
    rules: CheckRule[]
  }
  const defaultCheckConfig: CheckConfig = { rules: [] }
  const [sharedCheckConfig, setSharedCheckConfig] = useState<CheckConfig>(defaultCheckConfig)
  const [perFormCheckConfig, setPerFormCheckConfig] = useState<Record<string, CheckConfig>>({})

  // Get current check config for active context
  const getCurrentCheckConfig = (): CheckConfig => {
    if (sameLogicForAllForms) {
      return sharedCheckConfig
    }
    return activeFormTab ? perFormCheckConfig[activeFormTab] || defaultCheckConfig : defaultCheckConfig
  }

  // Update check config
  const updateCheckConfig = (updates: Partial<CheckConfig>) => {
    if (sameLogicForAllForms) {
      setSharedCheckConfig((prev) => ({ ...prev, ...updates }))
    } else if (activeFormTab) {
      setPerFormCheckConfig((prev) => ({
        ...prev,
        [activeFormTab]: { ...(prev[activeFormTab] || defaultCheckConfig), ...updates }
      }))
    }
    setHasUnsavedChanges(true)
  }

  // Add a check rule
  const addCheckRule = (autoGenerated = false) => {
    const current = getCurrentCheckConfig()
    const newRule: CheckRule = {
      id: `check-${Date.now()}`,
      kind: 'data_type_match',
      config: {},
      severity: 'warn',
      divergedFromMapping: false,
    }
    updateCheckConfig({ rules: [...current.rules, newRule] })
  }

  // Update a check rule
  const updateCheckRule = (id: string, updates: Partial<CheckRule>) => {
    const current = getCurrentCheckConfig()
    const newRules = current.rules.map((r) => {
      if (r.id === id) {
        // If it's a match_mapping rule and user is editing config or kind, mark as diverged
        const isDiverging = r.kind === 'match_mapping' && 
          (updates.kind !== undefined || updates.config !== undefined)
        return { 
          ...r, 
          ...updates,
          divergedFromMapping: isDiverging ? true : r.divergedFromMapping
        }
      }
      return r
    })
    updateCheckConfig({ rules: newRules })
  }

  // Remove a check rule
  const removeCheckRule = (id: string) => {
    const current = getCurrentCheckConfig()
    updateCheckConfig({ rules: current.rules.filter((r) => r.id !== id) })
  }

  // Activity feed filter state
  type ActivityFilter = 'all' | 'definition_changes' | 'crew_flags'
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')

  // Mock activity data for the field
  interface ActivityEntry {
    id: string
    type: 'definition_change' | 'crew_flag'
    timestamp: string
    // Definition change fields
    author?: string
    summary?: string
    // Crew flag fields
    vessel?: string
    reportId?: string
    crewComment?: string
    flagReason?: string
  }

  const mockActivityData: ActivityEntry[] = [
    {
      id: 'act-001',
      type: 'crew_flag',
      timestamp: '2024-03-15T14:32:00Z',
      vessel: 'MV Pacific Star',
      reportId: 'RPT-2024-0342',
      crewComment: 'Value looks incorrect based on our sensor reading',
      flagReason: 'Incorrect value',
    },
    {
      id: 'act-002',
      type: 'definition_change',
      timestamp: '2024-03-14T09:15:00Z',
      author: 'admin@seaways.com',
      summary: 'Changed Mapping transform from Direct to Formula',
    },
    {
      id: 'act-003',
      type: 'definition_change',
      timestamp: '2024-03-12T16:45:00Z',
      author: 'sarah.ops@seaways.com',
      summary: 'Added validation rule: Value must be between 0 and 100',
    },
    {
      id: 'act-004',
      type: 'crew_flag',
      timestamp: '2024-03-10T11:20:00Z',
      vessel: 'MV Atlantic Voyager',
      reportId: 'RPT-2024-0298',
      crewComment: 'Unable to extract from source report',
      flagReason: 'Missing data',
    },
    {
      id: 'act-005',
      type: 'definition_change',
      timestamp: '2024-03-08T08:00:00Z',
      author: 'admin@seaways.com',
      summary: 'Created field definition',
    },
  ]

  // Filter activity based on selected filter
  const filteredActivity = mockActivityData.filter((entry) => {
    if (activityFilter === 'all') return true
    if (activityFilter === 'definition_changes') return entry.type === 'definition_change'
    if (activityFilter === 'crew_flags') return entry.type === 'crew_flag'
    return true
  })

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

            {/* Section 1: Identity & Metadata - NEVER tabbed, single source of truth */}
            <section
              id="section-identity"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold text-[#0f172a]">
                Identity & metadata
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
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

                {/* Unit (only enabled for number/duration) */}
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
                    disabled={formData.dataType !== "number" && formData.dataType !== "duration"}
                    className={`w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed] ${
                      formData.dataType !== "number" && formData.dataType !== "duration" 
                        ? "cursor-not-allowed bg-[#f8fafc] text-[#94a3b8]" 
                        : ""
                    }`}
                  />
                </div>
              </div>
            </section>

            {/* Top-level form tab strip (only when Same logic is OFF) */}
            {!sameLogicForAllForms && selectedForms.length > 0 && (
              <TopLevelFormTabStrip
                forms={selectedForms}
                activeFormId={activeFormTab}
                onTabChange={setActiveFormTab}
              />
            )}

            {/* Section: Properties (Critical, Mandatory) - IS affected by form tabs */}
            <SectionCard
              id="properties"
              title="Properties"
            >
              <div className="space-y-4">
                {/* Critical field toggle */}
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

                {/* Mandatory field toggle */}
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
            </SectionCard>

            {/* Section 2: Mapping */}
            <SectionCard
              id="mapping"
              title="Mapping"
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
                      <p className="mt-2 rounded-lg border border-[#fef3c7] bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e]">
                        If a value in the source data doesn&apos;t match any row in the table, the field will be left unmapped and the crew will be warned.
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
                  <FormulaTransformEditor
                    config={getCurrentFormulaConfig()}
                    onConfigChange={updateFormulaConfig}
                    onOperandChange={updateFormulaOperand}
                    onOperatorChange={updateFormulaOperator}
                    onAddOperand={addFormulaOperand}
                    onRemoveOperand={removeFormulaOperand}
                  />
                )}

                {getCurrentTransformType() === 'constant' && (
                  <div className="space-y-4">
                    {/* Value input - typed to match field's data type */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Value <span className="text-[#ef4444]">*</span>
                      </label>
                      
                      {/* Number input */}
                      {formData.dataType === 'number' && (
                        <input
                          type="number"
                          value={getCurrentConstantConfig().value}
                          onChange={(e) => updateConstantConfig({ value: e.target.value })}
                          placeholder="Enter a number..."
                          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        />
                      )}

                      {/* Text input */}
                      {formData.dataType === 'text' && (
                        <input
                          type="text"
                          value={getCurrentConstantConfig().value}
                          onChange={(e) => updateConstantConfig({ value: e.target.value })}
                          placeholder="Enter text..."
                          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        />
                      )}

                      {/* Datetime input */}
                      {formData.dataType === 'datetime' && (
                        <input
                          type="datetime-local"
                          value={getCurrentConstantConfig().value}
                          onChange={(e) => updateConstantConfig({ value: e.target.value })}
                          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        />
                      )}

                      {/* Enum dropdown */}
                      {formData.dataType === 'enum' && (
                        <div className="relative">
                          <select
                            value={getCurrentConstantConfig().value}
                            onChange={(e) => updateConstantConfig({ value: e.target.value })}
                            className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 pr-10 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                          >
                            <option value="">Select a value...</option>
                            <option value="option_1">Option 1</option>
                            <option value="option_2">Option 2</option>
                            <option value="option_3">Option 3</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                        </div>
                      )}

                      {/* Lat/Long input */}
                      {formData.dataType === 'latlong' && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-[#64748b]">Latitude</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={getCurrentConstantConfig().value.split(',')[0] || ''}
                              onChange={(e) => {
                                const lng = getCurrentConstantConfig().value.split(',')[1] || ''
                                updateConstantConfig({ value: `${e.target.value},${lng}` })
                              }}
                              placeholder="-90 to 90"
                              className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-[#64748b]">Longitude</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={getCurrentConstantConfig().value.split(',')[1] || ''}
                              onChange={(e) => {
                                const lat = getCurrentConstantConfig().value.split(',')[0] || ''
                                updateConstantConfig({ value: `${lat},${e.target.value}` })
                              }}
                              placeholder="-180 to 180"
                              className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Duration input */}
                      {formData.dataType === 'duration' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-[#64748b]">Hours</label>
                            <input
                              type="number"
                              min="0"
                              value={getCurrentConstantConfig().value.split(':')[0] || ''}
                              onChange={(e) => {
                                const mins = getCurrentConstantConfig().value.split(':')[1] || '0'
                                updateConstantConfig({ value: `${e.target.value}:${mins}` })
                              }}
                              placeholder="0"
                              className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                            />
                          </div>
                          <span className="mt-5 text-lg text-[#64748b]">:</span>
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-[#64748b]">Minutes</label>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={getCurrentConstantConfig().value.split(':')[1] || ''}
                              onChange={(e) => {
                                const hrs = getCurrentConstantConfig().value.split(':')[0] || '0'
                                updateConstantConfig({ value: `${hrs}:${e.target.value}` })
                              }}
                              placeholder="0"
                              className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Fallback for unknown data types */}
                      {!formData.dataType && (
                        <input
                          type="text"
                          value={getCurrentConstantConfig().value}
                          onChange={(e) => updateConstantConfig({ value: e.target.value })}
                          placeholder="Set data type in Identity & metadata first..."
                          disabled
                          className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#94a3b8]"
                        />
                      )}

                      <p className="mt-2 text-xs text-[#64748b]">
                        This value is hardcoded. Every report will receive this exact value for this field.
                      </p>
                    </div>
                  </div>
                )}

                {getCurrentTransformType() === 'manual' && (
                  <div className="space-y-4">
                    {/* Info banner */}
                    <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                      <p className="text-sm text-[#1e40af]">
                        This field will be filled by the crew on submit. No source mapping is performed.
                      </p>
                    </div>

                    {/* Crew instruction textarea */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                        Crew instruction <span className="text-[#64748b]">(optional)</span>
                      </label>
                      <textarea
                        value={getCurrentManualConfig().crewInstruction}
                        onChange={(e) => updateManualConfig({ crewInstruction: e.target.value })}
                        placeholder="Enter instructions for the crew..."
                        rows={4}
                        className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                      />
                      <p className="mt-1.5 text-xs text-[#64748b]">
                        Crew will fill this field on submit. Leave instructions for them here (they&apos;ll see it inline next to the field).
                      </p>
                    </div>
                  </div>
                )}

                {/* Null handling note */}
                <div className="mt-6 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <p className="text-xs text-[#64748b]">
                    If any source field is missing or empty at runtime, this mapping produces null and the field is left unmapped on the report. Crew will see it as an empty field they can fill manually.
                  </p>
                  <p className="mt-1.5 text-xs text-[#64748b]">
                    <span className="font-medium text-[#334155]">Exception:</span> the Aggregation &quot;first non-null&quot; operator walks the source list trying each in order until one is populated; only if all are null does it return null.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Section 4: Notes */}
            <SectionCard
              id="notes"
              title="Notes"
            >
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                    Notes for engineering
                  </label>
                  <textarea
                    value={getCurrentNotes()}
                    onChange={(e) => updateNotes(e.target.value)}
                    placeholder="Document edge cases, workflow assumptions, or anything that needs context beyond the structured config above..."
                    rows={6}
                    className="w-full resize-y rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  />
                  <p className="mt-1.5 text-xs text-[#64748b]">
                    Free-text notes for the engineering team that builds the integration. Use this to document edge cases, workflow assumptions, or anything that needs context beyond the structured config above. Markdown supported.
                  </p>
                </div>
                <p className="text-xs text-[#94a3b8]">
                  Notes are visible to all admins; not surfaced to crew anywhere.
                </p>
              </div>
            </SectionCard>

            {/* Section 5: Validation */}
            <SectionCard
              id="validation"
              title="Validation rules"
            >
              <div className="space-y-6">
                {/* Section description */}
                <p className="text-sm text-[#64748b]">
                  Rules that run at submission. Failed rules either warn the crew (default) or block submission.
                </p>

                {/* Validation rules list */}
                <div className="space-y-3">
                  {getCurrentCheckConfig().rules.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#d1d5db] bg-[#f8fafc] p-6 text-center">
                      <p className="text-sm text-[#64748b]">No validation rules defined. Field will pass all checks.</p>
                    </div>
                  ) : (
                    getCurrentCheckConfig().rules.map((rule) => (
                      <div key={rule.id} className="rounded-lg border border-[#e2e8f0] bg-white p-4">
                        <div className="flex items-start gap-3">
                          {/* Rule kind dropdown */}
                          <div className="w-48">
                            <label className="mb-1 block text-xs font-medium text-[#64748b]">Rule type</label>
                            <div className="relative">
                              <select
                                value={rule.kind}
                                onChange={(e) => updateCheckRule(rule.id, { kind: e.target.value as CheckRuleKind, config: {} })}
                                className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                              >
                                <option value="between">Between</option>
                                <option value="regex">Regex</option>
                                <option value="enum">Enum</option>
                                <option value="sum_equals">Sum equals</option>
                                <option value="cross_field_equals">Cross-field equals</option>
                                <option value="data_type_match">Data type match</option>
                                <option value="match_mapping">Match mapping</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                            </div>
                          </div>

                          {/* Rule-specific configuration */}
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-[#64748b]">Configuration</label>
                            {rule.kind === 'data_type_match' && (
                              <p className="py-2 text-sm text-[#64748b]">
                                No config needed — verifies value is parseable as {formData.dataType || 'text'}.
                              </p>
                            )}

                            {rule.kind === 'match_mapping' && (
                              <div className="flex items-center gap-2 py-2">
                                <p className="text-sm text-[#64748b]">
                                  Auto-derived from current Mapping config.
                                </p>
                                {rule.divergedFromMapping && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2 py-0.5 text-xs font-medium text-[#92400e]">
                                    <AlertCircle className="h-3 w-3" />
                                    Diverged from mapping
                                  </span>
                                )}
                              </div>
                            )}

                            {rule.kind === 'sum_equals' && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[#64748b]">Sum equals</span>
                                <input
                                  type="number"
                                  value={(rule.config.targetValue as string) || ''}
                                  onChange={(e) => updateCheckRule(rule.id, { config: { ...rule.config, targetValue: e.target.value } })}
                                  placeholder="0"
                                  className="w-24 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                                />
                              </div>
                            )}

                            {rule.kind === 'between' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={(rule.config.min as string) || ''}
                                  onChange={(e) => updateCheckRule(rule.id, { config: { ...rule.config, min: e.target.value } })}
                                  placeholder="Min"
                                  className="w-24 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                                />
                                <span className="text-sm text-[#64748b]">to</span>
                                <input
                                  type="number"
                                  value={(rule.config.max as string) || ''}
                                  onChange={(e) => updateCheckRule(rule.id, { config: { ...rule.config, max: e.target.value } })}
                                  placeholder="Max"
                                  className="w-24 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                                />
                              </div>
                            )}

                            {rule.kind === 'regex' && (
                              <input
                                type="text"
                                value={(rule.config.pattern as string) || ''}
                                onChange={(e) => updateCheckRule(rule.id, { config: { ...rule.config, pattern: e.target.value } })}
                                placeholder="^[A-Z]{3}$"
                                className="w-full rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 font-mono text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                              />
                            )}

                            {rule.kind === 'enum' && (
                              <input
                                type="text"
                                value={(rule.config.values as string) || ''}
                                onChange={(e) => updateCheckRule(rule.id, { config: { ...rule.config, values: e.target.value } })}
                                placeholder="LADEN, BALLAST, ANCHORED"
                                className="w-full rounded-lg border border-[#e2e8f0] bg-white px-2 py-1.5 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                              />
                            )}

                            {rule.kind === 'cross_field_equals' && (
                              <SourceFieldAutocomplete
                                value={(rule.config.fieldPath as string) || ''}
                                onChange={(value) => updateCheckRule(rule.id, { config: { ...rule.config, fieldPath: value } })}
                                placeholder="Select field..."
                              />
                            )}
                          </div>

                          {/* Severity selector */}
                          <div className="w-44">
                            <label className="mb-1 block text-xs font-medium text-[#64748b]">Severity</label>
                            <div className="flex rounded-lg border border-[#e2e8f0] bg-white">
                              <button
                                type="button"
                                onClick={() => updateCheckRule(rule.id, { severity: 'warn' })}
                                className={`flex-1 px-3 py-2 text-xs font-medium ${
                                  rule.severity === 'warn'
                                    ? 'bg-[#fef3c7] text-[#92400e]'
                                    : 'text-[#64748b] hover:bg-[#f8fafc]'
                                } rounded-l-lg`}
                              >
                                Warn
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCheckRule(rule.id, { severity: 'block' })}
                                className={`flex-1 px-3 py-2 text-xs font-medium ${
                                  rule.severity === 'block'
                                    ? 'bg-[#fee2e2] text-[#991b1b]'
                                    : 'text-[#64748b] hover:bg-[#f8fafc]'
                                } rounded-r-lg`}
                              >
                                Block
                              </button>
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => removeCheckRule(rule.id)}
                            className="mt-5 rounded-lg p-2 text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Plain-English description preview */}
                        <div className="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2">
                          <p className="text-sm text-[#334155]">
                            {rule.kind === 'between' && rule.config.min !== undefined && rule.config.max !== undefined
                              ? `Value must be between ${rule.config.min} and ${rule.config.max}`
                              : rule.kind === 'regex' && rule.config.pattern
                                ? `Value must match pattern: ${rule.config.pattern}`
                                : rule.kind === 'enum' && rule.config.values
                                  ? `Value must be one of: ${rule.config.values}`
                                  : rule.kind === 'sum_equals' && rule.config.targetValue !== undefined
                                    ? `Sum of fields must equal ${rule.config.targetValue}`
                                    : rule.kind === 'cross_field_equals' && rule.config.fieldPath
                                      ? `Value must equal field: ${rule.config.fieldPath}`
                                      : rule.kind === 'data_type_match'
                                        ? `Value must be parseable as ${formData.dataType || 'text'}`
                                        : rule.kind === 'match_mapping'
                                          ? 'Value must match the current mapping output'
                                          : 'Configure rule parameters above'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => addCheckRule()}
                    className="flex items-center gap-1.5 rounded-lg border border-[#7c3aed] bg-white px-3 py-2 text-sm font-medium text-[#7c3aed] hover:bg-[#f3e8ff]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add rule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newRule: CheckRule = {
                        id: `rule-${Date.now()}`,
                        kind: 'match_mapping',
                        config: {},
                        severity: 'warn',
                        divergedFromMapping: false,
                      }
                      const currentConfig = getCurrentCheckConfig()
                      updateCheckConfig({
                        rules: [...currentConfig.rules, newRule]
                      })
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Match mapping
                  </button>
                </div>

                {/* Advanced expression subsection */}
                <div className="border-t border-[#e2e8f0] pt-6">
                  <AdvancedExpressionEditor
                    expression={formData.advancedExpression || ""}
                    severity={formData.advancedExpressionSeverity || "warn"}
                    onExpressionChange={(expr) => updateFormData({ advancedExpression: expr })}
                    onSeverityChange={(sev) => updateFormData({ advancedExpressionSeverity: sev })}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Section 6: Test */}
            <SectionCard
              id="test"
              title="Test"
            >
              <FieldTestPanel 
                fieldId={fieldId || ""} 
                dataType={formData.dataType || "text"}
                definitionVersion={formData.version || 1}
                transformType={getCurrentTransformType()}
                activeFormType={!sameLogicForAllForms && activeFormTab 
                  ? selectedForms.find(f => f.id === activeFormTab)?.name 
                  : undefined
                }
              />
            </SectionCard>

            {/* Section 7: Activity - NOT tabbed, unified timeline */}
            <section
              id="section-activity"
              className="rounded-xl border border-[#e2e8f0] bg-white p-6"
            >
              <h2 className="mb-4 text-base font-semibold text-[#0f172a]">
                Activity
              </h2>

              {/* Filter chips */}
              <div className="mb-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivityFilter('all')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    activityFilter === 'all'
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('definition_changes')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    activityFilter === 'definition_changes'
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  Definition changes
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('crew_flags')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    activityFilter === 'crew_flags'
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  Crew flags
                </button>
              </div>

              {/* Activity feed */}
              {filteredActivity.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#64748b]">
                  No activity to display.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="relative border-l-2 border-[#e2e8f0] pl-4"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-[5px] top-1 h-2 w-2 rounded-full ${
                        entry.type === 'definition_change' ? 'bg-[#7c3aed]' : 'bg-[#f59e0b]'
                      }`} />

                      {entry.type === 'definition_change' ? (
                        /* Definition change entry */
                        <div>
                          <p className="text-sm text-[#0f172a]">
                            <span className="font-medium">{entry.author}</span>{' '}
                            <span className="text-[#64748b]">{entry.summary}</span>
                          </p>
                          <p className="mt-1 text-xs text-[#94a3b8]">
                            {new Date(entry.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ) : (
                        /* Crew flag entry */
                        <div>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-[#f59e0b]" />
                            <span className="text-sm font-medium text-[#0f172a]">
                              Crew flagged this field
                            </span>
                            <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-xs font-medium text-[#92400e]">
                              {entry.flagReason}
                            </span>
                          </div>
                          <div className="mt-2 rounded-lg bg-[#f8fafc] p-3">
                            <div className="flex items-center gap-4 text-xs text-[#64748b]">
                              <span>{entry.vessel}</span>
                              <span className="font-mono">{entry.reportId}</span>
                            </div>
                            {entry.crewComment && (
                              <p className="mt-2 text-sm text-[#334155]">
                                &ldquo;{entry.crewComment}&rdquo;
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-[#94a3b8]">
                              {new Date(entry.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <button
                              type="button"
                              className="text-xs font-medium text-[#7c3aed] hover:underline"
                            >
                              View report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
  { value: 'constant', label: 'Constant value' },
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

// Wrapper component for sections (tabs removed - now handled at top level)
interface SectionCardProps {
  id: string
  title: string
  children: React.ReactNode
}

function SectionCard({
  id,
  title,
  children,
}: SectionCardProps) {
  return (
    <section
      id={`section-${id}`}
      className="rounded-xl border border-[#e2e8f0] bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
      </div>
      {/* Content */}
      <div className="p-6 pt-6">{children}</div>
    </section>
  )
}

// Top-level form tab strip (shown when "Same logic for all" is OFF)
interface TopLevelFormTabStripProps {
  forms: typeof targetForms
  activeFormId: string | null
  onTabChange: (formId: string) => void
}

function TopLevelFormTabStrip({ forms, activeFormId, onTabChange }: TopLevelFormTabStripProps) {
  if (forms.length === 0) return null
  
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-center gap-1 overflow-x-auto">
        {forms.map((form) => (
          <button
            key={form.id}
            type="button"
            onClick={() => onTabChange(form.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeFormId === form.id
                ? "bg-[#7c3aed] text-white"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
            }`}
          >
            {form.name}
          </button>
        ))}
      </div>
    </div>
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
  { id: 'navtor-sea', name: 'NAVTOR Sea' },
  { id: 'navtor-sea-arrival', name: 'NAVTOR Sea (Arrival)' },
  { id: 'navtor-departure', name: 'NAVTOR Departure' },
  { id: 'navtor-port', name: 'NAVTOR Port' },
  { id: 'navtor-maneuvering', name: 'NAVTOR Maneuvering' },
  { id: 'navtor-anchor', name: 'NAVTOR Anchor' },
  { id: 'navtor-drifting', name: 'NAVTOR Drifting' },
]

// NAVTOR source fields with full path display, grouped by section
type NavtorFieldDataType = 'number' | 'text' | 'datetime' | 'enum' | 'latlong' | 'duration'

interface NavtorFieldOption {
  path: string
  displayPath: string // Human-readable full path
  section: string
  dataType: NavtorFieldDataType
  exampleValue?: string // Example value from most recent report
}

const NAVTOR_SOURCE_FIELDS: NavtorFieldOption[] = [
  // General section
  { path: 'voyageReporting.general.reportDate', displayPath: 'General → Report Date', section: 'General', dataType: 'datetime', exampleValue: '2024-03-15' },
  { path: 'voyageReporting.general.reportTime', displayPath: 'General → Report Time', section: 'General', dataType: 'datetime', exampleValue: '12:00 UTC' },
  { path: 'voyageReporting.general.voyageNumber', displayPath: 'General → Voyage Number', section: 'General', dataType: 'text', exampleValue: 'V2024-0342' },
  { path: 'voyageReporting.general.vesselCondition', displayPath: 'General → Vessel Condition', section: 'General', dataType: 'enum', exampleValue: 'LADEN' },
  { path: 'voyageReporting.general.portOfDeparture', displayPath: 'General → Port of Departure', section: 'General', dataType: 'text', exampleValue: 'Singapore' },
  { path: 'voyageReporting.general.portOfDestination', displayPath: 'General → Port of Destination', section: 'General', dataType: 'text', exampleValue: 'Rotterdam' },
  { path: 'voyageReporting.general.nextPort', displayPath: 'General → Next Port', section: 'General', dataType: 'text', exampleValue: 'Suez Canal' },
  { path: 'voyageReporting.general.eta', displayPath: 'General → ETA', section: 'General', dataType: 'datetime', exampleValue: '2024-04-02 08:00' },
  
  // Position section
  { path: 'voyageReporting.position.latitude', displayPath: 'Position → Latitude', section: 'Position', dataType: 'latlong', exampleValue: '1.2644° N' },
  { path: 'voyageReporting.position.longitude', displayPath: 'Position → Longitude', section: 'Position', dataType: 'latlong', exampleValue: '103.8198° E' },
  
  // Distance & Speed section
  { path: 'voyageReporting.distanceAndSpeed.reportedSpeed', displayPath: 'Distance & Speed → Reported Speed', section: 'Distance & Speed', dataType: 'number', exampleValue: '12.5' },
  { path: 'voyageReporting.distanceAndSpeed.averageSpeed', displayPath: 'Distance & Speed → Average Speed', section: 'Distance & Speed', dataType: 'number', exampleValue: '12.3' },
  { path: 'voyageReporting.distanceAndSpeed.orderedSpeed', displayPath: 'Distance & Speed → Ordered Speed', section: 'Distance & Speed', dataType: 'number', exampleValue: '13.0' },
  { path: 'voyageReporting.distanceAndSpeed.distanceToGo', displayPath: 'Distance & Speed → Distance To Go', section: 'Distance & Speed', dataType: 'number', exampleValue: '8,450' },
  { path: 'voyageReporting.distanceAndSpeed.distanceSinceLastReport', displayPath: 'Distance & Speed → Distance Since Last Report', section: 'Distance & Speed', dataType: 'number', exampleValue: '298' },
  { path: 'voyageReporting.distanceAndSpeed.totalDistance', displayPath: 'Distance & Speed → Total Distance', section: 'Distance & Speed', dataType: 'number', exampleValue: '1,250' },
  { path: 'voyageReporting.distanceAndSpeed.timeSinceLastReport', displayPath: 'Distance & Speed → Time Since Last Report', section: 'Distance & Speed', dataType: 'duration', exampleValue: '24:00' },
  
  // Weather section
  { path: 'voyageReporting.weather.beaufort', displayPath: 'Weather → Beaufort Scale', section: 'Weather', dataType: 'number', exampleValue: '4' },
  { path: 'voyageReporting.weather.windDirection', displayPath: 'Weather → Wind Direction', section: 'Weather', dataType: 'text', exampleValue: 'NNE' },
  { path: 'voyageReporting.weather.windSpeed', displayPath: 'Weather → Wind Speed', section: 'Weather', dataType: 'number', exampleValue: '18' },
  { path: 'voyageReporting.weather.seaState', displayPath: 'Weather → Sea State', section: 'Weather', dataType: 'enum', exampleValue: 'Moderate' },
  { path: 'voyageReporting.weather.seaHeight', displayPath: 'Weather → Sea Height', section: 'Weather', dataType: 'number', exampleValue: '2.1' },
  { path: 'voyageReporting.weather.seaTemperature', displayPath: 'Weather → Sea Temperature', section: 'Weather', dataType: 'number', exampleValue: '28.5' },
  { path: 'voyageReporting.weather.swellHeight', displayPath: 'Weather → Swell Height', section: 'Weather', dataType: 'number', exampleValue: '1.8' },
  
  // Main Engine section
  { path: 'machinery.mainEngine.rpm', displayPath: 'Power → Main Engine → RPM', section: 'Power', dataType: 'number', exampleValue: '78' },
  { path: 'machinery.mainEngine.power', displayPath: 'Power → Main Engine → Power', section: 'Power', dataType: 'number', exampleValue: '8,540' },
  { path: 'machinery.mainEngine.runningHours', displayPath: 'Power → Main Engine → Running Hours', section: 'Power', dataType: 'number', exampleValue: '45,230' },
  { path: 'machinery.mainEngine.consumption.HFO', displayPath: 'Power → Main Engine → HFO Consumption', section: 'Power', dataType: 'number', exampleValue: '32.5' },
  { path: 'machinery.mainEngine.consumption.MGO', displayPath: 'Power → Main Engine → MGO Consumption', section: 'Power', dataType: 'number', exampleValue: '0.8' },
  { path: 'machinery.mainEngine.consumption.VLSFO', displayPath: 'Power → Main Engine → VLSFO Consumption', section: 'Power', dataType: 'number', exampleValue: '28.2' },
  
  // Auxiliary Engine section
  { path: 'machinery.auxiliaryEngine.consumption.HFO', displayPath: 'Power → Auxiliary Engine → HFO Consumption', section: 'Power', dataType: 'number', exampleValue: '2.1' },
  { path: 'machinery.auxiliaryEngine.consumption.MGO', displayPath: 'Power → Auxiliary Engine → MGO Consumption', section: 'Power', dataType: 'number', exampleValue: '1.5' },
  { path: 'machinery.auxiliaryEngine.runningHours', displayPath: 'Power → Auxiliary Engine → Running Hours', section: 'Power', dataType: 'number', exampleValue: '12,450' },
  
  // Generators section
  { path: 'machinery.generators.gen1.hours', displayPath: 'Power → Generator 1 → Running Hours', section: 'Power', dataType: 'number', exampleValue: '8,234' },
  { path: 'machinery.generators.gen2.hours', displayPath: 'Power → Generator 2 → Running Hours', section: 'Power', dataType: 'number', exampleValue: '7,890' },
  { path: 'machinery.generators.gen3.hours', displayPath: 'Power → Generator 3 → Running Hours', section: 'Power', dataType: 'number', exampleValue: '6,543' },
  
  // Boiler section
  { path: 'machinery.boiler.hours', displayPath: 'Power → Boiler → Running Hours', section: 'Power', dataType: 'number', exampleValue: '3,210' },
  { path: 'machinery.boiler.consumption.HFO', displayPath: 'Power → Boiler → HFO Consumption', section: 'Power', dataType: 'number', exampleValue: '1.2' },
  { path: 'machinery.boiler.consumption.MGO', displayPath: 'Power → Boiler → MGO Consumption', section: 'Power', dataType: 'number', exampleValue: '0.3' },
  
  // Bunkers ROB section
  { path: 'bunkers.ifo.rob', displayPath: 'Bunkers → IFO → ROB', section: 'Bunkers', dataType: 'number', exampleValue: '1,245' },
  { path: 'bunkers.mgo.rob', displayPath: 'Bunkers → MGO → ROB', section: 'Bunkers', dataType: 'number', exampleValue: '185' },
  { path: 'bunkers.lsfo.rob', displayPath: 'Bunkers → LSFO → ROB', section: 'Bunkers', dataType: 'number', exampleValue: '892' },
  { path: 'bunkers.lsmgo.rob', displayPath: 'Bunkers → LSMGO → ROB', section: 'Bunkers', dataType: 'number', exampleValue: '124' },
  { path: 'bunkers.vlsfo.rob', displayPath: 'Bunkers → VLSFO → ROB', section: 'Bunkers', dataType: 'number', exampleValue: '1,580' },
  { path: 'bunkers.freshWater.rob', displayPath: 'Bunkers → Fresh Water → ROB', section: 'Bunkers', dataType: 'number', exampleValue: '245' },
  
  // Bunkers Consumption section
  { path: 'bunkers.ifo.consumption.total', displayPath: 'Bunkers → IFO → Consumption Total', section: 'Bunkers', dataType: 'number', exampleValue: '35.8' },
  { path: 'bunkers.ifo.consumption.mainEngine', displayPath: 'Bunkers → IFO → Consumption Main Engine', section: 'Bunkers', dataType: 'number', exampleValue: '32.5' },
  { path: 'bunkers.ifo.consumption.auxiliary', displayPath: 'Bunkers → IFO → Consumption Auxiliary', section: 'Bunkers', dataType: 'number', exampleValue: '2.1' },
  { path: 'bunkers.mgo.consumption.total', displayPath: 'Bunkers → MGO → Consumption Total', section: 'Bunkers', dataType: 'number', exampleValue: '2.6' },
  
  // Bunkers Received section
  { path: 'bunkers.received.HFO', displayPath: 'Bunkers → Received → HFO', section: 'Bunkers', dataType: 'number', exampleValue: '0' },
  { path: 'bunkers.received.MGO', displayPath: 'Bunkers → Received → MGO', section: 'Bunkers', dataType: 'number', exampleValue: '0' },
  
  // Cargo section
  { path: 'cargo.totalCargo', displayPath: 'Cargo → Total Cargo', section: 'Cargo', dataType: 'number', exampleValue: '65,420' },
  { path: 'cargo.loadedQuantity', displayPath: 'Cargo → Loaded Quantity', section: 'Cargo', dataType: 'number', exampleValue: '65,420' },
  { path: 'cargo.dischargedQuantity', displayPath: 'Cargo → Discharged Quantity', section: 'Cargo', dataType: 'number', exampleValue: '0' },
]

// Legacy flat paths for backward compatibility
const NAVTOR_PATHS = NAVTOR_SOURCE_FIELDS.map(f => f.path)

// Formula Transform Editor with enhanced expression language
interface FormulaTransformEditorProps {
  config: FormulaTransformConfig
  onConfigChange: (updates: Partial<FormulaTransformConfig>) => void
  onOperandChange: (index: number, updates: Partial<FormulaOperand>) => void
  onOperatorChange: (index: number, value: FormulaOperator) => void
  onAddOperand: () => void
  onRemoveOperand: (index: number) => void
}

function FormulaTransformEditor({
  config,
  onConfigChange,
  onOperandChange,
  onOperatorChange,
  onAddOperand,
  onRemoveOperand,
}: FormulaTransformEditorProps) {
  const [showReferenceModal, setShowReferenceModal] = useState(false)
  const [formulaExpression, setFormulaExpression] = useState('')
  const [expressionError, setExpressionError] = useState<string | null>(null)
  const [expressionValid, setExpressionValid] = useState(false)
  const [useAdvancedMode, setUseAdvancedMode] = useState(false)

  // Validate the formula expression
  const validateExpression = () => {
    const expr = formulaExpression.trim()
    if (!expr) {
      setExpressionError('Expression cannot be empty')
      setExpressionValid(false)
      return
    }

    // Check for balanced parentheses
    let parenCount = 0
    for (const char of expr) {
      if (char === '(') parenCount++
      if (char === ')') parenCount--
      if (parenCount < 0) {
        setExpressionError('Unbalanced parentheses: unexpected closing parenthesis')
        setExpressionValid(false)
        return
      }
    }
    if (parenCount !== 0) {
      setExpressionError('Unbalanced parentheses: missing closing parenthesis')
      setExpressionValid(false)
      return
    }

    // Check for valid field references
    const fieldRefPattern = /\$\{field\.[a-zA-Z_][a-zA-Z0-9_]*\}/g
    const fieldRefs = expr.match(fieldRefPattern) || []
    
    // Check for valid function usage
    const functionPattern = /(SUM|AVG|MIN|MAX|ROUND|IF)\s*\(/gi
    const functions = expr.match(functionPattern) || []
    
    // Check IF function has proper syntax
    const ifPattern = /IF\s*\([^,]+,[^,]+,[^)]+\)/gi
    const ifUsages = expr.match(/IF\s*\(/gi) || []
    if (ifUsages.length > 0) {
      // Basic check for IF arguments
      const ifMatches = expr.match(ifPattern) || []
      if (ifMatches.length !== ifUsages.length) {
        setExpressionError('IF function requires 3 arguments: IF(condition, then_value, else_value)')
        setExpressionValid(false)
        return
      }
    }

    // Check for invalid characters (allowing comparison and logical operators)
    const validCharsPattern = /^[\s\d\w\.\$\{\}\+\-\*\/\×\÷\(\)\,\=\!\<\>\&\|\"\']+$/
    if (!validCharsPattern.test(expr.replace(/AND|OR|NOT/g, ''))) {
      setExpressionError('Expression contains invalid characters')
      setExpressionValid(false)
      return
    }

    setExpressionError(null)
    setExpressionValid(true)
  }

  return (
    <div className="space-y-4">
      {/* Source form dropdown */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#334155]">
          Source form <span className="text-[#ef4444]">*</span>
        </label>
        <SourceFormDropdown
          value={config.sourceForm}
          onChange={(value) => onConfigChange({ sourceForm: value })}
        />
        <p className="mt-1 text-xs text-[#64748b]">
          Select which NAVTOR report type to read fields from.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#64748b]">Mode:</span>
        <div className="flex rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-0.5">
          <button
            type="button"
            onClick={() => setUseAdvancedMode(false)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              !useAdvancedMode
                ? 'bg-white text-[#0f172a] shadow-sm'
                : 'text-[#64748b] hover:text-[#334155]'
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setUseAdvancedMode(true)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              useAdvancedMode
                ? 'bg-white text-[#0f172a] shadow-sm'
                : 'text-[#64748b] hover:text-[#334155]'
            }`}
          >
            Expression
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowReferenceModal(true)}
          className="ml-auto flex items-center gap-1 text-sm text-[#7c3aed] hover:underline"
        >
          <HelpCircle className="h-4 w-4" />
          Expression reference
        </button>
      </div>

      {!useAdvancedMode ? (
        /* Visual formula builder */
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#334155]">
            Formula <span className="text-[#ef4444]">*</span>
          </label>
          
          {/* Formula row */}
          <div className="flex flex-wrap items-start gap-2">
            {config.operands.map((operand, index) => (
              <div key={index} className="flex items-start gap-2">
                {/* Operand */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {/* Operand type toggle */}
                    <button
                      type="button"
                      onClick={() => onOperandChange(index, { 
                        type: operand.type === 'field' ? 'constant' : 'field',
                        value: '' 
                      })}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        operand.type === 'field' 
                          ? 'bg-[#7c3aed] text-white' 
                          : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      Field
                    </button>
                    <button
                      type="button"
                      onClick={() => onOperandChange(index, { 
                        type: operand.type === 'constant' ? 'field' : 'constant',
                        value: '' 
                      })}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        operand.type === 'constant' 
                          ? 'bg-[#7c3aed] text-white' 
                          : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      Const
                    </button>
                    {/* Remove button (only if more than 2 operands) */}
                    {config.operands.length > 2 && (
                      <button
                        type="button"
                        onClick={() => onRemoveOperand(index)}
                        className="rounded p-1 text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Operand input */}
                  {operand.type === 'field' ? (
                    <div className="w-56">
                      <SourceFieldAutocomplete
                        value={operand.value}
                        onChange={(value) => onOperandChange(index, { value })}
                        placeholder="Select field..."
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={operand.value}
                      onChange={(e) => onOperandChange(index, { value: e.target.value })}
                      placeholder="0"
                      className="w-24 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    />
                  )}
                </div>

                {/* Operator (between operands) */}
                {index < config.operands.length - 1 && (
                  <div className="flex h-[68px] items-end pb-2">
                    <select
                      value={config.operators[index] || '+'}
                      onChange={(e) => onOperatorChange(index, e.target.value as FormulaOperator)}
                      className="h-9 w-14 appearance-none rounded-lg border border-[#e2e8f0] bg-white px-2 text-center text-lg font-medium text-[#334155] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    >
                      <option value="+">+</option>
                      <option value="-">−</option>
                      <option value="×">×</option>
                      <option value="÷">÷</option>
                    </select>
                  </div>
                )}
              </div>
            ))}

            {/* Add operand button */}
            <div className="flex h-[68px] items-end pb-2">
              <button
                type="button"
                onClick={onAddOperand}
                className="flex h-9 items-center gap-1 rounded-lg border border-dashed border-[#d1d5db] px-3 text-sm text-[#64748b] hover:border-[#7c3aed] hover:bg-[#f8fafc] hover:text-[#7c3aed]"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {/* Helper text */}
          <p className="mt-3 text-xs text-[#64748b]">
            For complex expressions with IF, comparisons, or nested logic, switch to Expression mode.
          </p>
        </div>
      ) : (
        /* Advanced expression editor */
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#334155]">
            Expression <span className="text-[#ef4444]">*</span>
          </label>
          <textarea
            value={formulaExpression}
            onChange={(e) => {
              setFormulaExpression(e.target.value)
              setExpressionError(null)
              setExpressionValid(false)
            }}
            placeholder={'${field.IFO_Consumed} + ${field.MGO_Consumed}\n\nor with IF:\n\nIF(${field.CargoWeight} > 0, "Loaded", "Ballast")'}
            rows={4}
            className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 ${
              expressionError
                ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]'
                : expressionValid
                  ? 'border-[#22c55e] focus:border-[#22c55e] focus:ring-[#22c55e]'
                  : 'border-[#e2e8f0] focus:border-[#7c3aed] focus:ring-[#7c3aed]'
            }`}
          />
          
          {/* Error/success message */}
          {expressionError && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-[#ef4444]">
              <AlertCircle className="h-3.5 w-3.5" />
              {expressionError}
            </p>
          )}
          {expressionValid && !expressionError && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-[#22c55e]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Expression is valid
            </p>
          )}

          {/* Validate button */}
          <button
            type="button"
            onClick={validateExpression}
            className="mt-3 flex items-center gap-2 rounded-lg border border-[#7c3aed] bg-white px-4 py-2 text-sm font-medium text-[#7c3aed] hover:bg-[#f3e8ff]"
          >
            <Play className="h-4 w-4" />
            Validate expression
          </button>
        </div>
      )}

      {/* Reference Modal */}
      {showReferenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#0f172a]">Formula Expression Reference</h3>
              <button
                type="button"
                onClick={() => setShowReferenceModal(false)}
                className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 text-sm">
              {/* Field references */}
              <div>
                <h4 className="mb-2 font-semibold text-[#334155]">Field References</h4>
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <code className="text-[#7c3aed]">{'${field.LogicalName}'}</code>
                  <p className="mt-1 text-[#64748b]">Reference any field by its logical name</p>
                </div>
              </div>

              {/* Arithmetic operators */}
              <div>
                <h4 className="mb-2 font-semibold text-[#334155]">Arithmetic Operators</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { op: '+', desc: 'Addition' },
                    { op: '−', desc: 'Subtraction' },
                    { op: '×', desc: 'Multiplication' },
                    { op: '÷', desc: 'Division' },
                    { op: '( )', desc: 'Grouping' },
                  ].map(({ op, desc }) => (
                    <div key={op} className="flex items-center gap-2 rounded bg-[#f8fafc] px-3 py-2">
                      <code className="font-bold text-[#7c3aed]">{op}</code>
                      <span className="text-[#64748b]">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison operators */}
              <div>
                <h4 className="mb-2 font-semibold text-[#334155]">Comparison Operators</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { op: '==', desc: 'Equal to' },
                    { op: '!=', desc: 'Not equal to' },
                    { op: '<', desc: 'Less than' },
                    { op: '>', desc: 'Greater than' },
                    { op: '<=', desc: 'Less than or equal' },
                    { op: '>=', desc: 'Greater than or equal' },
                  ].map(({ op, desc }) => (
                    <div key={op} className="flex items-center gap-2 rounded bg-[#f8fafc] px-3 py-2">
                      <code className="font-bold text-[#7c3aed]">{op}</code>
                      <span className="text-[#64748b]">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logical operators */}
              <div>
                <h4 className="mb-2 font-semibold text-[#334155]">Logical Operators</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { op: 'AND', desc: 'Both conditions true' },
                    { op: 'OR', desc: 'Either condition true' },
                    { op: 'NOT', desc: 'Negates condition' },
                  ].map(({ op, desc }) => (
                    <div key={op} className="flex items-center gap-2 rounded bg-[#f8fafc] px-3 py-2">
                      <code className="font-bold text-[#7c3aed]">{op}</code>
                      <span className="text-[#64748b]">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Functions */}
              <div>
                <h4 className="mb-2 font-semibold text-[#334155]">Functions</h4>
                <div className="space-y-2">
                  {[
                    { fn: 'SUM(a, b, ...)', desc: 'Sum of values' },
                    { fn: 'AVG(a, b, ...)', desc: 'Average of values' },
                    { fn: 'MIN(a, b, ...)', desc: 'Minimum value' },
                    { fn: 'MAX(a, b, ...)', desc: 'Maximum value' },
                    { fn: 'ROUND(value, decimals)', desc: 'Round to decimal places' },
                    { fn: 'IF(condition, then_value, else_value)', desc: 'Conditional logic' },
                  ].map(({ fn, desc }) => (
                    <div key={fn} className="flex items-center justify-between rounded bg-[#f8fafc] px-3 py-2">
                      <code className="text-[#7c3aed]">{fn}</code>
                      <span className="text-[#64748b]">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Examples */}
              <div>
                <h4 className="mb-2 font-semibold text-[#334155]">Examples</h4>
                <div className="space-y-2">
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <code className="block text-xs text-[#7c3aed]">
                      {'${field.IFO_Consumed} + ${field.MGO_Consumed}'}
                    </code>
                    <p className="mt-1 text-xs text-[#64748b]">Simple addition of two fields</p>
                  </div>
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <code className="block text-xs text-[#7c3aed]">
                      {'ROUND(${field.Distance} / ${field.Time}, 2)'}
                    </code>
                    <p className="mt-1 text-xs text-[#64748b]">Calculate speed rounded to 2 decimals</p>
                  </div>
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <code className="block text-xs text-[#7c3aed]">
                      {'IF(${field.CargoWeight} > 0, "Loaded", IF(${field.BallastWater} > 0, "Light Ballast", null))'}
                    </code>
                    <p className="mt-1 text-xs text-[#64748b]">Nested IF for cargo status</p>
                  </div>
                  <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <code className="block text-xs text-[#7c3aed]">
                      {'SUM(${field.AuxBoiler1}, ${field.AuxBoiler2}, IF(${field.CompositeBoilerPresent}, ${field.CompositeBoiler}, 0))'}
                    </code>
                    <p className="mt-1 text-xs text-[#64748b]">Conditional sum with optional field</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReferenceModal(false)}
                className="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#f8fafc] ${
                        field.path === value ? "bg-[#f3e8ff] text-[#7c3aed]" : "text-[#334155]"
                      }`}
                    >
                      <span className="truncate">{field.displayPath}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {field.exampleValue && (
                          <span className="max-w-24 truncate text-xs text-[#94a3b8]" title={field.exampleValue}>
                            {field.exampleValue}
                          </span>
                        )}
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                          field.dataType === 'number' ? 'bg-[#dbeafe] text-[#1d4ed8]' :
                          field.dataType === 'text' ? 'bg-[#f3e8ff] text-[#7c3aed]' :
                          field.dataType === 'datetime' ? 'bg-[#fef3c7] text-[#92400e]' :
                          field.dataType === 'enum' ? 'bg-[#dcfce7] text-[#166534]' :
                          field.dataType === 'latlong' ? 'bg-[#fce7f3] text-[#9d174d]' :
                          field.dataType === 'duration' ? 'bg-[#e0e7ff] text-[#4338ca]' :
                          'bg-[#f1f5f9] text-[#64748b]'
                        }`}>
                          {field.dataType}
                        </span>
                      </span>
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
  transformType?: string
  activeFormType?: string // For tabbed mode: the form type to filter reports by
}

function FieldTestPanel({ fieldId, dataType, definitionVersion, transformType, activeFormType }: FieldTestPanelProps) {
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [expectedValue, setExpectedValue] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [testResult, setTestResult] = useState<{
    sourceValue: string | string[]
    transformedValue: string
    expectedValue: string
    passed: boolean
    timestamp: Date
    mappingConfig: string
  } | null>(null)

  // Handle Manual transform type - no automated test
  if (transformType === 'manual') {
    return (
      <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6 text-center">
        <p className="text-sm text-[#64748b]">
          Manual — crew fills on submit. No automated test.
        </p>
      </div>
    )
  }

  const handleRunTest = async () => {
    if (!selectedReport || !expectedValue) return

    setIsRunning(true)
    setTestResult(null)

    // Simulate a single test run
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))

    // Simulate extraction result
    const variance = Math.random()
    let sourceValue: string | string[]
    let transformedValue: string
    
    // For Aggregation/Formula, show multiple source values
    if (transformType === 'aggregation' || transformType === 'formula') {
      sourceValue = ['12.5', '8.3', '4.2'] // Example multi-value source
      transformedValue = variance > 0.2 ? expectedValue : (parseFloat(expectedValue) * 0.95).toFixed(2)
    } else {
      sourceValue = variance > 0.15 ? expectedValue : `${expectedValue}_raw`
      transformedValue = variance > 0.2 ? expectedValue : `${expectedValue}_transformed`
    }

    // Check if pass or fail
    const passed = transformedValue === expectedValue

    setTestResult({
      sourceValue,
      transformedValue,
      expectedValue,
      passed,
      timestamp: new Date(),
      mappingConfig: `${transformType || 'direct'} v${definitionVersion}`,
    })
    setIsRunning(false)
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Instructional text */}
      <div className="rounded-lg bg-[#f8fafc] px-4 py-3">
        <p className="text-sm text-[#64748b]">
          Run the field&apos;s mapping against a source report once and compare to the expected value.
        </p>
      </div>

      {/* Test inputs - 3 side by side */}
      <div className="grid grid-cols-3 gap-4">
        {/* Source report picker */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#334155]">
            Source report
          </label>
          <ReportPicker
            selectedReportId={selectedReport}
            onChange={setSelectedReport}
            formTypeFilter={activeFormType}
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

        {/* Run test button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleRunTest}
            disabled={!selectedReport || !expectedValue || isRunning}
            className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] px-6 text-sm font-semibold text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run test
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results card */}
      {testResult && (
        <div className="space-y-3">
          {/* Status pill */}
          <div className="flex justify-center">
            {testResult.passed ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-4 py-2 text-sm font-semibold text-[#166534]">
                <CheckCircle2 className="h-5 w-5" />
                Pass
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#991b1b]">
                <X className="h-5 w-5" />
                Fail
              </div>
            )}
          </div>

          {/* 3-pane result card */}
          <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-xl border border-[#e2e8f0]">
            {/* LEFT pane: Source value */}
            <div className="border-r border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                Source value
              </p>
              {Array.isArray(testResult.sourceValue) ? (
                <div className="space-y-1">
                  {testResult.sourceValue.map((val, idx) => (
                    <p key={idx} className="font-mono text-sm text-[#334155]">{val}</p>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-sm text-[#334155]">{testResult.sourceValue}</p>
              )}
            </div>

            {/* MIDDLE pane: Transformed value */}
            <div className={`border-r border-[#e2e8f0] p-4 ${testResult.passed ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'}`}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                Transformed value
              </p>
              <p className={`font-mono text-sm font-semibold ${testResult.passed ? 'text-[#166534]' : 'text-[#991b1b]'}`}>
                {testResult.transformedValue}
              </p>
            </div>

            {/* RIGHT pane: Expected value */}
            <div className="bg-white p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
                Expected value
              </p>
              <p className="font-mono text-sm font-semibold text-[#0f172a]">
                {testResult.expectedValue}
              </p>
            </div>
          </div>

          {/* Timestamp and mapping config */}
          <p className="text-center text-xs text-[#94a3b8]">
            {formatTimestamp(testResult.timestamp)} • {testResult.mappingConfig}
          </p>
        </div>
      )}
    </div>
  )
}

// Report picker with typeahead
interface ReportPickerProps {
  selectedReportId: string
  onChange: (reportId: string) => void
  formTypeFilter?: string // Filter reports to this form type (e.g., "Noon (Sea)", "Arrival")
}

function ReportPicker({ selectedReportId, onChange, formTypeFilter }: ReportPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  // First filter by form type if specified, then by search
  const formFilteredReports = formTypeFilter 
    ? MOCK_REPORTS.filter(r => r.type === formTypeFilter)
    : MOCK_REPORTS

  const filteredReports = formFilteredReports.filter(
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
