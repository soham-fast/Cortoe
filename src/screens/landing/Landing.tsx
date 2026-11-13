import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import logoSrc from "@/imports/image-2.png"
import Reveal from "@/components/Reveal"

interface LandingProps {
  onGetStarted: () => void
  onHRLogin?: () => void
}

const NAV_LINKS = [
  { label: "Platform", id: "platform" },
  { label: "How It Works", id: "how-it-works" },
  { label: "For You", id: "for-you" },
  { label: "Privacy", id: "privacy" },
]

const TRUST_ITEMS = [
  "Private & confidential",
  "60-second weekly check-in",
  "Never shared with your employer",
  "Evidence-informed micro-resets",
  "Peer listeners & professionals",
  "Free to get started",
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

// ── Icons ────────────────────────────────────────────────────────────────────

function Icon({ paths, className = "w-5 h-5" }: { paths: string[]; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

const ICONS = {
  chart: ["M3 17l5.5-5.5 4 4L21 7", "M15 7h6v6"],
  layers: ["M12 3l9 5-9 5-9-5 9-5z", "M3 13l9 5 9-5", "M3 17.5l9 5 9-5"],
  wave: ["M2 12h4l2.2-5 3.3 10 3-8 2 3H22"],
  lock: ["M6 11h12v9a1 1 0 01-1 1H7a1 1 0 01-1-1v-9z", "M8.5 11V8a3.5 3.5 0 017 0v3"],
  shield: ["M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z", "M9 12l2.2 2.2L15.5 10"],
  spark: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M5.6 5.6l2.8 2.8", "M15.6 15.6l2.8 2.8", "M5.6 18.4l2.8-2.8", "M15.6 8.4l2.8-2.8"],
  chat: ["M21 12a8.5 8.5 0 01-12.2 7.6L4 20.5l.9-4.4A8.5 8.5 0 1121 12z"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
  check: ["M5 12.5l4.2 4.2L19 7.5"],
  building: ["M4 21V7l8-4 8 4v14", "M9 21v-6h6v6", "M9 10h.01M15 10h.01M9 13.5h.01M15 13.5h.01"],
}

function useCountUp(target: number, duration = 1800, startDelay = 500) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    let start = 0
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(target * eased))
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, startDelay)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, startDelay])

  return value
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="eyebrow">
      <span className="h-2 w-2 rounded-full bg-purple-core" />
      {children}
    </span>
  )
}

// ── Hero: an arch window with floating paper cards ───────────────────────────

