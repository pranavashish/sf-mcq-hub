import { useState, useCallback, useEffect } from 'react'
import { CloudLogo } from './SalesforceLogo'
import {
  AuroraBackground, StatusBar, TiltCard, RippleButton, Confetti,
  useCountUp, usePrefersReducedMotion,
} from './ui'

/* ───────────── DATA ───────────── */
const LEVELS = [
  {
    id: '1yr', label: '1 Year', title: 'Junior Developer',
    icon: 'ti-seedling', cv: 'lv1',
    topics: 'Basics · Triggers · SOQL · Profiles',
    prompt: `1 year of Salesforce developer experience. Core areas: basic Apex DML/SOQL syntax, before vs after trigger use cases, bulkification concept (why SOQL/DML must never be inside loops), standard object relationships (Account→Contact, Opportunity stages), basic security model (Profile vs Permission Set, OWD, Role Hierarchy, Sharing Rules), governor limits awareness (100 SOQL, 150 DML, 6MB heap), basic validation rules with formula fields, basic Flow (Screen Flow, Record-Triggered), change set deployment basics. Include edge cases and gotchas that trip up junior developers who think they know the basics.`,
  },
  {
    id: '3yr', label: '3 Years', title: 'Mid-Level Developer',
    icon: 'ti-bolt', cv: 'lv2',
    topics: 'Patterns · Limits · LWC · REST API',
    prompt: `3 years of Salesforce developer experience. Core areas: Trigger Handler Pattern (why logic must be separated from trigger body), bulk trigger edge cases and recursion prevention, complex SOQL (parent-to-child subqueries, aggregate SOQL in tests, semi-joins, anti-joins), test class best practices (@testSetup vs @isTest, HttpCalloutMock interface, Test.startTest/stopTest for async governor limit reset), governor limit scenarios in production (CPU time, mixed DML, SOQL in loops inside flows), REST HTTP callout patterns (HttpRequest/HttpResponse, Named Credentials), basic LWC (@api, @track, wire service, custom events with bubbling), advanced Flow (subflows, fault paths, loop anti-patterns that hit governor limits), sharing keywords (with sharing, without sharing, inherited sharing implications on data leakage).`,
  },
  {
    id: '5yr', label: '5 Years', title: 'Senior Developer',
    icon: 'ti-flame', cv: 'lv3',
    topics: 'fflib · Async · Platform Events · DevOps',
    prompt: `5 years of Salesforce developer experience. Core areas: fflib enterprise patterns (UnitOfWork, Selector, Service, Domain separation and why), Queueable chaining patterns and Finalizer interface (how it differs from try-catch), Batch Apex edge cases (stateful interface, scope vs chunk size, governor limit difference between start/execute/finish, what happens when execute throws), Platform Events (immediate vs transaction publish, replay ID concepts, subscriber trigger limitations, high-volume vs standard event trade-offs), Change Data Capture (what entities are supported, change type field), LWC advanced wire adapter (@wire with functions, caching, refresh, imperative apex vs wire for form submissions), integration error handling (idempotency keys, retry with exponential backoff, named credentials with auth providers), unlocked packages vs managed packages vs org-dependent, scratch org limitations vs developer sandbox.`,
  },
  {
    id: '7yr', label: '7 Years', title: 'Tech Lead',
    icon: 'ti-rocket', cv: 'lv4',
    topics: 'Scale · Shield · Multi-org · CI/CD',
    prompt: `7 years Salesforce tech lead/senior developer experience. Core areas: data skew and record locking (what causes account or owner skew, how to detect and fix, chunked processing strategies), Composite API patterns (allOrNone behavior in mixed success/failure, subrequest reference variables, 25 subrequest limit), Shield Platform Encryption (deterministic vs probabilistic encryption, which cannot be searched, formula field restrictions, performance impact), External Objects via Salesforce Connect (OData 4.0 adapter, cross-org adapter, licensing implications, governor limit differences), Platform Cache (org cache vs session cache, partition naming, cache miss graceful degradation patterns), Apex CPU optimization (lazy loading, caching in static variables, using Map over List for lookups), ISV managed package concepts (namespace isolation, subscriber org context, version deprecation), complex sharing recalculation triggers.`,
  },
  {
    id: '10yr', label: '10 Years', title: 'Principal Engineer',
    icon: 'ti-diamond', cv: 'lv5',
    topics: 'Data Architecture · Limits at Scale · Strategy',
    prompt: `10 years Salesforce principal engineer experience. Core areas: big objects and data archiving strategies (when to archive vs external storage, indexing fields, async SOQL), async processing at enterprise scale (platform event order guarantees or lack thereof, concurrent batch limit of 5, Queueable depth limit of 50, how to build reliable pipelines despite these limits), org consolidation and migration patterns (what breaks in org merges, field API name conflicts, community user migration), CRM Analytics (formerly Einstein Analytics) data flow and recipe design principles, MuleSoft API-led connectivity decision framework (when it solves vs when it over-engineers), GDPR right-to-erasure implementation patterns in Salesforce (what can and cannot be auto-deleted), data migration at scale (Bulk API 2.0 vs REST vs ETL tool trade-offs at 50M+ records), license cost optimization at enterprise scale, platform event bulkhead patterns for large integration volumes.`,
  },
  {
    id: 'architect', label: 'Architect', title: 'CTA Level',
    icon: 'ti-building', cv: 'lv6',
    topics: 'System Design · Enterprise · Multi-Cloud',
    prompt: `Salesforce Certified Technical Architect (CTA) exam level. Core areas: multi-org topology decisions (single org vs hub-and-spoke vs mesh topology trade-offs for specific business scenarios), integration architecture patterns and when to use each (Salesforce-to-Salesforce, REST/SOAP, event-driven, MuleSoft, direct DB), non-functional requirements translation (what 99.99% availability means in Salesforce context, disaster recovery RPO/RTO mapping to Salesforce features), canonical data model design for 360-degree customer view (master data management, golden record strategy), data residency and sovereignty compliance with Hyperforce regional deployment, enterprise API security architecture (OAuth 2.0 scope design, JWT bearer flow vs web server flow selection criteria, mutual TLS implications), capacity planning and governor limit governance (how to enforce limits across 20+ development teams), total cost of ownership analysis (build vs buy decisions with 5-year TCO view), vendor lock-in risk in Salesforce architecture and mitigation patterns.`,
  },
]

