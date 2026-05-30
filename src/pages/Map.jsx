import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { getCached, setCached, getVersion, isStale } from '../lib/cache'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'

/* ═══ 与 Home.jsx 一致的设计 token ═══ */
const T = {
  bg: '#f1f5f5', ink: '#2f1d1a', muted: '#7d6460', primary: '#8f3428',
  primarySoft: '#ffd8d1', green: '#5b704f', white: '#fffaf8',
  glass: 'rgba(255,255,255,0.46)', glassStrong: 'rgba(255,255,255,0.68)',
  border: 'rgba(255,255,255,0.58)', borderWarm: 'rgba(214,154,145,0.36)',
  shadow: '0 24px 70px rgba(104,45,38,0.16)', softShadow: '0 14px 38px rgba(104,45,38,0.10)',
  fontTitle: '"EB Garamond","Noto Serif SC",serif',
  fontBody: '"Plus Jakarta Sans","PingFang SC","Microsoft YaHei",sans-serif',
}

/* ═══ 用户头像标记 ═══ */
function createAvatarIcon(avatarUrl, name) {
  const initial = (name || '?')[0]
  const img = avatarUrl ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>` : `<span style="font-size:16px;font-weight:700;color:#8f3428">${initial}</span>`
  return new L.DivIcon({
    className: '',
    html: `<div style="width:40px;height:40px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;border:3px solid #8f3428;box-shadow:0 4px 16px rgba(143,52,40,0.30);overflow:hidden">${img}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  })
}
const defaultIcon = createAvatarIcon(null, '?')

/* ═══ 地图初始化：自动缩放到包含所有标记的最高视角 ═══ */
function FitBoundsOnLoad({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14, { animate: false })
      return
    }
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: false })
  }, [])
  return null
}

/* ═══ 底部导航 ═══ */
const navItems = [
  { id: 'home', label: '家', icon: '⌂', to: '/' },
  { id: 'memory', label: '记忆', icon: '◫', to: '/gallery' },
  { id: 'map', label: '地图', icon: '⌖', to: '/map' },
]

