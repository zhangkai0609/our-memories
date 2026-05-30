import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const T = {
  surface:'#fff8f7',primary:'#7d2b1e',onPrimary:'#ffffff',primaryContainer:'#9c4233',
  secondary:'#536346',onBg:'#271815',onSurfaceVariant:'#56423f',
  outline:'#89726e',outlineVariant:'#dcc0bc',pFixed:'#ffdad4',
  headlineMobile:{fontFamily:'"EB Garamond",serif',fontSize:28,fontWeight:600,lineHeight:'36px'},
  headlineMd:{fontFamily:'"EB Garamond",serif',fontSize:24,fontWeight:600,lineHeight:'32px'},
  bodyMd:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:16,fontWeight:400,lineHeight:'24px'},
  bodySm:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:400,lineHeight:'20px'},
  label:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:600,lineHeight:'20px',letterSpacing:'0.05em'},
  accent:{fontFamily:'"EB Garamond",serif',fontSize:18,fontWeight:400,lineHeight:'26px',fontStyle:'italic'},
  glassMd:{backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)'},
  glassLg:{backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'},
  softShadow:'0px 10px 30px rgba(86,66,63,0.08)',
  noiseSvg:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
}

// Mock 数据 - 来自 code.html Entry 1 + Entry 2
const mockEntries = [
  {id:1,date:'Apr 14',author:'小周同学',title:'Kyoto Spring',location:'Arashiyama Bamboo Grove',
    text:'The light through the bamboo today was absolutely magical. It felt like walking through a dream.',
    tags:['#travel','#nature'],image:'https://lh3.googleusercontent.com/aida-public/AB6AXuBl70PvtMl_1xr3u8s-in_qt3O4m8S_oq0l9oi1XUc79DjUx-Lq-3dlRSB2AYLqw_EwUSjZvHO0WWkRX3m7Wt4qPP69Aq2ME6FAXDpLrCMOCyJTOFRCH9_ucP2FCwD7-mrBTzm21Lrgxweqpelb4fQU8eh0wlWCYqI54L21fbFAqnOJxuxKRSzdM2zVF8fFm-wdSsKMbX3PGBsutuyaN02L1UDwzoEEP4qEOKBlOTjYkPX6HnzhFamjGnRYE85pZnuXyk6F1614r2I'},
  {id:2,date:'Apr 10',author:'另一半',title:'Coffee Date',location:'Downtown Café',
    text:'Spent the entire afternoon at our favorite corner café. The barista remembered our usual order.',
    tags:['#food','#date'],image:'https://lh3.googleusercontent.com/aida-public/AB6AXuBPygZfQI3dscIzvK-N7cn8AvAiwVj3VEz22GjQNUaLg02jh2t0yVNyi8mKGMJqFdx_gv7W4eY8UeDSlE5tE06w-6et6jm1XxfHUilZJVM8d4f5Rvur41bXahxAYq28oyaIB4C4lq4BmFwpC5-K8yP1otZCX2izMJHDutM21RDuaX8j7KxQAmK95AlP6-XWeJQKNcQzumtx1WgfTAqS9gF9BanAi6t84H1qFB4kNxxUvei4ImTNWE5WnJkUWpcjjkuI824NepDjriQ'},
]

