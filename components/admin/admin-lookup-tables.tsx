"use client"

import { useState } from "react"
import { Table, Plus, ChevronRight, Calendar, User } from "lucide-react"
import { lookupTables, type LookupTable } from "@/lib/admin-mock-data"

// Mock data for field references per lookup table
const fieldReferenceCounts: Record<string, number> = {
  'lt-001': 3, // Vessel Condition Codes
  'lt-002': 5, // Port Codes
  'lt-003': 2, // Fuel Type Codes
  'lt-004': 1, // Sea State Codes
}

interface AdminLookupTablesProps {
  onSelectTable?: (id: string) => void
  onCreateTable?: () => void
}

export function AdminLookupTables({ onSelectTable, onCreateTable }: AdminLookupTablesProps) {
  const [tables] = useState<LookupTable[]>(lookupTables)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatAuthor = (email: string) => {
    return email.split('@')[0]
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Lookup Tables</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Reusable value mappings used by Lookup transforms in field definitions.
          </p>
        </div>
        <button
          onClick={onCreateTable}
          className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#6d28d9]"
        >
          <Plus className="h-4 w-4" />
          New lookup table
        </button>
      </div>

      {/* Tables list */}
      {tables.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#f1f5f9]">
            <Table className="h-6 w-6 text-[#64748b]" />
          </div>
          <h3 className="mb-2 text-base font-medium text-[#0f172a]">No tables yet</h3>
          <p className="mx-auto max-w-md text-sm text-[#64748b]">
            Lookup tables will appear here once created. They map source values to target values for field transformations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => {
            const refCount = fieldReferenceCounts[table.id] || 0
            
            return (
              <button
                key={table.id}
                onClick={() => onSelectTable?.(table.id)}
                className="group flex w-full items-center justify-between rounded-lg border border-[#e2e8f0] bg-white p-4 text-left transition-all hover:border-[#7c3aed] hover:shadow-sm"
              >
                <div className="flex-1">
                  {/* Table name and description */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3e8ff]">
                      <Table className="h-5 w-5 text-[#7c3aed]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#0f172a] group-hover:text-[#7c3aed]">
                        {table.name}
                      </h3>
                      {table.description && (
                        <p className="mt-0.5 text-sm text-[#64748b]">
                          {table.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata row */}
                  <div className="mt-3 flex items-center gap-4 pl-[52px] text-xs text-[#64748b]">
                    {/* Row count */}
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-[#334155]">{table.rows.length}</span>
                      {table.rows.length === 1 ? 'mapping' : 'mappings'}
                    </span>

                    {/* Last modified */}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(table.updatedAt)}
                    </span>

                    {/* Author */}
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {formatAuthor(table.createdBy)}
                    </span>

                    {/* Fields reference chip */}
                    {refCount > 0 && (
                      <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-medium text-[#1d4ed8]">
                        Used by {refCount} {refCount === 1 ? 'field' : 'fields'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight className="h-5 w-5 text-[#94a3b8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#7c3aed]" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
