import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMessage('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'#f7f7f5',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>
      <div style={{background:'#fff',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:16,padding:'40px 36px',width:'100%',maxWidth:400}}>
        <div style={{fontSize:24,fontWeight:700,color:'#1a1a1a',marginBottom:4,letterSpacing:'-0.5px'}}>April15</div>
        <div style={{fontSize:13,color:'#888',marginBottom:32}}>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</div>

        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,color:'#999',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:4}}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{width:'100%',height:40,border:'0.5px solid rgba(0,0,0,0.15)',borderRadius:8,padding:'0 12px',fontSize:14,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1a1a1a'}}
          />
        </div>

        <div style={{marginBottom:24}}>
          <label style={{fontSize:11,color:'#999',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:4}}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{width:'100%',height:40,border:'0.5px solid rgba(0,0,0,0.15)',borderRadius:8,padding:'0 12px',fontSize:14,outline:'none',boxSizing:'border-box',background:'#fff',color:'#1a1a1a'}}
          />
        </div>

        {error && <div style={{fontSize:13,color:'#A32D2D',background:'#fcebeb',border:'0.5px solid #f7c1c1',borderRadius:8,padding:'10px 14px',marginBottom:16}}>{error}</div>}
        {message && <div style={{fontSize:13,color:'#3B6D11',background:'#eaf3de',border:'0.5px solid #c0dd97',borderRadius:8,padding:'10px 14px',marginBottom:16}}>{message}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{width:'100%',height:42,background:'#1a1a1a',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:16,opacity:loading?0.7:1}}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{textAlign:'center',fontSize:13,color:'#888'}}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{color:'#1a1a1a',fontWeight:600,cursor:'pointer'}}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  )
}