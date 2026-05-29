import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getSpaceId } from '../lib/space'

// ===== 素材 =====
import diaryPhotoGirlFood from '../assets/diary/diary-photo-girl-food.webp'
import diaryPhotoSunset from '../assets/diary/diary-photo-sunset.webp'
import diaryPhotoDog from '../assets/diary/diary-photo-dog.webp'
import diaryMapSnippet from '../assets/diary/diary-map-snippet.webp'
import diaryBowSticker from '../assets/diary/diary-bow-sticker.webp'
import diaryBlueTape from '../assets/diary/diary-blue-tape.webp'
import diaryPinkHeart from '../assets/diary/diary-pink-heart.webp'
import diaryStarSticker from '../assets/diary/diary-star-sticker.webp'
import diaryBottomLeftJar from '../assets/diary/diary-bottom-left-jar.webp'
import diaryBottomRightFlowerNote from '../assets/diary/diary-bottom-right-flower-note.webp'
import diaryTopTitleTape from '../assets/diary/diary-top-title-tape.webp'
import diarySecondTitleTape from '../assets/diary/diary-second-title-tape.webp'
import diaryPawSticker from '../assets/diary/diary-paw-sticker.webp'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#e87c69', pFixed: '#ffdad4',
  secondary: '#536346', brown: '#3f302b', text: '#56423f', light: '#8b7770',
  border: '#dcc0bc', card: '#fcf9f2', tagBg: '#f7e4dc',
}

// ===== Mock 数据 =====
const diaryRecords = [
  {
    id: 1,
    date: '2024.05.20',
    weekday: '周一',
    time: '18:30',
    title: '今日的晚霞好美',
    location: '北京市 · 朝阳区 · 望京街道',
    photos: [diaryPhotoGirlFood, diaryPhotoSunset],
    text: '今天下班后一起去看了晚霞，天空被染成了温柔的橘粉色。那一刻时间好像慢了下来，我们在河边散步，聊了很多，感觉生活真的好美好～',
    tags: ['晚霞', '日常', '散步'],
  },
  {
    id: 2,
    date: '2024.05.18',
    weekday: '周六',
    time: '15:00',
    title: '周末的公园散步',
    location: '北京 · 望京伯爵山公园',
    photos: [diaryPhotoDog],
    text: '阳光正好，微风不燥，带着毛孩子一起去公园散步。看花、拍照、发呆，是简单又幸福的一天。',
    tags: ['公园', '宠物', '周末'],
  },
  {
    id: 3,
    date: '2024.05.15',
    weekday: '周三',
    time: '12:20',
    title: '甜蜜的下午茶时光',
    location: '北京 · 三里屯 · 甜品店',
    photos: [diaryPhotoGirlFood],
    text: '午后的阳光透过玻璃窗洒在桌上，我们点了草莓蛋糕和拿铁，聊着最近的小事，笑声填满了整个下午。',
    tags: ['美食', '下午茶', '日常'],
  },
  {
    id: 4,
    date: '2024.05.12',
    weekday: '周日',
    time: '09:15',
    title: '一起做早餐',
    location: '家里 · 厨房',
    photos: [diaryPhotoDog, diaryPhotoSunset],
    text: '周日早上一起做了松饼和煎蛋，厨房里弥漫着黄油的香气。你负责摆盘，我负责拍照，完美的一天从早餐开始。',
    tags: ['早餐', '日常', '幸福'],
  },
]

// ===== 筛选选项 =====
const timeOptions = ['全部时间', '最近一周', '最近一月', '最近一年']
const locationOptions = ['全部地点', '北京市', '望京', '三里屯', '家']
const titleOptions = ['全部标题', '晚霞', '散步', '下午茶', '早餐']

