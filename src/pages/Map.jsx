import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'

/* ═══ 设计 Token (与 Home 一致) ═══ */
const T = {
  bg: '#f1f5f5', ink: '#2f1d1a', muted: '#7d6460', primary: '#8f3428',
  primarySoft: '#ffd8d1', green: '#5b704f', white: '#fffaf8',
  glass: 'rgba(255,255,255,0.46)', border: 'rgba(255,255,255,0.58)',
  borderWarm: 'rgba(214,154,145,0.36)',
  softShadow: '0 14px 38px rgba(104,45,38,0.10)',
  fontTitle: '"EB Garamond","Noto Serif SC",serif',
  fontBody: '"Plus Jakarta Sans","PingFang SC","Microsoft YaHei",sans-serif',
}

/* ═══ 底部导航 ═══ */
const navItems = [
  { id: 'home', label: '家', icon: '⌂', to: '/' },
  { id: 'memory', label: '记忆', icon: '◫', to: '/gallery' },
  { id: 'map', label: '地图', icon: '⌖', to: '/map' },
]

/* ═══ 用户头像标记（memoized 避免每帧重建） ═══ */
const iconCache = {}
function getOrCreateIcon(avatarUrl, name) {
  const key = avatarUrl || name || 'default'
  if (iconCache[key]) return iconCache[key]
  const initial = (name || '?')[0]
  const imgHtml = avatarUrl
    ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
    : `<span style="font-size:16px;font-weight:700;color:#8f3428">${initial}</span>`
  const icon = new L.DivIcon({
    className: '',
    html: `<div style="width:40px;height:40px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;border:3px solid #8f3428;box-shadow:0 4px 16px rgba(143,52,40,0.30);overflow:hidden">${imgHtml}</div>`,
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24],
  })
  iconCache[key] = icon
  return icon
}

/* ═══ Geocode 缓存（localStorage 持久化，含失败缓存） ═══ */
function geoCacheKey(query) {
  const normalized = query.trim().replace(/\s+/g, ' ').slice(0, 80)
  return `geo_v2_${normalized}`
}
function readGeoCache(query) {
  try {
    const raw = localStorage.getItem(geoCacheKey(query))
    if (!raw) return null
    const entry = JSON.parse(raw)
    // 失败缓存 24h 过期，成功缓存永不过期
    if (entry.lat === null && Date.now() - entry.ts > 86400000) {
      localStorage.removeItem(geoCacheKey(query))
      return null
    }
    return entry.lat === null ? null : entry
  } catch { return null }
}
function writeGeoCache(query, result) {
  try {
    localStorage.setItem(geoCacheKey(query), JSON.stringify({ ...result, ts: Date.now() }))
  } catch {}
}

/* ═══ Nominatim geocode（2次重试 + 缓存） ═══ */
async function geocodeOnce(query) {
  const cached = readGeoCache(query)
  if (cached !== undefined && cached !== null) return cached
  // 检查是否之前失败过（24h内不重试）
  const failKey = geoCacheKey(query)
  const failEntry = localStorage.getItem(failKey) ? JSON.parse(localStorage.getItem(failKey)) : null
  if (failEntry?.lat === null && Date.now() - failEntry?.ts < 86400000) return null

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=zh`)
    const data = await res.json()
    if (data[0]) {
      const r = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      writeGeoCache(query, r)
      return r
    }
  } catch {}
  // 短地址重试
  const parts = query.split(/[,，·\s]+/).filter(Boolean)
  if (parts.length > 1) {
    const short = parts.slice(0, 3).join(' ')
    if (short !== query) {
      try {
        await new Promise(r => setTimeout(r, 300))
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(short)}&limit=1&accept-language=zh`)
        const data = await res.json()
        if (data[0]) {
          const r = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
          writeGeoCache(query, r)
          return r
        }
      } catch {}
    }
  }
  // 缓存失败结果
  writeGeoCache(query, { lat: null, lng: null })
  return null
}

/* ═══ MapResizeHandler — 容器尺寸变化时 invalidateSize ═══ */
function MapResizeHandler({ panelOpen }) {
  const map = useMap()
  const prevOpen = useRef(panelOpen)
  useEffect(() => {
    // 首次挂载后刷新尺寸
    const t = setTimeout(() => map.invalidateSize(), 100)
    // ResizeObserver
    const container = map.getContainer()
    const ro = new ResizeObserver(() => { map.invalidateSize() })
    if (container) ro.observe(container)
    return () => { clearTimeout(t); ro.disconnect() }
  }, [])
  useEffect(() => {
    if (prevOpen.current !== panelOpen) {
      prevOpen.current = panelOpen
      setTimeout(() => map.invalidateSize(), 350) // 等面板动画结束
    }
  }, [panelOpen])
  return null
}

