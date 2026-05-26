import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMemories()
  }, [])

  async function fetchMemories() {
    const { data } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
    setMemories(data || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return <div style={styles.loading}>加载中...</div>

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>我们的回忆</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>退出</button>
      </header>

      <div style={styles.timeline}>
        {memories.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>📸</p>
            <p>还没有记录，去创建第一条吧</p>
          </div>
        ) : (
          memories.map((m, i) => (
            <div key={m.id} style={styles.card}>
              <div style={styles.cardDot} />
              <div style={styles.cardDate}>
                {new Date(m.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
              <h3 style={styles.cardTitle}>{m.title}</h3>
              {m.location && (
                <div style={styles.cardLocation}>📍 {m.location}</div>
              )}
              {m.content && (
                <div
                  style={styles.cardContent}
                  dangerouslySetInnerHTML={{ __html: m.content }}
                />
              )}
              {m.image_urls && m.image_urls.length > 0 && (
                <div style={styles.imageGrid}>
                  {m.image_urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      style={styles.image}
                      onClick={() => window.open(url)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button onClick={() => navigate('/new')} style={styles.addBtn}>
        ＋
      </button>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#fafafa' },
  header: {
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', background: 'white', borderBottom: '1px solid #eee',
  },
  headerTitle: { fontSize: '20px', color: '#d81b60', fontWeight: 'bold', margin: 0 },
  logoutBtn: {
    background: 'none', border: '1px solid #ddd', borderRadius: '8px',
    padding: '6px 16px', color: '#666', cursor: 'pointer', fontSize: '13px',
  },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#888' },
  timeline: { maxWidth: '680px', margin: '0 auto', padding: '24px 20px 100px' },
  empty: { textAlign: 'center', padding: '80px 0', color: '#999' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px' },
  card: {
    position: 'relative', background: 'white', borderRadius: '16px',
    padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    marginLeft: '16px',
  },
  cardDot: {
    position: 'absolute', left: '-27px', top: '28px',
    width: '12px', height: '12px', borderRadius: '50%', background: '#d81b60', border: '3px solid #fce4ec',
  },
  cardDate: { fontSize: '13px', color: '#aaa', marginBottom: '8px' },
  cardTitle: { fontSize: '18px', color: '#333', fontWeight: '600', margin: '0 0 8px' },
  cardLocation: { fontSize: '14px', color: '#888', marginBottom: '10px' },
  cardContent: { fontSize: '15px', color: '#555', lineHeight: '1.8' },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginTop: '16px' },
  image: { width: '100%', borderRadius: '10px', cursor: 'pointer', objectFit: 'cover', aspectRatio: '1' },
  addBtn: {
    position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
    width: '56px', height: '56px', borderRadius: '50%', background: '#d81b60',
    color: 'white', border: 'none', fontSize: '28px', cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(216,27,96,0.35)', zIndex: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
