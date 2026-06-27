import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import { CloudMarkMini } from './SalesforceLogo'
import { useSound } from './sound'

/* ─────────── HOOKS ─────────── */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches); on()
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}
export function useFinePointer() {
  const [fine, setFine] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const on = () => setFine(mq.matches); on()
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on)
  }, [])
  return fine
}
export function useCountUp(target, duration = 1000) {
  const reduced = usePrefersReducedMotion()
  const [val, setVal] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    if (reduced) { setVal(target); return }
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, reduced])
  return val
}
export function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}
export function useTheme() {
  const [theme, setThemeState] = useState(() => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light')
  const apply = useCallback((t) => {
    document.documentElement.setAttribute('data-theme', t)
    try { localStorage.setItem('sfq_theme', t) } catch {}
    setThemeState(t)
  }, [])
  const toggle = useCallback(() => apply(theme === 'dark' ? 'light' : 'dark'), [theme, apply])
  return { theme, toggle }
}
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true })
    let raf
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [enabled])
}

const WMO = (code, isDay) => {
  if (code === 0) return { icon: isDay ? 'ti-sun' : 'ti-moon', label: 'Clear' }
  if (code === 1) return { icon: isDay ? 'ti-sun' : 'ti-moon', label: 'Mostly clear' }
  if (code === 2) return { icon: 'ti-cloud', label: 'Partly cloudy' }
  if (code === 3) return { icon: 'ti-cloud', label: 'Overcast' }
  if (code === 45 || code === 48) return { icon: 'ti-mist', label: 'Fog' }
  if (code >= 51 && code <= 57) return { icon: 'ti-cloud-rain', label: 'Drizzle' }
  if (code >= 61 && code <= 67) return { icon: 'ti-cloud-rain', label: 'Rain' }
  if (code >= 71 && code <= 77) return { icon: 'ti-snowflake', label: 'Snow' }
  if (code >= 80 && code <= 82) return { icon: 'ti-cloud-storm', label: 'Showers' }
  if (code === 85 || code === 86) return { icon: 'ti-snowflake', label: 'Snow showers' }
  if (code >= 95) return { icon: 'ti-bolt', label: 'Thunderstorm' }
  return { icon: 'ti-cloud', label: 'Cloudy' }
}
export function useWeather() {
  const [w, setW] = useState({ loading: true })
  useEffect(() => {
    let cancelled = false
    const load = async (lat, lon, knownCity) => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`)
        const j = await r.json()
        let city = knownCity
        if (!city) {
          try {
            const g = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
            const gj = await g.json(); city = gj.city || gj.locality || gj.principalSubdivision || ''
          } catch {}
        }
        if (cancelled) return
        const c = j.current
        setW({ loading: false, temp: Math.round(c.temperature_2m), code: c.weather_code, isDay: c.is_day === 1, city })
      } catch { if (!cancelled) setW({ loading: false, error: true }) }
    }
    const fallback = () => load(28.6139, 77.2090, 'New Delhi')
    if (!navigator.geolocation) { fallback(); return }
    navigator.geolocation.getCurrentPosition((p) => load(p.coords.latitude, p.coords.longitude), () => fallback(), { timeout: 8000, maximumAge: 600000 })
    return () => { cancelled = true }
  }, [])
  return w
}

/* ─────────── STATUS BAR ─────────── */
const pad = (n) => String(n).padStart(2, '0')
export function StatusBar({ onBrandClick }) {
  const now = useClock()
  const w = useWeather()
  const { theme, toggle } = useTheme()
  const { muted, toggle: toggleMute } = useSound()
  const date = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const wm = w.loading || w.error ? null : WMO(w.code, w.isDay)
  return (
    <div className="topbar">
      <div className="topbar__clock">
        <i className="ti ti-clock-hour-4" aria-hidden="true" />
        <span className="topbar__time">{pad(now.getHours())}:{pad(now.getMinutes())}:<span className="sec">{pad(now.getSeconds())}</span></span>
        <span className="topbar__date">{date}</span>
      </div>
      <div className="topbar__brand" onClick={onBrandClick} role="button" tabIndex={0}><CloudMarkMini size={22} /><span>SF MCQ Hub</span></div>
      <div className="topbar__right">
        {w.loading ? <span className="weatherpill skel" aria-hidden="true" />
          : w.error ? null
          : <span className="weatherpill" title={wm.label}><i className={`ti ${wm.icon}`} /><span className="temp">{w.temp}°</span>{w.city && <span className="city">{w.city}</span>}</span>}
        <button className="iconbtn" onClick={toggleMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'}><i className={`ti ${muted ? 'ti-volume-off' : 'ti-volume'}`} /></button>
        <button className="iconbtn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}><i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'}`} /></button>
      </div>
    </div>
  )
}

