const PROFILE_DEFAULTS = {
  myName: '小周同学',
  partnerName: '另一半',
  myAvatar: '',
  partnerAvatar: '',
  roomMode: 'couple',
  homeTheme: 'dream',
  currentAuthor: '',
}

function normalizeRoom(room) {
  return (room || '').trim().toLowerCase()
}

export function canonicalRoom(room) {
  const normalized = normalizeRoom(room)
  if (normalized === '0609117') return '06091117'
  return normalized
}

export function getRoomQueryCodes(room) {
  const canonical = canonicalRoom(room)
  if (!canonical) return []
  if (canonical === '06091117') return ['06091117', '0609117']
  return [canonical]
}

export async function fetchRoomRows(makeQuery, room) {
  const canonical = canonicalRoom(room)
  if (!canonical) return []
  const filters = getRoomQueryCodes(canonical).map(code => query => query.eq('room_code', code))
  if (canonical === '06091117') filters.push(query => query.is('room_code', null))

  const results = await Promise.allSettled(filters.map(filter => filter(makeQuery())))
  const rows = []
  const errors = []
  results.forEach(result => {
    if (result.status !== 'fulfilled') {
      errors.push(result.reason)
      return
    }
    if (result.value?.error) {
      errors.push(result.value.error)
      return
    }
    rows.push(...(result.value?.data || []))
  })

  if (!rows.length && errors.length) throw errors[0]

  const seen = new Set()
  return rows
    .filter(row => {
      const key = row?.id == null ? JSON.stringify(row) : String(row.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))
}

export function getActiveRoom() {
  return canonicalRoom(localStorage.getItem('room_code'))
}

export function roomScopedKey(key, room = getActiveRoom()) {
  return `room_${canonicalRoom(room) || '_global'}_${key}`
}

export function getRoomValue(key, fallback = '', room = getActiveRoom()) {
  const canonical = canonicalRoom(room)
  const aliases = getRoomQueryCodes(canonical)
  for (const alias of aliases) {
    const value = localStorage.getItem(`room_${alias}_${key}`)
    if (value != null) return value
  }
  return localStorage.getItem(key) ?? fallback
}

export function setRoomValue(key, value, room = getActiveRoom()) {
  if (value == null) return
  localStorage.setItem(roomScopedKey(key, room), value)
}

export function loadRoomProfile(room = getActiveRoom()) {
  return {
    myName: getRoomValue('my_name', PROFILE_DEFAULTS.myName, room),
    partnerName: getRoomValue('partner_name', PROFILE_DEFAULTS.partnerName, room),
    myAvatar: getRoomValue('my_avatar', PROFILE_DEFAULTS.myAvatar, room),
    partnerAvatar: getRoomValue('partner_avatar', PROFILE_DEFAULTS.partnerAvatar, room),
    roomMode: getRoomValue('room_mode', PROFILE_DEFAULTS.roomMode, room),
    homeTheme: getRoomValue('home_theme', PROFILE_DEFAULTS.homeTheme, room),
    currentAuthor: getRoomValue('current_author', '', room),
  }
}

export function saveRoomProfile(profile, room = getActiveRoom()) {
  if (!room) return
  Object.entries({
    my_name: profile.myName,
    partner_name: profile.partnerName,
    my_avatar: profile.myAvatar,
    partner_avatar: profile.partnerAvatar,
    room_mode: profile.roomMode,
    home_theme: profile.homeTheme,
    current_author: profile.currentAuthor,
  }).forEach(([key, value]) => {
    if (value != null && value !== '') setRoomValue(key, value, room)
  })
}

export function enterRoom(room) {
  const normalized = canonicalRoom(room)
  localStorage.setItem('room_code', normalized)
  const profile = loadRoomProfile(normalized)
  localStorage.setItem('my_name', profile.myName)
  localStorage.setItem('partner_name', profile.partnerName)
  localStorage.setItem('room_mode', profile.roomMode)
  localStorage.setItem('home_theme', profile.homeTheme)
  if (profile.myAvatar) localStorage.setItem('my_avatar', profile.myAvatar)
  else localStorage.removeItem('my_avatar')
  if (profile.partnerAvatar) localStorage.setItem('partner_avatar', profile.partnerAvatar)
  else localStorage.removeItem('partner_avatar')
  if (profile.currentAuthor) localStorage.setItem('current_author', profile.currentAuthor)
  else localStorage.removeItem('current_author')
  return normalized
}

export function exitRoom() {
  ;['room_code', 'my_name', 'partner_name', 'my_avatar', 'partner_avatar', 'room_mode', 'home_theme', 'current_author'].forEach(key => localStorage.removeItem(key))
}

export function getRoomPassword(room) {
  const normalized = canonicalRoom(room)
  if (normalized === '06091117') return getRoomValue('room_password', '06091117', normalized)
  return getRoomValue('room_password', '', normalized) || ''
}

export function setRoomPassword(room, password) {
  const normalized = canonicalRoom(room)
  if (!normalized || !password) return
  localStorage.setItem(roomScopedKey('room_password', normalized), password)
}
