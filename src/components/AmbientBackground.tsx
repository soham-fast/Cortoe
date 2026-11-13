import { useEffect, useMemo, useRef, type CSSProperties } from "react"

/**
 * Full-viewport backdrop for the warm-paper theme: a slowly sliding dot grid,
 * two large sun-bleached light pools, golden dust motes, a flowing clay
 * line and a paper grain. Pure CSS animation except for a light pointer
 * parallax. Sits behind every screen (z-index -1 inside #root).
 */

// Small deterministic PRNG so the layout is stable between renders
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PARTICLE_COUNT = 18

export default function AmbientBackground() {
  const rootRef = useRef<HTMLDivElement>(null)

  const particles = useMemo(() => {
    const rand = mulberry32(20261113)
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      key: i,
      left: `${(rand() * 100).toFixed(2)}%`,
      size: `${(2 + rand() * 3).toFixed(2)}px`,
      duration: `${(16 + rand() * 18).toFixed(1)}s`,
      delay: `${(-rand() * 30).toFixed(1)}s`,
      mote: rand() > 0.5 ? "#D9A45B" : "#E7B98A",
    }))
  }, [])

  // Parallax: nudge the layers a little with the pointer
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        root.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3))
        root.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3))
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={rootRef} className="ambient" aria-hidden="true">
      <div className="ambient__grid" />

      <div className="ambient__parallax" style={{ inset: 0 }}>
        <div
          className="ambient__orb ambient__orb--a"
          style={{
            width: "46vmax",
            height: "46vmax",
            top: "-16vmax",
            right: "-12vmax",
            background:
              "radial-gradient(circle at 40% 40%, rgba(240,190,130,0.42) 0%, rgba(232,196,150,0.16) 42%, transparent 70%)",
          }}
        />
        <div
          className="ambient__orb ambient__orb--b"
          style={{
            width: "40vmax",
            height: "40vmax",
            top: "30vh",
            left: "-14vmax",
            background:
              "radial-gradient(circle at 55% 45%, rgba(197,210,178,0.38) 0%, rgba(197,210,178,0.14) 42%, transparent 70%)",
          }}
        />
        <div
          className="ambient__orb ambient__orb--a"
          style={{
            width: "30vmax",
            height: "30vmax",
            bottom: "-10vmax",
            left: "38%",
            animationDelay: "-9s",
            background:
              "radial-gradient(circle at 50% 50%, rgba(214,119,74,0.14) 0%, transparent 65%)",
          }}
        />
      </div>

      <svg className="ambient__wave" viewBox="0 0 1440 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ambient-wave-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#B5572E" stopOpacity="0" />
            <stop offset="30%" stopColor="#B5572E" />
            <stop offset="55%" stopColor="#D9A45B" />
            <stop offset="80%" stopColor="#8FA383" />
            <stop offset="100%" stopColor="#8FA383" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 150 C 120 150, 180 150, 240 150 C 280 150, 300 96, 330 96 C 360 96, 380 206, 420 206 C 450 206, 470 110, 500 110 C 530 110, 560 150, 640 150 C 760 150, 820 150, 860 150 C 890 150, 910 70, 940 70 C 975 70, 995 190, 1030 190 C 1060 190, 1085 130, 1110 130 C 1140 130, 1180 150, 1440 150"
          stroke="url(#ambient-wave-grad)"
          strokeWidth="1.8"
        />
      </svg>

      <div className="ambient__parallax" style={{ inset: 0 }}>
        {particles.map((p) => (
          <span
            key={p.key}
            className="ambient__particle"
            style={
              {
                left: p.left,
                ["--s" as string]: p.size,
                ["--dur" as string]: p.duration,
                ["--delay" as string]: p.delay,
                ["--mote" as string]: p.mote,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="ambient__grain" />
    </div>
  )
}
