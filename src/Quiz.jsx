import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sound } from './sound'
import { MagneticButton, TiltCard, Confetti, useCountUp, usePrefersReducedMotion } from './ui'

const LEVELS = [
  { id:'1yr', label:'1 Year', title:'Junior Developer', icon:'ti-seedling', cv:'lv1', topics:'Basics · Triggers · SOQL · Profiles',
    prompt:`1 year of Salesforce developer experience. Core areas: basic Apex DML/SOQL syntax, before vs after trigger use cases, bulkification concept (why SOQL/DML must never be inside loops), standard object relationships (Account→Contact, Opportunity stages), basic security model (Profile vs Permission Set, OWD, Role Hierarchy, Sharing Rules), governor limits awareness (100 SOQL, 150 DML, 6MB heap), basic validation rules with formula fields, basic Flow (Screen Flow, Record-Triggered), change set deployment basics. Include edge cases and gotchas that trip up junior developers who think they know the basics.` },
  { id:'3yr', label:'3 Years', title:'Mid-Level Developer', icon:'ti-bolt', cv:'lv2', topics:'Patterns · Limits · LWC · REST API',
    prompt:`3 years of Salesforce developer experience. Core areas: Trigger Handler Pattern (why logic must be separated from trigger body), bulk trigger edge cases and recursion prevention, complex SOQL (parent-to-child subqueries, aggregate SOQL in tests, semi-joins, anti-joins), test class best practices (@testSetup vs @isTest, HttpCalloutMock interface, Test.startTest/stopTest for async governor limit reset), governor limit scenarios in production (CPU time, mixed DML, SOQL in loops inside flows), REST HTTP callout patterns (HttpRequest/HttpResponse, Named Credentials), basic LWC (@api, @track, wire service, custom events with bubbling), advanced Flow (subflows, fault paths, loop anti-patterns that hit governor limits), sharing keywords (with sharing, without sharing, inherited sharing implications on data leakage).` },
  { id:'5yr', label:'5 Years', title:'Senior Developer', icon:'ti-flame', cv:'lv3', topics:'fflib · Async · Platform Events · DevOps',
    prompt:`5 years of Salesforce developer experience. Core areas: fflib enterprise patterns (UnitOfWork, Selector, Service, Domain separation and why), Queueable chaining patterns and Finalizer interface (how it differs from try-catch), Batch Apex edge cases (stateful interface, scope vs chunk size, governor limit difference between start/execute/finish, what happens when execute throws), Platform Events (immediate vs transaction publish, replay ID concepts, subscriber trigger limitations, high-volume vs standard event trade-offs), Change Data Capture (what entities are supported, change type field), LWC advanced wire adapter (@wire with functions, caching, refresh, imperative apex vs wire for form submissions), integration error handling (idempotency keys, retry with exponential backoff, named credentials with auth providers), unlocked packages vs managed packages vs org-dependent, scratch org limitations vs developer sandbox.` },
  { id:'7yr', label:'7 Years', title:'Tech Lead', icon:'ti-rocket', cv:'lv4', topics:'Scale · Shield · Multi-org · CI/CD',
    prompt:`7 years Salesforce tech lead/senior developer experience. Core areas: data skew and record locking (what causes account or owner skew, how to detect and fix, chunked processing strategies), Composite API patterns (allOrNone behavior in mixed success/failure, subrequest reference variables, 25 subrequest limit), Shield Platform Encryption (deterministic vs probabilistic encryption, which cannot be searched, formula field restrictions, performance impact), External Objects via Salesforce Connect (OData 4.0 adapter, cross-org adapter, licensing implications, governor limit differences), Platform Cache (org cache vs session cache, partition naming, cache miss graceful degradation patterns), Apex CPU optimization (lazy loading, caching in static variables, using Map over List for lookups), ISV managed package concepts (namespace isolation, subscriber org context, version deprecation), complex sharing recalculation triggers.` },
  { id:'10yr', label:'10 Years', title:'Principal Engineer', icon:'ti-diamond', cv:'lv5', topics:'Data Architecture · Limits at Scale · Strategy',
    prompt:`10 years Salesforce principal engineer experience. Core areas: big objects and data archiving strategies (when to archive vs external storage, indexing fields, async SOQL), async processing at enterprise scale (platform event order guarantees or lack thereof, concurrent batch limit of 5, Queueable depth limit of 50, how to build reliable pipelines despite these limits), org consolidation and migration patterns (what breaks in org merges, field API name conflicts, community user migration), CRM Analytics data flow and recipe design principles, MuleSoft API-led connectivity decision framework (when it solves vs when it over-engineers), GDPR right-to-erasure implementation patterns in Salesforce (what can and cannot be auto-deleted), data migration at scale (Bulk API 2.0 vs REST vs ETL tool trade-offs at 50M+ records), license cost optimization at enterprise scale, platform event bulkhead patterns for large integration volumes.` },
  { id:'architect', label:'Architect', title:'CTA Level', icon:'ti-building', cv:'lv6', topics:'System Design · Enterprise · Multi-Cloud',
    prompt:`Salesforce Certified Technical Architect (CTA) exam level. Core areas: multi-org topology decisions (single org vs hub-and-spoke vs mesh topology trade-offs), integration architecture patterns and when to use each (Salesforce-to-Salesforce, REST/SOAP, event-driven, MuleSoft, direct DB), non-functional requirements translation (99.99% availability, disaster recovery RPO/RTO mapping to Salesforce features), canonical data model design for 360-degree customer view (master data management, golden record strategy), data residency and sovereignty compliance with Hyperforce, enterprise API security architecture (OAuth 2.0 scope design, JWT bearer flow vs web server flow selection criteria, mutual TLS), capacity planning and governor limit governance across 20+ teams, total cost of ownership analysis (build vs buy with 5-year TCO view), vendor lock-in risk and mitigation patterns.` },
]

