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
  brown: '#3f302b',
  text: '#56423f',
  light: '#89726e',
  border: '#dcc0bc',
  card: '#fcf9f2',
  inputBg: '#fdfaf7',
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/')
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100svh', background: C.bg,
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
          opacity: 0.50,
          animation: `floatEl ${el.dur}s ease-in-out ${el.delay}s infinite`,
        }}>
          {el.emoji}
        </span>
      ))}

      <div style={{ width: '100%', maxWidth: 430, minHeight: '90svh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
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
        {step === 'auth' && (
          <AuthStep
            onBack={() => setStep('mode')}
            onLoginSuccess={() => navigate('/')}
            onRegisterSuccess={() => setStep('createSpace')}
          />
        )}
        {step === 'createSpace' && (
          <CreateSpaceStep
            onBack={() => setStep('auth')}
            onEnter={() => navigate('/')}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ width: 36, height: 1, background: C.border }} />
          <span style={{ fontSize: 10, color: C.pLight, lineHeight: 1 }}>♥</span>
          <span style={{ width: 36, height: 1, background: C.border }} />
        </div>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: C.light, marginTop: 10, marginBottom: 0, lineHeight: 1.7, letterSpacing: '0.02em' }}>
          Keep the little things we never want to forget.
        </p>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: C.text, marginTop: 2, marginBottom: 0, lineHeight: 1.8, letterSpacing: '0.03em' }}>
          把我们舍不得忘记的小事，慢慢收藏起来。
        </p>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', marginTop: 4, marginBottom: 4 }}>
        <div style={{
          position: 'relative', width: '92%', maxWidth: 420, borderRadius: 28, overflow: 'hidden',
          animation: 'heroFloat 4.8s ease-in-out infinite',
          boxShadow: '0 2px 30px rgba(156,66,51,0.06), 0 8px 40px rgba(156,66,51,0.04)',
        }}>
          <img src={welcomeHero} alt="Our Memories scrapbook"
            style={{ width: '100%', display: 'block', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to bottom, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(to top, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 20, background: `linear-gradient(to right, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 20, background: `linear-gradient(to left, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
        </div>
        <span style={{ position: 'absolute', top: -8, left: 'calc(50% - 140px)', width: 42, height: 18, background: 'rgba(252,249,242,0.55)', borderRadius: 2, transform: 'rotate(-12deg)', zIndex: 3, pointerEvents: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} />
        <span style={{ position: 'absolute', bottom: 6, right: 'calc(50% - 148px)', width: 38, height: 16, background: 'rgba(252,249,242,0.50)', borderRadius: 2, transform: 'rotate(8deg)', zIndex: 3, pointerEvents: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} />
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 8 }}>
        <button onClick={onStart} style={pillBtnStyle}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(156,66,51,0.18)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
        >开 始 记 录</button>
        <button onClick={onLogin} style={textLinkStyle}
          onMouseEnter={e => e.currentTarget.style.color = C.primary}
          onMouseLeave={e => e.currentTarget.style.color = '#8b7770'}
        >已有账号，去登录 →</button>
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
      paddingTop: 4, paddingBottom: 24,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      <img src={topLeftPolaroid} alt="" style={decorStyle('topLeft')} />
      <img src={topRightLaceHeart} alt="" style={decorStyle('topRight')} />
      <img src={leftFlowerBranch} alt="" style={decorStyle('left')} />
      <img src={rightFlowerBranch} alt="" style={decorStyle('right')} />
      <img src={bottomRightDaisy} alt="" style={decorStyle('bottom')} />

      <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '4px 0', marginBottom: 0, position: 'relative', zIndex: 1 }}>← 返回</button>

      <div style={{ textAlign: 'center', marginBottom: 2, position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 30, color: C.primary, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Our Memories</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
          <span style={{ width: 28, height: 1, background: C.border }} />
          <span style={{ fontSize: 10, color: C.pLight, lineHeight: 1 }}>♥</span>
          <span style={{ width: 28, height: 1, background: C.border }} />
        </div>
        <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(28px, 8vw, 34px)', color: C.brown, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.01em' }}>选择关系模式</h2>
        <p style={{ fontSize: 13, color: '#8b7770', margin: '4px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.02em' }}>每一种关系，都值得被认真收藏。</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, position: 'relative', zIndex: 1 }}>
        {gridModes.map((mode, i) => (
          <ModeCard key={mode.id} mode={mode} selected={selected === mode.id} onSelect={() => setSelected(mode.id)} delay={i} />
        ))}
      </div>
      <div style={{ marginTop: 10, position: 'relative', zIndex: 1 }}>
        <ModeCard mode={customMode} selected={selected === customMode.id} onSelect={() => setSelected(customMode.id)} delay={4} wide />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18, gap: 0, position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: '#b0a09b', fontFamily: 'Plus Jakarta Sans, sans-serif', margin: '0 0 12px' }}>之后也可以在小窝中修改</p>
        <button onClick={handleContinue} style={pillBtnStyle}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(156,66,51,0.18)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
        >继 续</button>
        <button onClick={onSkip} style={textLinkStyle}
          onMouseEnter={e => e.currentTarget.style.color = C.primary}
          onMouseLeave={e => e.currentTarget.style.color = '#8b7770'}
        >跳过，稍后设置</button>
      </div>
      <style>{modeCardCSS}</style>
    </div>
  )
}