function BottomNav({ navigate }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center',
      padding: '0 20px max(14px, env(safe-area-inset-bottom))',
    }}>
      <div style={{
        width: '100%', maxWidth: 390, display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: T.white, borderRadius: 20, padding: '10px 12px',
        boxShadow: T.softShadow, border: `1px solid ${T.border}`,
      }}>
        {navItems.map(item => {
          const active = item.id === 'map'
          return (
            <button key={item.id} onClick={() => item.to && navigate(item.to)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: active ? T.primarySoft : 'transparent', border: 'none',
              cursor: 'pointer', padding: '8px 16px', borderRadius: 14,
              color: active ? T.primary : T.muted, fontFamily: T.fontBody, fontSize: 11,
              fontWeight: active ? 700 : 500, transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ═══ 主组件 ═══ */
export default function MapPage() {
  const navigate = useNavigate()
  const myName = localStorage.getItem('my_name') || ''
  const myAvatar = localStorage.getItem('my_avatar') || null
  const partnerAvatar = localStorage.getItem('partner_avatar') || null

  const [markers, setMarkers] = useState(() => {
    const rc = localStorage.getItem('room_code')
    return rc ? readJson(`geo_cache_v1_${rc}`, []) : []
  })
  const [panelOpen, setPanelOpen] = useState(false)
  const [geocoding, setGeocoding] = useState(0)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const panelKeyRef = useRef(0)

  const [cacheVersion] = useState(() => getVersion())

  const fetchData = useCallback(async () => {
    const roomCode = localStorage.getItem('room_code')
    if (!roomCode) return

    // 1. 读缓存立即显示
    const cached = getCached('geo_markers')
    if (cached?.length) setMarkers(cached)

    // 2. 缓存没过期就跳过
    if (cached && !isStale(cacheVersion)) return

    try {
      const { data } = await supabase.from('memories').select('*').eq('room_code', roomCode).order('created_at', { ascending: false })
      if (!data?.length) return

      // 按地点分组：每个地点取所有记忆 + 优先使用存储坐标
      const locMap = new Map()
      data.forEach(m => {
        if (!m.location) return
        if (!locMap.has(m.location)) locMap.set(m.location, [])
        locMap.get(m.location).push(m)
      })

      const results = []
      const needGeocode = []

      locMap.forEach((mems, loc) => {
        const withCoord = mems.find(m => m.coordinates?.lat)
        if (withCoord) {
          results.push({ location: loc, lat: withCoord.coordinates.lat, lng: withCoord.coordinates.lng, memories: mems })
        } else {
          needGeocode.push({ loc, mems })
        }
      })

      // 立即显示有坐标的
      if (results.length > 0) {
        setMarkers(results)
        setCached('geo_markers', results)
      }

      // 后台 geocode 无坐标的地点，300ms 间隔加速
      if (needGeocode.length > 0) {
        setGeocoding(needGeocode.length)
        for (let i = 0; i < needGeocode.length; i++) {
          const { loc, mems } = needGeocode[i]
          try {
            const coord = await geocode(loc)
            results.push({ location: loc, lat: coord?.lat || null, lng: coord?.lng || null, memories: mems })
          } catch {
            results.push({ location: loc, lat: null, lng: null, memories: mems })
          }
          setMarkers([...results])
          setCached('geo_markers', [...results])
          setGeocoding(needGeocode.length - i - 1)
          if (i < needGeocode.length - 1) await new Promise(r => setTimeout(r, 300))
        }
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function geocode(query) {
    const ck = `geo_${query}`
    const cached = sessionStorage.getItem(ck)
    if (cached) return JSON.parse(cached)

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=zh`)
    const data = await res.json()
    if (data[0]) {
      const r = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      sessionStorage.setItem(ck, JSON.stringify(r))
      return r
    }
    // 短地址重试
    const short = query.split(/[,，·\s]+/).slice(0, 3).join(' ')
    if (short !== query) {
      await new Promise(r => setTimeout(r, 200))
      const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(short)}&limit=1&accept-language=zh`)
      const data2 = await res2.json()
      if (data2[0]) {
        const r = { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) }
        sessionStorage.setItem(ck, JSON.stringify(r))
        return r
      }
    }
    return null
  }

  const validMarkers = markers.filter(m => m.lat !== null)
  const unknownCount = markers.filter(m => m.lat === null).length

  // 选择记忆的作者头像作为标记
  function getMarkerIcon(marker) {
    const firstMem = marker.memories[0]
    const author = firstMem?.author || ''
    if (author === myName && myAvatar) return createAvatarIcon(myAvatar, author)
    if (author !== myName && partnerAvatar) return createAvatarIcon(partnerAvatar, author)
    return defaultIcon
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: T.fontBody, paddingBottom: 80 }}>
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
          <button onClick={() => { setPanelOpen(!panelOpen); if (!panelOpen) panelKeyRef.current++ }}
            style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.fontBody, boxShadow: '0 2px 8px rgba(143,52,40,0.22)' }}>
            {panelOpen ? '收起' : `${validMarkers.length + unknownCount} 个足迹`}
          </button>
        </div>
      </header>

      {/* ═══ 地图 ═══ */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[35, 105]} zoom={5} style={{ width: '100%', height: '100%' }} zoomControl={true} key={`map-${panelKeyRef.current}`}>
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxNativeZoom={19}
            keepBuffer={4}
          />
          {/* 初始化时自动缩放至包含所有标记 */}
          <FitBoundsOnLoad markers={validMarkers} />

          {/* 渲染所有标记 */}
          {validMarkers.map((g, i) => (
            <Marker key={i} position={[g.lat, g.lng]} icon={getMarkerIcon(g)}
              eventHandlers={{ click: () => setSelectedMarker(g) }}>
              <Popup maxWidth={240} minWidth={180}>
                <div style={{ fontFamily: T.fontBody, padding: 4 }}>
                  <p style={{ fontFamily: T.fontTitle, fontSize: 16, color: T.ink, margin: '0 0 6px', fontWeight: 600 }}>
                    📍 {g.location.length > 20 ? g.location.slice(0, 20) + '...' : g.location}
                  </p>
                  <p style={{ fontSize: 12, color: T.muted, margin: '0 0 8px' }}>{g.memories.length} 条记忆</p>
                  {g.memories.slice(0, 3).map(m => (
                    <div key={m.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6 }}>
                      {m.image_urls?.[0] && <img src={m.image_urls[0]} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title || '无标题'}</p>
                        <p style={{ fontSize: 11, color: T.muted, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.content?.slice(0, 60) || ''}</p>
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
                <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0' }}>{validMarkers.length} 定位 · {unknownCount} 待解析</p>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'rgba(143,52,40,0.08)', border: 'none', borderRadius: 10, padding: '4px 12px', cursor: 'pointer', fontSize: 11, color: T.muted, fontFamily: T.fontBody }}>收起</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 14px 12px' }}>
              {validMarkers.length === 0 && unknownCount === 0 ? (
                <p style={{ textAlign: 'center', color: T.muted, fontSize: 13, padding: 36, fontFamily: T.fontBody }}>还没有带地点的回忆</p>
              ) : (
                <>
                  {validMarkers.map((g, i) => (
                    <div key={i} onClick={() => { setSelectedMarker(g); setPanelOpen(false) }}
                      style={{ padding: '10px 12px', borderRadius: 14, cursor: 'pointer', marginBottom: 6, background: selectedMarker?.lat === g.lat ? T.primarySoft : 'rgba(255,255,255,0.7)', border: `1px solid ${selectedMarker?.lat === g.lat ? T.borderWarm : 'rgba(0,0,0,0.04)'}`, transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontFamily: T.fontTitle, fontSize: 14, color: T.ink, margin: 0 }}>{g.location.length > 22 ? g.location.slice(0, 22) + '...' : g.location}</h4>
                        <span style={{ fontSize: 11, color: T.primary, fontWeight: 600 }}>{g.memories.length}条</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {g.memories.slice(0, 3).map(m => (
                          <span key={m.id} style={{ fontSize: 10, color: T.muted, background: 'rgba(143,52,40,0.04)', padding: '2px 6px', borderRadius: 6, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {markers.filter(m => m.lat === null).map((g, i) => (
                    <div key={`unk-${i}`} style={{ padding: '8px 12px', borderRadius: 12, marginBottom: 4, opacity: 0.5, border: '1px dashed rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.3)' }}>
                      <span style={{ fontSize: 12, color: T.muted }}>📍 {g.location?.slice(0, 26)}</span>
                      <span style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>待解析 · {g.memories.length}条</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 底部导航 ═══ */}
      <BottomNav navigate={navigate} />
    </div>
  )
}
