/* ═══ 全局内存缓存 + localStorage 持久化 ═══
 * 页面切换不重新拉数据，只在新增/修改记忆后才刷新
 */

const memCache = new Map() // 内存缓存 (页面切换保留)

function roomKey() {
  return localStorage.getItem('room_code') || '_global'
}

function memoryKey(key) {
  return `${roomKey()}_${key}`
}

function readLS(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {
    // localStorage can be unavailable in private browsing.
  }
}

/** 获取缓存版本号 — 每次新建/修改记忆后 +1 */
export function getVersion() {
  return readLS(`cache_version_${roomKey()}`) || 0
}

/** 递增版本号 (NewRecord 写入成功后调用) */
export function bumpVersion() {
  const v = getVersion() + 1
  writeLS(`cache_version_${roomKey()}`, v)
  return v
}

/** 读取缓存数据 */
export function getCached(key) {
  const mk = memoryKey(key)
  // 1. 内存缓存 (最快)
  if (memCache.has(mk)) return memCache.get(mk)
  // 2. localStorage
  const lsData = readLS(`cache_${roomKey()}_${key}`)
  if (lsData) {
    memCache.set(mk, lsData)
    return lsData
  }
  return null
}

/** 写入缓存 (同时写内存 + localStorage) */
export function setCached(key, data) {
  memCache.set(memoryKey(key), data)
  writeLS(`cache_${roomKey()}_${key}`, data)
}

/** 清除当前小屋的所有缓存 */
export function clearCache() {
  memCache.clear()
  const rk = roomKey()
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith(`cache_${rk}_`) || k.startsWith(`cache_version_${rk}`)) {
      localStorage.removeItem(k)
    }
  })
}

/** 检查缓存是否过期 (版本号变了 = 有新数据) */
export function isStale(cachedVersion) {
  return cachedVersion !== getVersion()
}
