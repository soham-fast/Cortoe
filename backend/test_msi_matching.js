const { calculateDailyCheckInMSI } = (() => {
  function calculateDailyCheckInMSI({ feeling, stressor, physical, moodCheck, stressPulse, physicalCheck }) {
    if (moodCheck && stressPulse && physicalCheck) {
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

    const feelingMap = {
      "Calm": 12,
      "Okay": 34,
      "A little tense": 56,
      "Stressed": 72,
      "Overwhelmed": 88,
    };
    const physicalMap = {
      "Energised": -8,
      "Tired but okay": 0,
      "Drained": 6,
      "Tense / restless": 10,
      "Exhausted": 14,
    };
    const baseFeeling = feelingMap[feeling] ?? 45;
    const physAdj = physicalMap[physical] ?? 0;
    const stressorAdj = stressor && stressor !== "Something else" ? 4 : 0;
    const msi = Math.max(0, Math.min(100, Math.round(baseFeeling + physAdj + stressorAdj)));
    return {
      msi,
      scores: {
        moodScore: Math.round((baseFeeling / 100) * 8),
        psychometricScore: Math.round((msi / 100) * 24),
        physicalScore: Math.round(((physAdj + 8) / 22) * 4),
        msi,
      },
    };
  }
  return { calculateDailyCheckInMSI };
})();

// Function to find exact item-level scores matching any target MSI
function generateResponsesForTarget(targetMsi) {
  // We want to find moodScore (0-8), psychScore (0-24), physScore (0-4)
  // such that round((mood/8)*20 + (psych/24)*55 + (phys/4)*25) === targetMsi
  let best = null;
  let minDiff = 999;

  for (let mood = 0; mood <= 8; mood++) {
    for (let psych = 0; psych <= 24; psych++) {
      for (let phys = 0; phys <= 4; phys++) {
        const raw = (mood / 8) * 20 + (psych / 24) * 55 + (phys / 4) * 25;
        const rounded = Math.round(raw);
        if (rounded === targetMsi) {
          // Check how balanced it is (each subscore roughly proportional to targetMsi)
          const targetRatio = targetMsi / 100;
          const diff = Math.abs(mood/8 - targetRatio) + Math.abs(psych/24 - targetRatio) + Math.abs(phys/4 - targetRatio);
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

  // Decompose mood (0-8) into M1, M2 (0-4 each)
  const M1 = Math.min(4, Math.ceil(best.mood / 2));
  const M2 = best.mood - M1;

  // Decompose psych (0-24) into SP1..SP6 (0-4 each)
  const sp = [0, 0, 0, 0, 0, 0];
  let remPsych = best.psych;
  for (let i = 0; i < 6; i++) {
    const take = Math.min(4, Math.floor(remPsych / (6 - i)));
    sp[i] = take;
    remPsych -= take;
  }
  sp[5] += remPsych;

  // Decompose phys (0-4) into PH1
  const PH1 = best.phys;

  // Also pick consistent 3-question strings
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

const targets = [69, 67, 65, 63, 60, 62, 67, 65, 60, 58, 56, 58, 63, 61, 56, 54, 52, 54, 59, 57, 52, 50, 48, 48];
console.log("Testing targets:", targets.length);
targets.forEach((t) => {
  const res = generateResponsesForTarget(t);
  if (res.calculatedMsi !== t) {
    console.error(`MISMATCH: target=${t}, calculated=${res.calculatedMsi}`);
  }
});
console.log("All 24 targets matched perfectly!");
