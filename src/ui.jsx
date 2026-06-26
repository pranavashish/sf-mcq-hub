import { useState, useEffect, useRef, useCallback } from 'react'

/* ─────────────────────────────────────────────
   HOOKS
   ───────────────────────────────────────────── */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function useFinePointer() {
  const [fine, setFine] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const on = () => setFine(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return fine
}

// Animated number that eases up to `target`
export function useCountUp(target, duration = 900) {
  const reduced = usePrefersReducedMotion()
  const [val, setVal] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    if (reduced) { setVal(target); return }
    const start = performance.now()
    const from = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setVal(Math.round(from + (target - from) * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, reduced])
  return val
}

/* ─────────────────────────────────────────────
   AURORA BACKGROUND  (parallax orbs + dusk sky)
   ───────────────────────────────────────────── */

export function AuroraBackground() {
  const reduced = usePrefersReducedMotion()
  const fine = useFinePointer()

  useEffect(() => {
    const root = document.documentElement
    if (reduced || !fine) {
      root.style.setProperty('--px', '0')
      root.style.setProperty('--py', '0')
    }
    let frame = 0
    const onMove = (e) => {
      if (reduced || !fine) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 2 - 1
        const y = (e.clientY / window.innerHeight) * 2 - 1
        root.style.setProperty('--px', x.toFixed(3))
        root.style.setProperty('--py', y.toFixed(3))
      })
    }
    let sFrame = 0
    const onScroll = () => {
      cancelAnimationFrame(sFrame)
      sFrame = requestAnimationFrame(() => {
        root.style.setProperty('--sy', String(window.scrollY))
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(sFrame)
    }
  }, [reduced, fine])

  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__sky" />
      <div className="aurora__orb aurora__orb--1" />
      <div className="aurora__orb aurora__orb--2" />
      <div className="aurora__orb aurora__orb--3" />
      <div className="aurora__orb aurora__orb--4" />
      <div className="aurora__grid" />
      <div className="aurora__vignette" />
    </div>
  )
}

/* ─────────────────────────────────────────────
   TILT CARD  (3D hover tilt + cursor glare)
   ───────────────────────────────────────────── */

export function TiltCard({ children, className = '', style = {}, max = 9, onClick }) {
  const reduced = usePrefersReducedMotion()
  const fine = useFinePointer()
  const ref = useRef(null)
  const enabled = !reduced && fine

  const onMove = useCallback((e) => {
    if (!enabled || !ref.current) return
    const el = ref.current
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (0.5 - py) * max * 2
    const ry = (px - 0.5) * max * 2
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
    el.style.setProperty('--gop', '1')
  }, [enabled, max])

  const onLeave = useCallback(() => {
    if (!ref.current) return
    const el = ref.current
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--gop', '0')
  }, [])

  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <span className="tilt__glare" />
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   RIPPLE BUTTON  (click ripple + shine sweep)
   ───────────────────────────────────────────── */

export function RippleButton({ children, className = '', style = {}, onClick, disabled, type = 'button' }) {
  const ref = useRef(null)

  const handle = (e) => {
    const el = ref.current
    if (el) {
      const r = el.getBoundingClientRect()
      const span = document.createElement('span')
      span.className = 'ripple'
      const size = Math.max(r.width, r.height)
      span.style.width = span.style.height = `${size}px`
      span.style.left = `${e.clientX - r.left - size / 2}px`
      span.style.top = `${e.clientY - r.top - size / 2}px`
      el.appendChild(span)
      setTimeout(() => span.remove(), 650)
    }
    onClick && onClick(e)
  }

  return (
    <button
      ref={ref}
      type={type}
      className={`btn ${className}`}
      style={style}
      onClick={handle}
      disabled={disabled}
    >
      <span className="btn__label">{children}</span>
    </button>
  )
}

/* ─────────────────────────────────────────────
   CONFETTI  (one-shot celebratory burst)
   ───────────────────────────────────────────── */

const CONFETTI_COLORS = ['#1A9FFF', '#0B5CFF', '#7CD4FF', '#FBBF24', '#2DD4BF', '#A78BFA', '#FB7185']

export function Confetti({ fire, count = 44 }) {
  const reduced = usePrefersReducedMotion()
  if (!fire || reduced) return null
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100
    const delay = Math.random() * 0.3
    const dur = 1.6 + Math.random() * 1.4
    const rot = Math.random() * 360
    const drift = (Math.random() - 0.5) * 200
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    const w = 6 + Math.random() * 6
    const h = 8 + Math.random() * 8
    return (
      <span
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          width: `${w}px`,
          height: `${h}px`,
          background: color,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
          '--rot': `${rot}deg`,
          '--drift': `${drift}px`,
        }}
      />
    )
  })
  return <div className="confetti" aria-hidden="true">{pieces}</div>
}
