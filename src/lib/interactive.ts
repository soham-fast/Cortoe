/**
 * Global pointer effects, attached once at the app shell.
 *
 *  - Cards (`.card-base`, `.card-elevated`) get a cursor-following spotlight.
 *  - Elements with `data-tilt` lean toward the pointer in 3D.
 *  - Anything inside `.ambient` drifts subtly with the pointer (parallax).
 *
 * All work is delegated from `document`, so screens need no wiring.
 * Disabled entirely when the user prefers reduced motion.
 */

const TILT_MAX_DEG = 7

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function initInteractive(): () => void {
  if (typeof document === "undefined" || prefersReducedMotion()) {
    return () => {}
  }

  let frame = 0
  let lastX = 0
  let lastY = 0
  let lastTarget: EventTarget | null = null

  const onPointerMove = (event: PointerEvent) => {
    lastX = event.clientX
    lastY = event.clientY
    lastTarget = event.target
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      applyPointer(lastX, lastY, lastTarget)
    })
  }

  const onPointerLeave = (event: Event) => {
    const el = event.target as HTMLElement | null
    if (el && el instanceof HTMLElement && el.hasAttribute("data-tilt")) {
      el.style.setProperty("--rx", "0deg")
      el.style.setProperty("--ry", "0deg")
    }
  }

  document.addEventListener("pointermove", onPointerMove, { passive: true })
  // pointerleave does not bubble, so listen in the capture phase
  document.addEventListener("pointerleave", onPointerLeave, true)

  return () => {
    document.removeEventListener("pointermove", onPointerMove)
    document.removeEventListener("pointerleave", onPointerLeave, true)
    if (frame) cancelAnimationFrame(frame)
  }
}

function applyPointer(x: number, y: number, target: EventTarget | null) {
  if (!(target instanceof Element)) return

  // Spotlight on cards
  const card = target.closest<HTMLElement>(".card-base, .card-elevated")
  if (card) {
    const rect = card.getBoundingClientRect()
    card.style.setProperty("--mx", `${x - rect.left}px`)
    card.style.setProperty("--my", `${y - rect.top}px`)
  }

  // Tilt
  const tilt = target.closest<HTMLElement>("[data-tilt]")
  if (tilt) {
    const rect = tilt.getBoundingClientRect()
    const px = (x - rect.left) / rect.width - 0.5
    const py = (y - rect.top) / rect.height - 0.5
    tilt.style.setProperty("--ry", `${(px * TILT_MAX_DEG * 2).toFixed(2)}deg`)
    tilt.style.setProperty("--rx", `${(-py * TILT_MAX_DEG * 2).toFixed(2)}deg`)
  }
}
