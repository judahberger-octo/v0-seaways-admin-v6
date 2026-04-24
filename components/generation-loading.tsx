"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"

interface GenerationLoadingProps {
  reportId: string
  onComplete: () => void
}

export function GenerationLoading({ reportId, onComplete }: GenerationLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const steps = [
    "Reading NAVTOR report data",
    "Identifying target form fields",
    "Mapping source to target",
    "Running validation checks",
  ]

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 600)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          clearInterval(stepInterval)
          setTimeout(onComplete, 300)
          return 100
        }
        return prev + 4
      })
    }, 100)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [onComplete, steps.length])

  return (
    <div className="fixed inset-0 bg-[#f8fafc] flex items-center justify-center z-50">
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-6 text-center">
          Generating VesLink form from NAVTOR Report #{reportId}...
        </h2>

        <div className="space-y-3 mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              {index < currentStep ? (
                <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : index === currentStep ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-[#d1d5db] flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  index <= currentStep ? "text-[#0f172a]" : "text-[#94a3b8]"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full bg-[#e2e8f0] rounded-full h-1.5">
          <div
            className="bg-[#7c3aed] h-1.5 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