// ====================== MODE CARD ======================
function ModeCard({ mode, selected, onSelect, delay, wide }) {
  return (
    <button onClick={onSelect} style={{
      display: 'flex', flexDirection: wide ? 'row' : 'column',
      alignItems: wide ? 'center' : 'center', gap: 0,
      minHeight: wide ? 120 : 168, padding: wide ? '16px 18px' : '20px 14px 16px',
      borderRadius: 26,
      border: selected ? `2px solid ${C.primary}` : '1px solid rgba(156,66,51,0.12)',
      background: selected
        ? 'linear-gradient(180deg, rgba(255,245,243,0.98) 0%, rgba(252,249,242,0.96) 100%)'
        : 'linear-gradient(180deg, rgba(252,249,242,0.96) 0%, rgba(250,244,232,0.92) 100%)',
      cursor: 'pointer', textAlign: wide ? 'left' : 'center',
      boxShadow: selected ? '0 18px 36px rgba(156,66,51,0.22)' : '0 12px 28px rgba(90,55,45,0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative',
      fontFamily: 'Plus Jakarta Sans, sans-serif', opacity: 0,
      animation: `cardIn 0.5s ease-out ${0.08 + delay * 0.07}s forwards`,
    }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'rgba(156,66,51,0.25)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'rgba(156,66,51,0.12)'; e.currentTarget.style.transform = 'scale(1)'; } }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = selected ? 'scale(1)' : 'scale(1.02)'; }}
    >
      {selected && (
        <span style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, animation: 'checkPop 0.35s ease-out', zIndex: 2, boxShadow: '0 2px 6px rgba(156,66,51,0.25)' }}>✓</span>
      )}
      <div style={{ position: 'absolute', inset: 5, borderRadius: 22, border: '1px dashed rgba(220,192,188,0.22)', pointerEvents: 'none' }} />
      <div style={{ width: wide ? 72 : '100%', height: wide ? 72 : 82, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: wide ? 0 : 12, flexShrink: 0, animation: selected && !wide ? 'iconFloat 3s ease-in-out infinite' : 'none' }}>
        <img src={mode.image} alt={mode.title} style={{ maxWidth: wide ? 72 : 145, maxHeight: wide ? 72 : 82, objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }} />
      </div>
      <div style={{ flex: wide ? 1 : undefined, display: 'flex', flexDirection: 'column', alignItems: wide ? 'flex-start' : 'center', marginLeft: wide ? 14 : 0 }}>
        <div style={{ fontSize: wide ? 17 : 24, fontWeight: 700, color: C.brown, fontFamily: 'EB Garamond, serif', lineHeight: 1.2 }}>{mode.title}</div>
        <div style={{ fontSize: 11, color: C.light, marginTop: 2, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 400 }}>{mode.subtitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 4 }}>
          <span style={{ width: 14, height: 1, background: 'rgba(220,192,188,0.4)' }} />
          <span style={{ fontSize: 7, color: C.pLight, lineHeight: 1 }}>♥</span>
          <span style={{ width: 14, height: 1, background: 'rgba(220,192,188,0.4)' }} />
        </div>
        <div style={{ fontSize: 12, color: '#6f5c55', marginTop: 4, lineHeight: 1.5 }}>{mode.description}</div>
      </div>
    </button>
  )
}

