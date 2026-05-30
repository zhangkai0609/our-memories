import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = { bg:'#fff8f7',primary:'#7d2b1e',onPrimary:'#ffffff',pContainer:'#9c4233',secondary:'#536346',text:'#56423f',light:'#89726e',border:'#dcc0bc',card:'#fcf9f2',onBg:'#271815',surfVariant:'#fadcd7',pFixed:'#ffdad4',error:'#ba1a1a' }

const navItems = [
  { id:'home',icon:'🏠',label:'Home',to:'/' },
  { id:'diary',icon:'📔',label:'Diary',to:'/gallery' },
  { id:'new',icon:'＋',label:'Add',to:'/new' },
  { id:'map',icon:'🗺',label:'Map',to:'/map' },
  { id:'my',icon:'👤',label:'My',to:'/my' },
]

const settingsGrid = [
  [{ id:'home',icon:'🏠',label:'Home',desc:'Manage your space',color:C.primary },
   { id:'theme',icon:'🎨',label:'Theme',desc:'Customize look',color:C.secondary }],
  [{ id:'privacy',icon:'🔒',label:'Privacy',desc:'Who sees memories',color:C.text },
   { id:'alerts',icon:'🔔',label:'Alerts',desc:'Notification settings',color:C.text }],
  [{ id:'backup',icon:'💾',label:'Backup',desc:'Save your data',color:C.text },
   { id:'export',icon:'📤',label:'Export',desc:'Download memories',color:C.text }],
  [{ id:'trash',icon:'🗑',label:'Trash',desc:'Deleted items',color:C.error },
   { id:'help',icon:'💬',label:'Help',desc:'Get support',color:C.secondary }],
]

