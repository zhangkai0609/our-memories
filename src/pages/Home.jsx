import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { clearCache, getCached, setCached } from '../lib/cache'

const T = {
  bg: '#f1f5f5',
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

const themes = {
  pearl: {
    name: '珍珠白',
    swatch: '#dfeff3',
    background: `
      radial-gradient(circle at 16% 8%, rgba(255,255,255,0.92), transparent 30%),
      radial-gradient(circle at 86% 18%, rgba(184,217,224,0.42), transparent 28%),
      radial-gradient(circle at 50% 92%, rgba(255,219,211,0.34), transparent 32%),
      linear-gradient(180deg, #fbfbf8 0%, #f1f5f5 48%, #fff3ef 100%)
    `,
    header: 'rgba(251,251,248,0.68)',
  },
  rose: {
    name: '晨雾粉',
    swatch: '#f2d8d2',
    background: `
      radial-gradient(circle at 18% 10%, rgba(255,255,255,0.94), transparent 30%),
      radial-gradient(circle at 88% 18%, rgba(246,205,211,0.48), transparent 29%),
      radial-gradient(circle at 50% 92%, rgba(205,224,229,0.30), transparent 32%),
      linear-gradient(180deg, #fffafa 0%, #f8eeee 52%, #f0f7f8 100%)
    `,
    header: 'rgba(255,250,250,0.70)',
  },
  paper: {
    name: '奶油纸',
    swatch: '#efe5cf',
    background: `
      radial-gradient(circle at 14% 8%, rgba(255,255,255,0.92), transparent 30%),
      radial-gradient(circle at 86% 20%, rgba(214,231,232,0.36), transparent 28%),
      radial-gradient(circle at 46% 92%, rgba(238,210,171,0.36), transparent 32%),
      linear-gradient(180deg, #fffdf7 0%, #f3eee3 52%, #fff5ec 100%)
    `,
    header: 'rgba(255,253,247,0.72)',
  },
}

const navItems = [
  { id: 'home', label: '家', icon: '♡', to: '/' },
  { id: 'memory', label: '记忆', icon: '◆', to: '/gallery' },
  { id: 'map', label: '地图', icon: '⌖', to: '/map' },
]

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
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(false)
  const [now] = useState(() => Date.now())
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileEditing, setProfileEditing] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('home_theme') || 'pearl')
  const [profileDraft, setProfileDraft] = useState(() => ({
    myName: localStorage.getItem('my_name') || '小周同学',
    partnerName: localStorage.getItem('partner_name') || '另一半',
    myAvatar: localStorage.getItem('my_avatar') || '',
    partnerAvatar: localStorage.getItem('partner_avatar') || '',
  }))

  const currentTheme = themes[theme] || themes.pearl
  const myName = profileDraft.myName || '小周同学'
  const partnerName = profileDraft.partnerName || '另一半'
  const myAvatar = profileDraft.myAvatar
  const partnerAvatar = profileDraft.partnerAvatar

  const fetchData = useCallback(async () => {
    if (!roomCode) return
    setLoading(true)

    const cached = getCached('memories')
    if (cached?.length) setMemories(cached)

    try {
      const { data } = await supabase.from('memories')
        .select('id,title,content,location,author,room_code,coordinates,created_at,image_urls')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: false })
      const next = data || []
      if (next.length) {
        setMemories(next)
        setCached('memories', next)
      } else if (cached?.length) {
        setMemories(cached)
      }
    } catch {
      if (cached?.length) setMemories(cached)
    } finally {
      setLoading(false)
    }
  }, [roomCode])

  useEffect(() => {
    Promise.resolve().then(fetchData)
  }, [fetchData])

  function selectTheme(nextTheme) {
    setTheme(nextTheme)
    localStorage.setItem('home_theme', nextTheme)
  }

  function saveProfile() {
    localStorage.setItem('my_name', myName)
    localStorage.setItem('partner_name', partnerName)
    if (myAvatar) localStorage.setItem('my_avatar', myAvatar)
    if (partnerAvatar) localStorage.setItem('partner_avatar', partnerAvatar)
    setProfileEditing(false)
  }

  function readAvatar(file, key) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfileDraft(prev => ({ ...prev, [key]: reader.result || '' }))
    reader.readAsDataURL(file)
  }

  function syncHomeData() {
    fetchData()
  }

  function clearLocalDataCache() {
    clearCache()
    fetchData()
  }

  function exitRoom() {
    localStorage.removeItem('room_code')
    window.location.reload()
  }

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

  if (!roomCode) {
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
      background: currentTheme.background,
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
        <div style={{
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          margin: '0 -14px',
          padding: '0 14px 0',
          pointerEvents: 'none',
        }}>
          <button
            onClick={() => {
              setProfileOpen(true)
              setConfirmExit(false)
            }}
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
              pointerEvents: 'auto',
            }}
          >
            {myAvatar ? (
              <img src={myAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: T.primary, fontWeight: 800 }}>我</span>
            )}
          </button>
        </div>

        <main style={{ display: 'grid', gap: 14, paddingTop: 2 }}>
          <GlassPanel style={{ borderRadius: 30, padding: '18px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', alignItems: 'center' }}>
              {[
                ['♡', stats.memoryDays || '--', '记忆天数'],
                ['◆', stats.photoCount, '照片'],
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
                <span style={quickIconStyle}>◆</span>
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

      {profileOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}>
          <button
            aria-label="关闭资料面板"
            onClick={() => {
              setProfileOpen(false)
              setProfileEditing(false)
              setConfirmExit(false)
            }}
            style={{
              position: 'absolute',
              inset: 0,
              border: 'none',
              background: 'rgba(45,38,36,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              cursor: 'pointer',
            }}
          />
          <section style={{
            width: 'min(100%, 430px)',
            minHeight: '54dvh',
            maxHeight: '74dvh',
            overflowY: 'auto',
            position: 'relative',
            borderRadius: '34px 34px 0 0',
            border: '1px solid rgba(255,255,255,0.72)',
            borderBottom: 'none',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.82), rgba(255,255,255,0.38) 48%, rgba(213,235,240,0.32)), rgba(255,255,255,0.52)',
            backdropFilter: 'blur(34px) saturate(1.55)',
            WebkitBackdropFilter: 'blur(34px) saturate(1.55)',
            boxShadow: '0 -24px 70px rgba(104,45,38,0.22), inset 0 1px 0 rgba(255,255,255,0.78)',
            padding: '12px 18px calc(28px + env(safe-area-inset-bottom))',
          }}>
            <div style={{
              width: 44,
              height: 5,
              borderRadius: 999,
              background: 'rgba(143,52,40,0.24)',
              margin: '0 auto 16px',
            }} />

            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 66,
                height: 66,
                borderRadius: '50%',
                padding: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(219,238,242,0.58), rgba(255,211,202,0.58))',
                boxShadow: '0 14px 32px rgba(104,45,38,0.18)',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  color: T.primary,
                  fontWeight: 900,
                  background: 'rgba(255,255,255,0.58)',
                }}>
                  {myAvatar ? <img src={myAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myName.slice(0, 1)}
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, color: T.primary, fontFamily: T.fontTitle, fontSize: 26, lineHeight: '30px', fontWeight: 760 }}>
                  {myName}
                </p>
                <p style={{ margin: '4px 0 0', color: T.muted, fontSize: 12, fontWeight: 750 }}>
                  小屋 {roomCode}
                </p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false)
                  setProfileEditing(false)
                }}
                aria-label="关闭"
                style={roundIconButtonStyle}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
              {[
                ['记忆', memories.length || '--'],
                ['照片', stats.photoCount],
                ['足迹', stats.locationCount],
              ].map(([label, value]) => (
                <div key={label} style={{
                  minHeight: 62,
                  borderRadius: 22,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(255,255,255,0.42)',
                  border: '1px solid rgba(255,255,255,0.66)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
                }}>
                  <span style={{ color: T.primary, fontFamily: T.fontTitle, fontSize: 24, lineHeight: '24px', fontWeight: 760 }}>{value}</span>
                  <span style={{ color: T.muted, fontSize: 11, fontWeight: 800 }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={sheetTitleStyle}>背景</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {Object.entries(themes).map(([key, item]) => (
                  <button key={key} onClick={() => selectTheme(key)} style={themeChoiceStyle(theme === key)}>
                    <span style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: item.swatch,
                      border: '2px solid rgba(255,255,255,0.92)',
                      boxShadow: '0 8px 18px rgba(104,45,38,0.10)',
                    }} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {profileEditing ? (
              <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                <p style={sheetTitleStyle}>编辑信息</p>
                <label style={fieldLabelStyle}>
                  我的昵称
                  <input value={myName} onChange={event => setProfileDraft(prev => ({ ...prev, myName: event.target.value }))} style={inputStyle} />
                </label>
                <label style={fieldLabelStyle}>
                  对方昵称
                  <input value={partnerName} onChange={event => setProfileDraft(prev => ({ ...prev, partnerName: event.target.value }))} style={inputStyle} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label style={uploadButtonStyle}>
                    我的头像
                    <input type="file" accept="image/*" onChange={event => readAvatar(event.target.files?.[0], 'myAvatar')} style={{ display: 'none' }} />
                  </label>
                  <label style={uploadButtonStyle}>
                    对方头像
                    <input type="file" accept="image/*" onChange={event => readAvatar(event.target.files?.[0], 'partnerAvatar')} style={{ display: 'none' }} />
                  </label>
                </div>
                <button onClick={saveProfile} style={primaryActionStyle}>保存信息</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                <button onClick={() => setProfileEditing(true)} style={sheetButtonStyle}>编辑资料</button>
                <button onClick={syncHomeData} style={sheetButtonStyle}>{loading ? '同步中' : '同步数据'}</button>
                <button onClick={() => navigator.clipboard?.writeText(roomCode)} style={sheetButtonStyle}>复制小屋码</button>
                <button onClick={clearLocalDataCache} style={sheetButtonStyle}>清理缓存</button>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              {confirmExit ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  padding: 10,
                  borderRadius: 22,
                  background: 'rgba(255,255,255,0.36)',
                  border: '1px solid rgba(255,255,255,0.62)',
                }}>
                  <button onClick={() => setConfirmExit(false)} style={sheetButtonStyle}>先留下</button>
                  <button onClick={exitRoom} style={dangerActionStyle}>确认退出</button>
                </div>
              ) : (
                <button onClick={() => setConfirmExit(true)} style={dangerGhostStyle}>退出小屋</button>
              )}
            </div>
          </section>
        </div>
      )}

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

const sheetTitleStyle = {
  margin: '0 0 8px',
  color: T.primary,
  fontSize: 13,
  fontWeight: 900,
}

const roundIconButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.70)',
  background: 'rgba(255,255,255,0.46)',
  color: T.primary,
  fontSize: 24,
  lineHeight: '28px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
  cursor: 'pointer',
}