// ====================== AUTH STEP ======================
function AuthStep({ onBack, onLoginSuccess, onRegisterSuccess }) {
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => { setVisible(true) }, [])

  function switchMode(mode) {
    setAuthMode(mode)
    setMessage('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!email.trim() || !password) { setMessage('请填写邮箱和密码'); return }
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setMessage(error.message); setLoading(false); return }
    if (!data?.session) { setMessage('登录失败，请重试'); setLoading(false); return }
    onLoginSuccess()
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!email.trim() || !password) { setMessage('请填写邮箱和密码'); return }
    if (password !== confirmPassword) { setMessage('两次密码不一致'); return }
    if (password.length < 6) { setMessage('密码至少需要6位'); return }
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: nickname.trim() || undefined } },
    })
    if (error) { setMessage(error.message); setLoading(false); return }
    setMessage('注册成功！')
    setTimeout(() => onRegisterSuccess(), 800)
  }

  const isLogin = authMode === 'login'

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      paddingTop: 4, paddingBottom: 24,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      {/* ===== 背景装饰 ===== */}
      <img src={topLeftPolaroid} alt="" style={decorStyle('topLeft')} />
      <img src={topRightLaceHeart} alt="" style={decorStyle('topRight')} />
      <img src={leftFlowerBranch} alt="" style={decorStyle('left')} />
      <img src={rightFlowerBranch} alt="" style={decorStyle('right')} />
      <img src={bottomRightDaisy} alt="" style={decorStyle('bottom')} />

      {/* ===== 返回按钮 ===== */}
      <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '4px 0', marginBottom: 0, position: 'relative', zIndex: 1 }}>← 返回</button>

      {/* ===== 标题区域 ===== */}
      <div style={{ textAlign: 'center', marginBottom: 10, position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 30, color: C.primary, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>Our Memories</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
          <span style={{ width: 28, height: 1, background: C.border }} />
          <span style={{ fontSize: 10, color: C.pLight, lineHeight: 1 }}>♥</span>
          <span style={{ width: 28, height: 1, background: C.border }} />
        </div>
        <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(26px, 7vw, 32px)', color: C.brown, fontWeight: 600, margin: '6px 0 0', letterSpacing: '-0.01em' }}>登录或注册</h2>
        <p style={{ fontSize: 13, color: '#8b7770', margin: '4px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.02em' }}>开启你们的专属回忆空间</p>
      </div>

      {/* ===== 主卡片 ===== */}
      <div style={{
        background: C.card, borderRadius: 32,
        padding: '28px 22px 24px',
        boxShadow: '0 12px 40px rgba(156,66,51,0.08), 0 4px 16px rgba(90,55,45,0.04)',
        border: '1px solid rgba(220,192,188,0.3)',
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(180deg, rgba(252,249,242,0.98) 0%, rgba(250,245,238,0.94) 100%)',
      }}>
        {/* Tab 切换 */}
        <div style={{
          display: 'flex', marginBottom: 24,
          background: 'rgba(220,192,188,0.15)', borderRadius: 20, padding: 3,
        }}>
          <button onClick={() => switchMode('login')} style={{
            flex: 1, padding: '10px', borderRadius: 18,
            background: isLogin ? C.card : 'transparent',
            color: isLogin ? C.primary : C.light,
            fontWeight: 600, fontSize: 15,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            border: 'none', cursor: 'pointer',
            boxShadow: isLogin ? '0 2px 8px rgba(156,66,51,0.10)' : 'none',
            transition: 'all 0.25s ease',
          }}>登 录</button>
          <button onClick={() => switchMode('register')} style={{
            flex: 1, padding: '10px', borderRadius: 18,
            background: !isLogin ? C.card : 'transparent',
            color: !isLogin ? C.primary : C.light,
            fontWeight: 600, fontSize: 15,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            border: 'none', cursor: 'pointer',
            boxShadow: !isLogin ? '0 2px 8px rgba(156,66,51,0.10)' : 'none',
            transition: 'all 0.25s ease',
          }}>注 册</button>
        </div>

        {/* 表单 */}
        <form onSubmit={isLogin ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 昵称 (仅注册) */}
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: 14, fontSize: 15, pointerEvents: 'none', zIndex: 1 }}>👤</span>
              <input type="text" placeholder="昵称（选填）" value={nickname} onChange={e => setNickname(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 42 }} />
            </div>
          )}

          {/* 邮箱 */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: 14, fontSize: 15, pointerEvents: 'none', zIndex: 1 }}>✉</span>
            <input type="email" placeholder="邮箱地址" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ ...inputStyle, paddingLeft: 42 }} />
          </div>

          {/* 密码 */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: 14, fontSize: 15, pointerEvents: 'none', zIndex: 1 }}>🔒</span>
            <input type={showPassword ? 'text' : 'password'} placeholder="密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ ...inputStyle, paddingLeft: 42, paddingRight: 48 }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 4, top: 6, width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,192,188,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >{showPassword ? '🙈' : '👁'}</button>
          </div>

          {/* 确认密码 (仅注册) */}
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: 14, fontSize: 15, pointerEvents: 'none', zIndex: 1 }}>🔒</span>
              <input type={showConfirm ? 'text' : 'password'} placeholder="确认密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                style={{ ...inputStyle, paddingLeft: 42, paddingRight: 48 }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 4, top: 6, width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,192,188,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >{showConfirm ? '🙈' : '👁'}</button>
            </div>
          )}

          {/* 记住我 + 忘记密码 (仅登录) */}
          {isLogin && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor: C.primary, width: 15, height: 15, cursor: 'pointer' }} />
                记住我
              </label>
              <button type="button" onClick={() => setMessage('请通过注册邮箱重置密码')}
                style={{ background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = C.primary}
                onMouseLeave={e => e.currentTarget.style.color = C.light}
              >忘记密码？</button>
            </div>
          )}

          {/* 错误/提示信息 */}
          {message ? (
            <p style={{ fontSize: 13, color: message === '注册成功！' ? C.secondary : C.primary, textAlign: 'center', margin: 0, padding: '4px 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {message}
            </p>
          ) : null}

          {/* 提交按钮 */}
          <button type="submit" disabled={loading} style={{
            ...pillBtnStyle, width: '100%', marginTop: 4,
            opacity: loading ? 0.7 : 1,
          }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(156,66,51,0.18)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          >{loading ? '处理中...' : isLogin ? '登  录' : '注  册'}</button>
        </form>

        {/* 分割线 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, marginBottom: 18 }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(220,192,188,0.35)' }} />
          <span style={{ fontSize: 12, color: '#b0a09b', fontFamily: 'Plus Jakarta Sans, sans-serif', whiteSpace: 'nowrap' }}>或</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(220,192,188,0.35)' }} />
        </div>

        {/* 社交登录按钮 */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { id: 'google', label: 'Google', icon: 'G' },
            { id: 'apple', label: 'Apple', icon: '🍎' },
            { id: 'wechat', label: '微信', icon: '💬' },
          ].map(social => (
            <button key={social.id} type="button" onClick={() => setMessage('暂未开放')}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 16,
                background: C.card,
                border: '1px solid rgba(220,192,188,0.3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: C.text,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(156,66,51,0.25)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(156,66,51,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(220,192,188,0.3)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              <span style={{ fontSize: 16 }}>{social.icon}</span>
              <span>{social.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 底部便签卡片 ===== */}
      <div style={{
        marginTop: 16, position: 'relative', zIndex: 1,
        background: 'linear-gradient(135deg, rgba(252,249,242,0.90) 0%, rgba(255,245,240,0.85) 100%)',
        borderRadius: 20, padding: '16px 20px',
        border: '1px solid rgba(220,192,188,0.25)',
        boxShadow: '0 4px 16px rgba(156,66,51,0.05)',
        textAlign: 'center',
        transform: 'rotate(-0.3deg)',
      }}>
        {/* 便签图钉 */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, #f0c0b0, ${C.primary})`,
          position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }} />
        <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 14, color: C.brown, margin: '0 0 4px', fontWeight: 500, letterSpacing: '0.02em' }}>
          "我们一起记录生活的点滴"
        </p>
        <p style={{ fontSize: 12, color: '#8b7770', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          让回忆成为最美的礼物
        </p>
      </div>

      <style>{authCSS}</style>
    </div>
  )
}

// ====================== CREATE SPACE STEP ======================
function CreateSpaceStep({ onBack, onEnter }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(true) }, [])

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20, textAlign: 'center',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '4px 0' }}>← 返回</button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span style={{ fontSize: 64 }}>🏠</span>
        <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 28, color: C.brown, fontWeight: 600, margin: 0 }}>你们的小窝已就绪</h2>
        <p style={{ fontSize: 14, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', margin: 0, lineHeight: 1.6 }}>
          空间创建成功！<br />现在开始记录你们的第一个回忆吧。
        </p>
        <button onClick={onEnter} style={{ ...pillBtnStyle, width: '84%', marginTop: 8 }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(156,66,51,0.18)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
        >进入小窝 →</button>
      </div>
    </div>
  )
}

// ====================== SHARED STYLES ======================
const pillBtnStyle = {
  width: '86%', height: 58,
  background: C.primary, color: '#fff',
  border: 'none', borderRadius: 999,
  fontSize: 16, fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  letterSpacing: '0.08em',
  boxShadow: '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)',
  transition: 'transform 0.1s, box-shadow 0.1s',
  position: 'relative',
}

const textLinkStyle = {
  background: 'none', border: 'none',
  color: '#8b7770', cursor: 'pointer',
  fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif',
  padding: '14px 20px',
  transition: 'color 0.2s',
  letterSpacing: '0.03em',
}

const inputStyle = {
  width: '100%', padding: '14px 20px', borderRadius: 16,
  border: '1.5px solid rgba(220,192,188,0.5)',
  fontSize: 15, background: C.inputBg, color: C.brown,
  fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
}

function decorStyle(pos) {
  const base = {
    position: 'fixed', pointerEvents: 'none', zIndex: 0,
    mixBlendMode: 'multiply',
  }
  switch (pos) {
    case 'topLeft':
      return { ...base, top: 20, left: 8, width: 68, opacity: 0.50, transform: 'rotate(-8deg)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)', maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)' }
    case 'topRight':
      return { ...base, top: 24, right: 6, width: 54, opacity: 0.48, WebkitMaskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)', maskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)' }
    case 'left':
      return { ...base, left: -4, top: '26%', width: 54, opacity: 0.42, WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)', maskImage: 'linear-gradient(to right, black 50%, transparent 100%)' }
    case 'right':
      return { ...base, right: -4, top: '28%', width: 50, opacity: 0.42, WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)', maskImage: 'linear-gradient(to left, black 50%, transparent 100%)' }
    case 'bottom':
      return { ...base, bottom: 16, right: 12, width: 46, opacity: 0.48, WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)', maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)' }
  }
}

// ====================== ANIMATION CSS ======================
const animCSS = `
@keyframes heroFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes floatEl {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.50; }
  50% { transform: translateY(-10px) scale(1.12); opacity: 0.28; }
}
button:active { transform: scale(0.95) !important; }
input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(156,66,51,0.08); }
`

const modeCardCSS = `
@keyframes cardIn {
  0% { opacity: 0; transform: translateY(14px); }
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

const authCSS = `
@keyframes cardFloatIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
`
