import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#fff0f3', primary: '#9c4233', pLight: '#e87c69', pFixed: '#ffdad4',
  brown: '#1c1c18', text: '#56423f', light: '#89726e',
  border: '#dcc0bc', card: '#fcf9f2', inputBg: '#fdfaf7',
}

export default function NewRecord() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const navigate = useNavigate()

  function handleFileChange(e) { setFiles(Array.from(e.target.files)) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setUploading(true)

    const imageUrls = []
    if (files.length > 0) {
      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase()
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { data, error } = await supabase.storage.from('photos').upload(safeName, file, { upsert: true })
        if (error) { alert('照片上传失败: ' + error.message) }
        else if (data?.path) {
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(data.path)
          imageUrls.push(urlData.publicUrl)
        }
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('memories').insert({
      title: title.trim(), content, location: location.trim() || null, image_urls: imageUrls,
      user_id: user?.id,
    })

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
        <span style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, color: C.primary, fontWeight: 600 }}>
          New Moment
        </span>
        <div style={{ width: 48 }} />
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Title */}
        <input type="text" placeholder="今天发生了什么？" value={title}
          onChange={e => setTitle(e.target.value)} required
          style={{ ...inputStyle, fontSize: 22, fontWeight: 600, fontFamily: 'EB Garamond, serif', padding: '18px 20px' }} />

        {/* Location */}
        <input type="text" placeholder="📍  在哪里？（选填）" value={location}
          onChange={e => setLocation(e.target.value)} style={inputStyle} />

        {/* Content */}
        <textarea placeholder="写下你想记住的一切..." value={content}
          onChange={e => setContent(e.target.value)} rows={6}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8, minHeight: 140 }} />

        {/* Photos */}
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
