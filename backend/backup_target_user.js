const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function backup() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require("./models/User");
  const Assessment = require("./models/Assessment");
  const AssessmentLedger = require("./models/AssessmentLedger");

  const user = await User.findOne({ username: { $regex: /^sohamk$/i } });
  if (!user) {
    console.error("User sohamk not found!");
    process.exit(1);
  }

  const assessments = await Assessment.find({ userId: user._id });
  const ledgers = await AssessmentLedger.find({ userId: user._id });

  const backupData = {
    timestamp: new Date().toISOString(),
    user: user.toObject(),
    assessments: assessments.map(a => a.toObject()),
    ledgers: ledgers.map(l => l.toObject()),
  };

  const backupPath = path.join(__dirname, "../scratch/backup_sohamk.json");
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf-8");
  console.log("Successfully backed up target user records to:", backupPath);

  await mongoose.disconnect();
}

backup().catch(console.error);
