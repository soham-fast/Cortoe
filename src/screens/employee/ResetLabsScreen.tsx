import React, { useState, useEffect, useCallback, useRef } from "react"
import { Screen } from "./EmployeeApp"
import {
  ResetLabsCheckInOutView,
  ResetLabsMyReportsView,
  AttendanceRecord,
} from "./ResetLabsSessionSystem"

// ── CortiQuant Brand Palette Constants ─────────────────────────────────────────
// Warm ivory / cream: #F8F1E6
// Soft peach:         #F3DCC8
// Terracotta:         #C45B32
// Muted coral:        #D98268
// Warm brown:         #796452
// Soft sage:          #B9C6A5
// Deep espresso text: #3F3127

export const BRAND_COLORS = {
  warmIvory: "#F8F1E6",
  softPeach: "#F3DCC8",
  terracotta: "#C45B32",
  mutedCoral: "#D98268",
  warmBrown: "#796452",
  softSage: "#B9C6A5",
  deepEspresso: "#3F3127",
  cardBg: "#FAF4EB",
  cardBorder: "#F3DCC8",
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ResetLabProgramId = "acoustic-unwind" | "express-unwind"

export interface ProgramConfig {
  id: ResetLabProgramId
  title: string
  category: string
  description: string
  duration?: string
  facilitator: {
    name: string
    title: string
    bio: string
    credentials: string
  }
  venue: string
  teaserDurationSecs: number
  accentColor: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  gradientBg: string
  borderColor: string
  instagramReel: {
    reelId: string
    reelUrl: string
    embedUrl: string
  }
  clayScene: {
    atmosphereTag: string
    caption: string
    subtitle: string
    details: string
    paletteLabels: string[]
  }
  highlights: string[]
  formatDetails: string[]
  whoIsItFor: string[]
  sessionFlow: { phase: string; time: string; desc: string }[]
  environmentGlimpse: { title: string; desc: string; icon: string }[]
  artworkSamples?: { title: string; medium: string; desc: string; color: string }[]
  availableSlots: { id: string; date: string; time: string; seatsLeft: number; venue: string }[]
}

export interface UpcomingSessionRecord {
  _id: string
  interventionName: string
  startedAt: string
  metadata?: {
    scheduledDate?: string
    timeSlot?: string
    location?: string
    facilitator?: string
    maxParticipants?: number
    enrolledCount?: number
  }
}

// ── Program Data Configuration ───────────────────────────────────────────────

export const RESET_LAB_PROGRAMS: Record<ResetLabProgramId, ProgramConfig> = {
  "acoustic-unwind": {
    id: "acoustic-unwind",
    title: "Acoustic Unwind",
    category: "Music & Mindfulness",
    description:
      "A guided musical wellbeing experience using live acoustic music, mindful listening and moments of reflection to create space for relaxation and emotional expression.",
    duration: "45 min",
    facilitator: {
      name: "Elena Vance, M.Mus.",
      title: "Lead Acoustic Sound Practitioner",
      bio: "Master of Music (Acoustic Performance) with 11+ years specialising in psychoacoustics, autonomic nervous system down-regulation, and receptive sound meditation.",
      credentials: "M.Mus., Certified Neurological Music Therapist",
    },
    venue: "CortiQuant Wellbeing Studio, Suite 400 · Acoustic Chamber",
    teaserDurationSecs: 38,
    accentColor: "#C45B32",
    badgeBg: "rgba(243, 220, 200, 0.75)",
    badgeText: "#C45B32",
    badgeBorder: "rgba(196, 91, 50, 0.3)",
    gradientBg: "#FAF4EB",
    borderColor: "#F3DCC8",
    instagramReel: {
      reelId: "DdBEDv4sU1t",
      reelUrl: "https://www.instagram.com/reel/DdBEDv4sU1t/",
      embedUrl: "https://www.instagram.com/reel/DdBEDv4sU1t/embed/",
    },
    clayScene: {
      atmosphereTag: "3D Clay Acoustic Studio",
      caption: "Sculpted acoustic guitar, floating notes & vintage mic",
      subtitle: "Tactile acoustic immersion · Receptive calm",
      details:
        "Handcrafted 3D clay aesthetic with warm terracotta guitar, rounded fretboard, floating clay soundwaves, and vintage microphone in soothing pastel light.",
      paletteLabels: ["Terracotta", "Warm Peach", "Soft Sage", "Warm Ivory"],
    },
    highlights: [
      "Live unamplified acoustic resonance designed to lower autonomic nervous system arousal",
      "Mindful listening exercises to disengage from workday cognitive fatigue",
      "Gentle reflective pauses for emotional release, grounding, and perspective",
      "No musical knowledge required — purely receptive and deeply restorative",
    ],
    formatDetails: [
      "Guided by certified acoustic sound facilitators in an intimate acoustic space",
      "Comfortable organic floor cushions and reclining loungers provided",
      "Calm screen-free environment with warm ambient lighting",
      "Concludes with gentle somatic re-anchoring and takeaway recovery habits",
    ],
    whoIsItFor: [
      "Anyone experiencing persistent cognitive overload or mental fatigue",
      "Individuals feeling wired, tense, or unable to switch off after high-demand work sprints",
      "Teams seeking a shared, non-verbal wellbeing ritual",
    ],
    sessionFlow: [
      {
        phase: "Phase 1: Arrival & Grounding",
        time: "0–10 min",
        desc: "Settle onto cushions, regulated diaphragmatic breath pacing, and sensory decompression.",
      },
      {
        phase: "Phase 2: Live Acoustic Resonance",
        time: "10–30 min",
        desc: "Continuous live acoustic harmonics and strings to down-regulate sympathetic arousal.",
      },
      {
        phase: "Phase 3: Silent Stillness & Reflection",
        time: "30–40 min",
        desc: "Deep cognitive pause, settling heart rate, and optional reflective journal notes.",
      },
      {
        phase: "Phase 4: Somatic Re-anchoring",
        time: "40–45 min",
        desc: "Gentle reorientation, herbal hydration, and personal somatic recovery takeaways.",
      },
    ],
    environmentGlimpse: [
      {
        title: "Amber Studio Lighting",
        desc: "Low-kelvin 2700K warm ambient illumination and beeswax candles to eliminate screen glare.",
        icon: "🕯️",
      },
      {
        title: "Unamplified Resonance",
        desc: "Solid spruce and mahogany instruments creating natural acoustic vibrations without synthetic amplification.",
        icon: "🎻",
      },
      {
        title: "Ergonomic Comfort",
        desc: "Organic cotton floor bolsters, weighted blankets, and supportive reclining loungers.",
        icon: "🛋️",
      },
    ],
    availableSlots: [
      {
        id: "slot-au-1",
        date: "Thursday, Nov 26, 2026",
        time: "15:00 – 15:45",
        seatsLeft: 6,
        venue: "CortiQuant Wellbeing Studio, Suite 400",
      },
      {
        id: "slot-au-2",
        date: "Tuesday, Dec 1, 2026",
        time: "11:30 – 12:15",
        seatsLeft: 4,
        venue: "CortiQuant Wellbeing Studio, Suite 400",
      },
    ],
  },
  "express-unwind": {
    id: "express-unwind",
    title: "Express & Unwind",
    category: "Art & Creative Expression",
    description:
      "A creative wellbeing experience combining art, colours and guided self-expression to help participants explore their thoughts and emotions in a relaxed environment.",
    duration: "60 min",
    facilitator: {
      name: "Marcus Thorne, ATR-BC",
      title: "Registered Expressive Arts Therapist",
      bio: "14+ years facilitating creative recovery in clinical and corporate settings. Specialises in non-verbal somatic externalisation, tactile grounding, and mindfulness-based creative exploration.",
      credentials: "ATR-BC, Licensed Creative Arts Practitioner",
    },
    venue: "CortiQuant Wellbeing Studio, Suite 400 · Creative Studio",
    teaserDurationSecs: 35,
    accentColor: "#D98268",
    badgeBg: "rgba(243, 220, 200, 0.75)",
    badgeText: "#D98268",
    badgeBorder: "rgba(217, 130, 104, 0.3)",
    gradientBg: "#FAF4EB",
    borderColor: "#F3DCC8",
    instagramReel: {
      reelId: "DeER5-AM-aA",
      reelUrl: "https://www.instagram.com/reel/DeER5-AM-aA/",
      embedUrl: "https://www.instagram.com/reel/DeER5-AM-aA/embed/",
    },
    clayScene: {
      atmosphereTag: "3D Clay Creative Studio",
      caption: "Sculpted canvas, palette & tactile paint blobs",
      subtitle: "Tactile artistic expression · Non-judgmental play",
      details:
        "Sculpted 3D clay canvas with vibrant abstract strokes, organic paint palette with plump clay paint blobs, rounded brushes, and floating drops of color.",
      paletteLabels: ["Muted Coral", "Soft Sage", "Terracotta", "Warm Peach"],
    },
    highlights: [
      "Intuitive color selection and mark-making to externalize internal thoughts and feelings",
      "Guided creative exercises with no judgment, critiques, or technical skill required",
      "Mindful artistic prompts helping release subconscious mental friction and perfectionism",
      "Safe, private reflection on personal artistic metaphors with optional peer connection",
    ],
    formatDetails: [
      "Facilitated by accredited expressive arts and wellbeing practitioners",
      "All tactile art media, canvas panels, and supplies provided",
      "Warm, unhurried studio atmosphere with quiet background music",
      "Individual creation with optional quiet reflection",
    ],
    whoIsItFor: [
      "Anyone who finds verbal expression exhausting when mentally drained",
      "Individuals seeking a playful, tactile reset away from digital screens",
      "Participants wanting to tap into intuition, creative clarity, and perspective",
    ],
    sessionFlow: [
      {
        phase: "Phase 1: Warm-up & Sensory Connection",
        time: "0–15 min",
        desc: "Tactile exploration of pastels and acrylic washes; letting go of the need to draw 'well'.",
      },
      {
        phase: "Phase 2: Guided Intuitive Expression",
        time: "15–40 min",
        desc: "Color-mapping current thoughts, spontaneous mark-making, and emotional externalization.",
      },
      {
        phase: "Phase 3: Deepening & Integration",
        time: "40–50 min",
        desc: "Adding layers, texture, or soothing repetitive patterns to quiet racing thoughts.",
      },
      {
        phase: "Phase 4: Reflection & Anchoring",
        time: "50–60 min",
        desc: "Private journaling on what emerged and taking home your personal reflection piece.",
      },
    ],
    environmentGlimpse: [
      {
        title: "Natural Daylight Studio",
        desc: "Generous window light, solid wood communal tables, and zero fluorescent glare.",
        icon: "☀️",
      },
      {
        title: "Tactile Art Supplies",
        desc: "Premium heavyweight canvas, artist-grade earth pastels, watercolors, and air-dry clay.",
        icon: "🎨",
      },
      {
        title: "No-Judgment Zone",
        desc: "Zero critique, evaluation, or aesthetic expectations — process over performance.",
        icon: "🤝",
      },
    ],
    artworkSamples: [
      {
        title: "Emotion Spectrum Mapping",
        medium: "Watercolor & Soft Pastel on Raw Canvas",
        desc: "Blending deep indigo into ochre and warm terracotta to represent the shift from stress to grounded clarity.",
        color: "#C45B32",
      },
      {
        title: "Rhythmic Concentric Circles",
        medium: "Earth Pigment Ink on Heavy Paper",
        desc: "Soothing repetitive mark-making that synchronizes fine motor movement with calm breathing.",
        color: "#D98268",
      },
      {
        title: "Tactile Clay Grounding Anchor",
        medium: "Air-dry Terracotta Clay",
        desc: "Non-verbal hand sculpting to anchor racing thoughts through physical texture and weight.",
        color: "#B9C6A5",
      },
    ],
    availableSlots: [
      {
        id: "slot-eu-1",
        date: "Wednesday, Nov 25, 2026",
        time: "16:00 – 17:00",
        seatsLeft: 5,
        venue: "CortiQuant Wellbeing Studio, Suite 400",
      },
      {
        id: "slot-eu-2",
        date: "Monday, Nov 30, 2026",
        time: "14:00 – 15:00",
        seatsLeft: 3,
        venue: "CortiQuant Wellbeing Studio, Suite 400",
      },
    ],
  },
}

// ── 3D Claymorphism Illustration 1: Acoustic Unwind ───────────────────────────

export function AcousticClayIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
    >
      <defs>
        {/* Soft Clay Ambient Background Gradient */}
        <radialGradient id="ac-bg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="55%" stopColor="#F8EFE4" />
          <stop offset="100%" stopColor="#EFE3D3" />
        </radialGradient>

        {/* Clay Bevel & Drop Shadow Filters */}
        <filter id="ac-clay-lg" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#796452" floodOpacity="0.14" />
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#C45B32" floodOpacity="0.08" />
        </filter>
        <filter id="ac-clay-md" x="-25%" y="-25%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#796452" floodOpacity="0.12" />
        </filter>
        <filter id="ac-clay-sm" x="-30%" y="-30%" width="170%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#796452" floodOpacity="0.10" />
        </filter>

        {/* Guitar Body Clay Gradients */}
        <linearGradient id="guitar-clay-body" x1="180" y1="90" x2="380" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E89A75" />
          <stop offset="35%" stopColor="#D98268" />
          <stop offset="80%" stopColor="#C45B32" />
          <stop offset="100%" stopColor="#9C4422" />
        </linearGradient>

        <linearGradient id="guitar-clay-top" x1="220" y1="110" x2="350" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F7CEB6" />
          <stop offset="40%" stopColor="#E59976" />
          <stop offset="100%" stopColor="#C45B32" />
        </linearGradient>

        <radialGradient id="soundhole-depth" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#3F3127" />
          <stop offset="85%" stopColor="#5C4738" />
          <stop offset="100%" stopColor="#796452" />
        </radialGradient>

        {/* Neck and Fretboard */}
        <linearGradient id="neck-grad" x1="160" y1="40" x2="230" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8C7360" />
          <stop offset="50%" stopColor="#796452" />
          <stop offset="100%" stopColor="#5D4B3D" />
        </linearGradient>

        {/* Notes clay gradients */}
        <linearGradient id="note-terracotta" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E58C6A" />
          <stop offset="100%" stopColor="#C45B32" />
        </linearGradient>
        <linearGradient id="note-sage" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D3DFC3" />
          <stop offset="100%" stopColor="#B9C6A5" />
        </linearGradient>
        <linearGradient id="note-peach" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3DCC8" />
        </linearGradient>

        {/* Microphone Gradients */}
        <linearGradient id="mic-head" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F5E4D4" />
          <stop offset="100%" stopColor="#D9BFAB" />
        </linearGradient>
        <linearGradient id="mic-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8C7360" />
          <stop offset="100%" stopColor="#5A4739" />
        </linearGradient>
      </defs>

      {/* Background Soft Clay Base */}
      <rect width="640" height="360" fill="url(#ac-bg)" />

      {/* Soft Ambient Clay Light Halo & Ripple Rings */}
      <g opacity="0.6">
        <circle cx="310" cy="180" r="160" stroke="#F3DCC8" strokeWidth="2" strokeDasharray="6 8" />
        <circle cx="310" cy="180" r="120" stroke="#B9C6A5" strokeWidth="2.5" strokeOpacity="0.45" />
        <circle cx="310" cy="180" r="80" stroke="#D98268" strokeWidth="1.5" strokeOpacity="0.35" />
      </g>

      {/* Floating Soft Clay Ambient Bubbles/Spheres */}
      <g filter="url(#ac-clay-sm)">
        {/* Soft Sage Sphere */}
        <circle cx="110" cy="110" r="22" fill="url(#note-sage)" />
        <ellipse cx="104" cy="102" rx="7" ry="4" fill="#FFFFFF" fillOpacity="0.55" transform="rotate(-30 104 102)" />

        {/* Soft Peach Sphere */}
        <circle cx="525" cy="85" r="16" fill="url(#note-peach)" />
        <ellipse cx="521" cy="79" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.75" transform="rotate(-30 521 79)" />

        {/* Small Terracotta Sphere */}
        <circle cx="550" cy="270" r="18" fill="url(#note-terracotta)" />
        <ellipse cx="544" cy="264" rx="6" ry="3.5" fill="#FFFFFF" fillOpacity="0.5" transform="rotate(-30 544 264)" />

        {/* Sage Mini Sphere */}
        <circle cx="95" cy="265" r="13" fill="url(#note-sage)" />
        <ellipse cx="91" cy="260" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.6" transform="rotate(-30 91 260)" />
      </g>

      {/* ── Soft Sculpted Clay Acoustic Guitar ───────────────────────────── */}
      <g filter="url(#ac-clay-lg)" transform="translate(15, 0)">
        {/* Guitar Drop Shadow Layer */}
        <path
          d="M260 145 C230 115 205 130 195 160 C185 190 205 215 220 228 C200 248 185 275 195 305 C208 340 250 355 295 345 C340 335 375 305 380 265 C385 225 355 200 340 190 C355 170 360 140 338 120 C315 100 285 120 260 145 Z"
          fill="#8A3B1C"
          opacity="0.22"
          transform="translate(6, 12)"
        />

        {/* Main Sculpted Clay Body */}
        <path
          d="M260 145 C230 115 205 130 195 160 C185 190 205 215 220 228 C200 248 185 275 195 305 C208 340 250 355 295 345 C340 335 375 305 380 265 C385 225 355 200 340 190 C355 170 360 140 338 120 C315 100 285 120 260 145 Z"
          fill="url(#guitar-clay-body)"
        />

        {/* Inner Clay Top Board with Soft Inset Rim */}
        <path
          d="M262 152 C235 124 214 137 205 163 C196 189 213 211 226 223 C208 241 195 266 204 294 C215 325 252 338 291 329 C330 320 360 293 365 258 C370 222 344 200 330 191 C343 173 348 147 328 129 C308 111 283 129 262 152 Z"
          fill="url(#guitar-clay-top)"
        />

        {/* Specular 3D Clay Highlights on Guitar Body */}
        <path
          d="M210 162 C218 140 236 128 258 135 C242 142 230 156 226 172 C223 182 225 192 227 202 C217 190 207 175 210 162 Z"
          fill="#FFFFFF"
          fillOpacity="0.45"
        />
        <path
          d="M212 290 C206 270 215 252 225 242 C222 255 223 270 232 284 C242 300 260 314 282 322 C255 320 226 312 212 290 Z"
          fill="#FFFFFF"
          fillOpacity="0.35"
        />

        {/* Soundhole with Soft Rosette Rim */}
        <circle cx="282" cy="225" r="34" fill="#F8F1E6" />
        <circle cx="282" cy="225" r="30" fill="#EAD4C0" />
        <circle cx="282" cy="225" r="26" fill="url(#soundhole-depth)" />
        <ellipse cx="276" cy="216" rx="18" ry="10" fill="#241B15" fillOpacity="0.8" />

        {/* Clay Bridge & Saddle */}
        <rect x="250" y="280" width="65" height="15" rx="7.5" fill="#5C4738" filter="url(#ac-clay-sm)" />
        <rect x="258" y="283" width="49" height="4" rx="2" fill="#F8F1E6" />
        {/* Bridge Pins */}
        <circle cx="262" cy="290" r="1.8" fill="#F8F1E6" />
        <circle cx="270" cy="290" r="1.8" fill="#F8F1E6" />
        <circle cx="278" cy="290" r="1.8" fill="#F8F1E6" />
        <circle cx="286" cy="290" r="1.8" fill="#F8F1E6" />
        <circle cx="294" cy="290" r="1.8" fill="#F8F1E6" />
        <circle cx="302" cy="290" r="1.8" fill="#F8F1E6" />

        {/* Fretboard & Neck Extending Diagonally Up-Left */}
        <path d="M260 148 L170 54 L152 70 L242 165 Z" fill="url(#neck-grad)" filter="url(#ac-clay-sm)" />
        {/* Rounded Frets */}
        <line x1="245" y1="133" x2="231" y2="147" stroke="#F8F1E6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="228" y1="115" x2="214" y2="129" stroke="#F8F1E6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="211" y1="97" x2="197" y2="111" stroke="#F8F1E6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="194" y1="79" x2="180" y2="93" stroke="#F8F1E6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="177" y1="61" x2="163" y2="75" stroke="#F8F1E6" strokeWidth="1.5" strokeLinecap="round" />

        {/* Puffy Clay Headstock with Rounded Tuning Pegs */}
        <rect x="135" y="22" width="30" height="48" rx="10" transform="rotate(-46 135 22)" fill="#8C4222" />
        <rect x="138" y="25" width="24" height="42" rx="7" transform="rotate(-46 138 25)" fill="#C45B32" />
        {/* Tuning pegs */}
        <circle cx="120" cy="40" r="4.5" fill="#F8F1E6" filter="url(#ac-clay-sm)" />
        <circle cx="132" cy="26" r="4.5" fill="#F8F1E6" filter="url(#ac-clay-sm)" />
        <circle cx="144" cy="12" r="4.5" fill="#F8F1E6" filter="url(#ac-clay-sm)" />
        <circle cx="146" cy="62" r="4.5" fill="#F8F1E6" filter="url(#ac-clay-sm)" />
        <circle cx="158" cy="48" r="4.5" fill="#F8F1E6" filter="url(#ac-clay-sm)" />
        <circle cx="170" cy="34" r="4.5" fill="#F8F1E6" filter="url(#ac-clay-sm)" />

        {/* Glistening Clay Strings */}
        <line x1="154" y1="52" x2="282" y2="284" stroke="#FFFDF9" strokeWidth="1.2" strokeOpacity="0.85" />
        <line x1="156" y1="50" x2="285" y2="284" stroke="#FFFDF9" strokeWidth="1.2" strokeOpacity="0.85" />
        <line x1="158" y1="48" x2="288" y2="284" stroke="#FFFDF9" strokeWidth="1.2" strokeOpacity="0.85" />
        <line x1="160" y1="46" x2="291" y2="284" stroke="#FFFDF9" strokeWidth="1.2" strokeOpacity="0.85" />
      </g>

      {/* ── Small Vintage 3D Clay Microphone ────────────────────────────── */}
      <g filter="url(#ac-clay-md)" transform="translate(420, 140)">
        {/* Base and Stand */}
        <ellipse cx="40" cy="155" rx="36" ry="12" fill="#796452" opacity="0.18" />
        <ellipse cx="40" cy="150" rx="30" ry="10" fill="url(#mic-body)" />
        <ellipse cx="40" cy="148" rx="24" ry="7" fill="#8C7360" />
        {/* Vertical Gooseneck Stem */}
        <rect x="36" y="55" width="8" height="95" rx="4" fill="url(#mic-body)" />
        <rect x="38" y="55" width="3" height="95" rx="1.5" fill="#FFFFFF" fillOpacity="0.35" />

        {/* Clay Joint Ball */}
        <circle cx="40" cy="55" r="9" fill="#B9C6A5" />
        <ellipse cx="38" cy="52" rx="3" ry="2" fill="#FFFFFF" fillOpacity="0.6" />

        {/* Vintage Pill Capsule Mic Head */}
        <g transform="translate(18, -35)">
          <rect x="6" y="10" width="32" height="60" rx="16" fill="url(#mic-head)" filter="url(#ac-clay-sm)" />
          {/* Outer Ring Bezel */}
          <rect x="3" y="36" width="38" height="8" rx="4" fill="#C45B32" />
          <rect x="6" y="38" width="32" height="4" rx="2" fill="#D98268" />
          {/* Subtle Vintage Grille Lines */}
          <line x1="12" y1="20" x2="32" y2="20" stroke="#796452" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          <line x1="10" y1="26" x2="34" y2="26" stroke="#796452" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          <line x1="10" y1="32" x2="34" y2="32" stroke="#796452" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          <line x1="10" y1="48" x2="34" y2="48" stroke="#796452" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          <line x1="10" y1="54" x2="34" y2="54" stroke="#796452" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          <line x1="12" y1="60" x2="32" y2="60" stroke="#796452" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
          {/* Specular pill gleam */}
          <path d="M12 16 Q22 13 32 16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.7" />
        </g>
      </g>

      {/* ── Floating 3D Sculpted Clay Musical Notes ─────────────────────── */}
      {/* Note 1: Eighth Note Pair in Terracotta (Top Right) */}
      <g filter="url(#ac-clay-md)" transform="translate(370, 45) rotate(12)">
        <ellipse cx="25" cy="55" rx="12" ry="9" fill="url(#note-terracotta)" transform="rotate(-20 25 55)" />
        <ellipse cx="22" cy="52" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.6" transform="rotate(-20 22 52)" />

        <ellipse cx="65" cy="45" rx="12" ry="9" fill="url(#note-terracotta)" transform="rotate(-20 65 45)" />
        <ellipse cx="62" cy="42" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.6" transform="rotate(-20 62 42)" />

        {/* Stems */}
        <rect x="31" y="15" width="5.5" height="42" rx="2.5" fill="url(#note-terracotta)" />
        <rect x="71" y="5" width="5.5" height="42" rx="2.5" fill="url(#note-terracotta)" />
        {/* Beam */}
        <polygon points="31,15 76,5 76,14 31,24" fill="#A84520" />
        <polygon points="31,13 76,3 76,7 31,17" fill="#FFFFFF" fillOpacity="0.45" />
      </g>

      {/* Note 2: Quarter Note in Soft Sage (Bottom Left) */}
      <g filter="url(#ac-clay-md)" transform="translate(130, 185) rotate(-16)">
        <ellipse cx="20" cy="45" rx="13" ry="10" fill="url(#note-sage)" transform="rotate(-15 20 45)" />
        <ellipse cx="17" cy="41" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.75" transform="rotate(-15 17 41)" />
        <rect x="27" y="10" width="5.5" height="36" rx="2.5" fill="url(#note-sage)" />
        <rect x="28" y="10" width="2" height="34" rx="1" fill="#FFFFFF" fillOpacity="0.6" />
        {/* Soft curl flag */}
        <path d="M32 10 Q46 14 42 28 Q37 20 32 18 Z" fill="#9FB089" />
      </g>

      {/* Note 3: Mini Quarter Note in Muted Coral (Floating High Left) */}
      <g filter="url(#ac-clay-sm)" transform="translate(160, 40) rotate(8)">
        <ellipse cx="14" cy="30" rx="9" ry="7" fill="url(#note-terracotta)" transform="rotate(-15 14 30)" />
        <ellipse cx="12" cy="27" rx="3.5" ry="2" fill="#FFFFFF" fillOpacity="0.65" />
        <rect x="19" y="8" width="4" height="23" rx="2" fill="url(#note-terracotta)" />
      </g>

      {/* Note 4: Single Note in Warm Cream (Center Top) */}
      <g filter="url(#ac-clay-sm)" transform="translate(290, 30) rotate(-6)">
        <ellipse cx="12" cy="24" rx="8" ry="6" fill="#F8F1E6" />
        <ellipse cx="10" cy="22" rx="3" ry="1.5" fill="#FFFFFF" fillOpacity="0.8" />
        <rect x="17" y="6" width="3.5" height="19" rx="1.5" fill="#D9C7B2" />
        <path d="M20 6 Q29 9 27 18 Q23 13 20 12 Z" fill="#D9C7B2" />
      </g>
    </svg>
  )
}

