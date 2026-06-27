import { useState, useCallback, useEffect } from 'react'

/* Tiny Web Audio sound engine — synthesised tones, zero asset files. */
let ctx
function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

function tone(freq, dur, type = 'sine', vol = 0.14, when = 0) {
  const c = getCtx(); if (!c) return
  if (c.state === 'suspended') c.resume()
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g); g.connect(c.destination)
  osc.start(t0); osc.stop(t0 + dur + 0.03)
}

export const Sound = {
  enabled: true,
  hover()  { if (!this.enabled) return; tone(880, 0.04, 'sine', 0.03) },
  click()  { if (!this.enabled) return; tone(440, 0.07, 'triangle', 0.07) },
  select() { if (!this.enabled) return; tone(560, 0.05, 'sine', 0.06) },
  correct(streak = 0) {
    if (!this.enabled) return
    const base = 523.25, mult = 1 + Math.min(streak, 8) * 0.04
    ;[base, base * 1.26, base * 1.5].forEach((f, i) => tone(f * mult, 0.13, 'sine', 0.12, i * 0.07))
  },
  wrong() {
    if (!this.enabled) return
    tone(196, 0.18, 'sawtooth', 0.08); tone(146, 0.24, 'sawtooth', 0.06, 0.05)
  },
  coin()   { if (!this.enabled) return; tone(988, 0.06, 'square', 0.06); tone(1319, 0.10, 'square', 0.06, 0.06) },
  finish(good) {
    if (!this.enabled) return
    const seq = good ? [523, 659, 784, 1047] : [440, 392, 330]
    seq.forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, i * 0.11))
  },
  rankUp() {
    if (!this.enabled) return
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.10, i * 0.08))
  },
}

export function useSound() {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('sfq_muted') === '1' } catch { return false }
  })
  useEffect(() => { Sound.enabled = !muted }, [muted])
  const toggle = useCallback(() => {
    setMuted((m) => {
      const n = !m
      try { localStorage.setItem('sfq_muted', n ? '1' : '0') } catch {}
      Sound.enabled = !n
      if (!n) Sound.click()
      return n
    })
  }, [])
  return { muted, toggle }
}