const buildPrompt = (level) =>
  `You are a senior Salesforce architect generating MCQ questions for a developer with ${level.prompt}

Generate EXACTLY 10 scenario-based MCQ questions. These must be TRICKY, RARE, and grounded in real production scenarios.

MANDATORY RULES:
1. Every question MUST begin with a realistic scenario: "A developer discovers...", "During a production incident...", "A client reports that...", "You are reviewing a PR where...", "After a deployment to production...", "You are designing a system where..."
2. Include at LEAST 3 questions about RARE or COUNTERINTUITIVE Salesforce behavior (things that surprise even experienced developers)
3. Include at LEAST 2 questions about COMMON MISTAKES that developers at this level make in production
4. Every wrong option must be PLAUSIBLE — no obviously wrong answers
5. Explanations must cover: why the correct answer is right AND why each wrong answer is wrong or misleading
6. Cover diverse topics — no two questions on the same sub-topic

Return ONLY raw JSON. No markdown. No code fences. No preamble. No trailing text after the JSON.

{"questions":[{"id":1,"question":"Scenario here...","options":["A. first","B. second","C. third","D. fourth"],"correct":0,"explanation":"Detailed explanation covering correct and wrong answers...","topic":"Short topic name","type":"rare"}]}

Rules for "type" field — must be exactly one of:
- "rare" = rare/counterintuitive Salesforce behavior
- "gotcha" = common production mistake
- "scenario" = architectural or design scenario
- "bestpractice" = best practice decision

"correct" is 0-indexed: 0=A, 1=B, 2=C, 3=D`

const TYPE_CFG = {
  rare:         { label: 'Rare',          icon: 'ti-alert-triangle' },
  gotcha:       { label: 'Gotcha',        icon: 'ti-bug' },
  scenario:     { label: 'Scenario',      icon: 'ti-briefcase' },
  bestpractice: { label: 'Best Practice', icon: 'ti-shield-check' },
}

const lvVars = (lv) => ({
  '--lvc': `var(--${lv.cv}-c)`,
  '--lvg': `var(--${lv.cv}-g)`,
  '--lvb': `var(--${lv.cv}-b)`,
})

