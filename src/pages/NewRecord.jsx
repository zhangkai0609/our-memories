import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppIcon from '../components/AppIcon'
import { packMemoryContent } from '../lib/audioMemory'
import { dataUrlToBlob, uploadAsset } from '../lib/assetUpload'
import { bumpVersion, getCached, setCached } from '../lib/cache'
import { canonicalRoom, fetchRoomRows, loadRoomProfile, setRoomValue } from '../lib/roomProfile'
import { supabase } from '../lib/supabase'
import bgImg1 from '../assets/微信图片_20260530235833_96881_4.jpg'
import bgImg2 from '../assets/微信图片_20260530235834_96882_4.png'
import bgImg3 from '../assets/微信图片_20260530235835_96883_4.png'

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

function saveMemoryLocally(recordData) {
  const now = new Date().toISOString()
  const localRecord = {
    ...recordData,
    id: `local-${Date.now()}`,
    created_at: now,
    room_code: canonicalRoom(recordData.room_code),
  }
  const cached = getCached('memories') || []
  setCached('memories', [localRecord, ...cached])
  return localRecord
}

const homeThemes = {
  pearl: `
    radial-gradient(circle at 16% 8%, rgba(255,255,255,0.92), transparent 30%),
    radial-gradient(circle at 86% 18%, rgba(184,217,224,0.42), transparent 28%),
    radial-gradient(circle at 50% 92%, rgba(255,219,211,0.34), transparent 32%),
    linear-gradient(180deg, #fbfbf8 0%, #f1f5f5 48%, #fff3ef 100%)
  `,
  rose: `
    radial-gradient(circle at 18% 10%, rgba(255,255,255,0.94), transparent 30%),
    radial-gradient(circle at 88% 18%, rgba(246,205,211,0.48), transparent 29%),
    radial-gradient(circle at 50% 92%, rgba(205,224,229,0.30), transparent 32%),
    linear-gradient(180deg, #fffafa 0%, #f8eeee 52%, #f0f7f8 100%)
  `,
  paper: `
    radial-gradient(circle at 14% 8%, rgba(255,255,255,0.92), transparent 30%),
    radial-gradient(circle at 86% 20%, rgba(214,231,232,0.36), transparent 28%),
    radial-gradient(circle at 46% 92%, rgba(238,210,171,0.36), transparent 32%),
    linear-gradient(180deg, #fffdf7 0%, #f3eee3 52%, #fff5ec 100%)
  `,
  bloom: `url(${bgImg1}) center/cover fixed no-repeat`,
  dream: `url(${bgImg2}) center/cover fixed no-repeat`,
  warm: `url(${bgImg3}) center/cover fixed no-repeat`,
}

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
        canvas.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('image compression failed'))
        }, 'image/jpeg', 0.72)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function NewRecord() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioChunksRef = useRef([])
  const previewRef = useRef([])
  const roomCode = canonicalRoom(localStorage.getItem('room_code'))
  const profile = loadRoomProfile(roomCode)
  const myName = profile.myName || '小周同学'
  const partnerName = profile.partnerName || '另一半'

  const draft = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) || '{}') } catch { return {} }
  }, [])

  const [title, setTitle] = useState(draft.title || '')
  const [content, setContent] = useState(draft.content || '')
  const [location, setLocation] = useState(draft.location || '')
  const [coords, setCoords] = useState(draft.coords || null)
  const [theme, setTheme] = useState(draft.theme || '日常')
  const [author, setAuthor] = useState(profile.currentAuthor || myName)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [pastLocations, setPastLocations] = useState([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsMessage, setGpsMessage] = useState('')
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(draft.audioUrl || '')
  const [saving, setSaving] = useState(false)
  const homeTheme = profile.homeTheme || 'dream'
  const pageBackground = homeThemes[homeTheme] || homeThemes.dream

  const fetchPastLocations = useCallback(async () => {
    try {
      const data = await fetchRoomRows(
        () => supabase.from('memories')
          .select('location,created_at')
          .not('location', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20),
        roomCode
      )
      const unique = [...new Set((data || []).map(m => (m.location || '').trim()).filter(Boolean))]
      setPastLocations(unique.slice(0, 5))
    } catch {
      setPastLocations([])
    }
  }, [roomCode])

  useEffect(() => {
    Promise.resolve().then(fetchPastLocations)
    return () => previewRef.current.forEach(url => URL.revokeObjectURL(url))
  }, [fetchPastLocations])

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ title, content, location, coords, theme, audioUrl }))
  }, [title, content, location, coords, theme, audioUrl])

  function toggleAuthor() {
    const next = author === myName ? partnerName : myName
    setAuthor(next)
    localStorage.setItem('current_author', next)
    setRoomValue('current_author', next, roomCode)
  }

  async function locate() {
    if (!navigator.geolocation) {
      setGpsMessage('当前设备不支持定位，可以手动输入位置')
      return
    }
    setGpsLoading(true)
    setGpsMessage('正在请求浏览器定位权限...')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const nextCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(nextCoords)
        const addr = await reverseGeocode(nextCoords.lat, nextCoords.lng)
        if (addr) setLocation(addr)
        setGpsMessage(addr ? '已获取准确位置' : '已获取坐标，地址可手动补充')
        setGpsLoading(false)
      },
      error => {
        setGpsLoading(false)
        const message = error.code === 1
          ? '定位权限被拒绝，请在浏览器里允许位置权限，或手动输入位置'
          : error.code === 2
            ? '暂时无法获取位置，请稍后再试或手动输入'
            : '定位超时，请靠近网络后重试或手动输入'
        setGpsMessage(message)
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 }
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

  function getRecorderOptions() {
    if (!window.MediaRecorder) return null
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac']
    const mimeType = candidates.find(type => MediaRecorder.isTypeSupported?.(type))
    return mimeType ? { mimeType } : {}
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  }

  async function startVoice() {
    if (recording) return
    const options = getRecorderOptions()
    if (!options) {
      alert('当前浏览器暂不支持录音，可以先使用文字输入')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, options)
      streamRef.current = stream
      recorderRef.current = recorder
      audioChunksRef.current = []
      recorder.ondataavailable = event => {
        if (event.data?.size) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size) setAudioUrl(await blobToDataUrl(blob))
        streamRef.current?.getTracks().forEach(track => track.stop())
        streamRef.current = null
        recorderRef.current = null
        audioChunksRef.current = []
        setRecording(false)
      }
      recorder.start()
      setAudioUrl('')
      setRecording(true)
    } catch {
      setRecording(false)
      alert('没有拿到麦克风权限，请在浏览器或手机系统里允许麦克风权限')
    }
  }

  function stopVoice() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    else streamRef.current?.getTracks().forEach(track => track.stop())
    setRecording(false)
  }

  function toggleVoice() {
    if (recording) {
      stopVoice()
      return
    }
    startVoice()
  }

  async function submitMemory(status = '发布') {
    if (!title.trim() && !content.trim() && !audioUrl) {
      alert('先写一点标题、正文或录音吧')
      return
    }
    setSaving(true)

    const imageUrls = []
    for (const file of files) {
      try {
        const compressed = await compressImage(file)
        const uploaded = await uploadAsset({
          blob: compressed,
          fileName: file.name?.replace(/\.[^.]+$/, '.jpg') || 'memory.jpg',
          roomCode,
          kind: 'image',
        })
        imageUrls.push(uploaded || await blobToDataUrl(compressed))
      } catch {
        alert(`照片读取失败：${file.name}`)
      }
    }

    let nextAudioUrl = audioUrl
    if (audioUrl?.startsWith('data:')) {
      try {
        const audioBlob = dataUrlToBlob(audioUrl)
        nextAudioUrl = await uploadAsset({
          blob: audioBlob,
          fileName: `voice-${Date.now()}.${audioBlob.type.includes('mp4') ? 'm4a' : 'webm'}`,
          roomCode,
          kind: 'audio',
        }) || audioUrl
      } catch {
        alert('录音上传失败，将暂时按本地数据保存')
      }
    }

    const recordData = {
      title: title.trim() || `${theme}记忆`,
      content: packMemoryContent(content, nextAudioUrl),
      location: location.trim() || null,
      image_urls: imageUrls,
      author,
      room_code: roomCode,
      tags: [theme, status === '保存草稿' ? '草稿' : '已发布'],
    }
    if (coords) recordData.coordinates = coords

    let error
    try {
      const result = await supabase.from('memories').insert(recordData)
      error = result.error
      if (error && (recordData.coordinates || recordData.tags)) {
        delete recordData.coordinates
        delete recordData.tags
        const retry = await supabase.from('memories').insert(recordData)
        error = retry.error
      }
    } catch (networkError) {
      error = networkError
    }

    setSaving(false)
    if (error) {
      saveMemoryLocally(recordData)
      localStorage.removeItem(draftKey)
      bumpVersion()
      alert('网络保存失败，已先保存到本机小屋缓存。等 Supabase 或网络恢复后，我们再做云端同步。')
      navigate('/')
      return
    }
    localStorage.removeItem(draftKey)
    bumpVersion()
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: pageBackground,
      color: T.ink,
      fontFamily: T.fontBody,
      paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(248,252,252,0.72), rgba(238,246,247,0.70) 48%, rgba(255,241,238,0.68))',
        backdropFilter: 'blur(1.5px)',
      }} />
      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', padding: '0 14px', position: 'relative', zIndex: 1 }}>
        <header style={{
          height: 56,
          display: 'grid',
          gridTemplateColumns: '40px 1fr 76px',
          alignItems: 'center',
          gap: 8,
        }}>
          <button onClick={() => navigate(-1)} style={roundButtonStyle}><AppIcon name="back" size={22} /></button>
          <h1 style={{ margin: 0, textAlign: 'center', color: T.primary, fontFamily: T.fontTitle, fontSize: 25, lineHeight: '30px', fontWeight: 760 }}>
            新记忆
          </h1>
          <button onClick={() => submitMemory('发布')} disabled={saving} style={publishButtonStyle}>
            {saving ? '保存中' : '发布'}
          </button>
        </header>

        <main style={{ display: 'grid', gap: 8 }}>
          <GlassCard style={{ padding: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
              <button onClick={locate} type="button" style={pillButtonStyle(Boolean(coords))}>
                <AppIcon name="map" size={15} />
                <span>{gpsLoading ? '获取中...' : coords ? '坐标已获取' : '获取坐标'}</span>
              </button>
              <button onClick={toggleAuthor} type="button" style={{ ...smallGlassButtonStyle, maxWidth: 94, overflow: 'hidden', textOverflow: 'ellipsis' }}>{author}</button>
            </div>
            <input
              value={location}
              onChange={event => { setLocation(event.target.value); setCoords(null) }}
              placeholder="输入或自动获取位置"
              style={{ ...inputStyle, marginTop: 8, minHeight: 40 }}
            />
            {gpsMessage && (
              <p style={{ margin: '8px 4px 0', color: coords ? '#5b704f' : T.primary, fontSize: 11, lineHeight: '16px', fontWeight: 800 }}>
                {gpsMessage}
              </p>
            )}
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

          <GlassCard style={{ padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={labelStyle}>主题</span>
              <button type="button" onClick={() => fileRef.current?.click()} style={addPhotoButtonStyle}><AppIcon name="photo" size={14} /> 添加照片</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
              {themes.map(item => (
                <button key={item} type="button" onClick={() => setTheme(item)} style={themeChipStyle(theme === item)}>
                  {item}
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickFiles} style={{ display: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginTop: 8 }}>
              <button type="button" onClick={() => fileRef.current?.click()} style={photoAddStyle}><AppIcon name="plus" size={24} /></button>
              {previews.slice(0, 7).map((url, index) => (
                <button key={url} type="button" onClick={() => removeFile(index)} style={photoThumbStyle}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: 10 }}>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="标题"
              style={{ ...inputStyle, marginTop: 0, height: 40, fontSize: 18, fontWeight: 800, fontFamily: T.fontTitle }}
            />
            <textarea
              value={content}
              onChange={event => setContent(event.target.value)}
              placeholder="主文章 · 输入文字"
              rows={4}
              style={{ ...inputStyle, minHeight: 106, resize: 'vertical', lineHeight: '22px' }}
            />
          </GlassCard>

          <div style={voiceDockStyle(recording)}>
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={recording ? '取消录音' : '开始录音'}
              style={micCircleStyle(recording)}
            >
              <AppIcon name="mic" size={25} active={recording} />
            </button>
            <span style={voiceHintStyle(recording)}>
              {recording ? '点击完成' : audioUrl ? '已录音' : '录音'}
            </span>
          </div>

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
      border: '1.5px solid rgba(255,255,255,0.78)',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.88), rgba(255,255,255,0.44) 54%, rgba(207,229,234,0.30)), rgba(255,255,255,0.62)',
      backdropFilter: 'blur(32px) saturate(1.42)',
      WebkitBackdropFilter: 'blur(32px) saturate(1.42)',
      boxShadow: '0 22px 60px rgba(64,80,86,0.22), inset 0 1px 0 rgba(255,255,255,0.86), inset 0 0 0 1px rgba(255,255,255,0.30)',
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
  border: '1.5px solid rgba(255,255,255,0.76)',
  borderRadius: 18,
  outline: 'none',
  background: 'rgba(255,255,255,0.56)',
  color: T.ink,
  padding: '12px 14px',
  fontFamily: T.fontBody,
  fontSize: 15,
  fontWeight: 700,
}

const roundButtonStyle = {
  width: 38,
  height: 38,
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
  height: 36,
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

const addPhotoButtonStyle = {
  border: '1px solid rgba(143,52,40,0.26)',
  borderRadius: 999,
  background: 'linear-gradient(145deg, rgba(255,255,255,0.80), rgba(143,52,40,0.13))',
  color: T.primary,
  padding: '8px 13px',
  fontFamily: T.fontBody,
  fontSize: 12,
  fontWeight: 950,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxShadow: '0 10px 22px rgba(143,52,40,0.12), inset 0 1px 0 rgba(255,255,255,0.82)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
}

function pillButtonStyle(active) {
  return {
    border: `1px solid ${active ? 'rgba(143,52,40,0.30)' : 'rgba(143,52,40,0.20)'}`,
    borderRadius: 999,
    background: active
      ? 'linear-gradient(145deg, rgba(255,255,255,0.76), rgba(143,52,40,0.14))'
      : 'linear-gradient(145deg, rgba(255,255,255,0.78), rgba(185,215,223,0.24))',
    color: T.primary,
    minHeight: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: T.fontBody,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(64,80,86,0.10), inset 0 1px 0 rgba(255,255,255,0.82)',
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
    minHeight: 34,
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
  border: '1.5px dashed rgba(143,52,40,0.30)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.52)',
  color: T.primary,
  fontSize: 26,
  fontWeight: 800,
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
}

const photoThumbStyle = {
  aspectRatio: '1',
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  overflow: 'hidden',
  padding: 0,
  background: 'rgba(255,255,255,0.42)',
  cursor: 'pointer',
}

function voiceDockStyle(active) {
  return {
    justifySelf: 'center',
    width: 96,
    height: 96,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.80)',
    background: active
      ? 'linear-gradient(145deg, rgba(255,255,255,0.82), rgba(143,52,40,0.18))'
      : 'linear-gradient(145deg, rgba(255,255,255,0.80), rgba(207,229,234,0.38))',
    backdropFilter: 'blur(28px) saturate(1.45)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.45)',
    display: 'grid',
    placeItems: 'center',
    alignContent: 'center',
    gap: 4,
    boxShadow: active
      ? '0 16px 34px rgba(143,52,40,0.20), inset 0 1px 0 rgba(255,255,255,0.88)'
      : '0 16px 34px rgba(64,80,86,0.16), inset 0 1px 0 rgba(255,255,255,0.88)',
  }
}

function voiceHintStyle(active) {
  return {
    color: active ? T.primary : T.muted,
    fontSize: 10,
    fontWeight: 900,
    lineHeight: '12px',
    maxWidth: 64,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
}

function micCircleStyle(active) {
  return {
    width: 54,
    height: 54,
    border: '1.5px solid rgba(255,255,255,0.78)',
    borderRadius: '50%',
    background: active
      ? 'linear-gradient(145deg, rgba(143,52,40,0.95), rgba(201,95,79,0.82))'
      : 'linear-gradient(145deg, rgba(255,255,255,0.82), rgba(207,229,234,0.46))',
    color: active ? '#fff' : T.primary,
    fontFamily: T.fontBody,
    fontSize: 24,
    fontWeight: 900,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    boxShadow: active
      ? '0 18px 38px rgba(143,52,40,0.30), inset 0 1px 0 rgba(255,255,255,0.36)'
      : '0 16px 34px rgba(64,80,86,0.18), inset 0 1px 0 rgba(255,255,255,0.84)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }
}

const draftButtonStyle = {
  height: 44,
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
  height: 44,
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
