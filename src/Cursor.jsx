import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/* Premium cursor: a soft glow that trails the pointer + a crisp dot.
   Desktop / fine-pointer only. Hidden for reduced-motion. */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const glowX = useSpring(x, { stiffness: 220, damping: 28, mass: 0.6 })
  const glowY = useSpring(y, { stiffness: 220, damping: 28, mass: 0.6 })

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ok = fine.matches && !reduce.matches
    setEnabled(ok)
    if (!ok) return
    const move = (e) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])

  if (!enabled) return null
  return (
    <>
      <motion.div className="cursor-glow" style={{ left: glowX, top: glowY }} aria-hidden="true" />
      <motion.div className="cursor-dot" style={{ left: x, top: y }} aria-hidden="true" />
    </>
  )
}
