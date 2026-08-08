import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PlaidLink({ session, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [linked, setLinked] = useState(null)

  useEffect(() => {
    checkLinked()
  }, [])

  async function checkLinked() {
    const { data } = await supabase
      .from('plaid_items')
      .select('id, institution_name')
      .eq('user_id', session.user.id)
    if (data && data.length > 0) setLinked(data[0].institution_name || 'Your bank')
  }

  async function connectBank() {
    setLoading(true)
    setStatus('Connecting...')
    try {
      const tokenRes = await fetch('/api/plaid-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      })
      const tokenData = await tokenRes.json()

      if (!tokenData.link_token) {
        setStatus('Error getting link token. Please try again.')
        setLoading(false)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
      script.onload = () => {
        const handler = window.Plaid.create({
          token: tokenData.link_token,
          onSuccess: async (publicToken, metadata) => {
            setStatus('Bank connected! Importing transactions...')

            const exchangeRes = await fetch('/api/plaid-exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicToken })
            })
            const exchangeData = await exchangeRes.json()

            await supabase.from('plaid_items').insert([{
              user_id: session.user.id,
              access_token: exchangeData.access_token,
              item_id: exchangeData.item_id,
              institution_name: metadata.institution.name
            }])

            const txnRes = await fetch('/api/plaid-transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: exchangeData.access_token })
            })
            const txnData = await txnRes.json()
            const plaidTxns = txnData.transactions || []

            const toInsert = await Promise.all(plaidTxns.map(async t => ({
  user_id: session.user.id,
  date: t.date,
  description: t.name,
  amount: t.amount > 0 ? -t.amount : Math.abs(t.amount),
  category: await mapCategory(t.name, t.amount > 0 ? -t.amount : Math.abs(t.amount)),
  type: t.amount > 0 ? 'expense' : 'income'
})))

            if (toInsert.length > 0) {
              await supabase.from('transactions').insert(toInsert)
            }

            setStatus('✅ Imported ' + plaidTxns.length + ' transactions from ' + metadata.institution.name)
            setLinked(metadata.institution.name)
            setLoading(false)
            if (onSuccess) onSuccess()
          },
          onExit: () => {
            setLoading(false)
            setStatus('')
          }
        })
        handler.open()
      }
      document.head.appendChild(script)
    } catch (e) {
      setStatus('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

 async function mapCategory(description, amount) {
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, amount })
      })
      const data = await res.json()
      return data.category || 'Other'
    } catch (e) {
      return 'Other'
    }
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '20px', marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Bank connection</div>
      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
        {linked ? 'Connected to ' + linked : 'Connect your bank to automatically import transactions'}
      </div>
      {linked ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#3B6D11', fontWeight: 600 }}>✅ {linked} connected</span>
          <button onClick={connectBank} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.12)', background: 'none', color: '#aaa', cursor: 'pointer' }}>
            Reconnect
          </button>
        </div>
      ) : (
        <button onClick={connectBank} disabled={loading} style={{ height: 42, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '0 24px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Connecting...' : '🏦 Connect my bank'}
        </button>
      )}
      {status && <div style={{ fontSize: 13, color: '#666', marginTop: 12 }}>{status}</div>}
    </div>
  )
}