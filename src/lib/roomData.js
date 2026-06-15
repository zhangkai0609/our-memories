import { canonicalRoom } from './roomProfile'
import { supabase } from './supabase'

let mainRoomBindingPromise = null

export function bindLegacyMemoriesToMainRoom(room) {
  if (canonicalRoom(room) !== '06091117') return Promise.resolve()
  if (mainRoomBindingPromise) return mainRoomBindingPromise

  mainRoomBindingPromise = Promise.allSettled([
    supabase.from('memories').update({ room_code: '06091117' }).eq('room_code', '0609117'),
    supabase.from('memories').update({ room_code: '06091117' }).eq('room_code', ''),
    supabase.from('memories').update({ room_code: '06091117' }).is('room_code', null),
  ]).then(() => undefined)

  return mainRoomBindingPromise
}
