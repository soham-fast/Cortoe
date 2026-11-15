const assert = require("assert")

console.log("=== TESTING MBSI TRENDS & HISTORICAL ANALYSIS LOGIC ===")

// Test 1: Trend calculation logic
function computeTrend(current, previous) {
  if (current === null || previous === null || current === undefined || previous === undefined) {
    return { delta: null, percentChange: null, trend: "Stable" }
  }
  const delta = Math.round((current - previous) * 10) / 10
  const percentChange = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
  let trend = "Stable"
  if (delta > 1) trend = "Increasing"
  else if (delta < -1) trend = "Decreasing"
  return { delta, percentChange, trend }
}

const t1 = computeTrend(42.0, 48.5)
assert.strictEqual(t1.delta, -6.5, "Delta should be -6.5")
assert.strictEqual(t1.trend, "Decreasing", "Trend should be Decreasing")
assert.strictEqual(t1.percentChange, -13, "Percent change should be -13%")
console.log("PASS: Decreasing trend verified")

const t2 = computeTrend(56.0, 50.0)
assert.strictEqual(t2.delta, 6.0, "Delta should be 6.0")
assert.strictEqual(t2.trend, "Increasing", "Trend should be Increasing")
assert.strictEqual(t2.percentChange, 12, "Percent change should be +12%")
console.log("PASS: Increasing trend verified")

const t3 = computeTrend(45.2, 45.6)
assert.strictEqual(t3.delta, -0.4, "Delta should be -0.4")
assert.strictEqual(t3.trend, "Stable", "Small delta should be Stable")
console.log("PASS: Stable trend verified")

// Test 2: Timeframe filter range
function filterByTimeframe(records, timeframe, nowMs = Date.now()) {
  if (timeframe === "all") return records
  let ms = 0
  if (timeframe === "7d") ms = 7 * 86400 * 1000
  else if (timeframe === "30d") ms = 30 * 86400 * 1000
  else if (timeframe === "3m") ms = 90 * 86400 * 1000
  else if (timeframe === "1y") ms = 365 * 86400 * 1000
  return records.filter((r) => new Date(r.calculatedAt).getTime() >= nowMs - ms)
}

const baseTime = 1763200000000 // reference point
const sampleRecords = [
  { calculatedAt: new Date(baseTime - 2 * 86400 * 1000).toISOString(), mbsiScore: 45 }, // 2 days ago
  { calculatedAt: new Date(baseTime - 15 * 86400 * 1000).toISOString(), mbsiScore: 50 }, // 15 days ago
  { calculatedAt: new Date(baseTime - 45 * 86400 * 1000).toISOString(), mbsiScore: 55 }, // 45 days ago
  { calculatedAt: new Date(baseTime - 120 * 86400 * 1000).toISOString(), mbsiScore: 60 }, // 120 days ago
  { calculatedAt: new Date(baseTime - 400 * 86400 * 1000).toISOString(), mbsiScore: 65 }, // 400 days ago
]

assert.strictEqual(filterByTimeframe(sampleRecords, "7d", baseTime).length, 1, "7d filter should have 1 record")
assert.strictEqual(filterByTimeframe(sampleRecords, "30d", baseTime).length, 2, "30d filter should have 2 records")
assert.strictEqual(filterByTimeframe(sampleRecords, "3m", baseTime).length, 3, "3m filter should have 3 records")
assert.strictEqual(filterByTimeframe(sampleRecords, "1y", baseTime).length, 4, "1y filter should have 4 records")
assert.strictEqual(filterByTimeframe(sampleRecords, "all", baseTime).length, 5, "all filter should have 5 records")
console.log("PASS: Timeframe filter range verified")

console.log("\nALL MBSI TREND TESTS PASSED (100% OK).")

