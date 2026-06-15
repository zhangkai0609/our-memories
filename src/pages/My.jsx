import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { canonicalRoom, exitRoom as clearActiveRoom, fetchRoomRows, loadRoomProfile, saveRoomProfile } from '../lib/roomProfile'
import { supabase } from '../lib/supabase'

const T = {
  surface:'#fff8f7',primary:'#7d2b1e',onPrimary:'#ffffff',primaryContainer:'#9c4233',
  onPrimaryContainer:'#ffcdc4',secondary:'#536346',onBg:'#271815',
  onSurfaceVariant:'#56423f',outline:'#89726e',outlineVariant:'#dcc0bc',
  surfVariant:'#fadcd7',surfContLowest:'#ffffff',pFixed:'#ffdad4',error:'#ba1a1a',
  onError:'#ffffff',
  headlineMobile:{fontFamily:'"EB Garamond",serif',fontSize:28,fontWeight:600,lineHeight:'36px'},
  headlineMd:{fontFamily:'"EB Garamond",serif',fontSize:24,fontWeight:600,lineHeight:'32px'},
  bodyMd:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:16,fontWeight:400,lineHeight:'24px'},
  bodySm:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:400,lineHeight:'20px'},
  label:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:600,lineHeight:'20px',letterSpacing:'0.05em'},
  accent:{fontFamily:'"EB Garamond",serif',fontSize:18,fontWeight:400,lineHeight:'26px',fontStyle:'italic'},
  glassMd:{backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)'},
  glassLg:{backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'},
  glassXl:{backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)'},
  softShadow:'0px 10px 30px rgba(86,66,63,0.08)',
}

const navItems = [
  {id:'home',icon:'🏠',label:'Home',to:'/'},{id:'diary',icon:'📔',label:'日记',to:'/gallery'},
  {id:'new',icon:'＋',label:'Add',to:'/new'},{id:'map',icon:'🗺',label:'Map',to:'/map'},
  {id:'my',icon:'👤',label:'My',to:'/my'},
]

const settingsGrid = [
  [{id:'home',icon:'🏠',label:'Home',desc:'Manage space',color:T.primary},
   {id:'theme',icon:'🎨',label:'Theme',desc:'Customize look',color:T.secondary}],
  [{id:'privacy',icon:'🔒',label:'Privacy',desc:'Who sees memories',color:T.onSurfaceVariant},
   {id:'alerts',icon:'🔔',label:'Alerts',desc:'Notifications',color:T.onSurfaceVariant}],
  [{id:'backup',icon:'💾',label:'Backup',desc:'保存 data',color:T.onSurfaceVariant},
   {id:'export',icon:'📤',label:'Export',desc:'Download memories',color:T.onSurfaceVariant}],
  [{id:'trash',icon:'🗑',label:'Trash',desc:'Deleted items',color:T.error},
   {id:'help',icon:'💬',label:'Help',desc:'Support',color:T.secondary}],
]

