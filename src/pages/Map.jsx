import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import AppIcon from '../components/AppIcon'
import { getCached, setCached } from '../lib/cache'
import { unpackMemoryContent } from '../lib/audioMemory'
import { canonicalRoom, fetchRoomRows, loadRoomProfile } from '../lib/roomProfile'
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
  { id: 'home', label: '家', icon: 'home', to: '/' },
  { id: 'memory', label: '记忆', icon: 'memory', to: '/gallery' },
  { id: 'map', label: '地图', icon: 'map', to: '/map' },
]

/* ═══ 用户头像标记（memoized 避免每帧重建） ═══ */
const iconCache = {}
function getOrCreateIcon(avatarUrl, name, active = false) {
  const key = `${avatarUrl || name || 'default'}_${active ? 'active' : 'idle'}`
  if (iconCache[key]) return iconCache[key]
  const initial = (name || '?')[0]
  const imgHtml = avatarUrl
    ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
    : `<span style="font-size:16px;font-weight:700;color:#8f3428">${initial}</span>`
  const icon = new L.DivIcon({
    className: '',
    html: `<div style="width:${active ? 50 : 42}px;height:${active ? 50 : 42}px;border-radius:50%;background:rgba(255,255,255,0.86);display:flex;align-items:center;justify-content:center;border:${active ? 4 : 3}px solid #8f3428;box-shadow:0 10px 26px rgba(143,52,40,0.32),0 0 0 9px rgba(143,52,40,0.10);overflow:hidden;backdrop-filter:blur(10px)">${imgHtml}</div>`,
    iconSize: [active ? 50 : 42, active ? 50 : 42], iconAnchor: [active ? 25 : 21, active ? 25 : 21], popupAnchor: [0, -28],
  })
  iconCache[key] = icon
  return icon
}

function normalizeCoordinates(coords) {
  if (!coords) return null
  if (typeof coords === 'string') {
    try { return normalizeCoordinates(JSON.parse(coords)) } catch { return null }
  }
  const lat = Number(coords.lat ?? coords.latitude)
  const lng = Number(coords.lng ?? coords.lon ?? coords.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function normalizeMemory(memory) {
  const parsed = unpackMemoryContent(memory.content || '')
  return {
    ...memory,
    content: parsed.text,
    audioUrl: parsed.audioUrl,
    coordinates: normalizeCoordinates(memory.coordinates),
    image_urls: Array.isArray(memory.image_urls) ? memory.image_urls : [],
  }
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
  } catch {
    return null
  }
}
function writeGeoCache(query, result) {
  try {
    localStorage.setItem(geoCacheKey(query), JSON.stringify({ ...result, ts: Date.now() }))
  } catch {
    // localStorage can be unavailable in private browsing.
  }
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
  } catch {
    // Network geocoding can fail; the location stays in the pending list.
  }
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
      } catch {
        // Keep the original location in the pending list.
      }
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
  }, [map])
  useEffect(() => {
    if (prevOpen.current !== panelOpen) {
      prevOpen.current = panelOpen
      setTimeout(() => map.invalidateSize(), 350) // 等面板动画结束
    }
  }, [map, panelOpen])
  return null
}

function FitMarkers({ markers, selectedMarker }) {
  const map = useMap()
  useEffect(() => {
    if (selectedMarker?.lat != null) {
      map.flyTo([selectedMarker.lat, selectedMarker.lng], Math.max(map.getZoom(), 13), { duration: 0.65 })
      return
    }
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 12)
      return
    }
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { paddingTopLeft: [44, 96], paddingBottomRight: [44, 190], maxZoom: 12 })
    }
  }, [map, markers, selectedMarker])
  return null
}

