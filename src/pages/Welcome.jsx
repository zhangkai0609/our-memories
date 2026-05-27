import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#fff0f3',
  primary: '#9c4233',
  pLight: '#e87c69',
  pFixed: '#ffdad4',
  secondary: '#536346',
  sContainer: '#d6e9c3',
  brown: '#1c1c18',
  text: '#56423f',
  light: '#89726e',
  border: '#dcc0bc',
  card: '#fdfaf7',
  cream: '#faf6f0',
}

const FLOATING_ELEMENTS = [
  { emoji: '♥', x: 8, y: 22, size: 18, delay: 0, dur: 3.2 },
  { emoji: '⭐', x: 82, y: 15, size: 16, delay: 0.8, dur: 3.6 },
  { emoji: '🌸', x: 12, y: 52, size: 20, delay: 1.6, dur: 4.0 },
  { emoji: '♥', x: 78, y: 48, size: 14, delay: 2.2, dur: 3.4 },
  { emoji: '✨', x: 22, y: 62, size: 16, delay: 0.4, dur: 3.8 },
  { emoji: '💫', x: 68, y: 60, size: 15, delay: 1.2, dur: 4.2 },
  { emoji: '🌟', x: 35, y: 12, size: 13, delay: 2.8, dur: 3.5 },
  { emoji: '💝', x: 55, y: 55, size: 17, delay: 1.8, dur: 3.9 },
]

const STICKERS = [
  { emoji: '📸', x: 5, y: 38, rot: -6, size: 28 },
  { emoji: '🎀', x: 88, y: 25, rot: 8, size: 26 },
  { emoji: '💌', x: 90, y: 58, rot: -4, size: 24 },
  { emoji: '🔖', x: 3, y: 68, rot: 5, size: 22 },
]

