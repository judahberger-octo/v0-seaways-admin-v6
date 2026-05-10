"use client"

import { useState, useEffect } from "react"
import { X, Flag, ChevronDown, Copy, Check, Send } from "lucide-react"

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
  "Incorrect value",
  "Ambiguous source mapping",
  "Conflicts with other reports",
  "Missing data",
  "Should be marked critical",
  "Should be mandatory manual fill",
  "Other"
]

// Reasons that trigger admin review helper text
const ADMIN_REVIEW_REASONS = [
  "Should be marked critical",
  "Should be mandatory manual fill"
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
        <div className="flex items-center gap-3 mb-2">
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
        
        {/* Subtitle explaining what flagging does */}
        <p className="text-sm text-[#64748b] mb-4">
          Flagging sends this field to an admin for review. The report can still be submitted.
        </p>

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
            
            {/* Admin review helper text - shown for critical/mandatory reasons */}
            {ADMIN_REVIEW_REASONS.includes(reason) && (
              <p className="mt-2 text-xs italic text-[#64748b]">
                Flagging a field as critical or mandatory will route this to admin review. If approved, the field will become part of every crew member&apos;s mandatory verification process on future reports.
              </p>
            )}
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
            Flag as incorrect
          </button>
        </div>
      </div>
    </div>
  )
}

// Manual Submission Modal - VesLink offline email flow
interface FormFieldData {
  id: string
  fieldName: string
  value?: string
  unit?: string
}

interface FormSectionData {
  id: string
  name: string
  fields: FormFieldData[]
}

interface ManualSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  onMarkAsSent: () => void
  formName: string
  vesselName: string
  formSections: FormSectionData[]
}

