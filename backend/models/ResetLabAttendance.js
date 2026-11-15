const mongoose = require("mongoose")

const resetLabAttendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    resetLabSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResetLabSession",
      default: null,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      default: "Anonymous Participant",
      trim: true,
    },

    userEmail: {
      type: String,
      default: "",
      trim: true,
    },

    sessionType: {
      type: String,
      enum: ["acoustic-unwind", "express-unwind"],
      required: true,
    },

    sessionTitle: {
      type: String,
      required: true,
      trim: true,
    },

    checkInTime: {
      type: Date,
      default: Date.now,
      index: true,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["CHECKED_IN", "CHECKED_OUT"],
      default: "CHECKED_IN",
      index: true,
    },

    preAssessment: {
      stress: { type: Number, min: 1, max: 10, required: true },
      physicalTension: { type: Number, min: 1, max: 10, required: true },
      mentalCalmness: { type: Number, min: 1, max: 10, required: true },
      relaxation: { type: Number, min: 1, max: 10, required: true },
      wellbeing: { type: Number, min: 1, max: 10, required: true },
      emotionalState: { type: String, default: "Neutral", trim: true },
      emotionalRating: { type: Number, min: 1, max: 10, default: 5 },
      notes: { type: String, default: "", trim: true },
    },

    postAssessment: {
      stress: { type: Number, min: 1, max: 10, default: null },
      physicalTension: { type: Number, min: 1, max: 10, default: null },
      mentalCalmness: { type: Number, min: 1, max: 10, default: null },
      relaxation: { type: Number, min: 1, max: 10, default: null },
      wellbeing: { type: Number, min: 1, max: 10, default: null },
      emotionalState: { type: String, default: "", trim: true },
      emotionalRating: { type: Number, min: 1, max: 10, default: null },
      standoutMoment: { type: String, default: "", trim: true },
      notes: { type: String, default: "", trim: true },
    },

    report: {
      generatedAt: { type: Date, default: null },
      stressDelta: { type: Number, default: null },
      calmnessDelta: { type: Number, default: null },
      tensionDelta: { type: Number, default: null },
      relaxationDelta: { type: Number, default: null },
      wellbeingDelta: { type: Number, default: null },
      emotionalRatingDelta: { type: Number, default: null },
      overallShiftScore: { type: Number, default: null },
      summaryText: { type: String, default: "" },
      shifts: [
        {
          metric: { type: String, required: true },
          pre: { type: Number, required: true },
          post: { type: Number, required: true },
          delta: { type: Number, required: true },
          percentChange: { type: Number, default: 0 },
          status: { type: String, enum: ["Improved", "No Change", "Elevated", "Decreased"], required: true },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
)

// Ensure one check-in per user per session at the database level
resetLabAttendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true })

module.exports = mongoose.model("ResetLabAttendance", resetLabAttendanceSchema)

