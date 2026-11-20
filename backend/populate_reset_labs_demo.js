const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const ResetLabSession = require("./models/ResetLabSession");
const ResetLabAttendance = require("./models/ResetLabAttendance");
const User = require("./models/User");

// Exact calculation helper mirroring backend/routes/resetLabs.js
function calculateSessionReport(pre, post, sessionTitle) {
  const shifts = [];

  // 1. Perceived Stress (Lower is improvement)
  const stressDelta = post.stress - pre.stress;
  const stressPct = pre.stress > 0 ? Math.round(((pre.stress - post.stress) / pre.stress) * 100) : 0;
  shifts.push({
    metric: "Perceived Stress",
    pre: pre.stress,
    post: post.stress,
    delta: stressDelta,
    percentChange: stressPct,
    status: stressDelta < 0 ? "Improved" : stressDelta === 0 ? "No Change" : "Elevated",
  });

  // 2. Physical Tension (Lower is improvement)
  const tensionDelta = post.physicalTension - pre.physicalTension;
  const tensionPct =
    pre.physicalTension > 0
      ? Math.round(((pre.physicalTension - post.physicalTension) / pre.physicalTension) * 100)
      : 0;
  shifts.push({
    metric: "Physical Tension",
    pre: pre.physicalTension,
    post: post.physicalTension,
    delta: tensionDelta,
    percentChange: tensionPct,
    status: tensionDelta < 0 ? "Improved" : tensionDelta === 0 ? "No Change" : "Elevated",
  });

  // 3. Mental Calmness (Higher is improvement)
  const calmnessDelta = post.mentalCalmness - pre.mentalCalmness;
  const calmnessPct =
    pre.mentalCalmness > 0
      ? Math.round(((post.mentalCalmness - pre.mentalCalmness) / pre.mentalCalmness) * 100)
      : 0;
  shifts.push({
    metric: "Mental Calmness",
    pre: pre.mentalCalmness,
    post: post.mentalCalmness,
    delta: calmnessDelta,
    percentChange: calmnessPct,
    status: calmnessDelta > 0 ? "Improved" : calmnessDelta === 0 ? "No Change" : "Decreased",
  });

  // 4. Feeling of Relaxation (Higher is improvement)
  const relaxationDelta = post.relaxation - pre.relaxation;
  const relaxationPct =
    pre.relaxation > 0
      ? Math.round(((post.relaxation - pre.relaxation) / pre.relaxation) * 100)
      : 0;
  shifts.push({
    metric: "Feeling of Relaxation",
    pre: pre.relaxation,
    post: post.relaxation,
    delta: relaxationDelta,
    percentChange: relaxationPct,
    status: relaxationDelta > 0 ? "Improved" : relaxationDelta === 0 ? "No Change" : "Decreased",
  });

  // 5. Overall Sense of Wellbeing (Higher is improvement)
  const wellbeingDelta = post.wellbeing - pre.wellbeing;
  const wellbeingPct =
    pre.wellbeing > 0
      ? Math.round(((post.wellbeing - pre.wellbeing) / pre.wellbeing) * 100)
      : 0;
  shifts.push({
    metric: "Overall Wellbeing",
    pre: pre.wellbeing,
    post: post.wellbeing,
    delta: wellbeingDelta,
    percentChange: wellbeingPct,
    status: wellbeingDelta > 0 ? "Improved" : wellbeingDelta === 0 ? "No Change" : "Decreased",
  });

  // Emotional Rating Delta
  const emotionalRatingDelta = (post.emotionalRating || 5) - (pre.emotionalRating || 5);

  // Composite Shift Score (Average positive shift on scale of -10 to +10)
  const netShiftPoints = -stressDelta + -tensionDelta + calmnessDelta + relaxationDelta + wellbeingDelta;
  const overallShiftScore = Math.round((netShiftPoints / 5) * 10) / 10;

  // Closing summary
  let summaryText = "";
  const improvements = [];
  if (stressDelta < 0) improvements.push(`a ${Math.abs(stressPct)}% reduction in perceived stress`);
  if (tensionDelta < 0) improvements.push(`a ${Math.abs(tensionPct)}% ease in physical tension`);
  if (relaxationDelta > 0) improvements.push("deepened physical relaxation");
  if (calmnessDelta > 0) improvements.push("enhanced mental calmness");
  if (wellbeingDelta > 0) improvements.push("an elevated sense of overall wellbeing");

  if (improvements.length >= 2) {
    summaryText = `Following the ${sessionTitle} session, you self-reported ${improvements.slice(0, 2).join(" and ")}${improvements.length > 2 ? `, alongside ${improvements.slice(2).join(", ")}` : ""}. Your ending emotional state shifted to "${post.emotionalState || "Grounded"}", reflecting a meaningful moment of pause and restorative focus.`;
  } else if (improvements.length === 1) {
    summaryText = `Following the ${sessionTitle} session, your self-reported responses highlighted ${improvements[0]}, while maintaining stability across other wellbeing indicators. Your post-session state was noted as "${post.emotionalState || "Centered"}".`;
  } else {
    summaryText = `You completed the ${sessionTitle} session with self-reported markers remaining relatively steady across pre- and post-measurements. Continued participation in mindful reset practices can support deeper relaxation over time.`;
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
  };
}

