import React, { useState, useEffect, useCallback } from "react"
import { BRAND_COLORS } from "./ResetLabsScreen"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PreAssessmentData {
  stress: number
  physicalTension: number
  mentalCalmness: number
  relaxation: number
  wellbeing: number
  emotionalState: string
  emotionalRating: number
  notes?: string
}

export interface PostAssessmentData {
  stress: number
  physicalTension: number
  mentalCalmness: number
  relaxation: number
  wellbeing: number
  emotionalState: string
  emotionalRating: number
  standoutMoment?: string
  notes?: string
}

export interface MetricShift {
  metric: string
  pre: number
  post: number
  delta: number
  percentChange: number
  status: "Improved" | "No Change" | "Elevated" | "Decreased"
}

export interface SessionReportData {
  generatedAt: string
  stressDelta: number
  calmnessDelta: number
  tensionDelta: number
  relaxationDelta: number
  wellbeingDelta: number
  emotionalRatingDelta: number
  overallShiftScore: number
  summaryText: string
  shifts: MetricShift[]
}

export interface AttendanceRecord {
  _id: string
  sessionId: string
  sessionTitle: string
  sessionType: "acoustic-unwind" | "express-unwind"
  userName?: string
  userEmail?: string
  checkInTime: string
  checkOutTime?: string | null
  status: "CHECKED_IN" | "CHECKED_OUT"
  preAssessment: PreAssessmentData
  postAssessment?: PostAssessmentData
  report?: SessionReportData
}

