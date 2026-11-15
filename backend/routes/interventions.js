const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const Intervention = require("../models/Intervention")
const InterventionSession = require("../models/InterventionSession")
const Assessment = require("../models/Assessment")
const User = require("../models/User")
const { requireActiveEmployee } = require("../middleware/auth")
const { getOrCreateIntervention } = require("../services/interventionService")

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interventions/record
// Unified employee endpoint to start or complete an intervention session.
// Automatically retrieves preMSI from employee's latest assessment,
// calculates msiChange if postMSI is provided, and records departmentId.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/record", requireActiveEmployee, async (req, res) => {
  try {
    const user = req.user
    const {
      interventionName,
      type = "RESET_LAB",
      category = "General",
      duration = 0,
      postFeeling = null,
      status = "Completed",
      metadata = {},
    } = req.body

    if (!interventionName) {
      return res.status(400).json({ success: false, message: "Intervention name is required." })
    }

    // 1. Get or create intervention in employee's organisation
    const intervention = await getOrCreateIntervention(
      user.organisationId,
      interventionName,
      type,
      category
    )

    // 2. Fetch employee's latest MSI assessment for preMSI
    const latestAssessment = await Assessment.findOne({
      userId: user._id,
      status: "Completed",
    }).sort({ completedAt: -1 })

    const preMSI = latestAssessment ? latestAssessment.msi : (user.baselineMsi ?? null)

    // 3. Post-MSI calculation if feeling is provided
    let postMSI = null
    let msiChange = null

    if (preMSI != null) {
      if (postFeeling) {
        // Observational feeling delta mapping
        const feelingLower = String(postFeeling).toLowerCase()
        let feelingDelta = 0
        if (feelingLower.includes("much better") || feelingLower.includes("great") || feelingLower.includes("energised")) {
          feelingDelta = -14
        } else if (feelingLower.includes("better") || feelingLower.includes("calm") || feelingLower.includes("good") || feelingLower.includes("relaxed")) {
          feelingDelta = -8
        } else if (feelingLower.includes("about the same") || feelingLower.includes("okay")) {
          feelingDelta = -2
        } else if (feelingLower.includes("not really") || feelingLower.includes("still")) {
          feelingDelta = 0
        } else {
          feelingDelta = -5
        }
        postMSI = Math.max(0, Math.min(100, Math.round(preMSI + feelingDelta)))
        msiChange = postMSI - preMSI
      }
    }

    const session = new InterventionSession({
      interventionId: intervention._id,
      interventionName: intervention.name,
      type: intervention.type,
      category: intervention.category,
      employeeId: user._id,
      organisationId: user.organisationId,
      departmentId: user.departmentId || null,
      startedAt: new Date(Date.now() - (duration ? duration * 1000 : 60000)),
      completedAt: new Date(),
      status: status || "Completed",
      preMSI,
      postMSI,
      msiChange,
      duration: duration || 0,
      metadata: {
        ...metadata,
        postFeeling,
      },
    })

    await session.save()

    // If type is HUMAN_LISTENER, create a real ListenerSession and notify active listeners
    if (type === "HUMAN_LISTENER" || interventionName.toLowerCase().includes("listener")) {
      try {
        const Listener = require("../models/Listener")
        const ListenerSession = require("../models/ListenerSession")
        const ListenerNotification = require("../models/ListenerNotification")

        // Find an active listener
        let targetListener = await Listener.findOne({ status: "Active", availabilityStatus: "Available" })
        if (!targetListener) {
          targetListener = await Listener.findOne({ status: "Active" })
        }

        if (targetListener) {
          const randNum = Math.floor(1000 + Math.random() * 9000)
          const sid = `S-${randNum}`
          const { getKolkataNow } = require("../services/sessionNotificationService")
          const kolkataNow = getKolkataNow()
          const isTomorrow = metadata.day === "tomorrow"
          const targetDateStr = isTomorrow ? kolkataNow.tomorrowStr : kolkataNow.todayStr
          const bookingDateLabel = isTomorrow ? "Tomorrow" : "Today"
          const bookingTime = metadata.timeSlot || "18:00"
          const exactScheduledDate = new Date(`${targetDateStr}T${bookingTime.trim()}:00+05:30`)

          const lSession = await ListenerSession.create({
            sessionId: sid,
            listenerId: targetListener._id,
            employeeId: user._id,
            organisationId: user.organisationId,
            date: targetDateStr,
            time: bookingTime,
            startTime: bookingTime,
            scheduledDate: exactScheduledDate,
            duration: 45,
            status: "Requested",
            scheduledAt: new Date(),
            metadata: {
              bookedByEmployee: true,
            },
          })

          await ListenerNotification.create({
            listenerId: targetListener._id,
            type: "session_request",
            title: "New Session Request",
            message: `A new anonymous listening session (${sid}) has been requested for ${bookingDateLabel} at ${bookingTime}.`,
            data: { sessionId: sid, listenerSessionId: lSession._id.toString() },
          })
        }
      } catch (listenerLinkErr) {
        console.warn("[INTERVENTIONS] ListenerSession creation warning:", listenerLinkErr.message)
      }
    }

    return res.status(201).json({
      success: true,
      message: "Intervention recorded successfully.",
      data: {
        sessionId: session._id,
        interventionName: intervention.name,
        preMSI,
        postMSI,
        msiChange,
      },
    })
  } catch (err) {
    console.error("[INTERVENTIONS-EMPLOYEE] Error recording intervention:", err.message)
    return res.status(500).json({ success: false, message: "Error recording intervention session." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interventions/programs
// Returns Reset Labs programs (Acoustic Unwind & Express & Unwind) and any actual upcoming sessions
// ─────────────────────────────────────────────────────────────────────────────
router.get("/programs", requireActiveEmployee, async (req, res) => {
  try {
    const user = req.user
    const { ensureInterventionsForOrg } = require("../services/interventionService")
    if (user.organisationId) {
      await ensureInterventionsForOrg(user.organisationId)
    }

    // Query active Reset Labs programs for this org
    const orgInterventions = await Intervention.find({
      organisationId: user.organisationId,
      status: "Active",
      name: { $in: ["Acoustic Unwind", "Express & Unwind"] },
    }).lean()

    // Query actual upcoming sessions scheduled in the database
    const now = new Date()
    const upcomingSessions = await InterventionSession.find({
      organisationId: user.organisationId,
      interventionName: { $in: ["Acoustic Unwind", "Express & Unwind"] },
      status: { $in: ["Scheduled", "Upcoming", "Active"] },
      $or: [
        { "metadata.scheduledDate": { $gte: now } },
        { startedAt: { $gte: now } },
      ],
    })
      .sort({ startedAt: 1 })
      .lean()

    // Check if the current user has registered for any upcoming sessions
    const myRegistrations = await InterventionSession.find({
      employeeId: user._id,
      interventionName: { $in: ["Acoustic Unwind", "Express & Unwind"] },
      status: { $in: ["Registered", "Requested", "Scheduled"] },
    })
      .sort({ createdAt: -1 })
      .lean()

    return res.json({
      success: true,
      programs: orgInterventions,
      upcomingSessions,
      myRegistrations,
    })
  } catch (err) {
    console.error("[INTERVENTIONS] Error fetching programs:", err.message)
    return res.status(500).json({ success: false, message: "Error fetching programs." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interventions/register
// Register or express interest in an experiential Reset Lab program
// ─────────────────────────────────────────────────────────────────────────────
router.post("/register", requireActiveEmployee, async (req, res) => {
  try {
    const user = req.user
    const { programName, notes = "" } = req.body

    if (!programName) {
      return res.status(400).json({ success: false, message: "Program name is required." })
    }

    const intervention = await getOrCreateIntervention(
      user.organisationId,
      programName,
      "RESET_LAB",
      programName.toLowerCase().includes("acoustic") ? "Music & Mindfulness" : "Art & Creative Expression"
    )

    // Check if user already registered recently (within last 7 days) and still pending
    const existing = await InterventionSession.findOne({
      employeeId: user._id,
      interventionName: intervention.name,
      status: { $in: ["Registered", "Requested"] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })

    if (existing) {
      return res.json({
        success: true,
        alreadyRegistered: true,
        message: "You are already registered for upcoming sessions of this program.",
        registration: existing,
      })
    }

    const registration = new InterventionSession({
      interventionId: intervention._id,
      interventionName: intervention.name,
      type: intervention.type,
      category: intervention.category,
      employeeId: user._id,
      organisationId: user.organisationId,
      departmentId: user.departmentId || null,
      startedAt: new Date(),
      status: "Registered",
      metadata: {
        registrationType: "interest_waitlist",
        notes,
        userEmail: user.email,
        registeredAt: new Date().toISOString(),
      },
    })

    await registration.save()

    return res.status(201).json({
      success: true,
      message: `You're registered for ${intervention.name}. We'll notify you when dates are confirmed!`,
      registration,
    })
  } catch (err) {
    console.error("[INTERVENTIONS] Error registering for program:", err.message)
    return res.status(500).json({ success: false, message: "Error registering for session." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interventions/book
// Book a verified scheduled Reset Lab session
// ─────────────────────────────────────────────────────────────────────────────
router.post("/book", requireActiveEmployee, async (req, res) => {
  try {
    const user = req.user
    const { programName, scheduledDate, timeSlot, venue, facilitator, notes = "" } = req.body

    if (!programName) {
      return res.status(400).json({ success: false, message: "Program name is required." })
    }

    const intervention = await getOrCreateIntervention(
      user.organisationId,
      programName,
      "RESET_LAB",
      programName.toLowerCase().includes("acoustic") ? "Music & Mindfulness" : "Art & Creative Expression"
    )

    const bookingRef = `CQ-LAB-${Math.floor(1000 + Math.random() * 9000)}`

    const session = new InterventionSession({
      interventionId: intervention._id,
      interventionName: intervention.name,
      type: intervention.type,
      category: intervention.category,
      employeeId: user._id,
      organisationId: user.organisationId,
      departmentId: user.departmentId || null,
      startedAt: scheduledDate ? new Date(`${scheduledDate}T${timeSlot ? timeSlot.split(" ")[0] : "15:00"}:00`) : new Date(),
      status: "Scheduled",
      metadata: {
        bookingRef,
        scheduledDate: scheduledDate || "Upcoming Cohort",
        timeSlot: timeSlot || "15:00 - 15:45",
        venue: venue || "CortiQuant Wellbeing Studio, Suite 400",
        facilitator:
          facilitator ||
          (programName.toLowerCase().includes("acoustic")
            ? "Elena Vance, M.Mus."
            : "Marcus Thorne, ATR-BC"),
        notes,
        userEmail: user.email,
        bookedAt: new Date().toISOString(),
      },
    })

    await session.save()

    return res.status(201).json({
      success: true,
      message: `Successfully booked ${intervention.name} for ${scheduledDate || "upcoming session"}!`,
      booking: session,
      bookingRef,
    })
  } catch (err) {
    console.error("[INTERVENTIONS] Error booking session:", err.message)
    return res.status(500).json({ success: false, message: "Error booking session." })
  }
})

module.exports = router
