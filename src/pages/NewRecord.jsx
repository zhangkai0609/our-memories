import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function NewRecord() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const navigate = useNavigate()

  function handleFileChange(e) {
    setFiles(Array.from(e.target.files))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setUploading(true)

    const imageUrls = []
    if (files.length > 0) {
      for (const file of files) {
        const fileName = `${Date.now()}_${file.name}`
        const { data, error } = await supabase.storage
          .from('photos')
          .upload(fileName, file)

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(data.path)
          imageUrls.push(urlData.publicUrl)
        }
      }
    }

    const { error } = await supabase.from('memories').insert({
      title: title.trim(),
      content,
      location: location.trim() || null,
      image_urls: imageUrls,
    })

    if (error) {
      alert('发布失败：' + error.message)
    } else {
      navigate('/')
    }
    setUploading(false)
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← 返回</button>
        <span style={styles.headerTitle}>新的回忆</span>
        <div style={{ width: 60 }} />
      </header>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="标题（必填）"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={styles.titleInput}
        />

        <input
          type="text"
          placeholder="📍 地点（选填）"
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={styles.input}
        />

        <textarea
          placeholder="写下你的想法..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          style={styles.textarea}
        />

        <div style={styles.photosSection}>
          <button type="button" onClick={() => fileRef.current.click()} style={styles.photoBtn}>
            📷 选择照片
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {files.length > 0 && (
            <div style={styles.previewGrid}>
              {files.map((f, i) => (
                <div key={i} style={styles.previewItem}>
                  <img src={URL.createObjectURL(f)} alt="" style={styles.previewImg} />
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    style={styles.removeBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={uploading} style={styles.submitBtn}>
          {uploading ? '上传中...' : '发布'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#fafafa' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'white', borderBottom: '1px solid #eee',
  },
  backBtn: { background: 'none', border: 'none', color: '#d81b60', fontSize: '15px', cursor: 'pointer' },
  headerTitle: { fontSize: '16px', fontWeight: '600' },
  form: { maxWidth: '600px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  titleInput: {
    padding: '14px 16px', borderRadius: '12px', border: '1px solid #e0e0e0',
    fontSize: '18px', fontWeight: '600', outline: 'none',
  },
  input: {
    padding: '12px 16px', borderRadius: '12px', border: '1px solid #e0e0e0',
    fontSize: '15px', outline: 'none',
  },
  textarea: {
    padding: '14px 16px', borderRadius: '12px', border: '1px solid #e0e0e0',
    fontSize: '15px', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
    lineHeight: '1.6',
  },
  photosSection: { marginTop: '4px' },
  photoBtn: {
    padding: '10px 20px', borderRadius: '10px', background: '#f5f5f5',
    border: '1px dashed #ccc', cursor: 'pointer', fontSize: '15px',
  },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginTop: '12px' },
  previewItem: { position: 'relative' },
  previewImg: { width: '100%', borderRadius: '10px', objectFit: 'cover', aspectRatio: '1' },
  removeBtn: {
    position: 'absolute', top: '-6px', right: '-6px',
    width: '22px', height: '22px', borderRadius: '50%',
    background: '#333', color: 'white', border: 'none',
    fontSize: '12px', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    marginTop: '12px', padding: '14px', background: '#d81b60',
    color: 'white', border: 'none', borderRadius: '12px',
    fontSize: '16px', fontWeight: '600', cursor: 'pointer',
  },
}
