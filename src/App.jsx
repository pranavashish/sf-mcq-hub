import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CloudLogo } from './SalesforceLogo'
import Cursor from './Cursor'
import { StatusBar } from './ui'
import Home from './Home'
import Quiz from './Quiz'

export default function App() {
  const [view, setView] = useState('home')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setBooting(false), reduced ? 150 : 1500)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [view])

  return (
    <>
      <Cursor />
      <StatusBar onBrandClick={() => setView('home')} />

      <AnimatePresence>
        {booting && (
          <motion.div className="loader" key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="loader__logo"><CloudLogo size={94} /></div>
              <div className="loader__bar"><motion.div className="loader__fill" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.3, ease: 'easeInOut' }} /></div>
              <div className="loader__txt">Loading experience</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <Home onEnter={() => setView('arena')} />
          </motion.div>
        ) : (
          <motion.div key="arena" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Quiz onExit={() => setView('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
