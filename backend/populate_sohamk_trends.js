const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Assessment = require("./models/Assessment");
const AssessmentLedger = require("./models/AssessmentLedger");
const { getCategory } = require("./services/msiClassification");

function calculateDailyCheckInMSI({ moodCheck, stressPulse, physicalCheck }) {
  const moodScore = (moodCheck.M1 ?? 0) + (moodCheck.M2 ?? 0);
  const psychometricScore =
    (stressPulse.SP1 ?? 0) +
    (stressPulse.SP2 ?? 0) +
    (stressPulse.SP3 ?? 0) +
    (stressPulse.SP4 ?? 0) +
    (stressPulse.SP5 ?? 0) +
    (stressPulse.SP6 ?? 0);
  const physicalScore = physicalCheck.PH1 ?? 0;

  const raw =
    (moodScore / 8) * 20 +
    (psychometricScore / 24) * 55 +
    (physicalScore / 4) * 25;

  const msi = Math.max(0, Math.min(100, Math.round(raw)));
  return {
    msi,
    scores: { moodScore, psychometricScore, physicalScore, msi },
  };
}

function generateResponsesForTarget(targetMsi) {
  let best = null;
  let minDiff = 999;

  for (let mood = 0; mood <= 8; mood++) {
    for (let psych = 0; psych <= 24; psych++) {
      for (let phys = 0; phys <= 4; phys++) {
        const raw = (mood / 8) * 20 + (psych / 24) * 55 + (phys / 4) * 25;
        const rounded = Math.round(raw);
        if (rounded === targetMsi) {
          const targetRatio = targetMsi / 100;
          const diff =
            Math.abs(mood / 8 - targetRatio) +
            Math.abs(psych / 24 - targetRatio) +
            Math.abs(phys / 4 - targetRatio);
          if (diff < minDiff) {
            minDiff = diff;
            best = { mood, psych, phys, raw };
          }
        }
      }
    }
  }

  if (!best) {
    throw new Error(`Could not find response combination for target ${targetMsi}`);
  }

  const M1 = Math.min(4, Math.ceil(best.mood / 2));
  const M2 = best.mood - M1;

  const sp = [0, 0, 0, 0, 0, 0];
  let remPsych = best.psych;
  for (let i = 0; i < 6; i++) {
    const take = Math.min(4, Math.floor(remPsych / (6 - i)));
    sp[i] = take;
    remPsych -= take;
  }
  sp[5] += remPsych;

  const PH1 = best.phys;

  let feeling = "A little tense";
  if (targetMsi >= 75) feeling = "Overwhelmed";
  else if (targetMsi >= 65) feeling = "Stressed";
  else if (targetMsi >= 50) feeling = "A little tense";
  else if (targetMsi >= 30) feeling = "Okay";
  else feeling = "Calm";

  let physical = "Drained";
  if (best.phys >= 3) physical = "Exhausted";
  else if (best.phys === 2) physical = "Tense / restless";
  else if (best.phys === 1) physical = "Tired but okay";
  else physical = "Energised";

  const stressor = targetMsi > 45 ? "Workload / Deadlines" : null;
  const driver = stressor;

  const result = calculateDailyCheckInMSI({
    moodCheck: { M1, M2 },
    stressPulse: { SP1: sp[0], SP2: sp[1], SP3: sp[2], SP4: sp[3], SP5: sp[4], SP6: sp[5] },
    physicalCheck: { PH1 },
  });

  return {
    targetMsi,
    calculatedMsi: result.msi,
    scores: result.scores,
    moodCheck: { M1, M2 },
    stressPulse: { SP1: sp[0], SP2: sp[1], SP3: sp[2], SP4: sp[3], SP5: sp[4], SP6: sp[5] },
    physicalCheck: { PH1 },
    feeling,
    physical,
    stressor,
    driver,
  };
}