/* ═══ TileLayer with fallback ═══ */
function SafeTileLayer() {
  const handleError = useCallback(() => {
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

function SelectedPlaceCard({ marker, onClose }) {
  const first = marker.memories?.[0] || {}
  const photo = first.image_urls?.[0]
  return (
    <section style={{
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 'calc(108px + env(safe-area-inset-bottom))',
      zIndex: 6300,
      borderRadius: 28,
      border: `1.5px solid ${T.border}`,
      background: 'linear-gradient(145deg, rgba(255,255,255,0.82), rgba(255,255,255,0.40) 54%, rgba(207,229,234,0.28))',
      backdropFilter: 'blur(30px) saturate(1.45)',
      WebkitBackdropFilter: 'blur(30px) saturate(1.45)',
      boxShadow: '0 24px 58px rgba(64,80,86,0.22), inset 0 1px 0 rgba(255,255,255,0.86)',
      padding: 12,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: photo ? '82px 1fr 28px' : '1fr 28px', gap: 10, alignItems: 'start' }}>
        {photo && (
          <img src={photo} alt="" style={{ width: 82, height: 82, borderRadius: 18, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.72)' }} />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary, boxShadow: '0 0 0 5px rgba(143,52,40,0.10)' }} />
            <span style={{ color: T.sage, fontSize: 11, fontWeight: 900 }}>已标注在地图上</span>
          </div>
          <h2 style={{ margin: 0, color: T.primary, fontFamily: T.fontTitle, fontSize: 22, lineHeight: '25px', fontWeight: 760 }}>
            {first.title || '这里的回忆'}
          </h2>
          <p style={{ margin: '4px 0 0', color: T.muted, fontSize: 11, lineHeight: '16px', fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name="map" size={13} /> {marker.location}</span>
          </p>
          {first.content && (
            <p style={{ margin: '6px 0 0', color: T.ink, fontSize: 12, lineHeight: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {first.content}
            </p>
          )}
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.48)', color: T.muted, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><AppIcon name="close" size={15} /></button>
      </div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingTop: 9 }}>
        {(marker.memories || []).map(memory => (
          <div key={memory.id} style={{
            flex: '0 0 auto',
            maxWidth: 156,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.68)',
            background: 'rgba(255,255,255,0.42)',
            color: T.muted,
            padding: '6px 10px',
            fontSize: 10,
            fontWeight: 850,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {memory.audioUrl ? <AppIcon name="mic" size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 3 }} /> : null}{memory.title || '一条记忆'}
          </div>
        ))}
      </div>
      {first.audioUrl && (
        <div style={{ marginTop: 8, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.44)', border: `1px solid ${T.border}` }}>
          <audio controls src={first.audioUrl} style={{ width: '100%', height: 32 }} />
        </div>
      )}
    </section>
  )
}

const glassIconButtonStyle = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.58)',
  color: T.primary,
  fontFamily: T.fontBody,
  fontSize: 24,
  fontWeight: 900,
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: T.softShadow,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}

const glassSmallButtonStyle = {
  border: `1px solid ${T.border}`,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.64)',
  color: T.primary,
  padding: '9px 12px',
  fontFamily: T.fontBody,
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: T.softShadow,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}

const statPillStyle = {
  minHeight: 46,
  borderRadius: 18,
  border: `1px solid ${T.border}`,
  background: 'linear-gradient(145deg, rgba(255,255,255,0.74), rgba(207,229,234,0.30))',
  backdropFilter: 'blur(22px) saturate(1.35)',
  WebkitBackdropFilter: 'blur(22px) saturate(1.35)',
  boxShadow: T.softShadow,
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  color: T.primary,
  fontSize: 10,
  fontWeight: 900,
}

/* ═══ 主组件 ═══ */
export default function MapPage() {
  const navigate = useNavigate()
  const roomCode = canonicalRoom(localStorage.getItem('room_code'))
  const profile = loadRoomProfile(roomCode)
  const myName = profile.myName || ''
  const myAvatar = profile.myAvatar || null
  const partnerAvatar = profile.partnerAvatar || null

  const [markers, setMarkers] = useState([])
  const [unknownLocs, setUnknownLocs] = useState([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(0)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const cancelRef = useRef(false)

  async function loadData() {
    if (!roomCode) return

    try {
      const cached = (getCached('memories') || []).map(normalizeMemory).filter(m => m.location)
      if (cached.length) groupMemories(cached)
      const data = await fetchRoomRows(
        () => supabase.from('memories')
          .select('id,title,content,location,author,coordinates,created_at,image_urls,room_code')
          .not('location', 'is', null)
          .order('created_at', { ascending: false }),
        roomCode
      )

      if (cancelRef.current) return
      const next = (data || []).map(normalizeMemory).filter(m => m.location)
      if (next.length) {
        groupMemories(next)
        setCached('memories', data || [])
      } else if (!cached.length) {
        setMarkers([])
        setUnknownLocs([])
      }
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  function groupMemories(memories) {
    const locMap = new Map()
    memories.forEach(m => {
      const loc = (m.location || '').trim()
      if (!loc) return
      if (!locMap.has(loc)) locMap.set(loc, [])
      locMap.get(loc).push(m)
    })

    const withCoord = []
    const withoutCoord = []
    locMap.forEach((mems, loc) => {
      const m = mems.find(x => x.coordinates?.lat != null)
      if (m) withCoord.push({ location: loc, lat: m.coordinates.lat, lng: m.coordinates.lng, memories: mems })
      else withoutCoord.push({ location: loc, memories: mems })
    })

    setMarkers(withCoord)
    setUnknownLocs(withoutCoord)
    if (withCoord[0]) setSelectedMarker(prev => prev || withCoord[0])
    if (withoutCoord.length) geocodeLocations(withoutCoord)
  }

  async function geocodeLocations(items) {
    setGeocoding(items.length)
    for (let i = 0; i < items.length; i += 1) {
      if (cancelRef.current) break
      const item = items[i]
      const coord = await geocodeOnce(item.location)
      if (cancelRef.current) break

      if (coord?.lat != null) {
        const resolved = { ...item, lat: coord.lat, lng: coord.lng }
        setMarkers(prev => prev.some(m => m.location === resolved.location) ? prev : [...prev, resolved])
        setUnknownLocs(prev => prev.filter(m => m.location !== resolved.location))
      }
      setGeocoding(items.length - i - 1)
      if (i < items.length - 1) await new Promise(r => setTimeout(r, 450))
    }
  }

  // 初始化加载
  useEffect(() => {
    cancelRef.current = false
    Promise.resolve().then(loadData)
    return () => { cancelRef.current = true }
    // loadData reads localStorage and is only needed for this page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Memoized 值
  const validMarkers = useMemo(() => markers.filter(m => m.lat != null), [markers])
  const stats = useMemo(() => ({
    places: validMarkers.length,
    memories: validMarkers.reduce((sum, item) => sum + (item.memories?.length || 0), 0) + unknownLocs.reduce((sum, item) => sum + (item.memories?.length || 0), 0),
    pending: unknownLocs.length,
  }), [validMarkers, unknownLocs])

  function getIcon(marker) {
    const author = marker.memories?.[0]?.author || ''
    const avatar = author === myName ? myAvatar : partnerAvatar
    return getOrCreateIcon(avatar, author, selectedMarker?.location === marker.location)
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: T.fontBody, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 18% 8%, rgba(255,255,255,0.78), transparent 30%), radial-gradient(circle at 92% 20%, rgba(185,215,223,0.42), transparent 32%), linear-gradient(180deg, rgba(244,250,250,0.46), rgba(255,242,238,0.32))',
      }} />

      <header style={{
        position: 'fixed',
        top: 'calc(12px + env(safe-area-inset-top))',
        left: 14,
        right: 14,
        zIndex: 9000,
        display: 'grid',
        gridTemplateColumns: '44px 1fr 44px',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}>
        <button onClick={() => navigate('/')} style={{ ...glassIconButtonStyle, pointerEvents: 'auto' }}><AppIcon name="back" size={22} /></button>
        <div style={{
          justifySelf: 'center',
          border: `1px solid ${T.border}`,
          background: 'rgba(255,255,255,0.58)',
          backdropFilter: 'blur(24px) saturate(1.35)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.35)',
          borderRadius: 999,
          padding: '8px 16px',
          boxShadow: T.softShadow,
          textAlign: 'center',
          pointerEvents: 'auto',
        }}>
          <h1 style={{ fontFamily: T.fontTitle, fontSize: 20, lineHeight: '22px', color: T.primary, fontWeight: 760, margin: 0 }}>足迹地图</h1>
          <p style={{ margin: '1px 0 0', color: T.muted, fontSize: 10, fontWeight: 800 }}>{stats.memories} 个回忆 · {stats.places} 个地点</p>
        </div>
        <button onClick={() => navigate('/new')} style={{ ...glassIconButtonStyle, pointerEvents: 'auto', color: '#fff', background: T.primary }}><AppIcon name="plus" size={22} /></button>
      </header>

      {/* ═══ 地图（无动态 key，避免重挂载） ═══ */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <MapContainer center={[35, 105]} zoom={5} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <SafeTileLayer />
          <MapResizeHandler panelOpen={panelOpen} />
          <FitMarkers markers={validMarkers} selectedMarker={selectedMarker} />

          {validMarkers.map((g, i) => (
            <Marker key={g.location || i} position={[g.lat, g.lng]} icon={getIcon(g)}
              eventHandlers={{ click: () => setSelectedMarker(g) }}>
              <Popup maxWidth={240} minWidth={180}>
                <div style={{ fontFamily: T.fontBody, padding: 4 }}>
                  <p style={{ fontFamily: T.fontTitle, fontSize: 16, color: T.ink, margin: '0 0 6px', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name="map" size={15} /> {(g.location || '').slice(0, 20)}</span>
                  </p>
                  <p style={{ fontSize: 12, color: T.muted, margin: '0 0 8px' }}>{g.memories?.length || 0} 条记忆</p>
                  {(g.memories || []).slice(0, 3).map(m => (
                    <div key={m.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title || '无标题'}</p>
                        <p style={{ fontSize: 11, color: T.muted, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{(m.content || '有一段回忆留在这里').slice(0, 60)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: 'calc(88px + env(safe-area-inset-top))',
          zIndex: 6200,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 8,
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, pointerEvents: 'auto' }}>
            {[
              ['地点', stats.places],
              ['记忆', stats.memories],
              ['待定位', stats.pending],
            ].map(([label, value]) => (
              <div key={label} style={statPillStyle}>
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setPanelOpen(!panelOpen)}
            style={{ ...glassSmallButtonStyle, pointerEvents: 'auto' }}>
            {panelOpen ? '收起' : '列表'}
          </button>
        </div>

        {loading && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '48%',
            transform: 'translate(-50%, -50%)',
            zIndex: 25,
            borderRadius: 999,
            padding: '10px 16px',
            color: T.primary,
            fontSize: 12,
            fontWeight: 900,
            background: 'rgba(255,255,255,0.66)',
            border: `1px solid ${T.border}`,
            backdropFilter: 'blur(20px)',
          }}>正在读取足迹...</div>
        )}

        {selectedMarker && (
          <SelectedPlaceCard marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
        )}

        {/* ═══ 顶部浮动足迹面板 ═══ */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 7000,
          maxHeight: panelOpen ? '62%' : '0', overflow: 'hidden', transition: 'max-height 0.35s ease',
        }}>
          <div style={{ background: 'rgba(255,250,248,0.78)', backdropFilter: 'blur(26px) saturate(1.35)', WebkitBackdropFilter: 'blur(26px) saturate(1.35)', borderBottom: `1px solid ${T.border}`, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, boxShadow: T.softShadow, maxHeight: '62vh', display: 'flex', flexDirection: 'column', paddingTop: 'calc(82px + env(safe-area-inset-top))' }}>
            <div style={{ padding: '10px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: T.fontTitle, fontSize: 17, color: T.ink, margin: 0 }}>足迹列表</h2>
                <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>{validMarkers.length} 已标注 · {unknownLocs.length} 待定位 {geocoding > 0 ? `· 解析中 ${geocoding}` : ''}</p>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'rgba(143,52,40,0.08)', border: 'none', borderRadius: 10, padding: '4px 12px', cursor: 'pointer', fontSize: 11, color: T.muted, fontFamily: T.fontBody }}>收起</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 14px 12px' }}>
              {validMarkers.length === 0 && unknownLocs.length === 0 ? (
                <p style={{ textAlign: 'center', color: T.muted, fontSize: 13, padding: 36 }}>还没有带地点的回忆</p>
              ) : (
                <>
                  {validMarkers.map((g, i) => (
                    <div key={g.location || i} onClick={() => { setSelectedMarker(g); setPanelOpen(false) }}
                      style={{ padding: '10px 12px', borderRadius: 14, cursor: 'pointer', marginBottom: 6, background: selectedMarker?.lat === g.lat ? T.primarySoft : 'rgba(255,255,255,0.7)', border: `1px solid ${selectedMarker?.lat === g.lat ? T.borderWarm : 'rgba(0,0,0,0.04)'}`, transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontFamily: T.fontTitle, fontSize: 14, color: T.ink, margin: 0 }}>{(g.location || '').slice(0, 22)}</h4>
                        <span style={{ fontSize: 11, color: T.primary, fontWeight: 800 }}>已标注 · {g.memories?.length || 0}条</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {(g.memories || []).slice(0, 3).map(m => (
                          <span key={m.id} style={{ fontSize: 10, color: T.muted, background: 'rgba(143,52,40,0.04)', padding: '2px 6px', borderRadius: 6, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {unknownLocs.map((g, i) => (
                    <div key={`unk-${g.location || i}`} style={{ padding: '8px 12px', borderRadius: 12, marginBottom: 4, opacity: 0.72, border: '1px dashed rgba(143,52,40,0.18)', background: 'rgba(255,255,255,0.40)' }}>
                      <span style={{ fontSize: 12, color: T.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name="map" size={13} /> {(g.location || '').slice(0, 26)}</span>
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
        borderRadius: 999, border: '1px solid rgba(255,255,255,0.46)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.42), rgba(255,255,255,0.16) 54%, rgba(185,215,223,0.24)), rgba(255,255,255,0.18)', backdropFilter: 'blur(34px) saturate(1.48)',
        WebkitBackdropFilter: 'blur(34px) saturate(1.48)',
        boxShadow: '0 18px 46px rgba(64,80,86,0.18), inset 0 1px 0 rgba(255,255,255,0.66), inset 0 -1px 0 rgba(255,255,255,0.16)',
      }}>
        {navItems.map(item => {
          const active = item.id === 'map'
          return (
            <button key={item.id} onClick={() => navigate(item.to)} style={{
              border: 'none', borderRadius: 999, background: 'transparent', color: active ? T.primary : 'rgba(65,58,56,0.76)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 0, fontFamily: T.fontBody, fontSize: 12, fontWeight: 800,
            }}>
              <span style={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 22, background: active ? 'rgba(255,255,255,0.46)' : 'rgba(255,255,255,0.16)', boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.70), 0 10px 20px rgba(104,45,38,0.12)' : 'inset 0 1px 0 rgba(255,255,255,0.30)' }}>
                <AppIcon name={item.icon} size={30} active={active} strokeWidth={1.75} />
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
