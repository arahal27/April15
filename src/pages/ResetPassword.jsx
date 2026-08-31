import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function handleReset() {
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else {
      setMessage('Password updated successfully!')
      setTimeout(() => navigate('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'#f7f7f5',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>
      <div style={{background:'#fff',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:16,padding:'40px 36px',width:'100%',maxWidth:400}}>
        <div style={{fontSize:24,fontWeight:700,color:'#1a1a1a',marginBottom:4,letterSpacing:'-0.5px'}}>April15</div>
        <div style={{fontSize:13,color:'#888',marginBottom:32}}>Set your new password</div>

        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,color:'#999',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:4}}>New password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{width:'100%',height:40,border:'0.5px solid rgba(0,0,0,0.15)',borderRadius:8,padding:'0 12px',fontSize:14,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1a1a1a'}}
          />
        </div>

        <div style={{marginBottom:24}}>
          <label style={{fontSize:11,color:'#999',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:4}}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            onKeyDown={e => e.key === 'Enter' && handleReset()}
            style={{width:'100%',height:40,border:'0.5px solid rgba(0,0,0,0.15)',borderRadius:8,padding:'0 12px',fontSize:14,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1a1a1a'}}
          />
        </div>

        {error && <div style={{fontSize:13,color:'#A32D2D',background:'#fcebeb',border:'0.5px solid #f7c1c1',borderRadius:8,padding:'10px 14px',marginBottom:16}}>{error}</div>}
        {message && <div style={{fontSize:13,color:'#3B6D11',background:'#eaf3de',border:'0.5px solid #c0dd97',borderRadius:8,padding:'10px 14px',marginBottom:16}}>{message}</div>}

        <button
          onClick={handleReset}
          disabled={loading}
          style={{width:'100%',height:42,background:'#1a1a1a',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </div>
  )
}