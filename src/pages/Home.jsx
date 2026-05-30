import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = {
  bg:'#fff8f7',primary:'#7d2b1e',onPrimary:'#ffffff',pContainer:'#9c4233',
  secondary:'#536346',text:'#56423f',light:'#89726e',border:'#dcc0bc',
  card:'#fcf9f2',onBg:'#271815',surfVariant:'#fadcd7',pFixed:'#ffdad4',
}

const quickActions = [
  { id:'diary',icon:'📔',label:'Diary',to:'/new' },
  { id:'gallery',icon:'📷',label:'Gallery',to:'/gallery' },
  { id:'map',icon:'🗺',label:'Map',to:'/map' },
  { id:'dates',icon:'💝',label:'Anniv.',to:null },
]
const navItems = [
  { id:'home',icon:'🏠',label:'Home',to:'/' },
  { id:'diary',icon:'📔',label:'Diary',to:'/gallery' },
  { id:'new',icon:'＋',label:'Add',to:'/new' },
  { id:'map',icon:'🗺',label:'Map',to:'/map' },
  { id:'my',icon:'👤',label:'My',to:'/my' },
]

export default function Home() {
  const [memories,setMemories]=useState([])
  const [allMemories,setAllMemories]=useState([])
  const [memoryDays,setMemoryDays]=useState(0)
  const [firstDate,setFirstDate]=useState(null)
  const [barData,setBarData]=useState([])
  const navigate=useNavigate()

  useEffect(()=>{fetchMemories()},[])

  async function fetchMemories(){
    const rc=localStorage.getItem('room_code')
    if(!rc)return
    const q=supabase.from('memories').select('*').order('created_at',{ascending:false})
    q.eq('room_code',rc)
    const {data}=await q
    setMemories((data||[]).slice(0,6))
    setAllMemories(data||[])
    if(data&&data.length>0){
      const first=new Date(data[data.length-1].created_at)
      setFirstDate(first)
      setMemoryDays(Math.floor((Date.now()-first.getTime())/86400000)+1)
      // 14天柱状图数据
      const dmap={}
      for(let i=13;i>=0;i--){const d=new Date(Date.now()-i*86400000);dmap[`${d.getMonth()+1}/${d.getDate()}`]=0}
      data.forEach(m=>{const d=new Date(m.created_at);const k=`${d.getMonth()+1}/${d.getDate()}`;if(k in dmap)dmap[k]++})
      const max=Math.max(...Object.values(dmap),1)
      setBarData(Object.entries(dmap).map(([_,v])=>({h:(v/max)*100,v})))
    }
  }

  const myName=localStorage.getItem('my_name')||'小周同学'
  const partnerName=localStorage.getItem('partner_name')||'另一半'
  const myAvatar=localStorage.getItem('my_avatar')||null
  const partnerAvatar=localStorage.getItem('partner_avatar')||null
  const myPet=localStorage.getItem('my_pet')||null
  const partnerPet=localStorage.getItem('partner_pet')||null
  const mode=localStorage.getItem('room_mode')||'couple'
  const dispMemories=memories.length>0?memories.map(m=>({
    id:m.id,title:m.title,date:new Date(m.created_at).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}),
    image:m.image_urls?.[0]||null,
  })).slice(0,2):[
    {id:1,title:'Sunset at the cove',date:'Oct 20, 2023',image:null},
    {id:2,title:'Cozy sunday morning',date:'Oct 15, 2023',image:null},
  ]

  // hover states
  const [hoverQA,setHoverQA]=useState({})
  const [hoverNav,setHoverNav]=useState('home')

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:C.bg,position:'relative',paddingBottom:96 }}>
      {/* Fractal noise */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity:.03,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")` }} />

      <div style={{ width:'100%',maxWidth:430,margin:'0 auto',position:'relative',zIndex:10,padding:'0 20px' }}>

        {/* ====== TopAppBar ====== */}
        <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',height:64,background:'rgba(255,248,247,0.6)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.2)',position:'sticky',top:0,zIndex:40 }}>
          <button style={{ background:'none',border:'none',color:C.primary,cursor:'pointer',fontSize:20 }}>☰</button>
          <h1 style={{ fontFamily:'EB Garamond,serif',fontSize:28,lineHeight:'36px',fontWeight:600,color:C.primary,fontStyle:'italic',margin:0 }}>Our Memories</h1>
          <div style={{ width:32,height:32,borderRadius:'50%',overflow:'hidden',border:'1px solid rgba(220,192,188,0.3)' }}>
            <img src={myAvatar||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%23dcc0bc'/%3E%3Cellipse cx='50' cy='90' rx='35' ry='25' fill='%23dcc0bc'/%3E%3C/svg%3E"} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
          </div>
        </header>

        <main style={{ display:'flex',flexDirection:'column',gap:24,marginTop:16 }}>

          {/* ====== Greeting Section ====== */}
          <section style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:0,position:'relative' }}>
            <span style={{ position:'absolute',top:-16,left:-8,color:C.primary,opacity:.5,fontSize:24,transform:'rotate(-15deg)' }}>✨</span>
            <span style={{ position:'absolute',bottom:-8,right:-16,color:C.pContainer,opacity:.5,fontSize:20,transform:'rotate(10deg)' }}>🌸</span>
            {/* Pet Left */}
            <div style={{ width:48,height:48,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:'0 10px 30px rgba(86,66,63,0.08)',transform:'rotate(-6deg)',background:'linear-gradient(135deg,#fce4e0,#fdf0ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>
              {myPet?<img src={myPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover'}}/>:'🐱'}
            </div>
            {/* User */}
            <div style={{ width:56,height:56,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:'0 10px 30px rgba(86,66,63,0.08)',zIndex:10,marginLeft:-8,background:'linear-gradient(135deg,#fce4e0,#fdf0ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>
              {myAvatar?<img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover'}}/>:'👤'}
            </div>
            {/* Heart */}
            <div style={{ width:32,height:32,borderRadius:'50%',background:C.pContainer,color:C.onPrimary,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 10px 30px rgba(86,66,63,0.08)',zIndex:20,marginLeft:-8,fontSize:14 }}>♥</div>
            {/* Partner */}
            <div style={{ width:56,height:56,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:'0 10px 30px rgba(86,66,63,0.08)',zIndex:10,marginLeft:-8,background:'linear-gradient(135deg,#fce4e0,#fdf0ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>
              {partnerAvatar?<img src={partnerAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover'}}/>:'👤'}
            </div>
            {/* Pet Right */}
            <div style={{ width:48,height:48,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:'0 10px 30px rgba(86,66,63,0.08)',transform:'rotate(6deg)',marginLeft:-8,background:'linear-gradient(135deg,#fce4e0,#fdf0ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>
              {partnerPet?<img src={partnerPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover'}}/>:'🐶'}
            </div>
          </section>

          {/* ====== Stats Card ====== */}
          <section style={{ background:'rgba(255,255,255,0.4)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:24,padding:24,boxShadow:'0 10px 30px rgba(86,66,63,0.08)',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',inset:0,background:'radial-gradient(circle,rgba(255,200,190,0.3) 0%,rgba(255,200,190,0) 70%)',pointerEvents:'none' }} />
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,position:'relative',zIndex:10 }}>
              <div>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,color:C.text,margin:'0 0 4px' }}>Together for</p>
                <h2 style={{ fontFamily:'EB Garamond,serif',fontSize:48,lineHeight:'56px',fontWeight:700,color:C.primary,letterSpacing:'-0.02em',margin:0 }}>
                  {memoryDays?memoryDays.toLocaleString():'--'} <span style={{ fontSize:24,fontWeight:400,color:C.text }}>days</span>
                </h2>
              </div>
              <div style={{ background:'#fff',borderRadius:8,padding:'8px 12px',textAlign:'center',border:'1px solid rgba(220,192,188,0.3)' }}>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,color:C.secondary,margin:0 }}>{firstDate?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][firstDate.getMonth()]:'Oct'}</p>
                <p style={{ fontFamily:'EB Garamond,serif',fontSize:24,fontWeight:600,color:C.onBg,margin:0 }}>{firstDate?firstDate.getDate():'24'}</p>
              </div>
            </div>
            {barData.length>0&&(
              <div style={{ position:'relative',zIndex:10 }}>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,color:C.text,margin:'0 0 8px' }}>Memory Activity (14 Days)</p>
                <div style={{ display:'flex',alignItems:'flex-end',gap:1,height:48 }}>
                  {barData.map((b,i)=>(<div key={i} style={{ flex:1,height:`${Math.max(4,b.h)}%`,borderRadius:'2px 2px 0 0',background:b.v>0?C.pContainer:'#fadcd7',transition:'height .3s',cursor:'pointer' }} title={`${b.v} memories`} />))}
                </div>
              </div>
            )}
          </section>

          {/* ====== Quick Actions ====== */}
          <section style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginTop:8 }}>
            {quickActions.map(a=>(<button key={a.id} onClick={()=>a.to?navigate(a.to):null}
              onMouseEnter={()=>setHoverQA(p=>({...p,[a.id]:true}))} onMouseLeave={()=>setHoverQA(p=>({...p,[a.id]:false}))}
              style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif' }}>
              <div style={{ width:56,height:56,borderRadius:'50%',background:hoverQA[a.id]?C.pContainer:'rgba(255,255,255,0.4)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:hoverQA[a.id]?C.onPrimary:C.primary,transition:'all .3s',boxShadow:'0 10px 30px rgba(86,66,63,0.08)' }}>{a.icon}</div>
              <span style={{ fontSize:14,fontWeight:600,color:C.text }}>{a.label}</span>
            </button>))}
          </section>

          {/* ====== Recent Memories ====== */}
          <section style={{ marginTop:16 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <h3 style={{ fontFamily:'EB Garamond,serif',fontSize:24,fontWeight:600,color:C.onBg,margin:0 }}>Recent Memories</h3>
              <button onClick={()=>navigate('/gallery')} style={{ background:'none',border:'none',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,color:C.primary,cursor:'pointer' }}>View All</button>
            </div>
            <div style={{ display:'flex',gap:16,overflowX:'auto',paddingBottom:24,margin:'0 -20px',padding:'0 20px',scrollSnapType:'x mandatory',scrollbarWidth:'none' }}>
              {dispMemories.map((m,i)=>(
                <div key={m.id} style={{ minWidth:168,background:'#fff',padding:'8px 8px 24px',borderRadius:4,boxShadow:'0 10px 30px rgba(86,66,63,0.08)',transform:`rotate(${i===0?-2:3}deg)`,scrollSnapAlign:'center',marginTop:i===0?0:8 }}>
                  <div style={{ width:'100%',height:128,background:'#ffe2dd',overflow:'hidden',marginBottom:12 }}>
                    {m.image?<img src={m.image} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>📷</div>}
                  </div>
                  <p style={{ fontFamily:'EB Garamond,serif',fontSize:18,fontStyle:'italic',color:C.onBg,textAlign:'center',margin:'0 0 8px' }}>{m.title}</p>
                  <div style={{ display:'flex',justifyContent:'center' }}>
                    <span style={{ background:'#f7e4dc',color:'#8b7770',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:10,padding:'2px 8px',borderRadius:999 }}>{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* ====== Bottom Nav ====== */}
      <nav style={{ position:'fixed',bottom:0,width:'100%',zIndex:50,display:'flex',justifyContent:'space-around',alignItems:'center',padding:'8px 16px 16px',background:'rgba(255,248,247,0.5)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.3)',boxShadow:'0 -4px 12px rgba(0,0,0,0.03)',maxWidth:430,borderRadius:'16px 16px 0 0' }}>
        {navItems.map(item=>{
          const active=hoverNav===item.id
          return (
            <button key={item.id} onClick={()=>{setHoverNav(item.id);if(item.to)navigate(item.to)}}
              style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:active?C.pContainer:'transparent',color:active?C.onPrimary:C.text,border:'none',cursor:'pointer',borderRadius:12,padding:'4px 12px',transition:'all .3s',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:10,transform:active?'scale(1.1)':'scale(1)' }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ marginTop:4 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