// ── 3D Claymorphism Illustration 2: Express & Unwind ──────────────────────────

export function ExpressClayIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
    >
      <defs>
        {/* Background Soft Studio Gradient */}
        <radialGradient id="ex-bg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="55%" stopColor="#F8EDE1" />
          <stop offset="100%" stopColor="#EFE3D5" />
        </radialGradient>

        {/* Clay Dropshadows */}
        <filter id="ex-clay-lg" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#796452" floodOpacity="0.14" />
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#D98268" floodOpacity="0.08" />
        </filter>
        <filter id="ex-clay-md" x="-25%" y="-25%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#796452" floodOpacity="0.12" />
        </filter>
        <filter id="ex-clay-sm" x="-30%" y="-30%" width="170%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#796452" floodOpacity="0.10" />
        </filter>

        {/* Palette Wood Clay Gradient */}
        <linearGradient id="palette-grad" x1="280" y1="160" x2="520" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FAF1E6" />
          <stop offset="35%" stopColor="#F3DCC8" />
          <stop offset="100%" stopColor="#DEC0A7" />
        </linearGradient>

        {/* Paint Blobs 3D Gradients */}
        <radialGradient id="paint-terracotta" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F3A585" />
          <stop offset="45%" stopColor="#C45B32" />
          <stop offset="100%" stopColor="#8A3716" />
        </radialGradient>
        <radialGradient id="paint-coral" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F9BCAB" />
          <stop offset="45%" stopColor="#D98268" />
          <stop offset="100%" stopColor="#9C4D38" />
        </radialGradient>
        <radialGradient id="paint-sage" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#E2ECCE" />
          <stop offset="45%" stopColor="#B9C6A5" />
          <stop offset="100%" stopColor="#7E8D68" />
        </radialGradient>
        <radialGradient id="paint-cream" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#F8F1E6" />
          <stop offset="100%" stopColor="#D5C5B0" />
        </radialGradient>
        <radialGradient id="paint-peach" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFF2E7" />
          <stop offset="50%" stopColor="#F3DCC8" />
          <stop offset="100%" stopColor="#C9A88F" />
        </radialGradient>

        {/* Canvas & Easel */}
        <linearGradient id="canvas-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8F1E6" />
        </linearGradient>
        <linearGradient id="easel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9E8570" />
          <stop offset="100%" stopColor="#796452" />
        </linearGradient>
        <linearGradient id="brush-handle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8C7360" />
          <stop offset="100%" stopColor="#5E4C3E" />
        </linearGradient>
      </defs>

      {/* Background Soft Studio Canvas Base */}
      <rect width="640" height="360" fill="url(#ex-bg)" />

      {/* Studio Radial Rays / Soft Rings */}
      <g opacity="0.55">
        <circle cx="340" cy="180" r="150" stroke="#F3DCC8" strokeWidth="2" strokeDasharray="5 7" />
        <circle cx="340" cy="180" r="110" stroke="#B9C6A5" strokeWidth="2" strokeOpacity="0.5" />
        <circle cx="340" cy="180" r="75" stroke="#D98268" strokeWidth="1.5" strokeOpacity="0.4" />
      </g>

      {/* ── 3D Sculpted Clay Canvas on Mini Easel (Left) ────────────────── */}
      <g filter="url(#ex-clay-lg)" transform="translate(65, 35)">
        {/* Easel Wooden Legs */}
        <rect x="85" y="10" width="10" height="280" rx="5" fill="url(#easel-grad)" transform="rotate(-7 85 10)" />
        <rect x="155" y="10" width="10" height="280" rx="5" fill="url(#easel-grad)" transform="rotate(7 155 10)" />
        <rect x="120" y="5" width="10" height="285" rx="5" fill="#5E4C3E" />
        {/* Easel Horizontal Shelf Bar */}
        <rect x="40" y="225" width="170" height="16" rx="8" fill="#796452" filter="url(#ex-clay-sm)" />
        <rect x="42" y="226" width="166" height="5" rx="2.5" fill="#FFFFFF" fillOpacity="0.3" />

        {/* Sculpted Thick Clay Canvas */}
        <g transform="translate(30, 25)">
          {/* Canvas Drop Bevel Edge */}
          <rect x="4" y="6" width="180" height="195" rx="18" fill="#DCCABB" />
          {/* Front Canvas Face */}
          <rect x="0" y="0" width="180" height="195" rx="18" fill="url(#canvas-grad)" />
          {/* Top highlight */}
          <path d="M18 4 L162 4" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />

          {/* Abstract Clay Artwork on Canvas (Vibrant Clay Waves) */}
          <path
            d="M25 140 C45 90, 80 130, 115 85 C135 60, 155 80, 160 50"
            stroke="#B9C6A5"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M20 165 C55 135, 95 165, 130 120 C150 95, 165 110, 165 85"
            stroke="#D98268"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M40 180 C80 160, 110 180, 145 145"
            stroke="#C45B32"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Abstract Sun / Core Clay Dot */}
          <circle cx="130" cy="55" r="14" fill="#C45B32" />
          <circle cx="126" cy="51" r="4" fill="#FFFFFF" fillOpacity="0.65" />

          {/* Floating mini droplets on canvas */}
          <circle cx="55" cy="65" r="7" fill="#B9C6A5" />
          <circle cx="53" cy="63" r="2" fill="#FFFFFF" fillOpacity="0.7" />
          <circle cx="78" cy="45" r="5" fill="#D98268" />
        </g>
      </g>

      {/* ── Rounded Clay Paint Palette with 3D Blobs (Right) ────────────── */}
      <g filter="url(#ex-clay-lg)" transform="translate(305, 115)">
        {/* Soft Shadow behind Palette */}
        <path
          d="M70 120 C40 80, 70 30, 130 15 C190 0, 260 30, 275 85 C290 140, 245 190, 195 205 C145 220, 130 175, 95 170 C75 165, 85 140, 70 120 Z"
          fill="#8A684C"
          opacity="0.18"
          transform="translate(6, 12)"
        />

        {/* Organic Kidney Palette Clay Body */}
        <path
          d="M70 120 C40 80, 70 30, 130 15 C190 0, 260 30, 275 85 C290 140, 245 190, 195 205 C145 220, 130 175, 95 170 C75 165, 85 140, 70 120 Z"
          fill="url(#palette-grad)"
        />
        {/* Specular Edge Highlight on Palette */}
        <path
          d="M130 18 C185 5, 248 32, 268 80"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />

        {/* Smooth Thumb Hole with Depth */}
        <ellipse cx="102" cy="150" rx="16" ry="22" fill="#EAD5C2" transform="rotate(-20 102 150)" />
        <ellipse cx="104" cy="151" rx="13" ry="18" fill="#F8EDE1" transform="rotate(-20 104 151)" />

        {/* ── 5 Plump 3D Clay Blobs of Paint along the curve ─────────────── */}
        {/* Blob 1: Terracotta (Top Left) */}
        <g filter="url(#ex-clay-sm)">
          <path
            d="M125 36 C138 30, 150 42, 146 54 C142 66, 126 68, 118 58 C110 48, 118 39, 125 36 Z"
            fill="url(#paint-terracotta)"
          />
          <ellipse cx="128" cy="42" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.75" transform="rotate(-30 128 42)" />
        </g>

        {/* Blob 2: Muted Coral (Top Center) */}
        <g filter="url(#ex-clay-sm)">
          <path
            d="M178 30 C192 26, 204 38, 198 50 C192 62, 178 64, 170 54 C162 44, 170 34, 178 30 Z"
            fill="url(#paint-coral)"
          />
          <ellipse cx="180" cy="35" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.75" transform="rotate(-30 180 35)" />
        </g>

        {/* Blob 3: Soft Sage (Top Right) */}
        <g filter="url(#ex-clay-sm)">
          <path
            d="M232 46 C246 42, 256 56, 250 68 C244 80, 228 80, 222 70 C216 60, 224 50, 232 46 Z"
            fill="url(#paint-sage)"
          />
          <ellipse cx="234" cy="52" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.75" transform="rotate(-30 234 52)" />
        </g>

        {/* Blob 4: Warm Cream (Right Mid) */}
        <g filter="url(#ex-clay-sm)">
          <path
            d="M246 95 C258 92, 268 104, 262 116 C256 128, 240 126, 234 116 C228 106, 238 98, 246 95 Z"
            fill="url(#paint-cream)"
          />
          <ellipse cx="248" cy="100" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.85" transform="rotate(-30 248 100)" />
        </g>

        {/* Blob 5: Golden Peach (Bottom Right) */}
        <g filter="url(#ex-clay-sm)">
          <path
            d="M225 145 C238 140, 248 152, 242 164 C236 176, 220 174, 214 164 C208 154, 218 148, 225 145 Z"
            fill="url(#paint-peach)"
          />
          <ellipse cx="227" cy="150" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.85" transform="rotate(-30 227 150)" />
        </g>
      </g>

      {/* ── Rounded Clay Artist Paint Brushes Crossing Scene ───────────── */}
      <g filter="url(#ex-clay-md)" transform="translate(240, 180) rotate(-28)">
        {/* Brush 1: Dipped in Terracotta Paint */}
        <rect x="0" y="10" width="180" height="12" rx="6" fill="url(#brush-handle)" />
        <rect x="10" y="11" width="160" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.3" />
        {/* Metallic Ferrule */}
        <rect x="180" y="8" width="22" height="16" rx="4" fill="#D98268" />
        <rect x="182" y="9" width="18" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.6" />
        {/* Brush Bristles */}
        <path d="M202 9 C212 9, 224 12, 230 16 C224 20, 212 23, 202 23 Z" fill="#E89A75" />
        {/* Wet Paint Tip (Terracotta) */}
        <path d="M216 11 C224 13, 230 16, 230 16 C230 16, 224 19, 216 21 Z" fill="#C45B32" />
        <ellipse cx="222" cy="14" rx="2.5" ry="1.5" fill="#FFFFFF" fillOpacity="0.75" />
      </g>

      <g filter="url(#ex-clay-sm)" transform="translate(290, 225) rotate(-14)">
        {/* Brush 2: Dipped in Sage Paint */}
        <rect x="0" y="6" width="145" height="9" rx="4.5" fill="url(#easel-grad)" />
        <rect x="145" y="4" width="18" height="13" rx="3.5" fill="#B9C6A5" />
        <path d="M163 5 C172 6, 182 10, 188 11 C182 13, 172 16, 163 17 Z" fill="#7E8D68" />
        <circle cx="182" cy="10" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
      </g>

      {/* ── Playful Clay Paint Droplets Floating in Air ────────────────── */}
      <g filter="url(#ex-clay-sm)">
        {/* Droplet 1 (Terracotta) */}
        <circle cx="485" cy="70" r="12" fill="url(#paint-terracotta)" />
        <ellipse cx="481" cy="66" rx="4" ry="2.5" fill="#FFFFFF" fillOpacity="0.7" transform="rotate(-30 481 66)" />

        {/* Droplet 2 (Sage) */}
        <circle cx="530" cy="275" r="15" fill="url(#paint-sage)" />
        <ellipse cx="525" cy="270" rx="5" ry="3" fill="#FFFFFF" fillOpacity="0.75" transform="rotate(-30 525 270)" />

        {/* Droplet 3 (Coral) */}
        <circle cx="105" cy="80" r="10" fill="url(#paint-coral)" />
        <ellipse cx="102" cy="77" rx="3" ry="2" fill="#FFFFFF" fillOpacity="0.65" transform="rotate(-30 102 77)" />

        {/* Tiny Droplet 4 (Peach) */}
        <circle cx="280" cy="50" r="8" fill="url(#paint-peach)" />
        <ellipse cx="277" cy="47" rx="2.5" ry="1.5" fill="#FFFFFF" fillOpacity="0.8" />
      </g>
    </svg>
  )
}

