"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Trash2, Plus, AlertCircle, ExternalLink } from "lucide-react"
import { lookupTables, fieldDefinitions, targetForms, type LookupTable, type LookupTableRow } from "@/lib/admin-mock-data"

interface AdminLookupTableDetailProps {
  tableId: string | null // null = create mode
  onBack: () => void
}

// Mock function to find fields referencing this lookup table
function getFieldsReferencingTable(tableId: string): Array<{
  fieldId: string
  fieldName: string
  vesselName: string
  formName: string
}> {
  // In real app, this would query the actual field definitions
  // For now, return mock data based on tableId
  if (tableId === 'lt-001') {
    return [
      { fieldId: 'fd-001', fieldName: 'Vessel Condition', vesselName: 'MV Pacific Voyager', formName: 'Noon Report' },
      { fieldId: 'fd-002', fieldName: 'Ship Status', vesselName: 'MV Atlantic Runner', formName: 'Arrival Report' },
      { fieldId: 'fd-003', fieldName: 'Condition Code', vesselName: 'MV Nordic Star', formName: 'Departure Report' },
    ]
  } else if (tableId === 'lt-002') {
    return [
      { fieldId: 'fd-004', fieldName: 'Port Code', vesselName: 'MV Pacific Voyager', formName: 'Noon Report' },
      { fieldId: 'fd-005', fieldName: 'Destination Port', vesselName: 'MV Pacific Voyager', formName: 'Arrival Report' },
      { fieldId: 'fd-006', fieldName: 'Origin Port', vesselName: 'MV Atlantic Runner', formName: 'Departure Report' },
      { fieldId: 'fd-007', fieldName: 'Next Port', vesselName: 'MV Nordic Star', formName: 'Noon Report' },
      { fieldId: 'fd-008', fieldName: 'Current Port', vesselName: 'MV Nordic Star', formName: 'Port Report' },
    ]
  } else if (tableId === 'lt-003') {
    return [
      { fieldId: 'fd-009', fieldName: 'Fuel Type', vesselName: 'MV Pacific Voyager', formName: 'Bunkering Report' },
      { fieldId: 'fd-010', fieldName: 'Main Fuel Type', vesselName: 'MV Atlantic Runner', formName: 'Noon Report' },
    ]
  } else if (tableId === 'lt-004') {
    return [
      { fieldId: 'fd-011', fieldName: 'Sea State Code', vesselName: 'MV Pacific Voyager', formName: 'Noon Report' },
    ]
  }
  return []
}

// Validate source value format (single value or range like "0-13.5")
function validateSourceValue(value: string): { valid: boolean; error?: string } {
  if (!value.trim()) {
    return { valid: false, error: 'Source value is required' }
  }
  
  // Check if it's a range (contains hyphen with numbers on both sides)
  const rangePattern = /^-?\d+\.?\d*\s*-\s*-?\d+\.?\d*$/
  if (value.includes('-') && !value.startsWith('-')) {
    if (!rangePattern.test(value.replace(/\s/g, ''))) {
      return { valid: false, error: 'Invalid range format. Use "min-max" (e.g., "0-13.5")' }
    }
  }
  
  return { valid: true }
}

interface EditableRow extends LookupTableRow {
  id: string
  instruction?: string
  error?: string
}

