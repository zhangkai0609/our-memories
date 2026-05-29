import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, phoneToEmail } from '../lib/supabase'
import { getOrCreateSpace } from '../lib/space'

const C = {
  bg: '#fff0f3',
  primary: '#9c4233',
  pLight: '#e87c69',
  brown: '#1c1c18',
  text: '#56423f',
  border: '#dcc0bc',
  card: '#fcf9f2',
}

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^1[3-9]\d{9}$/.test(phone.replace(/[\s\-]/g, ''))) {
      setMessage('请输入正确的手机号'); return
    }
    setLoading(true)
    setMessage('')
    try {
      const email = phoneToEmail(phone)
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) { setMessage(error.message); return }
        if (data?.session) {
          await getOrCreateSpace(phone)
          navigate('/')
        } else {
          setMessage('注册成功！现在可以登录了。')
          setIsRegister(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setMessage(error.message); return }
        if (!data?.session) { setMessage('登录失败，请重试'); return }
        // 确保用户有 space_id
        const spaceId = await getOrCreateSpace(phone)
        if (!spaceId) { setMessage('空间初始化失败，请重试'); return }
        navigate('/')
      }
    } catch (err) {
      setMessage('网络连接失败，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 20 }}>
      <div className="grain-overlay" />
      <div style={{
        background: C.card, borderRadius: 32, padding: '48px 32px 40px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 12px 48px rgba(156,66,51,0.10)',
        textAlign: 'center', border: `1px solid ${C.border}`
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>📖</div>
        <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 32, color: C.primary, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          Our Memories
        </h1>
        <p style={{ color: C.text, fontSize: 14, marginBottom: 36, fontWeight: 400 }}>
          {isRegister ? '创建你们的专属时光册' : '翻开属于我们的一页'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="tel" placeholder="手机号码" value={phone}
            onChange={e => setPhone(e.target.value)} required maxLength={13}
            style={{
              padding: '15px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`,
              fontSize: 15, background: '#fdfaf7', color: C.brown, fontFamily: 'inherit'
            }} />
          <input type="password" placeholder="密码" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            style={{
              padding: '15px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`,
              fontSize: 15, background: '#fdfaf7', color: C.brown, fontFamily: 'inherit'
            }} />
          <button type="submit" disabled={loading}
            style={{
              padding: '15px', background: C.primary, color: '#fff', border: 'none',
              borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8,
              fontFamily: 'inherit', letterSpacing: '0.05em'
            }}>
            {loading ? '请稍候...' : isRegister ? '注  册' : '登  录'}
          </button>
        </form>

        {message ? <p style={{
          marginTop: 18, fontSize: 13,
          color: message.includes('成功') ? '#536346' : C.primary
        }}>{message}</p> : null}

        <button onClick={() => { setIsRegister(!isRegister); setMessage('') }}
          style={{
            marginTop: 28, background: 'none', border: 'none',
            color: C.pLight, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit'
          }}>
          {isRegister ? '已有账号？去登录 →' : '没有账号？注册一个 →'}
        </button>
      </div>
    </div>
  )
}
