import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/* ===== Stitch Design Token ===== */
const T = {
  surface:'#fff8f7',primary:'#7d2b1e',onPrimary:'#ffffff',
  primaryContainer:'#9c4233',onPrimaryContainer:'#ffcdc4',
  secondary:'#536346',onBg:'#271815',onSurfaceVariant:'#56423f',
  outline:'#89726e',outlineVariant:'#dcc0bc',
  surfaceContainerLow:'#fff0ee',surfaceContainerHigh:'#ffe2dd',
  surfaceContainerLowest:'#ffffff',surfVariant:'#fadcd7',pFixed:'#ffdad4',
  display:{fontFamily:'"EB Garamond",serif',fontSize:48,fontWeight:700,lineHeight:'56px',letterSpacing:'-0.02em'},
  headlineMobile:{fontFamily:'"EB Garamond",serif',fontSize:28,fontWeight:600,lineHeight:'36px'},
  headlineMd:{fontFamily:'"EB Garamond",serif',fontSize:24,fontWeight:600,lineHeight:'32px'},
  bodyMd:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:16,fontWeight:400,lineHeight:'24px'},
  bodySm:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:400,lineHeight:'20px'},
  label:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:600,lineHeight:'20px',letterSpacing:'0.05em'},
  accent:{fontFamily:'"EB Garamond",serif',fontSize:18,fontWeight:400,lineHeight:'26px',fontStyle:'italic'},
  glassSm:{backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)'},
  glassMd:{backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)'},
  glassXl:{backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)'},
  softShadow:'0px 10px 30px rgba(86,66,63,0.08)',
  dreamyGlow:'radial-gradient(circle, rgba(255,200,190,0.3) 0%, rgba(255,200,190,0) 70%)',
  noiseSvg:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
}

const quickActions = [
  {id:'diary',icon:'📔',label:'日记',to:'/new'},
  {id:'gallery',icon:'📷',label:'日记本',to:'/gallery'},
  {id:'map',icon:'🗺',label:'Map',to:'/map'},
  {id:'dates',icon:'💝',label:'纪念日',to:null},
]
const navItems = [
  {id:'home',icon:'🏠',label:'Home',to:'/'},
  {id:'diary',icon:'📔',label:'日记',to:'/gallery'},
  {id:'new',icon:'＋',label:'Add',to:'/new'},
  {id:'map',icon:'🗺',label:'Map',to:'/map'},
  {id:'my',icon:'👤',label:'My',to:'/my'},
]