// 24 historical records matching weekly progression:
// Week 1: ~68 (69, 67)
// Week 2: ~64 (65, 63)
// Week 3: ~61 (60, 62)
// Week 4: ~66 (67, 65)
// Week 5: ~59 (60, 58)
// Week 6: ~57 (56, 58)
// Week 7: ~62 (63, 61)
// Week 8: ~55 (56, 54)
// Week 9: ~53 (52, 54)
// Week 10: ~58 (59, 57)
// Week 11: ~51 (52, 50)
// Week 12: ~48 (48, 48 - latest is strictly 48!)
const schedule = [
  { daysAgo: 82, hour: 11, minute: 0, targetMsi: 69, week: 1 },
  { daysAgo: 78, hour: 9, minute: 15, targetMsi: 67, week: 1 },
  { daysAgo: 75, hour: 14, minute: 30, targetMsi: 65, week: 2 },
  { daysAgo: 71, hour: 10, minute: 45, targetMsi: 63, week: 2 },
  { daysAgo: 68, hour: 15, minute: 15, targetMsi: 60, week: 3 },
  { daysAgo: 64, hour: 11, minute: 5, targetMsi: 62, week: 3 },
  { daysAgo: 61, hour: 16, minute: 40, targetMsi: 67, week: 4 },
  { daysAgo: 57, hour: 9, minute: 20, targetMsi: 65, week: 4 },
  { daysAgo: 54, hour: 14, minute: 55, targetMsi: 60, week: 5 },
  { daysAgo: 50, hour: 10, minute: 30, targetMsi: 58, week: 5 },
  { daysAgo: 47, hour: 15, minute: 45, targetMsi: 56, week: 6 },
  { daysAgo: 43, hour: 11, minute: 10, targetMsi: 58, week: 6 },
  { daysAgo: 40, hour: 16, minute: 0, targetMsi: 63, week: 7 },
  { daysAgo: 36, hour: 10, minute: 25, targetMsi: 61, week: 7 },
  { daysAgo: 33, hour: 14, minute: 15, targetMsi: 56, week: 8 },
  { daysAgo: 29, hour: 9, minute: 50, targetMsi: 54, week: 8 },
  { daysAgo: 26, hour: 11, minute: 40, targetMsi: 52, week: 9 },
  { daysAgo: 22, hour: 15, minute: 30, targetMsi: 54, week: 9 },
  { daysAgo: 19, hour: 10, minute: 5, targetMsi: 59, week: 10 },
  { daysAgo: 15, hour: 16, minute: 10, targetMsi: 57, week: 10 },
  { daysAgo: 12, hour: 9, minute: 45, targetMsi: 52, week: 11 },
  { daysAgo: 8, hour: 14, minute: 20, targetMsi: 50, week: 11 },
  { daysAgo: 4, hour: 11, minute: 15, targetMsi: 48, week: 12 },
  { daysAgo: 0, hour: 10, minute: 30, targetMsi: 48, week: 12 },
];

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB:", mongoose.connection.name);

  // 1. Strictly isolate to user 'sohamk'
  const user = await User.findOne({ username: { $regex: /^sohamk$/i } });
  if (!user) {
    throw new Error("Target user 'sohamk' not found!");
  }
  console.log(`Target account: ${user.name} (@${user.username}), ID: ${user._id}`);

  // Base date is today: 2026-11-19
  const now = new Date("2026-11-19T11:45:00.000Z");

  // 2. Idempotency: Clean up previous synthetic assessments for this user ONLY
  const deletedAssessments = await Assessment.deleteMany({
    userId: user._id,
    type: "Daily Check-in (MSI)",
  });
  console.log(`Cleaned up ${deletedAssessments.deletedCount} existing check-in assessments for ${user.username}`);

  const deletedLedgers = await AssessmentLedger.deleteMany({
    userId: user._id,
    assessmentType: "weekly",
  });
  console.log(`Cleaned up ${deletedLedgers.deletedCount} existing weekly ledgers for ${user.username}`);

  // 3. Prepare baseline record (90 days ago: ~Aug 21, 2026)
  const baselineDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  baselineDate.setUTCHours(9, 30, 0, 0);

  const msiArray = [
    {
      score: 48,
      type: "baseline",
      recordedAt: baselineDate,
    },
  ];

  // 4. Generate and insert 24 check-ins
  const assessmentDocs = [];
  const ledgerDocs = [];

  for (let i = 0; i < schedule.length; i++) {
    const item = schedule[i];
    const recDate = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000);
    recDate.setUTCHours(item.hour, item.minute, 0, 0);

    const generated = generateResponsesForTarget(item.targetMsi);
    const category = getCategory(generated.calculatedMsi);

    assessmentDocs.push({
      userId: user._id,
      employeeId: user.employeeId || "EMP-SOHAMK",
      organisationId: user.organisationId || null,
      organisationCode: user.organisationCode || null,
      departmentId: user.departmentId || null,
      department: user.department || "Engineering",
      type: "Daily Check-in (MSI)",
      responses: {
        feeling: generated.feeling,
        stressor: generated.stressor,
        physical: generated.physical,
        driver: generated.driver,
        moodCheck: generated.moodCheck,
        stressPulse: generated.stressPulse,
        physicalCheck: generated.physicalCheck,
      },
      msi: generated.calculatedMsi,
      scores: generated.scores,
      category,
      driver: generated.driver,
      status: "Completed",
      completedAt: recDate,
      createdAt: recDate,
      updatedAt: recDate,
    });

    ledgerDocs.push({
      userId: user._id,
      name: user.name || "Soham K",
      age: user.age != null ? Number(user.age) : 26,
      gender: user.gender || "Male",
      profession: user.designation || user.occupation || "Developer",
      hoursOfSleep: user.sleepHours != null ? Number(user.sleepHours) : 7,
      medicalHistory: "None",
      M1: generated.moodCheck.M1,
      M2: generated.moodCheck.M2,
      M3: 0,
      M4: 0,
      S1: generated.stressPulse.SP1,
      S2: generated.stressPulse.SP2,
      S3: generated.stressPulse.SP3,
      S4: generated.stressPulse.SP4,
      R1: generated.stressPulse.SP5,
      R2: generated.stressPulse.SP6,
      R3: 0,
      R4: 0,
      P1: generated.physicalCheck.PH1,
      P2: 0,
      P3: 0,
      P4: 0,
      calculatedMSI: generated.calculatedMsi,
      assessmentType: "weekly",
      assessmentDate: recDate,
    });

    msiArray.push({
      score: generated.calculatedMsi,
      type: "weekly",
      recordedAt: recDate,
    });
  }

  // Insert assessments & ledgers
  const insertedAssessments = await Assessment.insertMany(assessmentDocs);
  console.log(`Inserted ${insertedAssessments.length} Assessment documents for ${user.username}`);

  const insertedLedgers = await AssessmentLedger.insertMany(ledgerDocs);
  console.log(`Inserted ${insertedLedgers.length} AssessmentLedger documents for ${user.username}`);

  // 5. Update user model
  user.baselineMsi = 48;
  user.baselineCompletedAt = baselineDate;
  user.lastBaselineMsiDate = baselineDate;
  user.msi = msiArray;
  await user.save();

  console.log(`\n=== POPULATION SUCCESSFUL ===`);
  console.log(`User: ${user.username}`);
  console.log(`Baseline MSI: ${user.baselineMsi}`);
  console.log(`user.msi length: ${user.msi.length} (1 baseline + 24 weekly check-ins)`);
  console.log(`First check-in: ${schedule[0].targetMsi} (${assessmentDocs[0].completedAt.toISOString()})`);
  console.log(`Latest check-in: ${schedule[schedule.length - 1].targetMsi} (${assessmentDocs[assessmentDocs.length - 1].completedAt.toISOString()})`);

  // Verify other users were NOT modified
  const otherUsersCount = await User.countDocuments({ _id: { $ne: user._id } });
  console.log(`Other users in DB (untouched): ${otherUsersCount}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Population error:", err);
  process.exit(1);
});
