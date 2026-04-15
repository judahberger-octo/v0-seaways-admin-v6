"use client"

import { useState } from "react"
import { X, Play, Check, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"

interface AdminTestingSuiteProps {
  fieldName: string
  fieldValue: string
  fieldUnit?: string
  sourceTab: string
  sourceField: string
  onClose: () => void
  onSave: () => void
}

interface TestResult {
  run: number
  extracted: string
  confidence: number
  match: boolean
  duration: string
}

interface ChangeHistoryEntry {
  date: string
  changedBy: string
  whatChanged: string
}

const mockTestResults: TestResult[] = [
  { run: 1, extracted: "16.6", confidence: 98, match: true, duration: "0.7s" },
  { run: 2, extracted: "16.6", confidence: 97, match: true, duration: "0.9s" },
  { run: 3, extracted: "16.6", confidence: 99, match: true, duration: "0.6s" },
  { run: 4, extracted: "16.6", confidence: 96, match: true, duration: "0.8s" },
  { run: 5, extracted: "16.60", confidence: 91, match: false, duration: "1.1s" },
  { run: 6, extracted: "16.6", confidence: 98, match: true, duration: "0.7s" },
  { run: 7, extracted: "16.6", confidence: 97, match: true, duration: "0.8s" },
  { run: 8, extracted: "16.6", confidence: 98, match: true, duration: "0.7s" },
  { run: 9, extracted: "16.6", confidence: 99, match: true, duration: "0.6s" },
  { run: 10, extracted: "16.6", confidence: 97, match: true, duration: "0.8s" },
]

const mockChangeHistory: ChangeHistoryEntry[] = [
  { date: "Apr 10, 2026", changedBy: "Avinash", whatChanged: "Updated source section from 'Voyage Details' to 'Operating Conditions'" },
  { date: "Mar 28, 2026", changedBy: "System", whatChanged: "Accuracy alert triggered (dropped below 90%)" },
  { date: "Mar 15, 2026", changedBy: "Sarah", whatChanged: "Added validation rule: max value 25m" },
  { date: "Feb 20, 2026", changedBy: "System", whatChanged: "Initial field definition created" },
]

export function AdminTestingSuite({
  fieldName,
  fieldValue,
  fieldUnit,
  sourceTab,
  sourceField,
  onClose,
  onSave,
}: AdminTestingSuiteProps) {
  const [activeTab, setActiveTab] = useState<"extraction" | "test" | "history">("extraction")
  const [isValidationExpanded, setIsValidationExpanded] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  // Form state
  const [navtorSourceTab, setNavtorSourceTab] = useState(sourceTab)
  const [sourceSection, setSourceSection] = useState("Operating Conditions")
  const [sourceParameter, setSourceParameter] = useState(sourceField)
  const [tableRow, setTableRow] = useState("")
  const [tableColumn, setTableColumn] = useState("")
  const [extraInstructions, setExtraInstructions] = useState(
    `Direct field mapping — take the ${sourceField} value from ${sourceSection} section.`
  )
  const [minRange, setMinRange] = useState("0")
  const [maxRange, setMaxRange] = useState("25")
  const [isRequired, setIsRequired] = useState(true)
  const [isCritical, setIsCritical] = useState(true)
  const [checksumGroup, setChecksumGroup] = useState("none")

  const runTest = () => {
    setIsRunning(true)
    setTestResults([])
    
    // Simulate test running
    let count = 0
    const interval = setInterval(() => {
      if (count < mockTestResults.length) {
        setTestResults(prev => [...prev, mockTestResults[count]])
        count++
      } else {
        clearInterval(interval)
        setIsRunning(false)
      }
    }, 200)
  }

  const successCount = testResults.filter(r => r.match).length
  const successRate = testResults.length > 0 ? (successCount / testResults.length) * 100 : 0
  const avgConfidence = testResults.length > 0 
    ? Math.round(testResults.reduce((sum, r) => sum + r.confidence, 0) / testResults.length)
    : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#0f172a]">
                Field Testing Suite — {fieldName}
              </h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                Edit extraction logic and test accuracy
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4">
            <button
              onClick={() => setActiveTab("extraction")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "extraction"
                  ? "bg-[#ede9fe] text-[#7c3aed]"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              Extraction Logic
            </button>
            <button
              onClick={() => setActiveTab("test")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "test"
                  ? "bg-[#ede9fe] text-[#7c3aed]"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              Test Results
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "history"
                  ? "bg-[#ede9fe] text-[#7c3aed]"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "extraction" && (
            <div className="space-y-5">
              {/* Source Mapping */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                    NAVTOR Source Tab
                  </label>
                  <select
                    value={navtorSourceTab}
                    onChange={(e) => setNavtorSourceTab(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Pos & Weather">Pos & Weather</option>
                    <option value="Power">Power</option>
                    <option value="Consumptions">Consumptions</option>
                    <option value="Bunker">Bunker</option>
                    <option value="Stock">Stock</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                      Source Section
                    </label>
                    <input
                      type="text"
                      value={sourceSection}
                      onChange={(e) => setSourceSection(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                      Source Parameter
                    </label>
                    <input
                      type="text"
                      value={sourceParameter}
                      onChange={(e) => setSourceParameter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                      Table Row <span className="text-[#94a3b8] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={tableRow}
                      onChange={(e) => setTableRow(e.target.value)}
                      placeholder="e.g., IFO"
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                      Table Column <span className="text-[#94a3b8] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={tableColumn}
                      onChange={(e) => setTableColumn(e.target.value)}
                      placeholder="e.g., Main"
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                    Extra Instructions
                  </label>
                  <textarea
                    value={extraInstructions}
                    onChange={(e) => setExtraInstructions(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] resize-none"
                  />
                </div>
              </div>

              {/* Validation Rules */}
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                <button
                  onClick={() => setIsValidationExpanded(!isValidationExpanded)}
                  className="w-full flex items-center justify-between p-3 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors"
                >
                  <span className="text-sm font-medium text-[#0f172a]">Validation Rules</span>
                  {isValidationExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#64748b]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#64748b]" />
                  )}
                </button>
                
                {isValidationExpanded && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                        Expected Range
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#64748b]">Min</span>
                        <input
                          type="text"
                          value={minRange}
                          onChange={(e) => setMinRange(e.target.value)}
                          className="w-20 px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                        />
                        <span className="text-sm text-[#64748b]">Max</span>
                        <input
                          type="text"
                          value={maxRange}
                          onChange={(e) => setMaxRange(e.target.value)}
                          className="w-20 px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                        />
                        <span className="text-sm text-[#94a3b8]">{fieldUnit || "m"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          onClick={() => setIsRequired(!isRequired)}
                          className={`w-9 h-5 rounded-full transition-colors ${
                            isRequired ? "bg-[#7c3aed]" : "bg-[#e2e8f0]"
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                              isRequired ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-sm text-[#0f172a]">Required field</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          onClick={() => setIsCritical(!isCritical)}
                          className={`w-9 h-5 rounded-full transition-colors ${
                            isCritical ? "bg-[#7c3aed]" : "bg-[#e2e8f0]"
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                              isCritical ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-sm text-[#0f172a]">Critical field</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                        Checksum Group
                      </label>
                      <select
                        value={checksumGroup}
                        onChange={(e) => setChecksumGroup(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]"
                      >
                        <option value="none">None</option>
                        <option value="fuel-rob">Fuel ROB Totals</option>
                        <option value="consumption">Consumption Totals</option>
                        <option value="water">Water Totals</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "test" && (
            <div className="space-y-5">
              {/* Run Test Button */}
              <button
                onClick={runTest}
                disabled={isRunning}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isRunning
                    ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                    : "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                }`}
              >
                <Play className="w-4 h-4" />
                {isRunning ? "Running..." : "Run 10 iterations"}
              </button>

              {/* Results Summary */}
              {testResults.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                    <div className="text-2xl font-semibold text-[#0f172a]">
                      {successCount}/{testResults.length}
                    </div>
                    <div className="text-xs text-[#64748b] mt-0.5">Success Rate</div>
                    <div className={`text-sm font-medium mt-1 ${
                      successRate >= 90 ? "text-[#16a34a]" : successRate >= 70 ? "text-[#d97706]" : "text-[#dc2626]"
                    }`}>
                      {successRate.toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                    <div className="text-2xl font-semibold text-[#0f172a]">{avgConfidence}%</div>
                    <div className="text-xs text-[#64748b] mt-0.5">Avg Confidence</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-[#0f172a]">16.6</div>
                    <div className="text-xs text-[#64748b] mt-0.5">Most Common</div>
                    <div className="text-xs text-[#94a3b8] mt-1">({successCount}x)</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-lg p-3 text-center">
                    <div className="text-2xl font-semibold text-[#0f172a]">0.8s</div>
                    <div className="text-xs text-[#64748b] mt-0.5">Avg Duration</div>
                  </div>
                </div>
              )}

              {/* Results Table */}
              {testResults.length > 0 && (
                <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                        <th className="text-left px-4 py-2.5 font-medium text-[#64748b]">Run #</th>
                        <th className="text-left px-4 py-2.5 font-medium text-[#64748b]">Extracted</th>
                        <th className="text-left px-4 py-2.5 font-medium text-[#64748b]">Confidence</th>
                        <th className="text-center px-4 py-2.5 font-medium text-[#64748b]">Match?</th>
                        <th className="text-right px-4 py-2.5 font-medium text-[#64748b]">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.map((result) => (
                        <tr key={result.run} className="border-b border-[#e2e8f0] last:border-0">
                          <td className="px-4 py-2.5 text-[#0f172a]">{result.run}</td>
                          <td className="px-4 py-2.5 text-[#0f172a] font-medium">{result.extracted}</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-medium ${
                              result.confidence >= 95 ? "text-[#16a34a]" : "text-[#d97706]"
                            }`}>
                              {result.confidence}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {result.match ? (
                              <Check className="w-4 h-4 text-[#16a34a] inline" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-[#d97706] inline" />
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[#64748b]">{result.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {testResults.length === 0 && !isRunning && (
                <div className="text-center py-12 text-[#94a3b8]">
                  <Play className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Click &quot;Run 10 iterations&quot; to test the extraction logic</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <th className="text-left px-4 py-2.5 font-medium text-[#64748b]">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[#64748b]">Changed by</th>
                    <th className="text-left px-4 py-2.5 font-medium text-[#64748b]">What changed</th>
                  </tr>
                </thead>
                <tbody>
                  {mockChangeHistory.map((entry, index) => (
                    <tr key={index} className="border-b border-[#e2e8f0] last:border-0">
                      <td className="px-4 py-3 text-[#0f172a] whitespace-nowrap">{entry.date}</td>
                      <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{entry.changedBy}</td>
                      <td className="px-4 py-3 text-[#64748b]">{entry.whatChanged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
          <button className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">
            Revert to Default
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-[#e2e8f0] rounded-lg hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 text-sm font-medium bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
