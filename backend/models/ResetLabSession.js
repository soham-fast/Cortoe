const mongoose = require("mongoose")

const resetLabSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    sessionType: {
      type: String,
      enum: ["acoustic-unwind", "express-unwind", "guided-breathing", "creative-reflection", "sound-stillness"],
      required: true,
      index: true,
    },

    category: {
      type: String,
      default: "Experiential Wellbeing",
      trim: true,
    },

    duration: {
      type: String,
      default: "45 min",
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

    time: {
      type: String,
      required: true,
      trim: true,
    },

    venue: {
      type: String,
      required: true,
      trim: true,
      default: "Cortoe Wellbeing Studio, Suite 400",
    },

    facilitator: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      default: 8,
      min: 1,
      max: 100,
    },

    status: {
      type: String,
      enum: ["Scheduled", "Active", "Completed", "Cancelled"],
      default: "Scheduled",
      index: true,
    },

    organisationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isDemoSynthetic: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("ResetLabSession", resetLabSessionSchema)

