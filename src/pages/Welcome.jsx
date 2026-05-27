import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import welcomeHero from '../assets/onboarding/welcome-hero.webp'

const C = {
  bg: '#fff0f3',
  primary: '#9c4233',
  pLight: '#e87c69',
  pFixed: '#ffdad4',
  secondary: '#536346',
  brown: '#1c1c18',
  text: '#56423f',
  light: '#89726e',
  border: '#dcc0bc',
  card: '#fcf9f2',
}

const FLOATING_ELEMENTS = [
  { emoji: '♥', x: 5, y: 18, size: 18, delay: 0, dur: 3.2 },
  { emoji: '⭐', x: 88, y: 12, size: 16, delay: 0.8, dur: 3.6 },
  { emoji: '🌸', x: 6, y: 60, size: 20, delay: 1.6, dur: 4.0 },
  { emoji: '♥', x: 84, y: 55, size: 14, delay: 2.2, dur: 3.4 },
  { emoji: '✨', x: 15, y: 70, size: 16, delay: 0.4, dur: 3.8 },
  { emoji: '💫', x: 80, y: 68, size: 15, delay: 1.2, dur: 4.2 },
  { emoji: '💝', x: 50, y: 75, size: 17, delay: 1.8, dur: 3.9 },
  { emoji: '🎀', x: 90, y: 35, size: 18, delay: 2.5, dur: 3.5 },
]

