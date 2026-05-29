import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import welcomeHero from '../assets/onboarding/welcome-hero.webp'
import couplePets from '../assets/onboarding/modes/icons/couple-pets.webp'
import friendsCamera from '../assets/onboarding/modes/icons/friends-camera.webp'
import bestiesBow from '../assets/onboarding/modes/icons/besties-bow.webp'
import familyHouse from '../assets/onboarding/modes/icons/family-house.webp'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#e87c69', pFixed: '#ffdad4',
  secondary: '#536346', brown: '#3f302b', text: '#56423f', light: '#8b7770',
  border: '#dcc0bc', card: '#fcf9f2', tagBg: '#f7e4dc',
}

const modes = [
  { id: 'couple', title: '情侣', subtitle: 'Couple', desc: '一起记录甜蜜时光', image: couplePets },
  { id: 'friends', title: '好友', subtitle: 'Friends', desc: '记录友情的点滴与快乐', image: friendsCamera },
  { id: 'besties', title: '闺蜜', subtitle: 'Besties', desc: '专属珍藏的小秘密', image: bestiesBow },
  { id: 'family', title: '家人', subtitle: 'Family', desc: '记录家的温暖与爱', image: familyHouse },
]

const DECOR = [
  { emoji: '✨', x: 6, y: 14, size: 14, delay: 0, dur: 3.8 },
  { emoji: '💫', x: 90, y: 10, size: 13, delay: 1.2, dur: 4.0 },
  { emoji: '🌸', x: 5, y: 45, size: 16, delay: 2.0, dur: 4.2 },
  { emoji: '♥', x: 93, y: 48, size: 13, delay: 0.6, dur: 3.6 },
  { emoji: '⭐', x: 10, y: 78, size: 15, delay: 1.8, dur: 3.9 },
  { emoji: '🎀', x: 88, y: 76, size: 14, delay: 2.4, dur: 4.1 },
]

export default function Welcome() {
  const [step, setStep] = useState('code')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState('couple')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const existing = localStorage.getItem('room_code')
    const hasProfile = localStorage.getItem('my_name')
    if (existing && hasProfile) navigate('/')
  }, [])

  async function handleCodeSubmit(e) {
    e.preventDefault()
    const code = roomCode.trim().toLowerCase()
    if (!code || code.length < 2) return
    localStorage.setItem('room_code', code)

    // 检查是否已有数据（老用户直接进，补上默认 profile）
    const { data } = await supabase.from('memories').select('id').eq('room_code', code).limit(1)
    if (data && data.length > 0) {
      if (!localStorage.getItem('my_name')) localStorage.setItem('my_name', '小周同学')
      if (!localStorage.getItem('partner_name')) localStorage.setItem('partner_name', '另一半')
      if (!localStorage.getItem('room_mode')) localStorage.setItem('room_mode', 'couple')
      navigate('/')
    } else {
      setStep('mode')
    }
  }

  function handleModeConfirm() {
    localStorage.setItem('room_mode', mode)
    setStep('profile')
  }

  function handleProfileDone(myName, partnerName, myAvatar, partnerAvatar) {
    localStorage.setItem('my_name', myName || '我')
    localStorage.setItem('partner_name', partnerName || '另一半')
    if (myAvatar) localStorage.setItem('my_avatar', myAvatar)
    if (partnerAvatar) localStorage.setItem('partner_avatar', partnerAvatar)
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100svh', background: C.bg,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px 16px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
      {DECOR.map((el, i) => (
        <span key={i} style={{ position: 'fixed', left: `${el.x}%`, top: `${el.y}%`, fontSize: el.size, pointerEvents: 'none', zIndex: 0, opacity: 0.50,
          animation: `floatEl ${el.dur}s ease-in-out ${el.delay}s infinite` }}>{el.emoji}</span>
      ))}

      <div style={{ width: '100%', maxWidth: 430, position: 'relative', zIndex: 1 }}>
        {step === 'code' && <CodeStep roomCode={roomCode} setRoomCode={setRoomCode} onSubmit={handleCodeSubmit} loading={loading} setLoading={setLoading} />}
        {step === 'mode' && <ModeStep mode={mode} setMode={setMode} onConfirm={handleModeConfirm} onBack={() => setStep('code')} />}
        {step === 'profile' && <ProfileStep onDone={handleProfileDone} onBack={() => setStep('mode')} />}
      </div>
      <style>{animCSS}</style>
    </div>
  )
}