// ── Web Audio Acoustic Synthesizer ───────────────────────────────────────────

class AcousticAudioEngine {
  private ctx: AudioContext | null = null
  private isRunning = false
  private timer: any = null
  private noteTimer: any = null

  start(onTick: (secs: number) => void, onComplete: () => void) {
    if (this.isRunning) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      this.ctx = new AudioCtx()
      this.isRunning = true

      let currentSecs = 0

      // Dmaj9 -> Gmaj7 -> Bm9 -> Dadd9 soothing progression
      const chordNotes = [
        [146.83, 220.0, 277.18, 369.99], // D3, A3, C#4, F#4
        [196.0, 246.94, 293.66, 369.99], // G3, B3, D4, F#4
        [123.47, 185.0, 220.0, 277.18],  // B2, F#3, A3, C#4
        [146.83, 220.0, 293.66, 440.0],  // D3, A3, D4, A4
      ]

      let chordIdx = 0
      let pluckIdx = 0

      const playAcousticPluck = () => {
        if (!this.ctx || !this.isRunning) return
        const chord = chordNotes[chordIdx]
        const freq = chord[pluckIdx]

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const filter = this.ctx.createBiquadFilter()

        filter.type = "lowpass"
        filter.frequency.setValueAtTime(1600, this.ctx.currentTime)
        filter.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 1.4)

        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start()
        osc.stop(this.ctx.currentTime + 1.8)

        pluckIdx = (pluckIdx + 1) % chord.length
        if (pluckIdx === 0) {
          chordIdx = (chordIdx + 1) % chordNotes.length
        }
      }

