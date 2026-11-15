const mongoose = require("mongoose")

const MBSIAssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    employeeId: {
      type: String,
      default: null,
      index: true,
    },

    organisationId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Organisation",
      required: false,
      default: null,
      index: true,
    },

    // Source MSI score used for psychological component (60%)
    msiScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    msiSource: {
      type: String,
      enum: ["latest_checkin", "baseline", "direct"],
      default: "latest_checkin",
    },

    msiAssessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
    },

    // Biological Biomarkers entered by user
    biomarkers: {
      cortisol: {
        raw: { type: Number, required: true },
        unit: { type: String, required: true },
        testDate: { type: Date, default: null },
        labName: { type: String, default: null },
        standardValue: { type: Number },
        standardUnit: { type: String, default: "ug/dL" },
        normalizedScore: { type: Number, required: true, min: 0, max: 100 },
      },
      dhea: {
        raw: { type: Number, required: true },
        unit: { type: String, required: true },
        testDate: { type: Date, default: null },
        labName: { type: String, default: null },
        standardValue: { type: Number },
        standardUnit: { type: String, default: "ug/dL" },
        normalizedScore: { type: Number, required: true, min: 0, max: 100 },
      },
      crp: {
        raw: { type: Number, required: true },
        unit: { type: String, required: true },
        testDate: { type: Date, default: null },
        labName: { type: String, default: null },
        standardValue: { type: Number },
        standardUnit: { type: String, default: "mg/L" },
        normalizedScore: { type: Number, required: true, min: 0, max: 100 },
      },
    },

    // Biological Stress Index: BSI = (0.40 * Cortisol) + (0.30 * DHEA) + (0.30 * CRP)
    bsiScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Composite: MBSI = (0.60 * MSI) + (0.40 * BSI)
    mbsiScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },

    breakdown: {
      psychological: {
        weight: { type: Number, default: 0.60 },
        score: { type: Number, required: true },
        contribution: { type: Number, required: true },
      },
      biological: {
        weight: { type: Number, default: 0.40 },
        score: { type: Number, required: true },
        contribution: { type: Number, required: true },
        biomarkers: {
          cortisol: {
            score: Number,
            weightInBsi: Number,
            contributionToBsi: Number,
          },
          dhea: {
            score: Number,
            weightInBsi: Number,
            contributionToBsi: Number,
          },
          crp: {
            score: Number,
            weightInBsi: Number,
            contributionToBsi: Number,
          },
        },
      },
    },

    formulaVersion: {
      type: String,
      default: "MBSI-v1.0-provisional",
    },

    normalizationVersion: {
      type: String,
      default: "NORM-v1.0-provisional",
    },

    isProvisional: {
      type: Boolean,
      default: true,
    },

    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("MBSIAssessment", MBSIAssessmentSchema)