/* ═══ TileLayer with fallback ═══ */
function SafeTileLayer() {
  const handleError = useCallback((e) => {
    // Carto 瓦片失败时静默处理（浏览器会自动重试）
  }, [])
  return (
    <TileLayer
      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      maxNativeZoom={19}
      keepBuffer={6}
      updateWhenZooming={false}
      eventHandlers={{ tileerror: handleError }}
    />
  )
}

/* ═══ 主组件 ═══ */
export default function MapPage() {
  const navigate = useNavigate()
  const myName = localStorage.getItem('my_name') || ''
  const myAvatar = localStorage.getItem('my_avatar') || null
  const partnerAvatar = localStorage.getItem('partner_avatar') || null

  const [markers, setMarkers] = useState([])
  const [unknownLocs, setUnknownLocs] = useState([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [geocoding, setGeocoding] = useState(0)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const cancelRef = useRef(false)
  const batchRef = useRef([])
  const batchTimerRef = useRef(null)

  // 初始化加载
  useEffect(() => {
    cancelRef.current = false
    loadData()
    return () => { cancelRef.current = true; clearTimeout(batchTimerRef.current) }
  }, [])

  async function loadData() {
    const roomCode = localStorage.getItem('room_code')
    if (!roomCode) return

    try {
      const { data } = await supabase.from('memories')
        .select('id,title,content,location,author,coordinates,created_at')
        .eq('room_code', roomCode)
        .not('location', 'is', null)
        .order('created_at', { ascending: false })

      if (cancelRef.current || !data?.length) return

      // 按地点分组
      const locMap = new Map()
      data.forEach(m => {
        const loc = m.location.trim()
        if (!loc) return
        if (!locMap.has(loc)) locMap.set(loc, [])
        locMap.get(loc).push(m)
      })

      // 有坐标 → 立即显示
      const withCoord = []
      const withoutCoord = []
      locMap.forEach((mems, loc) => {
        const m = mems.find(x => x.coordinates?.lat)
        if (m) withCoord.push({ location: loc, lat: m.coordinates.lat, lng: m.coordinates.lng, memories: mems })
        else withoutCoord.push({ location: loc, memories: mems })
      })

      setMarkers(withCoord)
      setUnknownLocs(withoutCoord)

      // 后台 geocode（低优先级、分批、可取消）
      if (withoutCoord.length > 0) {
        setGeocoding(withoutCoord.length)
        const queue = [...withoutCoord]
        const resolved = []

        for (let i = 0; i < queue.length; i++) {
          if (cancelRef.current) break
          const item = queue[i]
          const coord = await geocodeOnce(item.location)
          if (cancelRef.current) break

          if (coord) {
            resolved.push({ ...item, lat: coord.lat, lng: coord.lng })
          }

          // 每 3 个或最后一批才更新一次 state
          if (resolved.length >= 3 || i === queue.length - 1) {
            if (resolved.length > 0) {
              setMarkers(prev => [...prev, ...resolved])
              resolved.length = 0
            }
            setGeocoding(queue.length - i - 1)
            setUnknownLocs(prev => prev.slice(resolved.length + 1))
          }

          // 限速 400ms
          if (i < queue.length - 1) await new Promise(r => setTimeout(r, 400))
        }
      }
    } catch { /* silent */ }
  }

  // Memoized 值
  const validMarkers = useMemo(() => markers.filter(m => m.lat != null), [markers])

  function getIcon(marker) {
    const author = marker.memories?.[0]?.author || ''
    const avatar = author === myName ? myAvatar : partnerAvatar
    return getOrCreateIcon(avatar, author)
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: T.fontBody }}>
      {/* ═══ Header ═══ */}
      <header style={{
        background: 'rgba(251,251,248,0.72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.34)', zIndex: 20, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: T.primary, cursor: 'pointer', fontSize: 16, fontFamily: T.fontBody }}>←</button>
          <h1 style={{ fontFamily: T.fontTitle, fontSize: 20, color: T.ink, fontWeight: 600, margin: 0 }}>足迹地图</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {geocoding > 0 && <span style={{ fontSize: 11, color: T.muted }}>解析中...</span>}
          <button onClick={() => setPanelOpen(!panelOpen)}
            style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.fontBody, boxShadow: '0 2px 8px rgba(143,52,40,0.22)' }}>
            {panelOpen ? '收起' : `${validMarkers.length + unknownLocs.length} 个足迹`}
          </button>
        </div>
      </header>

      {/* ═══ 地图（无动态 key，避免重挂载） ═══ */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[35, 105]} zoom={5} style={{ width: '100%', height: '100%' }} zoomControl={true}>
          <SafeTileLayer />
          <MapResizeHandler panelOpen={panelOpen} />

          {validMarkers.map((g, i) => (
            <Marker key={g.location || i} position={[g.lat, g.lng]} icon={getIcon(g)}
              eventHandlers={{ click: () => setSelectedMarker(g) }}>
              <Popup maxWidth={240} minWidth={180}>
                <div style={{ fontFamily: T.fontBody, padding: 4 }}>
                  <p style={{ fontFamily: T.fontTitle, fontSize: 16, color: T.ink, margin: '0 0 6px', fontWeight: 600 }}>
                    📍 {(g.location || '').slice(0, 20)}
                  </p>
                  <p style={{ fontSize: 12, color: T.muted, margin: '0 0 8px' }}>{g.memories?.length || 0} 条记忆</p>
                  {(g.memories || []).slice(0, 3).map(m => (
                    <div key={m.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title || '无标题'}</p>
                        <p style={{ fontSize: 11, color: T.muted, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{(m.content || '').slice(0, 60)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* ═══ 顶部浮动足迹面板 ═══ */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          maxHeight: panelOpen ? '50%' : '0', overflow: 'hidden', transition: 'max-height 0.35s ease',
        }}>
          <div style={{ background: 'rgba(255,250,248,0.96)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${T.borderWarm}`, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, boxShadow: T.softShadow, maxHeight: '50vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: T.fontTitle, fontSize: 17, color: T.ink, margin: 0 }}>足迹列表</h2>
                <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>{validMarkers.length} 定位 · {unknownLocs.length} 待解析</p>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'rgba(143,52,40,0.08)', border: 'none', borderRadius: 10, padding: '4px 12px', cursor: 'pointer', fontSize: 11, color: T.muted, fontFamily: T.fontBody }}>收起</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 14px 12px' }}>
              {validMarkers.length === 0 && unknownLocs.length === 0 ? (
                <p style={{ textAlign: 'center', color: T.muted, fontSize: 13, padding: 36 }}>还没有带地点的回忆</p>
              ) : (
                <>
                  {validMarkers.map((g, i) => (
                    <div key={i} onClick={() => { setSelectedMarker(g); setPanelOpen(false) }}
                      style={{ padding: '10px 12px', borderRadius: 14, cursor: 'pointer', marginBottom: 6, background: selectedMarker?.lat === g.lat ? T.primarySoft : 'rgba(255,255,255,0.7)', border: `1px solid ${selectedMarker?.lat === g.lat ? T.borderWarm : 'rgba(0,0,0,0.04)'}`, transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontFamily: T.fontTitle, fontSize: 14, color: T.ink, margin: 0 }}>{(g.location || '').slice(0, 22)}</h4>
                        <span style={{ fontSize: 11, color: T.primary, fontWeight: 600 }}>{g.memories?.length || 0}条</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {(g.memories || []).slice(0, 3).map(m => (
                          <span key={m.id} style={{ fontSize: 10, color: T.muted, background: 'rgba(143,52,40,0.04)', padding: '2px 6px', borderRadius: 6, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {unknownLocs.map((g, i) => (
                    <div key={`unk-${i}`} style={{ padding: '8px 12px', borderRadius: 12, marginBottom: 4, opacity: 0.5, border: '1px dashed rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.3)' }}>
                      <span style={{ fontSize: 12, color: T.muted }}>📍 {(g.location || '').slice(0, 26)}</span>
                      <span style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>待解析 · {g.memories?.length || 0}条</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 底部导航 ═══ */}
      <nav style={{
        position: 'fixed', left: '50%', bottom: 'calc(34px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)', width: 'min(calc(100% - 44px), 356px)', height: 58,
        zIndex: 9999, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 5,
        borderRadius: 999, border: `1px solid ${T.border}`,
        background: 'rgba(255,255,255,0.48)', backdropFilter: 'blur(28px) saturate(1.45)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.45)',
        boxShadow: '0 18px 48px rgba(104,45,38,0.18), inset 0 1px 0 rgba(255,255,255,0.70)',
      }}>
        {navItems.map(item => {
          const active = item.id === 'map'
          return (
            <button key={item.id} onClick={() => navigate(item.to)} style={{
              border: 'none', borderRadius: 999, background: 'transparent', color: active ? T.primary : T.muted,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2, fontFamily: T.fontBody, fontSize: 12, fontWeight: 800,
            }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 22 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
