import React, { useState, useEffect, useCallback } from "react"
import { MBSITrendsSection, MBSIAssessmentRecord } from "./MBSITrendsSection"

interface MindBodyScreenProps {
  onBack: () => void
  onNav: (screen: any) => void
  currentMsi?: number | null
  baselineMsi?: number | null
}

interface BiomarkerInput {
  value: string
  unit: string
  testDate: string
  labName: string
}

// Client-side preview normalization for immediate user feedback
function previewNormalizeCortisol(val: number, unit: string): number {
  if (isNaN(val) || val <= 0) return 0
  const ugVal = unit === "nmol/L" ? val / 27.586 : val
  const normalized = ((ugVal - 4.0) / (28.0 - 4.0)) * 100
  return Math.max(0, Math.min(100, Math.round(normalized * 10) / 10))
}

function previewNormalizeDhea(val: number, unit: string): number {
  if (isNaN(val) || val <= 0) return 0
  const ugVal = unit === "µmol/L" || unit === "umol/L" ? val * 36.85 : val
  // Inverse scale: lower DHEA = higher stress
  const normalized = ((500.0 - ugVal) / (500.0 - 60.0)) * 100
  return Math.max(0, Math.min(100, Math.round(normalized * 10) / 10))
}

function previewNormalizeCrp(val: number, unit: string): number {
  if (isNaN(val) || val < 0) return 0
  const mgLVal = unit === "mg/dL" ? val * 10 : val
  const normalized = ((mgLVal - 0.2) / (10.0 - 0.2)) * 100
  return Math.max(0, Math.min(100, Math.round(normalized * 10) / 10))
}