export default function Gallery() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])

  // 筛选 & 视图状态
  const [timeFilter, setTimeFilter] = useState('全部时间')
  const [locFilter, setLocFilter] = useState('全部地点')
  const [titleFilter, setTitleFilter] = useState('全部标题')
  const [viewMode, setViewMode] = useState('double') // 'single' | 'double'
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilter, setShowFilter] = useState(null) // null | 'time' | 'location' | 'title'
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const spaceId = await getSpaceId()
      let query = supabase.from('memories').select('*').order('created_at', { ascending: false })
      if (spaceId) query = query.eq('space_id', spaceId)
      const { data } = await query
      if (data && data.length > 0) {
        const mapped = data.map(m => ({
          id: m.id,
          date: new Date(m.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.'),
          weekday: ['周日','周一','周二','周三','周四','周五','周六'][new Date(m.created_at).getDay()],
          time: `${String(new Date(m.created_at).getHours()).padStart(2,'0')}:${String(new Date(m.created_at).getMinutes()).padStart(2,'0')}`,
          title: m.title || '无标题',
          location: m.location || '',
          photos: (m.image_urls && m.image_urls.length > 0) ? m.image_urls : [diaryPhotoGirlFood],
          text: m.content || '',
          tags: m.tags || [],
          isReal: true,
        }))
        setRecords(mapped)
      } else {
        setRecords(diaryRecords)
      }
    } catch {
      setRecords(diaryRecords)
    }
    setLoading(false)
  }

  // 筛选逻辑
  const filteredRecords = useMemo(() => {
    let result = [...records]
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      result = result.filter(r => r.title.toLowerCase().includes(q) || r.text.toLowerCase().includes(q) || r.location.toLowerCase().includes(q))
    }
    if (timeFilter === '最近一周') {
      const weekAgo = new Date(Date.now() - 7 * 86400000)
      result = result.filter(r => new Date(r.date.replace(/\./g,'-')) >= weekAgo)
    } else if (timeFilter === '最近一月') {
      const monthAgo = new Date(Date.now() - 30 * 86400000)
      result = result.filter(r => new Date(r.date.replace(/\./g,'-')) >= monthAgo)
    } else if (timeFilter === '最近一年') {
      const yearAgo = new Date(Date.now() - 365 * 86400000)
      result = result.filter(r => new Date(r.date.replace(/\./g,'-')) >= yearAgo)
    }
    if (locFilter !== '全部地点') {
      result = result.filter(r => r.location.includes(locFilter))
    }
    if (titleFilter !== '全部标题') {
      result = result.filter(r => r.title.includes(titleFilter))
    }
    return result
  }, [records, timeFilter, locFilter, titleFilter, searchText])

  // 分页
  const perPage = viewMode === 'single' ? 1 : 2
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / perPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])

  const pageRecords = filteredRecords.slice((currentPage - 1) * perPage, currentPage * perPage)

  function toggleFilter(type) {
    setShowFilter(prev => prev === type ? null : type)
  }

  function selectFilter(type, value) {
    if (type === 'time') setTimeFilter(value)
    if (type === 'location') setLocFilter(value)
    if (type === 'title') setTitleFilter(value)
    setShowFilter(null)
    setCurrentPage(1)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, color: C.light, fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 16 }}>
      翻开我们的故事...
    </div>
  )

  return (
    <div style={{ minHeight: '100svh', background: C.bg, paddingBottom: 100, position: 'relative' }}>
      {/* 背景纸纹 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <DiaryHeader
          navigate={navigate}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchText={searchText}
          setSearchText={setSearchText}
        />
        <DiaryFilters
          timeFilter={timeFilter} locFilter={locFilter} titleFilter={titleFilter}
          viewMode={viewMode} totalCount={filteredRecords.length}
          showFilter={showFilter}
          onToggleFilter={toggleFilter}
          onSelectFilter={selectFilter}
          onViewModeChange={v => { setViewMode(v); setCurrentPage(1); }}
        />
        <DiaryNotebook
          records={pageRecords}
          viewMode={viewMode}
          page={currentPage}
          totalPages={totalPages}
          isEmpty={filteredRecords.length === 0}
        />
        {filteredRecords.length > 0 && (
          <DiaryPager
            page={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
            onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          />
        )}
      </div>

      <style>{diaryCSS}</style>
    </div>
  )
}

// ====================== HEADER ======================
function DiaryHeader({ navigate, searchOpen, setSearchOpen, searchText, setSearchText }) {
  return (
    <header style={{
      padding: '14px 18px 6px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      position: 'relative',
    }}>
      {/* 左侧：返回 + 标题 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', color: C.primary, cursor: 'pointer',
          fontSize: 18, padding: '2px 0', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>←</button>
        <div>
          <h1 style={{
            fontFamily: 'EB Garamond, serif', fontSize: 26, color: C.primary,
            fontWeight: 600, margin: 0, letterSpacing: '-0.01em',
          }}>日记本</h1>
          <p style={{ fontSize: 12, color: C.light, margin: '2px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            记录生活，收藏每一份心动
          </p>
        </div>
      </div>

      {/* 右侧：搜索 / 筛选 / + 写日记 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <button onClick={() => setSearchOpen(!searchOpen)} style={headerIconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button onClick={() => navigate('/new')} style={{
          ...headerIconBtn,
          background: C.primary, color: '#fff', borderRadius: 16,
          padding: '6px 14px', fontSize: 12, fontWeight: 600,
          fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 2px 8px rgba(156,66,51,0.20)',
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> 写日记
        </button>
      </div>

      {/* 搜索栏 */}
      {searchOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 18, left: 18, zIndex: 20,
          marginTop: 4,
        }}>
          <input type="text" placeholder="搜索标题、内容、地点..."
            value={searchText} onChange={e => setSearchText(e.target.value)} autoFocus
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 16,
              border: '1.5px solid rgba(220,192,188,0.5)', fontSize: 14,
              background: C.card, color: C.brown, outline: 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 16px rgba(156,66,51,0.08)',
            }} />
        </div>
      )}
    </header>
  )
}

