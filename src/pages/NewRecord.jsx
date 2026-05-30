import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#e87c69', pFixed: '#ffdad4',
  brown: '#1c1c18', text: '#56423f', light: '#89726e',
  border: '#dcc0bc', card: '#fcf9f2', inputBg: '#fdfaf7',
}

// Nominatim 反地理编码: 坐标 → 地址
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=zh`
    )
    const data = await res.json()
    if (data && data.display_name) {
      // 精简地址：去掉过长的层级
      const parts = data.display_name.split(',').map(s => s.trim())
      return parts.slice(0, 5).join(' · ')
    }
    return null
  } catch {
    return null
  }
}

export default function NewRecord() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState(null)
  const [author, setAuthor] = useState(localStorage.getItem('current_author') || localStorage.getItem('my_name') || '小周同学')
  const myName = localStorage.getItem('my_name') || '小周同学'
  const partnerName = localStorage.getItem('partner_name') || '另一半'

  function toggleAuthor() {
    const next = author === myName ? partnerName : myName
    setAuthor(next)
    localStorage.setItem('current_author', next)
  } // { lat, lng }
  const [gpsLoading, setGpsLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [pastLocations, setPastLocations] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const fileRef = useRef(null)
  const locationRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPastLocations()
  }, [])

  async function fetchPastLocations() {
    try {
      const { data } = await supabase.from('memories').select('location').not('location', 'is', null).order('created_at', { ascending: false }).limit(20)
      const seen = new Set()
      const unique = []
      for (const m of data || []) {
        const trimmed = m.location.trim()
        if (trimmed && !seen.has(trimmed)) {
          seen.add(trimmed)
          unique.push(trimmed)
        }
      }
      setPastLocations(unique.slice(0, 8))
    } catch { /* silent */ }
  }

  // GPS 定位
  async function handleGpsLocate() {
    if (!navigator.geolocation) {
      alert('你的设备不支持定位功能')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        const addr = await reverseGeocode(latitude, longitude)
        if (addr) setLocation(addr)
        setGpsLoading(false)
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === 1) alert('定位被拒绝，请在浏览器设置中允许位置权限')
        else if (err.code === 2) alert('暂时无法获取位置，请稍后重试')
        else alert('定位超时，请手动输入位置')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    )
  }

  // 选择建议位置
  function selectSuggestion(addr) {
    setLocation(addr)
    setCoords(null) // 历史位置没有坐标
    setShowSuggestions(false)
  }

  function handleFileChange(e) { setFiles(Array.from(e.target.files)) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setUploading(true)

    // 照片转 base64 存数据库（无需 Supabase Storage）
    const imageUrls = []
    for (const file of files) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        imageUrls.push(dataUrl)
      } catch { alert('照片读取失败: ' + file.name) }
    }

    const author = localStorage.getItem('current_author') || localStorage.getItem('my_name') || '小周同学'
    const recordData = {
      title: title.trim(), content, location: location.trim() || null, image_urls: imageUrls, author,
    }
    if (coords) recordData.coordinates = coords
    const roomCode = localStorage.getItem('room_code')
    if (roomCode) recordData.room_code = roomCode

    let { error } = await supabase.from('memories').insert(recordData)

    // 如果 coordinates 列不存在，回退重试
    if (error && coords) {
      delete recordData.coordinates
      const retry = await supabase.from('memories').insert(recordData)
      error = retry.error
    }

    if (error) alert('发布失败：' + error.message)
    else navigate('/')
    setUploading(false)
  }

  const inputStyle = {
    padding: '15px 20px', borderRadius: 16, border: `1.5px solid ${C.border}`,
    fontSize: 15, background: C.inputBg, color: C.brown,
    fontFamily: 'Plus Jakarta Sans, sans-serif', width: '100%',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      <div className="grain-overlay" />

      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', background: 'rgba(255,240,243,0.82)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`
      }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: C.primary, fontSize: 15, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          ← 返回
        </button>
        <button onClick={toggleAuthor} style={{
          display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.5)',border:'1px solid rgba(255,255,255,0.6)',
          borderRadius:999,padding:'6px 14px',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',
          fontSize:13,color:C.primary,fontWeight:600,
        }}>
          ✍ {author}
        </button>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Title */}
        <input type="text" placeholder="今天发生了什么？" value={title}
          onChange={e => setTitle(e.target.value)} required
          style={{ ...inputStyle, fontSize: 22, fontWeight: 600, fontFamily: 'EB Garamond, serif', padding: '18px 20px' }} />

        {/* Location */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input ref={locationRef} type="text" placeholder="📍  在哪里？（选填）" value={location}
                onChange={e => { setLocation(e.target.value); setCoords(null); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{
                  ...inputStyle, width: '100%',
                  paddingRight: location ? 36 : 12,
                }} />
              {location && (
                <button type="button" onClick={() => { setLocation(''); setCoords(null); }}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: C.light, cursor: 'pointer',
                    fontSize: 16, padding: 4,
                  }}>✕</button>
              )}
            </div>
            <button type="button" onClick={handleGpsLocate} disabled={gpsLoading}
              title="使用当前位置"
              style={{
                width: 46, height: 46, borderRadius: 16,
                background: coords ? 'rgba(83,99,70,0.10)' : C.card,
                border: coords ? `1.5px solid ${C.secondary}` : `1.5px solid ${C.border}`,
                cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
                opacity: gpsLoading ? 0.6 : 1,
              }}>
              {gpsLoading ? '⏳' : coords ? '📍' : '🎯'}
            </button>
          </div>

          {/* GPS 状态提示 */}
          {coords && (
            <p style={{
              margin: '4px 0 0 4px', fontSize: 11, color: C.secondary,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span>✓</span> 已获取精确位置 ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </p>
          )}

          {/* 历史位置建议 */}
          {showSuggestions && pastLocations.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 60, zIndex: 20,
              marginTop: 4, background: C.card, borderRadius: 16,
              boxShadow: '0 8px 30px rgba(156,66,51,0.12)',
              border: '1px solid rgba(220,192,188,0.3)',
              padding: '6px', maxHeight: 200, overflowY: 'auto',
            }}>
              <p style={{
                fontSize: 11, color: C.light, padding: '4px 10px 6px', margin: 0,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>📍 历史位置</p>
              {pastLocations.map((addr, i) => (
                <button key={i} type="button"
                  onMouseDown={e => { e.preventDefault(); selectSuggestion(addr); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 12px', border: 'none', borderRadius: 12,
                    background: addr === location ? 'rgba(156,66,51,0.05)' : 'transparent',
                    cursor: 'pointer', fontSize: 13, color: C.brown,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(156,66,51,0.05)'}
                  onMouse退出={e => { if (addr !== location) e.currentTarget.style.background = 'transparent'; }}
                >{addr}</button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <textarea placeholder="写下你想记住的一切..." value={content}
          onChange={e => setContent(e.target.value)} rows={6}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8, minHeight: 140 }} />

        {/* 照片 */}
        <div>
          <button type="button" onClick={() => fileRef.current.click()}
            style={{
              padding: '14px 24px', borderRadius: 16, background: C.card,
              border: `1.5px dashed ${C.border}`, cursor: 'pointer', fontSize: 15,
              color: C.text, fontFamily: 'Plus Jakarta Sans, sans-serif', width: '100%',
              textAlign: 'left',
            }}>
            {files.length > 0 ? `📷  已选择 ${files.length} 张照片` : '📷  添加照片'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />

          {files.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginTop: 14 }}>
              {files.map((f, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    style={{
                      position: 'absolute', top: 4, right: 4, width: 24, height: 24,
                      borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: '#fff',
                      border: 'none', fontSize: 13, cursor: 'pointer', lineHeight: '24px',
                    }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={uploading}
          style={{
            marginTop: 12, padding: '16px', background: C.primary, color: '#fff',
            border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.06em',
            boxShadow: '0 4px 20px rgba(156,66,51,0.20)',
          }}>
          {uploading ? '保存中...' : '写 下 来'}
        </button>
      </form>
    </div>
  )
}
