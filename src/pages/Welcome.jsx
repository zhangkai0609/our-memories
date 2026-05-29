import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import welcomeHero from '../assets/onboarding/welcome-hero.webp'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#e87c69',
  brown: '#3f302b', text: '#56423f', light: '#8b7770',
  border: '#dcc0bc', card: '#fcf9f2',
}

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
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const existing = localStorage.getItem('room_code')
    if (existing) navigate('/')
  }, [])

  async function handleEnter(e) {
    e.preventDefault()
    const trimmed = code.trim().toLowerCase()
    if (!trimmed) { setMessage('请输入小屋代号'); return }
    if (trimmed.length < 2) { setMessage('小屋代号至少2个字符'); return }
    setLoading(true)
    setMessage('')

    // 直接存储代号，不需要登录
    localStorage.setItem('room_code', trimmed)
    // 延迟一下让用户看到进入的动画
    setTimeout(() => navigate('/'), 300)
  }

  return (
    <div style={{
      minHeight: '100svh', background: C.bg,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px 16px', overflow: 'hidden', position: 'relative',
    }}>
      {/* 背景 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 0,
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,200,190,0.30) 0%, transparent 70%)',
        top: '18%', left: '50%', transform: 'translateX(-50%)',
      }} />
      {DECOR.map((el, i) => (
        <span key={i} style={{
          position: 'fixed', left: `${el.x}%`, top: `${el.y}%`,
          fontSize: el.size, pointerEvents: 'none', zIndex: 0, opacity: 0.50,
          animation: `floatEl ${el.dur}s ease-in-out ${el.delay}s infinite`,
        }}>{el.emoji}</span>
      ))}

      <div style={{ width: '100%', maxWidth: 430, textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* 主视觉 */}
        <div style={{ position: 'relative', width: '100%', marginBottom: 24 }}>
          <div style={{
            position: 'relative', width: '88%', maxWidth: 380, margin: '0 auto',
            borderRadius: 28, overflow: 'hidden',
            animation: 'heroFloat 4.8s ease-in-out infinite',
            boxShadow: '0 2px 30px rgba(156,66,51,0.06)',
          }}>
            <img src={welcomeHero} alt="" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to bottom, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(to top, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 20, background: `linear-gradient(to right, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 20, background: `linear-gradient(to left, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none' }} />
          </div>
        </div>

        {/* 标题 */}
        <h1 style={{
          fontFamily: 'EB Garamond, serif', fontSize: 'clamp(32px, 10vw, 44px)',
          color: C.primary, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em',
        }}>Our Memories</h1>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: C.light, margin: '0 0 32px', lineHeight: 1.7 }}>
          输入小屋代号，进入你们的回忆空间
        </p>

        {/* 小屋代号输入 */}
        <form onSubmit={handleEnter} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: 320,
          }}>
            <span style={{
              position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
              fontSize: 20, zIndex: 1,
            }}>🏠</span>
            <input
              type="text"
              placeholder="小屋代号"
              value={code}
              onChange={e => { setCode(e.target.value); setMessage(''); }}
              autoFocus
              maxLength={30}
              style={{
                width: '100%', padding: '16px 20px 16px 50px',
                borderRadius: 20, border: `2px solid ${C.border}`,
                fontSize: 18, background: C.card, color: C.brown,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                outline: 'none', textAlign: 'center',
                letterSpacing: '0.05em',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {message && (
            <p style={{ fontSize: 13, color: C.primary, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: '86%', maxWidth: 320, height: 54,
              background: C.primary, color: '#fff', border: 'none',
              borderRadius: 999, fontSize: 17, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              letterSpacing: '0.06em',
              boxShadow: '0 16px 32px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.18)',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? '进入中...' : '进 入 小 屋'}
          </button>
        </form>

        <p style={{ marginTop: 28, fontSize: 12, color: '#b0a09b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          和 ta 共享同一个小屋代号，就能看到彼此的回忆 ✨
        </p>
      </div>

      <style>{animCSS}</style>
    </div>
  )
}

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
`