// ====================== FILTERS ======================
function DiaryFilters({ timeFilter, locFilter, titleFilter, viewMode, totalCount, showFilter, onToggleFilter, onSelectFilter, onViewModeChange }) {
  return (
    <div style={{ padding: '6px 18px 10px', position: 'relative', zIndex: 10 }}>
      {/* 筛选胶囊 + 数量 + 视图切换 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FilterChip label={timeFilter} active={showFilter === 'time'} onClick={() => onToggleFilter('time')} />
        <FilterChip label={locFilter} active={showFilter === 'location'} onClick={() => onToggleFilter('location')} />
        <FilterChip label={titleFilter} active={showFilter === 'title'} onClick={() => onToggleFilter('title')} />

        <span style={{
          marginLeft: 'auto', fontSize: 12, color: C.light,
          fontFamily: 'Plus Jakarta Sans, sans-serif', whiteSpace: 'nowrap',
        }}>
          {totalCount} 条记录
        </span>

        {/* 视图切换 */}
        <div style={{
          display: 'flex', borderRadius: 12, overflow: 'hidden',
          border: '1px solid rgba(220,192,188,0.3)',
          background: 'rgba(252,249,242,0.7)',
        }}>
          <button onClick={() => onViewModeChange('single')} style={{
            width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', fontSize: 13,
            background: viewMode === 'single' ? 'rgba(156,66,51,0.08)' : 'transparent',
            color: viewMode === 'single' ? C.primary : C.light,
          }} title="单条展示">☰</button>
          <button onClick={() => onViewModeChange('double')} style={{
            width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', fontSize: 13,
            background: viewMode === 'double' ? 'rgba(156,66,51,0.08)' : 'transparent',
            color: viewMode === 'double' ? C.primary : C.light,
          }} title="双条展示">▦</button>
        </div>
      </div>

      {/* Dropdown 弹出 */}
      {showFilter && (
        <>
          <div onClick={() => onToggleFilter(null)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 18, zIndex: 10,
            marginTop: 2, background: C.card, borderRadius: 16,
            boxShadow: '0 8px 30px rgba(156,66,51,0.12)',
            border: '1px solid rgba(220,192,188,0.3)',
            padding: '6px', minWidth: 120,
          }}>
            {(showFilter === 'time' ? timeOptions : showFilter === 'location' ? locationOptions : titleOptions).map(opt => (
              <button key={opt} onClick={() => onSelectFilter(showFilter, opt)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', border: 'none', borderRadius: 12,
                background: 'transparent', cursor: 'pointer',
                fontSize: 13, color: C.brown,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(156,66,51,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >{opt}</button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '6px 12px', borderRadius: 20,
      background: active ? 'rgba(156,66,51,0.06)' : C.tagBg,
      border: active ? '1px solid rgba(156,66,51,0.25)' : '1px solid transparent',
      color: C.text, fontSize: 12, cursor: 'pointer',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s',
    }}>
      {label}
      <span style={{ fontSize: 9, color: C.light }}>▾</span>
    </button>
  )
}

// ====================== NOTEBOOK (日记纸主卡片) ======================
function DiaryNotebook({ records, viewMode, page, totalPages, isEmpty }) {
  if (isEmpty) {
    return (
      <div style={{
        margin: '10px 18px', padding: '60px 20px', textAlign: 'center',
        background: C.card, borderRadius: 24,
        border: '1px solid rgba(220,192,188,0.25)',
        boxShadow: '0 8px 32px rgba(156,66,51,0.06)',
      }}>
        <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📖</span>
        <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, color: C.brown, margin: 0 }}>
          还没有找到记录
        </p>
        <p style={{ fontSize: 13, color: C.light, margin: '6px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          试试更换筛选条件，或者去写一篇新日记吧
        </p>
      </div>
    )
  }

  return (
    <div style={{
      margin: '10px 18px 16px', position: 'relative',
      background: 'linear-gradient(180deg, rgba(252,249,242,0.99) 0%, rgba(250,245,238,0.96) 100%)',
      borderRadius: 24,
      border: '1px solid rgba(220,192,188,0.25)',
      boxShadow: '0 8px 32px rgba(156,66,51,0.06), 0 2px 8px rgba(90,55,45,0.03)',
      padding: '18px 14px',
    }}>
      {/* 网格纸纹理 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 24, overflow: 'hidden',
        backgroundImage: `linear-gradient(rgba(156,66,51,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(156,66,51,0.05) 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
      }} />

      {/* 左侧装订孔 */}
      <div style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 14, zIndex: 2,
      }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: `radial-gradient(circle at 40% 35%, rgba(255,240,243,0.8), rgba(220,192,188,0.4))`,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 2px rgba(255,255,255,0.5)',
            border: '1px solid rgba(220,192,188,0.3)',
          }} />
        ))}
      </div>

      {/* 顶部装饰：胶带 */}
      <img src={diaryTopTitleTape} alt="" style={{
        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%) rotate(-3deg)',
        width: 80, opacity: 0.75, pointerEvents: 'none', zIndex: 1,
      }} />

      {/* 底部装饰 */}
      <img src={diaryBottomLeftJar} alt="" style={{
        position: 'absolute', bottom: -6, left: 4, width: 46, opacity: 0.55,
        pointerEvents: 'none', zIndex: 1,
        mixBlendMode: 'multiply',
      }} />
      <img src={diaryBottomRightFlowerNote} alt="" style={{
        position: 'absolute', bottom: -6, right: 4, width: 50, opacity: 0.55,
        pointerEvents: 'none', zIndex: 1,
        mixBlendMode: 'multiply',
      }} />

      {/* 页码标签 */}
      <div style={{
        position: 'absolute', top: 10, right: 18,
        background: 'rgba(220,192,188,0.12)', borderRadius: 10,
        padding: '3px 10px',
        fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif',
        zIndex: 1,
      }}>
        {page} / {totalPages}
      </div>

      {/* 记录卡片 */}
      <div style={{ position: 'relative', zIndex: 1, paddingLeft: 10 }}>
        {records.map((record, idx) => (
          <DiaryEntry
            key={record.id}
            record={record}
            isFirst={idx === 0}
            isLast={idx === records.length - 1}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  )
}

// ====================== DIARY ENTRY ======================
function DiaryEntry({ record, isFirst, isLast, viewMode }) {
  return (
    <div style={{
      padding: viewMode === 'single' ? '16px 8px' : '12px 8px',
      borderBottom: !isLast ? '1px dashed rgba(220,192,188,0.25)' : 'none',
      position: 'relative',
    }}>
      {/* ===== 行1: 日期 + 时间 + 地点 ===== */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap',
      }}>
        {/* 日期标签 */}
        <span style={{
          ...dateBadgeStyle,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 2 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {record.date}
        </span>
        <span style={{ fontSize: 12, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {record.weekday} {record.time}
        </span>
        {record.location ? (
          <span style={{ fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 2 }}>
            📍 {record.location}
          </span>
        ) : null}
      </div>

      {/* ===== 行2: 标题 ===== */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        {/* 标题胶带装饰 */}
        {isFirst && (
          <img src={diaryBlueTape} alt="" style={{
            position: 'absolute', left: -6, top: -8, width: 28, height: 28,
            pointerEvents: 'none', zIndex: 1, transform: 'rotate(-5deg)', opacity: 0.7,
          }} />
        )}
        <h2 style={{
          fontFamily: 'EB Garamond, serif', fontSize: viewMode === 'single' ? 22 : 19,
          color: C.brown, fontWeight: 600, margin: '0 0 0 24px',
          letterSpacing: '0.01em',
        }}>
          {record.title}
        </h2>
      </div>

      {/* ===== 行3: 照片 ===== */}
      {record.photos && record.photos.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 10,
          flexDirection: record.photos.length > 1 ? 'row' : 'row',
        }}>
          {record.photos.map((photo, i) => (
            <div key={i} style={{
              flex: record.photos.length > 1 ? 1 : undefined,
              width: record.photos.length === 1 ? (viewMode === 'single' ? '70%' : '60%') : undefined,
              position: 'relative',
            }}>
              {/* 拍立得风格照片 */}
              <div style={{
                background: '#faf7f2', borderRadius: 6, padding: '5px 5px 18px',
                boxShadow: '0 3px 12px rgba(156,66,51,0.10), 0 1px 3px rgba(0,0,0,0.05)',
                transform: i === 0 ? 'rotate(-1.5deg)' : 'rotate(2deg)',
              }}>
                <div style={{
                  borderRadius: 2, overflow: 'hidden', aspectRatio: '4/3',
                  background: '#e8e0d8',
                }}>
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
              {/* 胶带 */}
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: `translateX(-50%) rotate(${i === 0 ? -4 : 3}deg)`,
                width: 26, height: 12, background: 'rgba(252,249,242,0.6)', borderRadius: 2,
                zIndex: 2,
              }} />
            </div>
          ))}
        </div>
      )}

      {/* ===== 行4: 正文 ===== */}
      <p style={{
        fontSize: viewMode === 'single' ? 14 : 13,
        color: C.text, lineHeight: 1.8, margin: '0 0 10px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        letterSpacing: '0.02em',
      }}>
        {record.text}
      </p>

      {/* ===== 行5: 标签 ===== */}
      {record.tags && record.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {record.tags.map(tag => (
            <span key={tag} style={{
              padding: '4px 12px', borderRadius: 12,
              background: C.tagBg, color: C.primary,
              fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif',
              border: '1px solid rgba(156,66,51,0.10)',
            }}>
              # {tag}
            </span>
          ))}
        </div>
      )}

      {/* ===== 装饰贴纸 ===== */}
      {/* 爱心 */}
      <img src={diaryPinkHeart} alt="" style={{
        position: 'absolute', top: 8, right: 12, width: 30, height: 30,
        pointerEvents: 'none', opacity: 0.65, transform: 'rotate(8deg)',
      }} />
      {/* 星星 */}
      <img src={diaryStarSticker} alt="" style={{
        position: 'absolute', bottom: 12, right: 30, width: 22, height: 22,
        pointerEvents: 'none', opacity: 0.5, transform: 'rotate(-12deg)',
      }} />
      {/* 蝴蝶结 (仅第一条) */}
      {isFirst && (
        <img src={diaryBowSticker} alt="" style={{
          position: 'absolute', top: -8, right: 40, width: 24, height: 24,
          pointerEvents: 'none', opacity: 0.6, transform: 'rotate(12deg)',
        }} />
      )}
      {/* 爪印 (仅最后一条) */}
      {isLast && (
        <img src={diaryPawSticker} alt="" style={{
          position: 'absolute', bottom: -4, right: 10, width: 18, height: 18,
          pointerEvents: 'none', opacity: 0.45,
        }} />
      )}
    </div>
  )
}

