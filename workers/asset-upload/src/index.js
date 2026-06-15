const MAX_IMAGE_BYTES = 6 * 1024 * 1024
const MAX_AUDIO_BYTES = 12 * 1024 * 1024

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const audioTypes = new Set(['audio/webm', 'audio/mp4', 'audio/aac', 'audio/mpeg'])

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  })
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('origin') || ''
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean)
  const allowOrigin = allowed.includes('*') || allowed.includes(origin) ? origin || '*' : allowed[0] || '*'
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin',
  }
}

function cleanSegment(value, fallback) {
  const clean = String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 48)
  return clean || fallback
}

function extensionFor(type) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
  }
  return map[type] || 'bin'
}

function makeObjectKey({ roomCode, kind, contentType }) {
  const room = cleanSegment(roomCode, 'unknown-room')
  const assetKind = kind === 'audio' ? 'audio' : 'images'
  const date = new Date()
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const id = crypto.randomUUID()
  return `${room}/${assetKind}/${yyyy}/${mm}/${id}.${extensionFor(contentType)}`
}

async function handleUpload(request, env) {
  const form = await request.formData()
  const file = form.get('file')
  const roomCode = form.get('roomCode')
  const kind = form.get('kind')

  if (!(file instanceof File)) return json({ error: '缺少上传文件' }, { status: 400 })
  const isImage = imageTypes.has(file.type)
  const isAudio = audioTypes.has(file.type)
  if (!isImage && !isAudio) return json({ error: `不支持的文件类型：${file.type || 'unknown'}` }, { status: 415 })

  const maxBytes = isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) return json({ error: '文件太大，请压缩后再上传' }, { status: 413 })

  const key = makeObjectKey({ roomCode, kind: isAudio || kind === 'audio' ? 'audio' : 'image', contentType: file.type })
  await env.MEMORY_ASSETS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      roomCode: String(roomCode || ''),
      kind: isAudio ? 'audio' : 'image',
      originalName: file.name || '',
    },
  })

  const base = String(env.PUBLIC_BASE_URL || '').replace(/\/$/, '')
  const url = base ? `${base}/assets/${key}` : `${new URL(request.url).origin}/assets/${key}`
  return json({ key, url })
}

async function handleAsset(request, env, key) {
  const object = await env.MEMORY_ASSETS.get(key)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable')
  return new Response(object.body, { headers })
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env)
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

    try {
      const url = new URL(request.url)
      if (request.method === 'POST' && url.pathname === '/upload') {
        const response = await handleUpload(request, env)
        Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value))
        return response
      }

      if (request.method === 'GET' && url.pathname.startsWith('/assets/')) {
        return handleAsset(request, env, decodeURIComponent(url.pathname.slice('/assets/'.length)))
      }

      return json({ ok: true, service: 'our-memories-assets' }, { headers: corsHeaders })
    } catch (error) {
      return json({ error: error?.message || '上传服务异常' }, { status: 500, headers: corsHeaders })
    }
  },
}