export default function Home() {
  const [memories,setMemories]=useState([])
  const [allMemories,setAllMemories]=useState([])
  const [memoryDays,setMemoryDays]=useState(0)
  const [firstDate,setFirstDate]=useState(null)
  const [barData,setBarData]=useState([])
  const [hoverQA,setHoverQA]=useState({})
  const [activeNav,setActiveNav]=useState('home')
  const [hoverNavBtn,setHoverNavBtn]=useState(null)
  const navigate=useNavigate()

  useEffect(()=>{fetchMemories()},[])

  async function fetchMemories(){
    const rc=localStorage.getItem('room_code');if(!rc)return
    const q=supabase.from('memories').select('*').order('created_at',{ascending:false}).eq('room_code',rc)
    const {data}=await q
    setMemories((data||[]).slice(0,6));setAllMemories(data||[])
    if(data&&data.length>0){
      const first=new Date(data[data.length-1].created_at)
      setFirstDate(first);setMemoryDays(Math.floor((Date.now()-first.getTime())/86400000)+1)
      const dmap={}
      for(let i=13;i>=0;i--){const d=new Date(Date.now()-i*86400000);dmap[`${d.getMonth()+1}/${d.getDate()}`]=0}
      data.forEach(m=>{const d=new Date(m.created_at);const k=`${d.getMonth()+1}/${d.getDate()}`;if(k in dmap)dmap[k]++})
      const max=Math.max(...Object.values(dmap),1)
      setBarData(Object.entries(dmap).map(([_,v])=>({h:(v/max)*100,v})))
    }
  }

  const myName=localStorage.getItem('my_name')||'小周同学'
  const myAvatar=localStorage.getItem('my_avatar')||null
  const partnerAvatar=localStorage.getItem('partner_avatar')||null
  const myPet=localStorage.getItem('my_pet')||null
  const partnerPet=localStorage.getItem('partner_pet')||null
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const dispMemories=memories.length>=2?memories.slice(0,2).map(m=>({
    id:m.id,title:m.title,
    date:new Date(m.created_at).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}),
    image:m.image_urls?.[0]||null,
  })):[
    {id:1,title:'Sunset at the cove',date:'Oct 20, 2023',image:null},
    {id:2,title:'Cozy sunday morning',date:'Oct 15, 2023',image:null},
  ]

  if(!localStorage.getItem('room_code')) return (
    <div style={{ minHeight:'100vh',background:T.surface,display:'flex',alignItems:'center',justifyContent:'center',...T.bodyMd,color:T.onSurfaceVariant,fontStyle:'italic' }}>
      请输入小屋代号
    </div>
  )

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:T.surface,position:'relative',paddingBottom:96 }}>
      {/* Fractal noise paper texture - 完全来自 code.html body::before */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity:.03,backgroundImage:T.noiseSvg }} />

      <div style={{ width:'100%',maxWidth:430,margin:'0 auto',position:'relative',zIndex:10,padding:'0 20px' }}>

        {/* ═══ TopAppBar - h-16 bg-surface/60 backdrop-blur-md ═══ */}
        <header style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',height:64,
          background:'rgba(255,248,247,0.6)',...T.glassMd,
          borderBottom:'1px solid rgba(255,255,255,0.2)',
          position:'sticky',top:0,zIndex:40,margin:'0 -20px',padding:'0 20px',
        }}>
          <button style={{ background:'none',border:'none',color:T.primary,cursor:'pointer',fontSize:20 }}>☰</button>
          <h1 style={{ ...T.headlineMobile,color:T.primary,fontStyle:'italic',margin:0 }}>Our Memories</h1>
          <div style={{ width:32,height:32,borderRadius:'50%',overflow:'hidden',border:'1px solid rgba(220,192,188,0.3)' }}>
            {myAvatar?<img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
              :<div style={{ width:'100%',height:'100%',background:'#fce4e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>👤</div>}
          </div>
        </header>

        <main style={{ display:'flex',flexDirection:'column',gap:24,marginTop:16 }}>

          {/* ═══ Greeting Section - 5层头像堆叠 + 装饰 ═══ */}
          <section style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:0,position:'relative',marginTop:8 }}>
            {/* 装饰 emoji - absolute -top-4 -left-2 rotate-[-15deg] */}
            <span style={{ position:'absolute',top:-16,left:-8,color:T.primary,opacity:.5,fontSize:24,transform:'rotate(-15deg)',pointerEvents:'none' }}>✨</span>
            <span style={{ position:'absolute',bottom:-8,right:-16,color:T.primaryContainer,opacity:.5,fontSize:20,transform:'rotate(10deg)',pointerEvents:'none' }}>🌸</span>

            {/* Pet Left - w-12 h-12 rounded-full rotate-[-6deg] */}
            <div style={{ width:48,height:48,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:T.softShadow,transform:'rotate(-6deg)',background:'linear-gradient(135deg,#fce4e0,#fdf0ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,zIndex:0 }}>
              {myPet?<img src={myPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'🐱'}
            </div>
            {/* User - w-14 h-14 z-10 */}
            <div style={{ width:56,height:56,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:T.softShadow,zIndex:10,marginLeft:-8 }}>
              {myAvatar?<img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                :<div style={{ width:'100%',height:'100%',background:'#fce4e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>👤</div>}
            </div>
            {/* Heart - w-8 h-8 bg-primary-container z-20 */}
            <div style={{ width:32,height:32,borderRadius:'50%',background:T.primaryContainer,color:T.onPrimary,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:T.softShadow,zIndex:20,marginLeft:-8,fontSize:14 }}>♥</div>
            {/* Partner - w-14 h-14 z-10 */}
            <div style={{ width:56,height:56,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:T.softShadow,zIndex:10,marginLeft:-8 }}>
              {partnerAvatar?<img src={partnerAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                :<div style={{ width:'100%',height:'100%',background:'#fce4e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>👤</div>}
            </div>
            {/* Pet Right - w-12 h-12 rotate-[6deg] */}
            <div style={{ width:48,height:48,borderRadius:'50%',overflow:'hidden',border:'2px solid #fff',boxShadow:T.softShadow,transform:'rotate(6deg)',marginLeft:-8,background:'linear-gradient(135deg,#fce4e0,#fdf0ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>
              {partnerPet?<img src={partnerPet} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'🐶'}
            </div>
          </section>

          {/* ═══ Stats Card - bg-white/40 backdrop-blur-md rounded-[24px] p-6 ═══ */}
          <section style={{ background:'rgba(255,255,255,0.4)',...T.glassMd,border:'1px solid rgba(255,255,255,0.4)',borderRadius:24,padding:24,boxShadow:T.softShadow,position:'relative',overflow:'hidden' }}>
            {/* Dreamy glow - absolute inset-0 */}
            <div style={{ position:'absolute',inset:0,background:T.dreamyGlow,pointerEvents:'none' }} />
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,position:'relative',zIndex:10 }}>
              <div>
                <p style={{ ...T.bodySm,color:T.onSurfaceVariant,margin:'0 0 4px' }}>我们的记忆</p>
                <h2 style={{ ...T.display,color:T.primary,margin:0 }}>
                  {memoryDays?memoryDays.toLocaleString():'--'} <span style={{ ...T.headlineMd,fontWeight:400,color:T.onSurfaceVariant }}>days</span>
                </h2>
              </div>
              {/* 日期徽章 - bg-surface-container-low rounded-lg p-2 */}
              <div style={{ background:T.surfaceContainerLow,borderRadius:8,padding:'8px 12px',textAlign:'center',border:`1px solid ${T.outlineVariant}`,opacity:.5 }}>
                <p style={{ ...T.label,color:T.secondary,margin:0 }}>{firstDate?months[firstDate.getMonth()]:'Oct'}</p>
                <p style={{ ...T.headlineMd,color:T.onBg,margin:0 }}>{firstDate?firstDate.getDate():24}</p>
              </div>
            </div>
            {/* 14天柱状图 */}
            {barData.length>0&&(
              <div style={{ position:'relative',zIndex:10 }}>
                <p style={{ ...T.label,color:T.onSurfaceVariant,margin:'0 0 8px' }}>记忆活跃度 (14天)</p>
                <div style={{ display:'flex',alignItems:'flex-end',gap:1,height:48 }}>
                  {barData.map((b,i)=>(<div key={i} style={{ flex:1,height:`${Math.max(4,b.h)}%`,borderRadius:'2px 2px 0 0',background:b.v>0?T.primaryContainer:T.surfVariant,transition:'height .3s',cursor:'pointer' }} title={`${b.v} memories`} />))}
                </div>
              </div>
            )}
          </section>

          {/* ═══ Quick Actions - grid grid-cols-4 gap-4 ═══ */}
          <section style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginTop:8 }}>
            {quickActions.map(a=>(
              <button key={a.id} onClick={()=>a.to?navigate(a.to):null}
                onMouseEnter={()=>setHoverQA(p=>({...p,[a.id]:true}))} onMouse退出={()=>setHoverQA(p=>({...p,[a.id]:false}))}
                style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer' }}>
                {/* w-14 h-14 rounded-full bg-white/40 backdrop-blur-sm group-hover:bg-primary-container */}
                <div style={{
                  width:56,height:56,borderRadius:'50%',...T.glassSm,
                  background:hoverQA[a.id]?T.primaryContainer:'rgba(255,255,255,0.4)',
                  border:'1px solid rgba(255,255,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:22,color:hoverQA[a.id]?T.onPrimary:T.primary,
                  transition:'all .3s',boxShadow:T.softShadow,
                }}>{a.icon}</div>
                <span style={{ ...T.label,color:T.onSurfaceVariant }}>{a.label}</span>
              </button>
            ))}
          </section>

          {/* ═══ 最近回忆 Polaroids ═══ */}
          <section style={{ marginTop:16 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <h3 style={{ ...T.headlineMd,color:T.onBg,margin:0 }}>最近回忆</h3>
              <button onClick={()=>navigate('/gallery')} style={{ background:'none',border:'none',...T.label,color:T.primary,cursor:'pointer' }}>查看全部</button>
            </div>
            {/* 水平滚动 - overflow-x-auto hide-scrollbar snap-x -mx-margin-mobile px-margin-mobile */}
            <div style={{ display:'flex',gap:16,overflowX:'auto',paddingBottom:24,margin:'0 -20px',padding:'0 20px',scrollSnapType:'x mandatory',scrollbarWidth:'none' }}>
              {dispMemories.map((m,i)=>(
                <div key={m.id} style={{
                  minWidth:168,background:T.surfaceContainerLowest,padding:'8px 8px 24px',borderRadius:4,
                  boxShadow:T.softShadow,transform:`rotate(${i===0?-2:3}deg)`,scrollSnapAlign:'center',marginTop:i===0?0:8,
                }}>
                  {/* w-full h-32 bg-surface-container-high */}
                  <div style={{ width:'100%',height:128,background:T.surfaceContainerHigh,overflow:'hidden',marginBottom:12 }}>
                    {m.image?<img src={m.image} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                      :<div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>📷</div>}
                  </div>
                  {/* accent-italic text-center */}
                  <p style={{ ...T.accent,color:T.onBg,textAlign:'center',margin:'0 0 8px' }}>{m.title}</p>
                  {/* 日期标签 - bg-[#f7e4dc] text-[#8b7770] rounded-full text-[10px] */}
                  <div style={{ display:'flex',justifyContent:'center' }}>
                    <span style={{ background:'#f7e4dc',color:'#8b7770',fontSize:10,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif',padding:'2px 8px',borderRadius:999 }}>{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* ═══ BottomNav - fixed bottom-0 bg-surface/50 backdrop-blur-xl ═══ */}
      <nav style={{
        position:'fixed',bottom:0,width:'100%',zIndex:50,
        display:'flex',justifyContent:'space-around',alignItems:'center',
        padding:'8px 16px 16px',...T.glassXl,
        background:'rgba(255,248,247,0.5)',borderTop:'1px solid rgba(255,255,255,0.3)',
        boxShadow:'0 -4px 12px rgba(0,0,0,0.03)',maxWidth:430,borderRadius:'16px 16px 0 0',
      }}>
        {navItems.map(item=>{const active=activeNav===item.id;return(
          <button key={item.id} onClick={()=>{setActiveNav(item.id);if(item.to)navigate(item.to)}}
            onMouseEnter={()=>setHoverNavBtn(item.id)} onMouse退出={()=>setHoverNavBtn(null)}
            style={{
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              background:active?T.primaryContainer:hoverNavBtn===item.id?'rgba(255,180,167,0.2)':'transparent',
              color:active?T.onPrimary:T.onSurfaceVariant,
              border:'none',cursor:'pointer',borderRadius:12,padding:'4px 12px',
              transition:'all .3s',transform:active?'scale(1.1)':'scale(1)',
              fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:10,
            }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ marginTop:4 }}>{item.label}</span>
          </button>
        )})}
      </nav>
    </div>
  )
}
