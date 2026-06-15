import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import AppIcon from '../components/AppIcon'
import { unpackMemoryContent } from '../lib/audioMemory'
import { getCached, setCached } from '../lib/cache'
import { bindLegacyMemoriesToMainRoom } from '../lib/roomData'
import { canonicalRoom, fetchRoomRows, loadRoomProfile } from '../lib/roomProfile'
import { supabase } from '../lib/supabase'

const T = {
  bg: '#f7f8f5',
  ink: '#2f1f1d',
  muted: '#8b7772',
  primary: '#a34a3a',
  primaryDark: '#7f2f28',
  paper: 'rgba(255,255,255,0.72)',
  glass: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.72)',
  line: 'rgba(163,74,58,0.38)',
  shadow: '0 22px 58px rgba(86, 67, 61, 0.16)',
  fontTitle: '"Noto Serif SC","Songti SC","STSong","Microsoft YaHei",serif',
  fontBody: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif',
}

const navItems = [
  { id: 'home', icon: 'home', to: '/' },
  { id: 'memory', icon: 'memory', to: '/gallery' },
  { id: 'map', icon: 'map', to: '/map' },
]

const DEFAULT_CENTER = [30.248, 120.155]

const avatarIconCache = new Map()

function normalizeCoordinates(coords) {
  if (!coords) return null
  if (typeof coords === 'string') {
    try {
      return normalizeCoordinates(JSON.parse(coords))
    } catch {
      return null
    }
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

function formatDate(value) {
  const d = value ? new Date(value) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function plainText(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function geoCacheKey(query) {
  return `geo_v3_${query.trim().replace(/\s+/g, ' ').slice(0, 96)}`
}

function readGeoCache(query) {
  try {
    const raw = localStorage.getItem(geoCacheKey(query))
    if (!raw) return undefined
    const entry = JSON.parse(raw)
    if (entry.lat === null && Date.now() - entry.ts > 86400000) {
      localStorage.removeItem(geoCacheKey(query))
      return undefined
    }
    return entry.lat === null ? null : entry
  } catch {
    return undefined
  }
}

function writeGeoCache(query, result) {
  try {
    localStorage.setItem(geoCacheKey(query), JSON.stringify({ ...result, ts: Date.now() }))
  } catch {
    // Ignore private browsing or full storage.
  }
}

async function geocodeOnce(query) {
  const cached = readGeoCache(query)
  if (cached !== undefined) return cached

  const candidates = [
    query,
    query.split(/[,，\s]+/).filter(Boolean).slice(0, 3).join(' '),
  ].filter(Boolean)

  for (const candidate of [...new Set(candidates)]) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(candidate)}&limit=1&accept-language=zh-CN`)
      const data = await res.json()
      if (data?.[0]) {
        const result = { lat: Number(data[0].lat), lng: Number(data[0].lon) }
        writeGeoCache(query, result)
        return result
      }
    } catch {
      // Keep going with cached/local data when geocoding is unavailable.
    }
  }

  writeGeoCache(query, { lat: null, lng: null })
  return null
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function getMarkerIcon({ avatar, name, label, active }) {
  const key = `${avatar || name || 'empty'}_${label || ''}_${active ? 'active' : 'idle'}`
  if (avatarIconCache.has(key)) return avatarIconCache.get(key)

  const size = active ? 58 : 46
  const ring = active ? '#a34a3a' : 'rgba(255,255,255,0.92)'
  const image = avatar
    ? `<img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<span style="font-size:15px;font-weight:900;color:#a34a3a;">${(name || '?').slice(0, 1)}</span>`

  const icon = new L.DivIcon({
    className: '',
    html: `
      <div style="
      <div style="position:relative;width:178px;height:64px;">
        <div style="
          position:absolute;
          left:0;
          top:${active ? 0 : 6}px;
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          display:grid;
          place-items:center;
          background:rgba(255,255,255,0.66);
          border:${active ? 3 : 2}px solid ${ring};
          box-shadow:0 14px 30px rgba(98,64,57,.22), 0 0 0 ${active ? 7 : 4}px rgba(163,74,58,.10);
          backdrop-filter:blur(14px);
          overflow:hidden;
          z-index:2;
        ">${image}</div>
        <div style="
          position:absolute;
          left:${active ? 54 : 42}px;
          top:${active ? 16 : 18}px;
          max-width:118px;
          height:34px;
          padding:0 12px;
          border-radius:999px;
          display:flex;
          align-items:center;
          gap:6px;
          color:${active ? '#a34a3a' : '#2f1f1d'};
          font-size:12px;
          font-weight:800;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          border:${active ? '1.5px solid #a34a3a' : '1px solid rgba(255,255,255,.82)'};
          background:rgba(255,255,255,.78);
          box-shadow:0 12px 28px rgba(76,64,60,.15);
          backdrop-filter:blur(18px) saturate(1.3);
        ">
          <span style="color:#a34a3a;">♡</span>${escapeHtml(label)}
        </div>
      </div>
    `,
    iconSize: [178, 64],
    iconAnchor: [size / 2, 32],
  })
  avatarIconCache.set(key, icon)
  return icon
}

function MapResize() {
  const map = useMap()
  useEffect(() => {
    const refresh = () => map.invalidateSize()
    const t = setTimeout(refresh, 120)
    const ro = new ResizeObserver(refresh)
    ro.observe(map.getContainer())
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [map])
  return null
}

function FitMarkers({ markers, selected }) {
  const map = useMap()
  useEffect(() => {
    if (selected?.lat != null) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { duration: 0.65 })
      return
    }
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13)
      return
    }
    if (markers.length > 1) {
      map.fitBounds(L.latLngBounds(markers.map(item => [item.lat, item.lng])), {
        paddingTopLeft: [44, 96],
        paddingBottomRight: [44, 250],
        maxZoom: 13,
      })
    }
  }, [map, markers, selected])
  return null
}

function LocateButton({ onLocated }) {
  const map = useMap()
  return (
    <button
      type="button"
      aria-label="定位"
      onClick={() => {
        map.locate({ setView: true, maxZoom: 15 })
        map.once('locationfound', event => onLocated?.(event.latlng))
      }}
      style={roundMapButtonStyle}
    >
      <AppIcon name="map" size={22} />
    </button>
  )
}

function MarkerLayer({ marker, selected, avatar, name, onSelect }) {
  const active = selected?.key === marker.key
  return (
    <Marker
      position={[marker.lat, marker.lng]}
      icon={getMarkerIcon({ avatar, name, label: marker.memories[0]?.title || marker.location, active })}
      eventHandlers={{ click: () => onSelect(marker) }}
    />
  )
}

function WaveLine() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, opacity: 0.9 }}>
      {Array.from({ length: 42 }).map((_, index) => (
        <span
          key={index}
          style={{
            width: 2,
            height: 5 + Math.abs(Math.sin(index * 0.78)) * 18,
            borderRadius: 3,
            background: index < 16 ? T.primary : 'rgba(159,143,137,0.22)',
          }}
        />
      ))}
    </div>
  )
}

function BottomMemoryCard({ marker, profile, onDetail }) {
  if (!marker) return null
  const memory = marker.memories[0]
  const photo = memory.image_urls?.[0]
  const avatar = memory.author === profile.myName ? profile.myAvatar : profile.partnerAvatar
  const summary = plainText(memory.content) || '这一天被小屋认真收藏了。'

  return (
    <section style={detailCardStyle}>
      <div style={{ width: 58, height: 4, borderRadius: 999, background: 'rgba(93,76,70,0.10)', margin: '0 auto 16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: photo ? '1fr 92px' : '1fr', gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={smallAvatarStyle}>
              {avatar ? <img src={avatar} alt="" style={fillImageStyle} /> : <span>{(memory.author || '我').slice(0, 1)}</span>}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, color: T.ink, fontFamily: T.fontTitle, fontSize: 23, lineHeight: '28px', fontWeight: 900 }}>
                {memory.title || '未命名记忆'}
                <AppIcon name="heart" size={17} style={{ display: 'inline-block', marginLeft: 8, verticalAlign: '-2px' }} />
              </h2>
              <p style={{ margin: '4px 0 0', color: T.muted, fontSize: 12, fontWeight: 700 }}>
                {formatDate(memory.created_at)} · {marker.location}
              </p>
            </div>
          </div>
          <p style={{ margin: '16px 0 0', color: '#6d5550', fontSize: 14, lineHeight: '24px', letterSpacing: 0 }}>
            {summary}
          </p>
        </div>
        {photo && (
          <div style={{ width: 92, height: 92, borderRadius: 16, padding: 5, background: 'rgba(255,255,255,0.62)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
            <img src={photo} alt="" style={{ ...fillImageStyle, borderRadius: 12 }} />
          </div>
        )}
      </div>

      {memory.audioUrl && (
        <div style={audioCardStyle}>
          <button type="button" style={audioPlayStyle} onClick={() => document.getElementById(`map-audio-${memory.id}`)?.play()}>
            <span style={{ marginLeft: 2 }}>▶</span>
          </button>
          <WaveLine />
          <span style={{ color: T.muted, fontSize: 12, fontWeight: 700 }}>00:18</span>
          <audio id={`map-audio-${memory.id}`} src={memory.audioUrl} preload="none" />
        </div>
      )}

      <button type="button" onClick={onDetail} style={detailButtonStyle}>
        查看详情
        <AppIcon name="right" size={17} />
      </button>
    </section>
  )
}

const roundMapButtonStyle = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.72)',
  color: T.ink,
  boxShadow: '0 14px 32px rgba(63,74,78,0.15)',
  backdropFilter: 'blur(18px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
  display: 'grid',
  placeItems: 'center',
}

const smallAvatarStyle = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  padding: 3,
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.76)',
  border: `1.5px solid ${T.primary}`,
  color: T.primary,
  fontWeight: 900,
  boxShadow: '0 10px 24px rgba(120,72,63,0.16)',
}

const fillImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const detailCardStyle = {
  position: 'absolute',
  left: 14,
  right: 14,
  bottom: 'calc(86px + env(safe-area-inset-bottom))',
  zIndex: 6500,
  borderRadius: 28,
  padding: '10px 18px 18px',
  border: `1px solid ${T.border}`,
  background: 'linear-gradient(145deg, rgba(255,255,255,0.86), rgba(255,255,255,0.58) 58%, rgba(245,250,250,0.55))',
  backdropFilter: 'blur(30px) saturate(1.5)',
  WebkitBackdropFilter: 'blur(30px) saturate(1.5)',
  boxShadow: T.shadow,
}

const audioCardStyle = {
  minHeight: 58,
  marginTop: 18,
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.78)',
  background: 'rgba(255,255,255,0.58)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const audioPlayStyle = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: 'none',
  background: T.primary,
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 10px 22px rgba(163,74,58,0.24)',
}

const detailButtonStyle = {
  width: '100%',
  minHeight: 48,
  marginTop: 16,
  borderRadius: 999,
  border: `1.5px solid ${T.primary}`,
  background: 'rgba(255,255,255,0.40)',
  color: T.primaryDark,
  fontFamily: T.fontBody,
  fontSize: 14,
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
}

export default function MapPage() {
  const navigate = useNavigate()
  const roomCode = canonicalRoom(localStorage.getItem('room_code'))
  const profile = loadRoomProfile(roomCode)
  const [markers, setMarkers] = useState([])
  const [unknownLocs, setUnknownLocs] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [myLocation, setMyLocation] = useState(null)
  const cancelled = useRef(false)

  const groupMemories = useCallback((memories) => {
    const groups = new Map()
    memories.forEach(memory => {
      const location = (memory.location || '').trim()
      if (!location) return
      if (!groups.has(location)) groups.set(location, [])
      groups.get(location).push(memory)
    })

    const withCoord = []
    const withoutCoord = []
    groups.forEach((items, location) => {
      const withCoordinates = items.find(item => item.coordinates?.lat != null)
      const marker = {
        key: location,
        location,
        memories: items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
      }
      if (withCoordinates) {
        withCoord.push({
          ...marker,
          lat: withCoordinates.coordinates.lat,
          lng: withCoordinates.coordinates.lng,
        })
      } else {
        withoutCoord.push(marker)
      }
    })

    setMarkers(withCoord)
    setUnknownLocs(withoutCoord)
    setSelected(prev => prev || withCoord[0] || null)
    return withoutCoord
  }, [])

  const geocodeLocations = useCallback(async (items) => {
    for (const item of items) {
      if (cancelled.current) return
      const coord = await geocodeOnce(item.location)
      if (cancelled.current) return
      if (coord?.lat != null) {
        const resolved = { ...item, lat: coord.lat, lng: coord.lng }
        setMarkers(prev => prev.some(marker => marker.key === resolved.key) ? prev : [...prev, resolved])
        setUnknownLocs(prev => prev.filter(marker => marker.key !== resolved.key))
        setSelected(prev => prev || resolved)
      }
      await new Promise(resolve => setTimeout(resolve, 420))
    }
  }, [])

  const loadData = useCallback(async () => {
    if (!roomCode) return
    setLoading(true)
    try {
      const cached = (getCached('memories') || []).map(normalizeMemory).filter(item => item.location)
      if (cached.length) {
        const pending = groupMemories(cached)
        if (pending.length) geocodeLocations(pending)
        setLoading(false)
      }

      await bindLegacyMemoriesToMainRoom(roomCode)
      const data = await fetchRoomRows(
        () => supabase.from('memories')
          .select('id,title,content,location,author,coordinates,created_at,image_urls,room_code')
          .not('location', 'is', null)
          .order('created_at', { ascending: false }),
        roomCode
      )
      if (cancelled.current) return

      const next = (data || []).map(normalizeMemory).filter(item => item.location)
      if (next.length) {
        const pending = groupMemories(next)
        if (pending.length) geocodeLocations(pending)
        setCached('memories', data || [])
      } else if (!cached.length) {
        setMarkers([])
        setUnknownLocs([])
      }
    } finally {
      if (!cancelled.current) setLoading(false)
    }
  }, [geocodeLocations, groupMemories, roomCode])

  useEffect(() => {
    cancelled.current = false
    Promise.resolve().then(loadData)
    return () => {
      cancelled.current = true
    }
  }, [loadData])

  const filteredMarkers = useMemo(() => {
    if (filter === 'all') return markers
    return markers.filter(marker => marker.memories.some(memory => {
      if (filter === 'mine') return memory.author === profile.myName
      return memory.author && memory.author !== profile.myName
    }))
  }, [filter, markers, profile.myName])

  const selectedMarker = useMemo(() => {
    if (selected && filteredMarkers.some(marker => marker.key === selected.key)) return selected
    return filteredMarkers[0] || null
  }, [filteredMarkers, selected])

  const connectionLine = useMemo(() => {
    if (!selectedMarker || filteredMarkers.length < 2) return []
    const other = filteredMarkers.find(marker => marker.key !== selectedMarker.key)
    return other ? [[selectedMarker.lat, selectedMarker.lng], [other.lat, other.lng]] : []
  }, [filteredMarkers, selectedMarker])

  const statsText = `${markers.reduce((sum, marker) => sum + marker.memories.length, 0) + unknownLocs.reduce((sum, marker) => sum + marker.memories.length, 0)} 条回忆 · ${markers.length} 个地点`

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: T.bg, fontFamily: T.fontBody }}>
      <MapContainer center={DEFAULT_CENTER} zoom={13} zoomControl={false} attributionControl style={{ width: '100%', height: '100%', background: '#edf2ef' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxNativeZoom={19}
          keepBuffer={6}
          updateWhenZooming={false}
        />
        <MapResize />
        <FitMarkers markers={filteredMarkers} selected={selectedMarker} />
        {connectionLine.length > 0 && (
          <Polyline positions={connectionLine} pathOptions={{ color: T.primary, weight: 2, opacity: 0.42, dashArray: '4 8' }} />
        )}
        {filteredMarkers.map(marker => {
          const first = marker.memories[0]
          const isMine = first.author === profile.myName
          return (
            <MarkerLayer
              key={marker.key}
              marker={marker}
              selected={selectedMarker}
              avatar={isMine ? profile.myAvatar : profile.partnerAvatar}
              name={first.author}
              onSelect={setSelected}
            />
          )
        })}
        <div style={{ position: 'absolute', right: 16, top: '52%', zIndex: 6200, display: 'grid', gap: 12 }}>
          <LocateButton onLocated={setMyLocation} />
          <button type="button" aria-label="图层" style={roundMapButtonStyle}>
            <AppIcon name="memory" size={22} />
          </button>
        </div>
      </MapContainer>

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5000,
        background: 'linear-gradient(180deg, rgba(247,248,245,0.92) 0%, rgba(247,248,245,0.52) 11%, rgba(247,248,245,0) 34%, rgba(247,248,245,0.10) 70%, rgba(247,248,245,0.82) 100%)',
      }} />

      <header style={{
        position: 'absolute',
        top: 'calc(14px + env(safe-area-inset-top))',
        left: 16,
        right: 16,
        zIndex: 7000,
        display: 'grid',
        gridTemplateColumns: '44px 1fr 44px',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <button type="button" onClick={() => navigate('/')} style={{ ...topButtonStyle, pointerEvents: 'auto' }}>
          <AppIcon name="back" size={22} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: T.ink, fontFamily: T.fontTitle, fontSize: 22, lineHeight: '28px', fontWeight: 900 }}>
            回忆地图
            <span style={{ display: 'inline-block', width: 9, height: 9, marginLeft: 7, borderRadius: '50%', background: T.primary, boxShadow: '0 0 0 4px rgba(163,74,58,0.12)' }} />
          </h1>
          <p style={{ margin: '2px 0 0', color: T.muted, fontSize: 11, fontWeight: 700 }}>{statsText}</p>
        </div>
        <button type="button" onClick={() => navigate('/new')} style={{ ...topButtonStyle, pointerEvents: 'auto' }}>
          <AppIcon name="plus" size={22} />
        </button>
      </header>

      <div style={{
        position: 'absolute',
        top: 'calc(78px + env(safe-area-inset-top))',
        right: 16,
        zIndex: 7000,
        pointerEvents: 'auto',
      }}>
        <button type="button" onClick={() => navigate('/new')} style={tipStyle}>
          <AppIcon name="sparkle" size={15} />
          写记忆时将自动记录位置
          <AppIcon name="right" size={13} />
        </button>
      </div>

      <div style={{
        position: 'absolute',
        left: 22,
        bottom: 'calc(380px + env(safe-area-inset-bottom))',
        zIndex: 6900,
        display: 'flex',
        gap: 8,
        padding: 5,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.62)',
        border: `1px solid ${T.border}`,
        boxShadow: '0 14px 34px rgba(82,70,66,0.13)',
        backdropFilter: 'blur(20px) saturate(1.35)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.35)',
      }}>
        {[
          ['all', '全部'],
          ['mine', '我的'],
          ['ta', 'TA的'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            style={{
              minWidth: 54,
              height: 34,
              border: 'none',
              borderRadius: 999,
              background: filter === id ? T.primary : 'transparent',
              color: filter === id ? '#fff' : T.muted,
              fontFamily: T.fontBody,
              fontSize: 13,
              fontWeight: 850,
              boxShadow: filter === id ? '0 10px 22px rgba(163,74,58,0.22)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={loadingStyle}>正在读取地图数据...</div>
      )}

      {!loading && !selectedMarker && (
        <div style={emptyStyle}>
          还没有可以显示在地图上的记忆
        </div>
      )}

      {myLocation && (
        <div style={locationToastStyle}>已定位到当前位置</div>
      )}

      <BottomMemoryCard
        marker={selectedMarker}
        profile={profile}
        onDetail={() => selectedMarker?.memories?.[0]?.id && navigate(`/diary/${selectedMarker.memories[0].id}`)}
      />

      <nav style={bottomNavStyle}>
        {navItems.map(item => {
          const active = item.id === 'map'
          return (
            <button key={item.id} type="button" onClick={() => navigate(item.to)} style={navButtonStyle(active)}>
              <AppIcon name={item.icon} size={32} active={active} strokeWidth={1.8} />
            </button>
          )
        })}
      </nav>
    </div>
  )
}

const topButtonStyle = {
  width: 44,
  height: 44,
  border: `1px solid ${T.border}`,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.58)',
  color: T.ink,
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 12px 28px rgba(76,65,60,0.12)',
  backdropFilter: 'blur(18px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.25)',
}

const tipStyle = {
  minHeight: 34,
  border: `1px solid ${T.border}`,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.66)',
  color: '#705c57',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: T.fontBody,
  fontSize: 12,
  fontWeight: 800,
  boxShadow: '0 12px 28px rgba(76,65,60,0.10)',
  backdropFilter: 'blur(18px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.25)',
}

const loadingStyle = {
  position: 'absolute',
  left: '50%',
  top: '48%',
  transform: 'translate(-50%, -50%)',
  zIndex: 7200,
  borderRadius: 999,
  padding: '10px 16px',
  color: T.primary,
  fontSize: 13,
  fontWeight: 900,
  background: 'rgba(255,255,255,0.72)',
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow,
  backdropFilter: 'blur(20px) saturate(1.25)',
}

const emptyStyle = {
  ...loadingStyle,
  width: 'min(280px, calc(100% - 42px))',
  textAlign: 'center',
  whiteSpace: 'normal',
}

const locationToastStyle = {
  position: 'absolute',
  left: '50%',
  bottom: 'calc(356px + env(safe-area-inset-bottom))',
  transform: 'translateX(-50%)',
  zIndex: 7200,
  padding: '8px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.74)',
  color: T.primary,
  fontSize: 12,
  fontWeight: 900,
  boxShadow: '0 12px 28px rgba(76,65,60,0.12)',
}

const bottomNavStyle = {
  position: 'absolute',
  left: '50%',
  bottom: 'calc(20px + env(safe-area-inset-bottom))',
  transform: 'translateX(-50%)',
  width: 'min(calc(100% - 44px), 356px)',
  height: 58,
  zIndex: 7600,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  padding: 5,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.52)',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.42), rgba(255,255,255,0.16) 54%, rgba(185,215,223,0.24)), rgba(255,255,255,0.18)',
  backdropFilter: 'blur(34px) saturate(1.48)',
  WebkitBackdropFilter: 'blur(34px) saturate(1.48)',
  boxShadow: '0 18px 46px rgba(64,80,86,0.18), inset 0 1px 0 rgba(255,255,255,0.66)',
}

function navButtonStyle(active) {
  return {
    border: 'none',
    borderRadius: 999,
    background: 'transparent',
    color: active ? T.primary : 'rgba(65,58,56,0.70)',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  }
}
