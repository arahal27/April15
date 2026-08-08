import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PlaidLink from './PlaidLink'

const CATS_EXP = ['Food & dining','Transport','Housing','Utilities','Healthcare','Entertainment','Shopping','Business','Education','Other']
const CATS_INC = ['Salary','Freelance','Investments','Rental income','Gifts','Other income']
const C_EXP = {'Food & dining':'#185FA5','Transport':'#854F0B','Housing':'#533AB7','Utilities':'#BA7517','Healthcare':'#0F6E56','Entertainment':'#993C1D','Shopping':'#D4537E','Business':'#555','Education':'#3B6D11','Other':'#888'}

export default function Dashboard({ session }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), description: '', amount: '', category: 'Food & dining', type: 'expense' })
  const [adding, setAdding] = useState(false)
  const [txnFilter, setTxnFilter] = useState('all')

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  async function addTransaction() {
    if (!form.date || !form.description || !form.amount) return
    setAdding(true)
    const amount = form.type === 'expense' ? -Math.abs(parseFloat(form.amount)) : Math.abs(parseFloat(form.amount))
    let category = form.category
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: form.description, amount })
      })
      const data = await res.json()
      console.log('AI category result:', data)
      if (data.category) category = data.category
    } catch (e) {
      console.log('AI error:', e)
    }
    await supabase.from('transactions').insert([{ ...form, amount, category, user_id: session.user.id }])
    setForm({ date: new Date().toISOString().slice(0,10), description: '', amount: '', category: 'Food & dining', type: 'expense' })
    await fetchTransactions()
    setAdding(false)
  }

  async function deleteTransaction(id) {
    await supabase.from('transactions').delete().eq('id', id)
    await fetchTransactions()
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const fmt = n => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const totalInc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
  const net = totalInc - totalExp
  const curMonth = new Date().toISOString().slice(0,7)
  const mInc = transactions.filter(t => t.type === 'income' && t.date.startsWith(curMonth)).reduce((s,t) => s+t.amount, 0)
  const mExp = transactions.filter(t => t.type === 'expense' && t.date.startsWith(curMonth)).reduce((s,t) => s+Math.abs(t.amount), 0)
  const byCat = {}
  transactions.filter(t => t.type === 'expense').forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + Math.abs(t.amount) })
  const topCats = Object.keys(byCat).sort((a,b) => byCat[b] - byCat[a]).slice(0,5)
  const filteredTxns = txnFilter === 'all' ? transactions : transactions.filter(t => t.type === txnFilter)
  const incByCat = {}
  const expByCat = {}
  transactions.filter(t => t.type === 'income').forEach(t => { incByCat[t.category] = (incByCat[t.category] || 0) + t.amount })
  transactions.filter(t => t.type === 'expense').forEach(t => { expByCat[t.category] = (expByCat[t.category] || 0) + Math.abs(t.amount) })
  const incCats = Object.keys(incByCat).sort((a,b) => incByCat[b] - incByCat[a])
  const expCats = Object.keys(expByCat).sort((a,b) => expByCat[b] - expByCat[a])

  const s = {
    app: { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', background: '#f7f7f5', minHeight: '100vh', color: '#1a1a1a' },
    nav: { background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 4, height: 52, position: 'sticky', top: 0, zIndex: 10 },
    logo: { fontSize: 16, fontWeight: 700, marginRight: 'auto', letterSpacing: '-0.4px' },
    tab: active => ({ padding: '6px 14px', fontSize: 13, fontWeight: 500, border: '0.5px solid ' + (active ? 'rgba(0,0,0,0.12)' : 'transparent'), borderRadius: 8, background: active ? '#f7f7f5' : 'none', color: active ? '#1a1a1a' : '#888', cursor: 'pointer' }),
    content: { padding: 20, maxWidth: 740, margin: '0 auto' },
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 },
    kpi: { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 16px' },
    kpiLabel: { fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 },
    kpiVal: (c) => ({ fontSize: 20, fontWeight: 700, color: c || '#1a1a1a' }),
    kpiSub: { fontSize: 10, color: '#aaa', marginTop: 3 },
    card: { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 18px', marginBottom: 12 },
    cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    cardTitle: { fontSize: 13, fontWeight: 600 },
    txn: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' },
    input: { height: 36, border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '0 10px', fontSize: 13, width: '100%', boxSizing: 'border-box', background: '#fff', color: '#1a1a1a' },
    btn: { height: 36, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 18px' },
    delBtn: { fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.12)', background: 'none', color: '#aaa', cursor: 'pointer' },
    pill: (inc) => ({ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: inc ? '#eaf3de' : '#fcebeb', color: inc ? '#3B6D11' : '#A32D2D' }),
    seg: { display: 'flex', gap: 2, background: '#f7f7f5', borderRadius: 8, padding: 3 },
    segBtn: (active) => ({ flex: 1, fontSize: 12, fontWeight: 500, padding: '5px 10px', border: '0.5px solid ' + (active ? 'rgba(0,0,0,0.1)' : 'transparent'), borderRadius: 6, background: active ? '#fff' : 'none', color: active ? '#1a1a1a' : '#888', cursor: 'pointer' }),
    netBanner: (pos) => ({ borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: pos ? '#eaf3de' : '#fcebeb', border: '0.5px solid ' + (pos ? '#c0dd97' : '#f7c1c1') }),
    tbl: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', paddingBottom: 8, borderBottom: '0.5px solid rgba(0,0,0,0.08)' },
    td: { padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)', color: '#1a1a1a' },
  }

  return (
    <div style={s.app}>
      <div style={s.nav}>
        <div style={s.logo}>April15</div>
        <button style={s.tab(tab==='overview')} onClick={() => setTab('overview')}>Overview</button>
        <button style={s.tab(tab==='transactions')} onClick={() => setTab('transactions')}>Transactions</button>
        <button style={s.tab(tab==='monthly')} onClick={() => setTab('monthly')}>Monthly</button>
        <button style={s.tab(tab==='tax')} onClick={() => setTab('tax')}>Tax report</button>
        <button onClick={signOut} style={{ marginLeft: 8, fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
      </div>

      <div style={s.content}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading...</div> : <>

          {tab === 'overview' && <>
            <PlaidLink session={session} onSuccess={() => fetchTransactions()} />
            <div style={s.kpiRow}>
              <div style={s.kpi}><div style={s.kpiLabel}>Income (YTD)</div><div style={s.kpiVal('#3B6D11')}>{fmt(totalInc)}</div><div style={s.kpiSub}>{transactions.filter(t=>t.type==='income').length} transactions</div></div>
              <div style={s.kpi}><div style={s.kpiLabel}>Expenses (YTD)</div><div style={s.kpiVal('#A32D2D')}>{fmt(totalExp)}</div><div style={s.kpiSub}>{transactions.filter(t=>t.type==='expense').length} transactions</div></div>
              <div style={s.kpi}><div style={s.kpiLabel}>Net savings</div><div style={s.kpiVal(net>=0?'#3B6D11':'#A32D2D')}>{fmt(net)}</div><div style={s.kpiSub}>{net>=0?'surplus':'deficit'}</div></div>
              <div style={s.kpi}><div style={s.kpiLabel}>This month</div><div style={s.kpiVal((mInc-mExp)>=0?'#3B6D11':'#A32D2D')}>{fmt(mInc-mExp)}</div><div style={s.kpiSub}>{fmt(mInc)} in · {fmt(mExp)} out</div></div>
            </div>
            <div style={s.card}>
              <div style={s.cardHead}><span style={s.cardTitle}>Top spending categories</span></div>
              {topCats.length ? topCats.map(c => (
                <div key={c} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: C_EXP[c]||'#888', display: 'inline-block' }}></span>{c}
                    </span>
                    <span style={{ fontSize: 12, color: '#888' }}>{fmt(byCat[c])}</span>
                  </div>
                  <div style={{ height: 4, background: '#f0f0ec', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (byCat[c]/(byCat[topCats[0]]||1)*100).toFixed(1)+'%', background: C_EXP[c]||'#888', borderRadius: 2 }}></div>
                  </div>
                </div>
              )) : <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 13 }}>No transactions yet</div>}
            </div>
            <div style={s.card}>
              <div style={s.cardHead}><span style={s.cardTitle}>Recent activity</span><span style={{ fontSize: 11, color: '#aaa' }}>{transactions.length} total</span></div>
              {transactions.slice(0,6).map(t => (
                <div key={t.id} style={s.txn}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C_EXP[t.category]||'#3B6D11', flexShrink: 0 }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{t.category} · {t.date}</div>
                  </div>
                  <span style={s.pill(t.type==='income')}>{t.type}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.type==='income'?'#3B6D11':'#A32D2D', marginLeft: 8 }}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</div>
                </div>
              ))}
              {transactions.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 13 }}>No transactions yet.</div>}
            </div>
          </>}

          {tab === 'transactions' && <>
            <div style={s.card}>
              <div style={s.cardHead}><span style={s.cardTitle}>Add transaction</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 3 }}>DATE</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={s.input} /></div>
                <div><label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 3 }}>TYPE</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value, category: e.target.value==='expense'?'Food & dining':'Salary'})} style={s.input}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 3 }}>DESCRIPTION</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What was this?" style={s.input} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div><label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 3 }}>AMOUNT ($)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" style={s.input} /></div>
                <div><label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 3 }}>CATEGORY</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={s.input}>
                    {(form.type === 'expense' ? CATS_EXP : CATS_INC).map(c => <option key={c}>{c}</option>)}
                  </select></div>
              </div>
              <button onClick={addTransaction} disabled={adding} style={{...s.btn, width: '100%', height: 42}}>{adding ? 'Adding with AI...' : 'Add transaction'}</button>
            </div>
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardTitle}>All transactions</span>
                <div style={s.seg}>
                  <button style={s.segBtn(txnFilter==='all')} onClick={() => setTxnFilter('all')}>All</button>
                  <button style={s.segBtn(txnFilter==='income')} onClick={() => setTxnFilter('income')}>Income</button>
                  <button style={s.segBtn(txnFilter==='expense')} onClick={() => setTxnFilter('expense')}>Expenses</button>
                </div>
              </div>
              {filteredTxns.map(t => (
                <div key={t.id} style={s.txn}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C_EXP[t.category]||'#3B6D11', flexShrink: 0 }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{t.category} · {t.date}</div>
                  </div>
                  <span style={s.pill(t.type==='income')}>{t.type}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.type==='income'?'#3B6D11':'#A32D2D', marginLeft: 8, marginRight: 8 }}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</div>
                  <button style={s.delBtn} onClick={() => deleteTransaction(t.id)}>✕</button>
                </div>
              ))}
              {filteredTxns.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 13 }}>No transactions yet.</div>}
            </div>
          </>}

          {tab === 'monthly' && <>
            {[...new Set(transactions.map(t => t.date.slice(0,7)))].sort().reverse().slice(0,1).map(month => {
              const mTxns = transactions.filter(t => t.date.startsWith(month))
              const mI = mTxns.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0)
              const mE = mTxns.filter(t => t.type==='expense').reduce((s,t) => s+Math.abs(t.amount), 0)
              const mN = mI - mE
              const mCat = {}
              mTxns.filter(t => t.type==='expense').forEach(t => { mCat[t.category] = (mCat[t.category]||0) + Math.abs(t.amount) })
              const mCats = Object.keys(mCat).sort((a,b) => mCat[b]-mCat[a])
              return (
                <div key={month}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#888' }}>{new Date(month+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                    <div style={s.kpi}><div style={s.kpiLabel}>Income</div><div style={s.kpiVal('#3B6D11')}>{fmt(mI)}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>Expenses</div><div style={s.kpiVal('#A32D2D')}>{fmt(mE)}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>Net</div><div style={s.kpiVal(mN>=0?'#3B6D11':'#A32D2D')}>{fmt(mN)}</div></div>
                  </div>
                  <div style={s.card}>
                    <div style={s.cardHead}><span style={s.cardTitle}>Spending breakdown</span></div>
                    {mCats.map(c => (
                      <div key={c} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12 }}>{c}</span>
                          <span style={{ fontSize: 12, color: '#888' }}>{fmt(mCat[c])} · {mE>0?((mCat[c]/mE)*100).toFixed(0):0}%</span>
                        </div>
                        <div style={{ height: 4, background: '#f0f0ec', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: (mCat[c]/(mCat[mCats[0]]||1)*100).toFixed(1)+'%', background: C_EXP[c]||'#888', borderRadius: 2 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {transactions.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 13 }}>No transactions yet.</div>}
          </>}

          {tab === 'tax' && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Tax report · {new Date().getFullYear()}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Generated {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
              </div>
            </div>
            <div style={s.netBanner(net>=0)}>
              <span style={{ fontSize: 13, fontWeight: 600, color: net>=0?'#3B6D11':'#A32D2D' }}>Net position (income − expenses)</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: net>=0?'#3B6D11':'#A32D2D' }}>{net>=0?'+':''}{fmt(net)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              <div style={s.kpi}><div style={s.kpiLabel}>Total income</div><div style={s.kpiVal('#3B6D11')}>{fmt(totalInc)}</div><div style={s.kpiSub}>{transactions.filter(t=>t.type==='income').length} transactions</div></div>
              <div style={s.kpi}><div style={s.kpiLabel}>Total expenses</div><div style={s.kpiVal('#A32D2D')}>{fmt(totalExp)}</div><div style={s.kpiSub}>{transactions.filter(t=>t.type==='expense').length} transactions</div></div>
              <div style={s.kpi}><div style={s.kpiLabel}>Savings rate</div><div style={s.kpiVal()}>{totalInc>0?((net/totalInc)*100).toFixed(1):0}%</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={s.card}>
                <div style={s.cardHead}><span style={s.cardTitle}>Income sheet</span><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#eaf3de', color: '#3B6D11' }}>INCOME</span></div>
                <table style={s.tbl}>
                  <thead><tr><th style={s.th}>Source</th><th style={{...s.th,textAlign:'right'}}>Count</th><th style={{...s.th,textAlign:'right'}}>Total</th><th style={{...s.th,textAlign:'right'}}>%</th></tr></thead>
                  <tbody>{incCats.map(c => (
                    <tr key={c}>
                      <td style={s.td}>{c}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{transactions.filter(t=>t.type==='income'&&t.category===c).length}</td>
                      <td style={{...s.td,textAlign:'right',color:'#3B6D11',fontWeight:600}}>{fmt(incByCat[c])}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{totalInc>0?((incByCat[c]/totalInc)*100).toFixed(0):0}%</td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr><td style={{fontWeight:700,paddingTop:10}}>Total</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>{transactions.filter(t=>t.type==='income').length}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10,color:'#3B6D11'}}>{fmt(totalInc)}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>100%</td></tr></tfoot>
                </table>
              </div>
              <div style={s.card}>
                <div style={s.cardHead}><span style={s.cardTitle}>Expense sheet</span><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fcebeb', color: '#A32D2D' }}>EXPENSES</span></div>
                <table style={s.tbl}>
                  <thead><tr><th style={s.th}>Category</th><th style={{...s.th,textAlign:'right'}}>Count</th><th style={{...s.th,textAlign:'right'}}>Total</th><th style={{...s.th,textAlign:'right'}}>%</th></tr></thead>
                  <tbody>{expCats.map(c => (
                    <tr key={c}>
                      <td style={s.td}>{c}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{transactions.filter(t=>t.type==='expense'&&t.category===c).length}</td>
                      <td style={{...s.td,textAlign:'right',color:'#A32D2D',fontWeight:600}}>{fmt(expByCat[c])}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{totalExp>0?((expByCat[c]/totalExp)*100).toFixed(0):0}%</td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr><td style={{fontWeight:700,paddingTop:10}}>Total</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>{transactions.filter(t=>t.type==='expense').length}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10,color:'#A32D2D'}}>{fmt(totalExp)}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>100%</td></tr></tfoot>
                </table>
              </div>
            </div>
          </>}
        </>}
      </div>
    </div>
  )
}