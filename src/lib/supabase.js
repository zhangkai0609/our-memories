import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpfbgesagsvlptzviymo.supabase.co'
const supabaseAnonKey = 'sb_publishable_8ZuaOE3zaiBL-vZdNbTu2Q_kAMPTfgD'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
