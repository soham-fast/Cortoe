const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ResetLabAttendance = require("./models/ResetLabAttendance");
  const ResetLabSession = require("./models/ResetLabSession");
  const User = require("./models/User");

  const user = await User.findOne({ username: { $regex: /^sohamk$/i } });
  console.log("Target user:", user.username, "ID:", user._id);

  const completedReports = await ResetLabAttendance.find({
    userId: user._id,
    status: "CHECKED_OUT",
  })
    .sort({ checkOutTime: -1 })
    .lean();

  console.log(`\n=== VERIFYING COMPLETED RESET LAB REPORTS (${completedReports.length} records) ===`);

  let sumPreStress = 0;
  let sumPostStress = 0;
  let sumPreRelax = 0;
  let sumPostRelax = 0;

  completedReports.forEach((r, idx) => {
    sumPreStress += r.preAssessment.stress;
    sumPostStress += r.postAssessment.stress;
    sumPreRelax += r.preAssessment.relaxation;
    sumPostRelax += r.postAssessment.relaxation;

    console.log(`\n[${idx + 1}] Session: ${r.sessionTitle} (${r.sessionId})`);
    console.log(`    Category: ${r.sessionCategory} | Duration: ${r.sessionDuration}`);
    console.log(`    Date: ${r.checkOutTime.toISOString().split("T")[0]}`);
    console.log(`    Stress: Pre=${r.preAssessment.stress} -> Post=${r.postAssessment.stress} (Δ ${r.report.stressDelta} pts)`);
    console.log(`    Relaxation: Pre=${r.preAssessment.relaxation} -> Post=${r.postAssessment.relaxation} (Δ +${r.report.relaxationDelta} pts)`);
    console.log(`    Mental Calmness: Pre=${r.preAssessment.mentalCalmness} -> Post=${r.postAssessment.mentalCalmness} (Δ +${r.report.calmnessDelta} pts)`);
    console.log(`    Overall Shift Score: +${r.report.overallShiftScore} pts`);
    console.log(`    Pre Emotional State: "${r.preAssessment.emotionalState}" (${r.preAssessment.emotionalRating}/10)`);
    console.log(`    Post Emotional State: "${r.postAssessment.emotionalState}" (${r.postAssessment.emotionalRating}/10)`);
    console.log(`    Standout Moment: "${r.postAssessment.standoutMoment}"`);
    console.log(`    Summary: "${r.report.summaryText.slice(0, 90)}..."`);
  });

  const N = completedReports.length;
  console.log(`\n=== SUMMARY CARDS METRICS ===`);
  console.log(`Total Completed Sessions: ${N}`);
  console.log(`Average Pre-Session Stress: ${(sumPreStress / N).toFixed(1)} / 10`);
  console.log(`Average Post-Session Stress: ${(sumPostStress / N).toFixed(1)} / 10`);
  console.log(`Average Relaxation Change: +${((sumPostRelax - sumPreRelax) / N).toFixed(1)} pts`);

  // Verify sessions exist in ResetLabSession
  const sessions = await ResetLabSession.find({ sessionId: { $in: completedReports.map(r => r.sessionId) } });
  console.log(`\nMatching ResetLabSession records in DB: ${sessions.length} / 5`);

  await mongoose.disconnect();
}

verify().catch(err => {
  console.error("Verify error:", err);
  process.exit(1);
});
