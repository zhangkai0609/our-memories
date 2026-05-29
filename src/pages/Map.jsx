import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { getSpaceId } from '../lib/space'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'

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

function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 14, { duration: 1.2 })
  }, [lat, lng])
  return null
}

// Map 内部组件：接收 geoData 变化，更新 markers 但不重建 MapContainer
function MapMarkers({ markers, activeLoc, setActiveLoc }) {
  const map = useMap()
  useEffect(() => {
    if (activeLoc?.lat) map.flyTo([activeLoc.lat, activeLoc.lng], 14, { duration: 1 })
  }, [activeLoc])

  return markers.map((g, i) => (
    <Marker key={i} position={[g.lat, g.lng]} icon={icon}
      eventHandlers={{ click: () => setActiveLoc(g) }}>
      <Popup>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 4 }}>
          <h3 style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, margin: '0 0 4px', color: C.brown }}>{g.location}</h3>
          <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{g.memories.length} 条回忆</p>
        </div>
      </Popup>
    </Marker>
  ))
}

export default function MapPage() {
  const [geoData, setGeoData] = useState([])
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeLoc, setActiveLoc] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [geocoding, setGeocoding] = useState(0) // 正在 geocode 的数量
  const navigate = useNavigate()

  useEffect(() => { fetchMemories() }, [])

  async function fetchMemories() {
    const spaceId = await getSpaceId()
    let query = supabase.from('memories').select('*').order('created_at', { ascending: false })
    if (spaceId) query = query.eq('space_id', spaceId)
    const { data } = await query
    setMemories(data || [])

    const locMap = new Map()
    for (const m of data || []) {
      if (m.location && !locMap.has(m.location)) locMap.set(m.location, [])
      if (m.location) locMap.get(m.location).push(m)
    }

    // 第1步：有存储坐标的直接显示
    const storedResults = []
    const needGeocode = []
    for (const [loc, mems] of locMap) {
      const memWithCoord = mems.find(m => m.coordinates && m.coordinates.lat)
      if (memWithCoord && memWithCoord.coordinates) {
        const c = memWithCoord.coordinates
        storedResults.push({ location: loc, lat: c.lat, lng: c.lng, memories: mems, fromStored: true })
      } else {
        needGeocode.push([loc, mems])
      }
    }
    setGeoData(storedResults)
    setLoading(false)

    // 第2步：后台 geocode，不阻塞地图
    if (needGeocode.length === 0) return
    setGeocoding(needGeocode.length)

    // 并行 geocode，每批 2 个（Nominatim 限制 ~1/sec，2个一批安全）
    for (let i = 0; i < needGeocode.length; i += 2) {
      const batch = needGeocode.slice(i, i + 2)
      const results = await Promise.allSettled(
        batch.map(([loc]) => geocode(loc))
      )
      results.forEach((r, j) => {
        const [loc, mems] = batch[j]
        if (r.status === 'fulfilled' && r.value) {
          setGeoData(prev => [...prev, {
            location: loc, lat: r.value.lat, lng: r.value.lng, memories: mems, fromStored: false,
          }])
        } else {
          setGeoData(prev => [...prev, { location: loc, lat: null, lng: null, memories: mems }])
        }
      })
      setGeocoding(needGeocode.length - i - batch.length)
      if (i + 2 < needGeocode.length) {
        await new Promise(r => setTimeout(r, 700))
      }
    }
  }

  // 改进的 geocode：对中文地址做更智能的查询
  async function geocode(query) {
    const cacheKey = `geo_${query}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try { return JSON.parse(cached) } catch {}
    }

    // 尝试 1: 完整地址查询
    let res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=zh`
    )
    let data = await res.json()
    if (data[0]) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      sessionStorage.setItem(cacheKey, JSON.stringify(result))
      return result
    }

    // 尝试 2: 提取短地址（取前几个关键词）重试
    const shortQuery = query.split(/[,，·\s]+/).slice(0, 3).join(' ')
    if (shortQuery !== query) {
      await new Promise(r => setTimeout(r, 300))
      res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shortQuery)}&limit=1&accept-language=zh`
      )
      data = await res.json()
      if (data[0]) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        sessionStorage.setItem(cacheKey, JSON.stringify(result))
        return result
      }
    }

    // 不缓存 null 结果，允许后续重试
    return null
  }

  const markers = geoData.filter(g => g.lat !== null)
  const unknownLocs = geoData.filter(g => g.lat === null)
  const center = markers[0] ? [markers[0].lat, markers[0].lng] : [35, 105]

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, color: C.light, fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: 16 }}>
      在地图上寻找我们的足迹...
    </div>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,240,243,0.82)', backdropFilter: 'blur(16px)',
        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`, zIndex: 20, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 15 }}>←</button>
          <h1 style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, color: C.primary, fontWeight: 600, margin: 0 }}>足迹地图</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {geocoding > 0 && (
            <span style={{ fontSize: 11, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              解析中 {geocoding}...
            </span>
          )}
          <button onClick={() => setPanelOpen(!panelOpen)}
            style={{
              background: C.primary, color: '#fff', border: 'none', borderRadius: 14,
              padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 2px 8px rgba(156,66,51,0.20)',
            }}>
            {panelOpen ? '收起列表' : `${markers.length + unknownLocs.length} 个足迹`}
          </button>
        </div>
      </header>

      {/* Map + Floating Panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapContainer center={center} zoom={5} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapMarkers markers={markers} activeLoc={activeLoc} setActiveLoc={setActiveLoc} />
        </MapContainer>

        {/* 底部浮动足迹面板 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          maxHeight: panelOpen ? '55%' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
        }}>
          <div style={{
            background: 'rgba(252,249,242,0.94)', backdropFilter: 'blur(12px)',
            borderTop: `1px solid ${C.border}`,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            boxShadow: '0 -4px 24px rgba(156,66,51,0.10)',
            maxHeight: '55vh', display: 'flex', flexDirection: 'column',
          }}>
            {/* 面板把手 */}
            <div style={{
              display: 'flex', justifyContent: 'center', padding: '10px 0 4px',
              cursor: 'pointer',
            }} onClick={() => setPanelOpen(false)}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(220,192,188,0.5)' }} />
            </div>

            {/* 面板标题 */}
            <div style={{ padding: '0 18px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <h2 style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, color: C.brown, margin: 0 }}>
                足迹列表
              </h2>
              <p style={{ fontSize: 12, color: C.light, margin: '2px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {markers.length} 个有坐标 · {unknownLocs.length} 个待定位
              </p>
            </div>

            {/* 面板内容 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px 16px' }}>
              {markers.length === 0 && unknownLocs.length === 0 ? (
                <p style={{ textAlign: 'center', color: C.light, fontSize: 14, padding: 40, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  还没有带地点的回忆，去添加第一条吧
                </p>
              ) : (
                <>
                  {markers.map((g, i) => (
                    <div key={i}
                      onClick={() => { setActiveLoc(g); setPanelOpen(false); }}
                      style={{
                        padding: '12px 14px', borderRadius: 16, cursor: 'pointer', marginBottom: 8,
                        background: activeLoc?.lat === g.lat ? C.pFixed : 'rgba(255,255,255,0.6)',
                        border: `1px solid ${activeLoc?.lat === g.lat ? C.primary : 'rgba(220,192,188,0.25)'}`,
                        transition: 'all 0.2s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontFamily: 'EB Garamond, serif', fontSize: 15, color: C.brown, margin: 0 }}>
                          ♥ {g.location.length > 25 ? g.location.slice(0, 25) + '...' : g.location}
                        </h4>
                        <span style={{ fontSize: 11, color: C.primary, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                          {g.memories.length} 条
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {g.memories.slice(0, 3).map(m => (
                          <span key={m.id} style={{
                            fontSize: 10, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif',
                            background: 'rgba(156,66,51,0.04)', padding: '2px 8px', borderRadius: 8,
                            maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {m.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* 无法定位的地点 */}
                  {unknownLocs.map((g, i) => (
                    <div key={`unk-${i}`} style={{
                      padding: '10px 14px', borderRadius: 14, marginBottom: 6,
                      opacity: 0.55, border: `1px dashed ${C.border}`,
                      background: 'rgba(255,255,255,0.3)',
                    }}>
                      <div style={{ fontSize: 13, color: C.light, fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📍</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.location.length > 30 ? g.location.slice(0, 30) + '...' : g.location}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: C.light, margin: '4px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        暂无坐标 · {g.memories.length} 条记录
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