const buildPrompt = (level) =>
`You are a senior Salesforce architect generating MCQ questions for a developer with ${level.prompt}

Generate EXACTLY 10 scenario-based MCQ questions. These must be TRICKY, RARE, and grounded in real production scenarios.

MANDATORY RULES:
1. Every question MUST begin with a realistic scenario: "A developer discovers...", "During a production incident...", "A client reports that...", "You are reviewing a PR where...", "After a deployment to production...", "You are designing a system where..."
2. Include at LEAST 3 questions about RARE or COUNTERINTUITIVE Salesforce behavior
3. Include at LEAST 2 questions about COMMON MISTAKES developers at this level make in production
4. Every wrong option must be PLAUSIBLE
5. Explanations must cover why the correct answer is right AND why each wrong answer is wrong
6. Cover diverse topics — no two questions on the same sub-topic

Return ONLY raw JSON. No markdown. No code fences. No preamble.

{"questions":[{"id":1,"question":"Scenario...","options":["A. first","B. second","C. third","D. fourth"],"correct":0,"explanation":"...","topic":"Short topic","type":"rare"}]}

"type" must be exactly one of: "rare", "gotcha", "scenario", "bestpractice". "correct" is 0-indexed.`

const TYPE_CFG = {
  rare:{label:'Rare',icon:'ti-alert-triangle'}, gotcha:{label:'Gotcha',icon:'ti-bug'},
  scenario:{label:'Scenario',icon:'ti-briefcase'}, bestpractice:{label:'Best Practice',icon:'ti-shield-check'},
}
const lvVars = (lv) => ({ '--lvc':`var(--${lv.cv}-c)`, '--lvg':`var(--${lv.cv}-g)`, '--lvb':`var(--${lv.cv}-b)` })

const RANKS = [
  { name:'Rookie', min:0, icon:'ti-seedling' }, { name:'Apprentice', min:120, icon:'ti-bolt' },
  { name:'Practitioner', min:320, icon:'ti-tools' }, { name:'Specialist', min:640, icon:'ti-star' },
  { name:'Expert', min:1080, icon:'ti-flame' }, { name:'Architect', min:1680, icon:'ti-building-arch' },
  { name:'Legend', min:2600, icon:'ti-crown' },
]
function rankFor(xp) {
  let r = RANKS[0], next = RANKS[1] || null
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) { r = RANKS[i]; next = RANKS[i + 1] || null }
  const prog = next ? Math.min(100, Math.round(((xp - r.min) / (next.min - r.min)) * 100)) : 100
  return { r, next, prog }
}

const screenV = {
  initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [.2,.8,.2,1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.28 } },
}
const stagger = { animate: { transition: { staggerChildren: 0.07 } } }
const itemV = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [.2,.8,.2,1] } } }

const sessionCache = {} // last good question set per level (session only)

