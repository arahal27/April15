import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  const s = {
    page: { fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#fff', color: '#1a1a1a', overflowX: 'hidden' },
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', zIndex: 10 },
    logo: { fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', color: '#1a1a1a' },
    navBtn: { height: 34, padding: '0 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    hero: { textAlign: 'center', padding: '72px 24px 64px', maxWidth: 640, margin: '0 auto' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f0ec', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 24 },
    h1: { fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1px', margin: '0 0 20px', color: '#1a1a1a' },
    sub: { fontSize: 'clamp(15px, 3vw, 18px)', color: '#666', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' },
    btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
    btnPrimary: { height: 46, padding: '0 28px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { height: 46, padding: '0 28px', background: 'none', color: '#1a1a1a', border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
    mockup: { background: 'linear-gradient(135deg, #f7f7f5 0%, #efefeb 100%)', borderRadius: 20, margin: '48px 24px', padding: '32px 24px', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto', border: '0.5px solid rgba(0,0,0,0.08)' },
    mockupInner: { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
    mockupNav: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 14, borderBottom: '0.5px solid rgba(0,0,0,0.06)' },
    mockupLogo: { fontSize: 14, fontWeight: 700, marginRight: 'auto' },
    mockupTab: (active) => ({ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: active ? '#f7f7f5' : 'none', color: active ? '#1a1a1a' : '#aaa', fontWeight: active ? 600 : 400, border: active ? '0.5px solid rgba(0,0,0,0.08)' : 'none' }),
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 },
    kpiCard: { background: '#f7f7f5', borderRadius: 10, padding: '12px 14px' },
    kpiLabel: { fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 },
    kpiVal: (c) => ({ fontSize: 18, fontWeight: 700, color: c }),
    txnRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' },
    txnDot: (c) => ({ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }),
    features: { padding: '64px 24px', maxWidth: 680, margin: '0 auto' },
    featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
    featCard: { background: '#f7f7f5', borderRadius: 16, padding: '24px', border: '0.5px solid rgba(0,0,0,0.06)' },
    featIcon: { fontSize: 28, marginBottom: 12 },
    featTitle: { fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#1a1a1a' },
    featDesc: { fontSize: 13, color: '#666', lineHeight: 1.6 },
    howSection: { padding: '64px 24px', background: '#f7f7f5' },
    howInner: { maxWidth: 680, margin: '0 auto' },
    sectionLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: '#aaa', marginBottom: 10 },
    sectionTitle: { fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 40, color: '#1a1a1a' },
    stepGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 },
    step: { display: 'flex', flexDirection: 'column', gap: 10 },
    stepNum: { width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
    stepTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
    stepDesc: { fontSize: 13, color: '#666', lineHeight: 1.5 },
    cta: { padding: '80px 24px', textAlign: 'center', background: '#1a1a1a' },
    ctaTitle: { fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginBottom: 14 },
    ctaSub: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 36 },
    ctaBtn: { height: 50, padding: '0 32px', background: '#fff', color: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    footer: { padding: '24px', textAlign: 'center', fontSize: 12, color: '#aaa', borderTop: '0.5px solid rgba(0,0,0,0.08)' },
  }

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo}>April15</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/login')} style={{ ...s.navBtn, background: 'none', color: '#1a1a1a', border: '0.5px solid rgba(0,0,0,0.15)' }}>Sign in</button>
          <button onClick={() => navigate('/login')} style={s.navBtn}>Get started</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={s.hero}>
        <div style={s.badge}>
          <span>✦</span> Free until April 15, 2027
        </div>
        <h1 style={s.h1}>Your money,<br />organized automatically</h1>
        <p style={s.sub}>April15 connects to your bank, categorizes every transaction with AI, and generates your tax report — all without lifting a finger.</p>
        <div style={s.btnRow}>
          <button onClick={() => navigate('/login')} style={s.btnPrimary}>Start for free →</button>
          <button onClick={() => document.getElementById('how').scrollIntoView({behavior:'smooth'})} style={s.btnSecondary}>See how it works</button>
        </div>
      </div>

      {/* APP MOCKUP */}
      <div style={s.mockup}>
        <div style={s.mockupInner}>
          <div style={s.mockupNav}>
            <span style={s.mockupLogo}>April15</span>
            {['Overview','Transactions','Monthly','Tax report'].map((t,i) => (
              <span key={t} style={s.mockupTab(i===0)}>{t}</span>
            ))}
          </div>
          <div style={s.kpiGrid}>
            <div style={s.kpiCard}><div style={s.kpiLabel}>Income (YTD 2026)</div><div style={s.kpiVal('#3B6D11')}>+$6,928.34</div></div>
            <div style={s.kpiCard}><div style={s.kpiLabel}>Expenses (YTD 2026)</div><div style={s.kpiVal('#A32D2D')}>-$5,377.24</div></div>
            <div style={s.kpiCard}><div style={s.kpiLabel}>Net savings (YTD)</div><div style={s.kpiVal('#3B6D11')}>+$1,551.10</div></div>
            <div style={s.kpiCard}><div style={s.kpiLabel}>This month net</div><div style={s.kpiVal('#A32D2D')}>-$606.44</div></div>
          </div>
          <div style={{ background: '#f7f7f5', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: '#1a1a1a' }}>Recent activity</div>
            {[
              { name: 'Whole Foods Market', cat: 'Food & dining', amt: '-$87.43', color: '#185FA5', type: 'expense' },
              { name: 'Payroll Deposit', cat: 'Salary', amt: '+$3,200.00', color: '#3B6D11', type: 'income' },
              { name: 'Shell Gas Station', cat: 'Transport', amt: '-$52.10', color: '#854F0B', type: 'expense' },
              { name: 'Netflix', cat: 'Entertainment', amt: '-$15.99', color: '#993C1D', type: 'expense' },
            ].map((t,i) => (
              <div key={i} style={s.txnRow}>
                <div style={s.txnDot(t.color)}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>{t.cat}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.type==='income'?'#3B6D11':'#A32D2D' }}>{t.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={s.features}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={s.sectionLabel}>Features</div>
          <div style={s.sectionTitle}>Everything you need,<br />nothing you don't</div>
        </div>
        <div style={s.featGrid}>
          {[
            { icon: '🏦', title: 'Automatic bank sync', desc: 'Connect your bank once and every transaction imports automatically. Supports all major US banks.' },
            { icon: '🤖', title: 'AI categorization', desc: 'Claude AI reads every transaction and assigns the right category instantly — food, transport, healthcare, and more.' },
            { icon: '📄', title: 'Tax-ready reports', desc: 'Generate a complete annual tax report with income and expense sheets, month-by-month summaries, and receipt attachments.' },
            { icon: '📷', title: 'Receipt capture', desc: 'Snap a photo of any receipt and attach it to a transaction. Export as a ZIP organized by category for your accountant.' },
            { icon: '📊', title: 'Monthly insights', desc: 'Track spending trends month by month. Click any category to drill into every transaction underneath it.' },
            { icon: '📁', title: 'CSV import', desc: 'Already have bank statements? Upload a CSV and AI will categorize every transaction automatically.' },
          ].map((f,i) => (
            <div key={i} style={s.featCard}>
              <div style={s.featIcon}>{f.icon}</div>
              <div style={s.featTitle}>{f.title}</div>
              <div style={s.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={s.howSection}>
        <div style={s.howInner}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={s.sectionLabel}>How it works</div>
            <div style={s.sectionTitle}>Set up in minutes,<br />runs itself after that</div>
          </div>
          <div style={s.stepGrid}>
            {[
              { n: 1, title: 'Create your account', desc: 'Sign up with your email in seconds. No credit card required.' },
              { n: 2, title: 'Connect your bank', desc: 'Link your bank securely through Plaid — the same technology used by Venmo and Robinhood.' },
              { n: 3, title: 'AI does the work', desc: 'Every transaction is imported and categorized automatically. No manual entry needed.' },
              { n: 4, title: 'Download your tax report', desc: 'At tax time, generate a complete report with one click and hand it to your accountant.' },
            ].map((step,i) => (
              <div key={i} style={s.step}>
                <div style={s.stepNum}>{step.n}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={s.cta}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={s.ctaTitle}>Start tracking your<br />money today</div>
          <div style={s.ctaSub}>Free until April 15, 2027. No credit card required.</div>
          <button onClick={() => navigate('/login')} style={s.ctaBtn}>Create free account →</button>
        </div>
      </div>

      {/* FOOTER */}
      <div style={s.footer}>
        © 2026 April15 · Built for smart money management
      </div>
    </div>
  )
}
