import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import welcomeHero from '../assets/onboarding/welcome-hero.webp'
import couplePets from '../assets/onboarding/modes/icons/couple-pets.webp'
import friendsCamera from '../assets/onboarding/modes/icons/friends-camera.webp'
import bestiesBow from '../assets/onboarding/modes/icons/besties-bow.webp'
import familyHouse from '../assets/onboarding/modes/icons/family-house.webp'
import customPencil from '../assets/onboarding/modes/icons/custom-pencil.webp'
import topLeftPolaroid from '../assets/onboarding/modes/decorations/top-left-polaroid.webp'
import topRightLaceHeart from '../assets/onboarding/modes/decorations/top-right-lace-heart.webp'
import leftFlowerBranch from '../assets/onboarding/modes/decorations/left-flower-branch.webp'
import rightFlowerBranch from '../assets/onboarding/modes/decorations/right-flower-branch.webp'
import bottomRightDaisy from '../assets/onboarding/modes/decorations/bottom-right-daisy.webp'

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

const relationshipModes = [
  { id: 'couple', title: '情侣', subtitle: 'Couple', description: '一起记录我们的甜蜜时光', image: couplePets },
  { id: 'friends', title: '好友', subtitle: 'Friends', description: '记录友情的点滴与快乐', image: friendsCamera },
  { id: 'besties', title: '闺蜜', subtitle: 'Besties', description: '我们的小秘密，专属珍藏', image: bestiesBow },
  { id: 'family', title: '家人', subtitle: 'Family', description: '记录家的温暖与爱', image: familyHouse },
  { id: 'custom', title: '自定义', subtitle: 'Custom', description: '打造属于你的独特回忆空间', image: customPencil },
]

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

  function handleModeConfirm(mode) {
    localStorage.setItem('our-memories-mode', mode)
    setStep('auth')
  }

  function handleModeSkip() {
    setStep('auth')
  }

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
          <ModeStep
            onConfirm={handleModeConfirm}
            onSkip={handleModeSkip}
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to bottom, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(to top, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 20, background: `linear-gradient(to right, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 20, background: `linear-gradient(to left, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
        </div>

        <span style={{ position: 'absolute', top: -8, left: 'calc(50% - 140px)', width: 42, height: 18, background: 'rgba(252,249,242,0.55)', borderRadius: 2, transform: 'rotate(-12deg)', zIndex: 3, pointerEvents: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} />
        <span style={{ position: 'absolute', bottom: 6, right: 'calc(50% - 148px)', width: 38, height: 16, background: 'rgba(252,249,242,0.50)', borderRadius: 2, transform: 'rotate(8deg)', zIndex: 3, pointerEvents: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} />
      </div>

      {/* ===== 按钮区域 ===== */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 8 }}>
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

// ====================== MODE STEP ======================
function ModeStep({ onConfirm, onSkip, onBack }) {
  const [selected, setSelected] = useState('couple')
  const [visible, setVisible] = useState(false)

  useEffect(() => { setVisible(true) }, [])

  function handleContinue() {
    if (!selected) return
    onConfirm(selected)
  }

  const gridModes = relationshipModes.slice(0, 4)
  const customMode = relationshipModes[4]

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      paddingTop: 8, paddingBottom: 24,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* 背景装饰 */}
      <img src={topLeftPolaroid} alt="" style={{ position: 'fixed', top: 24, left: 12, width: 72, opacity: 0.55, pointerEvents: 'none', zIndex: 0, transform: 'rotate(-8deg)' }} />
      <img src={topRightLaceHeart} alt="" style={{ position: 'fixed', top: 28, right: 10, width: 58, opacity: 0.50, pointerEvents: 'none', zIndex: 0 }} />
      <img src={leftFlowerBranch} alt="" style={{ position: 'fixed', left: 0, top: '28%', width: 60, opacity: 0.40, pointerEvents: 'none', zIndex: 0 }} />
      <img src={rightFlowerBranch} alt="" style={{ position: 'fixed', right: 0, top: '30%', width: 56, opacity: 0.40, pointerEvents: 'none', zIndex: 0 }} />
      <img src={bottomRightDaisy} alt="" style={{ position: 'fixed', bottom: 20, right: 16, width: 50, opacity: 0.50, pointerEvents: 'none', zIndex: 0 }} />

      {/* 返回按钮 */}
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none',
        color: C.light, cursor: 'pointer', fontSize: 14,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        padding: '4px 0', marginBottom: 4, position: 'relative', zIndex: 1,
      }}>← 返回</button>

      {/* 标题区域 */}
      <div style={{ textAlign: 'center', marginBottom: 4, position: 'relative', zIndex: 1 }}>
        <p style={{
          fontFamily: 'EB Garamond, serif', fontSize: 15,
          color: C.primary, fontWeight: 500, margin: 0,
          letterSpacing: '0.04em',
        }}>
          Our Memories
        </p>
        <h2 style={{
          fontFamily: 'EB Garamond, serif', fontSize: 26,
          color: C.brown, fontWeight: 600, margin: '4px 0 0',
          letterSpacing: '-0.01em',
        }}>
          选择关系模式
        </h2>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, marginTop: 8,
        }}>
          <span style={{ width: 30, height: 1, background: C.border }} />
          <span style={{ fontSize: 10, color: C.pLight, lineHeight: 1 }}>♥</span>
          <span style={{ width: 30, height: 1, background: C.border }} />
        </div>
        <p style={{
          fontSize: 13, color: '#8b7770', margin: '6px 0 0',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '0.02em',
        }}>
          每一种关系，都值得被认真收藏。
        </p>
      </div>

      {/* 卡片网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginTop: 10,
        position: 'relative', zIndex: 1,
      }}>
        {gridModes.map((mode, i) => (
          <ModeCard
            key={mode.id}
            mode={mode}
            selected={selected === mode.id}
            onSelect={() => setSelected(mode.id)}
            delay={i}
          />
        ))}
      </div>

      {/* 自定义卡片 — 独占一行 */}
      <div style={{ marginTop: 10, position: 'relative', zIndex: 1 }}>
        <ModeCard
          mode={customMode}
          selected={selected === customMode.id}
          onSelect={() => setSelected(customMode.id)}
          delay={4}
          wide
        />
      </div>

      {/* 底部操作 */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: 16, gap: 0, position: 'relative', zIndex: 1,
      }}>
        <p style={{
          fontSize: 12, color: '#b0a09b',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          margin: '0 0 10px',
        }}>
          之后也可以在小窝中修改
        </p>

        <button onClick={handleContinue} style={{
          width: '84%', height: 54,
          background: C.primary, color: '#fff',
          border: 'none', borderRadius: 999,
          fontSize: 16, fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '0.08em',
          boxShadow: `0 6px 28px rgba(156,66,51,0.22), inset 0 1px 0 rgba(255,255,255,0.18)`,
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(156,66,51,0.18)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(156,66,51,0.22), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(156,66,51,0.22), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
        >
          继 续
        </button>

        <button onClick={onSkip} style={{
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
          跳过，稍后设置
        </button>
      </div>

      <style>{modeCardCSS}</style>
    </div>
  )
}

// ====================== MODE CARD ======================
function ModeCard({ mode, selected, onSelect, delay, wide }) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'center',
        gap: wide ? 16 : 8,
        padding: wide ? '16px 20px' : '16px 12px 14px',
        borderRadius: 26,
        border: selected ? `2px solid ${C.primary}` : `1.5px solid rgba(220,192,188,0.5)`,
        background: selected ? 'linear-gradient(135deg, #fff5f3 0%, #fcf9f2 100%)' : C.card,
        cursor: 'pointer',
        textAlign: 'center',
        boxShadow: selected
          ? '0 6px 24px rgba(156,66,51,0.10), 0 2px 8px rgba(156,66,51,0.06)'
          : '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        opacity: 0,
        animation: `cardIn 0.5s ease-out ${0.08 + delay * 0.07}s forwards`,
        transform: 'scale(1)',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'scale(1.02)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(220,192,188,0.5)'; e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = selected ? 'scale(1)' : 'scale(1.02)'; }}
    >
      {/* 选中标记 */}
      {selected && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          width: 24, height: 24, borderRadius: '50%',
          background: C.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
          animation: 'checkPop 0.3s ease-out',
          zIndex: 2,
        }}>✓</span>
      )}

      {/* 虚线内边框 */}
      <div style={{
        position: 'absolute', inset: 5, borderRadius: 22,
        border: `1px dashed rgba(220,192,188,0.35)`,
        pointerEvents: 'none',
      }} />

      {/* 插图 */}
      <div style={{
        width: wide ? 56 : 56,
        height: wide ? 56 : 56,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: selected ? 'iconFloat 3s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}>
        <img src={mode.image} alt={mode.title}
          style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }} />
      </div>

      {/* 文字 */}
      <div style={{ flex: wide ? 1 : undefined }}>
        <div style={{
          fontSize: wide ? 16 : 15,
          fontWeight: 700, color: C.brown,
          fontFamily: 'EB Garamond, serif',
        }}>{mode.title}</div>
        <div style={{
          fontSize: 10, color: C.light, marginTop: 1,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{mode.subtitle}</div>
        <div style={{
          fontSize: 11, color: '#8b7770', marginTop: 3,
          lineHeight: 1.4,
        }}>{mode.description}</div>
      </div>
    </button>
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

const modeCardCSS = `
@keyframes cardIn {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes checkPop {
  0% { transform: scale(0); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
`
