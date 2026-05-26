import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pFixed: '#ffdad4',
  brown: '#1c1c18', text: '#56423f', light: '#89726e',
  border: '#dcc0bc', card: '#fcf9f2',
}

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase.from('memories').select('id,title,image_urls,location,created_at').order('created_at', { ascending: false })
    const all = []
    for (const m of data || []) {
      if (m.image_urls && m.image_urls.length > 0) {
        for (const url of m.image_urls) {
          all.push({
            url,
            memoryId: m.id,
            title: m.title,
            location: m.location,
            date: new Date(m.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
          })
        }
      }
    }
    setPhotos(all)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, color: C.light, fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 16 }}>
      整理我们的相册...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>
      <div className="grain-overlay" />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(255,240,243,0.82)', backdropFilter: 'blur(16px)',
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 15 }}>← 返回</button>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 22, color: C.primary, fontWeight: 600, margin: 0 }}>Gallery</h1>
        </div>
        <span style={{ fontSize: 13, color: C.light }}>{photos.length} 张照片</span>
      </header>

      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '120px 20px', color: C.light }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
          <p style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 16 }}>还没有照片，去添加第一条回忆吧</p>
        </div>
      ) : (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 8,
          }}>
            {photos.map((p, i) => (
              <div key={i}
                onClick={() => setSelected(p)}
                style={{
                  position: 'relative', cursor: 'pointer', borderRadius: 12, overflow: 'hidden',
                  aspectRatio: '1', background: C.card,
                }}>
                <img src={p.url} alt={p.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                  padding: '20px 12px 10px', color: '#fff',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </div>
                  {p.location && (
                    <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>📍 {p.location}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.88)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}>
          <button onClick={() => setSelected(null)}
            style={{
              position: 'absolute', top: 20, right: 24,
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
              borderRadius: '50%', width: 44, height: 44, fontSize: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          <img src={selected.url} alt="" style={{ maxWidth: '90vw', maxHeight: '75vh', borderRadius: 12, objectFit: 'contain' }} />
          <div style={{ color: '#fff', textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, fontWeight: 500 }}>{selected.title}</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{selected.date}{selected.location ? ` · ${selected.location}` : ''}</div>
          </div>
        </div>
      )}
    </div>
  )
}
