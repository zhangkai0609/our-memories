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
  { id: 'profile', icon: '👤', label: '我的', to: '/my' },
]

export default function Home() {
  const [memories, setMemories] = useState([])
  const [allMemories, setAllMemories] = useState([])
  const [memoryDays, setMemoryDays] = useState(0)
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchMemories() }, [])

  async function fetchMemories() {
    const roomCode = localStorage.getItem('room_code')
    let query = supabase.from('memories').select('*').order('created_at', { ascending: false }).limit(6)
    if (roomCode) query = query.eq('room_code', roomCode)
    else return setLoading(false)
    const { data } = await query
    setMemories(data || [])

    // 查全部 + 最早记录来算天数
    let allQuery = supabase.from('memories').select('id,title,created_at').order('created_at', { ascending: false })
    if (roomCode) allQuery = allQuery.eq('room_code', roomCode)
    const { data: all } = await allQuery
    setAllMemories(all || [])

    // 取最早一条记录的时间
    if (all && all.length > 0) {
      const first = new Date(all[all.length - 1].created_at)
      const days = Math.floor((Date.now() - first.getTime()) / 86400000) + 1
      setMemoryDays(days)
    }

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
        <StatsCard onCalendarClick={() => setCalendarOpen(true)} memoryDays={memoryDays} allMemories={allMemories} />

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

      {/* ===== Calendar Modal ===== */}
      {calendarOpen && (
        <CalendarModal
          allMemories={allMemories}
          year={calYear} month={calMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
          onClose={() => { setCalendarOpen(false); setSelectedDate(null); }}
        />
      )}

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
  const myName = localStorage.getItem('my_name') || '小周同学'
  const partnerName = localStorage.getItem('partner_name') || '另一半'
  const myAvatar = localStorage.getItem('my_avatar') || petAvatar
  const partnerAvatar = localStorage.getItem('partner_avatar') || null
  const mode = localStorage.getItem('room_mode') || 'couple'
  const modeLabels = { couple: '情侣模式', friends: '好友模式', besties: '闺蜜模式', family: '家人模式' }

  return (
    <section style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 16px', gap: 14, position: 'relative', zIndex: 1 }}>
      {/* 左侧头像：我 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(156,66,51,0.25)', flexShrink: 0,
          boxShadow: '0 3px 14px rgba(156,66,51,0.10)',
        }}>
          <img src={myAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.brown, fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {myName}
        </span>
      </div>

      {/* 中间爱心 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 20 }}>♥</span>
      </div>

      {/* 右侧头像：伴侣 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(156,66,51,0.25)', flexShrink: 0,
          boxShadow: '0 3px 14px rgba(156,66,51,0.10)',
          background: 'linear-gradient(135deg, #fce4e0, #fdf0ed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {partnerAvatar ? <img src={partnerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐾'}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.brown, fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {partnerName}
        </span>
      </div>

      {/* 模式标签 */}
      <span style={{
        position: 'absolute', right: 0, bottom: 4,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 12,
        background: 'rgba(156,66,51,0.07)', color: C.primary,
        fontSize: 11, fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        <span style={{ fontSize: 10 }}>♥</span> {modeLabels[mode] || '情侣模式'}
      </span>
    </section>
  )
}

// ====================== STATS CARD ======================
function StatsCard({ onCalendarClick, memoryDays, allMemories }) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`
  const today = now.getDate()
  // 计算当月日历
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  // 哪些日期有记忆
  const dateSet = new Set()
  if (allMemories) {
    allMemories.forEach(m => {
      const d = new Date(m.created_at)
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        dateSet.add(d.getDate())
      }
    })
  }

  return (
    <div style={{
      margin: '0 20px 16px', background: C.card, borderRadius: 28,
      padding: '18px 14px', position: 'relative', zIndex: 1,
      boxShadow: '0 8px 32px rgba(156,66,51,0.06), 0 2px 8px rgba(90,55,45,0.03)',
      border: '1px solid rgba(220,192,188,0.25)',
      backgroundImage: 'linear-gradient(135deg, rgba(252,249,242,0.98), rgba(250,245,238,0.94))',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* 左侧数据 */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', margin: '0 0 4px' }}>
          我们的记忆
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 44, fontWeight: 700, color: C.primary, fontFamily: 'EB Garamond, serif', lineHeight: 1 }}>
            {memoryDays || '--'}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: 8, background: 'rgba(156,66,51,0.08)',
            color: C.primary, fontSize: 12, fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>天</span>
        </div>
        <p style={{ fontSize: 11, color: C.light, margin: '6px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif', fontStyle: 'italic' }}>
          从第一条记录到今天
        </p>
      </div>

      {/* 右侧迷你日历 — 拉宽 */}
      <button onClick={onCalendarClick} style={{
        width: 140, background: 'rgba(255,240,243,0.5)', borderRadius: 18,
        padding: '12px 12px 10px', textAlign: 'center', cursor: 'pointer',
        border: '1px solid rgba(220,192,188,0.2)', transition: 'transform 0.2s, box-shadow 0.2s',
        flexShrink: 0, marginLeft: 12,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(156,66,51,0.10)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <p style={{ fontSize: 12, color: C.brown, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', margin: '0 0 8px' }}>
          {currentMonth}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', color: C.light }}>
          {['一','二','三','四','五','六','日'].map(d => (
            <span key={d} style={{ fontSize: 9, fontWeight: 500 }}>{d}</span>
          ))}
          {Array.from({ length: startOffset }, (_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const hasMemory = dateSet.has(day)
            const isToday = day === today
            return (
              <span key={day} style={{
                color: isToday ? C.primary : C.brown,
                fontWeight: isToday ? 700 : 400,
                fontSize: isToday ? 12 : 11,
                position: 'relative', cursor: 'default',
                padding: '2px 0',
              }}>
                {hasMemory ? (
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    {day}
                    <span style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: C.pLight }} />
                  </span>
                ) : day}
              </span>
            )
          })}
        </div>
        <p style={{ fontSize: 9, color: C.light, margin: '8px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>点击查看全部日历</p>
      </button>
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
      {/* 标题行 — 与 StatsCard / QuickActions 左右对齐 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 20px', marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, color: C.brown, fontWeight: 600, margin: 0 }}>
          最近回忆
        </h3>
        <button onClick={() => navigate('/gallery')} style={{
          background: 'none', border: 'none', color: C.light, cursor: 'pointer',
          fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>查看全部 &gt;</button>
      </div>

      {/* 横向滚动 — 左右留20px与上方对齐 */}
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto',
        margin: '0 20px', padding: 0, scrollSnapType: 'x mandatory',
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

// ====================== CALENDAR MODAL ======================
function CalendarModal({ allMemories, year, month, selectedDate, onSelectDate, onMonthChange, onClose }) {
  // 按日期分组记忆
  const memoryMap = {}
  allMemories.forEach(m => {
    const d = new Date(m.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!memoryMap[key]) memoryMap[key] = []
    memoryMap[key].push(m)
  })

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12)
    else onMonthChange(year, month - 1)
    onSelectDate(null)
  }
  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1)
    else onMonthChange(year, month + 1)
    onSelectDate(null)
  }

  const selectedMemories = selectedDate ? (memoryMap[selectedDate] || []) : []

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* 遮罩 */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(30,10,8,0.45)', backdropFilter: 'blur(6px)',
      }} />

      {/* 日历卡片 */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 380, maxHeight: '90vh',
        background: 'linear-gradient(180deg, rgba(252,249,242,0.99) 0%, rgba(250,245,238,0.97) 100%)',
        borderRadius: 28, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(60,20,15,0.25)',
        border: '1px solid rgba(220,192,188,0.35)',
        display: 'flex', flexDirection: 'column',
        animation: 'modalIn 0.3s ease-out',
      }}>
        {/* 关闭按钮 */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(0,0,0,0.04)', border: 'none',
          cursor: 'pointer', fontSize: 18, color: C.light,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* 月份导航 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 10px',
        }}>
          <button onClick={prevMonth} style={calNavBtnStyle}>←</button>
          <h2 style={{
            fontFamily: 'EB Garamond, serif', fontSize: 22, fontWeight: 600,
            color: C.brown, margin: 0, letterSpacing: '0.02em',
          }}>
            {year}年{monthNames[month - 1]}
          </h2>
          <button onClick={nextMonth} style={calNavBtnStyle}>→</button>
        </div>

        {/* 周标题 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '6px 14px', gap: 2,
        }}>
          {['一','二','三','四','五','六','日'].map(d => (
            <span key={d} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 500,
              color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif',
              padding: '4px 0',
            }}>{d}</span>
          ))}
        </div>

        {/* 日期网格 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '4px 14px', gap: 3, flexShrink: 0,
        }}>
          {/* 空白填充 */}
          {Array.from({ length: startOffset }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {/* 日期 */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasMemory = memoryMap[dateKey]
            const isToday = dateKey === todayKey
            const isSelected = dateKey === selectedDate

            return (
              <button key={day} onClick={() => onSelectDate(dateKey)} style={{
                aspectRatio: '1', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                border: 'none',
                borderRadius: 14,
                background: isSelected ? C.primary
                  : isToday ? 'rgba(156,66,51,0.08)'
                  : 'transparent',
                color: isSelected ? '#fff'
                  : isToday ? C.primary
                  : C.brown,
                fontWeight: isSelected || isToday ? 700 : 400,
                fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
                cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(156,66,51,0.06)'
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(156,66,51,0.08)' : 'transparent'
                }}
              >
                {day}
                {/* 记忆标记点 */}
                {hasMemory && !isSelected && (
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: C.pLight,
                  }} />
                )}
                {hasMemory && isSelected && (
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.7)',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* 选中日期的记忆列表 */}
        <div style={{
          borderTop: '1px solid rgba(220,192,188,0.25)',
          margin: '10px 14px 0', padding: '12px 6px 16px',
          flex: 1, overflowY: 'auto', minHeight: 60, maxHeight: 180,
        }}>
          {selectedDate ? (
            selectedMemories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{
                  fontSize: 12, color: C.light, margin: 0,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  {selectedDate.replace(/-/g, '/')} 的记录：
                </p>
                {selectedMemories.map((m, i) => (
                  <div key={m.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 12,
                    background: 'rgba(255,240,243,0.5)',
                    border: '1px solid rgba(220,192,188,0.18)',
                  }}>
                    <span style={{ fontSize: 14 }}>📝</span>
                    <span style={{
                      fontSize: 13, color: C.brown, fontWeight: 500,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{m.title || '无标题'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '16px 0',
                color: C.light, fontSize: 13,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>📭</span>
                这一天还没有记录
              </div>
            )
          ) : (
            <div style={{
              textAlign: 'center', padding: '16px 0',
              color: C.light, fontSize: 13,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>👆</span>
              点击日期查看记录
            </div>
          )}
        </div>
      </div>

      <style>{calModalCSS}</style>
    </div>
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

const calNavBtnStyle = {
  width: 36, height: 36, borderRadius: '50%',
  background: 'rgba(220,192,188,0.15)', border: 'none',
  cursor: 'pointer', fontSize: 16, color: C.brown,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  transition: 'background 0.2s',
}

const calModalCSS = `
@keyframes modalIn {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
`

const homeCSS = `
input:focus { outline: none; }
button:active { transform: scale(0.95) !important; }
`