export default function MindBodyScreen({
  onBack,
  onNav,
  currentMsi: passedCurrentMsi,
  baselineMsi: passedBaselineMsi,
}: MindBodyScreenProps) {
  // Psychological MSI score state
  const [activeMsi, setActiveMsi] = useState<number | null>(() => {
    if (typeof passedCurrentMsi === "number") return passedCurrentMsi
    if (typeof passedBaselineMsi === "number") return passedBaselineMsi
    const stored = localStorage.getItem("cq_current_msi") || localStorage.getItem("cq_baseline_msi")
    return stored ? parseInt(stored, 10) : null
  })

  // Inputs for the 3 biological biomarkers
  const [cortisol, setCortisol] = useState<BiomarkerInput>({
    value: "",
    unit: "µg/dL",
    testDate: new Date().toISOString().split("T")[0],
    labName: "",
  })

  const [dhea, setDhea] = useState<BiomarkerInput>({
    value: "",
    unit: "µg/dL",
    testDate: new Date().toISOString().split("T")[0],
    labName: "",
  })

  const [crp, setCrp] = useState<BiomarkerInput>({
    value: "",
    unit: "mg/L",
    testDate: new Date().toISOString().split("T")[0],
    labName: "",
  })

  // Calculation and assessment state
  const [latestAssessment, setLatestAssessment] = useState<MBSIAssessmentRecord | null>(null)
  const [history, setHistory] = useState<MBSIAssessmentRecord[]>([])
  const [calculating, setCalculating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Fetch latest MBSI & history from backend
  const fetchData = useCallback(() => {
    const token = localStorage.getItem("cq_token")
    if (!token) return

    setLoadingData(true)
    Promise.all([
      fetch("/api/mbsi/latest", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/mbsi/history", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([latestRes, historyRes]) => {
        if (latestRes.success) {
          if (typeof latestRes.currentMsi === "number") {
            setActiveMsi(latestRes.currentMsi)
          }
          if (latestRes.hasMbsi && latestRes.data) {
            setLatestAssessment(latestRes.data)
            // Pre-fill inputs with latest tested values for convenient re-assessment
            if (latestRes.data.biomarkers) {
              const b = latestRes.data.biomarkers
              if (b.cortisol) {
                setCortisol((prev) => ({
                  ...prev,
                  value: String(b.cortisol.raw ?? ""),
                  unit: b.cortisol.unit || "µg/dL",
                  labName: b.cortisol.labName || "",
                }))
              }
              if (b.dhea) {
                setDhea((prev) => ({
                  ...prev,
                  value: String(b.dhea.raw ?? ""),
                  unit: b.dhea.unit || "µg/dL",
                  labName: b.dhea.labName || "",
                }))
              }
              if (b.crp) {
                setCrp((prev) => ({
                  ...prev,
                  value: String(b.crp.raw ?? ""),
                  unit: b.crp.unit || "mg/L",
                  labName: b.crp.labName || "",
                }))
              }
            }
          }
        }
        if (historyRes.success && Array.isArray(historyRes.data)) {
          setHistory(historyRes.data)
        }
      })
      .catch((err) => {
        console.error("Error loading MBSI data:", err)
      })
      .finally(() => {
        setLoadingData(false)
      })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Live preview scores
  const cVal = parseFloat(cortisol.value)
  const dVal = parseFloat(dhea.value)
  const crpVal = parseFloat(crp.value)

  const hasCortisol = !isNaN(cVal) && cVal > 0
  const hasDhea = !isNaN(dVal) && dVal > 0
  const hasCrp = !isNaN(crpVal) && crpVal >= 0

  const previewCortisolScore = hasCortisol ? previewNormalizeCortisol(cVal, cortisol.unit) : null
  const previewDheaScore = hasDhea ? previewNormalizeDhea(dVal, dhea.unit) : null
  const previewCrpScore = hasCrp ? previewNormalizeCrp(crpVal, crp.unit) : null

  const canPreviewBsi = previewCortisolScore !== null && previewDheaScore !== null && previewCrpScore !== null
  const previewBsiScore = canPreviewBsi
    ? Math.round((0.4 * previewCortisolScore! + 0.3 * previewDheaScore! + 0.3 * previewCrpScore!) * 10) / 10
    : null

  const previewMbsiScore =
    canPreviewBsi && activeMsi !== null
      ? Math.round((0.6 * activeMsi + 0.4 * previewBsiScore!) * 10) / 10
      : null

  // Handle calculation submission
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (activeMsi === null) {
      setErrorMsg("A valid psychological MSI score is required. Please calibrate your Baseline MSI first.")
      return
    }

    if (!hasCortisol || !hasDhea || !hasCrp) {
      setErrorMsg("All three biological biomarkers (Cortisol, DHEA-S, CRP) are required with valid positive numbers.")
      return
    }

    const token = localStorage.getItem("cq_token")
    if (!token) {
      setErrorMsg("Authentication session expired. Please log in again.")
      return
    }

    setCalculating(true)
    try {
      const res = await fetch("/api/mbsi/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cortisol: {
            value: cVal,
            unit: cortisol.unit,
            testDate: cortisol.testDate,
            labName: cortisol.labName.trim() || undefined,
          },
          dhea: {
            value: dVal,
            unit: dhea.unit,
            testDate: dhea.testDate,
            labName: dhea.labName.trim() || undefined,
          },
          crp: {
            value: crpVal,
            unit: crp.unit,
            testDate: crp.testDate,
            labName: crp.labName.trim() || undefined,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Calculation failed.")
      }

      setLatestAssessment(data.data)
      setSuccessMsg("Mind-Body Stress Index calculated and recorded successfully.")

      // Cache latest MBSI locally for instant dashboard synchronization
      if (data.data) {
        localStorage.setItem(
          "cq_latest_mbsi",
          JSON.stringify({
            score: data.data.mbsiScore,
            bsiScore: data.data.bsiScore,
            msiScore: data.data.msiScore,
            calculatedAt: data.data.calculatedAt,
            assessmentId: data.data._id,
          })
        )
      }

      // Trigger dashboard cache invalidation event
      window.dispatchEvent(new CustomEvent("cq_baseline_updated"))
      window.dispatchEvent(new CustomEvent("cq_mbsi_updated", { detail: data.data }))

      // Refresh history
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to calculate MBSI.")
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-5 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] relative">
      <div className="relative max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-up">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-text-muted hover:text-purple-core transition-colors cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-black/[0.03]"
            aria-label="Back to dashboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor">
              <path d="M10 4L6 8l4 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-purple-core/10 text-purple-core border border-purple-core/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-core animate-pulse" />
            <span>Provisional Calculator v1.0</span>
          </span>
        </div>

        {/* MBSI Overview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🫀</span>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-white">
              Mind-Body Stress Index Calculator
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            MBSI integrates your psychological stress signals (<strong>60% MSI</strong>) with laboratory-measured neuroendocrine and inflammatory biomarkers (<strong>40% BSI</strong>) into a unified, deterministic index.
          </p>

          <div className="inline-flex items-center gap-2 text-[11px] font-mono-data bg-surface border border-border-p px-3 py-1.5 rounded-xl text-text-secondary">
            <span className="font-semibold text-purple-core">Formula:</span>
            <span>MBSI = (0.60 × MSI) + (0.40 × BSI)</span>
          </div>
        </div>

        {/* 1. Psychological Component Status */}
        <div className="card-base p-5 border border-border-p bg-surface/90">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">
                Psychological Component (60% Weight)
              </p>
              <h2 className="text-base font-bold text-warm-white mt-0.5">Mind Stress Index (MSI)</h2>
            </div>
            {activeMsi !== null ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-core/10 text-purple-core border border-purple-core/20">
                Score: {activeMsi} / 100
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-c-warning/10 text-c-warning border border-c-warning/20">
                Action Required
              </span>
            )}
          </div>

          {activeMsi !== null ? (
            <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-p/60">
              <span>Contribution to final MBSI:</span>
              <span className="font-semibold font-mono-data text-warm-white">
                {activeMsi} × 0.60 = +{(activeMsi * 0.6).toFixed(1)} pts
              </span>
            </div>
          ) : (
            <div className="mt-2 p-3 rounded-xl bg-c-warning/5 border border-c-warning/20 flex items-center justify-between gap-3">
              <p className="text-xs text-text-secondary">
                No active MSI score found. Calibrate your Baseline MSI to enable MBSI calculation.
              </p>
              <button
                onClick={() => onNav("baseline-msi")}
                className="btn-primary py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Start Baseline MSI →
              </button>
            </div>
          )}
        </div>

        {/* 2. Biological Biomarker Inputs (BSI Calculator) */}
        <form onSubmit={handleCalculate} className="card-base p-5 sm:p-6 border border-border-p bg-surface space-y-5">
          <div className="flex items-center justify-between border-b border-border-p pb-3">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">
                Biological Component (40% Weight)
              </p>
              <h2 className="text-base font-bold text-warm-white">Enter Laboratory Biomarkers</h2>
              <p className="text-xs text-text-muted mt-0.5">
                BSI = (0.40 × Cortisol) + (0.30 × DHEA-S) + (0.30 × CRP)
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-c-critical/10 border border-c-critical/30 text-c-critical text-xs font-medium flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-c-success/10 border border-c-success/30 text-c-success text-xs font-medium flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Biomarker 1: Cortisol */}
            <div className="p-4 rounded-2xl bg-midnight/40 border border-border-p/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-core" />
                  <span className="text-sm font-bold text-warm-white">1. Cortisol</span>
                  <span className="text-[10px] text-text-muted">(40% of BSI)</span>
                </div>
                {previewCortisolScore !== null && (
                  <span className="text-[11px] font-mono-data text-purple-core font-semibold bg-purple-core/10 px-2 py-0.5 rounded-md">
                    Normalized: {previewCortisolScore} / 100
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-text-muted mb-1">Measured Value</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 14.5"
                      value={cortisol.value}
                      onChange={(e) => setCortisol({ ...cortisol, value: e.target.value })}
                      required
                      className="w-full bg-surface border border-border-p rounded-xl px-3 py-2 text-sm text-warm-white focus:outline-none focus:border-purple-core"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-medium text-text-muted mb-1">Unit</label>
                    <select
                      value={cortisol.unit}
                      onChange={(e) => setCortisol({ ...cortisol, unit: e.target.value })}
                      className="w-full bg-surface border border-border-p rounded-xl px-2 py-2 text-xs text-warm-white focus:outline-none focus:border-purple-core"
                    >
                      <option value="µg/dL">µg/dL</option>
                      <option value="nmol/L">nmol/L</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-text-muted mb-1">Test Date</label>
                  <input
                    type="date"
                    value={cortisol.testDate}
                    onChange={(e) => setCortisol({ ...cortisol, testDate: e.target.value })}
                    required
                    className="w-full bg-surface border border-border-p rounded-xl px-2.5 py-2 text-xs text-warm-white focus:outline-none focus:border-purple-core"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                <span>Standard morning range: 6.0 – 23.0 µg/dL (165 – 635 nmol/L)</span>
                <input
                  type="text"
                  placeholder="Lab source (optional)"
                  value={cortisol.labName}
                  onChange={(e) => setCortisol({ ...cortisol, labName: e.target.value })}
                  className="bg-transparent border-b border-border-p/60 text-[10px] text-warm-white px-1 py-0.5 w-32 focus:outline-none focus:border-purple-core"
                />
              </div>
            </div>

            {/* Biomarker 2: DHEA-S */}
            <div className="p-4 rounded-2xl bg-midnight/40 border border-border-p/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lavender-bright" />
                  <span className="text-sm font-bold text-warm-white">2. DHEA-S</span>
                  <span className="text-[10px] text-text-muted">(30% of BSI · Inverse resilience)</span>
                </div>
                {previewDheaScore !== null && (
                  <span className="text-[11px] font-mono-data text-lavender-bright font-semibold bg-lavender-bright/10 px-2 py-0.5 rounded-md">
                    Normalized: {previewDheaScore} / 100
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-text-muted mb-1">Measured Value</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 260"
                      value={dhea.value}
                      onChange={(e) => setDhea({ ...dhea, value: e.target.value })}
                      required
                      className="w-full bg-surface border border-border-p rounded-xl px-3 py-2 text-sm text-warm-white focus:outline-none focus:border-purple-core"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-medium text-text-muted mb-1">Unit</label>
                    <select
                      value={dhea.unit}
                      onChange={(e) => setDhea({ ...dhea, unit: e.target.value })}
                      className="w-full bg-surface border border-border-p rounded-xl px-2 py-2 text-xs text-warm-white focus:outline-none focus:border-purple-core"
                    >
                      <option value="µg/dL">µg/dL</option>
                      <option value="µmol/L">µmol/L</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-text-muted mb-1">Test Date</label>
                  <input
                    type="date"
                    value={dhea.testDate}
                    onChange={(e) => setDhea({ ...dhea, testDate: e.target.value })}
                    required
                    className="w-full bg-surface border border-border-p rounded-xl px-2.5 py-2 text-xs text-warm-white focus:outline-none focus:border-purple-core"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                <span>Standard adult range: 80 – 560 µg/dL (2.2 – 15.2 µmol/L)</span>
                <input
                  type="text"
                  placeholder="Lab source (optional)"
                  value={dhea.labName}
                  onChange={(e) => setDhea({ ...dhea, labName: e.target.value })}
                  className="bg-transparent border-b border-border-p/60 text-[10px] text-warm-white px-1 py-0.5 w-32 focus:outline-none focus:border-purple-core"
                />
              </div>
            </div>

            {/* Biomarker 3: CRP */}
            <div className="p-4 rounded-2xl bg-midnight/40 border border-border-p/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-c-warning" />
                  <span className="text-sm font-bold text-warm-white">3. CRP (hs-CRP)</span>
                  <span className="text-[10px] text-text-muted">(30% of BSI · Systemic Inflammation)</span>
                </div>
                {previewCrpScore !== null && (
                  <span className="text-[11px] font-mono-data text-c-warning font-semibold bg-c-warning/10 px-2 py-0.5 rounded-md">
                    Normalized: {previewCrpScore} / 100
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-text-muted mb-1">Measured Value</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.00"
                      placeholder="e.g. 1.2"
                      value={crp.value}
                      onChange={(e) => setCrp({ ...crp, value: e.target.value })}
                      required
                      className="w-full bg-surface border border-border-p rounded-xl px-3 py-2 text-sm text-warm-white focus:outline-none focus:border-purple-core"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-medium text-text-muted mb-1">Unit</label>
                    <select
                      value={crp.unit}
                      onChange={(e) => setCrp({ ...crp, unit: e.target.value })}
                      className="w-full bg-surface border border-border-p rounded-xl px-2 py-2 text-xs text-warm-white focus:outline-none focus:border-purple-core"
                    >
                      <option value="mg/L">mg/L</option>
                      <option value="mg/dL">mg/dL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-text-muted mb-1">Test Date</label>
                  <input
                    type="date"
                    value={crp.testDate}
                    onChange={(e) => setCrp({ ...crp, testDate: e.target.value })}
                    required
                    className="w-full bg-surface border border-border-p rounded-xl px-2.5 py-2 text-xs text-warm-white focus:outline-none focus:border-purple-core"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                <span>CDC/AHA: &lt;1.0 mg/L (Low), 1.0–3.0 mg/L (Average), &gt;3.0 mg/L (Elevated)</span>
                <input
                  type="text"
                  placeholder="Lab source (optional)"
                  value={crp.labName}
                  onChange={(e) => setCrp({ ...crp, labName: e.target.value })}
                  className="bg-transparent border-b border-border-p/60 text-[10px] text-warm-white px-1 py-0.5 w-32 focus:outline-none focus:border-purple-core"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={calculating || activeMsi === null || !hasCortisol || !hasDhea || !hasCrp}
            className="w-full btn-primary py-3 px-4 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {calculating ? "Calculating Deterministic MBSI..." : "Calculate Mind-Body Stress Index →"}
          </button>
        </form>

        {/* 3. Final MBSI Result Section */}
        {latestAssessment && (
          <div className="card-base p-6 sm:p-7 border border-purple-core/30 bg-surface glow-subtle space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-purple-core bg-purple-core/10 px-2.5 py-1 rounded-full border border-purple-core/20">
                  Calculated Result
                </span>
                <h2 className="text-lg font-bold text-warm-white mt-1.5">Your Mind-Body Stress Index</h2>
                <p className="text-xs text-text-muted">
                  Calculated on {new Date(latestAssessment.calculatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Circular Gauge Visual */}
              <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E2D4BE"
                    strokeWidth="8"
                    strokeOpacity="0.4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#B5572E"
                    strokeWidth="8"
                    strokeDasharray={`${(latestAssessment.mbsiScore / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-xl font-bold font-mono-data text-warm-white leading-none">
                    {Math.round(latestAssessment.mbsiScore)}
                  </p>
                  <p className="text-[9px] font-medium text-text-muted mt-0.5">/ 100</p>
                </div>
              </div>
            </div>

            {/* Contribution Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-midnight/50 border border-border-p space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Psychological (60%)</span>
                  <span className="font-bold text-warm-white font-mono-data">{latestAssessment.msiScore} / 100</span>
                </div>
                <div className="text-xs text-purple-core font-semibold font-mono-data">
                  +{(latestAssessment.msiScore * 0.6).toFixed(1)} points to MBSI
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-midnight/50 border border-border-p space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Biological (40% BSI)</span>
                  <span className="font-bold text-warm-white font-mono-data">{latestAssessment.bsiScore} / 100</span>
                </div>
                <div className="text-xs text-purple-core font-semibold font-mono-data">
                  +{(latestAssessment.bsiScore * 0.4).toFixed(1)} points to MBSI
                </div>
              </div>
            </div>

            {/* Individual Biomarker Contribution Cards */}
            <div className="space-y-2 pt-2 border-t border-border-p/60">
              <p className="text-[11px] font-semibold text-text-muted">Biomarker Component Breakdown:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-surface border border-border-p space-y-0.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-muted font-medium">Cortisol</span>
                    <span className="font-mono-data font-bold text-warm-white">
                      {latestAssessment.biomarkers?.cortisol?.normalizedScore ?? "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted">
                    {latestAssessment.biomarkers?.cortisol?.raw} {latestAssessment.biomarkers?.cortisol?.unit} (40% BSI)
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-p space-y-0.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-muted font-medium">DHEA-S</span>
                    <span className="font-mono-data font-bold text-warm-white">
                      {latestAssessment.biomarkers?.dhea?.normalizedScore ?? "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted">
                    {latestAssessment.biomarkers?.dhea?.raw} {latestAssessment.biomarkers?.dhea?.unit} (30% BSI)
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-p space-y-0.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-muted font-medium">CRP</span>
                    <span className="font-mono-data font-bold text-warm-white">
                      {latestAssessment.biomarkers?.crp?.normalizedScore ?? "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted">
                    {latestAssessment.biomarkers?.crp?.raw} {latestAssessment.biomarkers?.crp?.unit} (30% BSI)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. MBSI Trends & Historical Analysis */}
        <MBSITrendsSection history={history} onRefresh={fetchData} />

        {/* 5. Methodology & Provisional Validation Note */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface/70 border border-border-p text-xs text-text-muted space-y-2">
          <p className="font-semibold text-warm-white flex items-center gap-1.5">
            <span>ℹ</span>
            <span>Methodology & Provisional Scientific Validation</span>
          </p>
          <p className="leading-relaxed">
            The Mind-Body Stress Index (MBSI) formula <code>MBSI = (0.60 × MSI) + (0.40 × BSI)</code> and biomarker weighting (40% Cortisol, 30% DHEA-S, 30% hs-CRP) represent a provisional research framework designed to evaluate multi-system stress and neuroendocrine resilience.
          </p>
          <p className="leading-relaxed">
            Biomarker normalization scales rely on standard clinical pathology reference intervals (Morning Serum Cortisol 4.0–28.0 µg/dL, DHEA-S 60–500 µg/dL, hs-CRP 0.2–10.0 mg/L). Calculations are purely deterministic. This tool is designed for educational and personal health resilience tracking and is not a clinical medical diagnostic instrument.
          </p>
        </div>
      </div>
    </div>
  )
}