export function ManualSubmissionModal({
  isOpen,
  onClose,
  onMarkAsSent,
  formName,
  vesselName,
  formSections,
}: ManualSubmissionModalProps) {
  const [copyButtonText, setCopyButtonText] = useState("Copy email body")
  const [isCopied, setIsCopied] = useState(false)

  // Generate the email body content
  const generateEmailBody = () => {
    const lines: string[] = []
    
    // Header
    lines.push(`== ${formName} ==`)
    lines.push("")
    lines.push(`Vessel Name:  ${vesselName}`)
    
    // Find specific header fields
    const headerSection = formSections.find(s => s.id === "header")
    if (headerSection) {
      const latField = headerSection.fields.find(f => f.id === "latitude")
      const lonField = headerSection.fields.find(f => f.id === "longitude")
      const locationField = headerSection.fields.find(f => f.id === "location" || f.fieldName === "Location")
      const dateTimeField = headerSection.fields.find(f => f.id === "date-time")
      
      if (latField?.value) lines.push(`Latitude:  ${latField.value}`)
      if (lonField?.value) lines.push(`Longitude:  ${lonField.value}`)
      if (locationField?.value) lines.push(`Location:  ${locationField.value}`)
      else lines.push(`Location:  At Sea`)
      if (dateTimeField?.value) {
        const dateVal = dateTimeField.value
        lines.push(`Date/Time :  ${dateVal} GMT-12:00`)
      }
    }
    
    lines.push("")
    lines.push("Next Ports:")
    
    // Next port info
    const nextPortField = headerSection?.fields.find(f => f.id === "next-port")
    const etaField = headerSection?.fields.find(f => f.id === "eta")
    const distanceToGoField = formSections.flatMap(s => s.fields).find(f => f.id === "distance-to-go")
    const reportedSpeedField = formSections.flatMap(s => s.fields).find(f => f.id === "reported-speed")
    
    if (nextPortField?.value) {
      lines.push(`  ${nextPortField.value.toUpperCase()} ${etaField?.value || ""} GMT-12:00`)
      if (reportedSpeedField?.value) lines.push(`    Projected Speed: ${reportedSpeedField.value}`)
      if (distanceToGoField?.value) lines.push(`    Distance to Go: ${distanceToGoField.value}`)
    }
    
    lines.push("")
    
    // Process each section
    for (const section of formSections) {
      if (section.id === "header") continue // Already processed
      
      lines.push(`--${section.name}--`)
      
      for (const field of section.fields) {
        if (field.value) {
          const valueStr = field.unit ? `${field.value}` : field.value
          lines.push(`${field.fieldName}: ${valueStr}`)
        }
      }
      
      lines.push("")
    }
    
    // Generate base64 mock data block
    const formData = {
      formName,
      vesselName,
      timestamp: new Date().toISOString(),
      fields: formSections.flatMap(s => s.fields.map(f => ({
        id: f.id,
        name: f.fieldName,
        value: f.value || "",
        unit: f.unit || ""
      })))
    }
    
    const base64Data = btoa(JSON.stringify(formData))
    
    lines.push("-----BEGIN VESLINK FORM DATA-----")
    // Split base64 into 76-char lines
    for (let i = 0; i < base64Data.length; i += 76) {
      lines.push(base64Data.slice(i, i + 76))
    }
    lines.push("-----END VESLINK FORM DATA-----")
    
    return lines.join("\n")
  }

  const emailBody = generateEmailBody()
  const emailSubject = `Veslink Offline Form Submission: ${formName} - ${vesselName.toUpperCase()}`

  const handleCopyEmailBody = async () => {
    try {
      await navigator.clipboard.writeText(emailBody)
      setCopyButtonText("Copied ✓")
      setIsCopied(true)
      setTimeout(() => {
        setCopyButtonText("Copy email body")
        setIsCopied(false)
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = emailBody
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopyButtonText("Copied ✓")
      setIsCopied(true)
      setTimeout(() => {
        setCopyButtonText("Copy email body")
        setIsCopied(false)
      }, 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-500/60"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header strip */}
        <div className="bg-[#f1f5f9] px-5 py-3 flex items-center justify-between border-b border-[#e2e8f0]">
          <h2 className="text-base font-semibold text-[#0f172a]">Complete Form Submission</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <h3 className="text-lg font-semibold text-[#0f172a] mb-2">Manual Submission</h3>
          <p className="text-sm text-[#64748b] mb-5">
            To complete the report, send the email below to VesLink. Sometimes your email client cannot auto-create this email — in that case, copy the contents and send manually.
          </p>

          {/* Step 1: Email metadata */}
          <div className="mb-5">
            <p className="text-sm font-medium text-[#0f172a] mb-2">
              <span className="font-semibold">Step 1:</span> If no new email window has appeared, create the following email:
            </p>
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-[#e2e8f0]">
                    <td className="px-3 py-2 bg-[#f8fafc] text-[#64748b] font-medium w-20">To:</td>
                    <td className="px-3 py-2 text-[#0f172a]">forms@veslink.com</td>
                  </tr>
                  <tr className="border-b border-[#e2e8f0]">
                    <td className="px-3 py-2 bg-[#f8fafc] text-[#64748b] font-medium">Cc:</td>
                    <td className="px-3 py-2 text-[#94a3b8] italic"></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 bg-[#f8fafc] text-[#64748b] font-medium">Subject:</td>
                    <td className="px-3 py-2 text-[#0f172a]">{emailSubject}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2: Email body */}
          <div>
            <p className="text-sm font-medium text-[#0f172a] mb-2">
              <span className="font-semibold">Step 2:</span> Copy and paste the following text into your email&apos;s body:
            </p>
            <textarea
              readOnly
              value={emailBody}
              className="w-full h-[300px] px-3 py-2 text-xs font-mono text-[#334155] bg-white border border-[#e2e8f0] rounded-lg resize-none focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-end gap-3">
          <button
            onClick={handleCopyEmailBody}
            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors flex items-center gap-2 ${
              isCopied 
                ? "border-green-500 text-green-600 bg-green-50" 
                : "border-[#e2e8f0] text-[#334155] hover:bg-white"
            }`}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copyButtonText}
          </button>
          <button
            onClick={onMarkAsSent}
            className="px-4 py-2 text-sm font-medium bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Mark as Sent
          </button>
        </div>
      </div>
    </div>
  )
}
