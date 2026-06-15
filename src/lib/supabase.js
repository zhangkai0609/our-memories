import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpfbgesagsvlptzviymo.supabase.co'
const supabaseAnonKey = 'sb_publishable_8ZuaOE3zaiBL-vZdNbTu2Q_kAMPTfgD'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** 将手机号转为虚拟邮箱，用于 Supabase 登录 */
export function phoneToEmail(phone) {
  const cleaned = phone.replace(/[\s\-()+＋]/g, '')
  return `p_${cleaned}@om.mail`
}