/* ───────────── COMPONENT ───────────── */
export default function App() {
  const [phase,    setPhase]    = useState('home')
  const [level,    setLevel]    = useState(null)
  const [qs,       setQs]       = useState([])
  const [idx,      setIdx]      = useState(0)
  const [sel,      setSel]      = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [answers,  setAnswers]  = useState([])
  const [error,    setError]    = useState(null)
  const [best,     setBest]     = useState({})
  const [revIdx,   setRevIdx]   = useState(0)
  const [showExp,  setShowExp]  = useState(false)
  const [dots,     setDots]     = useState(1)

  const year = new Date().getFullYear()

  useEffect(() => {
    try { const s = localStorage.getItem('sfq_best_v3'); if (s) setBest(JSON.parse(s)) } catch {}
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    const t = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 460)
    return () => clearInterval(t)
  }, [phase])

  const launch = useCallback(async (lv) => {
    setLevel(lv); setPhase('loading'); setError(null)
    setAnswers([]); setQs([]); setIdx(0); setSel(null); setRevealed(false); setShowExp(false)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{ role: 'user', content: buildPrompt(lv) }],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw  = data.content?.find(b => b.type === 'text')?.text || ''
      const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
      if (s < 0) throw new Error('No JSON')
      const parsed = JSON.parse(raw.slice(s, e + 1))
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 5) throw new Error('Too few')
      const norm = parsed.questions.slice(0, 10).map((q, i) => ({
        id: i + 1,
        question:    q.question || 'Question unavailable',
        options:     Array.isArray(q.options) && q.options.length === 4 ? q.options
                       : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
        correct:     typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
        explanation: q.explanation || 'No explanation provided.',
        topic:       q.topic || 'General',
        type:        Object.keys(TYPE_CFG).includes(q.type) ? q.type : 'scenario',
      }))
      setQs(norm); setPhase('quiz')
    } catch {
      setError('Could not generate questions. Check your API key in Vercel and try again.')
      setPhase('home')
    }
  }, [])

  const pick = (i) => { if (revealed) return; setSel(i); setRevealed(true); setShowExp(false) }

  const advance = () => {
    const q = qs[idx]
    const na = [...answers, { sel, correct: q.correct, q }]
    setAnswers(na)
    if (idx + 1 >= qs.length) {
      const sc = na.filter(a => a.sel === a.correct).length
      const upd = { ...best }
      if (upd[level.id] === undefined || sc > upd[level.id]) {
        upd[level.id] = sc; setBest(upd)
        try { localStorage.setItem('sfq_best_v3', JSON.stringify(upd)) } catch {}
      }
      setPhase('results')
    } else {
      setIdx(p => p + 1); setSel(null); setRevealed(false); setShowExp(false)
    }
  }

  const score = answers.filter(a => a.sel === a.correct).length

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <h2 className="sr-only">Salesforce MCQ Practice Hub — scenario-based questions across six career levels</h2>

        {/* TOP STATUS BAR — clock · brand · weather · theme */}
        <StatusBar />

        {/* ───── HOME ───── */}
        {phase === 'home' && (
          <div className="screen">
            <header className="hero">
              <div className="hero__logo"><CloudLogo size={104} /></div>
              <p className="hero__eyebrow">Salesforce Career Ladder</p>
              <h1 className="hero__title">Master the Cloud</h1>
              <p className="hero__sub">
                Ten fresh, scenario-based MCQs every session — rare gotchas, real production edge cases,
                and a full explanation for every answer, tuned to your experience level.
              </p>
              <div className="hero__stats">
                <span className="hero__chip"><i className="ti ti-stack-2" />6 levels</span>
                <span className="hero__chip"><i className="ti ti-refresh" />Fresh every run</span>
                <span className="hero__chip"><i className="ti ti-bulb" />Explained answers</span>
              </div>
            </header>

            {error && (
              <div className="alert"><i className="ti ti-alert-circle" />{error}</div>
            )}

            <div className="grid">
              {LEVELS.map((lv, i) => (
                <TiltCard key={lv.id} style={{ animationDelay: `${i * 70}ms`, ...lvVars(lv) }} onClick={() => launch(lv)}>
                  <div className="lvcard" style={lvVars(lv)}>
                    <div className="lvcard__top">
                      <span className="lvcard__icon"><i className={`ti ${lv.icon}`} /></span>
                      {best[lv.id] !== undefined && (
                        <span className="lvcard__best">best {best[lv.id]}/10</span>
                      )}
                    </div>
                    <div className="lvcard__label">{lv.label}</div>
                    <div className="lvcard__title">{lv.title}</div>
                    <div className="lvcard__topics">{lv.topics}</div>
                    <div className="lvcard__go">Start quiz <i className="ti ti-arrow-right" /></div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        )}

        {/* ───── LOADING ───── */}
        {phase === 'loading' && level && (
          <div className="screen load">
            <div className="load__orbit"><i className={`ti ${level.icon}`} /></div>
            <p className="load__title">Generating questions{'·'.repeat(dots)}</p>
            <p className="load__lv">{level.label} · {level.title}</p>
            <p className="load__meta">scenario-based · rare gotchas · production edge cases</p>
          </div>
        )}

        {/* ───── QUIZ ───── */}
        {phase === 'quiz' && qs[idx] && (() => {
          const q = qs[idx]
          const tm = TYPE_CFG[q.type] || TYPE_CFG.scenario
          const pct = (idx / qs.length) * 100
          return (
            <div className="screen" style={lvVars(level)}>
              <div className="qhead">
                <div className="qhead__lv"><i className={`ti ${level.icon}`} />{level.label}</div>
                <span className="qhead__score">{score}/{answers.length} correct</span>
              </div>

              <div className="pbar"><div className="pbar__fill" style={{ width: `${pct}%` }} /></div>

              <div className="dots">
                {qs.map((_, i) => {
                  let c = 'dot'
                  if (i < answers.length) c += answers[i].sel === answers[i].correct ? ' yes' : ' no'
                  else if (i === idx) c += ' cur'
                  return <span key={i} className={c} />
                })}
                <span className="dots__count">Q{idx + 1}/{qs.length}</span>
              </div>

              <div className="qcard" key={idx}>
                <div className="qcard__tags">
                  <span className="tag">{q.topic}</span>
                  <span className="tag tag--type"><i className={`ti ${tm.icon}`} />{tm.label}</span>
                </div>
                <p className="qcard__text">{q.question}</p>
              </div>

              <div className="opts">
                {q.options.map((opt, i) => {
                  let c = 'opt'
                  const ok = revealed && i === q.correct
                  const ng = revealed && i === sel && i !== q.correct
                  if (revealed) c += ok ? ' ok' : ng ? ' ng' : ' dim'
                  return (
                    <button key={i} className={c} style={{ animationDelay: `${i * 60}ms` }} onClick={() => pick(i)} disabled={revealed}>
                      <span className="opt__key">
                        {ok ? <i className="ti ti-check" /> : ng ? <i className="ti ti-x" /> : String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt.replace(/^[A-D]\.\s*/i, '')}</span>
                    </button>
                  )
                })}
              </div>

              {revealed && (
                <>
                  <button className="expbtn" onClick={() => setShowExp(e => !e)}>
                    <i className={`ti ${showExp ? 'ti-chevron-down' : 'ti-chevron-right'}`} />
                    {showExp ? 'Hide explanation' : 'Show explanation'}
                  </button>
                  {showExp && (
                    <div className="exp">
                      <div className="exp__head"><i className="ti ti-bulb" /><span>Explanation</span></div>
                      <p className="exp__body">{q.explanation}</p>
                    </div>
                  )}
                  <RippleButton className="btn--lv" onClick={advance}>
                    {idx + 1 >= qs.length ? 'See results' : 'Next question'} <i className="ti ti-arrow-right" />
                  </RippleButton>
                </>
              )}
            </div>
          )
        })()}

        {/* ───── RESULTS ───── */}
        {phase === 'results' && level && (
          <ResultsScreen
            level={level} answers={answers} score={score} best={best}
            onReview={(i) => { setRevIdx(i); setPhase('review') }}
            onRetry={() => launch(level)} onHome={() => setPhase('home')}
          />
        )}

        {/* ───── REVIEW ───── */}
        {phase === 'review' && answers[revIdx] && (() => {
          const a = answers[revIdx], q = a.q, ok = a.sel === a.correct
          return (
            <div className="screen" style={lvVars(level)}>
              <div className="rev__nav">
                <RippleButton className="btn--ghost" style={{ width: 'auto', padding: '9px 16px' }} onClick={() => setPhase('results')}>
                  <i className="ti ti-arrow-left" /> Results
                </RippleButton>
                <span className="rev__count">{revIdx + 1} / {answers.length}</span>
              </div>

              <div className="qcard" style={{ borderLeftColor: ok ? 'var(--ok-line)' : 'var(--no-line)' }}>
                <div className="qcard__tags">
                  <span className="tag">{q.topic}</span>
                  <span className="tag--type" style={{ color: ok ? 'var(--ok)' : 'var(--no)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <i className={`ti ${ok ? 'ti-check' : 'ti-x'}`} style={{ fontSize: 12 }} />{ok ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="qcard__text">{q.question}</p>
              </div>

              <div className="opts">
                {q.options.map((opt, i) => {
                  const isC = i === q.correct, isU = i === a.sel, isW = isU && !isC
                  const cls = isC ? 'rev__opt c' : isW ? 'rev__opt w' : 'rev__opt x'
                  return (
                    <div key={i} className={cls}>
                      <span className="rev__optkey">{String.fromCharCode(65 + i)}</span>
                      <span style={{ flex: 1 }}>{opt.replace(/^[A-D]\.\s*/i, '')}</span>
                      {isC && <span className="rev__badge">CORRECT</span>}
                      {isW && <span className="rev__badge">YOUR PICK</span>}
                    </div>
                  )
                })}
              </div>

              <div className="exp">
                <div className="exp__head"><i className="ti ti-bulb" /><span>Explanation</span></div>
                <p className="exp__body">{q.explanation}</p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <RippleButton className="btn--ghost" style={{ flex: 1 }} disabled={revIdx === 0} onClick={() => setRevIdx(p => Math.max(0, p - 1))}>
                  <i className="ti ti-arrow-left" /> Prev
                </RippleButton>
                <RippleButton className="btn--lv" style={{ flex: 1 }} disabled={revIdx === answers.length - 1} onClick={() => setRevIdx(p => Math.min(answers.length - 1, p + 1))}>
                  Next <i className="ti ti-arrow-right" />
                </RippleButton>
              </div>
            </div>
          )
        })()}

        {/* FOOTER */}
        <footer className="footer">
          <p className="footer__made">
            Crafted with <span className="footer__heart"><i className="ti ti-heart" /></span> by
            <span className="footer__name">Pranav</span>
          </p>
          <p className="footer__meta">© {year} · SF MCQ Hub · Salesforce scenario practice</p>
        </footer>
      </div>
    </>
  )
}

/* ───────────── RESULTS (separate so hooks run cleanly) ───────────── */
function ResultsScreen({ level, answers, score, best, onReview, onRetry, onHome }) {
  const reduced = usePrefersReducedMotion()
  const total = answers.length
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const display = useCountUp(score, 1000)

  const msg = pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Solid work' : pct >= 50 ? 'Keep going' : 'More practice needed'
  const sub = pct >= 90 ? 'You nailed it. Ready to try a harder level?'
            : pct >= 70 ? 'Good foundation. Review the ones you missed.'
            : pct >= 50 ? "You're getting there. Study the explanations."
            : 'Review all the explanations and run it again.'

  const R = 76, C = 2 * Math.PI * R
  const offset = C - (pct / 100) * C

  return (
    <div className="screen" style={lvVars(level)}>
      <Confetti fire={pct >= 70} />
      <div className="res">
        <div className="res__ring">
          <svg viewBox="0 0 168 168">
            <circle cx="84" cy="84" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
            <circle
              cx="84" cy="84" r={R} fill="none" stroke="var(--lvc)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={offset}
              style={{ transition: reduced ? 'none' : 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)', filter: 'drop-shadow(0 0 8px var(--lvg))' }}
            />
          </svg>
          <div className="res__num">{display}<span>/{total}</span></div>
        </div>
        <div className="res__msg">{msg}</div>
        <p className="res__sub">{sub}</p>
        {best[level.id] !== undefined && (
          <span className="res__best">best: {best[level.id]}/10 · {level.label}</span>
        )}
      </div>

      <div className="breakdown">
        <p className="breakdown__label">Tap a question to review it</p>
        <div className="breakdown__grid">
          {answers.map((a, i) => {
            const ok = a.sel === a.correct
            return (
              <button key={i} className={`qchip ${ok ? 'yes' : 'no'}`} onClick={() => onReview(i)}>{i + 1}</button>
            )
          })}
        </div>
      </div>

      <div className="stack">
        <RippleButton className="btn--ghost" onClick={() => onReview(0)}>
          <i className="ti ti-eye" /> Review all questions & explanations
        </RippleButton>
        <RippleButton className="btn--primary" onClick={onRetry}>
          <i className="ti ti-refresh" /> New set — {level.label}
        </RippleButton>
        <RippleButton className="btn--ghost" onClick={onHome}>
          <i className="ti ti-arrow-left" /> Choose a different level
        </RippleButton>
      </div>
    </div>
  )
}
