import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const T = {
  bg: '#fff2f2',
  ink: '#2f1d1a',
  muted: '#7d6460',
  primary: '#8f3428',
  primarySoft: '#ffd8d1',
  green: '#5b704f',
  white: '#fffaf8',
  glass: 'rgba(255,255,255,0.46)',
  glassStrong: 'rgba(255,255,255,0.68)',
  border: 'rgba(255,255,255,0.58)',
  borderWarm: 'rgba(214,154,145,0.36)',
  shadow: '0 24px 70px rgba(104,45,38,0.16)',
  softShadow: '0 14px 38px rgba(104,45,38,0.10)',
  fontTitle: '"EB Garamond", "Noto Serif SC", serif',
  fontBody: '"Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
}

const navItems = [
  { id: 'home', label: '家', icon: '⌂', to: '/' },
  { id: 'memory', label: '记忆', icon: '◫', to: '/gallery' },
  { id: 'map', label: '地图', icon: '⌖', to: '/map' },
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function withTimeout(promise, ms = 4000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

function formatDate(dateLike) {
  if (!dateLike) return '今天'
  return new Date(dateLike).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function getDayKey(dateLike) {
  const d = new Date(dateLike)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function GlassPanel({ children, style }) {
  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${T.border}`,
      background: `linear-gradient(145deg, rgba(255,255,255,0.76), rgba(255,255,255,0.30) 48%, rgba(255,218,210,0.28)), ${T.glass}`,
      backdropFilter: 'blur(24px) saturate(1.35)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.35)',
      boxShadow: T.shadow,
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        inset: -80,
        background: 'radial-gradient(circle at 18% 14%, rgba(255,255,255,0.82), transparent 18%), radial-gradient(circle at 78% 18%, rgba(255,183,173,0.38), transparent 20%), radial-gradient(circle at 56% 88%, rgba(255,236,190,0.34), transparent 22%)',
        filter: 'blur(22px)',
        opacity: 0.82,
        pointerEvents: 'none',
        animation: 'liquidFlow 9s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(120deg, rgba(255,255,255,0.65), transparent 28% 70%, rgba(255,255,255,0.22))',
        opacity: 0.38,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </section>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const roomCode = localStorage.getItem('room_code')
  const cacheKey = roomCode ? `memories_cache_v1_${roomCode}` : null
  const [memories, setMemories] = useState(() => cacheKey ? readJson(cacheKey, []) : [])
  const [loading, setLoading] = useState(() => cacheKey ? readJson(cacheKey, []).length === 0 : true)
  const [now] = useState(() => Date.now())

  const fetchMemories = useCallback(async () => {
    if (!roomCode) {
      setLoading(false)
      return
    }

    try {
      const cached = cacheKey ? readJson(cacheKey, []) : []
      if (cached.length) {
        setMemories(cached)
        setLoading(false)
      }

      const { data } = await withTimeout(
        supabase
          .from('memories')
          .select('*')
          .eq('room_code', roomCode)
          .order('created_at', { ascending: false })
      )

      const next = data || []
      setMemories(next)
      if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(next))
    } catch {
      if (!memories.length) setLoading(false)
    } finally {
      setLoading(false)
    }
  }, [cacheKey, memories.length, roomCode])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMemories()
  }, [fetchMemories])

  const myName = localStorage.getItem('my_name') || '小周同学'
  const partnerName = localStorage.getItem('partner_name') || '另一半'
  const myAvatar = localStorage.getItem('my_avatar')
  const partnerAvatar = localStorage.getItem('partner_avatar')

  const stats = useMemo(() => {
    const dated = memories.filter(m => m.created_at)
    const first = dated.length ? new Date(dated[dated.length - 1].created_at) : null
    const memoryDays = first ? Math.floor((now - first.getTime()) / 86400000) + 1 : 0
    const photoCount = memories.reduce((sum, m) => sum + (m.image_urls?.length || 0), 0)
    const locationCount = new Set(memories.map(m => m.location).filter(Boolean)).size
    const activeDays = new Set(dated.map(m => getDayKey(m.created_at))).size

    return { memoryDays, photoCount, locationCount, activeDays }
  }, [memories, now])

  const recentMemories = useMemo(() => (
    memories.length ? memories.slice(0, 4) : [
      { id: 'demo-1', title: '第一张回忆', content: '写下今天的小事，让它慢慢变成你们的小宇宙。', created_at: now, image_urls: [] },
      { id: 'demo-2', title: '去过的地方', content: '每一个地点，都可以在地图里重新亮起来。', created_at: now - 86400000, image_urls: [] },
    ]
  ), [memories, now])

  if (!localStorage.getItem('room_code')) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: T.bg,
        color: T.muted,
        fontFamily: T.fontBody,
      }}>
        请先输入小屋代号
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: `
        radial-gradient(circle at 18% 8%, rgba(255,183,173,0.62), transparent 28%),
        radial-gradient(circle at 88% 18%, rgba(255,235,196,0.52), transparent 26%),
        radial-gradient(circle at 50% 92%, rgba(189,210,174,0.32), transparent 30%),
        linear-gradient(180deg, #fff7f4 0%, ${T.bg} 48%, #fff8f1 100%)
      `,
      color: T.ink,
      fontFamily: T.fontBody,
      paddingBottom: 'calc(104px + env(safe-area-inset-bottom))',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', padding: '0 14px', position: 'relative', zIndex: 1 }}>
        <header style={{
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          margin: '0 -14px',
          padding: '0 14px',
          background: 'rgba(255,246,244,0.62)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.34)',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: T.muted, fontWeight: 700, letterSpacing: 0 }}>Today</p>
            <h1 style={{
              margin: 0,
              fontFamily: T.fontTitle,
              fontSize: 26,
              lineHeight: '30px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: T.primary,
              letterSpacing: 0,
            }}>
              Our Memories
            </h1>
          </div>
          <button
            onClick={() => navigate('/my')}
            aria-label="打开资料"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.86)',
              background: 'rgba(255,255,255,0.52)',
              padding: 0,
              overflow: 'hidden',
              boxShadow: T.softShadow,
              cursor: 'pointer',
            }}
          >
            {myAvatar ? (
              <img src={myAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: T.primary, fontWeight: 800 }}>我</span>
            )}
          </button>
        </header>

        <main style={{ display: 'grid', gap: 14, paddingTop: 14 }}>
          <GlassPanel style={{ borderRadius: 30, padding: '18px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', alignItems: 'center' }}>
              {[
                ['♡', stats.memoryDays || '--', '记忆天数'],
                ['◫', stats.photoCount, '照片'],
                ['⌖', stats.locationCount, '足迹'],
              ].map(([icon, value, label], index) => (
                <div key={label} style={{
                  minWidth: 0,
                  textAlign: 'center',
                  padding: '2px 8px',
                  borderLeft: index ? '1px solid rgba(143,52,40,0.12)' : 'none',
                }}>
                  <div style={{ color: T.primary, fontSize: 18, lineHeight: '20px', marginBottom: 4 }}>{icon}</div>
                  <div style={{ color: T.primary, fontFamily: T.fontTitle, fontSize: 30, lineHeight: '32px', fontWeight: 760 }}>
                    {loading && label === '照片' ? '--' : value}
                  </div>
                  <div style={{ color: T.muted, fontSize: 11, lineHeight: '16px', fontWeight: 750 }}>{label}</div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <div>
            <p style={{ margin: '2px 2px 8px', color: T.primary, fontFamily: T.fontTitle, fontSize: 22, lineHeight: '26px', fontWeight: 700 }}>
              Today
            </p>
            <GlassPanel style={{ borderRadius: 24, padding: 16, boxShadow: T.softShadow }}>
              <button
                onClick={() => navigate('/new')}
                style={{
                  width: '100%',
                  minHeight: 64,
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr',
                  alignItems: 'center',
                  gap: 12,
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  color: T.ink,
                  cursor: 'pointer',
                  fontFamily: T.fontBody,
                }}
              >
                <span style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#c95f4f',
                  background: 'rgba(255,255,255,0.52)',
                  border: `1px solid ${T.border}`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75), 0 8px 22px rgba(104,45,38,0.10)',
                  fontSize: 22,
                }}>
                  ♥
                </span>
                <span style={{ textAlign: 'center', color: T.ink, fontFamily: T.fontTitle, fontSize: 18, lineHeight: '24px', fontWeight: 600 }}>
                  Every day with you<br />is my favorite.
                </span>
              </button>
            </GlassPanel>
          </div>

          <GlassPanel style={{ display: 'none', borderRadius: 26, padding: 18 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: '0 0 6px', color: T.muted, fontSize: 13, fontWeight: 650 }}>欢迎回家，{myName}</p>
                <h2 style={{
                  margin: 0,
                  color: T.ink,
                  fontFamily: T.fontTitle,
                  fontSize: 32,
                  lineHeight: '36px',
                  fontWeight: 760,
                  letterSpacing: 0,
                }}>
                  把今天收藏起来
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
                {[myAvatar, partnerAvatar].map((avatar, index) => (
                  <div key={index} style={{
                    width: 48,
                    height: 48,
                    marginLeft: index ? -12 : 0,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: index ? '#f8ded8' : '#ffe7e1',
                    border: '3px solid rgba(255,255,255,0.88)',
                    boxShadow: '0 8px 22px rgba(104,45,38,0.16)',
                    display: 'grid',
                    placeItems: 'center',
                    color: T.primary,
                    fontWeight: 800,
                  }}>
                    {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (index ? partnerName.slice(0, 1) : myName.slice(0, 1))}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
              {[
                ['记忆天数', stats.memoryDays || '--'],
                ['回忆总数', loading ? '--' : memories.length],
                ['照片', stats.photoCount],
                ['足迹', stats.locationCount],
              ].map(([label, value]) => (
                <div key={label} style={{
                  borderRadius: 18,
                  padding: '12px 12px 10px',
                  background: 'rgba(255,255,255,0.46)',
                  border: `1px solid ${T.border}`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
                }}>
                  <div style={{ color: T.primary, fontFamily: T.fontTitle, fontSize: 28, lineHeight: '30px', fontWeight: 760 }}>{value}</div>
                  <div style={{ color: T.muted, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/new')}
              style={{
                width: '100%',
                height: 52,
                marginTop: 16,
                border: '1px solid rgba(255,255,255,0.60)',
                borderRadius: 999,
                color: '#fff',
                fontFamily: T.fontBody,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 0,
                background: 'linear-gradient(135deg, #9c4233, #c95f4f)',
                boxShadow: '0 16px 34px rgba(156,66,51,0.28), inset 0 1px 0 rgba(255,255,255,0.36)',
                cursor: 'pointer',
              }}
            >
              写一条记忆
            </button>
          </GlassPanel>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 2px 12px' }}>
              <h3 style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 24, lineHeight: '28px', color: T.ink, fontWeight: 700 }}>最近记忆</h3>
              <button onClick={() => navigate('/gallery')} style={{
                border: 'none',
                background: 'transparent',
                color: T.primary,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}>
                查看全部
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, paddingBottom: 16 }}>
              {recentMemories.map((memory, index) => (
                <article
                  key={memory.id}
                  onClick={() => memory.id.toString().startsWith('demo') ? navigate('/new') : navigate(`/diary/${memory.id}`)}
                  style={{
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.84)',
                    padding: '7px 7px 18px',
                    boxShadow: T.softShadow,
                    transform: `rotate(${index % 2 ? 1 : -1}deg)`,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.8)',
                  }}
                >
                  <div style={{
                    width: '100%',
                    aspectRatio: '1.22 / 1',
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #ffe3dd, #fff2d8)',
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                    color: T.primary,
                    fontSize: 24,
                    fontWeight: 800,
                  }}>
                    {memory.image_urls?.[0] ? (
                      <img src={memory.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>MEM</span>
                    )}
                  </div>
                  <h4 style={{
                    margin: '12px 4px 4px',
                    color: T.ink,
                    fontFamily: T.fontTitle,
                    fontSize: 18,
                    lineHeight: '22px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {memory.title || '未命名记忆'}
                  </h4>
                  <p style={{
                    margin: '0 4px',
                    color: T.muted,
                    fontSize: 12,
                    lineHeight: '18px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {memory.content || formatDate(memory.created_at)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <GlassPanel style={{ borderRadius: 22, padding: 14, boxShadow: T.softShadow }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => navigate('/gallery')} style={quickButtonStyle('#fff1ed')}>
                <span style={quickIconStyle}>◫</span>
                <span>记忆本</span>
              </button>
              <button onClick={() => navigate('/map')} style={quickButtonStyle('#f2f8ed')}>
                <span style={quickIconStyle}>⌖</span>
                <span>足迹地图</span>
              </button>
            </div>
          </GlassPanel>
        </main>
      </div>

      <nav style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(34px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 44px), 356px)',
        height: 58,
        zIndex: 50,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        padding: 5,
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: 'rgba(255,255,255,0.48)',
        backdropFilter: 'blur(28px) saturate(1.45)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.45)',
        boxShadow: '0 18px 48px rgba(104,45,38,0.18), inset 0 1px 0 rgba(255,255,255,0.70)',
      }}>
        {navItems.map(item => {
          const active = item.id === 'home'
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.to)}
              style={{
                border: 'none',
                borderRadius: 999,
                background: 'transparent',
                color: active ? T.primary : T.muted,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                fontFamily: T.fontBody,
                fontSize: 12,
                fontWeight: 800,
                boxShadow: 'none',
              }}
            >
              <span style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
                lineHeight: '22px',
                background: active ? 'rgba(156,66,51,0.10)' : 'rgba(255,255,255,0.18)',
                boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.56)' : 'none',
              }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <style>{`
        @keyframes liquidFlow {
          from { transform: translate3d(-3%, -2%, 0) rotate(0deg) scale(1); }
          to { transform: translate3d(4%, 3%, 0) rotate(14deg) scale(1.06); }
        }
        button { -webkit-tap-highlight-color: transparent; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  )
}

const quickIconStyle = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.72)',
  display: 'grid',
  placeItems: 'center',
  color: T.primary,
  fontSize: 18,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.74)',
}

function quickButtonStyle(background) {
  return {
    minHeight: 76,
    border: `1px solid ${T.border}`,
    borderRadius: 20,
    background,
    color: T.ink,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontFamily: T.fontBody,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
  }
}
