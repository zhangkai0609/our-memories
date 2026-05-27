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

// 页面装饰元素
const DECOR = [
  { emoji: '✨', x: 6, y: 14, size: 14, delay: 0, dur: 3.8 },
  { emoji: '💫', x: 90, y: 10, size: 13, delay: 1.2, dur: 4.0 },
  { emoji: '🌸', x: 5, y: 45, size: 16, delay: 2.0, dur: 4.2 },
  { emoji: '♥', x: 93, y: 48, size: 13, delay: 0.6, dur: 3.6 },
  { emoji: '⭐', x: 10, y: 78, size: 15, delay: 1.8, dur: 3.9 },
  { emoji: '🎀', x: 88, y: 76, size: 14, delay: 2.4, dur: 4.1 },
  { emoji: '💝', x: 48, y: 8, size: 12, delay: 1.4, dur: 3.7 },
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/')
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px 16px', overflow: 'hidden',
      position: 'relative',
    }}>
      {/* 背景纸纹 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* 柔和光晕 */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 0,
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,200,190,0.30) 0%, transparent 70%)',
        top: '18%', left: '50%', transform: 'translateX(-50%)',
      }} />

      {/* 装饰浮动元素 */}
      {DECOR.map((el, i) => (
        <span key={i} style={{
          position: 'fixed',
          left: `${el.x}%`, top: `${el.y}%`,
          fontSize: el.size,
          pointerEvents: 'none', zIndex: 0,
          opacity: 0.55,
          animation: `floatEl ${el.dur}s ease-in-out ${el.delay}s infinite`,
        }}>
          {el.emoji}
        </span>
      ))}

      <div style={{ width: '100%', maxWidth: 430, minHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
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
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      {/* ===== 标题区域 ===== */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <h1 style={{
          fontFamily: 'EB Garamond, serif',
          fontSize: 'clamp(36px, 10vw, 48px)',
          color: C.primary, fontWeight: 600,
          letterSpacing: '-0.01em',
          margin: 0, lineHeight: 1.1,
        }}>
          Our Memories
        </h1>

        {/* 装饰线 + 爱心 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, marginTop: 10,
        }}>
          <span style={{ width: 36, height: 1, background: C.border }} />
          <span style={{ fontSize: 10, color: C.pLight, lineHeight: 1 }}>♥</span>
          <span style={{ width: 36, height: 1, background: C.border }} />
        </div>

        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 13, color: C.light,
          marginTop: 10, marginBottom: 0,
          lineHeight: 1.7, letterSpacing: '0.02em',
        }}>
          Keep the little things we never want to forget.
        </p>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 13, color: C.text,
          marginTop: 2, marginBottom: 0,
          lineHeight: 1.8, letterSpacing: '0.03em',
        }}>
          把我们舍不得忘记的小事，慢慢收藏起来。
        </p>
      </div>

      {/* ===== Hero 图片区域 ===== */}
      <div style={{
        position: 'relative', width: '100%',
        display: 'flex', justifyContent: 'center',
        marginTop: 4, marginBottom: 4,
      }}>
        {/* 相册容器 + 柔和边框 */}
        <div style={{
          position: 'relative',
          width: '92%', maxWidth: 420,
          borderRadius: 28,
          overflow: 'hidden',
          animation: 'heroFloat 4.8s ease-in-out infinite',
          boxShadow: '0 2px 30px rgba(156,66,51,0.06), 0 8px 40px rgba(156,66,51,0.04)',
        }}>
          <img
            src={welcomeHero}
            alt="Our Memories scrapbook"
            style={{
              width: '100%', display: 'block',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />

          {/* 顶部渐变遮罩 — 让图片上边缘融入背景 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 40,
            background: `linear-gradient(to bottom, ${C.bg} 0%, transparent 100%)`,
            pointerEvents: 'none',
          }} />
          {/* 底部渐变遮罩 — 让图片下边缘融入背景 */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
            background: `linear-gradient(to top, ${C.bg} 0%, transparent 100%)`,
            pointerEvents: 'none',
          }} />
          {/* 左侧微遮罩 */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: 20,
            background: `linear-gradient(to right, ${C.bg} 0%, transparent 100%)`,
            pointerEvents: 'none',
          }} />
          {/* 右侧微遮罩 */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: 20,
            background: `linear-gradient(to left, ${C.bg} 0%, transparent 100%)`,
            pointerEvents: 'none',
          }} />
        </div>

        {/* 胶带装饰 — 左上 */}
        <span style={{
          position: 'absolute',
          top: -8, left: 'calc(50% - 140px)',
          width: 42, height: 18,
          background: 'rgba(252,249,242,0.55)',
          borderRadius: 2,
          transform: 'rotate(-12deg)',
          zIndex: 3, pointerEvents: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }} />
        {/* 胶带装饰 — 右下 */}
        <span style={{
          position: 'absolute',
          bottom: 6, right: 'calc(50% - 148px)',
          width: 38, height: 16,
          background: 'rgba(252,249,242,0.50)',
          borderRadius: 2,
          transform: 'rotate(8deg)',
          zIndex: 3, pointerEvents: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }} />
      </div>

      {/* ===== 按钮区域 ===== */}
      <div style={{
        width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 0, marginTop: 8,
      }}>
        <button onClick={onStart} style={{
          width: '84%', height: 58,
          background: C.primary, color: '#fff',
          border: 'none', borderRadius: 999,
          fontSize: 16, fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '0.08em',
          boxShadow: `0 6px 28px rgba(156,66,51,0.22), inset 0 1px 0 rgba(255,255,255,0.18)`,
          transition: 'transform 0.1s, box-shadow 0.1s',
          position: 'relative',
        }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(156,66,51,0.18)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(156,66,51,0.22), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(156,66,51,0.22), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
        >
          开 始 记 录
        </button>

        <button onClick={onLogin} style={{
          background: 'none', border: 'none',
          color: '#8b7770', cursor: 'pointer',
          fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif',
          padding: '14px 20px',
          transition: 'color 0.2s',
          letterSpacing: '0.03em',
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.primary}
          onMouseLeave={e => e.currentTarget.style.color = '#8b7770'}
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
  50% { transform: translateY(-6px); }
}
@keyframes floatEl {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.55; }
  50% { transform: translateY(-10px) scale(1.12); opacity: 0.3; }
}
button:active { transform: scale(0.95) !important; }
`
