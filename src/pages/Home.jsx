import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#ffb4a6', pFixed: '#ffdad4',
  secondary: '#536346', sContainer: '#d6e9c3',
  brown: '#1c1c18', text: '#56423f', light: '#89726e',
  border: '#dcc0bc', card: '#fcf9f2',
}

export default function Home() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchMemories() }, [])

  async function fetchMemories() {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: true })
    setMemories(data || [])
    setLoading(false)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, color: C.light, fontSize: 15, fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
      翻开我们的故事...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 120 }}>
      {/* Grain texture */}
      <div className="grain-overlay" />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255,240,243,0.82)', backdropFilter: 'blur(16px)',
        padding: '14px max(24px, 5vw)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`
      }}>
        <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 22, color: C.primary, fontWeight: 600, margin: 0 }}>
          Our Moments
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button onClick={handleLogout}
            style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, padding: '6px 16px', color: C.light, cursor: 'pointer', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            退出
          </button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.pLight}` }}>
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${C.pFixed}, ${C.pLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              💕
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 'clamp(32px, 6vw, 48px)', color: C.brown, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Hi, Our Moments Together
        </h2>
        <p style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', color: C.text, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          Every day is a new page in our shared story. Let's revisit the beautiful memories.
        </p>
      </section>

      {/* Timeline */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 max(16px, 3vw)', position: 'relative' }}>
        {/* Center line - desktop only */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0,
          width: 2, transform: 'translateX(-50%)',
          background: `linear-gradient(to bottom, transparent, ${C.border} 10%, ${C.border} 90%, transparent)`,
          display: 'none'
        }}
        className="timeline-center-line"
        />

        {memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: C.light }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <p style={{ fontSize: 15, fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>写下你们的第一页故事吧</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(40px, 6vw, 80px)' }}>
            {memories.map((m, i) => {
              const isLeft = i % 2 === 0
              const dateStr = new Date(m.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
              const formattedDate = new Date(m.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })

              return (
                <div key={m.id} style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center',
                  position: 'relative'
                }}>
                  {/* Dot on timeline */}
                  <div style={{
                    position: 'absolute', left: '50%', top: 28,
                    width: 16, height: 16, borderRadius: '50%', background: C.primary,
                    border: `4px solid ${C.bg}`, transform: 'translateX(-50%)', zIndex: 2
                  }} />

                  {/* Left side spacer */}
                  <div style={{ flex: 1, maxWidth: '45%', paddingRight: isLeft ? 40 : 0, display: isLeft ? 'block' : 'none' }}>
                    <MemoryCard m={m} dateStr={dateStr} formattedDate={formattedDate} />
                  </div>

                  {/* Right side spacer */}
                  <div style={{ flex: 1, maxWidth: '45%', paddingLeft: !isLeft ? 40 : 0, display: !isLeft ? 'block' : 'none' }}>
                    <MemoryCard m={m} dateStr={dateStr} formattedDate={formattedDate} />
                  </div>

                  {/* Gap in center */}
                  <div style={{ width: 60, flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/new')} style={{
        position: 'fixed', bottom: 36, right: 'max(16px, 5vw)',
        width: 60, height: 60, borderRadius: '50%', background: C.primary, color: '#fff',
        border: 'none', fontSize: 32, cursor: 'pointer', zIndex: 30,
        boxShadow: '0 8px 28px rgba(156,66,51,0.30)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ＋
      </button>

      {/* Bottom nav mobile */}
      <nav style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 30,
        background: 'rgba(246,243,236,0.88)', backdropFilter: 'blur(16px)',
        padding: '10px 16px 14px', borderTop: `1px solid ${C.border}`,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
      }}
      className="mobile-nav"
      >
        <NavItem icon="📖" label="Timeline" active onClick={() => navigate('/')} />
        <NavItem icon="🗺️" label="Map" onClick={() => navigate('/map')} />
        <NavItem icon="＋" label="New Moment" primary onClick={() => navigate('/new')} />
        <NavItem icon="🖼️" label="Gallery" onClick={() => navigate('/gallery')} />
      </nav>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px 20px 60px', color: C.light, fontSize: 13 }}>
        <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, color: C.primary, marginBottom: 4 }}>Our Moments</p>
        <p>Crafted with love</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .timeline-center-line { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .timeline-center-line { display: block !important; }
          .mobile-nav { display: none !important; }
        }
        .memory-card:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  )
}

function MemoryCard({ m, dateStr, formattedDate }) {
  return (
    <div className="memory-card" style={{
      background: C.card, borderRadius: 20, padding: 20,
      boxShadow: '0 8px 36px rgba(156,66,51,0.07)',
      border: `1px solid ${C.border}`,
      transition: 'transform 0.4s cubic-bezier(0.2, 1, 0.3, 1)',
      cursor: 'default',
    }}>
      {/* Image */}
      {m.image_urls && m.image_urls.length > 0 && (
        <div style={{
          borderRadius: 8, overflow: 'hidden', marginBottom: 18,
          aspectRatio: m.image_urls.length === 1 ? '4/5' : '4/3',
          maxHeight: m.image_urls.length === 1 ? 420 : 300,
        }}>
          <img src={m.image_urls[0]} alt="" onClick={() => window.open(m.image_urls[0])}
            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
        </div>
      )}
      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: C.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {formattedDate || dateStr}
        </span>
        {m.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.primary, fontSize: 13 }}>
            <span>♥</span>
            <span style={{ fontWeight: 600, fontSize: 12 }}>{m.location}</span>
          </div>
        )}
      </div>
      {/* Title */}
      <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 22, color: C.brown, fontWeight: 500, marginBottom: 8, lineHeight: 1.2 }}>
        {m.title}
      </h3>
      {/* Content */}
      {m.content && (
        <p style={{ fontSize: 15, color: C.text, lineHeight: 1.7, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {m.content}
        </p>
      )}
    </div>
  )
}

function NavItem({ icon, label, active, primary, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: active ? C.pFixed : primary ? C.primary : 'transparent',
      color: primary ? '#fff' : active ? C.primary : C.light,
      border: 'none', cursor: 'pointer', padding: primary ? '8px 20px' : '6px 12px',
      borderRadius: primary ? 20 : 14, fontSize: 11, fontWeight: 600,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
