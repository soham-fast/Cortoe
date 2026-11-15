import React, { useState, useMemo } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

export interface BiomarkerDetail {
  raw: number
  unit: string
  testDate?: string
  labName?: string
  standardValue?: number
  standardUnit?: string
  normalizedScore: number
}

export interface MBSIAssessmentRecord {
  _id: string
  msiScore: number
  bsiScore: number
  mbsiScore: number
  calculatedAt: string
  formulaVersion?: string
  normalizationVersion?: string
  isProvisional?: boolean
  biomarkers: {
    cortisol: BiomarkerDetail
    dhea: BiomarkerDetail
    crp: BiomarkerDetail
  }
  breakdown?: {
    psychological?: {
      weight: number
      score: number
      contribution: number
    }
    biological?: {
      weight: number
      score: number
      contribution: number
      biomarkers?: {
        cortisol?: { score: number; contributionToBsi: number }
        dhea?: { score: number; contributionToBsi: number }
        crp?: { score: number; contributionToBsi: number }
      }
    }
  }
}

export type TimeframeFilter = "7d" | "30d" | "3m" | "1y" | "all"

interface MBSITrendsSectionProps {
  history: MBSIAssessmentRecord[]
  onRefresh?: () => void
}

export function MBSITrendsSection({ history, onRefresh }: MBSITrendsSectionProps) {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("all")
  const [showMbsiSeries, setShowMbsiSeries] = useState(true)
  const [showMsiSeries, setShowMsiSeries] = useState(true)
  const [showBsiSeries, setShowBsiSeries] = useState(true)
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MBSIAssessmentRecord | null>(null)
  const [componentViewTab, setComponentViewTab] = useState<"psychological" | "biological">("biological")

  // Sort history chronologically (newest first for table & summary; oldest first for chart)
  const sortedNewestFirst = useMemo(() => {
    return [...history].sort(
      (a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
    )
  }, [history])

  // Filter by selected timeframe
  const filteredHistory = useMemo(() => {
    if (timeframe === "all") return sortedNewestFirst
    const now = Date.now()
    let ms = 0
    if (timeframe === "7d") ms = 7 * 86400 * 1000
    else if (timeframe === "30d") ms = 30 * 86400 * 1000
    else if (timeframe === "3m") ms = 90 * 86400 * 1000
    else if (timeframe === "1y") ms = 365 * 86400 * 1000

    return sortedNewestFirst.filter(
      (item) => new Date(item.calculatedAt).getTime() >= now - ms
    )
  }, [sortedNewestFirst, timeframe])

  // Trend Dashboard Summary Metrics (based on latest vs previous in entire history)
  const trendSummary = useMemo(() => {
    if (sortedNewestFirst.length === 0) {
      return {
        current: null,
        previous: null,
        delta: null,
        percentChange: null,
        trend: "No Assessments Recorded",
        latestDate: null,
      }
    }

    const current = Math.round(sortedNewestFirst[0].mbsiScore * 10) / 10
    const latestDate = sortedNewestFirst[0].calculatedAt

    if (sortedNewestFirst.length === 1) {
      return {
        current,
        previous: null,
        delta: null,
        percentChange: null,
        trend: "Baseline Established",
        latestDate,
      }
    }

    const previous = Math.round(sortedNewestFirst[1].mbsiScore * 10) / 10
    const delta = Math.round((current - previous) * 10) / 10
    const percentChange = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0

    let trend = "Stable"
    if (delta > 1) trend = "Increasing"
    else if (delta < -1) trend = "Decreasing"

    return {
      current,
      previous,
      delta,
      percentChange,
      trend,
      latestDate,
    }
  }, [sortedNewestFirst])

  // Prepare chronological chart data for line graph
  const chartData = useMemo(() => {
    return [...filteredHistory]
      .reverse()
      .map((item) => {
        const d = new Date(item.calculatedAt)
        return {
          id: item._id,
          rawDate: item.calculatedAt,
          formattedDate: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          MBSI: Math.round(item.mbsiScore * 10) / 10,
          MSI: Math.round(item.msiScore * 10) / 10,
          BSI: Math.round(item.bsiScore * 10) / 10,
          cortisolNorm: item.biomarkers?.cortisol?.normalizedScore ?? null,
          cortisolRaw: item.biomarkers?.cortisol?.raw ?? null,
          cortisolUnit: item.biomarkers?.cortisol?.unit ?? "µg/dL",
          dheaNorm: item.biomarkers?.dhea?.normalizedScore ?? null,
          dheaRaw: item.biomarkers?.dhea?.raw ?? null,
          dheaUnit: item.biomarkers?.dhea?.unit ?? "µg/dL",
          crpNorm: item.biomarkers?.crp?.normalizedScore ?? null,
          crpRaw: item.biomarkers?.crp?.raw ?? null,
          crpUnit: item.biomarkers?.crp?.unit ?? "mg/L",
          rawRecord: item,
        }
      })
  }, [filteredHistory])

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    const dataPoint = payload[0]?.payload
    if (!dataPoint) return null

    return (
      <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-[0_10px_24px_rgba(121,100,82,0.12)] text-xs text-[#3F3127] space-y-2 min-w-[210px] animate-fade-in">
        <div className="border-b border-[#F3DCC8] pb-1.5 flex items-center justify-between">
          <span className="font-bold font-mono-data text-[#C45B32]">{dataPoint.fullDate}</span>
          <span className="text-[10px] text-[#796452] font-semibold bg-[#FAF4EB] px-2 py-0.5 rounded-full border border-[#F3DCC8]">
            Assessment
          </span>
        </div>

        <div className="space-y-1 font-mono-data text-[11px]">
          {showMbsiSeries && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#C45B32] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#C45B32]" />
                MBSI Composite:
              </span>
              <strong className="text-sm font-bold text-[#C45B32]">{dataPoint.MBSI}</strong>
            </div>
          )}
          {showMsiSeries && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#796452]">
                <span className="w-2 h-2 rounded-full bg-[#796452]" />
                MSI (Psychological):
              </span>
              <span className="font-semibold text-[#3F3127]">{dataPoint.MSI}</span>
            </div>
          )}
          {showBsiSeries && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#4A643E]">
                <span className="w-2 h-2 rounded-full bg-[#4A643E]" />
                BSI (Biological):
              </span>
              <span className="font-semibold text-[#3F3127]">{dataPoint.BSI}</span>
            </div>
          )}
        </div>

        {/* Verified Lab Biomarkers snapshot */}
        <div className="pt-1.5 border-t border-[#F3DCC8] text-[10px] text-[#796452] space-y-0.5">
          <p className="font-bold text-[#3F3127] text-[9.5px] uppercase tracking-wider">
            Verified Lab Values:
          </p>
          <div className="flex justify-between">
            <span>Cortisol:</span>
            <span className="font-mono-data font-semibold text-[#3F3127]">
              {dataPoint.cortisolRaw} {dataPoint.cortisolUnit} ({dataPoint.cortisolNorm}/100)
            </span>
          </div>
          <div className="flex justify-between">
            <span>DHEA-S:</span>
            <span className="font-mono-data font-semibold text-[#3F3127]">
              {dataPoint.dheaRaw} {dataPoint.dheaUnit} ({dataPoint.dheaNorm}/100)
            </span>
          </div>
          <div className="flex justify-between">
            <span>hs-CRP:</span>
            <span className="font-mono-data font-semibold text-[#3F3127]">
              {dataPoint.crpRaw} {dataPoint.crpUnit} ({dataPoint.crpNorm}/100)
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      {/* ── 1. MBSI TREND DASHBOARD ────────────────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3DCC8] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3DCC8]/80 border border-[#E0C5AE] text-[10px] font-bold text-[#C45B32] uppercase mb-1">
              <span>Longitudinal Analytics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3F3127] tracking-tight">
              MBSI Trends & Historical Analysis
            </h2>
            <p className="text-xs text-[#796452] mt-0.5">
              Longitudinal tracking of combined psychological resilience and biological neuroendocrine markers.
            </p>
          </div>

          {trendSummary.latestDate && (
            <div className="text-left sm:text-right flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-[#796452] tracking-wider block">
                Latest Assessment
              </span>
              <span className="text-xs font-mono-data font-bold text-[#3F3127]">
                {new Date(trendSummary.latestDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* 4 Key Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Tile 1: Current MBSI */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#796452] tracking-wider block">
              Current MBSI
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono-data text-[#C45B32]">
                {trendSummary.current !== null ? trendSummary.current : "–"}
              </span>
              <span className="text-xs text-[#796452]">/ 100</span>
            </div>
            <p className="text-[10px] text-[#796452]">
              {trendSummary.current !== null
                ? trendSummary.current <= 35
                  ? "Optimal Balance"
                  : trendSummary.current <= 60
                  ? "Moderate Stress"
                  : "Elevated Load"
                : "No assessments yet"}
            </p>
          </div>

          {/* Tile 2: Previous MBSI */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#796452] tracking-wider block">
              Previous MBSI
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono-data text-[#796452]">
                {trendSummary.previous !== null ? trendSummary.previous : "–"}
              </span>
              {trendSummary.previous !== null && <span className="text-xs text-[#796452]">/ 100</span>}
            </div>
            <p className="text-[10px] text-[#796452]">
              {trendSummary.previous !== null ? "Prior completed calculation" : "Baseline recording"}
            </p>
          </div>

          {/* Tile 3: Change Delta */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#796452] tracking-wider block">
              Change Since Prior
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono-data ${
                  trendSummary.delta === null
                    ? "text-[#796452]"
                    : trendSummary.delta < 0
                    ? "text-[#4A643E]"
                    : trendSummary.delta > 0
                    ? "text-[#C45B32]"
                    : "text-[#796452]"
                }`}
              >
                {trendSummary.delta === null
                  ? "–"
                  : trendSummary.delta > 0
                  ? `+${trendSummary.delta}`
                  : trendSummary.delta}
              </span>
              {trendSummary.percentChange !== null && (
                <span className="text-xs font-semibold text-[#796452]">
                  ({trendSummary.percentChange > 0 ? `+${trendSummary.percentChange}` : trendSummary.percentChange}%)
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#796452]">
              {trendSummary.delta === null
                ? "First data point"
                : trendSummary.delta < 0
                ? "Stress decreased (improvement)"
                : trendSummary.delta > 0
                ? "Stress load elevated"
                : "Consistent measurement"}
            </p>
          </div>

          {/* Tile 4: Overall Trend */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#796452] tracking-wider block">
              Overall Trend
            </span>
            <div className="pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  trendSummary.trend === "Decreasing"
                    ? "bg-[#EAF3E6] text-[#4A643E] border-[#B9C6A5]"
                    : trendSummary.trend === "Increasing"
                    ? "bg-[#FBECE6] text-[#9B3718] border-[#E8C0B2]"
                    : "bg-[#FAF4EB] text-[#796452] border-[#F3DCC8]"
                }`}
              >
                <span>
                  {trendSummary.trend === "Decreasing"
                    ? "↓"
                    : trendSummary.trend === "Increasing"
                    ? "↑"
                    : "→"}
                </span>
                <span>{trendSummary.trend}</span>
              </span>
            </div>
            <p className="text-[10px] text-[#796452] pt-0.5">
              {trendSummary.trend === "Decreasing"
                ? "Resilience improving"
                : trendSummary.trend === "Increasing"
                ? "Active recovery recommended"
                : "Stable balance across assessments"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. INTERACTIVE TREND GRAPH ────────────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-4">
        {/* Header & Controls: Timeframe Filter + Series Toggles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#F3DCC8] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#3F3127] flex items-center gap-2">
              <span>📈</span>
              <span>Longitudinal Trajectory Chart</span>
            </h3>
            <p className="text-xs text-[#796452] mt-0.5">
              Toggle component series and adjust time horizons to inspect stress progression.
            </p>
          </div>

          {/* Time Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#FFFDF9] p-1.5 rounded-2xl border border-[#F3DCC8] shadow-xs">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "3m", label: "3 Months" },
              { id: "1y", label: "1 Year" },
              { id: "all", label: "All Time" },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id as TimeframeFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? "bg-[#C45B32] text-white shadow-xs"
                    : "text-[#796452] hover:text-[#3F3127] hover:bg-[#FAF4EB]"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Series Toggles (Checkboxes / Pills) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold">
          <span className="text-[#796452] text-[11px] font-medium mr-1">Data Series:</span>

          {/* MBSI Toggle */}
          <button
            type="button"
            onClick={() => setShowMbsiSeries((p) => !p)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              showMbsiSeries
                ? "bg-[#C45B32] text-white border-[#C45B32]"
                : "bg-[#FFFDF9] text-[#796452] border-[#F3DCC8] opacity-60"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#C45B32]" />
            <span>MBSI Overall (Composite)</span>
          </button>

          {/* MSI Toggle */}
          <button
            type="button"
            onClick={() => setShowMsiSeries((p) => !p)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              showMsiSeries
                ? "bg-[#796452] text-white border-[#796452]"
                : "bg-[#FFFDF9] text-[#796452] border-[#F3DCC8] opacity-60"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#796452]" />
            <span>MSI Psychological (60%)</span>
          </button>

          {/* BSI Toggle */}
          <button
            type="button"
            onClick={() => setShowBsiSeries((p) => !p)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              showBsiSeries
                ? "bg-[#4A643E] text-white border-[#4A643E]"
                : "bg-[#FFFDF9] text-[#796452] border-[#F3DCC8] opacity-60"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#4A643E]" />
            <span>BSI Biological (40%)</span>
          </button>
        </div>

        {/* Chart View */}
        {chartData.length === 0 ? (
          <div className="py-16 px-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] text-center space-y-2">
            <span className="text-2xl">📊</span>
            <p className="text-sm font-bold text-[#3F3127]">No assessment records found for this timeframe.</p>
            <p className="text-xs text-[#796452] max-w-sm mx-auto">
              Calculate your MBSI using the form above to record your first historical measurement.
            </p>
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3DCC8" strokeOpacity={0.7} />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#796452"
                  fontSize={11}
                  tickLine={false}
                  dy={5}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#796452"
                  fontSize={11}
                  tickLine={false}
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} />
                {showMbsiSeries && (
                  <Line
                    type="monotone"
                    dataKey="MBSI"
                    name="MBSI Overall"
                    stroke="#C45B32"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#C45B32", stroke: "#FFFDF9", strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {showMsiSeries && (
                  <Line
                    type="monotone"
                    dataKey="MSI"
                    name="MSI (Psychological)"
                    stroke="#796452"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#796452" }}
                  />
                )}
                {showBsiSeries && (
                  <Line
                    type="monotone"
                    dataKey="BSI"
                    name="BSI (Biological)"
                    stroke="#4A643E"
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    dot={{ r: 3, fill: "#4A643E" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 3. COMPONENT-LEVEL ANALYSIS ────────────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3DCC8] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#3F3127] flex items-center gap-2">
              <span>🔬</span>
              <span>Component-Level Stress Dissection</span>
            </h3>
            <p className="text-xs text-[#796452] mt-0.5">
              Inspect independent trends for psychological perception versus laboratory-verified biological markers.
            </p>
          </div>

          {/* Toggle between Psychological vs Biological */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8]">
            <button
              type="button"
              onClick={() => setComponentViewTab("biological")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                componentViewTab === "biological"
                  ? "bg-[#C45B32] text-white shadow-xs"
                  : "text-[#796452] hover:text-[#3F3127]"
              }`}
            >
              Biological (BSI & Lab Markers)
            </button>
            <button
              type="button"
              onClick={() => setComponentViewTab("psychological")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                componentViewTab === "psychological"
                  ? "bg-[#C45B32] text-white shadow-xs"
                  : "text-[#796452] hover:text-[#3F3127]"
              }`}
            >
              Psychological (MSI Signals)
            </button>
          </div>
        </div>

        {/* Biological Deep-Dive: Individual Biomarker Trends (Cortisol, DHEA-S, CRP) */}
        {componentViewTab === "biological" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] text-xs text-[#796452] flex items-center gap-2">
              <span className="text-base">🧪</span>
              <span>
                <strong>Verified Lab Rule:</strong> Individual biological biomarker trends are only plotted when verified laboratory measurements and official pathology intervals exist.
              </span>
            </div>

            {/* 3 Biomarker Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Cortisol */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#F3DCC8] pb-1.5">
                  <span className="text-xs font-bold text-[#3F3127]">1. Cortisol</span>
                  <span className="text-[10px] font-semibold text-[#C45B32] bg-[#F3DCC8] px-2 py-0.5 rounded-full">
                    40% of BSI
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-[#796452]">
                    <span>Standard Range:</span>
                    <strong className="text-[#3F3127]">6.0 – 23.0 µg/dL</strong>
                  </div>
                  <div className="flex justify-between text-[#796452]">
                    <span>Latest Measured:</span>
                    <strong className="font-mono-data text-[#C45B32]">
                      {sortedNewestFirst[0]?.biomarkers?.cortisol?.raw
                        ? `${sortedNewestFirst[0].biomarkers.cortisol.raw} ${sortedNewestFirst[0].biomarkers.cortisol.unit}`
                        : "–"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#796452]">
                    <span>Normalized Score:</span>
                    <strong className="font-mono-data text-[#3F3127]">
                      {sortedNewestFirst[0]?.biomarkers?.cortisol?.normalizedScore ?? "–"} / 100
                    </strong>
                  </div>
                </div>
                <p className="text-[10px] text-[#796452] pt-1 border-t border-[#F3DCC8]/70">
                  Reflects acute hypothalamic-pituitary-adrenal (HPA) axis neuroendocrine activation.
                </p>
              </div>

              {/* DHEA-S */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#F3DCC8] pb-1.5">
                  <span className="text-xs font-bold text-[#3F3127]">2. DHEA-S</span>
                  <span className="text-[10px] font-semibold text-[#796452] bg-[#F3DCC8] px-2 py-0.5 rounded-full">
                    30% of BSI
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-[#796452]">
                    <span>Standard Range:</span>
                    <strong className="text-[#3F3127]">80 – 560 µg/dL</strong>
                  </div>
                  <div className="flex justify-between text-[#796452]">
                    <span>Latest Measured:</span>
                    <strong className="font-mono-data text-[#796452]">
                      {sortedNewestFirst[0]?.biomarkers?.dhea?.raw
                        ? `${sortedNewestFirst[0].biomarkers.dhea.raw} ${sortedNewestFirst[0].biomarkers.dhea.unit}`
                        : "–"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#796452]">
                    <span>Normalized Score:</span>
                    <strong className="font-mono-data text-[#3F3127]">
                      {sortedNewestFirst[0]?.biomarkers?.dhea?.normalizedScore ?? "–"} / 100
                    </strong>
                  </div>
                </div>
                <p className="text-[10px] text-[#796452] pt-1 border-t border-[#F3DCC8]/70">
                  Inverse protective buffer; higher DHEA-S counters chronic allostatic depletion.
                </p>
              </div>

              {/* hs-CRP */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#F3DCC8] pb-1.5">
                  <span className="text-xs font-bold text-[#3F3127]">3. hs-CRP</span>
                  <span className="text-[10px] font-semibold text-[#4A643E] bg-[#B9C6A5]/30 px-2 py-0.5 rounded-full">
                    30% of BSI
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-[#796452]">
                    <span>Standard Range:</span>
                    <strong className="text-[#3F3127]">&lt; 3.0 mg/L</strong>
                  </div>
                  <div className="flex justify-between text-[#796452]">
                    <span>Latest Measured:</span>
                    <strong className="font-mono-data text-[#4A643E]">
                      {sortedNewestFirst[0]?.biomarkers?.crp?.raw
                        ? `${sortedNewestFirst[0].biomarkers.crp.raw} ${sortedNewestFirst[0].biomarkers.crp.unit}`
                        : "–"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#796452]">
                    <span>Normalized Score:</span>
                    <strong className="font-mono-data text-[#3F3127]">
                      {sortedNewestFirst[0]?.biomarkers?.crp?.normalizedScore ?? "–"} / 100
                    </strong>
                  </div>
                </div>
                <p className="text-[10px] text-[#796452] pt-1 border-t border-[#F3DCC8]/70">
                  Measures low-grade systemic neuroinflammation and immune load.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Psychological Deep-Dive: MSI */}
        {componentViewTab === "psychological" && (
          <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#3F3127]">Psychological Component Trajectory (MSI)</h4>
                <p className="text-xs text-[#796452]">
                  Self-reported cognitive-emotional stress assessments, baseline calibration, and daily check-ins.
                </p>
              </div>
              <span className="text-xs font-mono-data font-bold text-[#C45B32] bg-[#F3DCC8] px-3 py-1 rounded-full">
                60% MBSI Weight
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                <span className="text-[10px] text-[#796452] block">Latest MSI Score</span>
                <span className="text-lg font-bold font-mono-data text-[#3F3127]">
                  {sortedNewestFirst[0]?.msiScore ?? "–"} / 100
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                <span className="text-[10px] text-[#796452] block">Contribution Points</span>
                <span className="text-lg font-bold font-mono-data text-[#C45B32]">
                  {sortedNewestFirst[0]?.msiScore
                    ? `+${(sortedNewestFirst[0].msiScore * 0.6).toFixed(1)} pts`
                    : "–"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF4EB] border border-[#F3DCC8]">
                <span className="text-[10px] text-[#796452] block">Data Source</span>
                <span className="text-xs font-semibold text-[#796452] block pt-1">
                  Verified Assessment Ledger
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. HISTORICAL ASSESSMENT RECORDS TABLE ─────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F3DCC8] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#3F3127] flex items-center gap-2">
              <span>📋</span>
              <span>Historical Assessment Records</span>
            </h3>
            <p className="text-xs text-[#796452] mt-0.5">
              Comprehensive log of completed MBSI calculations with component breakdowns. Click any row to view full laboratory verification details.
            </p>
          </div>
          <span className="text-xs font-mono-data font-semibold text-[#796452] bg-white px-3 py-1 rounded-full border border-[#F3DCC8] shadow-xs">
            {sortedNewestFirst.length} Record{sortedNewestFirst.length === 1 ? "" : "s"}
          </span>
        </div>

        {sortedNewestFirst.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#796452] space-y-2">
            <span className="text-2xl">🌱</span>
            <p className="font-bold text-[#3F3127]">No historical assessments recorded yet.</p>
            <p>Enter your lab biomarkers in the calculator above and click Calculate to start your longitudinal record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#F3DCC8] bg-[#FFFDF9]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF4EB] text-[10px] uppercase font-bold text-[#3F3127] border-b border-[#F3DCC8]">
                <tr>
                  <th className="px-4 py-3">Assessment Date</th>
                  <th className="px-3 py-3">MSI (60%)</th>
                  <th className="px-3 py-3">Cortisol (40% BSI)</th>
                  <th className="px-3 py-3">DHEA-S (30% BSI)</th>
                  <th className="px-3 py-3">CRP (30% BSI)</th>
                  <th className="px-3 py-3">BSI Score</th>
                  <th className="px-4 py-3 text-right">Final MBSI</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3DCC8] font-mono-data text-[11px] text-[#796452]">
                {sortedNewestFirst.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => setSelectedRecordForDetail(item)}
                    className="hover:bg-[#FAF4EB]/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-[#3F3127]">
                      {new Date(item.calculatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-3 text-[#3F3127]">
                      <strong>{Math.round(item.msiScore)}</strong>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-[#3F3127]">
                        {item.biomarkers?.cortisol?.normalizedScore ?? "–"}
                      </span>
                      <span className="text-[10px] text-[#796452] block">
                        {item.biomarkers?.cortisol?.raw} {item.biomarkers?.cortisol?.unit}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-[#3F3127]">
                        {item.biomarkers?.dhea?.normalizedScore ?? "–"}
                      </span>
                      <span className="text-[10px] text-[#796452] block">
                        {item.biomarkers?.dhea?.raw} {item.biomarkers?.dhea?.unit}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-[#3F3127]">
                        {item.biomarkers?.crp?.normalizedScore ?? "–"}
                      </span>
                      <span className="text-[10px] text-[#796452] block">
                        {item.biomarkers?.crp?.raw} {item.biomarkers?.crp?.unit}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#4A643E]">
                      {Math.round(item.bsiScore * 10) / 10}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-1 rounded-xl bg-[#F3DCC8] text-[#C45B32] font-bold text-xs border border-[#E0C5AE] shadow-xs">
                        {Math.round(item.mbsiScore * 10) / 10}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[11px] font-semibold text-[#C45B32] hover:underline">
                        View Details →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. INDIVIDUAL HISTORICAL ASSESSMENT DETAIL MODAL ────────────────── */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#FAF4EB] border-2 border-[#F3DCC8] p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedRecordForDetail(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] text-[#796452] flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold text-[#C45B32] uppercase tracking-wider bg-[#F3DCC8] px-2.5 py-0.5 rounded-full border border-[#E0C5AE]">
                Historical Assessment Record
              </span>
              <h3 className="text-xl font-bold text-[#3F3127] mt-1.5">
                Assessment Details: {new Date(selectedRecordForDetail.calculatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </h3>
              <p className="text-xs text-[#796452]">
                Deterministic calculation ID: <span className="font-mono-data text-[10px]">{selectedRecordForDetail._id}</span>
              </p>
            </div>

            {/* Top Score Comparison */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#796452] block">Final MBSI</span>
                <span className="text-2xl font-bold font-mono-data text-[#C45B32]">
                  {Math.round(selectedRecordForDetail.mbsiScore * 10) / 10}
                </span>
                <span className="text-[10px] text-[#796452] block">Composite</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#796452] block">MSI (60%)</span>
                <span className="text-2xl font-bold font-mono-data text-[#3F3127]">
                  {Math.round(selectedRecordForDetail.msiScore * 10) / 10}
                </span>
                <span className="text-[10px] text-[#796452] block">+{(selectedRecordForDetail.msiScore * 0.6).toFixed(1)} pts</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#796452] block">BSI (40%)</span>
                <span className="text-2xl font-bold font-mono-data text-[#4A643E]">
                  {Math.round(selectedRecordForDetail.bsiScore * 10) / 10}
                </span>
                <span className="text-[10px] text-[#796452] block">+{(selectedRecordForDetail.bsiScore * 0.4).toFixed(1)} pts</span>
              </div>
            </div>

            {/* Verified Biomarkers Breakdown */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#3F3127] uppercase tracking-wider">
                Laboratory-Verified Biomarker Details
              </h4>

              <div className="space-y-2">
                {/* Cortisol */}
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#3F3127]">Cortisol (40% BSI):</span>
                    <span className="font-mono-data ml-1.5 font-semibold text-[#C45B32]">
                      {selectedRecordForDetail.biomarkers?.cortisol?.raw} {selectedRecordForDetail.biomarkers?.cortisol?.unit}
                    </span>
                    {selectedRecordForDetail.biomarkers?.cortisol?.labName && (
                      <span className="text-[11px] text-[#796452] ml-2">
                        · Lab: {selectedRecordForDetail.biomarkers.cortisol.labName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#796452]">Normalized:</span>
                    <span className="font-mono-data font-bold text-[#3F3127] bg-[#FAF4EB] px-2 py-0.5 rounded-md border border-[#F3DCC8]">
                      {selectedRecordForDetail.biomarkers?.cortisol?.normalizedScore} / 100
                    </span>
                  </div>
                </div>

                {/* DHEA-S */}
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#3F3127]">DHEA-S (30% BSI):</span>
                    <span className="font-mono-data ml-1.5 font-semibold text-[#796452]">
                      {selectedRecordForDetail.biomarkers?.dhea?.raw} {selectedRecordForDetail.biomarkers?.dhea?.unit}
                    </span>
                    {selectedRecordForDetail.biomarkers?.dhea?.labName && (
                      <span className="text-[11px] text-[#796452] ml-2">
                        · Lab: {selectedRecordForDetail.biomarkers.dhea.labName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#796452]">Normalized:</span>
                    <span className="font-mono-data font-bold text-[#3F3127] bg-[#FAF4EB] px-2 py-0.5 rounded-md border border-[#F3DCC8]">
                      {selectedRecordForDetail.biomarkers?.dhea?.normalizedScore} / 100
                    </span>
                  </div>
                </div>

                {/* CRP */}
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#3F3127]">hs-CRP (30% BSI):</span>
                    <span className="font-mono-data ml-1.5 font-semibold text-[#4A643E]">
                      {selectedRecordForDetail.biomarkers?.crp?.raw} {selectedRecordForDetail.biomarkers?.crp?.unit}
                    </span>
                    {selectedRecordForDetail.biomarkers?.crp?.labName && (
                      <span className="text-[11px] text-[#796452] ml-2">
                        · Lab: {selectedRecordForDetail.biomarkers.crp.labName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#796452]">Normalized:</span>
                    <span className="font-mono-data font-bold text-[#3F3127] bg-[#FAF4EB] px-2 py-0.5 rounded-md border border-[#F3DCC8]">
                      {selectedRecordForDetail.biomarkers?.crp?.normalizedScore} / 100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology & Formula Footer */}
            <div className="p-3.5 rounded-2xl bg-[#FAF4EB] border border-[#F3DCC8] text-[10px] text-[#796452] space-y-1">
              <p>
                <strong className="text-[#3F3127]">Provisional Formula:</strong> MBSI = (0.60 × MSI) + (0.40 × BSI) where BSI = (0.40 × Cortisol) + (0.30 × DHEA-S) + (0.30 × CRP).
              </p>
              <p>
                Formula Version: {selectedRecordForDetail.formulaVersion || "MBSI-v1.0-provisional"} · Deterministic calculation persisted in database.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

