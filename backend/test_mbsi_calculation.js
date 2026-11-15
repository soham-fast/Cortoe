const {
  FORMULA_VERSION,
  NORMALIZATION_VERSION,
  normalizeCortisol,
  normalizeDhea,
  normalizeCrp,
  calculateBSI,
  calculateMBSI,
  processMBSICalculation,
} = require("./services/biomarkerNormalizationService")

console.log("=== TESTING MBSI CALCULATION SERVICE ===")
console.log(`Formula Version: ${FORMULA_VERSION}`)
console.log(`Normalization Version: ${NORMALIZATION_VERSION}\n`)

let passed = 0
let failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`PASS: ${testName}`)
    passed++
  } else {
    console.error(`FAIL: ${testName}`)
    failed++
  }
}

// Test 1: Cortisol Normalization
// Range: 4.0 - 28.0 ug/dL. Test value 16.0 ug/dL -> (16 - 4) / 24 * 100 = 50.0
const c1 = normalizeCortisol(16.0, "ug/dL")
assert(c1.score === 50, `Cortisol 16 ug/dL should normalize to 50 (got ${c1.score})`)

// Test 1b: Cortisol unit conversion (nmol/L -> ug/dL)
// 16 ug/dL * 27.586 = 441.376 nmol/L
const c2 = normalizeCortisol(441.376, "nmol/L")
assert(Math.abs(c2.score - 50) < 0.2, `Cortisol 441.38 nmol/L should normalize to ~50 (got ${c2.score})`)

// Test 2: DHEA-S Normalization (Inverted stress scale)
// Range: 60 - 500 ug/dL. Test value 280 ug/dL -> (500 - 280) / 440 * 100 = 50.0
const d1 = normalizeDhea(280.0, "ug/dL")
assert(d1.score === 50, `DHEA-S 280 ug/dL should normalize to 50 (got ${d1.score})`)

// Test 3: CRP Normalization
// Range: 0.2 - 10.0 mg/L. Test value 5.1 mg/L -> (5.1 - 0.2) / 9.8 * 100 = 50.0
const crp1 = normalizeCrp(5.1, "mg/L")
assert(crp1.score === 50, `CRP 5.1 mg/L should normalize to 50 (got ${crp1.score})`)

// Test 4: BSI Calculation
// BSI = 0.40 * 50 + 0.30 * 50 + 0.30 * 50 = 50.0
const bsi1 = calculateBSI(50, 50, 50)
assert(bsi1 === 50, `BSI of components (50, 50, 50) should be 50 (got ${bsi1})`)

// Test 5: MBSI Calculation
// MBSI = 0.60 * MSI(50) + 0.40 * BSI(50) = 50.0
const mbsi1 = calculateMBSI(50, 50)
assert(mbsi1 === 50, `MBSI of MSI 50 and BSI 50 should be 50 (got ${mbsi1})`)

// Test 6: Full Composite Calculation
// MSI: 60, Cortisol: 10 ug/dL (25%), DHEA: 390 ug/dL (25%), CRP: 2.65 mg/L (25%) -> BSI = 25
// MBSI = 0.60 * 60 + 0.40 * 25 = 36 + 10 = 46.0
const full = processMBSICalculation({
  msi: 60,
  cortisol: { value: 10, unit: "ug/dL" },
  dhea: { value: 390, unit: "ug/dL" },
  crp: { value: 2.65, unit: "mg/L" },
})
assert(full.bsiScore === 25, `Expected BSI = 25 (got ${full.bsiScore})`)
assert(full.mbsiScore === 46, `Expected MBSI = 46 (got ${full.mbsiScore})`)
assert(full.breakdown.psychological.contribution === 36, `Expected Psych contribution = 36`)
assert(full.breakdown.biological.contribution === 10, `Expected Bio contribution = 10`)

// Test 7: Error handling for missing/invalid inputs
let caughtErr = false
try {
  processMBSICalculation({
    msi: 60,
    cortisol: { value: null, unit: "ug/dL" },
    dhea: { value: 300, unit: "ug/dL" },
    crp: { value: 1.5, unit: "mg/L" },
  })
} catch (e) {
  caughtErr = true
}
assert(caughtErr, "Should reject null cortisol value")

let caughtNeg = false
try {
  processMBSICalculation({
    msi: 60,
    cortisol: { value: -5, unit: "ug/dL" },
    dhea: { value: 300, unit: "ug/dL" },
    crp: { value: 1.5, unit: "mg/L" },
  })
} catch (e) {
  caughtNeg = true
}
assert(caughtNeg, "Should reject negative cortisol value")

console.log(`\nResults: ${passed} passed, ${failed} failed.`)
if (failed > 0) process.exit(1)

