import { useState, useCallback, useEffect } from 'react'

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
    topics: 'Data Architecture · Platform Limits at Scale · Strategy',
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
  rare:         { label: 'Rare',          icon: 'ti-alert-triangle', txtvar: 'warning' },
  gotcha:       { label: 'Gotcha',        icon: 'ti-bug',            txtvar: 'danger'  },
  scenario:     { label: 'Scenario',      icon: 'ti-briefcase',      txtvar: 'info'    },
  bestpractice: { label: 'Best Practice', icon: 'ti-shield-check',   txtvar: 'success' },
}

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

  // Load best scores from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sfq_best_v3')
      if (saved) setBest(JSON.parse(saved))
    } catch {}
  }, [])

  // Animate loading dots
  useEffect(() => {
    if (phase !== 'loading') return
    const t = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 480)
    return () => clearInterval(t)
  }, [phase])

  const launch = useCallback(async (lv) => {
    setLevel(lv)
    setPhase('loading')
    setError(null)
    setAnswers([])
    setQs([])
    setIdx(0)
    setSel(null)
    setRevealed(false)
    setShowExp(false)

    try {
      // Calls /api/chat (Vercel serverless function) which holds the API key securely
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
      if (s < 0) throw new Error('No JSON in response')
      const parsed = JSON.parse(raw.slice(s, e + 1))
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 5)
        throw new Error('Too few questions')

      const normalized = parsed.questions.slice(0, 10).map((q, i) => ({
        id: i + 1,
        question:    q.question    || 'Question unavailable',
        options:     Array.isArray(q.options) && q.options.length === 4
                       ? q.options
                       : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
        correct:     typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
                       ? q.correct : 0,
        explanation: q.explanation || 'No explanation provided.',
        topic:       q.topic || 'General',
        type:        Object.keys(TYPE_CFG).includes(q.type) ? q.type : 'scenario',
      }))

      setQs(normalized)
      setPhase('quiz')
    } catch (err) {
      setError('Could not generate questions. Check your API key is set in Vercel and try again.')
      setPhase('home')
    }
  }, [])

  const pick = (i) => {
    if (revealed) return
    setSel(i)
    setRevealed(true)
    setShowExp(false)
  }

  const advance = () => {
    const q = qs[idx]
    const newAnswers = [...answers, { sel, correct: q.correct, q }]
    setAnswers(newAnswers)

    if (idx + 1 >= qs.length) {
      const score = newAnswers.filter(a => a.sel === a.correct).length
      const upd   = { ...best }
      if (upd[level.id] === undefined || score > upd[level.id]) {
        upd[level.id] = score
        setBest(upd)
        try { localStorage.setItem('sfq_best_v3', JSON.stringify(upd)) } catch {}
      }
      setPhase('results')
    } else {
      setIdx(p => p + 1)
      setSel(null)
      setRevealed(false)
      setShowExp(false)
    }
  }

  const score = answers.filter(a => a.sel === a.correct).length

  return (
    <div className="app-shell">
      <h2 className="sr-only">Salesforce MCQ Practice Hub — scenario-based questions across 6 career levels</h2>

      {/* ───── HOME ───── */}
      {phase === 'home' && (
        <div style={{ padding: '28px 0 20px' }}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Salesforce Career Ladder
            </p>
            <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              MCQ Practice Hub
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              10 AI-generated scenario questions per session &middot; Rare gotchas &middot; Detailed explanations
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--color-background-danger)', border: '0.5px solid var(--color-border-danger)',
              borderRadius: 'var(--border-radius-md)', padding: '10px 14px', marginBottom: 18,
              fontSize: 13, color: 'var(--color-text-danger)', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="ti ti-alert-circle" aria-hidden="true" />{error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
            {LEVELS.map(lv => (
              <button key={lv.id} className="lvcard" onClick={() => launch(lv)}
                style={{ borderLeft: `3px solid var(--${lv.cv}-c)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <i className={`ti ${lv.icon}`} aria-hidden="true" style={{ fontSize: 22, color: `var(--${lv.cv}-c)` }} />
                  {best[lv.id] !== undefined && (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: `var(--${lv.cv}-b)`, color: `var(--${lv.cv}-c)`, padding: '2px 7px', borderRadius: 4 }}>
                      best {best[lv.id]}/10
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 2 }}>{lv.label}</div>
                <div style={{ fontSize: 11, color: `var(--${lv.cv}-c)`, marginBottom: 10 }}>{lv.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{lv.topics}</div>
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', marginTop: 20 }}>
            Questions regenerate every session &middot; Never the same twice
          </p>
        </div>
      )}

      {/* ───── LOADING ───── */}
      {phase === 'loading' && level && (
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <i className={`ti ${level.icon}`} aria-hidden="true"
            style={{ fontSize: 40, color: `var(--${level.cv}-c)`, display: 'block', marginBottom: 20 }} />
          <p style={{ margin: '0 0 8px', fontWeight: 500, fontSize: 16, color: 'var(--color-text-primary)' }}>
            Generating questions{'·'.repeat(dots)}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {level.label} &middot; {level.title}
          </p>
          <p style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
            scenario-based &middot; rare gotchas &middot; production edge cases
          </p>
        </div>
      )}

      {/* ───── QUIZ ───── */}
      {phase === 'quiz' && qs[idx] && (() => {
        const q  = qs[idx]
        const tm = TYPE_CFG[q.type] || TYPE_CFG.scenario
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className={`ti ${level.icon}`} aria-hidden="true" style={{ fontSize: 15, color: `var(--${level.cv}-c)` }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: `var(--${level.cv}-c)` }}>{level.label}</span>
              </div>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                {score}/{answers.length} correct
              </span>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 18, alignItems: 'center' }}>
              {qs.map((_, i) => {
                let cls = 'pdot'
                if (i < answers.length) cls += answers[i].sel === answers[i].correct ? ' yes' : ' no'
                else if (i === idx)     cls += ' cur'
                return <div key={i} className={cls} />
              })}
              <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                Q{idx + 1}/{qs.length}
              </span>
            </div>

            {/* Question card */}
            <div style={{
              background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)',
              borderLeft: `3px solid var(--${level.cv}-c)`, borderRadius: 'var(--border-radius-lg)',
              padding: '18px 18px 18px 16px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: `var(--${level.cv}-b)`, color: `var(--${level.cv}-c)`, padding: '2px 8px', borderRadius: 4 }}>
                  {q.topic}
                </span>
                <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: `var(--color-text-${tm.txtvar})` }}>
                  <i className={`ti ${tm.icon}`} aria-hidden="true" style={{ fontSize: 12 }} />
                  {tm.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: 'var(--color-text-primary)' }}>
                {q.question}
              </p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
              {q.options.map((opt, i) => {
                let cls = 'opt'
                const isOk = revealed && i === q.correct
                const isNg = revealed && i === sel && i !== q.correct
                if (revealed) {
                  if (isOk)      cls += ' ok'
                  else if (isNg) cls += ' ng'
                  else           cls += ' dim'
                }
                return (
                  <button key={i} className={cls} onClick={() => pick(i)} disabled={revealed}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isOk ? 'var(--color-background-success)' : isNg ? 'var(--color-background-danger)' : 'var(--color-background-secondary)',
                      color: isOk ? 'var(--color-text-success)' : isNg ? 'var(--color-text-danger)' : 'var(--color-text-tertiary)',
                    }}>
                      {isOk ? <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 13 }} />
                             : isNg ? <i className="ti ti-x" aria-hidden="true" style={{ fontSize: 13 }} />
                             : String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt.replace(/^[A-D]\.\s*/i, '')}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation + Next */}
            {revealed && (
              <>
                <button onClick={() => setShowExp(e => !e)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12,
                  color: 'var(--color-text-secondary)', padding: '2px 0', marginBottom: 8,
                }}>
                  <i className={`ti ${showExp ? 'ti-chevron-down' : 'ti-chevron-right'}`} aria-hidden="true" style={{ fontSize: 13 }} />
                  {showExp ? 'Hide explanation' : 'Show explanation'}
                </button>

                {showExp && (
                  <div style={{
                    background: 'var(--color-background-info)', border: '0.5px solid var(--color-border-info)',
                    borderRadius: 'var(--border-radius-md)', padding: '14px 16px', marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <i className="ti ti-bulb" aria-hidden="true" style={{ fontSize: 14, color: 'var(--color-text-info)' }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-info)' }}>Explanation</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: 'var(--color-text-primary)' }}>
                      {q.explanation}
                    </p>
                  </div>
                )}

                <button onClick={advance} style={{
                  width: '100%', padding: '12px 0', background: `var(--${level.cv}-b)`,
                  border: `0.5px solid var(--${level.cv}-c)`, borderRadius: 'var(--border-radius-md)',
                  fontSize: 14, fontWeight: 500, color: `var(--${level.cv}-c)`,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                  {idx + 1 >= qs.length ? 'See results' : 'Next question'}
                  <i className="ti ti-arrow-right" aria-hidden="true" style={{ marginLeft: 8, fontSize: 14 }} />
                </button>
              </>
            )}
          </div>
        )
      })()}

      {/* ───── RESULTS ───── */}
      {phase === 'results' && level && (() => {
        const total = answers.length
        const pct   = total > 0 ? Math.round((score / total) * 100) : 0
        const msg   = pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Solid work' : pct >= 50 ? 'Keep going' : 'More practice needed'
        const sub   = pct >= 90 ? 'You nailed it. Ready to try a harder level?'
                    : pct >= 70 ? 'Good foundation. Review the ones you missed.'
                    : pct >= 50 ? "You're getting there. Study the explanations."
                    : 'Review all explanations and try again.'
        return (
          <div style={{ padding: '28px 0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 56, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 6 }}>
                {score}<span style={{ fontSize: 26, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>/{total}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>{msg}</div>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{sub}</p>
              {best[level.id] !== undefined && (
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: `var(--${level.cv}-c)` }}>
                  best: {best[level.id]}/10 &middot; {level.label}
                </span>
              )}
            </div>

            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)', padding: '16px', marginBottom: 18 }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-text-secondary)' }}>Click a question to review it</p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {answers.map((a, i) => {
                  const ok = a.sel === a.correct
                  return (
                    <button key={i} onClick={() => { setRevIdx(i); setPhase('review') }} style={{
                      width: 34, height: 34, borderRadius: 'var(--border-radius-md)',
                      background: ok ? 'var(--color-background-success)' : 'var(--color-background-danger)',
                      border: `0.5px solid ${ok ? 'var(--color-border-success)' : 'var(--color-border-danger)'}`,
                      color: ok ? 'var(--color-text-success)' : 'var(--color-text-danger)',
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    }}>
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="ghost" onClick={() => { setRevIdx(0); setPhase('review') }}>
                <i className="ti ti-eye" aria-hidden="true" style={{ marginRight: 8 }} />
                Review all questions &amp; explanations
              </button>
              <button onClick={() => launch(level)} style={{
                padding: '12px 0', cursor: 'pointer', background: `var(--${level.cv}-b)`,
                border: `0.5px solid var(--${level.cv}-c)`, borderRadius: 'var(--border-radius-md)',
                fontSize: 14, fontWeight: 500, color: `var(--${level.cv}-c)`, fontFamily: 'var(--font-sans)',
              }}>
                <i className="ti ti-refresh" aria-hidden="true" style={{ marginRight: 8 }} />
                New set of questions — {level.label}
              </button>
              <button className="ghost" onClick={() => setPhase('home')}>
                <i className="ti ti-arrow-left" aria-hidden="true" style={{ marginRight: 8 }} />
                Choose a different level
              </button>
            </div>
          </div>
        )
      })()}

      {/* ───── REVIEW ───── */}
      {phase === 'review' && answers[revIdx] && (() => {
        const a  = answers[revIdx]
        const q  = a.q
        const ok = a.sel === a.correct
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <button className="ghost" onClick={() => setPhase('results')} style={{ width: 'auto', padding: '7px 14px' }}>
                <i className="ti ti-arrow-left" aria-hidden="true" style={{ marginRight: 6 }} />Results
              </button>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                {revIdx + 1} / {answers.length}
              </span>
            </div>

            <div style={{
              background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)',
              borderLeft: `3px solid ${ok ? 'var(--color-border-success)' : 'var(--color-border-danger)'}`,
              borderRadius: 'var(--border-radius-lg)', padding: '18px 18px 18px 16px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: `var(--${level.cv}-b)`, color: `var(--${level.cv}-c)`, padding: '2px 8px', borderRadius: 4 }}>
                  {q.topic}
                </span>
                <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: ok ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}>
                  <i className={`ti ${ok ? 'ti-check' : 'ti-x'}`} aria-hidden="true" style={{ fontSize: 12 }} />
                  {ok ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: 'var(--color-text-primary)' }}>{q.question}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {q.options.map((opt, i) => {
                const isCorrect  = i === q.correct
                const isUserPick = i === a.sel
                const isWrong    = isUserPick && !isCorrect
                let bg = 'var(--color-background-secondary)', bd = 'var(--color-border-tertiary)', co = 'var(--color-text-tertiary)'
                if (isCorrect) { bg = 'var(--color-background-success)'; bd = 'var(--color-border-success)'; co = 'var(--color-text-success)' }
                if (isWrong)   { bg = 'var(--color-background-danger)';  bd = 'var(--color-border-danger)';  co = 'var(--color-text-danger)' }
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px',
                    borderRadius: 'var(--border-radius-md)', background: bg, border: `0.5px solid ${bd}`,
                    color: co, fontSize: 13, lineHeight: 1.5,
                    opacity: (!isCorrect && !isUserPick) ? 0.45 : 1,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, flexShrink: 0, marginTop: 1 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1 }}>{opt.replace(/^[A-D]\.\s*/i, '')}</span>
                    {isCorrect  && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: 2 }}>CORRECT</span>}
                    {isWrong    && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: 2 }}>YOUR ANSWER</span>}
                  </div>
                )
              })}
            </div>

            <div style={{
              background: 'var(--color-background-info)', border: '0.5px solid var(--color-border-info)',
              borderRadius: 'var(--border-radius-md)', padding: '14px 16px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <i className="ti ti-bulb" aria-hidden="true" style={{ fontSize: 14, color: 'var(--color-text-info)' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-info)' }}>Explanation</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: 'var(--color-text-primary)' }}>{q.explanation}</p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ghost" onClick={() => setRevIdx(p => Math.max(0, p - 1))} disabled={revIdx === 0} style={{ flex: 1 }}>
                <i className="ti ti-arrow-left" aria-hidden="true" style={{ marginRight: 6 }} />Prev
              </button>
              <button onClick={() => setRevIdx(p => Math.min(answers.length - 1, p + 1))} disabled={revIdx === answers.length - 1}
                style={{
                  flex: 1, padding: '10px 0', background: `var(--${level.cv}-b)`,
                  border: `0.5px solid var(--${level.cv}-c)`, borderRadius: 'var(--border-radius-md)',
                  fontSize: 13, fontWeight: 500, color: `var(--${level.cv}-c)`,
                  cursor: revIdx === answers.length - 1 ? 'default' : 'pointer',
                  opacity: revIdx === answers.length - 1 ? 0.4 : 1,
                  fontFamily: 'var(--font-sans)',
                }}>
                Next <i className="ti ti-arrow-right" aria-hidden="true" style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
