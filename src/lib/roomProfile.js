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

export function getActiveRoom() {
  return normalizeRoom(localStorage.getItem('room_code'))
}

export function roomScopedKey(key, room = getActiveRoom()) {
  return `room_${normalizeRoom(room) || '_global'}_${key}`
}

export function getRoomValue(key, fallback = '', room = getActiveRoom()) {
  return localStorage.getItem(roomScopedKey(key, room)) ?? localStorage.getItem(key) ?? fallback
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
  const normalized = normalizeRoom(room)
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
  const normalized = normalizeRoom(room)
  if (normalized === '06091117' || normalized === '0609117') return localStorage.getItem(roomScopedKey('room_password', normalized)) || '06091117'
  return localStorage.getItem(roomScopedKey('room_password', normalized)) || ''
}

export function setRoomPassword(room, password) {
  const normalized = normalizeRoom(room)
  if (!normalized || !password) return
  localStorage.setItem(roomScopedKey('room_password', normalized), password)
}