export default function 日记本() {
  const navigate=useNavigate()
  const [records,setRecords]=useState([])
  const [viewMode,setViewMode]=useState('list')
  const [currentPage,setCurrentPage]=useState(1)
  const [hoverFilter,setHoverFilter]=useState(null)

  useEffect(()=>{fetchData()},[])

  async function fetchData(){
    try{
      const rc=localStorage.getItem('room_code')
      let q=supabase.from('memories').select('*').order('created_at',{ascending:false})
      if(rc)q=q.eq('room_code',rc)
      const {data}=await q
      if(data&&data.length>0) setRecords(data.map(m=>({id:m.id,title:m.title,author:m.author||null,location:m.location,date:new Date(m.created_at).toLocaleDateString('en',{month:'short',day:'numeric'}),text:m.content,caption:'',tags:m.tags||[],image:m.image_urls?.[0]||null,images:m.image_urls})))
      else setRecords(mockEntries)
    }catch{setRecords(mockEntries)}
  }

  const pagedRecords=(records||[]).slice((currentPage-1)*2,currentPage*2)

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:T.surface,paddingBottom:96 }}>
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity:.03,backgroundImage:T.noiseSvg }} />

      <div style={{ width:'100%',maxWidth:430,margin:'0 auto',position:'relative',zIndex:10 }}>

        {/* ═══ TopAppBar - bg-white/40 backdrop-blur-lg ═══ */}
        <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',height:64,background:'rgba(255,255,255,0.4)',...T.glassLg,borderBottom:'1px solid rgba(255,255,255,0.4)',position:'sticky',top:0,zIndex:40,padding:'0 20px' }}>
          <button onClick={()=>navigate('/')} style={{ background:'none',border:'none',color:T.onSurfaceVariant,cursor:'pointer',fontSize:20 }}>←</button>
          <h1 style={{ ...T.headlineMobile,color:T.primary,fontStyle:'italic',margin:0 }}>日记本</h1>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <button style={{ background:'none',border:'none',color:T.onSurfaceVariant,cursor:'pointer',fontSize:20 }}>🔍</button>
            <button onClick={()=>navigate('/new')} style={{ background:'rgba(156,66,51,0.8)',...T.glassMd,border:'1px solid rgba(255,255,255,0.3)',color:T.onPrimary,borderRadius:999,padding:'6px 12px',fontSize:14,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif',cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>＋ 写日记</button>
          </div>
        </header>

        {/* ═══ Filters - sticky top-16 bg-white/40 backdrop-blur-md ═══ */}
        <section style={{ padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:64,background:'rgba(255,255,255,0.4)',...T.glassMd,zIndex:30,borderBottom:'1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ display:'flex',gap:8,overflowX:'auto',flex:1,marginRight:16 }}>
            {['时间 ▾','地点 ▾','标签 ▾'].map((f,i)=>(
              <button key={i} onMouseEnter={()=>setHoverFilter(i)} onMouse退出={()=>setHoverFilter(null)}
                style={{ background:hoverFilter===i?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.5)',...T.glassMd,color:T.onSurfaceVariant,border:'1px solid rgba(255,255,255,0.6)',borderRadius:999,padding:'6px 16px',...T.bodySm,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif',whiteSpace:'nowrap',cursor:'pointer',transition:'all .3s' }}>{f}</button>
            ))}
          </div>
          {/* 视图切换 - bg-white/60 rounded-full p-1 */}
          <div style={{ display:'flex',background:'rgba(255,255,255,0.6)',...T.glassMd,borderRadius:999,padding:4,border:'1px solid rgba(255,255,255,0.6)',flexShrink:0 }}>
            <button onClick={()=>setViewMode('list')} style={{ background:viewMode==='list'?T.primary:'transparent',color:viewMode==='list'?T.onPrimary:T.onSurfaceVariant,borderRadius:999,padding:'6px 8px',border:'none',cursor:'pointer',fontSize:18,boxShadow:viewMode==='list'?'0 2px 4px rgba(0,0,0,0.1)':'none' }}>☰</button>
            <button onClick={()=>setViewMode('grid')} style={{ background:viewMode==='grid'?T.primary:'transparent',color:viewMode==='grid'?T.onPrimary:T.onSurfaceVariant,borderRadius:999,padding:'6px 8px',border:'none',cursor:'pointer',fontSize:18,opacity:viewMode==='grid'?1:.6,boxShadow:viewMode==='grid'?'0 2px 4px rgba(0,0,0,0.1)':'none' }}>▦</button>
          </div>
        </section>

        {/* ═══ Entries - 紧凑版，双条目一页 ═══ */}
        <main style={{ padding:'8px 16px',display:'flex',flexDirection:'column',gap:14 }}>
          {pagedRecords.map(entry=>{
            const myName = localStorage.getItem('my_name') || '小周同学'
            const isMe = entry.author === myName
            return (
            <article key={entry.id} style={{ background:'rgba(255,255,255,0.3)',...T.glassLg,borderRadius:20,boxShadow:T.softShadow,position:'relative',overflow:'hidden',border:'1px solid rgba(255,255,255,0.5)' }}>
              {/* Grid paper */}
              <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(156,66,51,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(156,66,51,0.04) 1px,transparent 1px)',backgroundSize:'18px 18px' }} />
              {/* Binding holes - 只显示3个缩小的 */}
              <div style={{ position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',gap:10 }}>
                {[0,1,2].map(i=>(<div key={i} style={{ width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,0.5)',boxShadow:'inset 0 1px 2px rgba(0,0,0,0.05)',border:'1px solid rgba(255,255,255,0.3)' }} />))}
              </div>
              {/* Content */}
              <div style={{ paddingLeft:28,paddingRight:14,paddingTop:14,paddingBottom:14,position:'relative' }}>

                {/* 顶行: 作者标签 + 日期 */}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                  {/* 作者徽章 */}
                  <span style={{
                    display:'inline-flex',alignItems:'center',gap:4,
                    padding:'3px 10px',borderRadius:999,
                    background:isMe?'rgba(156,66,51,0.12)':'rgba(83,99,70,0.12)',
                    color:isMe?T.primary:T.secondary,
                    fontSize:11,fontWeight:600,
                    fontFamily:'"Plus Jakarta Sans",sans-serif',
                  }}>
                    {isMe?'🧑‍💻':'💕'} {entry.author||myName}
                  </span>
                  <span style={{ background:'rgba(255,255,255,0.5)',...T.glassMd,color:'#8b7770',borderRadius:999,padding:'2px 10px',fontSize:11,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif',border:'1px solid rgba(255,255,255,0.6)' }}>{entry.date}</span>
                </div>

                {/* 标题 + 照片 水平排列 */}
                <div style={{ display:'flex',gap:10,marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <h2 style={{ fontFamily:'"EB Garamond",serif',fontSize:18,fontWeight:600,color:T.primary,margin:'0 0 4px',lineHeight:1.3 }}>{entry.title}</h2>
                    {entry.location&&<p style={{ fontSize:11,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.onSurfaceVariant,display:'flex',alignItems:'center',gap:3,margin:'0 0 6px' }}>📍 {entry.location}</p>}
                    {/* 正文 - 截断 */}
                    <p style={{ fontSize:12,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.onBg,lineHeight:1.6,margin:0,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden' }}>
                      {entry.text}
                    </p>
                  </div>
                  {/* 缩小的照片 */}
                  {entry.image&&(
                    <div style={{ position:'relative',background:'#fff',padding:'3px 3px 12px',borderRadius:2,boxShadow:'0 3px 10px rgba(0,0,0,0.06)',transform:'rotate(2deg)',width:100,flexShrink:0,height:100 }}>
                      <div style={{ position:'absolute',top:-8,left:'50%',transform:'translateX(-50%) skewX(-12deg)',width:32,height:12,background:'rgba(255,255,255,0.6)',borderRadius:1,zIndex:20 }} />
                      <img src={entry.images?.[0]||entry.image} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:1,filter:'grayscale(15%) sepia(8%)' }} />
                    </div>
                  )}
                  {entry.images&&entry.images.length>1&&(
                    <div style={{ display:'flex',flexDirection:'column',gap:4,width:100,flexShrink:0 }}>
                      {entry.images.slice(0,2).map((img,j)=>(
                        <div key={j} style={{ position:'relative',background:'#fff',padding:'2px 2px 10px',borderRadius:2,boxShadow:'0 3px 10px rgba(0,0,0,0.06)',transform:`rotate(${j===0?-3:3}deg)`,height:55 }}>
                          <div style={{ position:'absolute',top:-6,left:'50%',transform:'translateX(-50%) skewX(-12deg)',width:24,height:8,background:'rgba(255,255,255,0.6)',borderRadius:1,zIndex:20 }} />
                          <img src={img} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:1 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {entry.tags&&<div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>{(entry.tags||[]).map(t=>(
                  <span key={t} style={{ background:'rgba(255,255,255,0.5)',...T.glassMd,color:'#8b7770',borderRadius:999,padding:'2px 8px',fontSize:10,fontWeight:500,fontFamily:'"Plus Jakarta Sans",sans-serif',border:'1px solid rgba(255,255,255,0.6)' }}>{t}</span>
                ))}</div>}
              </div>
            </article>
          )})}
        </main>

        {/* ═══ Pager - 便签纸风格 ═══ */}
        <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:20,padding:'12px 0' }}>
          <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
            style={{ width:40,height:40,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.4)',fontSize:18,color:T.primary,cursor:'pointer',opacity:currentPage===1?.3:1 }}>←</button>
          <div style={{ background:'rgba(255,255,255,0.4)',borderRadius:20,padding:'10px 24px',border:'1px solid rgba(255,255,255,0.4)',display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ ...T.headlineMd,color:T.primary }}>{currentPage}</span>
            <span style={{ ...T.bodySm,color:T.outline }}>/</span>
            <span style={{ ...T.bodySm,color:T.outline }}>{Math.max(1,Math.ceil(records.length/2))}</span>
          </div>
          <button onClick={()=>setCurrentPage(p=>Math.min(Math.ceil(records.length/2),p+1))} disabled={currentPage>=Math.ceil(records.length/2)}
            style={{ width:40,height:40,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.4)',fontSize:18,color:T.primary,cursor:'pointer',opacity:currentPage>=Math.ceil(records.length/2)?.3:1 }}>→</button>
        </div>
      </div>
    </div>
  )
}