export function AdminLookupTableDetail({ tableId, onBack }: AdminLookupTableDetailProps) {
  const isCreateMode = tableId === null
  const existingTable = tableId ? lookupTables.find(t => t.id === tableId) : null

  // Form state
  const [name, setName] = useState(existingTable?.name || '')
  const [description, setDescription] = useState(existingTable?.description || '')
  const [rows, setRows] = useState<EditableRow[]>(() => {
    if (existingTable) {
      return existingTable.rows.map((r, i) => ({
        ...r,
        id: `row-${i}`,
        instruction: '',
      }))
    }
    // Start with one empty row in create mode
    return [{ id: `row-${Date.now()}`, sourceValue: '', targetValue: '', instruction: '' }]
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [name, description, rows])

  // Reset on mount
  useEffect(() => {
    setHasUnsavedChanges(false)
  }, [])

  // Get referencing fields
  const referencingFields = tableId ? getFieldsReferencingTable(tableId) : []

  // Update a row
  const updateRow = (id: string, field: keyof EditableRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      // Validate source value on change
      if (field === 'sourceValue') {
        const validation = validateSourceValue(value)
        updated.error = validation.error
      }
      return updated
    }))
  }

  // Validate source value on blur
  const handleSourceBlur = (id: string, value: string) => {
    const validation = validateSourceValue(value)
    setRows(prev => prev.map(r => 
      r.id === id ? { ...r, error: validation.error } : r
    ))
  }

  // Add a new row
  const addRow = () => {
    setRows(prev => [...prev, { 
      id: `row-${Date.now()}`, 
      sourceValue: '', 
      targetValue: '', 
      instruction: '' 
    }])
  }

  // Remove a row
  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  // Save handler
  const handleSave = () => {
    // Validate all rows
    let hasErrors = false
    const validatedRows = rows.map(r => {
      const validation = validateSourceValue(r.sourceValue)
      if (!validation.valid) hasErrors = true
      return { ...r, error: validation.error }
    })
    setRows(validatedRows)

    if (hasErrors || !name.trim()) {
      return
    }

    // In real app, save to API
    console.log('Saving lookup table:', { name, description, rows })
    setHasUnsavedChanges(false)
    onBack()
  }

  // Discard handler
  const handleDiscard = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Discard unsaved changes?')) return
    }
    onBack()
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="h-6 w-px bg-[#e2e8f0]" />
            <h1 className="text-lg font-semibold text-[#0f172a]">
              {isCreateMode ? 'New Lookup Table' : 'Edit Lookup Table'}
            </h1>
          </div>

          {/* Unsaved indicator */}
          {hasUnsavedChanges && (
            <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-medium text-[#92400e]">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Name and description */}
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                  Table name <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Wind Direction"
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                  Description <span className="text-[#64748b]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this table used for?"
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>
            </div>
          </div>

          {/* Mapping table */}
          <div className="rounded-lg border border-[#e2e8f0] bg-white">
            <div className="border-b border-[#e2e8f0] px-6 py-4">
              <h2 className="text-sm font-medium text-[#334155]">Mappings</h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#64748b]">
                      Source value (or range)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#64748b]">
                      Target value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#64748b]">
                      <div>Natural-language instruction</div>
                      <div className="mt-0.5 font-normal normal-case tracking-normal text-[#94a3b8]">
                        Optional. Used when source values don&apos;t match exactly — describes how to choose.
                      </div>
                    </th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id} className={index < rows.length - 1 ? 'border-b border-[#e2e8f0]' : ''}>
                      <td className="px-4 py-3">
                        <div>
                          <input
                            type="text"
                            value={row.sourceValue}
                            onChange={(e) => updateRow(row.id, 'sourceValue', e.target.value)}
                            onBlur={(e) => handleSourceBlur(row.id, e.target.value)}
                            placeholder="e.g., LADEN or 0-13.5"
                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 ${
                              row.error 
                                ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]' 
                                : 'border-[#e2e8f0] focus:border-[#7c3aed] focus:ring-[#7c3aed]'
                            }`}
                          />
                          {row.error && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-[#ef4444]">
                              <AlertCircle className="h-3 w-3" />
                              {row.error}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.targetValue}
                          onChange={(e) => updateRow(row.id, 'targetValue', e.target.value)}
                          placeholder="e.g., L"
                          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.instruction || ''}
                          onChange={(e) => updateRow(row.id, 'instruction', e.target.value)}
                          placeholder="e.g., pick the closest 13.5° increment"
                          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#94a3b8]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row button */}
            <div className="border-t border-[#e2e8f0] px-4 py-3">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 rounded-lg border border-dashed border-[#d1d5db] px-3 py-2 text-sm text-[#64748b] hover:border-[#7c3aed] hover:bg-[#f8fafc] hover:text-[#7c3aed]"
              >
                <Plus className="h-4 w-4" />
                Add row
              </button>
            </div>
          </div>

          {/* Used by panel */}
          {!isCreateMode && referencingFields.length > 0 && (
            <div className="rounded-lg border border-[#e2e8f0] bg-white">
              <div className="border-b border-[#e2e8f0] px-6 py-4">
                <h2 className="text-sm font-medium text-[#334155]">
                  Used by ({referencingFields.length} {referencingFields.length === 1 ? 'field' : 'fields'})
                </h2>
              </div>
              <div className="divide-y divide-[#e2e8f0]">
                {referencingFields.map((field) => (
                  <a
                    key={field.fieldId}
                    href={`/admin?tab=field-definitions&id=${field.fieldId}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-[#f8fafc]"
                  >
                    <div>
                      <span className="font-medium text-[#334155]">{field.fieldName}</span>
                      <span className="mx-2 text-[#94a3b8]">•</span>
                      <span className="text-sm text-[#64748b]">{field.vesselName}</span>
                      <span className="mx-2 text-[#94a3b8]">•</span>
                      <span className="text-sm text-[#64748b]">{field.formName}</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#94a3b8]" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {!isCreateMode && referencingFields.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#d1d5db] bg-[#f8fafc] p-6 text-center">
              <p className="text-sm text-[#64748b]">No fields are using this lookup table yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-[#e2e8f0] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreateMode ? 'Create table' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