/* ─────────── MAGNETIC BUTTON ─────────── */
export function MagneticButton({ children, className = '', style = {}, onClick, disabled, strength = 0.4 }) {
  const ref = useRef(null)
  const fine = useFinePointer()
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 250, damping: 18 }), sy = useSpring(y, { stiffness: 250, damping: 18 })
  const onMove = (e) => {
    if (!fine || disabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength); y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => { x.set(0); y.set(0) }
  const handle = (e) => {
    if (disabled) return
    const el = ref.current
    if (el) {
      const r = el.getBoundingClientRect()
      const span = document.createElement('span'); span.className = 'ripple'
      const size = Math.max(r.width, r.height)
      span.style.width = span.style.height = `${size}px`
      span.style.left = `${e.clientX - r.left - size / 2}px`; span.style.top = `${e.clientY - r.top - size / 2}px`
      el.appendChild(span); setTimeout(() => span.remove(), 650)
    }
    onClick && onClick(e)
  }
  return (
    <motion.button ref={ref} className={`btn ${className}`} style={{ ...style, x: sx, y: sy }}
      onMouseMove={onMove} onMouseLeave={reset} onClick={handle} disabled={disabled} whileTap={{ scale: 0.96 }}>
      <span className="btn__label">{children}</span>
    </motion.button>
  )
}

/* ─────────── TILT CARD ─────────── */
export function TiltCard({ children, className = '', style = {}, max = 10, onClick }) {
  const reduced = usePrefersReducedMotion()
  const fine = useFinePointer()
  const ref = useRef(null)
  const enabled = !reduced && fine
  const onMove = useCallback((e) => {
    if (!enabled || !ref.current) return
    const el = ref.current, r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`)
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`); el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`)
    el.style.setProperty('--gop', '1')
  }, [enabled, max])
  const onLeave = useCallback(() => {
    if (!ref.current) return
    const el = ref.current
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--gop', '0')
  }, [])
  return (
    <div ref={ref} className={`tilt ${className}`} style={style} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
      <span className="tilt__glare" />{children}
    </div>
  )
}

/* ─────────── CONFETTI (sunrise) ─────────── */
const CC = ['#FF5A36', '#F8A51B', '#FF7A9A', '#FFC24D', '#0D9488', '#6366F1', '#65A30D']
export function Confetti({ fire, count = 48 }) {
  const reduced = usePrefersReducedMotion()
  if (!fire || reduced) return null
  const pieces = Array.from({ length: count }, (_, i) => (
    <span key={i} className="confetti-piece" style={{
      left: `${Math.random() * 100}%`, width: `${6 + Math.random() * 6}px`, height: `${8 + Math.random() * 8}px`,
      background: CC[i % CC.length], animationDelay: `${Math.random() * 0.3}s`, animationDuration: `${1.6 + Math.random() * 1.4}s`,
      '--rot': `${Math.random() * 360}deg`, '--drift': `${(Math.random() - 0.5) * 220}px`,
    }} />
  ))
  return <div className="confetti" aria-hidden="true">{pieces}</div>
}

/* ─────────── FOOTER ─────────── */
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <p className="footer__made">Crafted with <span className="footer__heart"><i className="ti ti-heart" /></span> by <span className="footer__name">Pranav</span></p>
      <p className="footer__meta">© {year} · SF MCQ Hub · Salesforce scenario practice</p>
    </footer>
  )
}