function CheckInCard() {
  const options = [
    { label: "Calm & Grounded", active: false },
    { label: "Mild Headspace Load", active: false },
    { label: "Cognitive Pressure", active: true },
    { label: "Need Recovery Time", active: false },
  ]

  return (
    <div className="card-base glow-subtle w-full p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Personal Check-in</span>
        <span className="rounded-full bg-elevated px-2.5 py-0.5 font-mono-data text-[10px] text-text-secondary">60 sec</span>
      </div>
      <p className="mb-4 font-display text-[18px] leading-snug text-warm-white">How is stress showing up for you right now?</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <div
            key={opt.label}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-500 ${
              opt.active
                ? "bg-purple-core text-white shadow-[0_10px_20px_-12px_rgba(181,87,46,0.9)]"
                : "bg-elevated/70 text-text-secondary"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                opt.active ? "border-white/70 bg-white/20" : "border-border-s bg-surface"
              }`}
            >
              {opt.active && <Icon paths={ICONS.check} className="h-2.5 w-2.5 text-white" />}
            </span>
            {opt.label}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border-p pt-3">
        <span className="h-1.5 w-1.5 rounded-full bg-c-success animate-pulse-dot" />
        <span className="text-[11px] text-text-muted">100% private to you</span>
      </div>
    </div>
  )
}

function GaugeCard() {
  const score = useCountUp(37)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 350)
    return () => window.clearTimeout(t)
  }, [])

  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = ready ? circumference * (1 - 37 / 100) : circumference

  return (
    <div className="card-base w-full p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Your Stress Pattern</span>
        <span className="rounded-full bg-c-success/12 px-2.5 py-0.5 text-[10px] font-semibold text-c-success">Optimal range</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative h-[112px] w-[112px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#EADFCB" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#B5572E"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.2,0.7,0.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[2rem] leading-none text-warm-white tabular-nums">{score}</span>
            <span className="mt-0.5 font-mono-data text-[10px] text-text-muted">of 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-text-muted">Mind Stress Index</p>
          <p className="mb-3 font-display text-base italic text-purple-core">The Deep Thinker</p>
          <div className="flex h-7 items-end gap-[3px]">
            {[40, 65, 30, 55, 80, 45, 70, 35, 60, 50].map((h, i) => (
              <span
                key={i}
                className="w-[5px] rounded-full bg-gradient-to-t from-lavender-bright/50 to-purple-core animate-float-fast"
                style={{ height: `${h}%`, animationDelay: `${i * -0.35}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResetCard() {
  return (
    <div className="dark-band w-full rounded-[22px] p-5 shadow-[0_26px_50px_-28px_rgba(42,25,15,0.7)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#F6EEE0]">Recommended Reset</span>
        <span className="font-mono-data text-[10px] text-[#E9B77F]">3 mins</span>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-[#CDBFAA]">
        Box Breathing + Cognitive Dump Bag to release lingering work loops.
      </p>
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.07] px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9B77F]/20 text-[#E9B77F]">
          <Icon paths={ICONS.wave} className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <span className="block h-full w-2/5 rounded-full bg-gradient-to-r from-[#E9B77F] to-[#D9774A] animate-shimmer" />
          </div>
          <p className="mt-1.5 text-[10px] text-[#CDBFAA]">Ready when you are</p>
        </div>
      </div>
    </div>
  )
}

function HeroArch() {
  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[500px]">
      {/* Arch window with a slowly turning sun */}
      <div className="arch absolute inset-x-6 bottom-0 top-10 overflow-hidden border border-border-s bg-elevated shadow-[0_40px_80px_-40px_rgba(92,66,40,0.5)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#F3E6D0_0%,#E9D6B8_100%)]" />
        <div className="absolute left-1/2 top-[18%] h-[300px] w-[300px] -translate-x-1/2 animate-spin-slow opacity-80">
          <div className="sun-disc h-full w-full rounded-full" />
        </div>
        <div className="absolute left-1/2 top-[18%] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,246,230,0.85)_0%,rgba(255,246,230,0)_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[36%] bg-[linear-gradient(180deg,rgba(143,163,131,0)_0%,rgba(143,163,131,0.35)_100%)]" />
      </div>

      <div className="absolute left-0 top-[120px] w-[290px] animate-float-slow sm:w-[300px]" style={{ animationDelay: "-1s" }}>
        <div data-tilt>
          <CheckInCard />
        </div>
      </div>

      <div className="absolute right-0 top-0 w-[270px] animate-float sm:w-[290px]" style={{ animationDelay: "-3s" }}>
        <div data-tilt>
          <GaugeCard />
        </div>
      </div>

      <div className="absolute bottom-2 right-2 w-[260px] animate-float-fast sm:w-[280px]" style={{ animationDelay: "-2s" }}>
        <div data-tilt>
          <ResetCard />
        </div>
      </div>

      <div className="absolute -left-2 bottom-6 animate-float" style={{ animationDelay: "-4.5s" }}>
        <div className="flex items-center gap-2 rounded-full bg-c-success/15 px-3.5 py-2 text-[11px] font-semibold text-c-success shadow-[0_12px_24px_-14px_rgba(92,66,40,0.5)]">
          <Icon paths={ICONS.lock} className="h-3.5 w-3.5" />
          Encrypted & private
        </div>
      </div>
    </div>
  )
}

// ── Sections ─────────────────────────────────────────────────────────────────

export default function Landing({ onGetStarted, onHRLogin }: LandingProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-full text-warm-white">
      {/* ── Floating pill nav ─────────────────────────────────────────────── */}
      <nav className="fixed left-1/2 top-4 z-40 w-[calc(100%-2rem)] max-w-[1080px] -translate-x-1/2">
        <div
          className={`flex h-[64px] items-center justify-between rounded-full border px-4 pl-5 transition-all duration-500 sm:px-5 ${
            scrolled
              ? "border-border-s bg-surface/90 shadow-[0_18px_40px_-22px_rgba(92,66,40,0.5)] backdrop-blur-xl"
              : "border-transparent bg-surface/55 backdrop-blur-md"
          }`}
        >
          <button onClick={() => scrollTo("hero")} className="cursor-pointer focus:outline-none">
            <img src={logoSrc} alt="CortiQuant" className="logo-ink h-9 object-contain" />
          </button>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="group relative cursor-pointer text-sm font-medium text-text-secondary transition-colors hover:text-warm-white"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-purple-core transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onHRLogin}
              className="hidden cursor-pointer rounded-full px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-elevated hover:text-warm-white lg:inline-block"
            >
              HR / Organisation Login
            </button>
            <button className="btn-primary cursor-pointer px-5 py-2.5 text-sm" onClick={onGetStarted}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative px-6 pb-24 pt-36 md:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
          <div className="text-center lg:text-left">
            <div className="animate-fade-up mb-8 flex justify-center lg:justify-start" style={{ animationDelay: "60ms" }}>
              <Eyebrow>Turning invisible stress into actionable insight</Eyebrow>
            </div>

            <h1
              className="animate-fade-up font-display text-[2.8rem] leading-[1.02] text-warm-white sm:text-[4.2rem] lg:text-[4.6rem]"
              style={{ animationDelay: "160ms" }}
            >
              Understand your stress.
              <br />
              <span className="text-gradient">Feel more like</span>{" "}
              <span className="ink-underline">yourself.</span>
            </h1>

            <p
              className="animate-fade-up mx-auto mt-7 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg lg:mx-0"
              style={{ animationDelay: "280ms" }}
            >
              CortiQuant helps you understand how stress shows up in your everyday life, track your stress patterns
              over time, and discover personalized ways to reset and recover.
            </p>

            <div
              className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
              style={{ animationDelay: "400ms" }}
            >
              <button className="btn-primary group w-full cursor-pointer px-9 py-4 text-base sm:w-auto" onClick={onGetStarted}>
                Get Started
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
              <button
                onClick={() => scrollTo("for-you")}
                className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-text-secondary transition-colors hover:text-warm-white sm:w-auto"
              >
                Explore Features
                <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
              </button>
            </div>

            <p className="animate-fade-up mt-7 text-xs text-text-muted" style={{ animationDelay: "520ms" }}>
              Private & confidential · Simple 60-second weekly check-in · Free to get started
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
            <HeroArch />
          </div>
        </div>
      </section>

      {/* ── Trust band (espresso) ─────────────────────────────────────────── */}
      <section className="dark-band relative overflow-hidden py-6">
        <div className="mask-fade-x overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-3 font-display text-lg italic text-[#F1E4CE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9B77F]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── For You: bento grid ───────────────────────────────────────────── */}
      <section id="for-you" className="relative px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-16 grid items-end gap-6 md:grid-cols-2">
            <div>
              <Eyebrow>For You</Eyebrow>
              <h2 className="mt-5 font-display text-4xl leading-[1.08] text-warm-white sm:text-5xl">
                Everything you need to navigate stress with clarity
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-text-secondary md:justify-self-end">
              Stress is personal. CortiQuant gives you actionable tools to measure, understand, and ease mental tension
              on your own terms.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-6">
            <Reveal className="md:col-span-4">
              <div className="card-base hoverable flex h-full flex-col justify-between gap-10 p-8 sm:p-10">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-core/12 text-purple-core">
                    <Icon paths={ICONS.chart} className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 font-display text-3xl text-warm-white">Track Your MSI Over Time</h3>
                  <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
                    Establish your personal Mind Stress Index (MSI) baseline and observe how work, rest, and life shift your
                    stress score across 7D, 30D, 3M, and 1Y.
                  </p>
                </div>
                <div className="flex items-end gap-2 sm:gap-3">
                  {[30, 46, 38, 62, 52, 70, 58, 44, 36, 48, 40].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 origin-bottom rounded-t-lg bg-gradient-to-t from-purple-core to-[#E9B77F] transition-transform duration-700"
                      style={{ height: `${h}px`, opacity: 0.35 + (i % 4) * 0.15 }}
                    />
                  ))}
                </div>
                <p className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <span className="h-1 w-1 rounded-full bg-purple-core" />
                  Real data · No synthetic points
                </p>
              </div>
            </Reveal>

            <Reveal delay={120} className="md:col-span-2">
              <div className="card-elevated hoverable flex h-full flex-col p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-c-success/15 text-c-success">
                  <Icon paths={ICONS.layers} className="h-5 w-5" />
                </div>
                <h3 className="mb-3 font-display text-2xl text-warm-white">Discover Your Stress Archetype</h3>
                <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                  Learn how your nervous system uniquely responds to pressure. Identify your stress personality archetype
                  and uncover triggers before feeling overloaded.
                </p>
                <p className="mt-auto flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <span className="h-1 w-1 rounded-full bg-c-success" />
                  Personalized resonance & insights
                </p>
              </div>
            </Reveal>

            <Reveal delay={200} className="md:col-span-6">
              <div className="card-base hoverable grid gap-8 p-8 sm:p-10 md:grid-cols-[1.1fr_1fr] md:items-center">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9B77F]/25 text-[#8E5A2B]">
                    <Icon paths={ICONS.wave} className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 font-display text-3xl text-warm-white">Personalized Reset Labs</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Experience quick 2-to-5-minute micro-interventions: from guided somatic breathwork and musical unwinds
                    to the cognitive Digital Dump Bag.
                  </p>
                  <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-text-muted">
                    <span className="h-1 w-1 rounded-full bg-[#D9A45B]" />
                    Evidence-informed micro-resets
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Box breathing", "Dump Bag", "Musical unwind", "Somatic pause"].map((label, i) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-2xl border border-border-p bg-elevated/60 px-4 py-4 text-sm font-medium text-text-secondary animate-float-slow"
                      style={{ animationDelay: `${-i * 1.5}s` }}
                    >
                      <span className="h-2 w-2 rounded-full bg-purple-core" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Human support (sage panel) ────────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl rounded-[40px] bg-[#E3E8D8] px-8 py-16 sm:px-14">
          <div className="mx-auto grid max-w-5xl items-center gap-14 md:grid-cols-2">
            <Reveal>
              <div className="eyebrow mb-6 border-c-success/30 text-c-success">
                <span className="h-2 w-2 rounded-full bg-c-success" />
                Confidential Care
              </div>
              <h2 className="mb-5 font-display text-4xl leading-[1.1] text-warm-white">
                Connect with human & professional support
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-text-secondary">
                When stress feels too heavy to process alone, schedule 1-on-1 confidential chats with trained Peer
                Listeners or certified mental wellbeing professionals.
              </p>
              <ul className="space-y-4">
                {[
                  "Safe, non-judgmental listening spaces",
                  "10-minute focused reset sessions",
                  "Verified professional consultations where available",
                  "Never shared with your employer or anyone else",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-c-success text-white">
                      <Icon paths={ICONS.check} className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={150}>
              <div className="card-base p-8 sm:p-9">
                <div className="mb-7 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-c-success/15 text-c-success">
                    <Icon paths={ICONS.chat} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-text-muted">Support preview</p>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-c-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-c-success" />
                      Listener available
                    </p>
                  </div>
                </div>
                <p className="mb-4 font-display text-3xl italic leading-snug text-warm-white">
                  "You don't have to carry this alone."
                </p>
                <p className="mb-8 text-sm leading-relaxed text-text-secondary">
                  Whether you need a listening ear after a tough day or targeted coping strategies, CortiQuant connects
                  you directly when you need it most.
                </p>
                <button onClick={onGetStarted} className="btn-secondary w-full cursor-pointer py-3.5 text-sm">
                  Explore Support Options →
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── How it works: numbered editorial steps ────────────────────────── */}
      <section id="how-it-works" className="relative px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-20 max-w-2xl">
            <Eyebrow>How It Works</Eyebrow>
            <h2 className="mt-5 mb-5 font-display text-4xl leading-[1.08] text-warm-white sm:text-5xl">
              The CortiQuant Personal Loop
            </h2>
            <p className="max-w-lg text-base text-text-secondary">
              A simple, non-intrusive routine that builds long-term self-awareness and recovery habits.
            </p>
          </Reveal>

          <Reveal className="relative grid gap-12 md:grid-cols-4 md:gap-6">
            <div className="pointer-events-none absolute left-0 right-0 top-[2.1rem] hidden h-px border-t border-dashed border-border-s md:block">
              <div className="draw-x absolute inset-0 border-t-2 border-purple-core/40" />
            </div>

            {[
              { n: "01", icon: ICONS.chat, label: "Check In", sub: "Takes 60 seconds. Reflect on energy, mental load, and body." },
              { n: "02", icon: ICONS.chart, label: "Understand", sub: "See your current MSI and what may be driving mental pressure." },
              { n: "03", icon: ICONS.wave, label: "Reset", sub: "Get personalized recovery suggestions tailored to your score." },
              { n: "04", icon: ICONS.spark, label: "Restore", sub: "Track shifts over time and feel more balanced in everyday life." },
            ].map((step) => (
              <div key={step.n} className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border border-border-s bg-surface text-purple-core shadow-[0_18px_30px_-20px_rgba(92,66,40,0.6)]">
                    <Icon paths={step.icon} className="h-6 w-6" />
                  </span>
                  <span className="font-display text-4xl italic text-border-s">{step.n}</span>
                </div>
                <p className="mb-2 font-display text-2xl text-warm-white">{step.label}</p>
                <p className="max-w-[230px] text-sm leading-relaxed text-text-secondary">{step.sub}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Privacy: editorial columns ────────────────────────────────────── */}
      <section id="privacy" className="relative px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto mb-16 max-w-3xl text-center">
            <div className="flex justify-center">
              <Eyebrow>Your Privacy</Eyebrow>
            </div>
            <h2 className="mt-5 mb-5 font-display text-4xl leading-[1.08] text-warm-white sm:text-5xl">
              Your wellbeing data belongs to you.
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-text-secondary">
              Your individual responses, journal notes, check-ins, and scores are strictly confidential. We believe true
              self-reflection only happens when you know your data is secure.
            </p>
          </Reveal>

          <div className="grid gap-px overflow-hidden rounded-[28px] border border-border-p bg-border-p md:grid-cols-3">
            {[
              {
                icon: ICONS.lock,
                title: "Strictly Private",
                body: "Your assessments, Dump Bag reflections, and personal MSI scores are visible only to you.",
              },
              {
                icon: ICONS.shield,
                title: "No Surveillance",
                body: "We never sell your data or share individual records with employers, managers, or third parties.",
              },
              {
                icon: ICONS.spark,
                title: "Built For Recovery",
                body: "Designed to nurture healthy routines and genuine self-care, free from anxiety or judgment.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 120}>
                <div className="flex h-full flex-col bg-surface p-9 transition-colors duration-500 hover:bg-elevated/60">
                  <span className="mb-6 text-purple-core">
                    <Icon paths={item.icon} className="h-7 w-7" />
                  </span>
                  <p className="mb-3 font-display text-2xl text-warm-white">{item.title}</p>
                  <p className="text-sm leading-relaxed text-text-secondary">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="mt-10 text-center">
            <Link
              to="/privacy-policy"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-purple-core transition-colors hover:text-warm-white"
            >
              Read full Privacy Policy
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Organisations (espresso card) ─────────────────────────────────── */}
      <section id="platform" className="relative px-6 py-16">
        <Reveal className="mx-auto max-w-6xl">
          <div className="dark-band hoverable flex flex-col items-start justify-between gap-8 rounded-[32px] p-8 md:flex-row md:items-center md:p-12">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E9B77F]">
                <Icon paths={ICONS.building} className="h-4 w-4" />
                For Organisations & Teams
              </div>
              <h3 className="mb-3 font-display text-3xl leading-tight text-[#F8F1E4]">
                Looking to support wellbeing across your team?
              </h3>
              <p className="text-sm leading-relaxed text-[#CDBFAA]">
                CortiQuant also helps organisations understand aggregated workplace wellbeing patterns while keeping all
                individual responses 100% private.
              </p>
            </div>
            <button
              onClick={onHRLogin}
              className="group inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-[#F8F1E4] px-7 py-3.5 text-xs font-semibold text-[#2A2019] transition-transform duration-300 hover:-translate-y-0.5"
            >
              HR / Organisation Login
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="mb-5 font-display text-5xl leading-[1.05] text-warm-white sm:text-6xl">
            Take the first step toward
            <br />
            <span className="text-gradient">calmer, clearer days.</span>
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-base text-text-secondary">
            Begin with a quick check-in to establish your baseline and uncover how stress really affects your life.
          </p>
          <button className="btn-primary cursor-pointer px-11 py-4 text-base" onClick={onGetStarted}>
            Get Started
          </button>
          <p className="mt-5 text-xs text-text-muted">No credit card or company code required to begin.</p>
        </Reveal>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-border-p px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="CortiQuant" className="logo-ink h-8 object-contain" />
            <span className="text-xs text-text-muted">Personal Stress & Wellbeing</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-7">
            <button onClick={onHRLogin} className="cursor-pointer text-xs text-text-secondary transition-colors hover:text-purple-core">
              Organisation Portal
            </button>
            <Link to="/privacy-policy" className="cursor-pointer text-xs text-text-secondary transition-colors hover:text-purple-core">
              Privacy
            </Link>
            <Link to="/terms" className="cursor-pointer text-xs text-text-secondary transition-colors hover:text-purple-core">
              Terms
            </Link>
            <Link to="/contact" className="cursor-pointer text-xs text-text-secondary transition-colors hover:text-purple-core">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