const DEMO_SESSIONS = [
  {
    sessionId: "AU-2026-001",
    sessionType: "acoustic-unwind",
    title: "Acoustic Unwind",
    category: "Music & Mindfulness",
    date: "2026-09-18",
    time: "16:00 - 16:45",
    duration: "45 min",
    venue: "Cortoe Wellbeing Studio, Suite 400 · Acoustic Chamber",
    facilitator: "Elena Vance, M.Mus.",
    checkInIso: "2026-09-18T10:25:00.000Z",
    checkOutIso: "2026-09-18T11:15:00.000Z",
    preAssessment: {
      stress: 8,
      physicalTension: 7,
      mentalCalmness: 3,
      relaxation: 3,
      wellbeing: 4,
      emotionalState: "Cognitive Overload / Wired",
      emotionalRating: 4,
      notes: "Felt mentally wired after a long sprint of back-to-back technical reviews. Upper back and shoulders feel tight.",
    },
    postAssessment: {
      stress: 5,
      physicalTension: 4,
      mentalCalmness: 7,
      relaxation: 7,
      wellbeing: 7,
      emotionalState: "Calm & Grounded",
      emotionalRating: 7,
      standoutMoment: "The live fingerpicked acoustic guitar passages during the breath-synchronization phase; felt heart rate noticeably slow down.",
      notes: "Noticeably calmer breath and less muscle tension. Able to disconnect from screen-based thinking.",
    },
  },
  {
    sessionId: "EU-2026-001",
    sessionType: "express-unwind",
    title: "Express & Unwind",
    category: "Art-Based Expression",
    date: "2026-10-02",
    time: "14:00 - 15:00",
    duration: "60 min",
    venue: "Cortoe Creative Studio, Room 204",
    facilitator: "Marcus Thorne, ATR-BC",
    checkInIso: "2026-10-02T08:28:00.000Z",
    checkOutIso: "2026-10-02T09:32:00.000Z",
    preAssessment: {
      stress: 7,
      physicalTension: 6,
      mentalCalmness: 4,
      relaxation: 4,
      wellbeing: 5,
      emotionalState: "Restless / Overthinking",
      emotionalRating: 5,
      notes: "Arrived with heavy mental chatter and task switching fatigue. Felt difficult to settle into creative mindset.",
    },
    postAssessment: {
      stress: 4,
      physicalTension: 3,
      mentalCalmness: 7,
      relaxation: 8,
      wellbeing: 7,
      emotionalState: "Expressive & Unburdened",
      emotionalRating: 7,
      standoutMoment: "Intuitive palette blending on canvas with warm ochre and terracotta pigments without judging the outcome.",
      notes: "Tactile paint application was surprisingly grounding. Released non-verbal tension that words had not captured.",
    },
  },
  {
    sessionId: "GB-2026-001",
    sessionType: "guided-breathing",
    title: "Guided Breathing & Downregulation",
    category: "Breathing & Relaxation",
    date: "2026-10-16",
    time: "15:30 - 16:15",
    duration: "45 min",
    venue: "Cortoe Sanctuary, Room 102",
    facilitator: "Dr. Sarah Chen, Ph.D.",
    checkInIso: "2026-10-16T09:55:00.000Z",
    checkOutIso: "2026-10-16T10:45:00.000Z",
    preAssessment: {
      stress: 8,
      physicalTension: 8,
      mentalCalmness: 3,
      relaxation: 3,
      wellbeing: 4,
      emotionalState: "High Tension / Shallow Breath",
      emotionalRating: 4,
      notes: "Short shallow breathing throughout morning meetings. Feeling elevated sympathetic drive and neck tightness.",
    },
    postAssessment: {
      stress: 4,
      physicalTension: 3,
      mentalCalmness: 8,
      relaxation: 8,
      wellbeing: 8,
      emotionalState: "Deeply Regulated & Present",
      emotionalRating: 8,
      standoutMoment: "The 4-7-8 extended exhale cycle with physiological sigh; felt sudden shoulder drop and clear head.",
      notes: "Vagus nerve stimulation techniques produced tangible somatic calm. Diaphragm felt much freer.",
    },
  },
  {
    sessionId: "CR-2026-001",
    sessionType: "creative-reflection",
    title: "Creative Reflection Studio",
    category: "Guided Creative Expression",
    date: "2026-10-30",
    time: "14:30 - 15:30",
    duration: "60 min",
    venue: "Cortoe Creative Studio, Room 204",
    facilitator: "Aria Montgomery, MA",
    checkInIso: "2026-10-30T08:58:00.000Z",
    checkOutIso: "2026-10-30T10:02:00.000Z",
    preAssessment: {
      stress: 7,
      physicalTension: 7,
      mentalCalmness: 4,
      relaxation: 4,
      wellbeing: 4,
      emotionalState: "Scattered & Frustrated",
      emotionalRating: 4,
      notes: "Feeling overwhelmed by conflicting priorities. Needed an intentional pause to sort through mental clutter.",
    },
    postAssessment: {
      stress: 4,
      physicalTension: 3,
      mentalCalmness: 8,
      relaxation: 8,
      wellbeing: 8,
      emotionalState: "Clarified & Re-centered",
      emotionalRating: 8,
      standoutMoment: "Prompted micro-journaling followed by charcoal texture sketching; identified the real stress root cause.",
      notes: "Structured creative expression cleared the cognitive fog. Feel renewed clarity about end-of-week boundaries.",
    },
  },
  {
    sessionId: "SS-2026-001",
    sessionType: "sound-stillness",
    title: "Sound and Stillness Meditation",
    category: "Music & Mindful Reflection",
    date: "2026-11-13",
    time: "16:15 - 17:00",
    duration: "45 min",
    venue: "Cortoe Acoustic Chamber, Room 402",
    facilitator: "Elena Vance, M.Mus.",
    checkInIso: "2026-11-13T10:40:00.000Z",
    checkOutIso: "2026-11-13T11:30:00.000Z",
    preAssessment: {
      stress: 8,
      physicalTension: 7,
      mentalCalmness: 3,
      relaxation: 3,
      wellbeing: 4,
      emotionalState: "Wired & Exhausted",
      emotionalRating: 4,
      notes: "End-of-week fatigue combined with late afternoon pressure. Needed pure auditory rest without talking.",
    },
    postAssessment: {
      stress: 3,
      physicalTension: 3,
      mentalCalmness: 8,
      relaxation: 9,
      wellbeing: 8,
      emotionalState: "Deep Stillness & Recharged",
      emotionalRating: 8,
      standoutMoment: "Low-frequency singing bowl overtone fading into natural nylon-string guitar resonance during prolonged silence.",
      notes: "Deepest level of nervous system reset so far. Zero cognitive strain during the entire 45 minutes.",
    },
  },
];

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB:", mongoose.connection.name);

  // 1. Identify Target Account
  const user = await User.findOne({ username: { $regex: /^sohamk$/i } });
  if (!user) {
    throw new Error("Target user 'sohamk' not found!");
  }
  console.log(`Target account: ${user.name} (@${user.username}), ID: ${user._id}`);

  // 2. Clean up any previous synthetic Reset Labs attendance records for this user ONLY
  const deletedAttendance = await ResetLabAttendance.deleteMany({
    userId: user._id,
  });
  console.log(`Cleaned up ${deletedAttendance.deletedCount} existing attendance records for ${user.username}`);

  // Clean up any existing demo sessions with these IDs to ensure idempotency
  const sessionIds = DEMO_SESSIONS.map((s) => s.sessionId);
  await ResetLabSession.deleteMany({
    sessionId: { $in: sessionIds },
  });
  console.log(`Cleaned up previous sessions for IDs: ${sessionIds.join(", ")}`);

  // 3. Upsert ResetLabSession records
  const sessionDocs = [];
  const attendanceDocs = [];

  for (const s of DEMO_SESSIONS) {
    const sessionDoc = new ResetLabSession({
      sessionId: s.sessionId,
      sessionType: s.sessionType,
      title: s.title,
      category: s.category,
      date: s.date,
      time: s.time,
      duration: s.duration,
      venue: s.venue,
      facilitator: s.facilitator,
      capacity: 8,
      status: "Completed",
      organisationId: user.organisationId || null,
      createdBy: user._id,
      notes: "DEMO DATA · SYNTHETIC SESSION RECORDS",
      isDemoSynthetic: true,
    });
    sessionDocs.push(sessionDoc);

    const report = calculateSessionReport(s.preAssessment, s.postAssessment, s.title);
    report.generatedAt = new Date(s.checkOutIso);

    const attendanceDoc = new ResetLabAttendance({
      sessionId: s.sessionId,
      resetLabSessionId: sessionDoc._id,
      userId: user._id,
      userName: user.name || "Soham K",
      userEmail: user.email || "kadamsoham1006@gmail.com",
      sessionType: s.sessionType,
      sessionTitle: s.title,
      sessionCategory: s.category,
      sessionDuration: s.duration,
      checkInTime: new Date(s.checkInIso),
      checkOutTime: new Date(s.checkOutIso),
      status: "CHECKED_OUT",
      preAssessment: s.preAssessment,
      postAssessment: s.postAssessment,
      report,
      isDemoSynthetic: true,
    });
    attendanceDocs.push(attendanceDoc);
  }

  await ResetLabSession.insertMany(sessionDocs);
  console.log(`Inserted ${sessionDocs.length} ResetLabSession records.`);

  await ResetLabAttendance.insertMany(attendanceDocs);
  console.log(`Inserted ${attendanceDocs.length} ResetLabAttendance records for ${user.username}.`);

  console.log("\n=== RESET LABS POPULATION COMPLETED ===");
  const allReports = await ResetLabAttendance.find({ userId: user._id }).sort({ checkOutTime: -1 });
  console.log(`Verified total reports in DB for ${user.username}: ${allReports.length}`);
  allReports.forEach((r, idx) => {
    console.log(
      `[${idx + 1}] ${r.sessionId} - ${r.sessionTitle} (${r.sessionCategory}) | Stress: ${r.preAssessment.stress} -> ${r.postAssessment.stress} | Relaxation: ${r.preAssessment.relaxation} -> ${r.postAssessment.relaxation} | Shift: +${r.report.overallShiftScore} pts`
    );
  });

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Population error:", err);
  process.exit(1);
});