export default function MyPage() {
  const navigate=useNavigate()
  const [stats,setStats]=useState({diary:0,photos:856,footprints:24,years:3})
  const [showEdit,setShowEdit]=useState(false)
  const [show退出小屋,setShow退出小屋]=useState(false)
  const [loggingOut,setLoggingOut]=useState(false)
  const roomCode=canonicalRoom(localStorage.getItem('room_code'))
  const profile=loadRoomProfile(roomCode)
  const [myName,setMyName]=useState(profile.myName||'')
  const [partnerName,setPartnerName]=useState(profile.partnerName||'')
  const [myAvatar,setMyAvatar]=useState(profile.myAvatar||null)
  const [partnerAvatar,setPartnerAvatar]=useState(profile.partnerAvatar||null)
  const [myPet,setMyPet]=useState(localStorage.getItem('my_pet')||null)
  const [partnerPet,setPartnerPet]=useState(localStorage.getItem('partner_pet')||null)
  const meRef=useRef(null);const partnerRef=useRef(null);const myPetRef=useRef(null);const partnerPetRef=useRef(null)

  async function fetchStats(){
    try{const rc=canonicalRoom(localStorage.getItem('room_code'));if(!rc)return
      const rows=await fetchRoomRows(()=>supabase.from('memories').select('id,created_at'),rc)
      setStats(s=>({...s,diary:rows.length}))}catch{
      // Keep the visual fallback stats if the count request fails.
    }
  }

  useEffect(()=>{Promise.resolve().then(fetchStats)},[])

  function rd(e,cb){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(f)}
  function saveProfile(){
    if(myName)localStorage.setItem('my_name',myName);if(partnerName)localStorage.setItem('partner_name',partnerName)
    if(myAvatar)localStorage.setItem('my_avatar',myAvatar);if(partnerAvatar)localStorage.setItem('partner_avatar',partnerAvatar)
    if(myPet)localStorage.setItem('my_pet',myPet);if(partnerPet)localStorage.setItem('partner_pet',partnerPet)
    saveRoomProfile({myName,partnerName,myAvatar,partnerAvatar})
    setShowEdit(false);window.location.reload()
  }
  function handle退出小屋(){setLoggingOut(true);clearActiveRoom();window.location.reload()}

  const statItems=[{icon:'📔',val:stats.diary||142,label:'日记'},{icon:'📷',val:stats.photos,label:'照片'},{icon:'🗺',val:stats.footprints,label:'足迹'},{icon:'💝',val:stats.years,label:'年'}]

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:`radial-gradient(circle at 50% 0%,rgba(255,218,212,0.4) 0%,rgba(255,248,247,0) 70%),${T.surface}`,paddingBottom:96 }}>
      <div style={{ width:'100%',maxWidth:430,margin:'0 auto',position:'relative',zIndex:10 }}>

        {/* ═══ Header - sticky bg-background/80 backdrop-blur-md ═══ */}
        <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',height:64,background:'rgba(255,248,247,0.8)',...T.glassMd,position:'sticky',top:0,zIndex:40,padding:'0 20px' }}>
          <h1 style={{ ...T.headlineMobile,color:T.primary,fontStyle:'italic',margin:0 }}>My · 我的</h1>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <button style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.onSurfaceVariant }}>⚙</button>
            <div style={{ position:'relative' }}>
              <button style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.onSurfaceVariant }}>🔔</button>
              {/* 错误徽章 - w-2.5 h-2.5 bg-error rounded-full */}
              <div style={{ position:'absolute',top:2,right:2,width:9,height:9,borderRadius:'50%',background:T.error }} />
            </div>
          </div>
        </header>

        {/* ═══ User Info Card - bg-surface-container-lowest/60 backdrop-blur-md rounded-[24px] p-5 ═══ */}
        <section onClick={()=>setShowEdit(true)} style={{ margin:'8px 20px',background:'rgba(255,255,255,0.6)',...T.glassLg,border:'1px solid rgba(255,255,255,0.6)',borderRadius:24,padding:20,display:'flex',alignItems:'center',gap:16,position:'relative',cursor:'pointer',transition:'box-shadow .2s' }}>
          {/* 装饰性模糊图案 - w-32 h-32 bg-primary-fixed/40 rounded-full blur-2xl */}
          <div style={{ position:'absolute',top:8,right:8,width:128,height:128,borderRadius:'50%',background:'rgba(255,218,212,0.4)',filter:'blur(32px)',pointerEvents:'none' }} />
          {/* 头像 - w-16 h-16 */}
          <div style={{ position:'relative',flexShrink:0 }}>
            <div style={{ width:64,height:64,borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(255,255,255,0.8)',boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
              {myAvatar?<img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                :<div style={{ width:'100%',height:'100%',background:'#fce4e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>👤</div>}
            </div>
            {/* 编辑铅笔 - text-secondary filled-icon */}
            <div style={{ position:'absolute',bottom:0,right:0,width:20,height:20,borderRadius:'50%',background:T.secondary,color:'#fff',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff' }}>✎</div>
          </div>
          {/* 信息 */}
          <div style={{ flex:1,position:'relative',zIndex:1 }}>
            <div style={{ ...T.headlineMd,color:T.onBg }}>{myName||'Alex Morgan'}</div>
            <span style={{ display:'inline-flex',alignItems:'center',gap:4,marginTop:4,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.6)',color:T.onSurfaceVariant,fontSize:12,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif' }}>♥ 情侣模式</span>
          </div>
          {/* 极地照片 - w-16 h-20 bg-white */}
          <div style={{ width:64,height:80,background:'#fff',padding:'4px 4px 16px',borderRadius:2,boxShadow:'0 4px 12px rgba(0,0,0,0.08)',transform:'rotate(4deg)',flexShrink:0 }}>
            <div style={{ width:'100%',height:'100%',background:'#ffe2dd',borderRadius:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>🏠</div>
            <div style={{ position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',width:32,height:12,background:'rgba(255,255,255,0.6)',borderRadius:2 }} />
          </div>
        </section>

        {/* ═══ Stats Grid - grid-cols-4 ═══ */}
        <section style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,margin:'16px 20px' }}>
          {statItems.map(s=>(
            <div key={s.label} style={{ background:'rgba(255,255,255,0.4)',...T.glassMd,border:'1px solid rgba(255,255,255,0.4)',borderRadius:20,padding:'16px 8px',textAlign:'center',boxShadow:'0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:28 }}>{s.icon}</div>
              <div style={{ ...T.headlineMobile,color:T.primary,margin:'4px 0' }}>{s.val}</div>
              <div style={{ ...T.label,color:T.onSurfaceVariant }}>{s.label}</div>
            </div>
          ))}
        </section>

        {/* ═══ 我们的回忆会员 Card - bg-primary/20 backdrop-blur-lg rounded-[20px] ═══ */}
        <section style={{ margin:'0 20px 16px',background:'rgba(156,66,51,0.2)',...T.glassMd,border:'1px solid rgba(255,255,255,0.5)',borderRadius:20,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <div style={{ ...T.headlineMd,color:T.onBg,margin:0 }}>我们的回忆会员</div>
            <div style={{ ...T.bodySm,color:T.onSurfaceVariant,marginTop:4 }}>解锁更多专属回忆特权</div>
          </div>
          <div style={{ fontSize:80,opacity:.3,flexShrink:0 }}>🎖</div>
        </section>

        {/* ═══ Settings Grid - grid-cols-2 gap-3 ═══ */}
        <section style={{ margin:'0 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          {settingsGrid.flat().map(item=>(
            <button key={item.id} onClick={()=>console.log(item.id)} style={{
              background:'rgba(255,255,255,0.4)',...T.glassMd,border:'1px solid rgba(255,255,255,0.4)',
              borderRadius:16,padding:'14px 12px',display:'flex',alignItems:'center',gap:10,
              cursor:'pointer',textAlign:'left',transition:'all .2s',
            }}>
              {/* w-8 h-8 rounded-full bg-surface-variant/50 */}
              <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:600,color:item.color,fontFamily:'"Plus Jakarta Sans",sans-serif' }}>{item.label}</div>
              </div>
            </button>
          ))}
        </section>

        {/* ═══ Bottom Note - kraft paper rotate-[-1deg] ═══ */}
        <div style={{ margin:'20px',background:T.survVariant,border:`1px solid ${T.outlineVariant}`,opacity:.85,borderRadius:8,transform:'rotate(-1deg)',padding:'16px',position:'relative',overflow:'hidden' }}>
          {/* Tape decoration */}
          <div style={{ position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',width:40,height:12,background:'rgba(255,255,255,0.6)',borderRadius:2 }} />
          <p style={{ ...T.accent,color:T.onBg,textAlign:'center',margin:0 }}>"Every moment matters, keep them safe here."</p>
          {/* Decorations */}
          <span style={{ position:'absolute',bottom:4,right:8,fontSize:20,opacity:.5,pointerEvents:'none' }}>🌸</span>
          <span style={{ position:'absolute',bottom:0,left:4,fontSize:20,pointerEvents:'none' }}>🐻</span>
        </div>

        {/* ═══ 退出小屋 btn ═══ */}
        <button onClick={()=>setShow退出小屋(true)} style={{ margin:'0 20px 20px',width:'calc(100% - 40px)',padding:'14px',borderRadius:20,background:'rgba(186,26,26,0.08)',border:'1px solid rgba(186,26,26,0.2)',color:T.error,fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:600,cursor:'pointer' }}>
          🚪 退出小屋
        </button>
      </div>

      {/* ═══ Bottom Nav ═══ */}
      <nav style={{ position:'fixed',bottom:0,width:'100%',zIndex:50,display:'flex',justifyContent:'space-around',alignItems:'center',padding:'8px 16px 16px',background:'rgba(255,248,247,0.5)',...T.glassXl,borderTop:'1px solid rgba(255,255,255,0.3)',maxWidth:430,borderRadius:'16px 16px 0 0' }}>
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>item.to&&navigate(item.to)} style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:item.id==='my'?T.primaryContainer:'transparent',color:item.id==='my'?T.onPrimary:T.onSurfaceVariant,border:'none',cursor:'pointer',borderRadius:12,padding:'4px 12px',transition:'all .3s',fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:10,transform:item.id==='my'?'scale(1.1)':'scale(1)' }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ marginTop:4 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ═══ 编辑资料 Modal ═══ */}
      {showEdit&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div onClick={()=>setShowEdit(false)} style={{ position:'absolute',inset:0,background:'rgba(30,10,8,0.4)',backdropFilter:'blur(4px)' }} />
          <div style={{ position:'relative',zIndex:1,width:'100%',maxWidth:360,background:T.surfContLowest,borderRadius:24,padding:'24px 18px',boxShadow:'0 16px 48px rgba(60,20,15,0.22)',animation:'modalIn .25s ease-out' }}>
            <h3 style={{ ...T.headlineMd,color:T.onBg,textAlign:'center',margin:'0 0 20px' }}>编辑资料</h3>
            {/* 4个头像: pet1 + me + partner + pet2 */}
            <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'center',gap:10,marginBottom:20 }}>
              {/* Pet1 */}
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                <button onClick={()=>myPetRef.current?.click()} style={{ width:40,height:40,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,background:'#fce4e0' }}>
                  {myPet?<img src={myPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'🐱'}</button>
                <input ref={myPetRef} type="file" accept="image/*" onChange={e=>rd(e,setMyPet)} style={{ display:'none' }} />
              </div>
              {/* Me */}
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                <button onClick={()=>meRef.current?.click()} style={{ width:64,height:64,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,background:'#fce4e0' }}>
                  {myAvatar?<img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'👤'}</button>
                <input ref={meRef} type="file" accept="image/*" onChange={e=>rd(e,setMyAvatar)} style={{ display:'none' }} />
                <input value={myName} onChange={e=>setMyName(e.target.value)} placeholder="Your name" style={{ width:80,textAlign:'center',border:'none',borderBottom:`1px solid ${T.outlineVariant}`,padding:'4px',fontSize:13,fontFamily:'"Plus Jakarta Sans",sans-serif',outline:'none',background:'transparent' }} />
              </div>
              <span style={{ fontSize:20,color:T.primary,marginBottom:20 }}>♥</span>
              {/* Partner */}
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                <button onClick={()=>partnerRef.current?.click()} style={{ width:64,height:64,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,background:'#fce4e0' }}>
                  {partnerAvatar?<img src={partnerAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'👤'}</button>
                <input ref={partnerRef} type="file" accept="image/*" onChange={e=>rd(e,setPartnerAvatar)} style={{ display:'none' }} />
                <input value={partnerName} onChange={e=>setPartnerName(e.target.value)} placeholder="Their name" style={{ width:80,textAlign:'center',border:'none',borderBottom:`1px solid ${T.outlineVariant}`,padding:'4px',fontSize:13,fontFamily:'"Plus Jakarta Sans",sans-serif',outline:'none',background:'transparent' }} />
              </div>
              {/* Pet2 */}
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                <button onClick={()=>partnerPetRef.current?.click()} style={{ width:40,height:40,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,background:'#fce4e0' }}>
                  {partnerPet?<img src={partnerPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'🐶'}</button>
                <input ref={partnerPetRef} type="file" accept="image/*" onChange={e=>rd(e,setPartnerPet)} style={{ display:'none' }} />
              </div>
            </div>
            <button onClick={saveProfile} style={{ width:'100%',padding:14,borderRadius:18,background:T.primary,color:T.onPrimary,border:'none',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'"Plus Jakarta Sans",sans-serif' }}>保存</button>
          </div>
        </div>
      )}

      {/* ═══ 退出小屋 Confirm Modal ═══ */}
      {show退出小屋&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div onClick={()=>setShow退出小屋(false)} style={{ position:'absolute',inset:0,background:'rgba(30,10,8,0.4)',backdropFilter:'blur(4px)' }} />
          <div style={{ position:'relative',zIndex:1,width:'100%',maxWidth:320,background:T.surfContLowest,borderRadius:24,padding:'28px 22px',textAlign:'center',boxShadow:'0 16px 48px rgba(60,20,15,0.22)',animation:'modalIn .25s ease-out' }}>
            <div style={{ fontSize:36,marginBottom:8 }}>👋</div>
            <h3 style={{ ...T.headlineMd,color:T.onBg,fontStyle:'italic',margin:'0 0 8px' }}>确定要退出小屋吗？</h3>
            <p style={{ ...T.bodySm,color:T.onSurfaceVariant,margin:'0 0 20px',fontFamily:'"Plus Jakarta Sans",sans-serif',lineHeight:1.6 }}>之后可以用相同代号重新进入。</p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>setShow退出小屋(false)} disabled={loggingOut} style={{ flex:1,padding:12,borderRadius:16,background:'transparent',border:`1.5px solid ${T.outlineVariant}`,opacity:.4,color:T.onSurfaceVariant,cursor:'pointer',fontSize:14,fontFamily:'"Plus Jakarta Sans",sans-serif' }}>取消</button>
              <button onClick={handle退出小屋} disabled={loggingOut} style={{ flex:1,padding:12,borderRadius:16,background:T.error,color:T.onError,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif',opacity:loggingOut?.7:1 }}>{loggingOut?'退出中...':'退出'}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )
}
