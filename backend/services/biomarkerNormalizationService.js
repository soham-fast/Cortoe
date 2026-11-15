/**
 * CortiQuant Biomarker Normalization & MBSI Calculation Service
 *
 * Provisional Framework Version: MBSI-v1.0-provisional
 * Normalization Version: NORM-v1.0-provisional
 *
 * FORMULA SPECIFICATION:
 *   MBSI = (0.60 * MSI) + (0.40 * BSI)
 *   Where:
 *   BSI = (0.40 * Cortisol_Score) + (0.30 * DHEA_Score) + (0.30 * CRP_Score)
 *
 * All biomarker scores are normalized to a 0–100 continuous scale.
 * Calculations are strictly deterministic.
 *
 * NOTE: Assay-specific reference ranges vary by laboratory and methodology.
 * This module uses standard clinical pathology consensus thresholds and
 * marks all calculations as provisional pending multi-cohort scientific validation.
 */

const FORMULA_VERSION = "MBSI-v1.0-provisional"
const NORMALIZATION_VERSION = "NORM-v1.0-provisional"

// Standard clinical reference configurations
const BIOMARKER_CONFIG = {
  cortisol: {
    name: "Cortisol",
    supportedUnits: ["ug/dL", "µg/dL", "nmol/L"],
    defaultUnit: "ug/dL",
    // Standard morning serum reference: 6.0 - 23.0 ug/dL
    // Stress boundary mapping: 4.0 (low baseline) to 28.0 (severe elevation)
    range: {
      min: 4.0,
      max: 28.0,
      optimalMin: 8.0,
      optimalMax: 16.0,
    },
    // Convert any unit to standard ug/dL
    toStandardUnit: (val, unit) => {
      const u = unit.toLowerCase().replace("µ", "u")
      if (u === "ug/dl") return val
      if (u === "nmol/l") return val / 27.586 // 1 ug/dL = 27.586 nmol/L
      throw new Error(`Unsupported unit '${unit}' for Cortisol`)
    },
  },

  dhea: {
    name: "DHEA-S",
    supportedUnits: ["ug/dL", "µg/dL", "umol/L", "µmol/L"],
    defaultUnit: "ug/dL",
    // Standard adult serum reference: 80 - 560 ug/dL
    // Low DHEA indicates adrenal fatigue / chronic stress exhaustion.
    // Higher DHEA confers neuroendocrine resilience.
    // Stress scoring maps inverse: lower DHEA-S -> higher stress score.
    range: {
      min: 60.0,
      max: 500.0,
    },
    toStandardUnit: (val, unit) => {
      const u = unit.toLowerCase().replace("µ", "u")
      if (u === "ug/dl") return val
      if (u === "umol/l") return val * 36.85 // 1 umol/L ≈ 36.85 ug/dL
      throw new Error(`Unsupported unit '${unit}' for DHEA-S`)
    },
  },

  crp: {
    name: "CRP (hs-CRP)",
    supportedUnits: ["mg/L", "mg/dL"],
    defaultUnit: "mg/L",
    // CDC/AHA standards for hs-CRP:
    // < 1.0 mg/L: Low cardiovascular/inflammatory stress
    // 1.0 - 3.0 mg/L: Average stress/inflammation
    // > 3.0 - 10.0 mg/L: High systemic inflammation / chronic stress
    range: {
      min: 0.2,
      max: 10.0,
    },
    toStandardUnit: (val, unit) => {
      const u = unit.toLowerCase()
      if (u === "mg/l") return val
      if (u === "mg/dl") return val * 10 // 1 mg/dL = 10 mg/L
      throw new Error(`Unsupported unit '${unit}' for CRP`)
    },
  },
}

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val))
}

/**
 * Normalizes Cortisol to 0–100 stress score.
 * Higher serum cortisol above optimal indicates heightened HPA axis activation.
 */
function normalizeCortisol(rawValue, unit) {
  const stdValue = BIOMARKER_CONFIG.cortisol.toStandardUnit(rawValue, unit)
  const { min, max } = BIOMARKER_CONFIG.cortisol.range
  const normalized = ((stdValue - min) / (max - min)) * 100
  return {
    rawValue,
    unit,
    standardValue: Number(stdValue.toFixed(2)),
    standardUnit: "ug/dL",
    score: Number(clamp(normalized).toFixed(1)),
  }
}

/**
 * Normalizes DHEA-S to 0–100 stress score.
 * In stress research, DHEA-S buffers cortisol. Low DHEA-S indicates depleted resilience.
 * Inverse normalization: lower DHEA-S yields higher stress score.
 */
function normalizeDhea(rawValue, unit) {
  const stdValue = BIOMARKER_CONFIG.dhea.toStandardUnit(rawValue, unit)
  const { min, max } = BIOMARKER_CONFIG.dhea.range
  // Inverted: if value <= min, stress score = 100; if value >= max, stress score = 0
  const normalized = ((max - stdValue) / (max - min)) * 100
  return {
    rawValue,
    unit,
    standardValue: Number(stdValue.toFixed(2)),
    standardUnit: "ug/dL",
    score: Number(clamp(normalized).toFixed(1)),
  }
}

/**
 * Normalizes CRP (hs-CRP) to 0–100 stress score.
 * Higher CRP reflects elevated systemic inflammatory response.
 */
function normalizeCrp(rawValue, unit) {
  const stdValue = BIOMARKER_CONFIG.crp.toStandardUnit(rawValue, unit)
  const { min, max } = BIOMARKER_CONFIG.crp.range
  const normalized = ((stdValue - min) / (max - min)) * 100
  return {
    rawValue,
    unit,
    standardValue: Number(stdValue.toFixed(2)),
    standardUnit: "mg/L",
    score: Number(clamp(normalized).toFixed(1)),
  }
}