export default function Welcome() {
  const [step, setStep] = useState('welcome') // welcome | relationship | register | login
  const [relationMode, setRelationMode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // 如果已登录，直接进主页
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/')
    })
  }, [])

  // ---- Login ----
  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else if (!data?.session) setMessage('登录失败，请重试')
    setLoading(false)
  }

  // ---- Register ----
  async function handleRegister(e) {
    e.preventDefault()
    if (password !== confirmPassword) { setMessage('两次密码不一致'); return }
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('注册成功！正在进入...')
    setLoading(false)

    // 自动跳转
    if (!error) {
      setTimeout(async () => {
        const { data: d2 } = await supabase.auth.getSession()
        if (d2.session) navigate('/')
        else {
          // 可能需要手动登录
          await supabase.auth.signInWithPassword({ email, password })
          navigate('/')
        }
      }, 600)
    }
  }

  // ---- Render ----
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 500

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(255,220,210,0.45) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 75%, rgba(255,200,180,0.35) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(250,240,230,0.3) 0%, transparent 60%)`,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: 440, minHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 2,
      }}>
        {step === 'welcome' && <WelcomeSplash onStart={() => setStep('relationship')} onLogin={() => setStep('login')} />}
        {step === 'relationship' && <RelationshipStep onNext={(mode) => { setRelationMode(mode); setStep('register') }} onBack={() => setStep('welcome')} />}
        {step === 'register' && (
          <AuthForm mode="register" email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            onSubmit={handleRegister} loading={loading} message={message} setMessage={setMessage}
            onBack={() => setStep(step === 'register' ? 'relationship' : 'welcome')}
            relationMode={relationMode} />
        )}
        {step === 'login' && (
          <AuthForm mode="login" email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            onSubmit={handleLogin} loading={loading} message={message} setMessage={setMessage}
            onSwitch={() => { setStep('register'); setRelationMode(''); setMessage('') }}
            onBack={() => { setStep('welcome'); setMessage('') }} />
        )}
      </div>

      {/* Inject keyframes */}
      <style>{animCSS}</style>
    </div>
  )
}

// ====================== WELCOME SPLASH ======================
function WelcomeSplash({ onStart, onLogin }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(36px, 10vw, 48px)', color: C.primary, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
          Our<br />Moments
        </h1>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: C.light, marginTop: 8 }}>
          Capture every beautiful moment together
        </p>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: C.text, marginTop: 4 }}>
          记录属于我们两个人的每一个瞬间
        </p>
      </div>

      {/* Scrapbook */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 360,
        aspectRatio: '1.15', marginTop: 8, marginBottom: 8,
      }}>
        {/* Floating elements */}
        {FLOATING_ELEMENTS.map((el, i) => (
          <span key={i} className="float-item" style={{
            position: 'absolute', left: `${el.x}%`, top: `${el.y}%`,
            fontSize: el.size, animationDelay: `${el.delay}s`, animationDuration: `${el.dur}s`,
            zIndex: 3, pointerEvents: 'none',
          }}>
            <style>{`.float-item:nth-child(${i + 1}) { animation: softFloat ${el.dur}s ease-in-out ${el.delay}s infinite; }`}</style>
            {el.emoji}
          </span>
        ))}

        {/* Stickers */}
        {STICKERS.map((s, i) => (
          <span key={i} className={`sticker-${i}`} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            fontSize: s.size, transform: `rotate(${s.rot}deg)`,
            zIndex: 4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.10))',
            animation: `stickerFloat ${3 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
            pointerEvents: 'none',
          }}>{s.emoji}</span>
        ))}

        {/* Tape pieces */}
        <div style={{
          position: 'absolute', left: '15%', top: '-2%',
          width: 50, height: 18, background: 'rgba(255,255,220,0.7)',
          borderRadius: 2, transform: 'rotate(-6deg)', zIndex: 5,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }} />
        <div style={{
          position: 'absolute', right: '18%', bottom: '-3%',
          width: 44, height: 16, background: 'rgba(255,255,220,0.65)',
          borderRadius: 2, transform: 'rotate(4deg)', zIndex: 5,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }} />

        {/* Polaroid photos */}
        <img className="polaroid-1" src="" alt="" style={{
          position: 'absolute', left: '3%', top: '8%',
          width: '30%', aspectRatio: '1', borderRadius: 4,
          background: `linear-gradient(135deg, #ffe0d0, #ffd4c4)`,
          boxShadow: '2px 3px 10px rgba(0,0,0,0.12)',
          padding: 3, objectFit: 'cover', zIndex: 2,
          transform: 'rotate(-8deg)',
          animation: 'polaroidFloat1 4s ease-in-out 0.6s infinite',
        }}
        onError={(e) => { e.target.style.display = 'none' }}
        />
        <img className="polaroid-2" src="" alt="" style={{
          position: 'absolute', right: '5%', top: '12%',
          width: '28%', aspectRatio: '1', borderRadius: 4,
          background: `linear-gradient(135deg, #ffe8e0, #fdd8cc)`,
          boxShadow: '-2px 3px 10px rgba(0,0,0,0.12)',
          padding: 3, objectFit: 'cover', zIndex: 2,
          transform: 'rotate(6deg)',
          animation: 'polaroidFloat2 4.5s ease-in-out 1.2s infinite',
        }}
        onError={(e) => { e.target.style.display = 'none' }}
        />

        {/* Scrapbook pages */}
        {/* Back page - left */}
        <div style={{
          position: 'absolute', left: '5%', top: '18%',
          width: '44%', height: '64%',
          background: `linear-gradient(160deg, ${C.card}, ${C.cream})`,
          borderRadius: '8px 4px 4px 8px',
          boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.04), 3px 5px 18px rgba(156,66,51,0.08)',
          zIndex: 0, transform: 'rotate(-1.5deg)',
        }} />
        {/* Back page - right */}
        <div style={{
          position: 'absolute', right: '5%', top: '18%',
          width: '44%', height: '64%',
          background: `linear-gradient(-160deg, ${C.card}, ${C.cream})`,
          borderRadius: '4px 8px 8px 4px',
          boxShadow: 'inset 2px 0 8px rgba(0,0,0,0.04), -3px 5px 18px rgba(156,66,51,0.08)',
          zIndex: 0, transform: 'rotate(1.5deg)',
        }} />

        {/* Center binding */}
        <div style={{
          position: 'absolute', left: '50%', top: '16%', transform: 'translateX(-50%)',
          width: 10, height: '68%', background: `linear-gradient(to right, ${C.border}, ${C.pFixed}, ${C.border})`,
          borderRadius: 3, zIndex: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }} />

        {/* PET 1 - left side sitting on book */}
        <div className="pet-left" style={{
          position: 'absolute', left: '14%', bottom: '32%',
          zIndex: 6, animation: 'petFloat 3s ease-in-out 0s infinite',
        }}>
          {/* Bear body */}
          <div style={{
            width: 50, height: 44, background: `radial-gradient(circle at 50% 40%, #e8d5c4, #d4b896)`,
            borderRadius: '50% 50% 44% 44%', position: 'relative',
            boxShadow: '0 4px 10px rgba(0,0,0,0.10)',
          }}>
            {/* Ears */}
            <div style={{ position: 'absolute', top: -12, left: 4, width: 18, height: 18, background: '#d4b896', borderRadius: '50%', boxShadow: 'inset 0 2px 4px #c4a080' }} />
            <div style={{ position: 'absolute', top: -12, right: 4, width: 18, height: 18, background: '#d4b896', borderRadius: '50%', boxShadow: 'inset 0 2px 4px #c4a080' }} />
            {/* Inner ears */}
            <div style={{ position: 'absolute', top: -8, left: 8, width: 10, height: 10, background: '#e8c0b0', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: -8, right: 8, width: 10, height: 10, background: '#e8c0b0', borderRadius: '50%' }} />
            {/* Eyes */}
            <div style={{ position: 'absolute', top: 12, left: 14, width: 6, height: 7, background: '#3a2a1a', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: 12, right: 14, width: 6, height: 7, background: '#3a2a1a', borderRadius: '50%' }} />
            {/* Nose */}
            <div style={{ position: 'absolute', top: 20, left: '50%', marginLeft: -5, width: 10, height: 7, background: '#5a3420', borderRadius: '50%' }} />
            {/* Blush */}
            <div style={{ position: 'absolute', top: 18, left: 8, width: 8, height: 5, background: 'rgba(255,180,160,0.5)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: 18, right: 8, width: 8, height: 5, background: 'rgba(255,180,160,0.5)', borderRadius: '50%' }} />
            {/* Scarf */}
            <div style={{
              position: 'absolute', bottom: 8, left: -2, width: 54, height: 10,
              background: C.secondary, borderRadius: '50%', opacity: 0.85,
            }} />
          </div>
          {/* Little feet */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: -2 }}>
            <div style={{ width: 16, height: 10, background: '#d4b896', borderRadius: '50%' }} />
            <div style={{ width: 16, height: 10, background: '#d4b896', borderRadius: '50%' }} />
          </div>
        </div>

        {/* PET 2 - right side */}
        <div className="pet-right" style={{
          position: 'absolute', right: '16%', bottom: '30%',
          zIndex: 6, animation: 'petFloat 3s ease-in-out 1.5s infinite',
        }}>
          {/* Cat body */}
          <div style={{
            width: 44, height: 40, background: `radial-gradient(circle at 50% 40%, #ffe8d0, #f5c8a8)`,
            borderRadius: '46% 46% 40% 40%', position: 'relative',
            boxShadow: '0 4px 10px rgba(0,0,0,0.10)',
          }}>
            {/* Pointy ears */}
            <div style={{ position: 'absolute', top: -14, left: 2, width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '18px solid #f5c8a8' }} />
            <div style={{ position: 'absolute', top: -14, right: 2, width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '18px solid #f5c8a8' }} />
            {/* Inner ears */}
            <div style={{ position: 'absolute', top: -8, left: 5, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #f0b8b0' }} />
            <div style={{ position: 'absolute', top: -8, right: 5, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #f0b8b0' }} />
            {/* Eyes */}
            <div style={{ position: 'absolute', top: 11, left: 11, width: 7, height: 8, background: '#3a2a1a', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: 11, right: 11, width: 7, height: 8, background: '#3a2a1a', borderRadius: '50%' }} />
            {/* Nose */}
            <div style={{ position: 'absolute', top: 18, left: '50%', marginLeft: -3, width: 6, height: 5, background: '#e8a0a0', borderRadius: '2px' }} />
            {/* Whiskers */}
            <div style={{ position: 'absolute', top: 19, left: -8, width: 16, height: 1, background: '#ccc', transform: 'rotate(-5deg)' }} />
            <div style={{ position: 'absolute', top: 21, left: -8, width: 15, height: 1, background: '#ccc', transform: 'rotate(5deg)' }} />
            <div style={{ position: 'absolute', top: 19, right: -8, width: 16, height: 1, background: '#ccc', transform: 'rotate(5deg)' }} />
            <div style={{ position: 'absolute', top: 21, right: -8, width: 15, height: 1, background: '#ccc', transform: 'rotate(-5deg)' }} />
            {/* Bow */}
            <div style={{
              position: 'absolute', top: -2, right: -16, color: C.pLight, fontSize: 16,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
            }}>🎀</div>
          </div>
          {/* Tail */}
          <div style={{
            position: 'absolute', right: -14, bottom: -8, width: 18, height: 6,
            background: '#f5c8a8', borderRadius: '50%', transform: 'rotate(30deg)',
            animation: 'tailWag 1.5s ease-in-out infinite',
          }} />
        </div>

        {/* Tiny hearts between pets */}
        <span style={{
          position: 'absolute', left: '50%', top: '62%', transform: 'translateX(-50%)',
          fontSize: 14, zIndex: 7, animation: 'softFloat 2s ease-in-out 0.5s infinite',
        }}>♥</span>
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginTop: 4 }}>
        <button onClick={onStart} className="btn-primary"
          style={{
            width: '100%', padding: '16px', background: C.primary, color: '#fff',
            border: 'none', borderRadius: 20, fontSize: 17, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            letterSpacing: '0.06em', boxShadow: '0 6px 24px rgba(156,66,51,0.28)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          开 始 记 录
        </button>
        <button onClick={onLogin} className="btn-link"
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
    { id: 'dating', emoji: '💕', title: '甜蜜恋爱', desc: '记录恋爱中的点点滴滴', tag: '' },
    { id: 'married', emoji: '💍', title: '新婚夫妻', desc: '婚后生活的甜蜜回忆', tag: '' },
    { id: 'forever', emoji: '💖', title: '长情陪伴', desc: '我们的每一天都值得纪念', tag: '' },
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
          选择一种关系，我们会为你定制专属风格
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
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

      <button onClick={() => selected && onNext(selected)} className="btn-primary"
        style={{
          width: '100%', maxWidth: 360, padding: '16px', marginTop: 8,
          background: selected ? C.primary : '#dcc0bc', color: '#fff',
          border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 600,
          cursor: selected ? 'pointer' : 'not-allowed',
          fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.06em',
          boxShadow: selected ? '0 6px 24px rgba(156,66,51,0.28)' : 'none',
          transition: 'all 0.3s',
        }}
        onMouseDown={e => selected && (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={e => { if (selected) e.currentTarget.style.transform = 'scale(1)' }}
      >
        继续 →
      </button>
    </div>
  )
}

// ====================== AUTH FORM ======================
function AuthForm({ mode, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, onSubmit, loading, message, setMessage, onBack, onSwitch, relationMode }) {
  const isRegister = mode === 'register'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none', color: C.light,
        cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
        marginBottom: -8,
      }}>← 返回</button>

      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        {relationMode && (
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>
            {relationMode === 'dating' ? '💕' : relationMode === 'married' ? '💍' : '💖'}
          </span>
        )}
        <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 26, color: C.brown, fontWeight: 600, margin: '0 0 6px' }}>
          {isRegister ? '创建你们的时光册' : '欢迎回来'}
        </h2>
        <p style={{ fontSize: 13, color: C.light, margin: 0 }}>
          {isRegister ? '注册账号，开始记录属于你们的故事' : '登录继续书写你们的故事'}
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <input type="email" placeholder="邮箱地址" value={email} onChange={e => setEmail(e.target.value)} required
          style={inputStyle} />
        <input type="password" placeholder="密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
          style={inputStyle} />
        {isRegister && (
          <input type="password" placeholder="确认密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
            style={inputStyle} />
        )}
        <button type="submit" disabled={loading} className="btn-primary"
          style={{
            marginTop: 8, padding: '16px', background: C.primary, color: '#fff',
            border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            letterSpacing: '0.06em', boxShadow: '0 6px 24px rgba(156,66,51,0.28)',
            transition: 'transform 0.15s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? '请稍候...' : isRegister ? '注  册' : '登  录'}
        </button>
      </form>

      {message ? (
        <p style={{ fontSize: 13, color: message.includes('成功') ? C.secondary : C.primary, textAlign: 'center', maxWidth: 360 }}>
          {message}
        </p>
      ) : null}

      {!isRegister ? (
        <button onClick={onSwitch} style={{
          background: 'none', border: 'none', color: C.light, cursor: 'pointer',
          fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '8px 16px',
        }}>
          没有账号？去注册 →
        </button>
      ) : (
        <button onClick={() => onSwitch ? onSwitch() : onBack()} style={{
          background: 'none', border: 'none', color: C.light, cursor: 'pointer',
          fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '8px 16px',
        }}>
          已有账号？去登录 →
        </button>
      )}
    </div>
  )
}

const inputStyle = {
  padding: '15px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`,
  fontSize: 15, background: '#fdfaf7', color: '#1c1c18',
  fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
}

const animCSS = `
@keyframes softFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
  50% { transform: translateY(-10px) scale(1.08); opacity: 0.6; }
}
@keyframes petFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes polaroidFloat1 {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50% { transform: rotate(-6deg) translateY(-5px); }
}
@keyframes polaroidFloat2 {
  0%, 100% { transform: rotate(6deg) translateY(0); }
  50% { transform: rotate(4deg) translateY(-4px); }
}
@keyframes stickerFloat {
  0%, 100% { transform: rotate(var(--rot, 0deg)) translateY(0); }
  50% { transform: rotate(var(--rot, 0deg)) translateY(-3px); }
}
@keyframes tailWag {
  0%, 100% { transform: rotate(30deg); }
  50% { transform: rotate(45deg); }
}
.btn-primary:active { transform: scale(0.95) !important; }
.btn-link:hover { color: #9c4233 !important; }
`
