import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const T = {
  bg: '#fff3f1',
  paper: '#fffaf2',
  ink: '#2f211d',
  muted: '#7c6761',
  primary: '#8f3428',
  coral: '#c95f4f',
  sage: '#5f7453',
  blue: '#9bc9d2',
  glass: 'rgba(255,255,255,0.52)',
  border: 'rgba(255,255,255,0.62)',
  warmBorder: 'rgba(180,118,108,0.20)',
  shadow: '0 20px 58px rgba(102,55,45,0.16)',
  softShadow: '0 10px 28px rgba(102,55,45,0.10)',
  titleFont: '"EB Garamond", "Noto Serif SC", serif',
  bodyFont: '"Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
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

function formatDate(dateLike) {
  if (!dateLike) return 'Today'
  return new Date(dateLike).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function normalizeRecord(memory) {
  return {
    id: String(memory.id),
    title: memory.title || '未命名记忆',
    content: memory.content || '这一天也值得被好好收藏。',
    author: memory.author || null,
    location: memory.location || '',
    date: formatDate(memory.created_at),
    images: Array.isArray(memory.image_urls) ? memory.image_urls : [],
    tags: Array.isArray(memory.tags) ? memory.tags : [],
  }
}

function GlassShell({ children, style }) {
  return (
    <div style={{
      border: `1px solid ${T.border}`,
      background: `linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.28) 52%, rgba(205,238,244,0.18)), ${T.glass}`,
      backdropFilter: 'blur(22px) saturate(1.35)',
      WebkitBackdropFilter: 'blur(22px) saturate(1.35)',
      boxShadow: T.shadow,
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function Gallery() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [drafts, setDrafts] = useState({})
  const [social, setSocial] = useState(() => readJson('memory_social_v1', {}))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const roomCode = localStorage.getItem('room_code')
      let query = supabase.from('memories').select('*').order('created_at', { ascending: false })
      if (roomCode) query = query.eq('room_code', roomCode)
      const { data } = await query
      setRecords((data || []).map(normalizeRecord))
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  useEffect(() => {
    localStorage.setItem('memory_social_v1', JSON.stringify(social))
  }, [social])

  const myName = localStorage.getItem('my_name') || '小周同学'
  const partnerName = localStorage.getItem('partner_name') || '另一半'
  const myAvatar = localStorage.getItem('my_avatar')
  const partnerAvatar = localStorage.getItem('partner_avatar')
  const pageCount = Math.max(1, Math.ceil(records.length / 2))
  const visibleRecords = useMemo(() => records.slice((page - 1) * 2, page * 2), [records, page])

  function getAuthor(record) {
    const name = record.author || myName
    const isMine = name === myName
    return {
      name,
      handle: isMine ? '@xiaozhou' : '@chen',
      avatar: isMine ? myAvatar : partnerAvatar,
      fallback: isMine ? myName.slice(0, 1) : partnerName.slice(0, 1),
    }
  }

  function getSocial(id) {
    return social[id] || { liked: false, likes: 0, comments: [] }
  }

  function toggleLike(id) {
    setSocial(prev => {
      const current = prev[id] || { liked: false, likes: 0, comments: [] }
      const liked = !current.liked
      return {
        ...prev,
        [id]: {
          ...current,
          liked,
          likes: Math.max(0, (current.likes || 0) + (liked ? 1 : -1)),
        },
      }
    })
  }

  function addComment(id) {
    const text = (drafts[id] || '').trim()
    if (!text) return
    setSocial(prev => {
      const current = prev[id] || { liked: false, likes: 0, comments: [] }
      return {
        ...prev,
        [id]: {
          ...current,
          comments: [{ author: myName, text }, ...(current.comments || [])].slice(0, 5),
        },
      }
    })
    setDrafts(prev => ({ ...prev, [id]: '' }))
  }

  function changePage(next) {
    setPage(Math.min(pageCount, Math.max(1, next)))
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: `
        radial-gradient(circle at 15% 8%, rgba(255,188,176,0.50), transparent 30%),
        radial-gradient(circle at 90% 18%, rgba(155,201,210,0.34), transparent 28%),
        linear-gradient(180deg, #fff8f5 0%, ${T.bg} 52%, #fff9ef 100%)
      `,
      color: T.ink,
      fontFamily: T.bodyFont,
      paddingBottom: 'calc(104px + env(safe-area-inset-bottom))',
      overflowX: 'hidden',
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.05,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', padding: '0 14px', position: 'relative', zIndex: 1 }}>
        <header style={{
          height: 68,
          margin: '0 -14px',
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(255,246,244,0.66)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.42)',
        }}>
          <button onClick={() => navigate('/')} style={iconButtonStyle}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: T.muted, fontSize: 11, fontWeight: 800 }}>Notebook</p>
            <h1 style={{ margin: 0, color: T.primary, fontFamily: T.titleFont, fontSize: 27, lineHeight: '30px', fontWeight: 760, fontStyle: 'italic' }}>
              Memories
            </h1>
          </div>
          <button onClick={() => navigate('/new')} style={{ ...iconButtonStyle, color: '#fff', background: 'rgba(156,66,51,0.92)' }}>＋</button>
        </header>

        <GlassShell style={{ borderRadius: 28, marginTop: 14, padding: 10, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            inset: -50,
            background: 'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.80), transparent 18%), radial-gradient(circle at 86% 14%, rgba(151,215,226,0.28), transparent 20%)',
            filter: 'blur(18px)',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            minHeight: 640,
            borderRadius: 22,
            backgroundColor: 'rgba(255,250,242,0.88)',
            backgroundImage: 'linear-gradient(rgba(143,52,40,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(143,52,40,0.045) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            border: `1px solid ${T.warmBorder}`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
            padding: '16px 12px 16px 26px',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', left: 8, top: 20, bottom: 20, display: 'grid', gap: 14, alignContent: 'space-around' }}>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  border: '1px solid rgba(112,72,64,0.20)',
                  background: 'rgba(255,255,255,0.65)',
                  boxShadow: 'inset 0 1px 2px rgba(80,40,30,0.10)',
                }} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ color: T.muted, fontSize: 10, fontWeight: 900, letterSpacing: 0 }}>SUBJECT TOPIC</div>
                <div style={{ color: T.primary, fontFamily: T.titleFont, fontSize: 19, lineHeight: '22px', fontWeight: 760 }}>Shared moments</div>
              </div>
              <div style={{ border: '1px dashed rgba(143,52,40,0.24)', borderRadius: 12, padding: '7px 10px', color: T.muted, fontSize: 10, fontWeight: 800 }}>
                {page}/{pageCount}
              </div>
            </div>

            {loading ? (
              <EmptyState text="记忆正在翻页中..." />
            ) : records.length === 0 ? (
              <EmptyState text="还没有记忆，先写下第一条吧。" action={() => navigate('/new')} />
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {visibleRecords.map((record, index) => (
                  <MemoryPost
                    key={record.id}
                    record={record}
                    author={getAuthor(record)}
                    social={getSocial(record.id)}
                    draft={drafts[record.id] || ''}
                    onDraft={text => setDrafts(prev => ({ ...prev, [record.id]: text }))}
                    onLike={() => toggleLike(record.id)}
                    onComment={() => addComment(record.id)}
                    onOpen={() => navigate(`/diary/${record.id}`)}
                    tilt={index % 2 ? 1 : -1}
                  />
                ))}
              </div>
            )}
          </div>
        </GlassShell>

        {records.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <button onClick={() => changePage(page - 1)} disabled={page === 1} style={pagerButtonStyle(page === 1)}>‹</button>
            <span style={{ color: T.muted, fontSize: 13, fontWeight: 800 }}>{page} / {pageCount}</span>
            <button onClick={() => changePage(page + 1)} disabled={page === pageCount} style={pagerButtonStyle(page === pageCount)}>›</button>
          </div>
        )}
      </div>

      <nav style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(22px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 24px), 392px)',
        height: 68,
        zIndex: 50,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        padding: 6,
        borderRadius: 24,
        border: `1px solid ${T.border}`,
        background: 'rgba(255,255,255,0.50)',
        backdropFilter: 'blur(28px) saturate(1.45)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.45)',
        boxShadow: '0 18px 48px rgba(104,45,38,0.18), inset 0 1px 0 rgba(255,255,255,0.72)',
      }}>
        {navItems.map(item => {
          const active = item.id === 'memory'
          return (
            <button key={item.id} onClick={() => navigate(item.to)} style={{
              border: 'none',
              borderRadius: 18,
              background: 'transparent',
              color: active ? T.primary : T.muted,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontFamily: T.bodyFont,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'none',
            }}>
              <span style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                lineHeight: '24px',
                background: active ? 'rgba(156,66,51,0.10)' : 'rgba(255,255,255,0.18)',
                boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.56)' : 'none',
              }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function MemoryPost({ record, author, social, draft, onDraft, onLike, onComment, onOpen, tilt }) {
  const mainImage = record.images[0]
  const comment = social.comments?.[0]

  return (
    <article style={{
      position: 'relative',
      borderRadius: 20,
      padding: 12,
      background: 'rgba(255,255,255,0.52)',
      border: `1px solid ${T.border}`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: T.softShadow,
      overflow: 'hidden',
    }}>
      <span style={{
        position: 'absolute',
        top: -5,
        left: '48%',
        width: 44,
        height: 13,
        transform: `translateX(-50%) rotate(${tilt * 2}deg)`,
        borderRadius: 3,
        background: 'rgba(155,201,210,0.44)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          background: '#ffe3dd',
          border: '2px solid rgba(255,255,255,0.82)',
          display: 'grid',
          placeItems: 'center',
          color: T.primary,
          fontWeight: 900,
          fontSize: 14,
        }}>
          {author.avatar ? <img src={author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : author.fallback}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: T.ink, fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{author.name}</div>
          <div style={{ color: T.muted, fontSize: 10, fontWeight: 750 }}>{author.handle} · {record.date}</div>
        </div>
        <button onClick={onOpen} style={{ border: 'none', background: 'rgba(255,255,255,0.62)', borderRadius: 999, color: T.primary, padding: '5px 9px', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
          查看
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mainImage ? '1fr 104px' : '1fr', gap: 10, alignItems: 'stretch' }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: '0 0 5px', color: T.primary, fontFamily: T.titleFont, fontSize: 22, lineHeight: '25px', fontWeight: 760 }}>
            {record.title}
          </h2>
          {record.location && <p style={{ margin: '0 0 6px', color: T.sage, fontSize: 11, fontWeight: 800 }}>⌖ {record.location}</p>}
          <p style={{
            margin: 0,
            color: T.ink,
            fontSize: 12,
            lineHeight: '18px',
            display: '-webkit-box',
            WebkitLineClamp: mainImage ? 3 : 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {record.content}
          </p>
        </div>

        {mainImage && (
          <div style={{
            position: 'relative',
            borderRadius: 5,
            background: '#fff',
            padding: '4px 4px 13px',
            boxShadow: '0 6px 18px rgba(70,36,30,0.12)',
            transform: `rotate(${tilt * 1.5}deg)`,
            minWidth: 0,
          }}>
            <img src={mainImage} alt="" style={{ width: '100%', height: 94, objectFit: 'cover', borderRadius: 3 }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <button onClick={onLike} style={socialButtonStyle(social.liked)}>
          {social.liked ? '♥' : '♡'} {social.likes || 0}
        </button>
        <button onClick={onComment} style={socialButtonStyle(false)}>
          评论 {social.comments?.length || 0}
        </button>
        {record.tags.slice(0, 1).map(tag => (
          <span key={tag} style={{ color: T.muted, background: 'rgba(255,255,255,0.42)', borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 800 }}>{tag}</span>
        ))}
      </div>

      <div style={{ marginTop: 9, display: 'grid', gap: 7 }}>
        {comment && (
          <div style={{ background: 'rgba(255,255,255,0.42)', borderRadius: 13, padding: '7px 9px', color: T.muted, fontSize: 11, lineHeight: '16px' }}>
            <b style={{ color: T.primary }}>{comment.author}：</b>{comment.text}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={draft}
            onChange={event => onDraft(event.target.value)}
            placeholder="写评论..."
            style={{
              flex: 1,
              minWidth: 0,
              height: 34,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.68)',
              background: 'rgba(255,255,255,0.52)',
              padding: '0 12px',
              color: T.ink,
              fontFamily: T.bodyFont,
              fontSize: 12,
            }}
          />
          <button onClick={onComment} style={{ border: 'none', borderRadius: 999, background: T.primary, color: '#fff', padding: '0 12px', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
            发送
          </button>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ text, action }) {
  return (
    <div style={{ minHeight: 420, display: 'grid', placeItems: 'center', textAlign: 'center', color: T.muted, padding: 20 }}>
      <div>
        <div style={{ fontFamily: T.titleFont, fontSize: 28, color: T.primary, marginBottom: 8 }}>Memory</div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: '22px' }}>{text}</p>
        {action && <button onClick={action} style={{ marginTop: 16, ...primaryButtonStyle }}>写第一条</button>}
      </div>
    </div>
  )
}

const iconButtonStyle = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.54)',
  color: T.primary,
  fontSize: 24,
  fontWeight: 800,
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: T.softShadow,
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: 999,
  background: T.primary,
  color: '#fff',
  padding: '10px 18px',
  fontFamily: T.bodyFont,
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
}

function pagerButtonStyle(disabled) {
  return {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: `1px solid ${T.border}`,
    background: 'rgba(255,255,255,0.52)',
    color: T.primary,
    fontSize: 24,
    fontWeight: 900,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.35 : 1,
  }
}

function socialButtonStyle(active) {
  return {
    border: `1px solid ${active ? 'rgba(156,66,51,0.32)' : T.border}`,
    borderRadius: 999,
    background: active ? 'rgba(156,66,51,0.12)' : 'rgba(255,255,255,0.42)',
    color: active ? T.primary : T.muted,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 900,
    cursor: 'pointer',
  }
}
