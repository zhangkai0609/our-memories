const uploadEndpoint = import.meta.env.VITE_ASSET_UPLOAD_URL || ''

function extensionFromType(type, fallback = 'bin') {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
    'video/mp4': 'mp4',
  }
  return map[type] || fallback
}

export function dataUrlToBlob(dataUrl) {
  const [header, payload] = String(dataUrl || '').split(',')
  const mime = header?.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream'
  const binary = atob(payload || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function uploadAsset({ blob, fileName, roomCode, kind }) {
  if (!uploadEndpoint) {
    return null
  }

  const form = new FormData()
  const safeName = fileName || `${kind || 'asset'}.${extensionFromType(blob?.type)}`
  form.append('file', blob, safeName)
  form.append('roomCode', roomCode || 'unknown')
  form.append('kind', kind || 'asset')

  let response
  try {
    response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: form,
    })
  } catch {
    return null
  }

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `资源上传失败：${response.status}`)
  }

  const data = await response.json()
  if (!data?.url) throw new Error('资源上传失败：没有返回 URL')
  return data.url
}
