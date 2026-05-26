import { useState } from 'react'
import { supabase } from '../lib/supabase'

const colors = {
  bg: '#fef9f0',
  card: '#ffffff',
  accent: '#d4787c',
  brown: '#4a3728',
  text: '#8b7355',
  border: '#f0e6d8',
  inputBg: '#fdf6f0',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      console.log('signUp result:', { data, error })
      if (error) setMessage(error.message)
      else setMessage('注册成功！现在可以登录了。')
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('signIn result:', { data, error })
      if (error) setMessage(error.message)
      else if (!data?.session) setMessage('登录失败：无session返回')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, padding: 20 }}>
      <div style={{
        background: colors.card, borderRadius: 28, padding: '44px 32px 36px',
        maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(180,140,120,0.10)',
        textAlign: 'center', border: `1px solid ${colors.border}`
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📖</div>
        <h1 style={{ fontSize: 26, color: colors.brown, fontWeight: 700, margin: '0 0 4px' }}>我们的回忆</h1>
        <p style={{ color: colors.text, fontSize: 14, marginBottom: 32 }}>
          {isRegister ? '创建属于我们的手账本' : '翻开属于我们的一页'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="邮箱" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={{ padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${colors.border}`, fontSize: 15, background: colors.inputBg, outline: 'none', color: colors.brown }}
          />
          <input type="password" placeholder="密码" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            style={{ padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${colors.border}`, fontSize: 15, background: colors.inputBg, outline: 'none', color: colors.brown }}
          />
          <button type="submit" disabled={loading}
            style={{ padding: '14px', background: colors.accent, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 6, letterSpacing: 2 }}>
            {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        {message ? <p style={{ marginTop: 16, fontSize: 13, color: message.includes('成功') ? '#5b8c5a' : '#d4787c' }}>{message}</p> : null}

        <button onClick={() => { setIsRegister(!isRegister); setMessage('') }}
          style={{ marginTop: 24, background: 'none', border: 'none', color: colors.accent, cursor: 'pointer', fontSize: 14 }}>
          {isRegister ? '已有账号？去登录 →' : '没有账号？去注册 →'}
        </button>
      </div>
    </div>
  )
}
