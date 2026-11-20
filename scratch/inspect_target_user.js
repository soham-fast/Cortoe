const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

async function inspect() {
  console.log("Connecting to:", process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ":****@") : "NO URI");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB:", mongoose.connection.name);

  const User = require("../backend/models/User");
  const Assessment = require("../backend/models/Assessment");
  const AssessmentLedger = require("../backend/models/AssessmentLedger");

  // Search for username Sohamk
  const user = await User.findOne({ username: { $regex: /^sohamk$/i } });
  if (!user) {
    console.log("User Sohamk not found! Searching for similar usernames...");
    const allUsers = await User.find({}, "name username email role status msi baselineMsi");
    console.log("All users in DB:", allUsers.map(u => ({ id: u._id, username: u.username, name: u.name, email: u.email, role: u.role, status: u.status, baselineMsi: u.baselineMsi, msiCount: u.msi?.length })));
    await mongoose.disconnect();
    return;
  }

  console.log("\n=== TARGET USER FOUND ===");
  console.log("ID:", user._id);
  console.log("Name:", user.name);
  console.log("Username:", user.username);
  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("Status:", user.status);
  console.log("Baseline MSI:", user.baselineMsi);
  console.log("user.msi array length:", user.msi ? user.msi.length : 0);
  console.log("user.msi array items:", JSON.stringify(user.msi, null, 2));

  const assessments = await Assessment.find({ userId: user._id }).sort({ completedAt: 1 });
  console.log(`\nAssessments in Assessment collection: ${assessments.length}`);
  assessments.forEach((a, i) => {
    console.log(`[${i+1}] type=${a.type}, msi=${a.msi}, category=${a.category}, completedAt=${a.completedAt}`);
  });

  const ledgers = await AssessmentLedger.find({ userId: user._id }).sort({ assessmentDate: 1 });
  console.log(`\nLedgers in AssessmentLedger collection: ${ledgers.length}`);
  ledgers.forEach((l, i) => {
    console.log(`[${i+1}] type=${l.assessmentType}, calculatedMSI=${l.calculatedMSI}, date=${l.assessmentDate}`);
  });

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error("Inspect error:", err);
  process.exit(1);
});
