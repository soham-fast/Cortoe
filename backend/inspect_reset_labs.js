const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ResetLabSession = require("./models/ResetLabSession");
  const ResetLabAttendance = require("./models/ResetLabAttendance");
  const User = require("./models/User");

  const user = await User.findOne({ username: { $regex: /^sohamk$/i } });
  console.log("Target user:", user.username, "ID:", user._id);

  const sessions = await ResetLabSession.find({});
  console.log("Existing sessions in DB:", sessions.map(s => ({ id: s.sessionId, title: s.title, type: s.sessionType, status: s.status })));

  const attendances = await ResetLabAttendance.find({ userId: user._id });
  console.log(`Existing attendance records for ${user.username}:`, attendances.length);
  attendances.forEach(a => {
    console.log(`- Session ${a.sessionId}: status=${a.status}, title=${a.sessionTitle}, reportDelta=${a.report?.overallShiftScore}`);
  });

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error("Inspect error:", err);
  process.exit(1);
});
