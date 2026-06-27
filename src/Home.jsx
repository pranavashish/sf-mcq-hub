import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CloudLogo } from './SalesforceLogo'
import { MagneticButton, useSmoothScroll, Footer } from './ui'

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-70px' },
  transition: { duration: 0.7, ease: [.2, .8, .2, 1] },
}

const VALUES = [
  { i: 'ti-world', t: 'A vast ecosystem', d: 'Sales, service, marketing and data for a huge share of the world\u2019s companies \u2014 all built on one platform that constantly needs people who understand it.', c: 'var(--lv3-c)', b: 'var(--lv3-b)', g: 'var(--lv3-g)' },
  { i: 'ti-trending-up', t: 'Real career growth', d: 'A clear ladder from admin to developer to architect, with skills that transfer across thousands of companies and industries worldwide.', c: 'var(--lv1-c)', b: 'var(--lv1-b)', g: 'var(--lv1-g)' },
  { i: 'ti-certificate', t: 'Certifications that count', d: 'Respected, role-based credentials that map directly to jobs \u2014 and give you a concrete target to aim your learning at.', c: 'var(--lv6-c)', b: 'var(--lv6-b)', g: 'var(--lv6-g)' },
  { i: 'ti-cloud', t: 'Cloud + AI products', d: 'From core CRM to Data Cloud and AI agents, the surface area keeps expanding \u2014 which means the demand for builders keeps growing too.', c: 'var(--lv4-c)', b: 'var(--lv4-b)', g: 'var(--lv4-g)' },
]
const STATS = [
  { n: '#1', l: 'CRM platform' }, { n: '6', l: 'Career levels' },
  { n: '10', l: 'Questions / run' }, { n: '\u221E', l: 'Fresh scenarios' },
]
const FEATS = [
  { i: 'ti-stairs-up', t: 'Six levels \u2014 1 year through CTA' },
  { i: 'ti-alert-triangle', t: 'Rare gotchas & production edge cases' },
  { i: 'ti-bulb', t: 'A full explanation for every answer' },
  { i: 'ti-trophy', t: 'XP, streaks & ranks as you climb' },
]
const ACTIVE_CERTS = [
  { i: 'ti-settings', n: 'Administrator', d: 'The foundation', c: '#0284C7' },
  { i: 'ti-code', n: 'Platform Developer I', d: 'Apex & LWC', c: '#6366F1' },
  { i: 'ti-tools', n: 'Platform App Builder', d: 'Declarative build', c: '#0D9488' },
  { i: 'ti-terminal-2', n: 'Platform Developer II', d: 'Advanced code', c: '#7C3AED' },
  { i: 'ti-brand-javascript', n: 'JavaScript Developer I', d: 'Core JS', c: '#EA8A04' },
  { i: 'ti-database', n: 'Data Cloud Consultant', d: 'Unified data', c: '#0EA5E9' },
  { i: 'ti-robot', n: 'AI Specialist', d: 'Agents & Einstein', c: '#F43F5E' },
  { i: 'ti-plug', n: 'Integration Architect', d: 'Systems & APIs', c: '#65A30D' },
]
const RETIRED_CERTS = [
  { i: 'ti-mail', n: 'Pardot Specialist', d: 'Renamed to Account Engagement' },
  { i: 'ti-chart-dots', n: 'Einstein Analytics', d: 'Now CRM Analytics' },
]

