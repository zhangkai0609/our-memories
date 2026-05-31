import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bumpVersion } from '../lib/cache'
import { supabase } from '../lib/supabase'

const T = {
  bg: '#eef6f7',
  ink: '#2f211d',
  muted: '#7d6460',
  primary: '#8f3428',
  blue: '#b9d7df',
  glass: 'rgba(255,255,255,0.56)',
  border: 'rgba(255,255,255,0.68)',
  shadow: '0 22px 60px rgba(78,93,98,0.18)',
  fontTitle: '"Noto Serif SC", "LXGW WenKai", "Songti SC", serif',
  fontBody: '"Noto Serif SC", "LXGW WenKai", "PingFang SC", "Microsoft YaHei", sans-serif',
}

const themes = ['日常', '约会', '旅行', '纪念日']
const draftKey = 'new_memory_draft_v2'

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=zh`)
    const data = await res.json()
    if (!data?.display_name) return null
    return data.display_name.split(',').map(s => s.trim()).slice(0, 5).join(' · ')
  } catch {
    return null
  }
}

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const maxW = 1200
        let { width, height } = img
        if (width > maxW || height > maxW) {
          const ratio = maxW / Math.max(width, height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function NewRecord() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const recognitionRef = useRef(null)
  const previewRef = useRef([])
  const myName = localStorage.getItem('my_name') || '小周同学'
  const partnerName = localStorage.getItem('partner_name') || '另一半'

  const draft = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) || '{}') } catch { return {} }
  }, [])

  const [title, setTitle] = useState(draft.title || '')
  const [content, setContent] = useState(draft.content || '')
  const [location, setLocation] = useState(draft.location || '')
  const [coords, setCoords] = useState(draft.coords || null)
  const [theme, setTheme] = useState(draft.theme || '日常')
  const [author, setAuthor] = useState(localStorage.getItem('current_author') || myName)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [pastLocations, setPastLocations] = useState([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speechText, setSpeechText] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPastLocations = useCallback(async () => {
    try {
      const { data } = await supabase.from('memories')
        .select('location')
        .not('location', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)
      const unique = [...new Set((data || []).map(m => (m.location || '').trim()).filter(Boolean))]
      setPastLocations(unique.slice(0, 5))
    } catch {
      setPastLocations([])
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(fetchPastLocations)
    return () => previewRef.current.forEach(url => URL.revokeObjectURL(url))
  }, [fetchPastLocations])

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ title, content, location, coords, theme }))
  }, [title, content, location, coords, theme])

  function toggleAuthor() {
    const next = author === myName ? partnerName : myName
    setAuthor(next)
    localStorage.setItem('current_author', next)
  }

  async function locate() {
    if (!navigator.geolocation) {
      alert('当前设备不支持定位')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const nextCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(nextCoords)
        const addr = await reverseGeocode(nextCoords.lat, nextCoords.lng)
        if (addr) setLocation(addr)
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false)
        alert('定位失败，请检查浏览器位置权限或手动输入位置')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    )
  }

  function pickFiles(event) {
    const next = Array.from(event.target.files || [])
    previewRef.current.forEach(url => URL.revokeObjectURL(url))
    setFiles(next)
    const nextPreviews = next.map(file => URL.createObjectURL(file))
    previewRef.current = nextPreviews
    setPreviews(nextPreviews)
  }

  function removeFile(index) {
    URL.revokeObjectURL(previews[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      const next = prev.filter((_, i) => i !== index)
      previewRef.current = next
      return next
    })
  }

  function getSpeechApi() {
    return window.SpeechRecognition || window.webkitSpeechRecognition
  }

  function startVoice() {
    const SpeechRecognition = getSpeechApi()
    if (!SpeechRecognition) {
      alert('当前浏览器暂不支持语音输入，可以先使用文字输入')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onresult = event => {
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript
      }
      setSpeechText(text)
    }
    recognition.onend = () => setRecording(false)
    recognitionRef.current = recognition
    setSpeechText('')
    setRecording(true)
    recognition.start()
  }

  function stopVoice() {
    const text = speechText.trim()
    recognitionRef.current?.stop()
    if (text) setContent(prev => `${prev}${prev ? '\n' : ''}${text}`)
    setRecording(false)
    setSpeechText('')
  }

  async function submitMemory(status = '发布') {
    if (!title.trim() && !content.trim()) {
      alert('先写一点标题或正文吧')
      return
    }
    setSaving(true)

    const imageUrls = []
    for (const file of files) {
      try {
        imageUrls.push(await compressImage(file))
      } catch {
        alert(`照片读取失败：${file.name}`)
      }
    }

    const roomCode = localStorage.getItem('room_code')
    const recordData = {
      title: title.trim() || `${theme}记忆`,
      content: content.trim(),
      location: location.trim() || null,
      image_urls: imageUrls,
      author,
      room_code: roomCode,
      tags: [theme, status === '保存草稿' ? '草稿' : '已发布'],
    }
    if (coords) recordData.coordinates = coords

    let { error } = await supabase.from('memories').insert(recordData)
    if (error && (recordData.coordinates || recordData.tags)) {
      delete recordData.coordinates
      delete recordData.tags
      const retry = await supabase.from('memories').insert(recordData)
      error = retry.error
    }

    setSaving(false)
    if (error) {
      alert(`保存失败：${error.message}`)
      return
    }
    localStorage.removeItem(draftKey)
    bumpVersion()
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: `
        radial-gradient(circle at 16% 8%, rgba(255,255,255,0.92), transparent 28%),
        radial-gradient(circle at 86% 18%, rgba(180,216,225,0.45), transparent 30%),
        radial-gradient(circle at 52% 92%, rgba(255,218,211,0.35), transparent 34%),
        linear-gradient(180deg, #f8fcfc 0%, ${T.bg} 54%, #fff1ee 100%)
      `,
      color: T.ink,
      fontFamily: T.fontBody,
      paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
      overflowX: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', padding: '0 14px' }}>
        <header style={{
          height: 66,
          display: 'grid',
          gridTemplateColumns: '44px 1fr 82px',
          alignItems: 'center',
          gap: 8,
        }}>
          <button onClick={() => navigate(-1)} style={roundButtonStyle}>‹</button>
          <h1 style={{ margin: 0, textAlign: 'center', color: T.primary, fontFamily: T.fontTitle, fontSize: 25, lineHeight: '30px', fontWeight: 760 }}>
            新记忆
          </h1>
          <button onClick={() => submitMemory('发布')} disabled={saving} style={publishButtonStyle}>
            {saving ? '保存中' : '发布'}
          </button>
        </header>

        <main style={{ display: 'grid', gap: 12 }}>
          <GlassCard style={{ padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
              <button onClick={locate} type="button" style={pillButtonStyle(Boolean(coords))}>
                <span>⌖</span>
                <span>{gpsLoading ? '定位中...' : coords ? '准确定位已开启' : '准确定位'}</span>
              </button>
              <button onClick={toggleAuthor} type="button" style={{ ...smallGlassButtonStyle, maxWidth: 94, overflow: 'hidden', textOverflow: 'ellipsis' }}>{author}</button>
            </div>
            <input
              value={location}
              onChange={event => { setLocation(event.target.value); setCoords(null) }}
              placeholder="输入或自动获取位置"
              style={inputStyle}
            />
            {pastLocations.length > 0 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden', paddingTop: 2, maxWidth: '100%' }}>
                {pastLocations.map(addr => (
                  <button key={addr} type="button" onClick={() => { setLocation(addr); setCoords(null) }} style={historyChipStyle}>
                    {addr}
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={labelStyle}>主题</span>
              <button type="button" onClick={() => fileRef.current?.click()} style={smallGlassButtonStyle}>添加照片</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
              {themes.map(item => (
                <button key={item} type="button" onClick={() => setTheme(item)} style={themeChipStyle(theme === item)}>
                  {item}
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickFiles} style={{ display: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => fileRef.current?.click()} style={photoAddStyle}>＋</button>
              {previews.slice(0, 7).map((url, index) => (
                <button key={url} type="button" onClick={() => removeFile(index)} style={photoThumbStyle}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: 14 }}>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="标题"
              style={{ ...inputStyle, height: 48, fontSize: 20, fontWeight: 800, fontFamily: T.fontTitle }}
            />
            <textarea
              value={content}
              onChange={event => setContent(event.target.value)}
              placeholder="主文章 · 输入文字"
              rows={7}
              style={{ ...inputStyle, minHeight: 166, resize: 'vertical', lineHeight: '24px' }}
            />
          </GlassCard>

          <GlassCard style={{ padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '42px 1fr 88px', gap: 10, alignItems: 'center' }}>
              <button type="button" style={roundButtonStyle}>⌨</button>
              <div style={{
                height: 42,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.38)',
                border: '1px solid rgba(255,255,255,0.66)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 12px',
                overflow: 'hidden',
              }}>
                {Array.from({ length: 18 }, (_, i) => (
                  <span key={i} style={{
                    width: 3,
                    height: recording ? 10 + ((i * 7) % 22) : 6 + ((i * 5) % 12),
                    borderRadius: 999,
                    background: recording ? T.primary : 'rgba(143,52,40,0.36)',
                    transition: 'height 160ms ease',
                  }} />
                ))}
                <span style={{ marginLeft: 8, color: T.muted, fontSize: 12, fontWeight: 800 }}>
                  {recording ? (speechText || '正在听...') : '语音输入'}
                </span>
              </div>
              <button
                type="button"
                onMouseDown={startVoice}
                onMouseUp={stopVoice}
                onMouseLeave={() => recording && stopVoice()}
                onTouchStart={startVoice}
                onTouchEnd={stopVoice}
                style={micButtonStyle(recording)}
              >
                按住说话
              </button>
            </div>
          </GlassCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10 }}>
            <button type="button" onClick={() => submitMemory('保存草稿')} disabled={saving} style={draftButtonStyle}>保存草稿</button>
            <button type="button" onClick={() => submitMemory('发布')} disabled={saving} style={publishLargeButtonStyle}>{saving ? '保存中...' : '发布'}</button>
          </div>
        </main>
      </div>
    </div>
  )
}

function GlassCard({ children, style }) {
  return (
    <section style={{
      borderRadius: 26,
      boxSizing: 'border-box',
      width: '100%',
      overflow: 'hidden',
      border: `1px solid ${T.border}`,
      background: 'linear-gradient(145deg, rgba(255,255,255,0.80), rgba(255,255,255,0.34) 54%, rgba(207,229,234,0.24)), rgba(255,255,255,0.52)',
      backdropFilter: 'blur(28px) saturate(1.35)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.35)',
      boxShadow: T.shadow,
      ...style,
    }}>
      {children}
    </section>
  )
}

const labelStyle = {
  color: T.primary,
  fontSize: 14,
  fontWeight: 900,
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 10,
  border: '1px solid rgba(255,255,255,0.68)',
  borderRadius: 18,
  outline: 'none',
  background: 'rgba(255,255,255,0.44)',
  color: T.ink,
  padding: '12px 14px',
  fontFamily: T.fontBody,
  fontSize: 15,
  fontWeight: 700,
}

const roundButtonStyle = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.54)',
  color: T.primary,
  fontFamily: T.fontBody,
  fontSize: 24,
  fontWeight: 900,
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.74)',
}

const publishButtonStyle = {
  height: 38,
  border: 'none',
  borderRadius: 999,
  background: T.primary,
  color: '#fff',
  fontFamily: T.fontBody,
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
}

const smallGlassButtonStyle = {
  border: `1px solid ${T.border}`,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.46)',
  color: T.primary,
  padding: '9px 12px',
  fontFamily: T.fontBody,
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

function pillButtonStyle(active) {
  return {
    border: `1px solid ${active ? 'rgba(143,52,40,0.28)' : T.border}`,
    borderRadius: 999,
    background: active ? 'rgba(143,52,40,0.10)' : 'rgba(255,255,255,0.46)',
    color: active ? T.primary : T.ink,
    minHeight: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: T.fontBody,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
  }
}

const historyChipStyle = {
  border: '1px solid rgba(255,255,255,0.60)',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.34)',
  color: T.muted,
  padding: '7px 10px',
  fontFamily: T.fontBody,
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: 'nowrap',
  maxWidth: 178,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flexShrink: 0,
}

function themeChipStyle(active) {
  return {
    minHeight: 38,
    border: `1px solid ${active ? 'rgba(143,52,40,0.30)' : T.border}`,
    borderRadius: 999,
    background: active ? 'rgba(143,52,40,0.12)' : 'rgba(255,255,255,0.40)',
    color: active ? T.primary : T.muted,
    fontFamily: T.fontBody,
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
  }
}

const photoAddStyle = {
  aspectRatio: '1',
  border: `1px dashed ${T.border}`,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.36)',
  color: T.primary,
  fontSize: 26,
  fontWeight: 800,
  cursor: 'pointer',
}

const photoThumbStyle = {
  aspectRatio: '1',
  border: `1px solid ${T.border}`,
  borderRadius: 18,
  overflow: 'hidden',
  padding: 0,
  background: 'rgba(255,255,255,0.42)',
  cursor: 'pointer',
}

function micButtonStyle(active) {
  return {
    minHeight: 42,
    border: 'none',
    borderRadius: 999,
    background: active ? 'linear-gradient(135deg, #8f3428, #c95f4f)' : 'rgba(143,52,40,0.92)',
    color: '#fff',
    fontFamily: T.fontBody,
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: active ? '0 14px 28px rgba(143,52,40,0.28)' : '0 10px 22px rgba(143,52,40,0.18)',
  }
}

const draftButtonStyle = {
  height: 50,
  borderRadius: 18,
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.50)',
  color: T.primary,
  fontFamily: T.fontBody,
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
}

const publishLargeButtonStyle = {
  height: 50,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.70)',
  background: 'linear-gradient(135deg, #8f3428, #c95f4f)',
  color: '#fff',
  fontFamily: T.fontBody,
  fontSize: 15,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 16px 34px rgba(143,52,40,0.24)',
}