export default function Quiz({ onExit }) {
  const [phase, setPhase] = useState('select')
  const [level, setLevel] = useState(null)
  const [qs, setQs] = useState([])
  const [idx, setIdx] = useState(0)
  const [sel, setSel] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState([])
  const [error, setError] = useState(null)
  const [best, setBest] = useState({})
  const [revIdx, setRevIdx] = useState(0)
  const [showExp, setShowExp] = useState(false)
  const [dots, setDots] = useState(1)
  const [streak, setStreak] = useState(0)
  const [roundXp, setRoundXp] = useState(0)
  const [xp, setXp] = useState(0)
  const [xpGain, setXpGain] = useState(0)
  const [rankUp, setRankUp] = useState(false)
  const [coins, setCoins] = useState([])
  const coinId = useRef(0)

  useEffect(() => {
    try { const b = localStorage.getItem('sfq_best_v3'); if (b) setBest(JSON.parse(b)) } catch {}
    try { const x = localStorage.getItem('sfq_xp'); if (x) setXp(parseInt(x, 10) || 0) } catch {}
  }, [])
  useEffect(() => {
    if (phase !== 'loading') return
    const t = setInterval(() => setDots((d) => (d >= 3 ? 1 : d + 1)), 460)
    return () => clearInterval(t)
  }, [phase])

  const spawnCoin = (x, y, val) => { const id = ++coinId.current; setCoins((c) => [...c, { id, x, y, val }]) }
  const removeCoin = (id) => setCoins((c) => c.filter((k) => k.id !== id))

  const launch = useCallback(async (lv) => {
    Sound.click()
    setLevel(lv); setPhase('loading'); setError(null)
    setAnswers([]); setQs([]); setIdx(0); setSel(null); setRevealed(false); setShowExp(false)
    setStreak(0); setRoundXp(0); setXpGain(0); setRankUp(false)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'groq', max_tokens: 6000, messages: [{ role: 'user', content: buildPrompt(lv) }] }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(data?.error || `Request failed (HTTP ${res.status})`)
      const raw = data.content?.find((b) => b.type === 'text')?.text || ''
      const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
      if (s < 0) throw new Error('The generator returned an unexpected format. Please try again.')
      let parsed
      try { parsed = JSON.parse(raw.slice(s, e + 1)) } catch { throw new Error('Could not parse the generated questions. Please try again.') }
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 5) throw new Error('The generator returned too few questions. Please try again.')
      const norm = parsed.questions.slice(0, 10).map((q, i) => ({
        id: i + 1, question: q.question || 'Question unavailable',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A. Option A','B. Option B','C. Option C','D. Option D'],
        correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
        explanation: q.explanation || 'No explanation provided.', topic: q.topic || 'General',
        type: Object.keys(TYPE_CFG).includes(q.type) ? q.type : 'scenario',
      }))
      sessionCache[lv.id] = norm
      setQs(norm); setPhase('quiz')
    } catch (err) {
      // graceful fallback: if rate-limited but we have a cached set this session, use it
      if (sessionCache[lv.id]) { setQs(sessionCache[lv.id]); setError(null); setPhase('quiz') }
      else { setError(err.message || 'Something went wrong. Please try again.'); setPhase('select') }
    }
  }, [])

  const pick = (i, e) => {
    if (revealed) return
    setSel(i); setRevealed(true); setShowExp(false)
    const correct = i === qs[idx].correct
    if (correct) {
      const ns = streak + 1; setStreak(ns)
      const val = 10 + Math.min(ns - 1, 5) * 2
      setRoundXp((r) => r + val); Sound.correct(ns)
      setTimeout(() => Sound.coin(), 110)
      spawnCoin(e?.clientX ?? window.innerWidth / 2, e?.clientY ?? 200, val)
    } else { setStreak(0); Sound.wrong() }
  }

  const advance = () => {
    Sound.click()
    const q = qs[idx]
    const na = [...answers, { sel, correct: q.correct, q }]
    setAnswers(na)
    if (idx + 1 >= qs.length) {
      const sc = na.filter((a) => a.sel === a.correct).length
      const pctv = Math.round((sc / na.length) * 100)
      const bonus = pctv >= 90 ? 50 : pctv >= 70 ? 20 : 0
      const gain = roundXp + bonus
      const before = xp, after = before + gain
      const changed = rankFor(before).r.name !== rankFor(after).r.name
      setXp(after); try { localStorage.setItem('sfq_xp', String(after)) } catch {}
      setXpGain(gain); setRankUp(changed)
      const upd = { ...best }
      if (upd[level.id] === undefined || sc > upd[level.id]) { upd[level.id] = sc; setBest(upd); try { localStorage.setItem('sfq_best_v3', JSON.stringify(upd)) } catch {} }
      Sound.finish(pctv >= 70); if (changed) setTimeout(() => Sound.rankUp(), 650)
      setPhase('results')
    } else { setIdx((p) => p + 1); setSel(null); setRevealed(false); setShowExp(false) }
  }

  const score = answers.filter((a) => a.sel === a.correct).length
  const rk = rankFor(xp)

  return (
    <div className="arena-view shell">
      {/* coins */}
      <AnimatePresence>
        {coins.map((c) => (
          <motion.div key={c.id} className="coin" initial={{ opacity: 0, scale: 0.4, x: c.x, y: c.y }} animate={{ opacity: 1, scale: 1, x: c.x, y: c.y - 78 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} onAnimationComplete={() => removeCoin(c.id)}>
            <i className="ti ti-coin" />+{c.val}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="backbar">
        <MagneticButton className="btn--ghost" style={{ padding: '9px 16px' }} onClick={() => { Sound.click(); phase === 'select' ? onExit() : setPhase('select') }}>
          <i className="ti ti-arrow-left" /> {phase === 'select' ? 'Home' : 'Levels'}
        </MagneticButton>
        <span className="rev__count">{rk.r.name} · {xp} XP</span>
      </div>

      <AnimatePresence mode="wait">
        {/* ───── SELECT ───── */}
        {phase === 'select' && (
          <motion.div key="select" variants={screenV} initial="initial" animate="animate" exit="exit">
            <div className="rankhud">
              <div className="rankhud__icon"><i className={`ti ${rk.r.icon}`} /></div>
              <div className="rankhud__body">
                <div className="rankhud__top"><span className="rankhud__name">{rk.r.name}</span><span className="rankhud__xp">{xp} XP</span></div>
                <div className="rankhud__bar"><motion.div className="rankhud__fill" initial={{ width: 0 }} animate={{ width: `${rk.prog}%` }} transition={{ duration: 0.8, ease: [.2,.8,.2,1] }} /></div>
                <div className="rankhud__next">{rk.next ? `${rk.next.min - xp} XP to ${rk.next.name}` : 'Max rank reached — Legend'}</div>
              </div>
            </div>
            <div className="arena-head"><h2>Choose your level</h2><p>Ten fresh scenario questions, tuned to your experience.</p></div>
            {error && <div className="alert"><i className="ti ti-alert-circle" /><span>{error}</span></div>}
            <motion.div className="grid" variants={stagger} initial="initial" animate="animate">
              {LEVELS.map((lv) => (
                <motion.div key={lv.id} variants={itemV}>
                  <TiltCard style={lvVars(lv)} onClick={() => launch(lv)}>
                    <div className="lvcard" style={lvVars(lv)} onMouseEnter={() => Sound.hover()}>
                      <div className="lvcard__top"><span className="lvcard__icon"><i className={`ti ${lv.icon}`} /></span>{best[lv.id] !== undefined && <span className="lvcard__best">best {best[lv.id]}/10</span>}</div>
                      <div className="lvcard__label">{lv.label}</div><div className="lvcard__title">{lv.title}</div>
                      <div className="lvcard__topics">{lv.topics}</div>
                      <div className="lvcard__go">Start quiz <i className="ti ti-arrow-right" /></div>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ───── LOADING ───── */}
        {phase === 'loading' && level && (
          <motion.div key="loading" className="load" variants={screenV} initial="initial" animate="animate" exit="exit">
            <div className="load__orbit"><i className={`ti ${level.icon}`} /></div>
            <p className="load__title">Generating questions{'·'.repeat(dots)}</p>
            <p className="load__lv">{level.label} · {level.title}</p>
            <p className="load__meta">scenario-based · rare gotchas · production edge cases</p>
          </motion.div>
        )}

        {/* ───── QUIZ ───── */}
        {phase === 'quiz' && qs[idx] && (
          <motion.div key="quiz" variants={screenV} initial="initial" animate="animate" exit="exit" style={lvVars(level)}>
            <div className="qhead">
              <div className="qhead__lv"><i className={`ti ${level.icon}`} />{level.label}</div>
              <div className="qhead__right">
                <AnimatePresence>{streak >= 2 && (<motion.span className="combo" key="combo" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}><i className="ti ti-flame" /> {streak}× streak</motion.span>)}</AnimatePresence>
                <span className="qhead__score">{score}/{answers.length}</span>
              </div>
            </div>
            <div className="pbar"><motion.div className="pbar__fill" animate={{ width: `${(idx / qs.length) * 100}%` }} transition={{ duration: 0.5, ease: [.2,.8,.2,1] }} /></div>
            <div className="dots">
              {qs.map((_, i) => { let c = 'dot'; if (i < answers.length) c += answers[i].sel === answers[i].correct ? ' yes' : ' no'; else if (i === idx) c += ' cur'; return <span key={i} className={c} /> })}
              <span className="dots__count">Q{idx + 1}/{qs.length}</span>
            </div>
            {(() => { const q = qs[idx], tm = TYPE_CFG[q.type] || TYPE_CFG.scenario; return (
              <motion.div className="qcard" key={`q${idx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="qcard__tags"><span className="tag">{q.topic}</span><span className="tag tag--type"><i className={`ti ${tm.icon}`} />{tm.label}</span></div>
                <p className="qcard__text">{q.question}</p>
              </motion.div>
            )})()}
            <motion.div className="opts" key={`opts${idx}`} variants={stagger} initial="initial" animate="animate">
              {qs[idx].options.map((opt, i) => {
                const q = qs[idx]; let c = 'opt'
                const ok = revealed && i === q.correct, ng = revealed && i === sel && i !== q.correct
                if (revealed) c += ok ? ' ok' : ng ? ' ng' : ' dim'
                return (
                  <motion.button key={i} className={c} variants={itemV} onClick={(e) => pick(i, e)} disabled={revealed} whileHover={!revealed ? { x: 4 } : {}} whileTap={!revealed ? { scale: 0.985 } : {}}>
                    <span className="opt__key">{ok ? <i className="ti ti-check" /> : ng ? <i className="ti ti-x" /> : String.fromCharCode(65 + i)}</span>
                    <span>{opt.replace(/^[A-D]\.\s*/i, '')}</span>
                  </motion.button>
                )
              })}
            </motion.div>
            {revealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button className="expbtn" onClick={() => setShowExp((x) => !x)}><i className={`ti ${showExp ? 'ti-chevron-down' : 'ti-chevron-right'}`} />{showExp ? 'Hide explanation' : 'Show explanation'}</button>
                <AnimatePresence>{showExp && (<motion.div className="exp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                  <div className="exp__head"><i className="ti ti-bulb" /><span>Explanation</span></div><p className="exp__body">{qs[idx].explanation}</p>
                </motion.div>)}</AnimatePresence>
                <MagneticButton className="btn--lv btn--block" onClick={advance}>{idx + 1 >= qs.length ? 'See results' : 'Next question'} <i className="ti ti-arrow-right" /></MagneticButton>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ───── RESULTS ───── */}
        {phase === 'results' && level && (
          <motion.div key="results" variants={screenV} initial="initial" animate="animate" exit="exit" style={lvVars(level)}>
            <Results level={level} answers={answers} score={score} best={best} xpGain={xpGain} rankUp={rankUp} rankName={rk.r.name}
              onReview={(i) => { Sound.click(); setRevIdx(i); setPhase('review') }} onRetry={() => launch(level)} onLevels={() => { Sound.click(); setPhase('select') }} />
          </motion.div>
        )}

        {/* ───── REVIEW ───── */}
        {phase === 'review' && answers[revIdx] && (() => {
          const a = answers[revIdx], q = a.q, ok = a.sel === a.correct
          return (
            <motion.div key="review" variants={screenV} initial="initial" animate="animate" exit="exit" style={lvVars(level)}>
              <div className="rev__nav">
                <MagneticButton className="btn--ghost" style={{ padding: '9px 16px' }} onClick={() => { Sound.click(); setPhase('results') }}><i className="ti ti-arrow-left" /> Results</MagneticButton>
                <span className="rev__count">{revIdx + 1} / {answers.length}</span>
              </div>
              <div className="qcard" style={{ borderLeftColor: ok ? 'var(--ok-line)' : 'var(--no-line)' }}>
                <div className="qcard__tags"><span className="tag">{q.topic}</span><span className="tag--type" style={{ color: ok ? 'var(--ok)' : 'var(--no)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className={`ti ${ok ? 'ti-check' : 'ti-x'}`} style={{ fontSize: 12 }} />{ok ? 'Correct' : 'Incorrect'}</span></div>
                <p className="qcard__text">{q.question}</p>
              </div>
              <div className="opts">
                {q.options.map((opt, i) => { const isC = i === q.correct, isU = i === a.sel, isW = isU && !isC; const cls = isC ? 'rev__opt c' : isW ? 'rev__opt w' : 'rev__opt x'; return (
                  <div key={i} className={cls}><span className="rev__optkey">{String.fromCharCode(65 + i)}</span><span style={{ flex: 1 }}>{opt.replace(/^[A-D]\.\s*/i, '')}</span>{isC && <span className="rev__badge">CORRECT</span>}{isW && <span className="rev__badge">YOUR PICK</span>}</div>
                )})}
              </div>
              <div className="exp"><div className="exp__head"><i className="ti ti-bulb" /><span>Explanation</span></div><p className="exp__body">{q.explanation}</p></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <MagneticButton className="btn--ghost" style={{ flex: 1 }} disabled={revIdx === 0} onClick={() => { Sound.click(); setRevIdx((p) => Math.max(0, p - 1)) }}><i className="ti ti-arrow-left" /> Prev</MagneticButton>
                <MagneticButton className="btn--lv" style={{ flex: 1 }} disabled={revIdx === answers.length - 1} onClick={() => { Sound.click(); setRevIdx((p) => Math.min(answers.length - 1, p + 1)) }}>Next <i className="ti ti-arrow-right" /></MagneticButton>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

function Results({ level, answers, score, best, xpGain, rankUp, rankName, onReview, onRetry, onLevels }) {
  const reduced = usePrefersReducedMotion()
  const total = answers.length
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const display = useCountUp(score, 1100)
  const msg = pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Solid work' : pct >= 50 ? 'Keep going' : 'More practice needed'
  const sub = pct >= 90 ? 'You nailed it. Ready to try a harder level?' : pct >= 70 ? 'Good foundation. Review the ones you missed.' : pct >= 50 ? "You're getting there. Study the explanations." : 'Review all the explanations and run it again.'
  const R = 76, C = 2 * Math.PI * R, offset = C - (pct / 100) * C
  return (
    <>
      <Confetti fire={pct >= 70} />
      <div className="res">
        <div className="res__ring">
          <svg viewBox="0 0 168 168">
            <circle cx="84" cy="84" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
            <motion.circle cx="84" cy="84" r={R} fill="none" stroke="var(--lvc)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: reduced ? offset : C }} animate={{ strokeDashoffset: offset }} transition={{ duration: reduced ? 0 : 1.1, ease: [.2,.8,.2,1] }} style={{ filter: 'drop-shadow(0 0 8px var(--lvg))' }} />
          </svg>
          <div className="res__num">{display}<span>/{total}</span></div>
        </div>
        <div className="res__msg">{msg}</div><p className="res__sub">{sub}</p>
        {xpGain > 0 && (<div className="res__xp"><i className="ti ti-coin" /> +{xpGain} XP earned{rankUp && <span className="res__rankup"><i className="ti ti-arrow-up" /> {rankName}!</span>}</div>)}
        {best[level.id] !== undefined && <span className="res__best">best: {best[level.id]}/10 · {level.label}</span>}
      </div>
      <div className="breakdown">
        <p className="breakdown__label">Tap a question to review it</p>
        <div className="breakdown__grid">{answers.map((a, i) => (<button key={i} className={`qchip ${a.sel === a.correct ? 'yes' : 'no'}`} onClick={() => onReview(i)}>{i + 1}</button>))}</div>
      </div>
      <div className="stack">
        <MagneticButton className="btn--ghost" onClick={() => onReview(0)}><i className="ti ti-eye" /> Review all questions & explanations</MagneticButton>
        <MagneticButton className="btn--primary btn--block" onClick={onRetry}><i className="ti ti-refresh" /> New set — {level.label}</MagneticButton>
        <MagneticButton className="btn--ghost" onClick={onLevels}><i className="ti ti-layout-grid" /> Choose a different level</MagneticButton>
      </div>
    </>
  )
}
