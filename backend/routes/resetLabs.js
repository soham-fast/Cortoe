const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const ResetLabSession = require("../models/ResetLabSession")
const ResetLabAttendance = require("../models/ResetLabAttendance")
const Counter = require("../models/Counter")
const { requireAuth, requireUser } = require("../middleware/auth")

// ─────────────────────────────────────────────────────────────────────────────
// Authorization Helper: Require Facilitator or Admin
// Checks if current user is an Admin, Facilitator, or authorized staff
// ─────────────────────────────────────────────────────────────────────────────
function requireFacilitatorOrAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err)
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." })
    }
    const role = (req.user?.role || "").toLowerCase()
    const email = (req.user?.email || "").toLowerCase()

    const isAuthorized =
      role === "admin" ||
      role === "founder" ||
      role === "facilitator" ||
      Boolean(req.user.isFacilitator) ||
      email.includes("facilitator") ||
      email.includes("admin") ||
      email === "cortiqsupport@gmail.com"

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access restricted to authorized Reset Labs facilitators and administrators.",
      })
    }
    next()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Generate Unique Session ID (e.g. AU-2026-001, EU-2026-001)
// ─────────────────────────────────────────────────────────────────────────────
async function generateUniqueSessionId(sessionType, targetYear = null) {
  const prefix = sessionType === "express-unwind" ? "EU" : "AU"
  const year = targetYear || new Date().getFullYear()
  const counterKey = `reset_lab_${prefix}_${year}`

  // Try sequential counter
  let seq = 1
  try {
    const counterDoc = await Counter.findByIdAndUpdate(
      counterKey,
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    if (counterDoc && counterDoc.seq) {
      // Counter default might start high if general counter, normalize to sequence
      seq = counterDoc.seq > 900 ? counterDoc.seq - 999 : counterDoc.seq
      if (seq < 1) seq = 1
    }
  } catch {
    const count = await ResetLabSession.countDocuments({
      sessionType,
      sessionId: new RegExp(`^${prefix}-${year}-`),
    })
    seq = count + 1
  }

  let formattedSeq = String(seq).padStart(3, "0")
  let candidateId = `${prefix}-${year}-${formattedSeq}`

  // Ensure collision avoidance
  let exists = await ResetLabSession.findOne({ sessionId: candidateId })
  while (exists) {
    seq += 1
    formattedSeq = String(seq).padStart(3, "0")
    candidateId = `${prefix}-${year}-${formattedSeq}`
    exists = await ResetLabSession.findOne({ sessionId: candidateId })
  }

  return candidateId
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Generate Before vs After Assessment Report
// Neutral, structured self-reported summary and dimension deltas
// ─────────────────────────────────────────────────────────────────────────────
function calculateSessionReport(pre, post, sessionTitle) {
  const shifts = []

  // 1. Perceived Stress (Lower is improvement)
  const stressDelta = post.stress - pre.stress
  const stressPct = pre.stress > 0 ? Math.round(((pre.stress - post.stress) / pre.stress) * 100) : 0
  shifts.push({
    metric: "Perceived Stress",
    pre: pre.stress,
    post: post.stress,
    delta: stressDelta,
    percentChange: stressPct,
    status: stressDelta < 0 ? "Improved" : stressDelta === 0 ? "No Change" : "Elevated",
  })

  // 2. Physical Tension (Lower is improvement)
  const tensionDelta = post.physicalTension - pre.physicalTension
  const tensionPct =
    pre.physicalTension > 0
      ? Math.round(((pre.physicalTension - post.physicalTension) / pre.physicalTension) * 100)
      : 0
  shifts.push({
    metric: "Physical Tension",
    pre: pre.physicalTension,
    post: post.physicalTension,
    delta: tensionDelta,
    percentChange: tensionPct,
    status: tensionDelta < 0 ? "Improved" : tensionDelta === 0 ? "No Change" : "Elevated",
  })

  // 3. Mental Calmness (Higher is improvement)
  const calmnessDelta = post.mentalCalmness - pre.mentalCalmness
  const calmnessPct =
    pre.mentalCalmness > 0
      ? Math.round(((post.mentalCalmness - pre.mentalCalmness) / pre.mentalCalmness) * 100)
      : 0
  shifts.push({
    metric: "Mental Calmness",
    pre: pre.mentalCalmness,
    post: post.mentalCalmness,
    delta: calmnessDelta,
    percentChange: calmnessPct,
    status: calmnessDelta > 0 ? "Improved" : calmnessDelta === 0 ? "No Change" : "Decreased",
  })

  // 4. Feeling of Relaxation (Higher is improvement)
  const relaxationDelta = post.relaxation - pre.relaxation
  const relaxationPct =
    pre.relaxation > 0
      ? Math.round(((post.relaxation - pre.relaxation) / pre.relaxation) * 100)
      : 0
  shifts.push({
    metric: "Feeling of Relaxation",
    pre: pre.relaxation,
    post: post.relaxation,
    delta: relaxationDelta,
    percentChange: relaxationPct,
    status: relaxationDelta > 0 ? "Improved" : relaxationDelta === 0 ? "No Change" : "Decreased",
  })

  // 5. Overall Sense of Wellbeing (Higher is improvement)
  const wellbeingDelta = post.wellbeing - pre.wellbeing
  const wellbeingPct =
    pre.wellbeing > 0
      ? Math.round(((post.wellbeing - pre.wellbeing) / pre.wellbeing) * 100)
      : 0
  shifts.push({
    metric: "Overall Wellbeing",
    pre: pre.wellbeing,
    post: post.wellbeing,
    delta: wellbeingDelta,
    percentChange: wellbeingPct,
    status: wellbeingDelta > 0 ? "Improved" : wellbeingDelta === 0 ? "No Change" : "Decreased",
  })

  // Emotional Rating Delta
  const emotionalRatingDelta = (post.emotionalRating || 5) - (pre.emotionalRating || 5)

  // Composite Shift Score (Average positive shift on a scale of -10 to +10)
  const netShiftPoints =
    -stressDelta + -tensionDelta + calmnessDelta + relaxationDelta + wellbeingDelta
  const overallShiftScore = Math.round((netShiftPoints / 5) * 10) / 10

  // Neutral Self-Reported Closing Summary
  let summaryText = ""
  const improvements = []
  if (stressDelta < 0) improvements.push(`a ${Math.abs(stressPct)}% reduction in perceived stress`)
  if (tensionDelta < 0) improvements.push(`a ${Math.abs(tensionPct)}% ease in physical tension`)
  if (relaxationDelta > 0) improvements.push("deepened physical relaxation")
  if (calmnessDelta > 0) improvements.push("enhanced mental calmness")
  if (wellbeingDelta > 0) improvements.push("an elevated sense of overall wellbeing")

  if (improvements.length >= 2) {
    summaryText = `Following the ${sessionTitle} session, you self-reported ${improvements.slice(0, 2).join(" and ")}${improvements.length > 2 ? `, alongside ${improvements.slice(2).join(", ")}` : ""}. Your ending emotional state shifted to "${post.emotionalState || "Grounded"}", reflecting a meaningful moment of pause and restorative focus.`
  } else if (improvements.length === 1) {
    summaryText = `Following the ${sessionTitle} session, your self-reported responses highlighted ${improvements[0]}, while maintaining stability across other wellbeing indicators. Your post-session state was noted as "${post.emotionalState || "Centered"}".`
  } else {
    summaryText = `You completed the ${sessionTitle} session with self-reported markers remaining relatively steady across pre- and post-measurements. Continued participation in mindful reset practices can support deeper relaxation over time.`
  }

  return {
    generatedAt: new Date(),
    stressDelta,
    calmnessDelta,
    tensionDelta,
    relaxationDelta,
    wellbeingDelta,
    emotionalRatingDelta,
    overallShiftScore,
    summaryText,
    shifts,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reset-labs/session/:sessionId
// Validate Session ID and return session details + participant check-in status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/session/:sessionId", requireUser, async (req, res) => {
  try {
    const rawId = (req.params.sessionId || "").trim().toUpperCase()
    if (!rawId) {
      return res.status(400).json({ success: false, message: "Session ID is required." })
    }

    let session = await ResetLabSession.findOne({ sessionId: rawId })

    // If not in DB yet, check if it matches initial known demo session IDs or create gracefully
    if (!session) {
      if (rawId === "AU-2026-001") {
        session = new ResetLabSession({
          sessionId: "AU-2026-001",
          sessionType: "acoustic-unwind",
          title: "Acoustic Unwind",
          date: "2026-11-20",
          time: "16:00 - 16:45",
          venue: "Cortoe Wellbeing Studio, Suite 400",
          facilitator: "Elena Vance, M.Mus.",
          capacity: 8,
          status: "Scheduled",
        })
        await session.save()
      } else if (rawId === "EU-2026-001") {
        session = new ResetLabSession({
          sessionId: "EU-2026-001",
          sessionType: "express-unwind",
          title: "Express & Unwind",
          date: "2026-11-22",
          time: "14:00 - 15:00",
          venue: "Cortoe Creative Studio, Room 204",
          facilitator: "Marcus Thorne, ATR-BC",
          capacity: 8,
          status: "Scheduled",
        })
        await session.save()
      } else {
        return res.status(404).json({
          success: false,
          message: `Session ID "${rawId}" was not found. Please verify the ID provided by your session facilitator.`,
        })
      }
    }

    if (session.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: `Session ${session.sessionId} has been cancelled by the facilitator.`,
      })
    }

    // Check current user's attendance status for this session
    const attendance = await ResetLabAttendance.findOne({
      sessionId: session.sessionId,
      userId: req.user._id,
    })

    return res.json({
      success: true,
      session: {
        id: session._id,
        sessionId: session.sessionId,
        sessionType: session.sessionType,
        title: session.title,
        date: session.date,
        time: session.time,
        venue: session.venue,
        facilitator: session.facilitator,
        capacity: session.capacity,
        status: session.status,
      },
      userStatus: {
        hasCheckedIn: Boolean(attendance),
        hasCheckedOut: Boolean(attendance && attendance.status === "CHECKED_OUT"),
        status: attendance ? attendance.status : "NOT_CHECKED_IN",
        checkInTime: attendance?.checkInTime || null,
        checkOutTime: attendance?.checkOutTime || null,
        attendanceId: attendance?._id || null,
        preAssessment: attendance?.preAssessment || null,
      },
    })
  } catch (err) {
    console.error("[RESET-LABS] Error querying session:", err.message)
    return res.status(500).json({ success: false, message: "Error validating session ID." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reset-labs/checkin
// Pre-Session Check-in: Validates session, records pre-assessment, saves attendance
// ─────────────────────────────────────────────────────────────────────────────
router.post("/checkin", requireUser, async (req, res) => {
  try {
    const user = req.user
    const { sessionId, preAssessment } = req.body

    const rawId = (sessionId || "").trim().toUpperCase()
    if (!rawId) {
      return res.status(400).json({ success: false, message: "Session ID is required." })
    }

    if (!preAssessment) {
      return res.status(400).json({ success: false, message: "Pre-session assessment is required." })
    }

    // Numerical scale validation (1-10)
    const requiredMetrics = ["stress", "physicalTension", "mentalCalmness", "relaxation", "wellbeing"]
    for (const m of requiredMetrics) {
      const val = Number(preAssessment[m])
      if (isNaN(val) || val < 1 || val > 10) {
        return res.status(400).json({
          success: false,
          message: `Assessment metric "${m}" must be a rating between 1 and 10.`,
        })
      }
    }

    let session = await ResetLabSession.findOne({ sessionId: rawId })
    if (!session) {
      // Auto-bootstrap demo ID if matched
      if (rawId === "AU-2026-001" || rawId === "EU-2026-001") {
        const isAU = rawId === "AU-2026-001"
        session = new ResetLabSession({
          sessionId: rawId,
          sessionType: isAU ? "acoustic-unwind" : "express-unwind",
          title: isAU ? "Acoustic Unwind" : "Express & Unwind",
          date: isAU ? "2026-11-20" : "2026-11-22",
          time: isAU ? "16:00 - 16:45" : "14:00 - 15:00",
          venue: isAU ? "Cortoe Wellbeing Studio, Suite 400" : "Cortoe Creative Studio, Room 204",
          facilitator: isAU ? "Elena Vance, M.Mus." : "Marcus Thorne, ATR-BC",
          capacity: 8,
          status: "Scheduled",
        })
        await session.save()
      } else {
        return res.status(404).json({
          success: false,
          message: `Session ID "${rawId}" does not exist or has expired.`,
        })
      }
    }

    if (session.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This session has been cancelled and cannot accept check-ins.",
      })
    }

    // Enforce: participant can check in only once per session
    const existing = await ResetLabAttendance.findOne({
      sessionId: session.sessionId,
      userId: user._id,
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already completed pre-session check-in for this session.",
        attendance: existing,
      })
    }

    const attendance = new ResetLabAttendance({
      sessionId: session.sessionId,
      resetLabSessionId: session._id,
      userId: user._id,
      userName: user.name || "Participant",
      userEmail: user.email || "",
      sessionType: session.sessionType,
      sessionTitle: session.title,
      checkInTime: new Date(),
      status: "CHECKED_IN",
      preAssessment: {
        stress: Number(preAssessment.stress),
        physicalTension: Number(preAssessment.physicalTension),
        mentalCalmness: Number(preAssessment.mentalCalmness),
        relaxation: Number(preAssessment.relaxation),
        wellbeing: Number(preAssessment.wellbeing),
        emotionalState: preAssessment.emotionalState || "Neutral",
        emotionalRating: Number(preAssessment.emotionalRating) || 5,
        notes: preAssessment.notes ? String(preAssessment.notes).trim() : "",
      },
    })

    await attendance.save()

    return res.status(201).json({
      success: true,
      message: "Your pre-session check-in is complete. Enjoy your Reset Lab experience.",
      session: {
        sessionId: session.sessionId,
        title: session.title,
        date: session.date,
        time: session.time,
        venue: session.venue,
        facilitator: session.facilitator,
      },
      attendance: {
        id: attendance._id,
        sessionId: attendance.sessionId,
        checkInTime: attendance.checkInTime,
        status: attendance.status,
      },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already completed pre-session check-in for this session.",
      })
    }
    console.error("[RESET-LABS] Error during check-in:", err.message)
    return res.status(500).json({ success: false, message: "Error completing check-in." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reset-labs/checkout
// Post-Session Checkout: Validates check-in, records post-assessment, generates report
// ─────────────────────────────────────────────────────────────────────────────
router.post("/checkout", requireUser, async (req, res) => {
  try {
    const user = req.user
    const { sessionId, postAssessment } = req.body

    const rawId = (sessionId || "").trim().toUpperCase()
    if (!rawId) {
      return res.status(400).json({ success: false, message: "Session ID is required." })
    }

    if (!postAssessment) {
      return res.status(400).json({ success: false, message: "Post-session assessment is required." })
    }

    // Numerical scale validation (1-10)
    const requiredMetrics = ["stress", "physicalTension", "mentalCalmness", "relaxation", "wellbeing"]
    for (const m of requiredMetrics) {
      const val = Number(postAssessment[m])
      if (isNaN(val) || val < 1 || val > 10) {
        return res.status(400).json({
          success: false,
          message: `Assessment metric "${m}" must be a rating between 1 and 10.`,
        })
      }
    }

    const attendance = await ResetLabAttendance.findOne({
      sessionId: rawId,
      userId: user._id,
    })

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: `No pre-session check-in record was found for session "${rawId}". You must complete pre-session check-in before checkout.`,
      })
    }

    if (attendance.status === "CHECKED_OUT") {
      return res.status(409).json({
        success: false,
        message: "Your session checkout has already been submitted for this session.",
        report: attendance.report,
        attendance,
      })
    }

    // Record Post-Assessment Responses
    attendance.postAssessment = {
      stress: Number(postAssessment.stress),
      physicalTension: Number(postAssessment.physicalTension),
      mentalCalmness: Number(postAssessment.mentalCalmness),
      relaxation: Number(postAssessment.relaxation),
      wellbeing: Number(postAssessment.wellbeing),
      emotionalState: postAssessment.emotionalState || "Centered",
      emotionalRating: Number(postAssessment.emotionalRating) || 8,
      standoutMoment: postAssessment.standoutMoment ? String(postAssessment.standoutMoment).trim() : "",
      notes: postAssessment.notes ? String(postAssessment.notes).trim() : "",
    }

    // Automatically generate before vs after report
    const report = calculateSessionReport(
      attendance.preAssessment,
      attendance.postAssessment,
      attendance.sessionTitle
    )

    attendance.report = report
    attendance.checkOutTime = new Date()
    attendance.status = "CHECKED_OUT"

    await attendance.save()

    return res.json({
      success: true,
      message: "Your session checkout is complete. Your session report is being generated.",
      attendanceId: attendance._id,
      sessionId: attendance.sessionId,
      sessionTitle: attendance.sessionTitle,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      report,
    })
  } catch (err) {
    console.error("[RESET-LABS] Error during checkout:", err.message)
    return res.status(500).json({ success: false, message: "Error completing checkout." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reset-labs/my-reports
// Retrieve participant's completed session reports and active check-ins
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my-reports", requireUser, async (req, res) => {
  try {
    const user = req.user

    const completedReports = await ResetLabAttendance.find({
      userId: user._id,
      status: "CHECKED_OUT",
    })
      .sort({ checkOutTime: -1 })
      .lean()

    const activeCheckIns = await ResetLabAttendance.find({
      userId: user._id,
      status: "CHECKED_IN",
    })
      .sort({ checkInTime: -1 })
      .lean()

    return res.json({
      success: true,
      reports: completedReports,
      activeCheckIns,
    })
  } catch (err) {
    console.error("[RESET-LABS] Error fetching participant reports:", err.message)
    return res.status(500).json({ success: false, message: "Error retrieving session reports." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reset-labs/reports/:attendanceId
// Retrieve a specific report by attendance ID
// ─────────────────────────────────────────────────────────────────────────────
router.get("/reports/:attendanceId", requireUser, async (req, res) => {
  try {
    const { attendanceId } = req.params

    if (!mongoose.isValidObjectId(attendanceId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID." })
    }

    const attendance = await ResetLabAttendance.findById(attendanceId).lean()
    if (!attendance) {
      return res.status(404).json({ success: false, message: "Report not found." })
    }

    // Access control: only owner or facilitator/admin can view
    const isOwner = String(attendance.userId) === String(req.user._id)
    const isAdmin =
      (req.user?.role || "").toLowerCase() === "admin" ||
      Boolean(req.user.isFacilitator) ||
      (req.user?.email || "").includes("facilitator")

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to access this session report." })
    }

    return res.json({
      success: true,
      attendance,
    })
  } catch (err) {
    console.error("[RESET-LABS] Error fetching single report:", err.message)
    return res.status(500).json({ success: false, message: "Error retrieving report." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / FACILITATOR: POST /api/reset-labs/admin/sessions
// Create & Schedule a physical Reset Lab session with unique Session ID
// ─────────────────────────────────────────────────────────────────────────────
router.post("/admin/sessions", requireFacilitatorOrAdmin, async (req, res) => {
  try {
    const {
      sessionType,
      title,
      date,
      time,
      venue,
      facilitator,
      capacity = 8,
      notes = "",
      customSessionId = null,
    } = req.body

    if (!sessionType || !["acoustic-unwind", "express-unwind"].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid sessionType is required: "acoustic-unwind" or "express-unwind".',
      })
    }

    if (!date || !time) {
      return res.status(400).json({ success: false, message: "Session date and time are required." })
    }

    let sessionId = customSessionId ? String(customSessionId).trim().toUpperCase() : null
    if (sessionId) {
      const existing = await ResetLabSession.findOne({ sessionId })
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Session ID "${sessionId}" already exists. Please choose a different ID or leave blank to auto-generate.`,
        })
      }
    } else {
      // Auto-generate format: AU-YYYY-NNN or EU-YYYY-NNN
      const targetYear = date ? new Date(date).getFullYear() || new Date().getFullYear() : new Date().getFullYear()
      sessionId = await generateUniqueSessionId(sessionType, targetYear)
    }

    const defaultTitle = sessionType === "express-unwind" ? "Express & Unwind" : "Acoustic Unwind"
    const defaultFacilitator =
      sessionType === "express-unwind" ? "Marcus Thorne, ATR-BC" : "Elena Vance, M.Mus."

    const session = new ResetLabSession({
      sessionId,
      sessionType,
      title: title || defaultTitle,
      date,
      time,
      venue: venue || "Cortoe Wellbeing Studio, Suite 400",
      facilitator: facilitator || defaultFacilitator,
      capacity: Number(capacity) || 8,
      status: "Scheduled",
      notes: notes ? String(notes).trim() : "",
      createdBy: req.user._id,
      organisationId: req.user.organisationId || null,
    })

    await session.save()

    return res.status(201).json({
      success: true,
      message: `Session scheduled successfully with unique ID: ${sessionId}`,
      session,
    })
  } catch (err) {
    console.error("[RESET-LABS-ADMIN] Error creating session:", err.message)
    return res.status(500).json({ success: false, message: "Error scheduling session." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / FACILITATOR: GET /api/reset-labs/admin/sessions
// List scheduled and past Reset Lab sessions with attendance counts
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/sessions", requireFacilitatorOrAdmin, async (req, res) => {
  try {
    const sessions = await ResetLabSession.find().sort({ createdAt: -1 }).lean()

    // Aggregate attendance counts for each session
    const sessionIds = sessions.map((s) => s.sessionId)
    const attendances = await ResetLabAttendance.find({
      sessionId: { $in: sessionIds },
    })
      .select("sessionId status checkInTime checkOutTime userId userName")
      .lean()

    const enriched = sessions.map((s) => {
      const sessionAttendances = attendances.filter((a) => a.sessionId === s.sessionId)
      const checkInsCount = sessionAttendances.length
      const checkOutsCount = sessionAttendances.filter((a) => a.status === "CHECKED_OUT").length
      const pendingCheckoutsCount = checkInsCount - checkOutsCount

      return {
        ...s,
        metrics: {
          capacity: s.capacity || 8,
          totalCheckIns: checkInsCount,
          totalCheckOuts: checkOutsCount,
          pendingCheckOuts: pendingCheckoutsCount,
        },
      }
    })

    return res.json({
      success: true,
      sessions: enriched,
    })
  } catch (err) {
    console.error("[RESET-LABS-ADMIN] Error listing sessions:", err.message)
    return res.status(500).json({ success: false, message: "Error retrieving sessions." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / FACILITATOR: GET /api/reset-labs/admin/sessions/:sessionId
// Session Detail: View roster, check-ins vs checkouts, and cohort aggregated stats
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/sessions/:sessionId", requireFacilitatorOrAdmin, async (req, res) => {
  try {
    const rawId = (req.params.sessionId || "").trim().toUpperCase()
    let session = await ResetLabSession.findOne({ sessionId: rawId }).lean()

    if (!session) {
      if (rawId === "AU-2026-001" || rawId === "EU-2026-001") {
        const isAU = rawId === "AU-2026-001"
        const newSession = new ResetLabSession({
          sessionId: rawId,
          sessionType: isAU ? "acoustic-unwind" : "express-unwind",
          title: isAU ? "Acoustic Unwind" : "Express & Unwind",
          date: isAU ? "2026-11-20" : "2026-11-22",
          time: isAU ? "16:00 - 16:45" : "14:00 - 15:00",
          venue: isAU ? "Cortoe Wellbeing Studio, Suite 400" : "Cortoe Creative Studio, Room 204",
          facilitator: isAU ? "Elena Vance, M.Mus." : "Marcus Thorne, ATR-BC",
          capacity: 8,
          status: "Scheduled",
        })
        await newSession.save()
        session = newSession.toObject()
      } else {
        return res.status(404).json({ success: false, message: `Session ${rawId} not found.` })
      }
    }

    const attendances = await ResetLabAttendance.find({ sessionId: rawId })
      .sort({ checkInTime: 1 })
      .lean()

    const totalCheckIns = attendances.length
    const checkOuts = attendances.filter((a) => a.status === "CHECKED_OUT")
    const pendingCheckOuts = attendances.filter((a) => a.status === "CHECKED_IN")

    // Calculate cohort-level aggregated pre/post statistics
    let cohortAggregates = null
    if (checkOuts.length > 0) {
      const sum = {
        preStress: 0,
        postStress: 0,
        preTension: 0,
        postTension: 0,
        preCalmness: 0,
        postCalmness: 0,
        preRelaxation: 0,
        postRelaxation: 0,
        preWellbeing: 0,
        postWellbeing: 0,
      }

      for (const a of checkOuts) {
        sum.preStress += a.preAssessment.stress
        sum.postStress += a.postAssessment.stress
        sum.preTension += a.preAssessment.physicalTension
        sum.postTension += a.postAssessment.physicalTension
        sum.preCalmness += a.preAssessment.mentalCalmness
        sum.postCalmness += a.postAssessment.mentalCalmness
        sum.preRelaxation += a.preAssessment.relaxation
        sum.postRelaxation += a.postAssessment.relaxation
        sum.preWellbeing += a.preAssessment.wellbeing
        sum.postWellbeing += a.postAssessment.wellbeing
      }

      const n = checkOuts.length
      const avg = (val) => Math.round((val / n) * 10) / 10

      cohortAggregates = {
        completedCount: n,
        averageStress: { pre: avg(sum.preStress), post: avg(sum.postStress), delta: avg(sum.postStress - sum.preStress) },
        averageTension: { pre: avg(sum.preTension), post: avg(sum.postTension), delta: avg(sum.postTension - sum.preTension) },
        averageCalmness: { pre: avg(sum.preCalmness), post: avg(sum.postCalmness), delta: avg(sum.postCalmness - sum.preCalmness) },
        averageRelaxation: { pre: avg(sum.preRelaxation), post: avg(sum.postRelaxation), delta: avg(sum.postRelaxation - sum.preRelaxation) },
        averageWellbeing: { pre: avg(sum.preWellbeing), post: avg(sum.postWellbeing), delta: avg(sum.postWellbeing - sum.preWellbeing) },
      }
    }

    // Role-based privacy: sanitize individual qualitative reflections from broad facilitator view
    const roster = attendances.map((a) => ({
      attendanceId: a._id,
      userName: a.userName,
      userEmail: a.userEmail,
      status: a.status,
      checkInTime: a.checkInTime,
      checkOutTime: a.checkOutTime,
      preSummary: {
        stress: a.preAssessment.stress,
        tension: a.preAssessment.physicalTension,
        calmness: a.preAssessment.mentalCalmness,
        relaxation: a.preAssessment.relaxation,
        wellbeing: a.preAssessment.wellbeing,
      },
      postSummary: a.postAssessment?.stress
        ? {
            stress: a.postAssessment.stress,
            tension: a.postAssessment.physicalTension,
            calmness: a.postAssessment.mentalCalmness,
            relaxation: a.postAssessment.relaxation,
            wellbeing: a.postAssessment.wellbeing,
          }
        : null,
      overallShiftScore: a.report?.overallShiftScore ?? null,
    }))

    return res.json({
      success: true,
      session,
      metrics: {
        capacity: session.capacity || 8,
        totalCheckIns,
        totalCheckOuts: checkOuts.length,
        pendingCheckOuts: pendingCheckOuts.length,
      },
      cohortAggregates,
      roster,
    })
  } catch (err) {
    console.error("[RESET-LABS-ADMIN] Error retrieving session detail:", err.message)
    return res.status(500).json({ success: false, message: "Error fetching session details." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / FACILITATOR: GET /api/reset-labs/admin/sessions/:sessionId/export
// Export session summary as CSV
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/sessions/:sessionId/export", requireFacilitatorOrAdmin, async (req, res) => {
  try {
    const rawId = (req.params.sessionId || "").trim().toUpperCase()
    const session = await ResetLabSession.findOne({ sessionId: rawId }).lean()
    if (!session) {
      return res.status(404).json({ success: false, message: `Session ${rawId} not found.` })
    }

    const attendances = await ResetLabAttendance.find({ sessionId: rawId })
      .sort({ checkInTime: 1 })
      .lean()

    const csvRows = []
    csvRows.push(["Session ID", session.sessionId])
    csvRows.push(["Program Title", session.title])
    csvRows.push(["Session Type", session.sessionType])
    csvRows.push(["Date", session.date])
    csvRows.push(["Time", session.time])
    csvRows.push(["Venue", session.venue])
    csvRows.push(["Facilitator", session.facilitator])
    csvRows.push(["Total Check-Ins", attendances.length])
    csvRows.push(["Total Check-Outs", attendances.filter((a) => a.status === "CHECKED_OUT").length])
    csvRows.push([])
    csvRows.push([
      "Participant Name",
      "Email",
      "Status",
      "Check-In Time (UTC)",
      "Check-Out Time (UTC)",
      "Pre Stress",
      "Post Stress",
      "Stress Delta",
      "Pre Tension",
      "Post Tension",
      "Tension Delta",
      "Pre Calmness",
      "Post Calmness",
      "Calmness Delta",
      "Pre Relaxation",
      "Post Relaxation",
      "Relaxation Delta",
      "Pre Wellbeing",
      "Post Wellbeing",
      "Wellbeing Delta",
      "Shift Score",
    ])

    for (const a of attendances) {
      const isOut = a.status === "CHECKED_OUT"
      csvRows.push([
        `"${a.userName || ""}"`,
        `"${a.userEmail || ""}"`,
        a.status,
        a.checkInTime ? new Date(a.checkInTime).toISOString() : "",
        a.checkOutTime ? new Date(a.checkOutTime).toISOString() : "",
        a.preAssessment.stress,
        isOut ? a.postAssessment.stress : "",
        isOut ? a.postAssessment.stress - a.preAssessment.stress : "",
        a.preAssessment.physicalTension,
        isOut ? a.postAssessment.physicalTension : "",
        isOut ? a.postAssessment.physicalTension - a.preAssessment.physicalTension : "",
        a.preAssessment.mentalCalmness,
        isOut ? a.postAssessment.mentalCalmness : "",
        isOut ? a.postAssessment.mentalCalmness - a.preAssessment.mentalCalmness : "",
        a.preAssessment.relaxation,
        isOut ? a.postAssessment.relaxation : "",
        isOut ? a.postAssessment.relaxation - a.preAssessment.relaxation : "",
        a.preAssessment.wellbeing,
        isOut ? a.postAssessment.wellbeing : "",
        isOut ? a.postAssessment.wellbeing - a.preAssessment.wellbeing : "",
        isOut ? a.report?.overallShiftScore || "" : "",
      ])
    }

    const csvContent = csvRows.map((r) => r.join(",")).join("\n")

    res.setHeader("Content-Type", "text/csv")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reset_lab_session_${session.sessionId}.csv"`
    )
    return res.send(csvContent)
  } catch (err) {
    console.error("[RESET-LABS-ADMIN] Error exporting session CSV:", err.message)
    return res.status(500).json({ success: false, message: "Error exporting CSV report." })
  }
})

module.exports = router

