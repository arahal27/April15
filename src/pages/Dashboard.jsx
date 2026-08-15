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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [uploadingStatement, setUploadingStatement] = useState(false)
  const [statementStatus, setStatementStatus] = useState('')
  const [receiptUploading, setReceiptUploading] = useState(null)
  const [viewReceipt, setViewReceipt] = useState(null)

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
      if (data.category) category = data.category
    } catch (e) {}
    const year = new Date(form.date).getFullYear()
    await supabase.from('transactions').insert([{ ...form, amount, category, year, user_id: session.user.id }])
    setForm({ date: new Date().toISOString().slice(0,10), description: '', amount: '', category: 'Food & dining', type: 'expense' })
    await fetchTransactions()
    setAdding(false)
  }

  async function deleteTransaction(id) {
    await supabase.from('transactions').delete().eq('id', id)
    await fetchTransactions()
  }

  async function uploadReceipt(txnId, file) {
    setReceiptUploading(txnId)
    try {
      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/${txnId}.${ext}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, file, { upsert: true })
      
      if (uploadError) {
        console.log('Upload error:', uploadError)
        setReceiptUploading(null)
        return
      }

      console.log('Upload success:', uploadData)

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(path)

      console.log('Public URL:', urlData.publicUrl)

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ receipt_url: urlData.publicUrl })
        .eq('id', txnId)

      if (updateError) {
        console.log('Update error:', updateError)
      } else {
        console.log('Transaction updated successfully!')
      }

      await fetchTransactions()
    } catch (e) {
      console.log('Catch error:', e)
    }
    setReceiptUploading(null)
  }

  async function uploadStatement(file) {
    setUploadingStatement(true)
    setStatementStatus('Reading your bank statement...')
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0].toLowerCase()
      const transactions = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim())
        if (cols.length < 3) continue
        let date, description, amount
        if (headers.includes('date') && headers.includes('amount')) {
          const hi = headers.split(',')
          const dateIdx = hi.findIndex(h => h.includes('date'))
          const descIdx = hi.findIndex(h => h.includes('desc') || h.includes('name') || h.includes('merchant'))
          const amtIdx = hi.findIndex(h => h.includes('amount'))
          date = cols[dateIdx]
          description = cols[descIdx] || cols[1]
          amount = parseFloat(cols[amtIdx]?.replace(/[^0-9.-]/g, ''))
        } else {
          date = cols[0]
          description = cols[1]
          amount = parseFloat(cols[2]?.replace(/[^0-9.-]/g, ''))
        }
        if (!date || !description || isNaN(amount)) continue
        const parsedDate = new Date(date)
        if (isNaN(parsedDate.getTime())) continue
        transactions.push({ date: parsedDate.toISOString().slice(0,10), description, amount })
      }
      setStatementStatus(`Found ${transactions.length} transactions. Categorizing with AI...`)
      const toInsert = []
      for (const t of transactions) {
        let category = 'Other'
        try {
          const res = await fetch('/api/categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: t.description, amount: t.amount })
          })
          const data = await res.json()
          if (data.category) category = data.category
        } catch (e) {}
        toInsert.push({
          user_id: session.user.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          category,
          type: t.amount > 0 ? 'income' : 'expense',
          year: new Date(t.date).getFullYear()
        })
      }
      await supabase.from('transactions').insert(toInsert)
      setStatementStatus(`✅ Successfully imported ${toInsert.length} transactions!`)
      await fetchTransactions()
    } catch (e) {
      setStatementStatus('Error reading file. Please make sure it is a CSV file from your bank.')
    }
    setUploadingStatement(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function generatePDF() {
    const yearTxns = transactions.filter(t => t.year === selectedYear || new Date(t.date).getFullYear() === selectedYear)
    const allInc = yearTxns.filter(t => t.type === 'income')
    const allExp = yearTxns.filter(t => t.type === 'expense')
    const totalInc = allInc.reduce((s,t) => s+t.amount, 0)
    const totalExp = allExp.reduce((s,t) => s+Math.abs(t.amount), 0)
    const net = totalInc - totalExp
    const incByCat = {}
    const expByCat = {}
    allInc.forEach(t => { incByCat[t.category] = (incByCat[t.category]||0) + t.amount })
    allExp.forEach(t => { expByCat[t.category] = (expByCat[t.category]||0) + Math.abs(t.amount) })
    const incCats = Object.keys(incByCat).sort((a,b) => incByCat[b]-incByCat[a])
    const expCats = Object.keys(expByCat).sort((a,b) => expByCat[b]-expByCat[a])
    const byM = {}
    yearTxns.forEach(t => { const k=t.date.slice(0,7); if(!byM[k]) byM[k]={inc:0,exp:0,cnt:0}; if(t.type==='income') byM[k].inc+=t.amount; else byM[k].exp+=Math.abs(t.amount); byM[k].cnt++ })
    const months = Object.keys(byM).sort()

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>April15 Tax Report ${selectedYear}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:40px;color:#1a1a1a;font-size:13px;max-width:900px}
h1{font-size:26px;font-weight:700;margin:0 0 4px;letter-spacing:-.5px}
.meta{color:#888;font-size:12px;margin-bottom:28px}
.net{border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.net.pos{background:#eaf3de;border:1px solid #c0dd97}.net.neg{background:#fcebeb;border:1px solid #f7c1c1}
.net .lbl{font-size:14px;font-weight:600}.net.pos .lbl{color:#27500a}.net.neg .lbl{color:#791f1f}
.net .val{font-size:22px;font-weight:800}.net.pos .val{color:#27500a}.net.neg .val{color:#791f1f}
.kpis{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:28px}
.kpi{border:1px solid #e8e8e0;border-radius:8px;padding:14px 16px}
.kpi .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#aaa;margin-bottom:6px}
.kpi .val{font-size:22px;font-weight:700}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#999;margin:28px 0 10px}
.sheets{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:28px}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;padding:0 0 7px;border-bottom:1px solid #eee}
td{padding:8px 0;border-bottom:1px solid #f4f4f0;font-size:12px}.r{text-align:right}
tfoot td{font-weight:700;border-top:1px solid #ccc;border-bottom:none;padding-top:9px}
.grn{color:#27500a}.red{color:#791f1f}.muted{color:#aaa}
.receipt{width:60px;height:40px;object-fit:cover;border-radius:4px;border:1px solid #eee}
@media print{body{padding:16px}}
</style></head><body>
<h1>April15 — Tax Report ${selectedYear}</h1>
<div class="meta">Generated ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})} · ${yearTxns.length} total transactions</div>
<div class="net ${net>=0?'pos':'neg'}"><span class="lbl">Net position (income − expenses)</span><span class="val">${net>=0?'+':'−'}$${Math.abs(net).toFixed(2)}</span></div>
<div class="kpis">
  <div class="kpi"><div class="lbl">Total income</div><div class="val grn">$${totalInc.toFixed(2)}</div></div>
  <div class="kpi"><div class="lbl">Total expenses</div><div class="val red">$${totalExp.toFixed(2)}</div></div>
  <div class="kpi"><div class="lbl">Savings rate</div><div class="val">${totalInc>0?((net/totalInc)*100).toFixed(1):0}%</div></div>
</div>
<div class="sheets">
<div>
<h2>Income sheet</h2>
<table><thead><tr><th>Source</th><th class="r">Count</th><th class="r">Total</th><th class="r">%</th></tr></thead>
<tbody>${incCats.map(c=>`<tr><td>${c}</td><td class="r muted">${allInc.filter(t=>t.category===c).length}</td><td class="r grn">$${incByCat[c].toFixed(2)}</td><td class="r muted">${totalInc>0?((incByCat[c]/totalInc)*100).toFixed(1):0}%</td></tr>`).join('')}</tbody>
<tfoot><tr><td>Total</td><td class="r">${allInc.length}</td><td class="r grn">$${totalInc.toFixed(2)}</td><td class="r">100%</td></tr></tfoot>
</table>
</div>
<div>
<h2>Expense sheet</h2>
<table><thead><tr><th>Category</th><th class="r">Count</th><th class="r">Total</th><th class="r">%</th></tr></thead>
<tbody>${expCats.map(c=>`<tr><td>${c}</td><td class="r muted">${allExp.filter(t=>t.category===c).length}</td><td class="r red">$${expByCat[c].toFixed(2)}</td><td class="r muted">${totalExp>0?((expByCat[c]/totalExp)*100).toFixed(1):0}%</td></tr>`).join('')}</tbody>
<tfoot><tr><td>Total</td><td class="r">${allExp.length}</td><td class="r red">$${totalExp.toFixed(2)}</td><td class="r">100%</td></tr></tfoot>
</table>
</div>
</div>
<h2>Month-by-month summary</h2>
<table><thead><tr><th>Month</th><th class="r">Income</th><th class="r">Expenses</th><th class="r">Net</th><th class="r">Txns</th></tr></thead>
<tbody>${months.map(m=>{const r=byM[m];const n=r.inc-r.exp;return`<tr><td>${new Date(m+'-01').toLocaleDateString('en',{month:'long',year:'numeric'})}</td><td class="r grn">$${r.inc.toFixed(2)}</td><td class="r red">$${r.exp.toFixed(2)}</td><td class="r ${n>=0?'grn':'red'}">${n>=0?'+':'−'}$${Math.abs(n).toFixed(2)}</td><td class="r muted">${r.cnt}</td></tr>`}).join('')}</tbody></table>
<h2>All income transactions</h2>
<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="r">Amount</th><th class="r">Receipt</th></tr></thead>
<tbody>${[...allInc].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<tr><td class="muted">${t.date}</td><td>${t.description}</td><td class="muted">${t.category}</td><td class="r grn">+$${t.amount.toFixed(2)}</td><td class="r">${t.receipt_url?`<img src="${t.receipt_url}" class="receipt">`:'—'}</td></tr>`).join('')}</tbody>
<tfoot><tr><td colspan="3">Total income</td><td class="r grn">$${totalInc.toFixed(2)}</td><td></td></tr></tfoot></table>
<h2>All expense transactions</h2>
<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="r">Amount</th><th class="r">Receipt</th></tr></thead>
<tbody>${[...allExp].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<tr><td class="muted">${t.date}</td><td>${t.description}</td><td class="muted">${t.category}</td><td class="r red">−$${Math.abs(t.amount).toFixed(2)}</td><td class="r">${t.receipt_url?`<img src="${t.receipt_url}" class="receipt">`:'—'}</td></tr>`).join('')}</tbody>
<tfoot><tr><td colspan="3">Total expenses</td><td class="r red">$${totalExp.toFixed(2)}</td><td></td></tr></tfoot></table>
</body></html>`

    const b = new Blob([html], {type:'text/html'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = `april15-tax-report-${selectedYear}.html`
    a.click()
  }

  const fmt = n => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort().reverse()
  const yearTxns = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear)
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
  const taxInc = yearTxns.filter(t => t.type === 'income')
  const taxExp = yearTxns.filter(t => t.type === 'expense')
  const taxTotalInc = taxInc.reduce((s,t) => s+t.amount, 0)
  const taxTotalExp = taxExp.reduce((s,t) => s+Math.abs(t.amount), 0)
  const taxNet = taxTotalInc - taxTotalExp
  const incByCat = {}
  const expByCat = {}
  taxInc.forEach(t => { incByCat[t.category] = (incByCat[t.category]||0) + t.amount })
  taxExp.forEach(t => { expByCat[t.category] = (expByCat[t.category]||0) + Math.abs(t.amount) })
  const incCats = Object.keys(incByCat).sort((a,b) => incByCat[b]-incByCat[a])
  const expCats = Object.keys(expByCat).sort((a,b) => expByCat[b]-expByCat[a])

  const s = {
    app: { fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', background: '#f7f7f5', minHeight: '100vh', color: '#1a1a1a' },
    nav: { background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 4, height: 52, position: 'sticky', top: 0, zIndex: 10 },
    logo: { fontSize: 16, fontWeight: 700, marginRight: 'auto', letterSpacing: '-0.4px' },
    tabBtn: active => ({ padding: '6px 14px', fontSize: 13, fontWeight: 500, border: '0.5px solid ' + (active ? 'rgba(0,0,0,0.12)' : 'transparent'), borderRadius: 8, background: active ? '#f7f7f5' : 'none', color: active ? '#1a1a1a' : '#888', cursor: 'pointer' }),
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
      {viewReceipt && (
        <div onClick={() => setViewReceipt(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 500, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Receipt</span>
              <button onClick={() => setViewReceipt(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa' }}>✕</button>
            </div>
            <img src={viewReceipt} alt="Receipt" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        </div>
      )}

      <div style={s.nav}>
        <div style={s.logo}>April15</div>
        <button style={s.tabBtn(tab==='overview')} onClick={() => setTab('overview')}>Overview</button>
        <button style={s.tabBtn(tab==='transactions')} onClick={() => setTab('transactions')}>Transactions</button>
        <button style={s.tabBtn(tab==='monthly')} onClick={() => setTab('monthly')}>Monthly</button>
        <button style={s.tabBtn(tab==='tax')} onClick={() => setTab('tax')}>Tax report</button>
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
              <div style={s.cardHead}><span style={s.cardTitle}>Import bank statement</span><span style={{ fontSize: 11, color: '#aaa' }}>CSV format</span></div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Download a CSV statement from your bank and upload it here. AI will categorize everything automatically.</div>
              <input type="file" accept=".csv" onChange={e => e.target.files[0] && uploadStatement(e.target.files[0])} style={{ display: 'none' }} id="statement-upload" />
              <label htmlFor="statement-upload" style={{ ...s.btn, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', opacity: uploadingStatement ? 0.7 : 1 }}>
                📄 {uploadingStatement ? 'Importing...' : 'Upload CSV statement'}
              </label>
              {statementStatus && <div style={{ fontSize: 13, color: '#666', marginTop: 12 }}>{statementStatus}</div>}
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
                  {t.receipt_url && (
                    <button onClick={() => setViewReceipt(t.receipt_url)} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, border: '0.5px solid #c0dd97', background: '#eaf3de', color: '#3B6D11', cursor: 'pointer', marginRight: 4 }}>📎 receipt</button>
                  )}
                  <span style={s.pill(t.type==='income')}>{t.type}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.type==='income'?'#3B6D11':'#A32D2D', marginLeft: 8, marginRight: 8 }}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</div>
                  <input type="file" accept="image/*" onChange={e => e.target.files[0] && uploadReceipt(t.id, e.target.files[0])} style={{ display: 'none' }} id={`receipt-${t.id}`} />
                  <label htmlFor={`receipt-${t.id}`} style={{ ...s.delBtn, cursor: 'pointer', fontSize: 11 }}>{receiptUploading===t.id ? '...' : '📷'}</label>
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
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Tax report</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Generated {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ ...s.input, width: 'auto', height: 32, fontSize: 13 }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                  {!years.includes(new Date().getFullYear()) && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
                </select>
                <button onClick={generatePDF} style={{ ...s.btn, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⬇ Download PDF
                </button>
              </div>
            </div>
            <div style={s.netBanner(taxNet>=0)}>
              <span style={{ fontSize: 13, fontWeight: 600, color: taxNet>=0?'#3B6D11':'#A32D2D' }}>Net position (income − expenses)</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: taxNet>=0?'#3B6D11':'#A32D2D' }}>{taxNet>=0?'+':''}{fmt(taxNet)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              <div style={s.kpi}><div style={s.kpiLabel}>Total income</div><div style={s.kpiVal('#3B6D11')}>{fmt(taxTotalInc)}</div><div style={s.kpiSub}>{taxInc.length} transactions</div></div>
              <div style={s.kpi}><div style={s.kpiLabel}>Total expenses</div><div style={s.kpiVal('#A32D2D')}>{fmt(taxTotalExp)}</div><div style={s.kpiSub}>{taxExp.length} transactions</div></div>
              <div style={s.kpi}><div style={s.kpiLabel}>Savings rate</div><div style={s.kpiVal()}>{taxTotalInc>0?((taxNet/taxTotalInc)*100).toFixed(1):0}%</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={s.card}>
                <div style={s.cardHead}><span style={s.cardTitle}>Income sheet</span><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#eaf3de', color: '#3B6D11' }}>INCOME</span></div>
                <table style={s.tbl}>
                  <thead><tr><th style={s.th}>Source</th><th style={{...s.th,textAlign:'right'}}>Count</th><th style={{...s.th,textAlign:'right'}}>Total</th><th style={{...s.th,textAlign:'right'}}>%</th></tr></thead>
                  <tbody>{incCats.map(c => (
                    <tr key={c}>
                      <td style={s.td}>{c}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{taxInc.filter(t=>t.category===c).length}</td>
                      <td style={{...s.td,textAlign:'right',color:'#3B6D11',fontWeight:600}}>{fmt(incByCat[c])}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{taxTotalInc>0?((incByCat[c]/taxTotalInc)*100).toFixed(0):0}%</td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr><td style={{fontWeight:700,paddingTop:10}}>Total</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>{taxInc.length}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10,color:'#3B6D11'}}>{fmt(taxTotalInc)}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>100%</td></tr></tfoot>
                </table>
              </div>
              <div style={s.card}>
                <div style={s.cardHead}><span style={s.cardTitle}>Expense sheet</span><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fcebeb', color: '#A32D2D' }}>EXPENSES</span></div>
                <table style={s.tbl}>
                  <thead><tr><th style={s.th}>Category</th><th style={{...s.th,textAlign:'right'}}>Count</th><th style={{...s.th,textAlign:'right'}}>Total</th><th style={{...s.th,textAlign:'right'}}>%</th></tr></thead>
                  <tbody>{expCats.map(c => (
                    <tr key={c}>
                      <td style={s.td}>{c}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{taxExp.filter(t=>t.category===c).length}</td>
                      <td style={{...s.td,textAlign:'right',color:'#A32D2D',fontWeight:600}}>{fmt(expByCat[c])}</td>
                      <td style={{...s.td,textAlign:'right',color:'#aaa'}}>{taxTotalExp>0?((expByCat[c]/taxTotalExp)*100).toFixed(0):0}%</td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr><td style={{fontWeight:700,paddingTop:10}}>Total</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>{taxExp.length}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10,color:'#A32D2D'}}>{fmt(taxTotalExp)}</td><td style={{textAlign:'right',fontWeight:700,paddingTop:10}}>100%</td></tr></tfoot>
                </table>
              </div>
            </div>
          </>}
        </>}
      </div>
    </div>
  )
}