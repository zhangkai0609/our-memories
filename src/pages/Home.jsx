import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import petAvatar from '../assets/home/home-pet-avatar.webp'
import heroPolaroid from '../assets/home/home-hero-polaroid.webp'
import heroPolaroidPhoto from '../assets/home/home-hero-polaroid-photo.webp'
import memoryPhoto1 from '../assets/home/memory-photo-1.webp'
import memoryPhoto2 from '../assets/home/memory-photo-2.webp'
import memoryPhoto3 from '../assets/home/memory-photo-3.webp'
import memoryPhoto4 from '../assets/home/memory-photo-4.webp'
import homeTeddy from '../assets/home/home-teddy.webp'
import homeNotePaper from '../assets/home/home-note-paper-left.webp'
import homeFlowerTop from '../assets/home/home-flower-top.webp'
import homeLaceHeartTR from '../assets/home/home-lace-heart-top-right.webp'
import homeBottomLeftLace from '../assets/home/home-bottom-left-lace.webp'
import homeBottomRightFlower from '../assets/home/home-bottom-right-flower.webp'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#e87c69', pFixed: '#ffdad4',
  secondary: '#536346', brown: '#3f302b', text: '#56423f', light: '#8b7770',
  border: '#dcc0bc', card: '#fcf9f2',
}

const recentMemories = [
  { id: 1, date: '5月20日', title: '今日的霞好美', desc: '一起看晚霞的第100次', image: memoryPhoto1 },
  { id: 2, date: '5月18日', title: '周末的公园散步', desc: '阳光正好，微风不燥', image: memoryPhoto2 },
  { id: 3, date: '5月15日', title: '甜蜜的下午茶', desc: '你做的蛋糕最好吃', image: memoryPhoto3 },
  { id: 4, date: '5月12日', title: '拍立得小记', desc: '记录生活的小确幸', image: memoryPhoto4 },
]

const quickActions = [
  { id: 'diary', icon: '📔', label: '日记本', sub: '记录心情', to: '/new' },
  { id: 'gallery', icon: '📷', label: '相册', sub: '珍藏瞬间', to: '/gallery' },
  { id: 'map', icon: '🗺', label: '地图', sub: '足迹回忆', to: '/map' },
  { id: 'dates', icon: '💝', label: '纪念日', sub: '重要时刻', to: null },
]

const navItems = [
  { id: 'home', icon: '🏠', label: '首页', to: '/' },
  { id: 'diary', icon: '📔', label: '日记', to: '/gallery' },
  { id: 'new', icon: '＋', label: '', to: '/new', primary: true },
  { id: 'map', icon: '🗺', label: '地图', to: '/map' },
  { id: 'profile', icon: '👤', label: '我的', to: null },
]

export default function Home() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchMemories() }, [])

  async function fetchMemories() {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false }).limit(6)
    setMemories(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, color: C.light, fontSize: 15, fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
      翻开我们的故事...
    </div>
  )

  return (
    <div style={{ minHeight: '100svh', background: C.bg, position: 'relative', paddingBottom: 100 }}>
      {/* 背景纸纹 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ===== Header ===== */}
        <Header navigate={navigate} />

        {/* ===== Greeting Section ===== */}
        <GreetingSection />

        {/* ===== Stats Card ===== */}
        <StatsCard />

        {/* ===== Quick Actions ===== */}
        <QuickActions navigate={navigate} />

        {/* ===== Recent Memories ===== */}
        <RecentMemories memories={memories} navigate={navigate} />

        {/* ===== Bottom Banner ===== */}
        <BottomBanner navigate={navigate} />

        {/* spacer for bottom nav */}
        <div style={{ height: 20 }} />
      </div>

      {/* ===== Bottom Nav ===== */}
      <BottomNav navigate={navigate} />

      <style>{homeCSS}</style>
    </div>
  )
}