export default function Welcome() {
  const [step, setStep] = useState('welcome')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/')
    })
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else if (!data?.session) setMessage('登录失败，请重试')
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (password !== confirmPassword) { setMessage('两次密码不一致'); return }
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setMessage(error.message); setLoading(false); return }
    setMessage('注册成功！正在进入...')
    setTimeout(async () => {
      await supabase.auth.signInWithPassword({ email, password })
      navigate('/')
    }, 500)
  }

  // 已登录自动跳转（AuthForm 里注册/登录成功后也会跳转）
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/')
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(255,220,210,0.35) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 70%, rgba(255,200,180,0.30) 0%, transparent 50%)`,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px 16px', overflow: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 430, minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {step === 'welcome' && (
          <WelcomeSplash
            onStart={() => setStep('mode')}
            onLogin={() => setStep('auth')}
          />
        )}
        {step === 'mode' && (
          <RelationshipStep
            onNext={() => setStep('register')}
            onBack={() => setStep('welcome')}
          />
        )}
        {step === 'register' && (
          <AuthForm
            mode="register"
            email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            onSubmit={handleRegister} loading={loading} message={message} setMessage={setMessage}
            onBack={() => setStep('mode')}
            onSwitch={() => { setStep('auth'); setMessage('') }}
          />
        )}
        {step === 'auth' && (
          <AuthForm
            mode="login"
            email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            onSubmit={handleLogin} loading={loading} message={message} setMessage={setMessage}
            onBack={() => setStep('welcome')}
            onSwitch={() => { setStep('register'); setMessage('') }}
          />
        )}
      </div>

      <style>{animCSS}</style>
    </div>
  )
}

// ====================== WELCOME SPLASH ======================
function WelcomeSplash({ onStart, onLogin }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'EB Garamond, serif', fontSize: 'clamp(38px, 11vw, 52px)',
          color: C.primary, fontWeight: 600, letterSpacing: '-0.02em',
          margin: 0, lineHeight: 1.1,
        }}>
          Our Memories
        </h1>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: C.light,
          marginTop: 10, lineHeight: 1.5,
        }}>
          Keep the little things we never want to forget.
        </p>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: C.text,
          marginTop: 4, lineHeight: 1.6,
        }}>
          把我们舍不得忘记的小事，慢慢收藏起来。
        </p>
      </div>

      {/* Hero image section */}
      <div style={{
        position: 'relative', width: '100%',
        display: 'flex', justifyContent: 'center',
        marginTop: 8, marginBottom: 4,
      }}>
        {/* Floating elements behind/around the hero */}
        {FLOATING_ELEMENTS.map((el, i) => (
          <span key={i} style={{
            position: 'absolute',
            left: `${el.x}%`, top: `${el.y}%`,
            fontSize: el.size,
            pointerEvents: 'none', zIndex: 2,
            animation: `floatEl ${el.dur}s ease-in-out ${el.delay}s infinite`,
          }}>
            {el.emoji}
          </span>
        ))}

        {/* Hero image */}
        <div className="hero-wrap" style={{
          width: '112%', maxWidth: 470,
          animation: 'heroFloat 4.5s ease-in-out infinite',
        }}>
          <img
            src={welcomeHero}
            alt="Our Memories scrapbook"
            style={{
              width: '100%', display: 'block',
              objectFit: 'contain', userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <button onClick={onStart}
          style={{
            width: '100%', padding: '16px', background: C.primary, color: '#fff',
            border: 'none', borderRadius: 20, fontSize: 17, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            letterSpacing: '0.06em', boxShadow: '0 6px 24px rgba(156,66,51,0.28)',
            transition: 'transform 0.12s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          开 始 记 录
        </button>
        <button onClick={onLogin}
          style={{
            background: 'none', border: 'none', color: C.light, cursor: 'pointer',
            fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
            padding: '8px 20px', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.primary}
          onMouseLeave={e => e.currentTarget.style.color = C.light}
        >
          已有账号，去登录 →
        </button>
      </div>
    </div>
  )
}

// ====================== RELATIONSHIP STEP ======================
function RelationshipStep({ onNext, onBack }) {
  const [selected, setSelected] = useState('')

  const options = [
    { id: 'dating', emoji: '💕', title: '甜蜜恋爱', desc: '记录恋爱中的点点滴滴' },
    { id: 'married', emoji: '💍', title: '新婚夫妻', desc: '婚后生活的甜蜜回忆' },
    { id: 'forever', emoji: '💖', title: '长情陪伴', desc: '我们的每一天都值得纪念' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none', color: C.light,
        cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
        marginBottom: -8,
      }}>← 返回</button>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 28, color: C.brown, fontWeight: 600, margin: '0 0 8px' }}>
          你们的故事是...
        </h2>
        <p style={{ fontSize: 14, color: C.light, margin: 0 }}>
          选择一种，我们会为你定制专属回忆
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        {options.map(opt => (
          <button key={opt.id} onClick={() => setSelected(opt.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
              borderRadius: 18, border: `2px solid ${selected === opt.id ? C.primary : C.border}`,
              background: selected === opt.id ? C.pFixed : C.card,
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
              boxShadow: selected === opt.id ? '0 4px 16px rgba(156,66,51,0.10)' : 'none',
            }}>
            <span style={{ fontSize: 32 }}>{opt.emoji}</span>
            <div>
              <div style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, color: C.brown, fontWeight: 600 }}>{opt.title}</div>
              <div style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{opt.desc}</div>
            </div>
            {selected === opt.id && (
              <span style={{ marginLeft: 'auto', color: C.primary, fontSize: 20 }}>✓</span>
            )}
          </button>
        ))}
      </div>

      <button onClick={() => selected && onNext(selected)}
        style={{
          width: '100%', padding: '16px', marginTop: 8,
          background: selected ? C.primary : '#dcc0bc', color: '#fff',
          border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 600,
          cursor: selected ? 'pointer' : 'not-allowed',
          fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.06em',
          boxShadow: selected ? '0 6px 24px rgba(156,66,51,0.28)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        继续 →
      </button>
    </div>
  )
}

// ====================== AUTH FORM ======================
function AuthForm({ mode, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, onSubmit, loading, message, setMessage, onBack, onSwitch }) {
  const isRegister = mode === 'register'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none', color: C.light,
        cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
        marginBottom: -8,
      }}>← 返回</button>

      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 26, color: C.brown, fontWeight: 600, margin: '0 0 6px' }}>
          {isRegister ? '创建你们的时光册' : '欢迎回来'}
        </h2>
        <p style={{ fontSize: 13, color: C.light, margin: 0 }}>
          {isRegister ? '注册账号，开始记录属于你们的故事' : '登录继续书写你们的故事'}
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <input type="email" placeholder="邮箱地址" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
        {isRegister && (
          <input type="password" placeholder="确认密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} style={inputStyle} />
        )}
        <button type="submit" disabled={loading}
          style={{
            marginTop: 8, padding: '16px', background: C.primary, color: '#fff',
            border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            letterSpacing: '0.06em', boxShadow: '0 6px 24px rgba(156,66,51,0.28)',
            transition: 'transform 0.12s',
          }}>
          {loading ? '请稍候...' : isRegister ? '注  册' : '登  录'}
        </button>
      </form>

      {message ? (
        <p style={{ fontSize: 13, color: message.includes('成功') ? C.secondary : C.primary, textAlign: 'center', maxWidth: 360 }}>
          {message}
        </p>
      ) : null}

      <button onClick={onSwitch} style={{
        background: 'none', border: 'none', color: C.light, cursor: 'pointer',
        fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '8px 16px',
      }}>
        {isRegister ? '已有账号？去登录 →' : '没有账号？去注册 →'}
      </button>
    </div>
  )
}

const inputStyle = {
  padding: '15px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`,
  fontSize: 15, background: '#fdfaf7', color: '#1c1c18',
  fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
}

const animCSS = `
@keyframes heroFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes floatEl {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
  50% { transform: translateY(-10px) scale(1.08); opacity: 0.5; }
}
button:active { transform: scale(0.95) !important; }
`
