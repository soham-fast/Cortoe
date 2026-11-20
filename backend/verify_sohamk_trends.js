const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const { getCategory } = require("./services/msiClassification");

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ username: { $regex: /^sohamk$/i } });

  console.log("=== VERIFYING TARGET USER ===");
  console.log("Username:", user.username);
  console.log("Baseline MSI:", user.baselineMsi);
  console.log("MSI Array Count:", user.msi.length);

  const ranges = ["7d", "30d", "3m", "1y"];
  const now = new Date("2026-11-19T11:45:00.000Z");

  for (const rangeQuery of ranges) {
    let daysBack = 30;
    const sinceDate = new Date(now);
    if (rangeQuery === "7d") {
      daysBack = 7;
      sinceDate.setDate(sinceDate.getDate() - 7);
    } else if (rangeQuery === "30d") {
      daysBack = 30;
      sinceDate.setDate(sinceDate.getDate() - 30);
    } else if (rangeQuery === "3m") {
      daysBack = 90;
      sinceDate.setMonth(sinceDate.getMonth() - 3);
    } else if (rangeQuery === "1y") {
      daysBack = 365;
      sinceDate.setFullYear(sinceDate.getFullYear() - 1);
    }
    sinceDate.setHours(0, 0, 0, 0);

    const msiArray = Array.isArray(user.msi) ? user.msi : [];
    const allMsiMapped = msiArray
      .filter((item) => item && typeof item.score === "number")
      .map((item, index) => {
        let recorded = item.recordedAt ? new Date(item.recordedAt) : new Date();
        return {
          id: item._id ? String(item._id) : `msi-${index}`,
          date: recorded.toISOString().split("T")[0],
          timestamp: item.recordedAt || recorded.toISOString(),
          msi: item.score,
          score: item.score,
          type: item.type || "weekly",
          category: getCategory(item.score),
        };
      });

    const filtered = allMsiMapped.filter((item) => {
      const t = new Date(item.timestamp).getTime();
      return !isNaN(t) && t >= sinceDate.getTime();
    });

    const weeklyMsiItems = allMsiMapped.filter((item) => item.type !== "baseline");
    let usualRange = "Not enough data";
    if (weeklyMsiItems.length >= 3) {
      const msiValues = weeklyMsiItems.map((a) => a.score).sort((a, b) => a - b);
      const q1Index = Math.floor(msiValues.length * 0.25);
      const q3Index = Math.floor(msiValues.length * 0.75);
      usualRange = `${msiValues[q1Index]}–${msiValues[q3Index]}`;
    }

    const sortedValidAll = allMsiMapped
      .filter((item) => item.score != null)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const latestItem = sortedValidAll.length > 0 ? sortedValidAll[sortedValidAll.length - 1] : null;
    const currentMsi = latestItem ? latestItem.score : user.baselineMsi;

    console.log(`\n--- Range: ${rangeQuery.toUpperCase()} ---`);
    console.log(`Count in period: ${filtered.length}`);
    console.log(`Filtered items:`, filtered.map((f) => `${f.date}: MSI=${f.score} (${f.type})`));
    console.log(`Current MSI: ${currentMsi}`);
    console.log(`Usual Range: ${usualRange}`);
  }

  await mongoose.disconnect();
}

verify().catch((err) => {
  console.error("Verify error:", err);
  process.exit(1);
});