// ====================== HEADER ======================
function Header({ navigate }) {
  return (
    <header style={{
      padding: '14px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      position: 'relative', zIndex: 2,
    }}>
      {/* 装饰 */}
      <img src={homeFlowerTop} alt="" style={decorAbs(0, 6, 60, 0.52, 'rotate(4deg)')} />
      <img src={homeLaceHeartTR} alt="" style={decorAbs(2, 'auto', 50, 0.48, '', 0, 8)} />

      <div>
        <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 24, color: C.primary, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
          Our Memories
        </h1>
        <p style={{ fontSize: 12, color: C.light, margin: '2px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          记录生活，收藏每一份心动
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingTop: 2 }}>
        <button onClick={() => {}} style={iconBtnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button onClick={() => {}} style={iconBtnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
      </div>
    </header>
  )
}

// ====================== GREETING SECTION ======================
function GreetingSection() {
  return (
    <section style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 16px', gap: 16, position: 'relative', zIndex: 1 }}>
      {/* 宠物头像 + 问候 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
          border: '2px solid rgba(156,66,51,0.20)', flexShrink: 0,
          boxShadow: '0 2px 10px rgba(156,66,51,0.08)',
        }}>
          <img src={petAvatar} alt="pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.brown, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Hi，小周同学
            </span>
            <span style={{ fontSize: 16 }}>👋</span>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 4, padding: '3px 10px', borderRadius: 12,
            background: 'rgba(156,66,51,0.08)', color: C.primary,
            fontSize: 11, fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            <span style={{ fontSize: 10 }}>♥</span> 情侣模式
          </span>
        </div>
      </div>

      {/* 拍立得照片 */}
      <div style={{
        position: 'relative', flexShrink: 0, width: 72, height: 88,
        transform: 'rotate(3deg)',
      }}>
        {/* 拍立得外壳 */}
        <div style={{
          position: 'absolute', inset: 0, background: '#faf7f2',
          borderRadius: 4, boxShadow: '0 4px 16px rgba(156,66,51,0.12), 0 2px 4px rgba(0,0,0,0.06)',
          padding: '5px 5px 20px',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: 1, overflow: 'hidden',
            background: '#e8e0d8',
          }}>
            <img src={heroPolaroidPhoto} alt="us" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
        {/* 胶带装饰 */}
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%) rotate(-6deg)',
          width: 30, height: 14, background: 'rgba(252,249,242,0.65)', borderRadius: 2, zIndex: 2,
        }} />
        {/* 小心形 */}
        <span style={{ position: 'absolute', bottom: -8, right: -6, fontSize: 14, zIndex: 2 }}>♥</span>
      </div>
    </section>
  )
}