const sheetButtonStyle = {
  minHeight: 48,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.68)',
  background: 'rgba(255,255,255,0.42)',
  color: T.ink,
  fontFamily: T.fontBody,
  fontSize: 13,
  fontWeight: 850,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
  cursor: 'pointer',
}

const primaryActionStyle = {
  ...sheetButtonStyle,
  color: '#fff',
  background: 'linear-gradient(135deg, #9c4233, #c95f4f)',
  border: '1px solid rgba(255,255,255,0.72)',
  boxShadow: '0 14px 30px rgba(156,66,51,0.24), inset 0 1px 0 rgba(255,255,255,0.30)',
}

const dangerActionStyle = {
  ...sheetButtonStyle,
  color: '#fff',
  background: 'linear-gradient(135deg, #8f3428, #b94d3f)',
}

const dangerGhostStyle = {
  width: '100%',
  minHeight: 48,
  borderRadius: 18,
  border: '1px solid rgba(143,52,40,0.22)',
  background: 'rgba(255,255,255,0.30)',
  color: T.primary,
  fontFamily: T.fontBody,
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
}

const fieldLabelStyle = {
  display: 'grid',
  gap: 6,
  color: T.muted,
  fontSize: 12,
  fontWeight: 850,
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  height: 44,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.72)',
  outline: 'none',
  background: 'rgba(255,255,255,0.50)',
  color: T.ink,
  padding: '0 12px',
  fontFamily: T.fontBody,
  fontSize: 14,
  fontWeight: 750,
}

const uploadButtonStyle = {
  ...sheetButtonStyle,
  display: 'grid',
  placeItems: 'center',
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

function themeChoiceStyle(active) {
  return {
    minHeight: 58,
    borderRadius: 20,
    border: active ? '1px solid rgba(143,52,40,0.34)' : '1px solid rgba(255,255,255,0.66)',
    background: active ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.34)',
    color: active ? T.primary : T.muted,
    display: 'grid',
    gridTemplateColumns: '30px 1fr',
    alignItems: 'center',
    gap: 7,
    padding: '0 9px',
    fontFamily: T.fontBody,
    fontSize: 12,
    fontWeight: 900,
    boxShadow: active ? '0 10px 24px rgba(104,45,38,0.12), inset 0 1px 0 rgba(255,255,255,0.82)' : 'inset 0 1px 0 rgba(255,255,255,0.68)',
    cursor: 'pointer',
  }
}
