const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function checkUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require("./models/User");
  const count = await User.countDocuments();
  const users = await User.find({}, "name username email role status");
  console.log(`Total users in DB (${mongoose.connection.name}): ${count}`);
  console.log(users);
  await mongoose.disconnect();
}

checkUsers().catch(console.error);