      playAcousticPluck()
      this.noteTimer = setInterval(() => {
        if (!this.isRunning) return
        playAcousticPluck()
      }, 480)

      this.timer = setInterval(() => {
        currentSecs += 1
        onTick(currentSecs)
        if (currentSecs >= 42) {
          this.stop()
          onComplete()
        }
      }, 1000)
    } catch {
      // Audio context fallback
    }
  }

  stop() {
    this.isRunning = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.noteTimer) {
      clearInterval(this.noteTimer)
      this.noteTimer = null
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

// ── Instagram Reel Official Inline Embed Player ──────────────────────────────

interface InstagramReelPlayerProps {
  program: ProgramConfig
  onClose?: () => void
  compact?: boolean
}

export function InstagramReelEmbedPlayer({
  program,
  onClose,
  compact = false,
}: InstagramReelPlayerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Ensure Instagram embed.js script is loaded for native embed processing
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).instgrm) {
        try {
          ;(window as any).instgrm.Embeds.process()
        } catch {}
      } else {
        const existing = document.getElementById("cq-instagram-embed-script")
        if (!existing) {
          const s = document.createElement("script")
          s.id = "cq-instagram-embed-script"
          s.src = "https://www.instagram.com/embed.js"
          s.async = true
          s.onload = () => {
            try {
              if ((window as any).instgrm) {
                ;(window as any).instgrm.Embeds.process()
              }
            } catch {}
          }
          document.body.appendChild(s)
        }
      }
    }
  }, [program.instagramReel.reelId])

  return (
    <div className="w-full flex flex-col items-center">
      {/* Player Frame with CortiQuant Claymorphic Styling */}
      <div className={`w-full ${compact ? "max-w-full" : "max-w-[420px]"} rounded-3xl overflow-hidden border-2 border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_14px_36px_rgba(121,100,82,0.10),inset_0_2px_4px_rgba(255,255,255,0.95)]`}>
        {/* Header Bar */}
        <div className="px-4 py-2.5 bg-[#FAF4EB] border-b border-[#F3DCC8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: program.accentColor }}
            />
            <span className="text-[11px] font-bold text-[#3F3127]">
              {program.title} · Official Reel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[#796452] bg-[#F3DCC8] px-2.5 py-0.5 rounded-full border border-[#E0C5AE]">
              Inline Player
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-6 h-6 rounded-full bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] text-[#796452] flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="Return to 3D Clay Scene"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Embedded Iframe Container */}
        <div className="relative w-full aspect-[9/14] sm:aspect-[9/13] max-h-[560px] bg-[#FAF3EA] flex items-center justify-center overflow-hidden">
          {/* Loading Shimmer State */}
          {!iframeLoaded && !hasError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FAF4EB]">
              <div
                className="w-10 h-10 rounded-full border-3 border-[#F3DCC8] animate-spin"
                style={{ borderTopColor: program.accentColor }}
              />
              <div>
                <p className="text-xs font-bold text-[#3F3127]">Connecting to Instagram Reel...</p>
                <p className="text-[11px] text-[#796452] mt-0.5">
                  ID: {program.instagramReel.reelId} · Loading official embed
                </p>
              </div>
            </div>
          )}

          {/* Official Instagram Embedded Player Iframe */}
          <iframe
            ref={iframeRef}
            src={program.instagramReel.embedUrl}
            title={`${program.title} Instagram Reel Preview`}
            className={`w-full h-full border-0 transition-opacity duration-500 ${
              iframeLoaded ? "opacity-100" : "opacity-0"
            }`}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            scrolling="no"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setHasError(true)}
          />
        </div>

        {/* Footer & Fallback Status Bar */}
        <div className="p-3 bg-[#FAF4EB] border-t border-[#F3DCC8] space-y-1.5 text-center">
          <div className="flex items-center justify-between text-[11px] text-[#796452]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Playing inline · No external redirect</span>
            </span>
            <button
              type="button"
              onClick={() => setShowTechnicalDetails((p) => !p)}
              className="text-[#C45B32] hover:underline font-semibold text-[10px] cursor-pointer"
            >
              {showTechnicalDetails ? "Hide Source" : "Reel Source"}
            </button>
          </div>

          {/* Technical Details / Fallback Notice */}
          {showTechnicalDetails && (
            <div className="p-2.5 rounded-xl bg-[#FFFDF9] border border-[#F3DCC8] text-[10px] text-[#796452] text-left space-y-1 animate-fade-in">
              <p>
                <strong className="text-[#3F3127]">Source URL:</strong>{" "}
                <span className="font-mono-data text-[9.5px] break-all">{program.instagramReel.reelUrl}</span>
              </p>
              <p>
                <strong className="text-[#3F3127]">Playback:</strong> Official Meta Instagram iframe player with native play/pause and mute controls.
              </p>
              <p className="text-[9.5px] text-[#796452]/90 leading-relaxed pt-0.5">
                <em>Fallback Notice:</em> If browser privacy extensions or cross-site tracking policies block third-party Instagram frames, direct MP4 hosting will be configured once the reel owner provides the authorized media file. Users will never be redirected to external sites.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Live Acoustic Music Audio Player Component (Light Warm Clay Theme) ─────────

function LiveAcousticMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const engineRef = useRef<AcousticAudioEngine | null>(null)

  useEffect(() => {
    engineRef.current = new AcousticAudioEngine()
    return () => {
      if (engineRef.current) engineRef.current.stop()
    }
  }, [])

  const handleToggle = () => {
    if (!engineRef.current) return
    if (isPlaying) {
      engineRef.current.stop()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      engineRef.current.start(
        (secs) => setElapsed(secs),
        () => {
          setIsPlaying(false)
          setElapsed(0)
        }
      )
    }
  }

  const formatSecs = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${min}:${sec < 10 ? "0" : ""}${sec}`
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF4EB] border border-[#F3DCC8] shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isPlaying ? "Pause Acoustic Music Sample" : "Play Acoustic Music Sample"}
            className="w-11 h-11 rounded-xl bg-[#F3DCC8] hover:bg-[#C45B32] text-[#796452] hover:text-white border border-[#E0C5AE] flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-xs active:scale-95"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#3F3127]">
                Live Acoustic Sound Sample
              </span>
              <span className="text-[10px] font-semibold text-[#C45B32] bg-[#F3DCC8]/70 border border-[#C45B32]/30 px-2.5 py-0.5 rounded-full">
                {isPlaying ? "Playing 42s Sample" : "Click to Listen"}
              </span>
            </div>
            <p className="text-[11px] text-[#796452] mt-0.5">
              Live acoustic guitar & cello harmonic resonance · Recorded unamplified
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono-data text-[#796452] font-semibold">
            {formatSecs(elapsed)} / 0:42
          </span>
        </div>
      </div>

      {/* Animated Soundwave Frequency Bars */}
      <div className="h-8 flex items-end justify-between gap-1 px-2 py-1.5 rounded-xl bg-white/80 border border-[#F3DCC8] overflow-hidden shadow-inner">
        {Array.from({ length: 36 }).map((_, i) => {
          const heightPct = isPlaying
            ? Math.max(15, Math.sin(elapsed * 4 + i * 0.4) * 85)
            : 18 + ((i % 5) * 6)
          const barColor = i % 3 === 0 ? "#B9C6A5" : "#C45B32"
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-300"
              style={{
                height: `${heightPct}%`,
                backgroundColor: barColor,
                opacity: isPlaying ? 0.9 : 0.35,
              }}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#796452] pt-0.5">
        <span>No autoplay · Audio starts only upon your click</span>
        <button
          type="button"
          onClick={() => setIsMuted((p) => !p)}
          className="text-[#796452] hover:text-[#3F3127] font-medium transition-colors"
        >
          {isMuted ? "Audio Muted" : "High-Fidelity Stereo"}
        </button>
      </div>
    </div>
  )
}

// ── 3D Claymorphism Program Card Cover Component ─────────────────────────────

interface ProgramClayCardCoverProps {
  program: ProgramConfig
  onWatchPreview: () => void
  onPlayInline?: () => void
}

export function ProgramClayCardCover({
  program,
  onWatchPreview,
  onPlayInline,
}: ProgramClayCardCoverProps) {
  return (
    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden group/cover border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_8px_24px_rgba(121,100,82,0.08),inset_0_2px_4px_rgba(255,255,255,0.95)]">
      {/* 3D Clay Scene Illustration */}
      <div className="w-full h-full transition-transform duration-700 ease-out group-hover/cover:scale-105">
        {program.id === "acoustic-unwind" ? (
          <AcousticClayIllustration />
        ) : (
          <ExpressClayIllustration />
        )}
      </div>

      {/* Floating Atmosphere Pill (Top Left) */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#F3DCC8] text-[10px] font-semibold text-[#796452] backdrop-blur-md shadow-xs">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: program.accentColor }}
        />
        <span>{program.clayScene.atmosphereTag}</span>
      </div>

      {/* Bottom Content Bar: Caption (Left) & Watch Preview CTA (Right) */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 z-20 flex items-end justify-between gap-2 bg-gradient-to-t from-[#FAF4EB]/95 via-[#FAF4EB]/50 to-transparent">
        <div className="space-y-0.5 max-w-[55%] sm:max-w-[58%] min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-[#3F3127] leading-snug line-clamp-1 drop-shadow-xs">
            {program.clayScene.caption}
          </p>
          <p className="text-[9px] font-semibold tracking-wide uppercase text-[#796452] flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#C45B32]" />
            <span>{program.clayScene.subtitle}</span>
          </p>
        </div>

        {/* CTA Actions: Play in Card or Preview Modal */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onPlayInline && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPlayInline()
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 hover:bg-[#C45B32] hover:text-white border border-[#E0C5AE] text-[10.5px] font-semibold text-[#796452] backdrop-blur-md transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
              title="Play Reel inside this card"
            >
              <span>▶ Play in Card</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onWatchPreview()
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3DCC8]/95 hover:bg-[#C45B32] hover:text-white border border-[#E0C5AE] text-[10.5px] font-semibold text-[#796452] backdrop-blur-md transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>▶ Watch Preview</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detail Page 3D Clay Atmosphere Showcase Component ────────────────────────

interface SessionAtmosphereClayShowcaseProps {
  program: ProgramConfig
  onWatchPreview: () => void
}

export function SessionAtmosphereClayShowcase({
  program,
  onWatchPreview,
}: SessionAtmosphereClayShowcaseProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">✨</span>
          <div>
            <h3 className="text-sm font-bold text-[#3F3127] flex items-center gap-2">
              <span>Claymorphic Studio Atmosphere</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3DCC8] text-[#C45B32] border border-[#E0C5AE]">
                3D Clay
              </span>
            </h3>
            <p className="text-[11px] text-[#796452] mt-0.5">
              Tactile, sculpted visual interpretation of the {program.title} physical space
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs font-semibold text-[#796452] hover:text-[#3F3127] transition-colors flex items-center gap-1 cursor-pointer bg-[#F3DCC8]/70 hover:bg-[#F3DCC8] border border-[#E0C5AE] px-3 py-1.5 rounded-xl shadow-xs"
        >
          <span>{isExpanded ? "Standard View" : "Expand Scene"}</span>
          <span>{isExpanded ? "⊖" : "⊕"}</span>
        </button>
      </div>

      {/* 16:9 Landscape 3D Clay Scene Hero Showcase */}
      <div
        className={`relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#F3DCC8] bg-[#FAF3EA] shadow-inner group/hero ${
          isExpanded ? "max-h-[520px]" : ""
        }`}
      >
        <div className="w-full h-full transition-transform duration-700 ease-out group-hover/hero:scale-105">
          {program.id === "acoustic-unwind" ? (
            <AcousticClayIllustration />
          ) : (
            <ExpressClayIllustration />
          )}
        </div>

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/95 border border-[#F3DCC8] text-[#3F3127] shadow-xs backdrop-blur-md">
            ✦ {program.clayScene.atmosphereTag}
          </span>
          <span className="text-[10px] font-medium text-[#796452] bg-white/85 px-2.5 py-1 rounded-full border border-[#F3DCC8] backdrop-blur-md hidden sm:inline-block">
            {program.venue}
          </span>
        </div>

        {/* Bottom Floating Bar */}
        <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-gradient-to-t from-[#FAF4EB]/95 via-[#FAF4EB]/50 to-transparent">
          <div className="space-y-0.5 max-w-md">
            <p className="text-xs sm:text-sm font-bold text-[#3F3127] leading-snug">
              {program.clayScene.caption}
            </p>
            <p className="text-[10px] text-[#796452] leading-relaxed">
              {program.clayScene.details}
            </p>
          </div>

          <button
            type="button"
            onClick={onWatchPreview}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C45B32] hover:bg-[#B34E27] text-white text-xs font-semibold shadow-md hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
          >
            <span>▶ Watch Video Teaser</span>
            <span className="text-[10px] opacity-80 font-mono-data">({program.teaserDurationSecs}s)</span>
          </button>
        </div>
      </div>

      {/* Palette Swatches & Subtext */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#796452] px-1 pt-0.5 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#3F3127]">Studio Palette:</span>
          {program.clayScene.paletteLabels.map((lbl, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium bg-[#FFFDF9] border border-[#F3DCC8] px-2 py-0.5 rounded-full text-[#796452]"
            >
              {lbl}
            </span>
          ))}
        </div>
        <span className="font-mono-data text-[10px] text-[#796452]/80">16:9 3D Claymorphism Scene</span>
      </div>
    </div>
  )
}

// ── Interactive Booking Modal Component (Light Claymorphism) ──────────────────

interface BookingModalProps {
  program: ProgramConfig
  onClose: () => void
  onSuccess: (bookingRef: string, slot: any) => void
}

function BookingModal({ program, onClose, onSuccess }: BookingModalProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    program.availableSlots[0]?.id || ""
  )
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem("cq_user_name") || ""
  )
  const [userEmail, setUserEmail] = useState<string>(
    () => localStorage.getItem("cq_user_email") || ""
  )
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const selectedSlot =
    program.availableSlots.find((s) => s.id === selectedSlotId) ||
    program.availableSlots[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)

    try {
      const token = localStorage.getItem("cq_token")
      const res = await fetch("/api/interventions/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          programName: program.title,
          scheduledDate: selectedSlot?.date,
          timeSlot: selectedSlot?.time,
          venue: selectedSlot?.venue || program.venue,
          facilitator: program.facilitator.name,
          notes,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.bookingRef || `CQ-LAB-${Math.floor(1000 + Math.random() * 9000)}`, selectedSlot)
      } else {
        setErrorMsg(data.message || "Failed to confirm session booking.")
      }
    } catch {
      setErrorMsg("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF4EB] border border-[#F3DCC8] p-6 sm:p-7 shadow-[0_20px_50px_rgba(121,100,82,0.18)] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] text-[#796452] flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-4">
          <span
            className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border"
            style={{
              backgroundColor: program.badgeBg,
              color: program.badgeText,
              borderColor: program.badgeBorder,
            }}
          >
            {program.category}
          </span>
          <h2 className="text-xl font-bold text-[#3F3127] mt-2">Book {program.title}</h2>
          <p className="text-xs text-[#796452] mt-1">
            Complete your seat reservation for this guided experiential recovery cohort.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl text-xs bg-rose-100 text-rose-800 border border-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Slot Selection */}
          <div>
            <label className="block text-[#796452] font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
              Select Cohort Date & Time
            </label>
            <div className="space-y-2">
              {program.availableSlots.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedSlotId === slot.id
                      ? "border-[#C45B32] bg-[#F3DCC8]/50 text-[#3F3127] shadow-xs"
                      : "border-[#F3DCC8] bg-[#FFFDF9] text-[#796452] hover:border-[#D98268]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="slot"
                      value={slot.id}
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                      className="accent-[#C45B32]"
                    />
                    <div>
                      <p className="font-bold text-[#3F3127]">{slot.date}</p>
                      <p className="text-[11px] text-[#796452]">
                        {slot.time} · {slot.venue}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#4A643E] bg-[#B9C6A5]/30 border border-[#B9C6A5]/60 px-2.5 py-0.5 rounded-full">
                    {slot.seatsLeft} seats left
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Participant Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#796452] font-semibold mb-1 text-[10px] uppercase">
                Your Name
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-[#FFFDF9] border border-[#E0C5AE] rounded-xl px-3 py-2 text-[#3F3127] placeholder-[#796452]/50 focus:outline-none focus:border-[#C45B32]"
              />
            </div>
            <div>
              <label className="block text-[#796452] font-semibold mb-1 text-[10px] uppercase">
                Email for Confirmation
              </label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Work Email"
                className="w-full bg-[#FFFDF9] border border-[#E0C5AE] rounded-xl px-3 py-2 text-[#3F3127] placeholder-[#796452]/50 focus:outline-none focus:border-[#C45B32]"
              />
            </div>
          </div>

          {/* Facilitator & Venue Details Recap */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-1 text-[11px] text-[#796452]">
            <p>
              <strong className="text-[#3F3127]">Facilitator:</strong> {program.facilitator.name}
            </p>
            <p>
              <strong className="text-[#3F3127]">Venue:</strong> {selectedSlot?.venue || program.venue}
            </p>
            <p>
              <strong className="text-[#3F3127]">Duration:</strong> {program.duration}
            </p>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[#796452] font-semibold mb-1 text-[10px] uppercase">
              Special Requirements / Accessibility Preferences (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ergonomic floor cushion, sensory sensitivity"
              className="w-full bg-[#FFFDF9] border border-[#E0C5AE] rounded-xl px-3 py-2 text-[#3F3127] placeholder-[#796452]/50 focus:outline-none focus:border-[#C45B32]"
            />
          </div>

          {/* Buttons: Peach Cancel + Terracotta Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-xs font-semibold text-[#796452] bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Securing Seat...</span>
                </>
              ) : (
                <>
                  <span>Confirm Booking</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Booking Confirmation View Component ───────────────────────────────────────

interface BookingConfirmationProps {
  program: ProgramConfig
  bookingRef: string
  slot: any
  onDone: () => void
  onNav: (s: Screen) => void
}

function BookingConfirmation({ program, bookingRef, slot, onDone, onNav }: BookingConfirmationProps) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-[#B9C6A5] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.08),inset_0_2px_4px_rgba(255,255,255,0.9)] text-center space-y-4 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[#B9C6A5]/25 border border-[#B9C6A5]/60 flex items-center justify-center mx-auto text-[#4A643E] text-2xl font-bold shadow-xs">
        ✓
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-bold text-[#4A643E] uppercase tracking-widest">
          Session Reserved
        </span>
        <h2 className="text-2xl font-bold text-[#3F3127]">You're All Set!</h2>
        <p className="text-xs text-[#796452] max-w-md mx-auto">
          Your seat for <strong>{program.title}</strong> has been secured.
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] max-w-md mx-auto text-left space-y-2 text-xs shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#F3DCC8]">
          <span className="text-[#796452]">Booking Reference</span>
          <span className="font-mono-data font-bold text-[#C45B32]">{bookingRef}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#796452]">Date & Time</span>
          <span className="text-[#3F3127] font-medium">{slot?.date || "Upcoming Session"} · {slot?.time || "15:00"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#796452]">Venue</span>
          <span className="text-[#3F3127] font-medium">{slot?.venue || program.venue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#796452]">Facilitator</span>
          <span className="text-[#3F3127] font-medium">{program.facilitator.name}</span>
        </div>
      </div>

      <p className="text-xs text-[#796452] max-w-sm mx-auto leading-relaxed">
        A calendar invitation (.ics) and confirmation email have been delivered to your address.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => onNav("my-sessions")}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] shadow-md cursor-pointer"
        >
          View in My Sessions →
        </button>
        <button
          type="button"
          onClick={onDone}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-[#796452] bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] cursor-pointer"
        >
          Back to Reset Labs
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ResetLabsScreenProps {
  onNav: (s: Screen) => void
  initialProgram?: ResetLabProgramId | null
}

export type ResetLabsTab = "experiences" | "checkin-checkout" | "my-reports"

export default function ResetLabsScreen({ onNav, initialProgram = null }: ResetLabsScreenProps) {
  const [activeTab, setActiveTab] = useState<ResetLabsTab>("experiences")
  const [checkInSessionIdPrefill, setCheckInSessionIdPrefill] = useState<string>("")
  const [selectedProgram, setSelectedProgram] = useState<ResetLabProgramId | null>(initialProgram)
  const [previewModalProgram, setPreviewModalProgram] = useState<ResetLabProgramId | null>(null)
  const [inlinePlayingCard, setInlinePlayingCard] = useState<ResetLabProgramId | null>(null)
  const [bookingModalProgram, setBookingModalProgram] = useState<ResetLabProgramId | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<{ ref: string; slot: any } | null>(null)

  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSessionRecord[]>([])
  const [myRegistrations, setMyRegistrations] = useState<any[]>([])

  // Fetch actual program data and sessions from backend
  const fetchProgramData = useCallback(async () => {
    try {
      const token = localStorage.getItem("cq_token")
      if (!token) return
      const res = await fetch("/api/interventions/programs", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        if (Array.isArray(data.upcomingSessions)) {
          setUpcomingSessions(data.upcomingSessions)
        }
        if (Array.isArray(data.myRegistrations)) {
          setMyRegistrations(data.myRegistrations)
        }
      }
    } catch {
      // Graceful fallback
    }
  }, [])

  useEffect(() => {
    fetchProgramData()
  }, [fetchProgramData])

  // Filter actual upcoming sessions for a specific program
  const getSessionsForProgram = (programName: string) => {
    return upcomingSessions.filter(
      (s) => s.interventionName?.toLowerCase() === programName.toLowerCase()
    )
  }

  // Check if current user is registered for program
  const isUserRegistered = (programName: string) => {
    return myRegistrations.some(
      (reg) => reg.interventionName?.toLowerCase() === programName.toLowerCase()
    )
  }

  // ── Render Dedicated Detail View ───────────────────────────────────────────

  if (selectedProgram) {
    const program = RESET_LAB_PROGRAMS[selectedProgram]
    const dbSessions = getSessionsForProgram(program.title)
    const isRegistered = isUserRegistered(program.title)

    return (
      <div className="flex-1 overflow-y-auto pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] relative bg-[#FAF4EB]">
        {/* Ambient atmospheric glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
            style={{
              background:
                selectedProgram === "acoustic-unwind"
                  ? "radial-gradient(circle, rgba(243,220,200,0.5) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(185,198,165,0.4) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <div className="relative px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 max-w-4xl mx-auto space-y-6">
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setSelectedProgram(null)
              setConfirmedBooking(null)
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#796452] hover:text-[#3F3127] transition-colors cursor-pointer group"
          >
            <span className="w-8 h-8 rounded-full bg-[#F3DCC8] border border-[#E0C5AE] flex items-center justify-center group-hover:bg-[#EAD0B8] transition-colors shadow-xs">
              <svg className="w-4 h-4 text-[#796452]" fill="none" viewBox="0 0 16 16" stroke="currentColor">
                <path d="M10 4L6 8l4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Back to Reset Labs</span>
          </button>

          {/* Program Hero Header */}
          <div
            className="rounded-3xl p-6 sm:p-8 border relative overflow-hidden shadow-[0_12px_32px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)]"
            style={{
              background: "#FAF4EB",
              borderColor: "#F3DCC8",
            }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="text-[11px] font-bold px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: program.badgeBg,
                  color: program.badgeText,
                  borderColor: program.badgeBorder,
                }}
              >
                {program.category}
              </span>
              {program.duration && (
                <span className="text-[11px] font-mono-data text-[#796452] bg-white/80 border border-[#F3DCC8] px-2.5 py-0.5 rounded-full shadow-xs">
                  ⏱ {program.duration}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#3F3127] tracking-tight mb-2">
              {program.title}
            </h1>

            <p className="text-sm sm:text-base text-[#796452] leading-relaxed mb-4 max-w-2xl font-normal">
              {program.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#796452] pt-3 border-t border-[#F3DCC8]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C45B32]" />
                <span className="font-semibold text-[#3F3127]">Facilitated by {program.facilitator.name}</span>
              </span>
              <span>·</span>
              <span>{program.venue}</span>
            </div>
          </div>

          {/* ── SECTION 2: EXPERIENCE PREVIEW ─────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#3F3127] flex items-center gap-2">
                  <span>🎨</span>
                  <span>Experience Preview</span>
                </h2>
                <p className="text-xs text-[#796452] mt-0.5">
                  Visual glimpse and audio walkthrough of the {program.title} session
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#C45B32] bg-[#F3DCC8]/70 border border-[#C45B32]/30 px-3 py-1 rounded-full">
                Clay Scene & Media
              </span>
            </div>

            {/* 16:9 High-Resolution 3D Clay Scene Showcase */}
            <SessionAtmosphereClayShowcase
              program={program}
              onWatchPreview={() => {
                const teaserEl = document.getElementById("teaser-video-player-container")
                if (teaserEl) {
                  teaserEl.scrollIntoView({ behavior: "smooth" })
                }
              }}
            />

            {/* Official Instagram Reel Embedded Player */}
            <div id="teaser-video-player-container" className="pt-2">
              <InstagramReelEmbedPlayer program={program} />
            </div>

            {/* Audio Sample Player (Acoustic Unwind Exclusive) */}
            {program.id === "acoustic-unwind" && <LiveAcousticMusicPlayer />}

            {/* Visual Glimpse of the Session Environment */}
            <div className="p-5 sm:p-6 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#3F3127] flex items-center gap-2">
                  <span>🕯️</span>
                  <span>Session Environment Glimpse</span>
                </h3>
                <span className="text-[10px] font-semibold text-[#796452]">Studio Elements</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {program.environmentGlimpse.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-1.5 shadow-xs">
                    <span className="text-2xl leading-none">{item.icon}</span>
                    <p className="text-xs font-bold text-[#3F3127]">{item.title}</p>
                    <p className="text-[11px] text-[#796452] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Artwork & Creative Activities (Express & Unwind Exclusive) */}
            {program.id === "express-unwind" && program.artworkSamples && (
              <div className="p-5 sm:p-6 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#3F3127] flex items-center gap-2">
                      <span>🎨</span>
                      <span>Sample Artwork & Creative Activities</span>
                    </h3>
                    <p className="text-[11px] text-[#796452] mt-0.5">
                      Workshop glimpses & participant exploration
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {program.artworkSamples.map((art, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] space-y-2 relative overflow-hidden shadow-xs"
                    >
                      <div
                        className="w-full h-20 rounded-xl flex items-center justify-center text-xs font-semibold text-[#3F3127] shadow-inner"
                        style={{
                          backgroundColor: `${art.color}22`,
                          border: `1.5px solid ${art.color}40`,
                        }}
                      >
                        <span className="px-2.5 py-1 rounded-md bg-white/90 text-[10px] font-mono-data border border-[#F3DCC8] text-[#796452]">
                          {art.medium}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#3F3127] leading-snug">{art.title}</p>
                      <p className="text-[11px] text-[#796452] leading-relaxed">{art.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session Flow Timeline */}
            <div className="p-5 sm:p-6 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-3">
              <h3 className="text-sm font-bold text-[#3F3127] flex items-center gap-2">
                <span>⏱</span>
                <span>Session Flow Walkthrough</span>
              </h3>
              <div className="space-y-2.5 pt-1">
                {program.sessionFlow.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] shadow-xs"
                  >
                    <span className="text-xs font-bold text-[#C45B32] min-w-[70px] pt-0.5 font-mono-data">
                      {step.time}
                    </span>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#3F3127]">{step.phase}</p>
                      <p className="text-[11px] text-[#796452] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION 3: SESSION INFORMATION & BOOKING FLOW ─────────────────── */}
          <div className="p-6 sm:p-7 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_12px_28px_rgba(121,100,82,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#3F3127]">Verified Session Schedule</h2>
                <p className="text-xs text-[#796452] mt-0.5">
                  Select an upcoming cohort to secure your seat
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/80 border border-[#F3DCC8] text-[#796452] shadow-xs">
                {program.availableSlots.length} Cohorts Open
              </span>
            </div>

            {/* Facilitator & Venue Card */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <p className="text-sm font-bold text-[#3F3127]">{program.facilitator.name}</p>
                  <span className="text-[10px] text-[#C45B32] font-semibold bg-[#F3DCC8]/70 px-2.5 py-0.5 rounded-full border border-[#C45B32]/30">
                    {program.facilitator.credentials}
                  </span>
                </div>
                <p className="text-xs text-[#796452] max-w-xl leading-relaxed">
                  {program.facilitator.bio}
                </p>
              </div>
              <div className="text-xs text-[#796452] sm:text-right flex-shrink-0">
                <p className="font-bold text-[#3F3127]">{program.duration} Session</p>
                <p className="text-[11px] text-[#796452]">Max 8 participants per cohort</p>
              </div>
            </div>

            {/* Available Session Slots */}
            <div className="space-y-3">
              {program.availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] hover:border-[#C45B32] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#3F3127]">{slot.date}</p>
                    <p className="text-xs text-[#796452]">
                      Time: <strong className="text-[#3F3127]">{slot.time}</strong> · Venue: {slot.venue}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-[#4A643E] bg-[#B9C6A5]/30 border border-[#B9C6A5]/60 px-2.5 py-1 rounded-full">
                      {slot.seatsLeft} seats left
                    </span>
                    <button
                      type="button"
                      onClick={() => setBookingModalProgram(program.id)}
                      className="text-xs px-4 py-2.5 rounded-xl font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] cursor-pointer shadow-md active:scale-95 transition-transform"
                    >
                      Book Session →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Fallback if no dates exist */}
            {program.availableSlots.length === 0 && (
              <div className="py-7 px-4 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] text-center space-y-2">
                <p className="text-base font-bold text-[#3F3127]">New sessions coming soon.</p>
                <p className="text-xs text-[#796452] max-w-md mx-auto">
                  We are finalizing dates and locations for the next cohort of {program.title}.
                </p>
              </div>
            )}
          </div>

          {/* Booking Confirmation Dialog (if confirmed) */}
          {confirmedBooking && (
            <BookingConfirmation
              program={program}
              bookingRef={confirmedBooking.ref}
              slot={confirmedBooking.slot}
              onDone={() => setConfirmedBooking(null)}
              onNav={onNav}
            />
          )}

          {/* Corporate / Facilitation Inquiry */}
          <div className="p-5 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] text-center space-y-1.5 shadow-xs">
            <p className="text-xs text-[#796452]">
              Organising a dedicated team offsite or department cohort?
            </p>
            <a
              href={`mailto:cortiqsupport@gmail.com?subject=Reset%20Labs%20-%20${encodeURIComponent(program.title)}%20Facilitation`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C45B32] hover:underline"
            >
              <span>Contact facilitation team at cortiqsupport@gmail.com</span>
              <span>→</span>
            </a>
          </div>
        </div>

        {/* Booking Modal */}
        {bookingModalProgram && (
          <BookingModal
            program={program}
            onClose={() => setBookingModalProgram(null)}
            onSuccess={(bookingRef, slot) => {
              setBookingModalProgram(null)
              setConfirmedBooking({ ref: bookingRef, slot })
            }}
          />
        )}
      </div>
    )
  }

  // ── Render Reset Labs Discovery Overview ────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] relative bg-[#FAF4EB]">
      {/* Ambient background soft clay glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(243,220,200,0.5) 0%, transparent 68%)",
            filter: "blur(36px)",
          }}
        />
        <div
          className="absolute top-1/3 -right-24 w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(185,198,165,0.4) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <div className="relative px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 max-w-4xl mx-auto space-y-6">
        {/* Page Heading & Introduction */}
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3DCC8]/70 border border-[#C45B32]/30 mb-2.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#C45B32] animate-pulse" />
            <span className="text-[10px] font-bold text-[#C45B32] uppercase tracking-wider">
              Experiential Wellbeing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3F3127] tracking-tight leading-snug">
            Reset Labs
          </h1>
          <p className="text-sm font-medium text-[#C45B32] mt-1 leading-relaxed">
            Experiences designed to help you pause, express, reconnect and unwind.
          </p>
          <p className="text-xs text-[#796452] mt-2 max-w-2xl leading-relaxed">
            Reset Labs brings together guided experiential wellbeing sessions through music, art, reflection and creative expression.
          </p>
        </div>

        {/* ── Top Navigation Tabs: Experiences | Check-in & Checkout | My Reports ── */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#F3DCC8] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("experiences")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "experiences"
                ? "bg-[#C45B32] text-white shadow-sm"
                : "bg-[#FFFDF9] text-[#796452] hover:bg-[#F3DCC8] border border-[#F3DCC8]"
            }`}
          >
            <span>🎨 Experiential Programs</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCheckInSessionIdPrefill("")
              setActiveTab("checkin-checkout")
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "checkin-checkout"
                ? "bg-[#C45B32] text-white shadow-sm"
                : "bg-[#FFFDF9] text-[#796452] hover:bg-[#F3DCC8] border border-[#F3DCC8]"
            }`}
          >
            <span>🌱 Check-in / Checkout</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("my-reports")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "my-reports"
                ? "bg-[#C45B32] text-white shadow-sm"
                : "bg-[#FFFDF9] text-[#796452] hover:bg-[#F3DCC8] border border-[#F3DCC8]"
            }`}
          >
            <span>📑 My Session Reports</span>
          </button>
        </div>

        {/* ── TAB 1: EXPERIENTIAL PROGRAMS DISCOVERY ────────────────────────── */}
        {activeTab === "experiences" && (
          <div className="space-y-6 animate-fade-in">
            {/* Live Check-in Quick Action Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#FAF4EB] via-[#FFFDF9] to-[#F3DCC8]/40 border border-[#F3DCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-[#F3DCC8] text-[#C45B32] flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
                  🏷️
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#3F3127]">
                    Attending a Live Reset Lab at the Studio?
                  </p>
                  <p className="text-[11px] text-[#796452]">
                    Enter your physical Session ID to complete your Pre-Session Check-in or Post-Session Checkout.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckInSessionIdPrefill("")
                  setActiveTab("checkin-checkout")
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C45B32] hover:bg-[#B34E27] text-white text-xs font-bold shadow-xs cursor-pointer flex-shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Check-in / Checkout</span>
                <span>→</span>
              </button>
            </div>

            {/* Two Premium Program Cards with 3D Claymorphism Experience Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 animate-fade-up">
          {/* Card 1: Acoustic Unwind */}
          <div
            className="rounded-3xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            style={{
              background: "#FAF4EB",
              borderColor: "#F3DCC8",
              boxShadow:
                "0 14px 32px -6px rgba(121, 100, 82, 0.08), 0 4px 12px -2px rgba(121, 100, 82, 0.04), inset 0 2px 4px rgba(255, 255, 255, 0.95)",
            }}
          >
            <div>
              {/* Category and duration header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: RESET_LAB_PROGRAMS["acoustic-unwind"].badgeBg,
                    color: RESET_LAB_PROGRAMS["acoustic-unwind"].badgeText,
                    borderColor: RESET_LAB_PROGRAMS["acoustic-unwind"].badgeBorder,
                  }}
                >
                  {RESET_LAB_PROGRAMS["acoustic-unwind"].category}
                </span>
                {RESET_LAB_PROGRAMS["acoustic-unwind"].duration && (
                  <span className="text-[10px] font-mono-data text-[#796452] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#F3DCC8] shadow-xs">
                    ⏱ {RESET_LAB_PROGRAMS["acoustic-unwind"].duration}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-[#3F3127] hover:text-[#C45B32] transition-colors leading-snug mb-2">
                {RESET_LAB_PROGRAMS["acoustic-unwind"].title}
              </h2>

              {/* Description */}
              <p className="text-xs text-[#796452] leading-relaxed mb-4">
                {RESET_LAB_PROGRAMS["acoustic-unwind"].description}
              </p>

              {/* 16:9 High-Quality 3D Clay Scene Preview OR Inline Instagram Reel Embed */}
              <div className="relative mb-4">
                {inlinePlayingCard === "acoustic-unwind" ? (
                  <InstagramReelEmbedPlayer
                    program={RESET_LAB_PROGRAMS["acoustic-unwind"]}
                    compact
                    onClose={() => setInlinePlayingCard(null)}
                  />
                ) : (
                  <ProgramClayCardCover
                    program={RESET_LAB_PROGRAMS["acoustic-unwind"]}
                    onWatchPreview={() => setPreviewModalProgram("acoustic-unwind")}
                    onPlayInline={() => setInlinePlayingCard("acoustic-unwind")}
                  />
                )}
              </div>

              {/* Availability or Upcoming Session Info */}
              <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] mb-5 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-[11px] text-[#796452]">
                  <span className="w-2 h-2 rounded-full bg-[#C45B32] animate-pulse" />
                  <span className="font-medium">
                    {RESET_LAB_PROGRAMS["acoustic-unwind"].availableSlots.length > 0
                      ? `${RESET_LAB_PROGRAMS["acoustic-unwind"].availableSlots.length} cohorts open for booking`
                      : "New sessions coming soon."}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#C45B32]">Elena Vance, M.Mus.</span>
              </div>
            </div>

            {/* Dual CTA Actions: Soft Peach Secondary + Terracotta Primary */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (inlinePlayingCard === "acoustic-unwind") {
                    setInlinePlayingCard(null)
                  } else {
                    setPreviewModalProgram("acoustic-unwind")
                  }
                }}
                className="flex-1 py-3 px-3 rounded-xl text-xs font-semibold text-[#796452] bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>{inlinePlayingCard === "acoustic-unwind" ? "✕ Close Inline Reel" : "▶ Watch Preview"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProgram("acoustic-unwind")}
                className="flex-1 py-3 px-3 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Explore Session</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 2: Express & Unwind */}
          <div
            className="rounded-3xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            style={{
              background: "#FAF4EB",
              borderColor: "#F3DCC8",
              boxShadow:
                "0 14px 32px -6px rgba(121, 100, 82, 0.08), 0 4px 12px -2px rgba(121, 100, 82, 0.04), inset 0 2px 4px rgba(255, 255, 255, 0.95)",
            }}
          >
            <div>
              {/* Category and duration header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: RESET_LAB_PROGRAMS["express-unwind"].badgeBg,
                    color: RESET_LAB_PROGRAMS["express-unwind"].badgeText,
                    borderColor: RESET_LAB_PROGRAMS["express-unwind"].badgeBorder,
                  }}
                >
                  {RESET_LAB_PROGRAMS["express-unwind"].category}
                </span>
                {RESET_LAB_PROGRAMS["express-unwind"].duration && (
                  <span className="text-[10px] font-mono-data text-[#796452] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#F3DCC8] shadow-xs">
                    ⏱ {RESET_LAB_PROGRAMS["express-unwind"].duration}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-[#3F3127] hover:text-[#D98268] transition-colors leading-snug mb-2">
                {RESET_LAB_PROGRAMS["express-unwind"].title}
              </h2>

              {/* Description */}
              <p className="text-xs text-[#796452] leading-relaxed mb-4">
                {RESET_LAB_PROGRAMS["express-unwind"].description}
              </p>

              {/* 16:9 High-Quality 3D Clay Scene Preview OR Inline Instagram Reel Embed */}
              <div className="relative mb-4">
                {inlinePlayingCard === "express-unwind" ? (
                  <InstagramReelEmbedPlayer
                    program={RESET_LAB_PROGRAMS["express-unwind"]}
                    compact
                    onClose={() => setInlinePlayingCard(null)}
                  />
                ) : (
                  <ProgramClayCardCover
                    program={RESET_LAB_PROGRAMS["express-unwind"]}
                    onWatchPreview={() => setPreviewModalProgram("express-unwind")}
                    onPlayInline={() => setInlinePlayingCard("express-unwind")}
                  />
                )}
              </div>

              {/* Availability or Upcoming Session Info */}
              <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F3DCC8] mb-5 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-[11px] text-[#796452]">
                  <span className="w-2 h-2 rounded-full bg-[#D98268] animate-pulse" />
                  <span className="font-medium">
                    {RESET_LAB_PROGRAMS["express-unwind"].availableSlots.length > 0
                      ? `${RESET_LAB_PROGRAMS["express-unwind"].availableSlots.length} cohorts open for booking`
                      : "New sessions coming soon."}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#D98268]">Marcus Thorne, ATR-BC</span>
              </div>
            </div>

            {/* Dual CTA Actions: Soft Peach Secondary + Terracotta Primary */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (inlinePlayingCard === "express-unwind") {
                    setInlinePlayingCard(null)
                  } else {
                    setPreviewModalProgram("express-unwind")
                  }
                }}
                className="flex-1 py-3 px-3 rounded-xl text-xs font-semibold text-[#796452] bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>{inlinePlayingCard === "express-unwind" ? "✕ Close Inline Reel" : "▶ Watch Preview"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProgram("express-unwind")}
                className="flex-1 py-3 px-3 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Explore Session</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Workplace Wellbeing & Cohort Facilitation Card */}
        <div className="p-6 rounded-3xl border border-[#F3DCC8] bg-[#FAF4EB] shadow-[0_8px_24px_rgba(121,100,82,0.06),inset_0_1px_2px_rgba(255,255,255,0.9)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <h3 className="text-sm font-bold text-[#3F3127]">
                Workplace Wellbeing & Cohort Facilitation
              </h3>
            </div>
            <p className="text-xs text-[#796452] leading-relaxed max-w-xl">
              Interested in organizing an Acoustic Unwind or Express & Unwind session for your department or project team? Contact our wellbeing team for customized facilitation schedules.
            </p>
          </div>

          <a
            href="mailto:cortiqsupport@gmail.com?subject=Reset%20Labs%20-%20Facilitation%20Inquiry"
            className="text-xs px-4 py-2.5 rounded-xl font-semibold text-[#796452] bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer shadow-xs"
          >
            <span>cortiqsupport@gmail.com</span>
            <span>→</span>
          </a>
        </div>
      </div>
      )}

      {/* ── TAB 2: CHECK-IN & CHECKOUT ─────────────────────────────────────── */}
      {activeTab === "checkin-checkout" && (
        <div className="animate-fade-in">
          <ResetLabsCheckInOutView
            initialSessionId={checkInSessionIdPrefill}
            onNavigateToReports={() => setActiveTab("my-reports")}
          />
        </div>
      )}

      {/* ── TAB 3: MY REPORTS ──────────────────────────────────────────────── */}
      {activeTab === "my-reports" && (
        <div className="animate-fade-in">
          <ResetLabsMyReportsView
            onCheckInNow={() => {
              setCheckInSessionIdPrefill("")
              setActiveTab("checkin-checkout")
            }}
          />
        </div>
      )}
      </div>

      {/* ── Experience Preview Modal (from Card "Watch Preview") ─────────── */}
      {previewModalProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#FAF4EB] border border-[#F3DCC8] p-6 sm:p-7 shadow-[0_20px_50px_rgba(121,100,82,0.18)] space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setPreviewModalProgram(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F3DCC8] hover:bg-[#EAD0B8] border border-[#E0C5AE] text-[#796452] flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span
                className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: RESET_LAB_PROGRAMS[previewModalProgram].badgeBg,
                  color: RESET_LAB_PROGRAMS[previewModalProgram].badgeText,
                  borderColor: RESET_LAB_PROGRAMS[previewModalProgram].badgeBorder,
                }}
              >
                {RESET_LAB_PROGRAMS[previewModalProgram].category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#3F3127] mt-1.5">
                {RESET_LAB_PROGRAMS[previewModalProgram].title} · Teaser Preview
              </h2>
              <p className="text-xs text-[#796452] mt-0.5">
                {RESET_LAB_PROGRAMS[previewModalProgram].description}
              </p>
            </div>

            {/* Official Instagram Reel Embedded Player */}
            <div className="py-1">
              <InstagramReelEmbedPlayer
                program={RESET_LAB_PROGRAMS[previewModalProgram]}
                onClose={() => setPreviewModalProgram(null)}
              />
            </div>

            {/* Audio Sample if Acoustic */}
            {previewModalProgram === "acoustic-unwind" && <LiveAcousticMusicPlayer />}

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F3DCC8]">
              <span className="text-xs text-[#796452]">
                Duration: {RESET_LAB_PROGRAMS[previewModalProgram].duration} · Facilitator: {RESET_LAB_PROGRAMS[previewModalProgram].facilitator.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  const p = previewModalProgram
                  setPreviewModalProgram(null)
                  setSelectedProgram(p)
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#C45B32] hover:bg-[#B34E27] cursor-pointer shadow-md"
              >
                Explore Full Details & Book →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