export interface SessionMeta {
  id: string
  sessionId: string
  sessionType: "acoustic-unwind" | "express-unwind"
  title: string
  date: string
  time: string
  venue: string
  facilitator: string
  capacity: number
  status: string
  notes?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Rating Scale Component (1 to 10 Number Pills)
// ─────────────────────────────────────────────────────────────────────────────

interface ScaleRatingInputProps {
  label: string
  description?: string
  value: number
  onChange: (val: number) => void
  lowLabel: string
  highLabel: string
  reverseImprovement?: boolean // e.g. for stress/tension, lower is better
}

function ScaleRatingInput({
  label,
  description,
  value,
  onChange,
  lowLabel,
  highLabel,
  reverseImprovement = false,
}: ScaleRatingInputProps) {
  return (
    <div className="space-y-2 p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="text-xs sm:text-sm font-bold text-[#3F3127] block">{label}</label>
          {description && <p className="text-[11px] text-[#796452] mt-0.5">{description}</p>}
        </div>
        <span
          className="text-xs font-mono-data font-bold px-2.5 py-0.5 rounded-full border"
          style={{
            backgroundColor:
              value === 0
                ? "#FAF4EB"
                : reverseImprovement
                ? value <= 4
                  ? "#EAF3E6"
                  : value <= 7
                  ? "#FAF0E6"
                  : "#FBECE6"
                : value >= 7
                ? "#EAF3E6"
                : value >= 4
                ? "#FAF0E6"
                : "#FBECE6",
            borderColor: "#F3DCC8",
            color: "#3F3127",
          }}
        >
          Rating: {value || "–"} / 10
        </span>
      </div>

      {/* Number Pills 1 to 10 */}
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5 pt-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isSelected
                  ? "bg-[#C45B32] text-white shadow-sm scale-105 border border-[#C45B32]"
                  : "bg-[#FAF4EB] hover:bg-[#F3DCC8] text-[#796452] border border-[#F3DCC8]"
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#796452] px-1 pt-0.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 1: Check-in & Checkout Wizard
// ─────────────────────────────────────────────────────────────────────────────

interface CheckInOutProps {
  initialSessionId?: string
  onCompleteReport?: (report: AttendanceRecord) => void
  onNavigateToReports?: () => void
}

export function ResetLabsCheckInOutView({
  initialSessionId = "",
  onCompleteReport,
  onNavigateToReports,
}: CheckInOutProps) {
  const [activeMode, setActiveMode] = useState<"checkin" | "checkout">("checkin")
  const [sessionIdInput, setSessionIdInput] = useState(initialSessionId)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifiedSession, setVerifiedSession] = useState<SessionMeta | null>(null)
  const [userSessionStatus, setUserSessionStatus] = useState<any>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Pre-session assessment state
  const [preStress, setPreStress] = useState<number>(7)
  const [preTension, setPreTension] = useState<number>(6)
  const [preCalmness, setPreCalmness] = useState<number>(4)
  const [preRelaxation, setPreRelaxation] = useState<number>(3)
  const [preWellbeing, setPreWellbeing] = useState<number>(4)
  const [preEmotion, setPreEmotion] = useState<string>("Tired / Fatigued")
  const [preEmotionalRating, setPreEmotionalRating] = useState<number>(4)
  const [preNotes, setPreNotes] = useState<string>("")

  // Post-session assessment state
  const [postStress, setPostStress] = useState<number>(3)
  const [postTension, setPostTension] = useState<number>(2)
  const [postCalmness, setPostCalmness] = useState<number>(8)
  const [postRelaxation, setPostRelaxation] = useState<number>(9)
  const [postWellbeing, setPostWellbeing] = useState<number>(8)
  const [postEmotion, setPostEmotion] = useState<string>("Deeply Relaxed")
  const [postEmotionalRating, setPostEmotionalRating] = useState<number>(9)
  const [postMoment, setPostMoment] = useState<string>("")
  const [postNotes, setPostNotes] = useState<string>("")

  // Submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkInSuccess, setCheckInSuccess] = useState<any | null>(null)
  const [completedReportRecord, setCompletedReportRecord] = useState<AttendanceRecord | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Verify session whenever user types or clicks verify
  const handleVerifySession = useCallback(async (idToVerify?: string) => {
    const id = (idToVerify || sessionIdInput).trim().toUpperCase()
    if (!id) {
      setVerifyError("Please enter a physical Session ID (e.g. AU-2026-001).")
      setVerifiedSession(null)
      return
    }

    setIsVerifying(true)
    setVerifyError(null)

    try {
      const token = localStorage.getItem("cq_token")
      const res = await fetch(`/api/reset-labs/session/${encodeURIComponent(id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()

      if (data.success && data.session) {
        setVerifiedSession(data.session)
        setUserSessionStatus(data.userStatus)
        setSessionIdInput(data.session.sessionId)
      } else {
        setVerifiedSession(null)
        setUserSessionStatus(null)
        setVerifyError(data.message || `Session ID "${id}" was not recognized.`)
      }
    } catch {
      setVerifyError("Network error while validating Session ID. Please try again.")
      setVerifiedSession(null)
    } finally {
      setIsVerifying(false)
    }
  }, [sessionIdInput])

  // Auto-verify if initialSessionId provided
  useEffect(() => {
    if (initialSessionId) {
      handleVerifySession(initialSessionId)
    }
  }, [initialSessionId, handleVerifySession])

  // Handle Pre-Session Check-in submission
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifiedSession) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const token = localStorage.getItem("cq_token")
      const payload = {
        sessionId: verifiedSession.sessionId,
        preAssessment: {
          stress: preStress,
          physicalTension: preTension,
          mentalCalmness: preCalmness,
          relaxation: preRelaxation,
          wellbeing: preWellbeing,
          emotionalState: preEmotion,
          emotionalRating: preEmotionalRating,
          notes: preNotes,
        },
      }

      const res = await fetch("/api/reset-labs/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        setCheckInSuccess(data)
        // Refresh session status
        handleVerifySession(verifiedSession.sessionId)
      } else {
        setSubmitError(data.message || "Failed to complete pre-session check-in.")
      }
    } catch {
      setSubmitError("Network connectivity issue. Please retry submitting check-in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Post-Session Checkout submission
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifiedSession) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const token = localStorage.getItem("cq_token")
      const payload = {
        sessionId: verifiedSession.sessionId,
        postAssessment: {
          stress: postStress,
          physicalTension: postTension,
          mentalCalmness: postCalmness,
          relaxation: postRelaxation,
          wellbeing: postWellbeing,
          emotionalState: postEmotion,
          emotionalRating: postEmotionalRating,
          standoutMoment: postMoment,
          notes: postNotes,
        },
      }

      const res = await fetch("/api/reset-labs/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success && data.report) {
        const fullRecord: AttendanceRecord = {
          _id: data.attendanceId,
          sessionId: data.sessionId,
          sessionTitle: data.sessionTitle,
          sessionType: verifiedSession.sessionType,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          status: "CHECKED_OUT",
          preAssessment: userSessionStatus?.preAssessment || {
            stress: preStress,
            physicalTension: preTension,
            mentalCalmness: preCalmness,
            relaxation: preRelaxation,
            wellbeing: preWellbeing,
            emotionalState: preEmotion,
            emotionalRating: preEmotionalRating,
          },
          postAssessment: payload.postAssessment,
          report: data.report,
        }

        setCompletedReportRecord(fullRecord)
        if (onCompleteReport) {
          onCompleteReport(fullRecord)
        }
      } else {
        setSubmitError(data.message || "Failed to complete checkout.")
      }
    } catch {
      setSubmitError("Network connectivity issue. Please retry submitting checkout.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // If a report was just generated, show the completed report directly
  if (completedReportRecord && completedReportRecord.report) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-[#EAF3E6] border border-[#B9C6A5] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#3F3127]">
                Your session checkout is complete. Your session report has been generated!
              </p>
              <p className="text-[11px] text-[#796452]">
                Session ID: {completedReportRecord.sessionId} · {completedReportRecord.sessionTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCompletedReportRecord(null)
              setVerifiedSession(null)
              setUserSessionStatus(null)
              setSessionIdInput("")
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-[#B9C6A5] text-[#3F3127] hover:bg-[#FAF4EB] cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Visual Report Card */}
        <ResetLabsReportCard attendance={completedReportRecord} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Mode Switcher: Pre-Session Check-in vs Post-Session Checkout ────── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F3DCC8]/60 border border-[#E0C5AE] max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            setActiveMode("checkin")
            setSubmitError(null)
            setCheckInSuccess(null)
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMode === "checkin"
              ? "bg-[#C45B32] text-white shadow-sm"
              : "text-[#796452] hover:text-[#3F3127]"
          }`}
        >
          <span>🌱 Pre-Session Check-in</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode("checkout")
            setSubmitError(null)
            setCheckInSuccess(null)
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMode === "checkout"
              ? "bg-[#C45B32] text-white shadow-sm"
              : "text-[#796452] hover:text-[#3F3127]"
          }`}
        >
          <span>🏁 Post-Session Checkout</span>
        </button>
      </div>

      {/* ── Section 1: Physical Session ID Input & Verification ───────────── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#3F3127] flex items-center gap-2">
            <span>🏷️</span>
            <span>
              {activeMode === "checkin" ? "Pre-Session Check-in" : "Post-Session Checkout"}
            </span>
          </h2>
          <p className="text-xs text-[#796452] mt-0.5">
            Enter the unique Session ID displayed at your physical Reset Labs venue.
          </p>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={sessionIdInput}
              onChange={(e) => {
                setSessionIdInput(e.target.value.toUpperCase())
                setVerifyError(null)
              }}
              placeholder="e.g. AU-2026-001 or EU-2026-001"
              className="w-full px-4 py-3 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] focus:border-[#C45B32] focus:outline-none text-sm font-mono-data font-bold tracking-wider text-[#3F3127] placeholder:text-[#796452]/50 shadow-inner"
            />
            {sessionIdInput && (
              <button
                type="button"
                onClick={() => {
                  setSessionIdInput("")
                  setVerifiedSession(null)
                  setUserSessionStatus(null)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#796452] hover:text-[#3F3127] p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleVerifySession()}
            disabled={isVerifying || !sessionIdInput.trim()}
            className="px-6 py-3 rounded-2xl bg-[#C45B32] hover:bg-[#B34E27] text-white text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            {isVerifying ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify Session</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Demo Chips for Instant Testing */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#796452]">
          <span className="font-medium">Active Cohorts:</span>
          <button
            type="button"
            onClick={() => {
              setSessionIdInput("AU-2026-001")
              handleVerifySession("AU-2026-001")
            }}
            className="px-2.5 py-1 rounded-full bg-[#FFFDF9] hover:bg-[#F3DCC8] border border-[#F3DCC8] text-[10px] font-mono-data font-semibold text-[#C45B32] transition-colors cursor-pointer"
          >
            AU-2026-001 (Acoustic Unwind)
          </button>
          <button
            type="button"
            onClick={() => {
              setSessionIdInput("EU-2026-001")
              handleVerifySession("EU-2026-001")
            }}
            className="px-2.5 py-1 rounded-full bg-[#FFFDF9] hover:bg-[#F3DCC8] border border-[#F3DCC8] text-[10px] font-mono-data font-semibold text-[#D98268] transition-colors cursor-pointer"
          >
            EU-2026-001 (Express & Unwind)
          </button>
        </div>

        {/* Verification Error */}
        {verifyError && (
          <div className="p-3.5 rounded-2xl bg-[#FBECE6] border border-[#E8C0B2] text-xs text-[#9B3718] flex items-center gap-2 animate-fade-in">
            <span>⚠️</span>
            <span>{verifyError}</span>
          </div>
        )}

        {/* Verified Session Card Confirmation */}
        {verifiedSession && (
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 shadow-xs animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3DCC8] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono-data font-bold text-[#C45B32]">
                  {verifiedSession.sessionId}
                </span>
                <span className="text-xs font-bold text-[#3F3127]">
                  {verifiedSession.title}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F3DCC8] text-[#796452]">
                Verified Session
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#796452] pt-1">
              <div>
                <strong className="text-[#3F3127]">Date & Time:</strong> {verifiedSession.date} · {verifiedSession.time}
              </div>
              <div>
                <strong className="text-[#3F3127]">Facilitator:</strong> {verifiedSession.facilitator}
              </div>
              <div>
                <strong className="text-[#3F3127]">Venue:</strong> {verifiedSession.venue}
              </div>
            </div>

            {/* Attendance state notice */}
            {userSessionStatus?.hasCheckedOut && (
              <div className="p-2.5 rounded-xl bg-[#EAF3E6] border border-[#B9C6A5] text-[11px] text-[#4A643E] flex items-center justify-between gap-2 mt-2">
                <span>✓ You have completed both Check-in and Checkout for this session.</span>
                {onNavigateToReports && (
                  <button
                    type="button"
                    onClick={onNavigateToReports}
                    className="underline font-bold hover:text-[#3F3127] cursor-pointer"
                  >
                    View Report →
                  </button>
                )}
              </div>
            )}

            {userSessionStatus?.hasCheckedIn && !userSessionStatus?.hasCheckedOut && (
              <div className="p-2.5 rounded-xl bg-[#FBF3E6] border border-[#E8D1B2] text-[11px] text-[#9B6A18] flex items-center justify-between gap-2 mt-2">
                <span>
                  ✓ Pre-session check-in recorded at {new Date(userSessionStatus.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
                </span>
                {activeMode === "checkin" && (
                  <button
                    type="button"
                    onClick={() => setActiveMode("checkout")}
                    className="underline font-bold text-[#C45B32] hover:text-[#9B3718] cursor-pointer"
                  >
                    Ready for Checkout? →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2A: Pre-Session Assessment Form ───────────────────────── */}
      {verifiedSession && activeMode === "checkin" && (
        <div className="p-5 sm:p-7 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-5 animate-fade-in">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#C45B32] uppercase tracking-wider bg-[#F3DCC8] px-2.5 py-0.5 rounded-full border border-[#E0C5AE]">
                Step 2 of 2 · Self-Reported Baseline
              </span>
              <span className="text-[11px] text-[#796452]">5 Short Comparable Scales</span>
            </div>
            <h3 className="text-lg font-bold text-[#3F3127] mt-1.5">
              Pre-Session Check-in Assessment
            </h3>
            <p className="text-xs text-[#796452] mt-0.5 max-w-xl">
              Please share how you are feeling right now before entering the {verifiedSession.title} session.
            </p>
          </div>

          {/* Success Banner if just submitted */}
          {checkInSuccess && (
            <div className="p-4 rounded-2xl bg-[#EAF3E6] border border-[#B9C6A5] text-[#3F3127] space-y-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <p className="text-xs sm:text-sm font-bold text-[#4A643E]">
                  Your pre-session check-in is complete. Enjoy your Reset Lab experience.
                </p>
              </div>
              <p className="text-xs text-[#796452]">
                Session ID: <strong className="font-mono-data text-[#3F3127]">{verifiedSession.sessionId}</strong>. Keep this ID handy for when your session concludes to submit your checkout and view your before vs after report.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveMode("checkout")}
                  className="text-xs font-bold text-white bg-[#C45B32] hover:bg-[#B34E27] px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  Switch to Post-Session Checkout →
                </button>
              </div>
            </div>
          )}

          {!checkInSuccess && userSessionStatus?.hasCheckedIn ? (
            <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] text-center space-y-3">
              <span className="text-2xl">🌱</span>
              <p className="text-sm font-bold text-[#3F3127]">
                You have already checked in for session {verifiedSession.sessionId}.
              </p>
              <p className="text-xs text-[#796452] max-w-md mx-auto">
                Enjoy your session! When your facilitator concludes the cohort, switch to Post-Session Checkout to complete your post-assessment and generate your session report.
              </p>
              <button
                type="button"
                onClick={() => setActiveMode("checkout")}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] cursor-pointer shadow-sm"
              >
                Go to Post-Session Checkout →
              </button>
            </div>
          ) : !checkInSuccess && (
            <form onSubmit={handleSubmitCheckIn} className="space-y-4">
              {/* Question 1: Perceived Stress */}
              <ScaleRatingInput
                label="1. Perceived Stress"
                description="How much mental pressure or tension do you feel right now?"
                value={preStress}
                onChange={setPreStress}
                lowLabel="1: Completely at ease"
                highLabel="10: Overwhelming stress"
                reverseImprovement
              />

              {/* Question 2: Physical Tension */}
              <ScaleRatingInput
                label="2. Physical Bodily Tension"
                description="How much tightness or strain do you hold in your neck, shoulders or body?"
                value={preTension}
                onChange={setPreTension}
                lowLabel="1: Fully loose & relaxed"
                highLabel="10: Severe physical tightness"
                reverseImprovement
              />

              {/* Question 3: Mental Calmness */}
              <ScaleRatingInput
                label="3. Mental Calmness"
                description="How quiet and centered is your mind?"
                value={preCalmness}
                onChange={setPreCalmness}
                lowLabel="1: Racing / Overthinking"
                highLabel="10: Deep mental stillness"
              />

              {/* Question 4: Feeling of Relaxation */}
              <ScaleRatingInput
                label="4. Feeling of Relaxation"
                description="How unhurried and settled do you feel currently?"
                value={preRelaxation}
                onChange={setPreRelaxation}
                lowLabel="1: Agitated / Restless"
                highLabel="10: Completely settled"
              />

              {/* Question 5: Overall Sense of Wellbeing */}
              <ScaleRatingInput
                label="5. Overall Sense of Wellbeing"
                description="Overall description of your personal wellbeing state today."
                value={preWellbeing}
                onChange={setPreWellbeing}
                lowLabel="1: Depleted / Drained"
                highLabel="10: Restored & Vibrant"
              />

              {/* Emotional State Selector */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 shadow-xs">
                <label className="text-xs sm:text-sm font-bold text-[#3F3127] block">
                  6. Primary Emotional State
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "Overwhelmed",
                    "Anxious / Uneasy",
                    "Tired / Fatigued",
                    "Neutral / Unfocused",
                    "Curious / Receptive",
                    "Calm / Grounded",
                  ].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setPreEmotion(em)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        preEmotion === em
                          ? "bg-[#C45B32] text-white shadow-xs border border-[#C45B32]"
                          : "bg-[#FAF4EB] text-[#796452] hover:bg-[#F3DCC8] border border-[#F3DCC8]"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Intention / Focus Note */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-1.5 shadow-xs">
                <label className="text-xs font-bold text-[#3F3127] block">
                  Intention or Focus Area <span className="text-[11px] font-normal text-[#796452]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={preNotes}
                  onChange={(e) => setPreNotes(e.target.value)}
                  placeholder="e.g. Seeking quiet reflection after a high-pressure deadline"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8] text-xs text-[#3F3127] placeholder:text-[#796452]/50 focus:outline-none focus:border-[#C45B32]"
                />
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-[#FBECE6] border border-[#E8C0B2] text-xs text-[#9B3718]">
                  ⚠️ {submitError}
                </div>
              )}

              {/* Submit Pre-Session Check-in Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C45B32] hover:bg-[#B34E27] text-white text-sm font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Recording Check-in...</span>
                ) : (
                  <>
                    <span>Confirm Pre-Session Check-in</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Section 2B: Post-Session Checkout Form ───────────────────────── */}
      {verifiedSession && activeMode === "checkout" && (
        <div className="p-5 sm:p-7 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-5 animate-fade-in">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#C45B32] uppercase tracking-wider bg-[#F3DCC8] px-2.5 py-0.5 rounded-full border border-[#E0C5AE]">
                Session Checkout & Evaluation
              </span>
              <span className="text-[11px] text-[#796452]">Before vs After Comparison</span>
            </div>
            <h3 className="text-lg font-bold text-[#3F3127] mt-1.5">
              Post-Session Checkout Assessment
            </h3>
            <p className="text-xs text-[#796452] mt-0.5 max-w-xl">
              Complete these matching 5 questions to measure how your state shifted following the {verifiedSession.title} experience.
            </p>
          </div>

          {/* Validation: Check if pre-session check-in was completed */}
          {!userSessionStatus?.hasCheckedIn ? (
            <div className="p-5 rounded-2xl bg-[#FBECE6] border border-[#E8C0B2] text-center space-y-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm font-bold text-[#9B3718]">
                Pre-Session Check-in Required
              </p>
              <p className="text-xs text-[#796452] max-w-md mx-auto">
                No pre-session check-in was found for your account under session {verifiedSession.sessionId}. A pre-session check-in is required in order to calculate before-and-after changes.
              </p>
              <button
                type="button"
                onClick={() => setActiveMode("checkin")}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] cursor-pointer shadow-sm mt-2"
              >
                Complete Pre-Session Check-in First →
              </button>
            </div>
          ) : userSessionStatus?.hasCheckedOut ? (
            <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] text-center space-y-3">
              <span className="text-2xl">🎉</span>
              <p className="text-sm font-bold text-[#3F3127]">
                You have already checked out of session {verifiedSession.sessionId}.
              </p>
              <p className="text-xs text-[#796452] max-w-md mx-auto">
                Your before-and-after session report has been generated and saved securely.
              </p>
              {onNavigateToReports && (
                <button
                  type="button"
                  onClick={onNavigateToReports}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] cursor-pointer shadow-sm"
                >
                  View My Session Report →
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitCheckout} className="space-y-4">
              {/* Question 1: Perceived Stress */}
              <ScaleRatingInput
                label="1. Perceived Stress (Now)"
                description="How much mental pressure or tension do you feel right now after the session?"
                value={postStress}
                onChange={setPostStress}
                lowLabel="1: Completely at ease"
                highLabel="10: Overwhelming stress"
                reverseImprovement
              />

              {/* Question 2: Physical Tension */}
              <ScaleRatingInput
                label="2. Physical Bodily Tension (Now)"
                description="How loose or relaxed does your body feel now?"
                value={postTension}
                onChange={setPostTension}
                lowLabel="1: Fully loose & relaxed"
                highLabel="10: Severe physical tightness"
                reverseImprovement
              />

              {/* Question 3: Mental Calmness */}
              <ScaleRatingInput
                label="3. Mental Calmness (Now)"
                description="How calm and settled is your mind after the experience?"
                value={postCalmness}
                onChange={setPostCalmness}
                lowLabel="1: Racing / Overthinking"
                highLabel="10: Deep mental stillness"
              />

              {/* Question 4: Feeling of Relaxation */}
              <ScaleRatingInput
                label="4. Feeling of Relaxation (Now)"
                description="Level of physical and emotional relaxation right now."
                value={postRelaxation}
                onChange={setPostRelaxation}
                lowLabel="1: Agitated / Restless"
                highLabel="10: Deeply relaxed"
              />

              {/* Question 5: Overall Sense of Wellbeing */}
              <ScaleRatingInput
                label="5. Overall Sense of Wellbeing (Now)"
                description="Overall description of your personal wellbeing state concluding this session."
                value={postWellbeing}
                onChange={setPostWellbeing}
                lowLabel="1: Depleted / Drained"
                highLabel="10: Restored & Vibrant"
              />

              {/* Ending Emotional State Selector */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 shadow-xs">
                <label className="text-xs sm:text-sm font-bold text-[#3F3127] block">
                  6. Ending Emotional State
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "Grounded / Centered",
                    "Deeply Relaxed",
                    "Emotionally Lightened",
                    "Quiet & Reflective",
                    "Reconnected / Restored",
                    "Somewhat Unchanged",
                  ].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setPostEmotion(em)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        postEmotion === em
                          ? "bg-[#C45B32] text-white shadow-xs border border-[#C45B32]"
                          : "bg-[#FAF4EB] text-[#796452] hover:bg-[#F3DCC8] border border-[#F3DCC8]"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standout Moment or Reflection */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-1.5 shadow-xs">
                <label className="text-xs font-bold text-[#3F3127] block">
                  Standout or Grounding Moment <span className="text-[11px] font-normal text-[#796452]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={postMoment}
                  onChange={(e) => setPostMoment(e.target.value)}
                  placeholder="e.g. The live acoustic vibrations; painting with mixed warm colors"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8] text-xs text-[#3F3127] placeholder:text-[#796452]/50 focus:outline-none focus:border-[#C45B32]"
                />
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-[#FBECE6] border border-[#E8C0B2] text-xs text-[#9B3718]">
                  ⚠️ {submitError}
                </div>
              )}

              {/* Submit Post-Session Checkout Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C45B32] hover:bg-[#B34E27] text-white text-sm font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Generating Session Report...</span>
                ) : (
                  <>
                    <span>Complete Checkout & Generate Report</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 2: Visual Session Report Card
// Displays: Session Info, Before, After, Comparison, Closing Summary
// ─────────────────────────────────────────────────────────────────────────────

interface ReportCardProps {
  attendance: AttendanceRecord
  onClose?: () => void
}

export function ResetLabsReportCard({ attendance, onClose }: ReportCardProps) {
  const { preAssessment, postAssessment, report } = attendance

  if (!report || !postAssessment) {
    return (
      <div className="p-6 rounded-3xl bg-[#FAF4EB] border border-[#F3DCC8] text-center text-xs text-[#796452]">
        Post-session report is pending completion.
      </div>
    )
  }

  const formatLocalTime = (iso?: string | null) => {
    if (!iso) return "–"
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatLocalDate = (iso?: string | null) => {
    if (!iso) return "–"
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl border-2 border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_16px_40px_rgba(121,100,82,0.10),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-6">
      {/* ── Header & Session Information ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3DCC8] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#C45B32] uppercase tracking-wider bg-[#F3DCC8] px-2.5 py-0.5 rounded-full border border-[#E0C5AE]">
              Reset Labs Session Report
            </span>
            <span className="text-xs font-mono-data font-bold text-[#3F3127]">
              {attendance.sessionId}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#3F3127]">
            {attendance.sessionTitle}
          </h2>
          <p className="text-xs text-[#796452]">
            Concluded on {formatLocalDate(attendance.checkOutTime)} at {formatLocalTime(attendance.checkOutTime)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Net Relaxation Shift Score Pill */}
          <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] text-center shadow-xs">
            <p className="text-[9px] uppercase font-bold text-[#796452] tracking-wider">
              Composite Shift
            </p>
            <p className="text-lg font-bold font-mono-data text-[#C45B32]">
              {report.overallShiftScore > 0 ? `+${report.overallShiftScore}` : report.overallShiftScore} pts
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] text-[#796452] flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Cards: Before vs After Emotional State ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Starting State */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-1.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#796452] tracking-wider block">
            Starting State (Pre-Session)
          </span>
          <p className="text-base font-bold text-[#3F3127]">
            {preAssessment.emotionalState || "Neutral"}
          </p>
          <div className="text-xs text-[#796452] space-y-0.5">
            <p>Perceived Stress: <strong className="text-[#3F3127]">{preAssessment.stress} / 10</strong></p>
            <p>Physical Tension: <strong className="text-[#3F3127]">{preAssessment.physicalTension} / 10</strong></p>
            {preAssessment.notes && (
              <p className="text-[11px] italic pt-1 border-t border-[#F3DCC8]">
                "{preAssessment.notes}"
              </p>
            )}
          </div>
        </div>

        {/* Ending State */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#B9C6A5] space-y-1.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#4A643E] tracking-wider block">
            Ending State (Post-Session)
          </span>
          <p className="text-base font-bold text-[#3F3127]">
            {postAssessment.emotionalState || "Centered"}
          </p>
          <div className="text-xs text-[#796452] space-y-0.5">
            <p>Perceived Stress: <strong className="text-[#3F3127]">{postAssessment.stress} / 10</strong></p>
            <p>Physical Tension: <strong className="text-[#3F3127]">{postAssessment.physicalTension} / 10</strong></p>
            {postAssessment.standoutMoment && (
              <p className="text-[11px] italic pt-1 border-t border-[#B9C6A5]/50 text-[#3F3127]">
                "{postAssessment.standoutMoment}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Before vs After Dimension Comparison Grid ──────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#3F3127] flex items-center gap-2">
          <span>📊</span>
          <span>Self-Reported Before vs After Comparison</span>
        </h3>

        <div className="space-y-2.5">
          {report.shifts.map((shift, idx) => {
            const isImprovement = shift.status === "Improved"
            const isNoChange = shift.status === "No Change"

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1 min-w-[180px]">
                  <p className="text-xs font-bold text-[#3F3127]">{shift.metric}</p>
                  <div className="flex items-center gap-3 text-xs font-mono-data text-[#796452]">
                    <span>Pre: <strong className="text-[#3F3127]">{shift.pre}</strong></span>
                    <span>→</span>
                    <span>Post: <strong className="text-[#3F3127]">{shift.post}</strong></span>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="flex-1 max-w-xs space-y-1">
                  <div className="h-2 w-full bg-[#FAF4EB] rounded-full overflow-hidden flex border border-[#F3DCC8]">
                    <div
                      className="bg-[#D9C0A7] transition-all"
                      style={{ width: `${(shift.pre / 10) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 w-full bg-[#FAF4EB] rounded-full overflow-hidden flex border border-[#F3DCC8]">
                    <div
                      className={`transition-all ${
                        isImprovement ? "bg-[#C45B32]" : "bg-[#D98268]"
                      }`}
                      style={{ width: `${(shift.post / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Delta and Status Badge */}
                <div className="flex items-center gap-2 sm:justify-end flex-shrink-0">
                  <span
                    className={`text-xs font-mono-data font-bold px-2 py-0.5 rounded-lg border ${
                      isImprovement
                        ? "bg-[#EAF3E6] text-[#4A643E] border-[#B9C6A5]"
                        : isNoChange
                        ? "bg-[#FAF4EB] text-[#796452] border-[#F3DCC8]"
                        : "bg-[#FBECE6] text-[#9B3718] border-[#E8C0B2]"
                    }`}
                  >
                    {shift.delta > 0 ? `+${shift.delta}` : shift.delta} pts
                    {shift.percentChange > 0 && ` (${shift.percentChange}%)`}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isImprovement
                        ? "bg-[#B9C6A5]/30 text-[#4A643E] border-[#B9C6A5]"
                        : isNoChange
                        ? "bg-[#FAF4EB] text-[#796452] border-[#F3DCC8]"
                        : "bg-[#FBECE6] text-[#9B3718] border-[#E8C0B2]"
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Closing Neutral Summary ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 shadow-xs">
        <h4 className="text-xs font-bold text-[#3F3127] uppercase tracking-wider">
          Closing Wellbeing Summary
        </h4>
        <p className="text-xs text-[#796452] leading-relaxed">
          {report.summaryText}
        </p>
      </div>

      {/* Non-clinical disclaimer */}
      <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8] text-[10px] text-[#796452] leading-relaxed text-center">
        <em>
          CortiQuant Reset Labs reports reflect self-reported observational wellbeing metrics. They are not intended as clinical diagnoses, therapeutic treatments or psychological medical evaluations.
        </em>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 3: My Reports View (Participant Historical Reports)
// ─────────────────────────────────────────────────────────────────────────────

interface MyReportsProps {
  onCheckInNow?: () => void
}

export function ResetLabsMyReportsView({ onCheckInNow }: MyReportsProps) {
  const [reports, setReports] = useState<AttendanceRecord[]>([])
  const [activeCheckIns, setActiveCheckIns] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<AttendanceRecord | null>(null)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("cq_token")
      const res = await fetch("/api/reset-labs/my-reports", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setReports(data.reports || [])
        setActiveCheckIns(data.activeCheckIns || [])
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  if (selectedReport) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button
          type="button"
          onClick={() => setSelectedReport(null)}
          className="text-xs font-semibold text-[#796452] hover:text-[#3F3127] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>← Back to My Reports List</span>
        </button>
        <ResetLabsReportCard attendance={selectedReport} onClose={() => setSelectedReport(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#3F3127] flex items-center gap-2">
            <span>📑</span>
            <span>My Reset Labs Reports</span>
          </h2>
          <p className="text-xs text-[#796452] mt-0.5">
            Your self-reported before-and-after session insights and experiential progress.
          </p>
        </div>

        {onCheckInNow && (
          <button
            type="button"
            onClick={onCheckInNow}
            className="px-4 py-2 rounded-xl bg-[#C45B32] hover:bg-[#B34E27] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            + Enter Session Check-in / Checkout
          </button>
        )}
      </div>

      {/* Active in-progress check-ins needing checkout */}
      {activeCheckIns.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FBF3E6] border border-[#E8D1B2] space-y-2.5 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C45B32] animate-pulse" />
            <span className="text-xs font-bold text-[#3F3127]">
              You have {activeCheckIns.length} session check-in pending checkout:
            </span>
          </div>
          <div className="space-y-2">
            {activeCheckIns.map((ci) => (
              <div
                key={ci._id}
                className="p-3 rounded-xl bg-white border border-[#E8D1B2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <strong className="text-[#3F3127]">{ci.sessionTitle}</strong> ({ci.sessionId})
                  <span className="text-[11px] text-[#796452] block">
                    Checked in at {new Date(ci.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {onCheckInNow && (
                  <button
                    type="button"
                    onClick={onCheckInNow}
                    className="px-3 py-1.5 rounded-lg bg-[#C45B32] text-white font-semibold text-[11px] hover:bg-[#B34E27] cursor-pointer"
                  >
                    Complete Checkout Now →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 text-center text-xs text-[#796452] space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#C45B32] border-t-transparent animate-spin mx-auto" />
          <p>Loading your session reports...</p>
        </div>
      )}

      {/* Reports List */}
      {!isLoading && reports.length === 0 && (
        <div className="py-12 px-4 rounded-3xl bg-[#FAF4EB] border border-[#F3DCC8] text-center space-y-3">
          <span className="text-3xl">🌿</span>
          <p className="text-sm font-bold text-[#3F3127]">No completed session reports yet.</p>
          <p className="text-xs text-[#796452] max-w-md mx-auto">
            Once you attend an Acoustic Unwind or Express & Unwind session and complete your checkout assessment, your detailed Before vs After comparison report will appear here.
          </p>
          {onCheckInNow && (
            <button
              type="button"
              onClick={onCheckInNow}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] cursor-pointer shadow-xs"
            >
              Check-in with Session ID
            </button>
          )}
        </div>
      )}

      {!isLoading && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div
              key={r._id}
              onClick={() => setSelectedReport(r)}
              className="p-5 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] hover:border-[#C45B32] transition-all cursor-pointer shadow-[0_8px_20px_rgba(121,100,82,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#F3DCC8] pb-2">
                <span className="text-[10px] font-mono-data font-bold text-[#C45B32] bg-[#F3DCC8] px-2.5 py-0.5 rounded-full">
                  {r.sessionId}
                </span>
                <span className="text-[11px] text-[#796452]">
                  {r.checkOutTime ? new Date(r.checkOutTime).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : ""}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#3F3127]">{r.sessionTitle}</h3>
                <p className="text-xs text-[#796452] mt-0.5 line-clamp-2">
                  {r.report?.summaryText || "Completed session report"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F3DCC8] text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-[#796452]">Shift:</span>
                  <span className="font-mono-data font-bold text-[#C45B32]">
                    {r.report?.overallShiftScore ? `+${r.report.overallShiftScore} pts` : "Completed"}
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#C45B32] hover:underline flex items-center gap-1">
                  <span>View Details</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 4: Facilitator & Admin Session Management Dashboard
// Create sessions, view live rosters, check-in vs checkout tracking, export CSV
// ─────────────────────────────────────────────────────────────────────────────

export function ResetLabsFacilitatorDashboard() {
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<any | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Create session form state
  const [newType, setNewType] = useState<"acoustic-unwind" | "express-unwind">("acoustic-unwind")
  const [newTitle, setNewTitle] = useState("Acoustic Unwind")
  const [newDate, setNewDate] = useState("2026-11-25")
  const [newTime, setNewTime] = useState("16:00 - 16:45")
  const [newVenue, setNewVenue] = useState("CortiQuant Wellbeing Studio, Suite 400")
  const [newFacilitator, setNewFacilitator] = useState("Elena Vance, M.Mus.")
  const [newCapacity, setNewCapacity] = useState(8)
  const [newNotes, setNewNotes] = useState("")
  const [customSessionId, setCustomSessionId] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("cq_token")
      const res = await fetch("/api/reset-labs/admin/sessions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions || [])
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Fetch single session details with roster
  const handleSelectSession = async (sessionId: string) => {
    setIsLoadingDetail(true)
    try {
      const token = localStorage.getItem("cq_token")
      const res = await fetch(`/api/reset-labs/admin/sessions/${encodeURIComponent(sessionId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setSelectedSessionDetail(data)
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Handle Create Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateMsg(null)

    try {
      const token = localStorage.getItem("cq_token")
      const payload = {
        sessionType: newType,
        title: newTitle,
        date: newDate,
        time: newTime,
        venue: newVenue,
        facilitator: newFacilitator,
        capacity: newCapacity,
        notes: newNotes,
        customSessionId: customSessionId.trim() || null,
      }

      const res = await fetch("/api/reset-labs/admin/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success) {
        setCreateMsg(`Session created! ID: ${data.session.sessionId}`)
        fetchSessions()
        setTimeout(() => {
          setShowCreateModal(false)
          setCreateMsg(null)
          setCustomSessionId("")
        }, 1500)
      } else {
        setCreateMsg(data.message || "Failed to create session.")
      }
    } catch {
      setCreateMsg("Error communicating with server.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3DCC8] border border-[#E0C5AE] text-[10px] font-bold text-[#C45B32] uppercase mb-1">
            Admin & Facilitator Portal
          </div>
          <h2 className="text-xl font-bold text-[#3F3127]">
            Reset Labs Session Management
          </h2>
          <p className="text-xs text-[#796452] mt-0.5">
            Create physical sessions, generate unique Session IDs, track check-ins vs checkouts, and export analytics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-[#C45B32] hover:bg-[#B34E27] text-white text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <span>+ Schedule Session & Generate ID</span>
        </button>
      </div>

      {/* ── Create Session Modal ───────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF4EB] border border-[#F3DCC8] p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 w-7 h-7 rounded-full bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] text-[#796452] flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              ✕
            </button>

            <div>
              <h3 className="text-lg font-bold text-[#3F3127]">Schedule Reset Lab Session</h3>
              <p className="text-xs text-[#796452]">A unique Session ID will be generated upon creation.</p>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#3F3127] block mb-1">Program Experience</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewType("acoustic-unwind")
                      setNewTitle("Acoustic Unwind")
                      setNewFacilitator("Elena Vance, M.Mus.")
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newType === "acoustic-unwind"
                        ? "bg-[#C45B32] text-white border-[#C45B32]"
                        : "bg-[#FFFDF9] text-[#796452] border-[#F3DCC8]"
                    }`}
                  >
                    Acoustic Unwind
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewType("express-unwind")
                      setNewTitle("Express & Unwind")
                      setNewFacilitator("Marcus Thorne, ATR-BC")
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newType === "express-unwind"
                        ? "bg-[#C45B32] text-white border-[#C45B32]"
                        : "bg-[#FFFDF9] text-[#796452] border-[#F3DCC8]"
                    }`}
                  >
                    Express & Unwind
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3F3127] block mb-1">Session Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs text-[#3F3127]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3F3127] block mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="16:00 - 16:45"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs text-[#3F3127]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3F3127] block mb-1">Physical Venue / Studio Room</label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs text-[#3F3127]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3F3127] block mb-1">Lead Facilitator</label>
                  <input
                    type="text"
                    value={newFacilitator}
                    onChange={(e) => setNewFacilitator(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs text-[#3F3127]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3F3127] block mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs text-[#3F3127]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#3F3127] block mb-1">
                  Custom Session ID <span className="text-[10px] font-normal text-[#796452]">(Leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  value={customSessionId}
                  onChange={(e) => setCustomSessionId(e.target.value.toUpperCase())}
                  placeholder={`Auto generates e.g. ${newType === "acoustic-unwind" ? "AU-2026-001" : "EU-2026-001"}`}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs font-mono-data text-[#3F3127]"
                />
              </div>

              {createMsg && (
                <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs text-[#3F3127]">
                  {createMsg}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3 rounded-xl bg-[#C45B32] hover:bg-[#B34E27] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Scheduling Session..." : "Generate Session & ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sessions List ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((s) => {
          const isSelected = selectedSessionDetail?.session?.sessionId === s.sessionId
          return (
            <div
              key={s._id}
              onClick={() => handleSelectSession(s.sessionId)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? "bg-[#FFFDF9] border-[#C45B32] ring-2 ring-[#C45B32]/20"
                  : "bg-[#FAF4EB] border-[#F3DCC8] hover:border-[#C45B32]/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono-data font-bold text-[#C45B32] bg-[#F3DCC8] px-3 py-0.5 rounded-full border border-[#E0C5AE]">
                  {s.sessionId}
                </span>
                <span className="text-[10px] font-semibold text-[#796452] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#F3DCC8]">
                  Cap: {s.metrics?.capacity || s.capacity}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#3F3127]">{s.title}</h3>
              <p className="text-xs text-[#796452] mt-0.5">
                {s.date} · {s.time} · {s.venue}
              </p>

              {/* Check-in vs Checkout Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-[#F3DCC8] text-center text-xs">
                <div className="p-1.5 rounded-xl bg-white border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#796452] block">Check-ins</span>
                  <strong className="text-[#3F3127] font-mono-data">{s.metrics?.totalCheckIns ?? 0}</strong>
                </div>
                <div className="p-1.5 rounded-xl bg-white border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#4A643E] block">Checkouts</span>
                  <strong className="text-[#4A643E] font-mono-data">{s.metrics?.totalCheckOuts ?? 0}</strong>
                </div>
                <div className="p-1.5 rounded-xl bg-white border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#C45B32] block">In Progress</span>
                  <strong className="text-[#C45B32] font-mono-data">{s.metrics?.pendingCheckOuts ?? 0}</strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Selected Session Detail: Roster, Aggregated Stats & CSV Export ─── */}
      {selectedSessionDetail && (
        <div className="p-6 sm:p-7 rounded-3xl border-2 border-[#F3DCC8] bg-[#FAF4EB] shadow-md space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3DCC8] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-data font-bold text-white bg-[#C45B32] px-3 py-1 rounded-full shadow-xs">
                  ID: {selectedSessionDetail.session.sessionId}
                </span>
                <h3 className="text-xl font-bold text-[#3F3127]">
                  {selectedSessionDetail.session.title} · Live Roster
                </h3>
              </div>
              <p className="text-xs text-[#796452] mt-1">
                {selectedSessionDetail.session.date} · {selectedSessionDetail.session.time} · {selectedSessionDetail.session.venue}
              </p>
            </div>

            {/* Export CSV Button */}
            <a
              href={`/api/reset-labs/admin/sessions/${encodeURIComponent(selectedSessionDetail.session.sessionId)}/export`}
              download
              className="px-4 py-2 rounded-xl bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] text-xs font-semibold text-[#3F3127] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>📥 Export Session CSV</span>
            </a>
          </div>

          {/* Cohort Aggregated Pre vs Post Analytics (if checkouts exist) */}
          {selectedSessionDetail.cohortAggregates && (
            <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#B9C6A5] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4A643E] uppercase tracking-wider">
                  Cohort Aggregated Pre vs Post Shifts ({selectedSessionDetail.cohortAggregates.completedCount} completed)
                </span>
                <span className="text-[10px] text-[#796452]">Averages across participants</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#796452] block">Avg Stress</span>
                  <span className="font-mono-data font-bold text-[#3F3127]">
                    {selectedSessionDetail.cohortAggregates.averageStress.pre} → {selectedSessionDetail.cohortAggregates.averageStress.post}
                  </span>
                  <span className="text-[10px] block text-[#4A643E] font-bold">
                    {selectedSessionDetail.cohortAggregates.averageStress.delta} pts
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#796452] block">Avg Tension</span>
                  <span className="font-mono-data font-bold text-[#3F3127]">
                    {selectedSessionDetail.cohortAggregates.averageTension.pre} → {selectedSessionDetail.cohortAggregates.averageTension.post}
                  </span>
                  <span className="text-[10px] block text-[#4A643E] font-bold">
                    {selectedSessionDetail.cohortAggregates.averageTension.delta} pts
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#796452] block">Avg Calmness</span>
                  <span className="font-mono-data font-bold text-[#3F3127]">
                    {selectedSessionDetail.cohortAggregates.averageCalmness.pre} → {selectedSessionDetail.cohortAggregates.averageCalmness.post}
                  </span>
                  <span className="text-[10px] block text-[#4A643E] font-bold">
                    +{selectedSessionDetail.cohortAggregates.averageCalmness.delta} pts
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#796452] block">Avg Relaxation</span>
                  <span className="font-mono-data font-bold text-[#3F3127]">
                    {selectedSessionDetail.cohortAggregates.averageRelaxation.pre} → {selectedSessionDetail.cohortAggregates.averageRelaxation.post}
                  </span>
                  <span className="text-[10px] block text-[#4A643E] font-bold">
                    +{selectedSessionDetail.cohortAggregates.averageRelaxation.delta} pts
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                  <span className="text-[10px] text-[#796452] block">Avg Wellbeing</span>
                  <span className="font-mono-data font-bold text-[#3F3127]">
                    {selectedSessionDetail.cohortAggregates.averageWellbeing.pre} → {selectedSessionDetail.cohortAggregates.averageWellbeing.post}
                  </span>
                  <span className="text-[10px] block text-[#4A643E] font-bold">
                    +{selectedSessionDetail.cohortAggregates.averageWellbeing.delta} pts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Participant Roster Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#3F3127] uppercase tracking-wider">
              Participant Attendance Roster ({selectedSessionDetail.roster.length} Checked In)
            </h4>

            {selectedSessionDetail.roster.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] text-center text-xs text-[#796452]">
                No participants have checked in for this session yet. Share Session ID: <strong className="font-mono-data text-[#C45B32]">{selectedSessionDetail.session.sessionId}</strong> with attendees.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#F3DCC8] bg-[#FFFDF9]">
                <table className="w-full text-left text-xs text-[#796452]">
                  <thead className="bg-[#FAF4EB] text-[10px] uppercase font-bold text-[#3F3127] border-b border-[#F3DCC8]">
                    <tr>
                      <th className="px-4 py-2.5">Participant</th>
                      <th className="px-3 py-2.5">Check-In</th>
                      <th className="px-3 py-2.5">Check-Out</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Shift Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3DCC8]">
                    {selectedSessionDetail.roster.map((p: any) => {
                      const isCompleted = p.status === "CHECKED_OUT"
                      return (
                        <tr key={p.attendanceId} className="hover:bg-[#FAF4EB]/60">
                          <td className="px-4 py-3 font-semibold text-[#3F3127]">
                            {p.userName}
                            <span className="text-[10px] font-normal text-[#796452] block">
                              {p.userEmail}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono-data">
                            {p.checkInTime ? new Date(p.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "–"}
                          </td>
                          <td className="px-3 py-3 font-mono-data">
                            {p.checkOutTime ? new Date(p.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Pending"}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isCompleted
                                  ? "bg-[#EAF3E6] text-[#4A643E] border-[#B9C6A5]"
                                  : "bg-[#FBF3E6] text-[#9B6A18] border-[#E8D1B2]"
                              }`}
                            >
                              {isCompleted ? "Checked Out" : "Checked In (Active)"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono-data font-bold text-[#C45B32]">
                            {p.overallShiftScore ? `+${p.overallShiftScore} pts` : "–"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