/**
 * Calculates BSI (Biological Stress Index) from normalized biomarker scores:
 * BSI = (0.40 * Cortisol_Score) + (0.30 * DHEA_Score) + (0.30 * CRP_Score)
 */
function calculateBSI(cortisolScore, dheaScore, crpScore) {
  const bsi = (0.40 * cortisolScore) + (0.30 * dheaScore) + (0.30 * crpScore)
  return Number(clamp(bsi).toFixed(1))
}

/**
 * Calculates MBSI (Mind-Body Stress Index) from MSI and BSI:
 * MBSI = (0.60 * MSI) + (0.40 * BSI)
 */
function calculateMBSI(msiScore, bsiScore) {
  if (typeof msiScore !== "number" || isNaN(msiScore)) {
    throw new Error("Valid numerical MSI score (0-100) is required for MBSI calculation.")
  }
  const clampedMsi = clamp(msiScore)
  const clampedBsi = clamp(bsiScore)
  const mbsi = (0.60 * clampedMsi) + (0.40 * clampedBsi)
  return Number(clamp(mbsi).toFixed(1))
}

/**
 * Validates and calculates complete MBSI composite.
 */
function processMBSICalculation({ msi, cortisol, dhea, crp }) {
  if (msi === null || msi === undefined || isNaN(Number(msi))) {
    throw new Error("A valid existing MSI score (0–100) is required.")
  }
  const cleanMsi = Number(msi)
  if (cleanMsi < 0 || cleanMsi > 100) {
    throw new Error("MSI score must be between 0 and 100.")
  }

  // Validate Cortisol
  if (!cortisol || cortisol.value === null || cortisol.value === undefined || isNaN(Number(cortisol.value))) {
    throw new Error("Cortisol numeric value is required.")
  }
  if (Number(cortisol.value) <= 0) {
    throw new Error("Cortisol value must be a positive number.")
  }
  if (!cortisol.unit) {
    throw new Error("Cortisol measurement unit is required.")
  }

  // Validate DHEA-S
  if (!dhea || dhea.value === null || dhea.value === undefined || isNaN(Number(dhea.value))) {
    throw new Error("DHEA-S numeric value is required.")
  }
  if (Number(dhea.value) <= 0) {
    throw new Error("DHEA-S value must be a positive number.")
  }
  if (!dhea.unit) {
    throw new Error("DHEA-S measurement unit is required.")
  }

  // Validate CRP
  if (!crp || crp.value === null || crp.value === undefined || isNaN(Number(crp.value))) {
    throw new Error("CRP numeric value is required.")
  }
  if (Number(crp.value) < 0) {
    throw new Error("CRP value cannot be negative.")
  }
  if (!crp.unit) {
    throw new Error("CRP measurement unit is required.")
  }

  // Normalize each biomarker
  const normCortisol = normalizeCortisol(Number(cortisol.value), cortisol.unit)
  const normDhea = normalizeDhea(Number(dhea.value), dhea.unit)
  const normCrp = normalizeCrp(Number(crp.value), crp.unit)

  // Calculate composite scores
  const bsiScore = calculateBSI(normCortisol.score, normDhea.score, normCrp.score)
  const mbsiScore = calculateMBSI(cleanMsi, bsiScore)

  return {
    formulaVersion: FORMULA_VERSION,
    normalizationVersion: NORMALIZATION_VERSION,
    isProvisional: true,
    msiScore: cleanMsi,
    bsiScore,
    mbsiScore,
    breakdown: {
      psychological: {
        weight: 0.60,
        score: cleanMsi,
        contribution: Number((0.60 * cleanMsi).toFixed(1)),
      },
      biological: {
        weight: 0.40,
        score: bsiScore,
        contribution: Number((0.40 * bsiScore).toFixed(1)),
        biomarkers: {
          cortisol: {
            name: "Cortisol",
            raw: normCortisol.rawValue,
            unit: normCortisol.unit,
            testDate: cortisol.testDate || null,
            labName: cortisol.labName || null,
            standardValue: normCortisol.standardValue,
            standardUnit: normCortisol.standardUnit,
            normalizedScore: normCortisol.score,
            weightInBsi: 0.40,
            contributionToBsi: Number((0.40 * normCortisol.score).toFixed(1)),
          },
          dhea: {
            name: "DHEA-S",
            raw: normDhea.rawValue,
            unit: normDhea.unit,
            testDate: dhea.testDate || null,
            labName: dhea.labName || null,
            standardValue: normDhea.standardValue,
            standardUnit: normDhea.standardUnit,
            normalizedScore: normDhea.score,
            weightInBsi: 0.30,
            contributionToBsi: Number((0.30 * normDhea.score).toFixed(1)),
          },
          crp: {
            name: "CRP",
            raw: normCrp.rawValue,
            unit: normCrp.unit,
            testDate: crp.testDate || null,
            labName: crp.labName || null,
            standardValue: normCrp.standardValue,
            standardUnit: normCrp.standardUnit,
            normalizedScore: normCrp.score,
            weightInBsi: 0.30,
            contributionToBsi: Number((0.30 * normCrp.score).toFixed(1)),
          },
        },
      },
    },
  }
}

module.exports = {
  FORMULA_VERSION,
  NORMALIZATION_VERSION,
  BIOMARKER_CONFIG,
  normalizeCortisol,
  normalizeDhea,
  normalizeCrp,
  calculateBSI,
  calculateMBSI,
  processMBSICalculation,
}

