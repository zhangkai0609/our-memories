import { supabase } from './supabase'

/** 从 session 的 user_metadata 中获取当前用户的 space_id */
export async function getSpaceId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.user_metadata?.space_id || null
}

/** 检查手机号是否为某个 Space 的伴侣手机号，返回该 space_id 或 null */
export async function findPartnerSpace(phone) {
  const cleaned = phone.replace(/[\s\-()+＋]/g, '')
  // 尝试精确匹配和有 +86 前缀的匹配
  const candidates = [cleaned, `+86${cleaned}`, `86${cleaned}`]
  for (const c of candidates) {
    const { data } = await supabase.from('spaces').select('id').or(`partner_phone.eq.${c}`).maybeSingle()
    if (data) return data.id
  }
  return null
}

/** 为新用户创建 Space，返回 space_id。
 *  登录时调用：如果用户还没有 space_id，则为 ta 创建（或查找伴侣邀请）
 *  如果 spaces 表不存在，则使用 user_id 作为 fallback space_id */
export async function getOrCreateSpace(phone) {
  const cleaned = phone.replace(/[\s\-()+＋]/g, '')

  // 1. 先检查是否有伴侣已经邀请了这个手机号
  try {
    const partnerSpace = await findPartnerSpace(cleaned)
    if (partnerSpace) {
      await supabase.auth.updateUser({ data: { space_id: partnerSpace, phone: cleaned } })
      return partnerSpace
    }
  } catch { /* spaces 表可能不存在，忽略 */ }

  // 2. 检查用户是否已有 space_id
  const existing = await getSpaceId()
  if (existing) return existing

  // 3. 尝试创建新 Space，失败则用 user_id 兜底
  try {
    const { data: space, error } = await supabase.from('spaces').insert({
      creator_phone: cleaned,
    }).select('id').single()

    if (!error && space) {
      await supabase.auth.updateUser({ data: { space_id: space.id, phone: cleaned } })
      return space.id
    }
  } catch { /* 表不存在，走 fallback */ }

  // 4. Fallback：使用 Supabase user_id 作为 space_id
  const { data: { user } } = await supabase.auth.getUser()
  const fallbackId = user?.id
  if (fallbackId) {
    await supabase.auth.updateUser({ data: { space_id: fallbackId, phone: cleaned } })
    return fallbackId
  }

  return null
}

/** 关联伴侣手机号：将伴侣手机号写入当前用户的 Space */
export async function linkPartner(partnerPhone) {
  const cleaned = partnerPhone.replace(/[\s\-()+＋]/g, '')
  const spaceId = await getSpaceId()
  if (!spaceId) return { success: false, error: '找不到你的空间' }

  const { error } = await supabase.from('spaces')
    .update({ partner_phone: cleaned })
    .eq('id', spaceId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** 解除伴侣关联 */
export async function unlinkPartner() {
  const spaceId = await getSpaceId()
  if (!spaceId) return { success: false, error: '找不到你的空间' }

  const { error } = await supabase.from('spaces')
    .update({ partner_phone: null })
    .eq('id', spaceId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/** 获取当前空间的伴侣信息 */
export async function getSpaceInfo() {
  const spaceId = await getSpaceId()
  if (!spaceId) return null

  const { data } = await supabase.from('spaces').select('*').eq('id', spaceId).single()
  return data
}
