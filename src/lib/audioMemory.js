const AUDIO_RE = /\n*\[\[memory-audio:([^\]]+)\]\]\s*$/

export function packMemoryContent(content, audioUrl) {
  const text = (content || '').trim()
  if (!audioUrl) return text
  return `${text}${text ? '\n\n' : ''}[[memory-audio:${audioUrl}]]`
}

export function unpackMemoryContent(content) {
  const raw = content || ''
  const match = raw.match(AUDIO_RE)
  return {
    text: match ? raw.replace(AUDIO_RE, '').trim() : raw,
    audioUrl: match?.[1] || '',
  }
}