export default function MyPage() {
  const navigate=useNavigate()
  const [stats,setStats]=useState({diary:0,photos:0,footprints:0,years:0})
  const [showEdit,setShowEdit]=useState(false)
  const [showLogout,setShowLogout]=useState(false)
  const [loggingOut,setLoggingOut]=useState(false)

  // Profile state
  const [myName,setMyName]=useState(localStorage.getItem('my_name')||'')
  const [partnerName,setPartnerName]=useState(localStorage.getItem('partner_name')||'')
  const [myAvatar,setMyAvatar]=useState(localStorage.getItem('my_avatar')||null)
  const [partnerAvatar,setPartnerAvatar]=useState(localStorage.getItem('partner_avatar')||null)
  const [myPet,setMyPet]=useState(localStorage.getItem('my_pet')||null)
  const [partnerPet,setPartnerPet]=useState(localStorage.getItem('partner_pet')||null)
  const meRef=useRef(null);const partnerRef=useRef(null);const myPetRef=useRef(null);const partnerPetRef=useRef(null)

  useEffect(()=>{fetchStats()},[])

  async function fetchStats(){
    try{
      const rc=localStorage.getItem('room_code')
      if(!rc)return
      let q=supabase.from('memories').select('id,created_at',{count:'exact'}).eq('room_code',rc)
      const {count}=await q
      if(count!=null)setStats(s=>({...s,diary:count}))
    }catch{}
  }

  function readFile(e,cb){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(f)}
  function handleSave(){
    if(myName)localStorage.setItem('my_name',myName)
    if(partnerName)localStorage.setItem('partner_name',partnerName)
    if(myAvatar)localStorage.setItem('my_avatar',myAvatar)
    if(partnerAvatar)localStorage.setItem('partner_avatar',partnerAvatar)
    if(myPet)localStorage.setItem('my_pet',myPet)
    if(partnerPet)localStorage.setItem('partner_pet',partnerPet)
    setShowEdit(false);window.location.reload()
  }
  function handleLogout(){
    setLoggingOut(true)
    localStorage.removeItem('room_code')
    window.location.reload()
  }

  const statItems=[
    {icon:'📔',val:stats.diary||'142',label:'Diaries'},
    {icon:'📷',val:'856',label:'Photos'},
    {icon:'🗺',val:'24',label:'Footprints'},
    {icon:'💝',val:stats.years||'3',label:'Years'},
  ]

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:`radial-gradient(circle at 50% 0%,rgba(255,218,212,0.4) 0%,rgba(255,248,247,0) 70%),${C.bg}`,paddingBottom:96 }}>

      <div style={{ width:'100%',maxWidth:430,margin:'0 auto',position:'relative',zIndex:10 }}>

        {/* Header */}
        <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',height:64,background:'rgba(255,248,247,0.8)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:40,padding:'0 20px' }}>
          <h1 style={{ fontFamily:'EB Garamond,serif',fontSize:28,fontWeight:600,color:C.primary,fontStyle:'italic',margin:0 }}>My · 我的</h1>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <button style={{ background:'none',border:'none',fontSize:20,cursor:'pointer' }}>⚙</button>
            <div style={{ position:'relative' }}>
              <button style={{ background:'none',border:'none',fontSize:20,cursor:'pointer' }}>🔔</button>
              <div style={{ position:'absolute',top:2,right:2,width:9,height:9,borderRadius:'50%',background:C.error }} />
            </div>
          </div>
        </header>

        {/* User Info Card */}
        <section onClick={()=>setShowEdit(true)} style={{ margin:'8px 20px',background:'rgba(255,255,255,0.6)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.6)',borderRadius:24,padding:20,display:'flex',alignItems:'center',gap:16,position:'relative',cursor:'pointer',transition:'box-shadow .2s' }}>
          <div style={{ position:'absolute',top:8,right:8,width:128,height:128,borderRadius:'50%',background:'rgba(255,218,212,0.4)',filter:'blur(32px)',pointerEvents:'none' }} />
          <div style={{ position:'relative',flexShrink:0 }}>
            <div style={{ width:64,height:64,borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(255,255,255,0.8)',boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
              {myAvatar?<img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<div style={{ width:'100%',height:'100%',background:'#fce4e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>👤</div>}
            </div>
            <div style={{ position:'absolute',bottom:0,right:0,width:20,height:20,borderRadius:'50%',background:C.secondary,color:'#fff',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff' }}>✎</div>
          </div>
          <div style={{ flex:1,position:'relative',zIndex:1 }}>
            <div style={{ fontFamily:'EB Garamond,serif',fontSize:24,fontWeight:600,color:C.onBg }}>{myName||'Alex Morgan'}</div>
            <span style={{ display:'inline-flex',alignItems:'center',gap:4,marginTop:4,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.6)',color:C.text,fontSize:12,fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:600 }}>♥ Couple Mode</span>
          </div>
          <div style={{ width:64,height:80,background:'#fff',padding:'4px 4px 16px',borderRadius:2,boxShadow:'0 4px 12px rgba(0,0,0,0.08)',transform:'rotate(4deg)',flexShrink:0 }}>
            <div style={{ width:'100%',height:'100%',background:'#ffe2dd',borderRadius:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>🏠</div>
            <div style={{ position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',width:32,height:12,background:'rgba(255,255,255,0.6)',borderRadius:2 }} />
          </div>
        </section>

        {/* Stats Grid */}
        <section style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,margin:'16px 20px' }}>
          {statItems.map(s=>(<div key={s.label} style={{ background:'rgba(255,255,255,0.4)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:20,padding:'16px 8px',textAlign:'center',boxShadow:'0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:28 }}>{s.icon}</div>
            <div style={{ fontFamily:'EB Garamond,serif',fontSize:28,fontWeight:700,color:C.primary,margin:'4px 0' }}>{s.val}</div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,color:C.text }}>{s.label}</div>
          </div>))}
        </section>

        {/* Member Card */}
        <section style={{ margin:'0 20px 16px',background:'rgba(156,66,51,0.2)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:20,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'EB Garamond,serif',fontSize:20,fontWeight:600,color:C.onBg }}>Premium Member</div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,color:C.text,marginTop:4 }}>Unlock all scrapbook features</div>
          </div>
          <div style={{ fontSize:80,opacity:.3 }}>🎖</div>
        </section>

        {/* Settings Grid */}
        <section style={{ margin:'0 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          {settingsGrid.flat().map(item=>(
            <button key={item.id} onClick={()=>console.log(item.id)}
              style={{ background:'rgba(255,255,255,0.4)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:16,padding:'14px 12px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',textAlign:'left',transition:'all .2s',fontFamily:'Plus Jakarta Sans,sans-serif' }}>
              <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>{item.icon}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:600,color:item.color||C.onBg }}>{item.label}</div>
              </div>
            </button>
          ))}
        </section>

        {/* Bottom Note */}
        <div style={{ margin:'20px',background:C.card,border:'1px solid rgba(220,192,188,0.5)',borderRadius:8,transform:'rotate(-1deg)',padding:'16px',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',width:40,height:12,background:'rgba(255,255,255,0.6)',borderRadius:2 }} />
          <p style={{ fontFamily:'EB Garamond,serif',fontSize:18,fontStyle:'italic',color:C.text,textAlign:'center',margin:0 }}>"Every moment matters, keep them safe here."</p>
          <span style={{ position:'absolute',bottom:4,right:8,fontSize:20,opacity:.5 }}>🌸</span>
          <span style={{ position:'absolute',bottom:0,left:4,fontSize:20 }}>🐻</span>
        </div>

        {/* Logout */}
        <button onClick={()=>setShowLogout(true)} style={{ margin:'0 20px 20px',width:'calc(100% - 40px)',padding:'14px',borderRadius:20,background:'rgba(186,26,26,0.08)',border:'1px solid rgba(186,26,26,0.2)',color:C.error,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer' }}>
          🚪 Logout
        </button>
      </div>

      {/* Bottom Nav */}
      <nav style={{ position:'fixed',bottom:0,width:'100%',zIndex:50,display:'flex',justifyContent:'space-around',alignItems:'center',padding:'8px 16px 16px',background:'rgba(255,248,247,0.5)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.3)',maxWidth:430,borderRadius:'16px 16px 0 0' }}>
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>item.to&&navigate(item.to)}
            style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:item.id==='my'?C.pContainer:'transparent',color:item.id==='my'?C.onPrimary:C.text,border:'none',cursor:'pointer',borderRadius:12,padding:'4px 12px',transition:'all .3s',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:10,transform:item.id==='my'?'scale(1.1)':'scale(1)' }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ marginTop:4 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Edit Profile Modal */}
      {showEdit&&(<EditModal {...{myName,setMyName,partnerName,setPartnerName,myAvatar,setMyAvatar,partnerAvatar,setPartnerAvatar,myPet,setMyPet,partnerPet,setPartnerPet,meRef,partnerRef,myPetRef,partnerPetRef,readFile,handleSave,onClose:()=>setShowEdit(false)}} />)}

      {/* Logout Confirm */}
      {showLogout&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div onClick={()=>setShowLogout(false)} style={{ position:'absolute',inset:0,background:'rgba(30,10,8,0.4)',backdropFilter:'blur(4px)' }} />
          <div style={{ position:'relative',zIndex:1,width:'100%',maxWidth:320,background:C.card,borderRadius:24,padding:'28px 22px',textAlign:'center',boxShadow:'0 16px 48px rgba(60,20,15,0.22)' }}>
            <div style={{ fontSize:36,marginBottom:8 }}>👋</div>
            <h3 style={{ fontFamily:'EB Garamond,serif',fontSize:20,color:C.onBg,fontWeight:600,fontStyle:'italic',margin:'0 0 8px' }}>Leave this scrapbook?</h3>
            <p style={{ fontSize:14,color:C.text,margin:'0 0 20px',fontFamily:'Plus Jakarta Sans,sans-serif',lineHeight:1.6 }}>You can always come back with the same room code.</p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>setShowLogout(false)} disabled={loggingOut} style={{ flex:1,padding:12,borderRadius:16,background:'transparent',border:'1.5px solid rgba(220,192,188,0.4)',color:C.text,cursor:'pointer',fontSize:14,fontFamily:'Plus Jakarta Sans,sans-serif' }}>Cancel</button>
              <button onClick={handleLogout} disabled={loggingOut} style={{ flex:1,padding:12,borderRadius:16,background:C.error,color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif',opacity:loggingOut?.7:1 }}>{loggingOut?'Leaving...':'Leave'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Modal
function EditModal(p){
  return (<div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
    <div onClick={p.onClose} style={{ position:'absolute',inset:0,background:'rgba(30,10,8,0.4)',backdropFilter:'blur(4px)' }} />
    <div style={{ position:'relative',zIndex:1,width:'100%',maxWidth:360,background:C.card,borderRadius:24,padding:'24px 18px',boxShadow:'0 16px 48px rgba(60,20,15,0.22)' }}>
      <h3 style={{ fontFamily:'EB Garamond,serif',fontSize:22,color:C.onBg,fontWeight:600,textAlign:'center',margin:'0 0 20px' }}>Edit Profile</h3>
      <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'center',gap:10,marginBottom:20 }}>
        {/* Pet 1 */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
          <button onClick={()=>p.myPetRef.current?.click()} style={{ width:40,height:40,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,background:'#fce4e0' }}>{p.myPet?<img src={p.myPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'🐱'}</button>
          <input ref={p.myPetRef} type="file" accept="image/*" onChange={e=>p.readFile(e,p.setMyPet)} style={{ display:'none' }} />
        </div>
        {/* Me */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
          <button onClick={()=>p.meRef.current?.click()} style={{ width:64,height:64,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,background:'#fce4e0' }}>{p.myAvatar?<img src={p.myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'👤'}</button>
          <input ref={p.meRef} type="file" accept="image/*" onChange={e=>p.readFile(e,p.setMyAvatar)} style={{ display:'none' }} />
          <input value={p.myName} onChange={e=>p.setMyName(e.target.value)} placeholder="Your name" style={{ width:80,textAlign:'center',border:'none',borderBottom:'1px solid #dcc0bc',padding:'4px',fontSize:13,fontFamily:'Plus Jakarta Sans,sans-serif',outline:'none',background:'transparent' }} />
        </div>
        <span style={{ fontSize:20,color:C.primary,marginBottom:20 }}>♥</span>
        {/* Partner */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
          <button onClick={()=>p.partnerRef.current?.click()} style={{ width:64,height:64,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,background:'#fce4e0' }}>{p.partnerAvatar?<img src={p.partnerAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'👤'}</button>
          <input ref={p.partnerRef} type="file" accept="image/*" onChange={e=>p.readFile(e,p.setPartnerAvatar)} style={{ display:'none' }} />
          <input value={p.partnerName} onChange={e=>p.setPartnerName(e.target.value)} placeholder="Their name" style={{ width:80,textAlign:'center',border:'none',borderBottom:'1px solid #dcc0bc',padding:'4px',fontSize:13,fontFamily:'Plus Jakarta Sans,sans-serif',outline:'none',background:'transparent' }} />
        </div>
        {/* Pet 2 */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
          <button onClick={()=>p.partnerPetRef.current?.click()} style={{ width:40,height:40,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.6)',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,background:'#fce4e0' }}>{p.partnerPet?<img src={p.partnerPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'🐶'}</button>
          <input ref={p.partnerPetRef} type="file" accept="image/*" onChange={e=>p.readFile(e,p.setPartnerPet)} style={{ display:'none' }} />
        </div>
      </div>
      <button onClick={p.handleSave} style={{ width:'100%',padding:14,borderRadius:18,background:C.primary,color:'#fff',border:'none',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif' }}>Save</button>
    </div>
  </div>)
}
