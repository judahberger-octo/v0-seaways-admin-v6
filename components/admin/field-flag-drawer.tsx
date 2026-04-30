"use client"

import { X } from "lucide-react"
import {
  fieldDefinitions,
  flags,
  type Flag,
} from "@/lib/admin-mock-data"

interface FieldFlagDrawerProps {
  fieldId: string
  onClose: () => void
}

export function FieldFlagDrawer({ fieldId, onClose }: FieldFlagDrawerProps) {
  const field = fieldDefinitions.find(fd => fd.id === fieldId)
  const openFlags = flags.filter(f => f.fieldDefinitionId === fieldId && f.status === "open")

  if (!field) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-[600px] overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8f0] bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">{field.logicalName}</h2>
            <p className="mt-0.5 text-sm text-[#64748b]">
              {openFlags.length} open flags
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content placeholder - will be expanded in Prompt 19 */}
        <div className="p-6">
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-8 text-center">
            <p className="text-sm text-[#64748b]">
              Field flag detail drawer content will be implemented in Prompt 19
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
