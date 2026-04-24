"use client"

import { useState } from "react"
import { X, Flag, ChevronDown } from "lucide-react"

// Base Modal wrapper component
interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BaseModal({ isOpen, onClose, children }: BaseModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-400/60"
        onClick={onClose}
      />
      {/* Modal Card */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

// Unsaved Report Modal
interface UnsavedReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveAsDraft: () => void
  onDiscard: () => void
}

export function UnsavedReportModal({ 
  isOpen, 
  onClose, 
  onSaveAsDraft, 
  onDiscard 
}: UnsavedReportModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-semibold text-[#1e293b] mb-2 pr-8">
        Unsaved report
      </h2>
      <p className="text-[#64748b] mb-6">
        This report hasn&apos;t been completed. You can save it as a draft, or discard permanently
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onSaveAsDraft}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Save as draft
        </button>
        <button
          onClick={onDiscard}
          className="px-5 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Discard
        </button>
      </div>
    </BaseModal>
  )
}

// Discard Changes Modal
interface DiscardChangesModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveAndExit: () => void
  onDiscardChanges: () => void
}

export function DiscardChangesModal({ 
  isOpen, 
  onClose, 
  onSaveAndExit, 
  onDiscardChanges 
}: DiscardChangesModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-semibold text-[#1e293b] mb-2 pr-8">
        Discard changes?
      </h2>
      <p className="text-[#64748b] mb-6">
        Changes to this report will be lost
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onSaveAndExit}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Save & Exit
        </button>
        <button
          onClick={onDiscardChanges}
          className="px-5 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Discard changes
        </button>
      </div>
    </BaseModal>
  )
}

// Discard This Report Modal (confirmation step)
interface DiscardReportModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel: () => void
  onConfirmDiscard: () => void
}

export function DiscardReportModal({ 
  isOpen, 
  onClose, 
  onCancel, 
  onConfirmDiscard 
}: DiscardReportModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-semibold text-[#1e293b] mb-2 pr-8">
        Discard this report
      </h2>
      <p className="text-[#64748b] mb-6">
        This report will not be saved
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirmDiscard}
          className="px-5 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Yes, Discard
        </button>
      </div>
    </BaseModal>
  )
}

// Delete Draft Modal
interface DeleteDraftModalProps {
  isOpen: boolean
  onClose: () => void
  draftId: string
  onCancel: () => void
  onDelete: () => void
}

export function DeleteDraftModal({ 
  isOpen, 
  onClose, 
  draftId,
  onCancel, 
  onDelete 
}: DeleteDraftModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-semibold text-[#1e293b] mb-2 pr-8">
        Delete report draft {draftId}?
      </h2>
      <p className="text-[#64748b] mb-6">
        Are you sure you want to delete this report draft?<br />
        This action cannot be undone
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDelete}
          className="px-5 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Delete
        </button>
      </div>
    </BaseModal>
  )
}

// Flag Field Modal with form
interface FlagFieldModalProps {
  isOpen: boolean
  onClose: () => void
  fieldName: string
  onCancel: () => void
  onSubmit: (reason: string, comment: string) => void
}

const FLAG_REASONS = [
  "Incorrect source mapping",
  "Ambiguous value",
  "Conflicts with other reports",
  "Missing data",
  "Other"
]

export function FlagFieldModal({ 
  isOpen, 
  onClose, 
  fieldName,
  onCancel, 
  onSubmit 
}: FlagFieldModalProps) {
  const [reason, setReason] = useState("")
  const [comment, setComment] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSubmit = () => {
    if (reason) {
      onSubmit(reason, comment)
      setReason("")
      setComment("")
    }
  }

  const handleClose = () => {
    setReason("")
    setComment("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-400/60"
        onClick={handleClose}
      />
      {/* Modal Card - wider for form */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Flag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1e293b]">
              Flag Field
            </h2>
            <p className="text-sm text-[#64748b]">{fieldName}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Reason dropdown */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors text-left"
              >
                <span className={reason ? "text-[#1e293b]" : "text-gray-400"}>
                  {reason || "Select reason..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                  {FLAG_REASONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setReason(option)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                        reason === option ? "bg-purple-50 text-purple-700" : "text-[#1e293b]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment textarea */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason}
            className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