// ====================== DIARY PAGER ======================
function DiaryPager({ page, totalPages, onPrev, onNext }) {
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
      padding: '6px 18px 10px',
    }}>
      {/* 左侧箭头 */}
      <button onClick={onPrev} disabled={!canPrev} style={{
        ...pagerArrowStyle,
        opacity: canPrev ? 1 : 0.3,
        cursor: canPrev ? 'pointer' : 'default',
      }}>←</button>

      {/* 中间页码便签 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(252,249,242,0.92), rgba(255,245,240,0.88))',
        borderRadius: 20, padding: '10px 24px',
        border: '1px solid rgba(220,192,188,0.25)',
        boxShadow: '0 2px 10px rgba(156,66,51,0.05)',
        display: 'flex', alignItems: 'center', gap: 4,
        transform: 'rotate(-0.5deg)',
      }}>
        {/* 图钉 */}
        <div style={{
          position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, #f0c0b0, ${C.primary})`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }} />
        <span style={{
          fontFamily: 'EB Garamond, serif', fontSize: 20, fontWeight: 600,
          color: C.primary,
        }}>{page}</span>
        <span style={{ fontSize: 13, color: C.light, margin: '0 2px' }}>/</span>
        <span style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 500,
          color: C.light,
        }}>{totalPages}</span>
      </div>

      {/* 右侧箭头 */}
      <button onClick={onNext} disabled={!canNext} style={{
        ...pagerArrowStyle,
        opacity: canNext ? 1 : 0.3,
        cursor: canNext ? 'pointer' : 'default',
      }}>→</button>
    </div>
  )
}

// ===== SHARED STYLES =====
const headerIconBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 12, transition: 'background 0.2s',
}

const dateBadgeStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 10px', borderRadius: 10,
  background: 'rgba(156,66,51,0.06)', color: C.primary,
  fontSize: 12, fontWeight: 500,
  fontFamily: 'Plus Jakarta Sans, sans-serif',
}

const pagerArrowStyle = {
  width: 40, height: 40, borderRadius: '50%',
  border: '1px solid rgba(220,192,188,0.35)',
  background: 'rgba(252,249,242,0.8)',
  fontSize: 18, color: C.primary,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  boxShadow: '0 2px 8px rgba(156,66,51,0.05)',
  transition: 'all 0.2s',
}

const diaryCSS = `
input:focus { outline: none; border-color: ${C.primary} !important; box-shadow: 0 0 0 3px rgba(156,66,51,0.08) !important; }
button:active { transform: scale(0.95) !important; }
`