// ==================== STEP 1: 小屋代号 ====================
function CodeStep({ roomCode, setRoomCode, onSubmit, loading, setLoading }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '88%', maxWidth: 360, margin: '0 auto 20px', borderRadius: 28, overflow: 'hidden',
        animation: 'heroFloat 4.8s ease-in-out infinite',
        boxShadow: '0 2px 30px rgba(156,66,51,0.06)' }}>
        <img src={welcomeHero} alt="" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, background: `linear-gradient(to bottom, ${C.bg}, transparent)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: `linear-gradient(to top, ${C.bg}, transparent)`, pointerEvents: 'none' }} />
      </div>

      <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(28px, 9vw, 40px)', color: C.primary, fontWeight: 600, margin: '0 0 6px' }}>Our Memories</h1>
      <p style={{ fontSize: 14, color: C.light, margin: '0 0 28px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>创建或输入小屋代号，进入回忆空间</p>

      <form onSubmit={e => { e.preventDefault(); onSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 20, zIndex: 1 }}>🏠</span>
          <input type="text" placeholder="小屋代号" value={roomCode} onChange={e => setRoomCode(e.target.value)} autoFocus maxLength={30}
            style={{ width: '100%', padding: '16px 20px 16px 48px', borderRadius: 20, border: `2px solid ${C.border}`, fontSize: 18, background: C.card, color: C.brown, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', textAlign: 'center', letterSpacing: '0.05em' }}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </div>
        <button type="submit" disabled={loading}
          style={{ width: '86%', maxWidth: 300, height: 54, background: C.primary, color: '#fff', border: 'none', borderRadius: 999, fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.06em', boxShadow: '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)', opacity: loading ? 0.7 : 1 }}>
          {loading ? '进入中...' : '进 入 小 屋'}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 12, color: '#b0a09b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>输入已有的小屋代号，直接进入你们的回忆 ✨</p>
    </div>
  )
}

// ==================== STEP 2: 选择模式 ====================
function ModeStep({ mode, setMode, onConfirm, onBack }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 8 }}>
      <button onClick={onBack} style={{ position: 'absolute', left: 4, top: 4, background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>← 返回</button>
      <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(26px, 8vw, 32px)', color: C.brown, fontWeight: 600, margin: '0 0 4px' }}>选择关系模式</h2>
      <p style={{ fontSize: 13, color: C.light, margin: '0 0 18px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>每一种关系，都值得被认真收藏</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, height: 160, padding: '14px 10px', borderRadius: 24,
              border: mode === m.id ? `2px solid ${C.primary}` : '1px solid rgba(156,66,51,0.12)',
              background: mode === m.id ? 'linear-gradient(180deg, rgba(255,245,243,0.98), rgba(252,249,242,0.96))' : 'linear-gradient(180deg, rgba(252,249,242,0.96), rgba(250,244,232,0.92))',
              cursor: 'pointer', textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: mode === m.id ? '0 10px 24px rgba(156,66,51,0.18)' : '0 4px 16px rgba(90,55,45,0.05)',
              transition: 'all 0.3s', position: 'relative',
            }}>
            {mode === m.id && <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, boxShadow: '0 2px 6px rgba(156,66,51,0.25)' }}>✓</span>}
            <div style={{ width: '100%', height: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <img src={m.image} alt={m.title} style={{ maxWidth: 110, maxHeight: 55, objectFit: 'contain', pointerEvents: 'none' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.brown, fontFamily: 'EB Garamond, serif' }}>{m.title}</div>
            <div style={{ fontSize: 10, color: C.light, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{m.subtitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><span style={{ width: 12, height: 1, background: 'rgba(220,192,188,0.35)' }} /><span style={{ fontSize: 6, color: C.pLight }}>♥</span><span style={{ width: 12, height: 1, background: 'rgba(220,192,188,0.35)' }} /></div>
            <div style={{ fontSize: 11, color: '#6f5c55', marginTop: 2 }}>{m.desc}</div>
          </button>
        ))}
      </div>
      <button onClick={onConfirm}
        style={{ width: '84%', height: 52, marginTop: 20, background: C.primary, color: '#fff', border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.06em', boxShadow: '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
        继 续
      </button>
    </div>
  )
}

// ==================== STEP 3: 设置头像和名称 ====================
function ProfileStep({ onDone, onBack }) {
  const [myName, setMyName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [myAvatar, setMyAvatar] = useState(null)
  const [partnerAvatar, setPartnerAvatar] = useState(null)
  const fileRef = useRef(null)
  const partnerFileRef = useRef(null)

  function handleMyFile(e) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setMyAvatar(reader.result)
    reader.readAsDataURL(f)
  }

  function handlePartnerFile(e) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setPartnerAvatar(reader.result)
    reader.readAsDataURL(f)
  }

  return (
    <div style={{ textAlign: 'center', paddingTop: 8 }}>
      <button onClick={onBack} style={{ position: 'absolute', left: 4, top: 4, background: 'none', border: 'none', color: C.light, cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>← 返回</button>
      <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(26px, 8vw, 32px)', color: C.brown, fontWeight: 600, margin: '0 0 4px' }}>设置你们的头像</h2>
      <p style={{ fontSize: 13, color: C.light, margin: '0 0 24px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>让小屋更有你们的感觉</p>

      {/* 两个头像区域 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        {/* 我的头像 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button onClick={() => fileRef.current.click()}
            style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(156,66,51,0.25)', boxShadow: '0 3px 14px rgba(156,66,51,0.10)', cursor: 'pointer', background: '#fce4e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative' }}>
            {myAvatar ? <img src={myAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: C.primary, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>✎</div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleMyFile} style={{ display: 'none' }} />
          <input type="text" placeholder="你的名字" value={myName} onChange={e => setMyName(e.target.value)} maxLength={10}
            style={{ width: 100, padding: '8px 12px', borderRadius: 14, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.card, color: C.brown, textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }} />
        </div>

        <span style={{ fontSize: 22, color: C.primary }}>♥</span>

        {/* 伴侣头像 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button onClick={() => partnerFileRef.current.click()}
            style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(156,66,51,0.25)', boxShadow: '0 3px 14px rgba(156,66,51,0.10)', cursor: 'pointer', background: '#fce4e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative' }}>
            {partnerAvatar ? <img src={partnerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: C.primary, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>✎</div>
          </button>
          <input ref={partnerFileRef} type="file" accept="image/*" onChange={handlePartnerFile} style={{ display: 'none' }} />
          <input type="text" placeholder="ta 的名字" value={partnerName} onChange={e => setPartnerName(e.target.value)} maxLength={10}
            style={{ width: 100, padding: '8px 12px', borderRadius: 14, border: `1.5px solid ${C.border}`, fontSize: 14, background: C.card, color: C.brown, textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }} />
        </div>
      </div>

      <button onClick={() => onDone(myName, partnerName, myAvatar, partnerAvatar)}
        style={{ width: '84%', height: 52, marginTop: 8, background: C.primary, color: '#fff', border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.06em', boxShadow: '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
        开 始 记 录
      </button>
    </div>
  )
}

const animCSS = `
@keyframes heroFloat { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
@keyframes floatEl { 0%,100%{transform:translateY(0)scale(1);opacity:0.5}50%{transform:translateY(-10px)scale(1.12);opacity:0.28} }
button:active{transform:scale(.95)!important}
`
