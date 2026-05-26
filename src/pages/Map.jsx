import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'

// 自定义图标
const icon = new L.DivIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:#9c4233;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 3px 12px rgba(156,66,51,0.35)">♥</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#ffb4a6', pFixed: '#ffdad4',
  secondary: '#536346', brown: '#1c1c18', text: '#56423f', light: '#89726e',
  border: '#dcc0bc', card: '#fcf9f2',
}

// 飞到某个位置
function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 14, { duration: 1.2 })
  }, [lat, lng])
  return null
}

export default function MapPage() {
  const [geoData, setGeoData] = useState([])
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeLoc, setActiveLoc] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMemories()
  }, [])

  async function fetchMemories() {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
    setMemories(data || [])

    // 提取有 location 的记录并去重
    const locMap = new Map()
    for (const m of data || []) {
      if (m.location && !locMap.has(m.location)) {
        locMap.set(m.location, [])
      }
      if (m.location) locMap.get(m.location).push(m)
    }

    // Geocode 每个位置
    const geoResults = []
    for (const [loc, mems] of locMap) {
      try {
        const coords = await geocode(loc)
        if (coords) {
          geoResults.push({ location: loc, lat: coords.lat, lng: coords.lng, memories: mems })
        } else {
          geoResults.push({ location: loc, lat: null, lng: null, memories: mems })
        }
      } catch {
        geoResults.push({ location: loc, lat: null, lng: null, memories: mems })
      }
      // Nominatim 限速 1 req/s
      await new Promise(r => setTimeout(r, 1100))
    }

    setGeoData(geoResults)
    setLoading(false)
  }

  async function geocode(query) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    )
    const data = await res.json()
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    return null
  }

  // 找出有坐标的数据
  const markers = geoData.filter(g => g.lat !== null)
  const center = markers[0] ? [markers[0].lat, markers[0].lng] : [35, 105]

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, color: C.light, fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 16 }}>
      在地图上寻找我们的足迹...
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,240,243,0.82)', backdropFilter: 'blur(16px)',
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 15 }}>← 返回</button>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 22, color: C.primary, fontWeight: 600, margin: 0 }}>Memory Map</h1>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
          {sidebarOpen ? '隐藏列表' : '足迹列表'}
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Map */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <MapContainer center={center} zoom={5} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {activeLoc && <FlyTo lat={activeLoc.lat} lng={activeLoc.lng} />}
            {markers.map((g, i) => (
              <Marker key={i} position={[g.lat, g.lng]} icon={icon}
                eventHandlers={{ click: () => setActiveLoc(g) }}>
                <Popup>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 4 }}>
                    <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, margin: '0 0 4px', color: C.brown }}>{g.location}</h3>
                    <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{g.memories.length} 条回忆</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? 340 : 0, overflow: 'hidden', transition: 'width 0.3s',
          background: C.card, borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 22, color: C.brown, margin: '0 0 4px' }}>Footprints</h2>
            <p style={{ fontSize: 14, color: C.light, margin: 0 }}>Our journey, step by step.</p>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
            {markers.length === 0 && (
              <p style={{ textAlign: 'center', color: C.light, fontSize: 14, padding: 40 }}>
                还没有带地点的回忆，去添加第一条吧 💕
              </p>
            )}
            {markers.map((g, i) => (
              <div key={i}
                onClick={() => setActiveLoc({ lat: g.lat, lng: g.lng })}
                style={{
                  padding: '14px', borderRadius: 14, cursor: 'pointer', marginBottom: 10,
                  background: activeLoc?.lat === g.lat ? C.pFixed : C.card,
                  border: `1px solid ${activeLoc?.lat === g.lat ? C.primary : C.border}`,
                  transition: 'all 0.2s',
                }}>
                <h4 style={{ fontFamily: 'EB Garamond, serif', fontSize: 17, color: C.brown, margin: '0 0 6px' }}>♥ {g.location}</h4>
                {g.memories.slice(0, 3).map(m => (
                  <p key={m.id} style={{ fontSize: 13, color: C.text, margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.title}
                  </p>
                ))}
                {g.memories.length > 3 && (
                  <p style={{ fontSize: 12, color: C.light, margin: '4px 0 0' }}>...还有 {g.memories.length - 3} 条</p>
                )}
              </div>
            ))}

            {/* 没有坐标但有地点的回忆 */}
            {geoData.filter(g => g.lat === null).map((g, i) => (
              <div key={`unk-${i}`} style={{ padding: '14px', borderRadius: 14, marginBottom: 10, opacity: 0.5, border: `1px dashed ${C.border}` }}>
                <h4 style={{ fontFamily: 'EB Garamond, serif', fontSize: 17, color: C.light, margin: '0 0 4px' }}>📍 {g.location}</h4>
                <p style={{ fontSize: 12, color: C.light, margin: 0 }}>无法定位此地点</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
