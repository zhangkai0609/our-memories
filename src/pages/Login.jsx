import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('注册成功！现在可以登录了。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>我们的回忆</h1>
        <p style={styles.subtitle}>{isRegister ? '创建你们的专属空间' : '记录属于我们的每一刻'}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        {message && <p style={message.includes('成功') ? styles.success : styles.error}>{message}</p>}

        <button onClick={() => { setIsRegister(!isRegister); setMessage('') }} style={styles.switch}>
          {isRegister ? '已有账号？去登录 →' : '没有账号？去注册 →'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #e1bee7 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: { fontSize: '28px', color: '#d81b60', marginBottom: '8px', fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: '14px', marginBottom: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  input: {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px',
    background: '#d81b60',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  switch: {
    marginTop: '20px',
    background: 'none',
    border: 'none',
    color: '#d81b60',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: { marginTop: '16px', color: '#e53935', fontSize: '14px' },
  success: { marginTop: '16px', color: '#43a047', fontSize: '14px' },
}