export default function Home({ onEnter }) {
  useSmoothScroll(true)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, -120])
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="home">
      {/* ───── HERO ───── */}
      <section className="hero shell" ref={heroRef}>
        <div className="hero__orbs"><div className="hero__orb hero__orb--1" /><div className="hero__orb hero__orb--2" /><div className="hero__orb hero__orb--3" /></div>
        <motion.div style={{ y, opacity, scale }}>
          <motion.div className="hero__badge" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <i className="ti ti-sparkles" /> Practice · Play · Progress — free forever
          </motion.div>
          <motion.h1 className="hero__title" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18, ease: [.2, .8, .2, 1] }}>
            Become the developer<br />the <span className="grad">cloud</span> needs.
          </motion.h1>
          <motion.p className="hero__sub" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
            Master Salesforce one real-world scenario at a time. Ten fresh, exam-grade questions every run,
            six career levels from rookie to architect, and a game that makes the concepts stick.
          </motion.p>
          <motion.div className="hero__cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.42 }}>
            <MagneticButton className="btn--primary" onClick={onEnter}><i className="ti ti-bolt" /> Enter the Practice Arena</MagneticButton>
            <MagneticButton className="btn--ghost" onClick={() => scrollTo('why')}>Why Salesforce? <i className="ti ti-arrow-down" /></MagneticButton>
          </motion.div>
        </motion.div>
        <motion.div style={{ marginTop: 44 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.5 }}>
          <CloudLogo size={118} />
        </motion.div>
        <div className="hero__scroll"><span>Scroll</span><i className="ti ti-chevron-down" /></div>
      </section>

      {/* ───── WHY ───── */}
      <section className="chapter shell wide" id="why">
        <motion.div className="shead" {...reveal}>
          <div className="eyebrow">Why this matters</div>
          <h2>The cloud skill the market keeps asking for</h2>
          <p>Salesforce runs the customer side of a huge share of the world\u2019s companies \u2014 and that ecosystem constantly needs builders. Here\u2019s the opportunity, and how this app gets you there.</p>
        </motion.div>
        <div className="valuegrid">
          {VALUES.map((v, i) => (
            <motion.div className="valuecard" key={v.t} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.08, ease: [.2, .8, .2, 1] }}>
              <div className="valuecard__icon" style={{ background: v.b, color: v.c, border: `1px solid ${v.g}` }}><i className={`ti ${v.i}`} /></div>
              <h3>{v.t}</h3><p>{v.d}</p>
            </motion.div>
          ))}
        </div>
        <motion.div className="statband" {...reveal}>
          {STATS.map((s) => (<div className="stat" key={s.l}><div className="stat__num">{s.n}</div><div className="stat__lbl">{s.l}</div></div>))}
        </motion.div>
      </section>

      {/* ───── ARENA ───── */}
      <section className="chapter shell wide">
        <div className="arena">
          <motion.div className="arena__copy" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease: [.2, .8, .2, 1] }}>
            <div className="eyebrow">The Practice Arena</div>
            <h2>Real scenarios. Instant feedback. Every run different.</h2>
            <p>No flashcards of trivia. Every question drops you into a production situation \u2014 a failing deploy, a governor-limit surprise, a security gotcha \u2014 and asks what you\u2019d actually do.</p>
            <div className="arena__feats">
              {FEATS.map((f) => (<div className="arena__feat" key={f.t}><i className={`ti ${f.i}`} />{f.t}</div>))}
            </div>
            <MagneticButton className="btn--primary" onClick={onEnter}><i className="ti ti-bolt" /> Enter the Arena</MagneticButton>
          </motion.div>
          <motion.div className="arena__preview" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease: [.2, .8, .2, 1] }}>
            <div className="preview-tags"><span className="preview-tag">Governor Limits</span><span className="preview-tag">Gotcha</span></div>
            <p className="preview-q">A trigger works in the sandbox but throws \u201CToo many SOQL queries: 101\u201D after a data load in production. Most likely cause?</p>
            <div className="preview-opt"><b>A</b> The sandbox has a higher SOQL limit</div>
            <div className="preview-opt good"><b>B</b> A bulk insert of 200+ records hit an unbulkified query in a loop &nbsp;\u2713</div>
            <div className="preview-opt"><b>C</b> A missing @future annotation</div>
            <div className="preview-opt"><b>D</b> The Apex class wasn\u2019t deployed</div>
          </motion.div>
        </div>
      </section>

      {/* ───── GAME TEASER ───── */}
      <section className="chapter shell wide">
        <motion.div className="gameteaser" {...reveal}>
          <div className="soon"><i className="ti ti-tools" /> Coming next</div>
          <h2>Schema Architect</h2>
          <p>Drag objects onto a canvas and wire them together with the right relationship \u2014 lookup vs master-detail \u2014 to solve a real business scenario. Learn the data model by building it, not memorising it.</p>
          <div className="nodes">
            <div className="node"><i className="ti ti-building-store" /> Account</div>
            <i className="ti ti-arrow-right node-link" />
            <div className="node"><i className="ti ti-user" /> Contact</div>
            <i className="ti ti-arrow-right node-link" />
            <div className="node"><i className="ti ti-target" /> Opportunity</div>
          </div>
        </motion.div>
      </section>

      {/* ───── CERTS ───── */}
      <section className="chapter shell wide">
        <motion.div className="shead" {...reveal}>
          <div className="eyebrow">Map your path</div>
          <h2>Certifications worth chasing</h2>
          <p>An illustrative map with original icons \u2014 not official badges. Always verify current status on Trailhead; the full interactive explorer is on the roadmap.</p>
        </motion.div>
        <div className="certgrid">
          {ACTIVE_CERTS.map((c, i) => (
            <motion.div className="certcard" key={c.n} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }}>
              <div className="certcard__top"><div className="certcard__ic" style={{ background: c.c }}><i className={`ti ${c.i}`} /></div><span className="certcard__tier tier-active">Active</span></div>
              <h4>{c.n}</h4><span>{c.d}</span>
            </motion.div>
          ))}
        </div>
        <div className="certs-sub"><i className="ti ti-archive" /> Retired / renamed</div>
        <div className="certgrid">
          {RETIRED_CERTS.map((c) => (
            <div className="certcard" key={c.n} style={{ opacity: 0.72 }}>
              <div className="certcard__top"><div className="certcard__ic" style={{ background: 'var(--ink-3)' }}><i className={`ti ${c.i}`} /></div><span className="certcard__tier tier-retired">Retired</span></div>
              <h4>{c.n}</h4><span>{c.d}</span>
            </div>
          ))}
        </div>
        <div className="resources">
          <a className="reslink" href="https://trailhead.salesforce.com" target="_blank" rel="noreferrer"><i className="ti ti-map-2" /> Trailhead</a>
          <a className="reslink" href="https://developer.salesforce.com/docs" target="_blank" rel="noreferrer"><i className="ti ti-book" /> Developer Docs</a>
          <a className="reslink" href="https://help.salesforce.com" target="_blank" rel="noreferrer"><i className="ti ti-lifebuoy" /> Help Portal</a>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="chapter shell" style={{ textAlign: 'center', paddingBottom: 30 }}>
        <motion.div {...reveal}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(30px,6vw,56px)', letterSpacing: '-0.03em', marginBottom: 18, color: 'var(--ink)' }}>Ready to level up?</h2>
          <p style={{ color: 'var(--ink-2)', marginBottom: 28, fontSize: 16, maxWidth: '46ch', marginInline: 'auto' }}>Pick a level and take your first ten questions. It\u2019s free, and it never asks the same thing twice.</p>
          <MagneticButton className="btn--amber" onClick={onEnter}><i className="ti ti-bolt" /> Start practising now</MagneticButton>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