// ====================== STATS CARD ======================
function StatsCard() {
  return (
    <div style={{
      margin: '0 20px 16px', background: C.card, borderRadius: 28,
      padding: '20px 18px', position: 'relative', zIndex: 1,
      boxShadow: '0 8px 32px rgba(156,66,51,0.06), 0 2px 8px rgba(90,55,45,0.03)',
      border: '1px solid rgba(220,192,188,0.25)',
      background: 'linear-gradient(135deg, rgba(252,249,242,0.98), rgba(250,245,238,0.94))',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* 左侧数据 */}
      <div>
        <p style={{ fontSize: 12, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', margin: '0 0 4px' }}>
          我们在一起
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 48, fontWeight: 700, color: C.primary, fontFamily: 'EB Garamond, serif', lineHeight: 1 }}>
            520
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: 8, background: 'rgba(156,66,51,0.08)',
            color: C.primary, fontSize: 12, fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>天</span>
        </div>
        <p style={{ fontSize: 11, color: C.light, margin: '6px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif', fontStyle: 'italic' }}>
          "每一天，都是我们的独家记忆。"
        </p>
      </div>

      {/* 右侧迷你日历 */}
      <div style={{
        width: 90, background: 'rgba(255,240,243,0.5)', borderRadius: 16,
        padding: '10px', textAlign: 'center',
        border: '1px solid rgba(220,192,188,0.2)',
      }}>
        <p style={{ fontSize: 11, color: C.brown, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', margin: '0 0 8px' }}>
          2024年5月
        </p>
        {/* 简化日历网格 - 只显示一周 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: 10, fontFamily: 'Plus Jakarta Sans, sans-serif', color: C.light }}>
          {['一','二','三','四','五','六','日'].map(d => (
            <span key={d} style={{ fontSize: 8 }}>{d}</span>
          ))}
          {/* 空格 */}
          {[0,0,0].map((_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: 15 }, (_, i) => {
            const day = i + 1
            const is20 = day === 20
            return (
              <span key={day} style={{
                color: is20 ? C.primary : C.text,
                fontWeight: is20 ? 700 : 400,
                position: 'relative',
              }}>
                {is20 ? (
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    {day}
                    <span style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', fontSize: 6 }}>♥</span>
                  </span>
                ) : day}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ====================== QUICK ACTIONS ======================
function QuickActions({ navigate }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around',
      margin: '0 20px 18px', position: 'relative', zIndex: 1,
    }}>
      {quickActions.map(a => (
        <button key={a.id} onClick={() => a.to ? navigate(a.to) : alert('即将开放')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer', padding: 8,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(252,249,242,0.85)',
            border: '1px solid rgba(220,192,188,0.3)',
            boxShadow: '0 2px 10px rgba(156,66,51,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {a.icon}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.brown }}>{a.label}</span>
          <span style={{ fontSize: 10, color: C.light, marginTop: -4 }}>{a.sub}</span>
        </button>
      ))}
    </div>
  )
}

// ====================== RECENT MEMORIES ======================
function RecentMemories({ memories, navigate }) {
  const displayMemories = memories.length > 0 ? memories.map(m => ({
    id: m.id,
    date: new Date(m.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日',
    title: m.title,
    desc: m.content?.slice(0, 20) || '',
    image: m.image_urls?.[0] || memoryPhoto1,
  })).slice(0, 4) : recentMemories

  return (
    <div style={{ margin: '0 0 18px', position: 'relative', zIndex: 1 }}>
      {/* 标题行 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, color: C.brown, fontWeight: 600, margin: 0 }}>
          最近回忆
        </h3>
        <button onClick={() => navigate('/gallery')} style={{
          background: 'none', border: 'none', color: C.light, cursor: 'pointer',
          fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>查看全部 &gt;</button>
      </div>

      {/* 横向滚动 */}
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto',
        padding: '0 20px', scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}>
        {displayMemories.map((m, i) => (
          <MemoryCard key={m.id || i} memory={m} />
        ))}
      </div>
    </div>
  )
}

function MemoryCard({ memory }) {
  return (
    <div style={{
      minWidth: 168, maxWidth: 168, background: C.card, borderRadius: 20,
      boxShadow: '0 6px 20px rgba(156,66,51,0.06)', overflow: 'hidden',
      flexShrink: 0, scrollSnapAlign: 'start',
      border: '1px solid rgba(220,192,188,0.25)',
      transition: 'transform 0.3s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* 图片区 */}
      <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
        <img src={memory.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* 日期标签 */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 8px', borderRadius: 8,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
          fontSize: 10, fontWeight: 600, color: C.primary,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {memory.date}
        </span>
      </div>

      {/* 文字区 */}
      <div style={{ padding: '10px 12px 12px', position: 'relative' }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: C.brown, fontFamily: 'EB Garamond, serif', margin: '0 0 4px' }}>
          {memory.title}
        </h4>
        <p style={{ fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', margin: 0, lineHeight: 1.4 }}>
          {memory.desc}
        </p>
        <span style={{ position: 'absolute', right: 10, bottom: 10, fontSize: 11, color: C.pLight }}>♥</span>
      </div>
    </div>
  )
}

// ====================== BOTTOM BANNER ======================
function BottomBanner({ navigate }) {
  return (
    <div style={{
      margin: '0 20px', position: 'relative', zIndex: 1,
      background: 'linear-gradient(135deg, rgba(252,249,242,0.95) 0%, rgba(255,245,240,0.90) 100%)',
      borderRadius: 24, padding: '18px 16px',
      border: '1px solid rgba(220,192,188,0.25)',
      boxShadow: '0 6px 24px rgba(156,66,51,0.06)',
      display: 'flex', alignItems: 'center', gap: 12,
      overflow: 'hidden',
    }}>
      {/* 左侧便签纸装饰 */}
      <img src={homeNotePaper} alt="" style={{
        position: 'absolute', left: -8, bottom: -8, width: 64,
        opacity: 0.55, pointerEvents: 'none',
        mixBlendMode: 'multiply',
      }} />

      {/* 左下蕾丝 */}
      <img src={homeBottomLeftLace} alt="" style={decorAbs('auto', 'auto', 48, 0.45, '', -2, -2)} />

      {/* 右下花朵 */}
      <img src={homeBottomRightFlower} alt="" style={decorAbs('auto', 'auto', 44, 0.48, '', 'auto', 2, -4, 'auto')} />

      {/* 文字区 */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.brown, fontFamily: 'EB Garamond, serif', margin: '0 0 4px' }}>
          珍藏每一刻，让爱有迹可循
        </p>
        <p style={{ fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', margin: '0 0 12px' }}>
          你们的回忆，值得被永远珍藏
        </p>
        <button onClick={() => navigate('/new')} style={{
          padding: '8px 20px', background: C.primary, color: '#fff',
          border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: '0 4px 14px rgba(156,66,51,0.22)',
          letterSpacing: '0.04em',
        }}>
          写下新回忆
        </button>
      </div>

      {/* 右侧小熊 */}
      <img src={homeTeddy} alt="" style={{
        width: 84, flexShrink: 0, position: 'relative', zIndex: 1,
        marginRight: -8, marginBottom: -10,
        objectFit: 'contain',
      }} />
    </div>
  )
}

// ====================== BOTTOM NAV ======================
function BottomNav({ navigate }) {
  const [active, setActive] = useState('home')

  function handleNav(item) {
    if (item.primary) { navigate(item.to); return }
    if (item.to === '/') { setActive(item.id); return }
    if (item.to) { navigate(item.to); return }
    alert('即将开放')
  }

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', justifyContent: 'center',
      padding: '0 20px max(14px, env(safe-area-inset-bottom))',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: 'rgba(252,249,242,0.88)', backdropFilter: 'blur(16px)',
        borderRadius: 24, padding: '8px 12px',
        boxShadow: '0 4px 24px rgba(156,66,51,0.10), 0 1px 4px rgba(0,0,0,0.04)',
        border: '1px solid rgba(220,192,188,0.25)',
      }}>
        {navItems.map(item => (
          item.primary ? (
            <button key={item.id} onClick={() => handleNav(item)} style={{
              width: 44, height: 44, borderRadius: '50%',
              background: C.primary, color: '#fff',
              border: 'none', fontSize: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(156,66,51,0.32)',
              marginTop: -22, transition: 'transform 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ＋
            </button>
          ) : (
            <button key={item.id} onClick={() => handleNav(item)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
              color: active === item.id ? C.primary : C.light,
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10,
              transition: 'color 0.2s',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontWeight: active === item.id ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        ))}
      </div>
    </nav>
  )
}

// ====================== HELPERS ======================
const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function decorAbs(top, right, w, opacity, transform, bottom, left) {
  return {
    position: 'absolute', pointerEvents: 'none', zIndex: 0,
    width: w, opacity,
    mixBlendMode: 'multiply',
    top: top !== undefined ? top : 'auto',
    right: right !== undefined ? right : 'auto',
    bottom: bottom !== undefined ? bottom : 'auto',
    left: left !== undefined ? left : 'auto',
    transform: transform || 'none',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
    maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
  }
}

const homeCSS = `
input:focus { outline: none; }
button:active { transform: scale(0.95) !important; }
`
