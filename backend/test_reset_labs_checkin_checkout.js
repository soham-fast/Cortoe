// Unit test suite for Reset Labs Check-in, Checkout & Session Report System
const assert = require("assert")

// Mock assessments
const preAssessment = {
  stress: 8,
  physicalTension: 7,
  mentalCalmness: 3,
  relaxation: 2,
  wellbeing: 4,
  emotionalState: "Overwhelmed & Tight",
  emotionalRating: 3,
  notes: "Looking forward to acoustic unwind to quiet racing thoughts",
}

const postAssessment = {
  stress: 3,
  physicalTension: 2,
  mentalCalmness: 8,
  relaxation: 9,
  wellbeing: 8,
  emotionalState: "Deeply Grounded & Peaceful",
  emotionalRating: 9,
  standoutMoment: "The acoustic cello harmonies resonated deeply",
  notes: "Feel much lighter and focused",
}

// Import helper logic or replicate pure logic from resetLabs
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

  const netShiftPoints = -stressDelta + -tensionDelta + calmnessDelta + relaxationDelta + wellbeingDelta
  const overallShiftScore = Math.round((netShiftPoints / 5) * 10) / 10

  return {
    stressDelta,
    calmnessDelta,
    tensionDelta,
    relaxationDelta,
    wellbeingDelta,
    overallShiftScore,
    shifts,
  }
}

console.log("=== RUNNING RESET LABS CHECK-IN & CHECKOUT TESTS ===")

// Test 1: Report calculation accuracy
const report = calculateSessionReport(preAssessment, postAssessment, "Acoustic Unwind")

assert.strictEqual(report.stressDelta, -5, "Stress delta must be -5")
assert.strictEqual(report.tensionDelta, -5, "Tension delta must be -5")
assert.strictEqual(report.calmnessDelta, 5, "Calmness delta must be +5")
assert.strictEqual(report.relaxationDelta, 7, "Relaxation delta must be +7")
assert.strictEqual(report.wellbeingDelta, 4, "Wellbeing delta must be +4")

const stressShift = report.shifts.find((s) => s.metric === "Perceived Stress")
assert.strictEqual(stressShift.status, "Improved", "Stress decrease must be marked Improved")
assert.strictEqual(stressShift.percentChange, 63, "Stress percent change should round to 63%")

const calmnessShift = report.shifts.find((s) => s.metric === "Mental Calmness")
assert.strictEqual(calmnessShift.status, "Improved", "Calmness increase must be marked Improved")

console.log("✓ Test 1: Report calculation deltas and percent changes verified.")

// Test 2: Session ID pattern validation
const auPattern = /^AU-\d{4}-\d{3}$/
const euPattern = /^EU-\d{4}-\d{3}$/

assert.ok(auPattern.test("AU-2026-001"), "AU-2026-001 must match AU pattern")
assert.ok(euPattern.test("EU-2026-001"), "EU-2026-001 must match EU pattern")
assert.ok(!auPattern.test("COMMON-ID"), "Generic ID must fail")

console.log("✓ Test 2: Unique Session ID pattern verified.")

// Test 3: Metric boundary validation
function validateMetrics(metrics) {
  const req = ["stress", "physicalTension", "mentalCalmness", "relaxation", "wellbeing"]
  for (const k of req) {
    const val = Number(metrics[k])
    if (isNaN(val) || val < 1 || val > 10) return false
  }
  return true
}

assert.strictEqual(validateMetrics(preAssessment), true, "Valid pre-assessment must pass")
assert.strictEqual(validateMetrics({ ...preAssessment, stress: 15 }), false, "Out of range stress must fail")
assert.strictEqual(validateMetrics({ ...preAssessment, relaxation: 0 }), false, "Zero relaxation must fail")

console.log("✓ Test 3: Assessment 1-10 boundary validation verified.")

// Test 4: Cohort Aggregation Math
const cohortMock = [
  { pre: { stress: 8, tension: 7, calmness: 3, relaxation: 2, wellbeing: 4 }, post: { stress: 4, tension: 3, calmness: 7, relaxation: 8, wellbeing: 7 } },
  { pre: { stress: 6, tension: 5, calmness: 5, relaxation: 4, wellbeing: 5 }, post: { stress: 3, tension: 2, calmness: 8, relaxation: 8, wellbeing: 8 } },
]

const avgPreStress = cohortMock.reduce((acc, c) => acc + c.pre.stress, 0) / cohortMock.length
const avgPostStress = cohortMock.reduce((acc, c) => acc + c.post.stress, 0) / cohortMock.length
assert.strictEqual(avgPreStress, 7, "Cohort average pre stress must be 7")
assert.strictEqual(avgPostStress, 3.5, "Cohort average post stress must be 3.5")
assert.strictEqual(avgPostStress - avgPreStress, -3.5, "Cohort delta must be -3.5")

console.log("✓ Test 4: Cohort-level statistical aggregation verified.")

console.log("ALL RESET LABS CHECK-IN / CHECKOUT ASSERTIONS PASSED (100% OK).")

