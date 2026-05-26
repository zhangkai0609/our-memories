import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#fef9f0',
  card: '#ffffff',
  accent: '#d4787c',
  brown: '#4a3728',
  text: '#6b5544',
  light: '#b8a99a',
  border: '#f0e6d8',
  inputBg: '#fdf6f0',
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
        if (error) {
          alert('照片上传失败: ' + error.message)
        } else if (data?.path) {
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(data.path)
          imageUrls.push(urlData.publicUrl)
        }
      }
    }

    const { error } = await supabase.from('memories').insert({
      title: title.trim(), content, location: location.trim() || null, image_urls: imageUrls,
    })

    if (error) alert('发布失败：' + error.message)
    else navigate('/')
    setUploading(false)
  }

  const inputStyle = {
    padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${C.border}`,
    fontSize: 15, background: C.inputBg, outline: 'none', color: C.brown, width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px', background: 'rgba(254,249,240,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`
      }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: C.accent, fontSize: 15, cursor: 'pointer' }}>← 返回</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: C.brown }}>写一页新的</span>
        <div style={{ width: 48 }} />
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Title */}
        <input type="text" placeholder="今天发生了什么？" value={title} onChange={e => setTitle(e.target.value)} required
          style={{ ...inputStyle, fontSize: 20, fontWeight: 600, padding: '16px 18px' }} />

        {/* Location */}
        <input type="text" placeholder="📍  在哪里？（选填）" value={location} onChange={e => setLocation(e.target.value)}
          style={inputStyle} />

        {/* Content */}
        <textarea placeholder="写下你想记住的一切..." value={content} onChange={e => setContent(e.target.value)} rows={6}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.8, minHeight: 120 }} />

        {/* Photos */}
        <div>
          <button type="button" onClick={() => fileRef.current.click()}
            style={{
              padding: '12px 24px', borderRadius: 14, background: C.card, border: `1.5px dashed ${C.border}`,
              cursor: 'pointer', fontSize: 15, color: C.text, width: '100%'
            }}>
            {files.length > 0 ? `已选择 ${files.length} 张照片` : '📷  添加照片'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />

          {files.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6, marginTop: 12 }}>
              {files.map((f, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', lineHeight: '22px', textAlign: 'center' }}>
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
            marginTop: 8, padding: '15px', background: C.accent, color: '#fff', border: 'none',
            borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', letterSpacing: 3
          }}>
          {uploading ? '保存中...' : '写 下 来'}
        </button>
      </form>
    </div>
  )
}
