import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#fef9f0',
  card: '#ffffff',
  accent: '#d4787c',
  pinkLight: '#f8e8e9',
  brown: '#4a3728',
  text: '#6b5544',
  light: '#b8a99a',
  border: '#f0e6d8',
  dot: '#d4787c',
  line: '#f0d5d5',
}

export default function Home() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchMemories() }, [])

  async function fetchMemories() {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
    setMemories(data || [])
    setLoading(false)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, color: C.light, fontSize: 15 }}>
      📖 翻开手账本...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'rgba(254,249,240,0.92)',
        backdropFilter: 'blur(12px)', padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📖</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.brown }}>我们的回忆</span>
        </div>
        <button onClick={handleLogout}
          style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '6px 14px', color: C.light, cursor: 'pointer', fontSize: 13 }}>
          退出
        </button>
      </header>

      {/* Timeline */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '10px 20px 0', position: 'relative' }}>
        {/* Timeline vertical line */}
        <div style={{ position: 'absolute', left: 19, top: 30, bottom: 60, width: 2, background: C.line, zIndex: 0 }} />

        {memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: C.light, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <p style={{ fontSize: 15 }}>还没有回忆，写下第一页吧</p>
          </div>
        ) : (
          memories.map((m) => (
            <div key={m.id} style={{ position: 'relative', zIndex: 1, marginBottom: 28, paddingLeft: 44 }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute', left: 12, top: 20,
                width: 16, height: 16, borderRadius: '50%', background: C.dot,
                border: `4px solid ${C.pinkLight}`, zIndex: 2
              }} />

              {/* Card */}
              <div style={{
                background: C.card, borderRadius: 20, padding: 22,
                boxShadow: '0 3px 16px rgba(180,140,120,0.08)',
                border: `1px solid ${C.border}`
              }}>
                {/* Date */}
                <div style={{ fontSize: 12, color: C.light, marginBottom: 6 }}>
                  {new Date(m.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                  })}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.brown, margin: '0 0 10px' }}>
                  {m.title}
                </h3>

                {/* Location */}
                {m.location && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: C.pinkLight, color: C.accent, padding: '3px 10px', borderRadius: 20, fontSize: 12, marginBottom: 12 }}>
                    📍 {m.location}
                  </div>
                )}

                {/* Content */}
                {m.content && (
                  <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </p>
                )}

                {/* Images */}
                {m.image_urls && m.image_urls.length > 0 && (
                  m.image_urls.length === 1 ? (
                    <img src={m.image_urls[0]} alt="" onClick={() => window.open(m.image_urls[0])}
                      style={{ width: '100%', borderRadius: 14, cursor: 'pointer', objectFit: 'cover', maxHeight: 400 }} />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {m.image_urls.map((url, i) => (
                        <img key={i} src={url} alt="" onClick={() => window.open(url)}
                          style={{ width: '100%', borderRadius: 12, cursor: 'pointer', objectFit: 'cover', aspectRatio: '1' }} />
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/new')}
        style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          width: 56, height: 56, borderRadius: '50%', background: C.accent, color: '#fff',
          border: 'none', fontSize: 28, cursor: 'pointer', zIndex: 20,
          boxShadow: '0 4px 20px rgba(212,120,124,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
        ✎
      </button>
    </div>
  )
}
