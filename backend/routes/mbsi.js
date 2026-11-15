const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Assessment = require("../models/Assessment")
const MBSIAssessment = require("../models/MBSIAssessment")
const { requireActiveEmployee } = require("../middleware/auth")
const {
  FORMULA_VERSION,
  NORMALIZATION_VERSION,
  BIOMARKER_CONFIG,
  processMBSICalculation,
} = require("../services/biomarkerNormalizationService")

// Helper to resolve user's current valid MSI score
async function resolveCurrentMSI(userId) {
  const user = await User.findById(userId)
  if (!user) return null

  // 1. Check user.msi array
  if (Array.isArray(user.msi) && user.msi.length > 0) {
    const latestItem = user.msi[user.msi.length - 1]
    if (typeof latestItem.score === "number") {
      return { score: latestItem.score, source: latestItem.type || "weekly" }
    }
  }

  // 2. Check latest check-in assessment
  const latestAssessment = await Assessment.findOne({ userId }).sort({ completedAt: -1 })
  if (latestAssessment && typeof latestAssessment.msi === "number") {
    return { score: latestAssessment.msi, source: "assessment", id: latestAssessment._id }
  }

  // 3. Check legacy baselineMsi
  if (typeof user.baselineMsi === "number") {
    return { score: user.baselineMsi, source: "baseline" }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mbsi/config
// Returns current biomarker units, ranges, and provisional formula metadata
// ─────────────────────────────────────────────────────────────────────────────
router.get("/config", requireActiveEmployee, (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      formula: "MBSI = (0.60 * MSI) + (0.40 * BSI)",
      bsiFormula: "BSI = (0.40 * Cortisol) + (0.30 * DHEA) + (0.30 * CRP)",
      formulaVersion: FORMULA_VERSION,
      normalizationVersion: NORMALIZATION_VERSION,
      isProvisional: true,
      biomarkers: {
        cortisol: {
          name: BIOMARKER_CONFIG.cortisol.name,
          supportedUnits: BIOMARKER_CONFIG.cortisol.supportedUnits,
          defaultUnit: BIOMARKER_CONFIG.cortisol.defaultUnit,
          referenceRange: BIOMARKER_CONFIG.cortisol.range,
        },
        dhea: {
          name: BIOMARKER_CONFIG.dhea.name,
          supportedUnits: BIOMARKER_CONFIG.dhea.supportedUnits,
          defaultUnit: BIOMARKER_CONFIG.dhea.defaultUnit,
          referenceRange: BIOMARKER_CONFIG.dhea.range,
        },
        crp: {
          name: BIOMARKER_CONFIG.crp.name,
          supportedUnits: BIOMARKER_CONFIG.crp.supportedUnits,
          defaultUnit: BIOMARKER_CONFIG.crp.defaultUnit,
          referenceRange: BIOMARKER_CONFIG.crp.range,
        },
      },
    },
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mbsi/latest
// Retrieves user's latest calculated MBSI assessment + current MSI status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/latest", requireActiveEmployee, async (req, res) => {
  try {
    const userId = req.user._id
    const msiInfo = await resolveCurrentMSI(userId)
    const latestMbsi = await MBSIAssessment.findOne({ userId }).sort({ calculatedAt: -1 })

    if (!latestMbsi) {
      return res.status(200).json({
        success: true,
        hasMbsi: false,
        currentMsi: msiInfo ? msiInfo.score : null,
        msiSource: msiInfo ? msiInfo.source : null,
        data: null,
      })
    }

    return res.status(200).json({
      success: true,
      hasMbsi: true,
      currentMsi: msiInfo ? msiInfo.score : null,
      msiSource: msiInfo ? msiInfo.source : null,
      data: latestMbsi,
    })
  } catch (err) {
    console.error("[MBSI] Error fetching latest MBSI:", err.message)
    return res.status(500).json({ success: false, message: "Server error fetching latest MBSI." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mbsi/history
// Retrieves historical MBSI records strictly for the authenticated user
// Supports optional ?timeframe=7d|30d|3m|1y|all
// ─────────────────────────────────────────────────────────────────────────────
router.get("/history", requireActiveEmployee, async (req, res) => {
  try {
    const userId = req.user._id
    const { timeframe = "all", limit = 100 } = req.query

    const filter = { userId }
    if (timeframe && timeframe !== "all") {
      const now = Date.now()
      let ms = 0
      if (timeframe === "7d") ms = 7 * 86400 * 1000
      else if (timeframe === "30d") ms = 30 * 86400 * 1000
      else if (timeframe === "3m") ms = 90 * 86400 * 1000
      else if (timeframe === "1y") ms = 365 * 86400 * 1000

      if (ms > 0) {
        filter.calculatedAt = { $gte: new Date(now - ms) }
      }
    }

    const history = await MBSIAssessment.find(filter)
      .sort({ calculatedAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, 300))
      .lean()

    // Calculate trend analytics
    let trend = "Stable"
    let currentScore = null
    let previousScore = null
    let delta = null
    let percentChange = null
    let latestDate = null

    if (history.length > 0) {
      currentScore = Math.round(history[0].mbsiScore * 10) / 10
      latestDate = history[0].calculatedAt

      if (history.length > 1) {
        previousScore = Math.round(history[1].mbsiScore * 10) / 10
        delta = Math.round((currentScore - previousScore) * 10) / 10
        if (previousScore > 0) {
          percentChange = Math.round(((currentScore - previousScore) / previousScore) * 100)
        }
        if (delta > 1) {
          trend = "Increasing"
        } else if (delta < -1) {
          trend = "Decreasing"
        } else {
          trend = "Stable"
        }
      }
    }

    return res.status(200).json({
      success: true,
      count: history.length,
      timeframe,
      trendSummary: {
        currentScore,
        previousScore,
        delta,
        percentChange,
        trend,
        latestDate,
      },
      data: history,
    })
  } catch (err) {
    console.error("[MBSI] Error fetching MBSI history:", err.message)
    return res.status(500).json({ success: false, message: "Server error fetching MBSI history." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mbsi/assessment/:id
// Retrieves full record and breakdown of a specific historical MBSI assessment
// ─────────────────────────────────────────────────────────────────────────────
router.get("/assessment/:id", requireActiveEmployee, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const assessment = await MBSIAssessment.findOne({ _id: id, userId }).lean()
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment record not found." })
    }

    return res.status(200).json({
      success: true,
      data: assessment,
    })
  } catch (err) {
    console.error("[MBSI] Error fetching single assessment:", err.message)
    return res.status(500).json({ success: false, message: "Server error retrieving assessment." })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/mbsi/calculate
// Validates biomarkers, computes deterministic MBSI, and saves assessment
// ─────────────────────────────────────────────────────────────────────────────
router.post("/calculate", requireActiveEmployee, async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." })
    }

    // 1. Resolve active psychological MSI score
    const msiInfo = await resolveCurrentMSI(userId)
    if (!msiInfo || typeof msiInfo.score !== "number") {
      return res.status(400).json({
        success: false,
        message: "No valid MSI score found. Please complete an initial Baseline MSI or daily check-in assessment before calculating MBSI.",
      })
    }

    // 2. Validate biomarker inputs
    const { cortisol, dhea, crp } = req.body
    if (!cortisol || !dhea || !crp) {
      return res.status(400).json({
        success: false,
        message: "All three biological biomarkers (Cortisol, DHEA-S, CRP) are required.",
      })
    }

    // 3. Process normalization and calculations
    let calculatedResult
    try {
      calculatedResult = processMBSICalculation({
        msi: msiInfo.score,
        cortisol,
        dhea,
        crp,
      })
    } catch (normErr) {
      return res.status(400).json({
        success: false,
        message: normErr.message,
      })
    }

    // 4. Create and persist MBSIAssessment record
    const newAssessment = new MBSIAssessment({
      userId: user._id,
      employeeId: user.employeeId || null,
      organisationId: user.organisationId || null,
      msiScore: calculatedResult.msiScore,
      msiSource: msiInfo.source || "latest_checkin",
      msiAssessmentId: msiInfo.id || null,
      biomarkers: {
        cortisol: {
          raw: calculatedResult.breakdown.biological.biomarkers.cortisol.raw,
          unit: calculatedResult.breakdown.biological.biomarkers.cortisol.unit,
          testDate: cortisol.testDate ? new Date(cortisol.testDate) : new Date(),
          labName: cortisol.labName ? String(cortisol.labName).trim() : null,
          standardValue: calculatedResult.breakdown.biological.biomarkers.cortisol.standardValue,
          standardUnit: calculatedResult.breakdown.biological.biomarkers.cortisol.standardUnit,
          normalizedScore: calculatedResult.breakdown.biological.biomarkers.cortisol.normalizedScore,
        },
        dhea: {
          raw: calculatedResult.breakdown.biological.biomarkers.dhea.raw,
          unit: calculatedResult.breakdown.biological.biomarkers.dhea.unit,
          testDate: dhea.testDate ? new Date(dhea.testDate) : new Date(),
          labName: dhea.labName ? String(dhea.labName).trim() : null,
          standardValue: calculatedResult.breakdown.biological.biomarkers.dhea.standardValue,
          standardUnit: calculatedResult.breakdown.biological.biomarkers.dhea.standardUnit,
          normalizedScore: calculatedResult.breakdown.biological.biomarkers.dhea.normalizedScore,
        },
        crp: {
          raw: calculatedResult.breakdown.biological.biomarkers.crp.raw,
          unit: calculatedResult.breakdown.biological.biomarkers.crp.unit,
          testDate: crp.testDate ? new Date(crp.testDate) : new Date(),
          labName: crp.labName ? String(crp.labName).trim() : null,
          standardValue: calculatedResult.breakdown.biological.biomarkers.crp.standardValue,
          standardUnit: calculatedResult.breakdown.biological.biomarkers.crp.standardUnit,
          normalizedScore: calculatedResult.breakdown.biological.biomarkers.crp.normalizedScore,
        },
      },
      bsiScore: calculatedResult.bsiScore,
      mbsiScore: calculatedResult.mbsiScore,
      breakdown: calculatedResult.breakdown,
      formulaVersion: calculatedResult.formulaVersion,
      normalizationVersion: calculatedResult.normalizationVersion,
      isProvisional: calculatedResult.isProvisional,
      calculatedAt: new Date(),
    })

    await newAssessment.save()

    // 5. Update user summary field for fast dashboard queries
    user.latestMbsi = {
      score: newAssessment.mbsiScore,
      bsiScore: newAssessment.bsiScore,
      msiScore: newAssessment.msiScore,
      calculatedAt: newAssessment.calculatedAt,
      assessmentId: newAssessment._id,
    }
    await user.save()

    return res.status(201).json({
      success: true,
      message: "Mind-Body Stress Index calculated successfully.",
      data: newAssessment,
    })
  } catch (err) {
    console.error("[MBSI] Calculation error:", err.message)
    return res.status(500).json({ success: false, message: "Server error during MBSI calculation." })
  }
})

module.exports = router

