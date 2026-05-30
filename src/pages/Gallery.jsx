import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = { bg:'#fff8f7',primary:'#7d2b1e',onPrimary:'#ffffff',pContainer:'#9c4233',secondary:'#536346',text:'#56423f',light:'#89726e',border:'#dcc0bc',card:'#fcf9f2',onBg:'#271815',surfVariant:'#fadcd7' }

const diaryRecords = [
  { id:1,date:'Apr 14',title:'Kyoto Spring',location:'Arashiyama Bamboo Grove',text:'The light through the bamboo today was absolutely magical. It felt like walking through a dream. We found a small matcha stand near the river and just sat listening to the rustling leaves for hours.',tags:['#travel','#nature','#peaceful'],image:'https://lh3.googleusercontent.com/aida-public/AB6AXuBl70PvtMl_1xr3u8s-in_qt3O4m8S_oq0l9oi1XUc79DjUx-Lq-3dlRSB2AYLqw_EwUSjZvHO0WWkRX3m7Wt4qPP69Aq2ME6FAXDpLrCMOCyJTOFRCH9_ucP2FCwD7-mrBTzm21Lrgxweqpelb4fQU8eh0wlWCYqI54L21fbFAqnOJxuxKRSzdM2zVF8fFm-wdSsKMbX3PGBsutuyaN02L1UDwzoEEP4qEOKBlOTjYkPX6HnzhFamjGnRYE85pZnuXyk6F1614r2I' },
  { id:2,date:'Apr 10',title:'Coffee Date',location:'Downtown Café',text:'Spent the entire afternoon at our favorite corner café. The barista remembered our usual order. We talked about everything and nothing, and somehow the hours just melted away.',tags:['#food','#date'],images:['https://lh3.googleusercontent.com/aida-public/AB6AXuBPygZfQI3dscIzvK-N7cn8AvAiwVj3VEz22GjQNUaLg02jh2t0yVNyi8mKGMJqFdx_gv7W4eY8UeDSlE5tE06w-6et6jm1XxfHUilZJVM8d4f5Rvur41bXahxAYq28oyaIB4C4lq4BmFwpC5-K8yP1otZCX2izMJHDutM21RDuaX8j7KxQAmK95AlP6-XWeJQKNcQzumtx1WgfTAqS9gF9BanAi6t84H1qFB4kNxxUvei4ImTNWE5WnJkUWpcjjkuI824NepDjriQ','https://lh3.googleusercontent.com/aida-public/AB6AXuBPygZfQI3dscIzvK-N7cn8AvAiwVj3VEz22GjQNUaLg02jh2t0yVNyi8mKGMJqFdx_gv7W4eY8UeDSlE5tE06w-6et6jm1XxfHUilZJVM8d4f5Rvur41bXahxAYq28oyaIB4C4lq4BmFwpC5-K8yP1otZCX2izMJHDutM21RDuaX8j7KxQAmK95AlP6-XWeJQKNcQzumtx1WgfTAqS9gF9BanAi6t84H1qFB4kNxxUvei4ImTNWE5WnJkUWpcjjkuI824NepDjriQ'] },
]

export default function Gallery() {
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
      if(data&&data.length>0){
        setRecords(data.map(m=>({id:m.id,title:m.title,location:m.location,date:new Date(m.created_at).toLocaleDateString('en',{month:'short',day:'numeric'}),text:m.content,tags:m.tags||[],image:m.image_urls?.[0]||null,images:m.image_urls})))
      }else setRecords(diaryRecords)
    }catch{setRecords(diaryRecords)}
  }

  const pagedRecords=records.slice((currentPage-1)*2,currentPage*2)

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:C.bg,paddingBottom:96 }}>
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,opacity:.03,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")` }} />

      <div style={{ width:'100%',maxWidth:430,margin:'0 auto',position:'relative',zIndex:10 }}>

        {/* Header */}
        <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',height:64,background:'rgba(255,255,255,0.4)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.4)',position:'sticky',top:0,zIndex:40,padding:'0 20px' }}>
          <button onClick={()=>navigate('/')} style={{ background:'none',border:'none',color:C.text,cursor:'pointer',fontSize:20 }}>←</button>
          <h1 style={{ fontFamily:'EB Garamond,serif',fontSize:28,fontWeight:600,color:C.primary,fontStyle:'italic',margin:0 }}>Gallery</h1>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <button style={{ background:'none',border:'none',color:C.text,cursor:'pointer',fontSize:20 }}>🔍</button>
            <button onClick={()=>navigate('/new')} style={{ background:'rgba(156,66,51,0.8)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.3)',color:C.onPrimary,borderRadius:999,padding:'6px 12px',fontSize:14,fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif',cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>＋ Write</button>
          </div>
        </header>

        {/* Filters */}
        <section style={{ padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:64,background:'rgba(255,255,255,0.4)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',zIndex:30,borderBottom:'1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ display:'flex',gap:8,overflowX:'auto',flex:1,marginRight:16 }}>
            {['Time ▾','Location ▾','Tags ▾'].map((f,i)=>(<button key={i} onMouseEnter={()=>setHoverFilter(i)} onMouseLeave={()=>setHoverFilter(null)} style={{ background:hoverFilter===i?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.5)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',color:C.text,border:'1px solid rgba(255,255,255,0.6)',borderRadius:999,padding:'6px 16px',fontSize:14,fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif',whiteSpace:'nowrap',cursor:'pointer',transition:'all .3s' }}>{f}</button>))}
          </div>
          <div style={{ display:'flex',background:'rgba(255,255,255,0.6)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',borderRadius:999,padding:4,border:'1px solid rgba(255,255,255,0.6)',flexShrink:0 }}>
            <button onClick={()=>setViewMode('list')} style={{ background:viewMode==='list'?C.primary:'transparent',color:viewMode==='list'?C.onPrimary:C.text,borderRadius:999,padding:'6px 8px',border:'none',cursor:'pointer',fontSize:18 }}>☰</button>
            <button onClick={()=>setViewMode('grid')} style={{ background:viewMode==='grid'?C.primary:'transparent',color:viewMode==='grid'?C.onPrimary:C.text,borderRadius:999,padding:'6px 8px',border:'none',cursor:'pointer',fontSize:18,opacity:viewMode==='grid'?1:.6 }}>▦</button>
          </div>
        </section>

        {/* Entries */}
        <main style={{ padding:'8px 16px',display:'flex',flexDirection:'column',gap:24 }}>
          {pagedRecords.map(entry=>(
            <article key={entry.id} style={{ background:'rgba(255,255,255,0.3)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',borderRadius:24,boxShadow:'0 10px 30px rgba(86,66,63,0.08)',position:'relative',overflow:'hidden',border:'1px solid rgba(255,255,255,0.5)' }}>
              {/* Grid paper bg */}
              <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(156,66,51,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(156,66,51,0.04) 1px,transparent 1px)',backgroundSize:'20px 20px' }} />
              {/* Binding holes */}
              <div style={{ position:'absolute',left:12,top:0,bottom:0,display:'flex',flexDirection:'column',justifyContent:'space-evenly',padding:'24px 0' }}>
                {[0,1,2,3,4,5].map(i=>(<div key={i} style={{ width:12,height:12,borderRadius:'50%',background:'rgba(255,255,255,0.5)',boxShadow:'inset 0 1px 2px rgba(0,0,0,0.05)',border:'1px solid rgba(255,255,255,0.3)' }} />))}
              </div>
              <div style={{ paddingLeft:48,paddingRight:24,paddingTop:24,paddingBottom:24,position:'relative' }}>
                <span style={{ position:'absolute',top:16,right:16,fontSize:24,transform:'rotate(-12deg)',opacity:.8 }}>🎀</span>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
                  <div>
                    <h2 style={{ fontFamily:'EB Garamond,serif',fontSize:24,fontWeight:600,color:C.primary,margin:'0 0 4px' }}>{entry.title}</h2>
                    {entry.location&&<p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,color:C.text,display:'flex',alignItems:'center',gap:4,margin:0 }}>📍 {entry.location}</p>}
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.5)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',color:C.light,borderRadius:999,padding:'4px 12px',fontSize:14,fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif',border:'1px solid rgba(255,255,255,0.6)' }}>{entry.date}</div>
                </div>
                {/* Photos */}
                {entry.images&&entry.images.length>1?(
                  <div style={{ display:'flex',gap:8,marginBottom:24 }}>
                    {entry.images.slice(0,2).map((img,j)=>(
                      <div key={j} style={{ flex:1,background:'#fff',padding:'4px 4px 16px',borderRadius:2,boxShadow:'0 4px 12px rgba(0,0,0,0.08)',transform:`rotate(${j===0?-4:3}deg)` }}>
                        <img src={img} alt="" style={{ width:'100%',height:j===0?160:130,objectFit:'cover',borderRadius:1 }} />
                        <div style={{ position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',width:48,height:18,background:'rgba(255,255,255,0.6)',borderRadius:2,zIndex:20,backdropFilter:'blur(4px)' }} />
                      </div>
                    ))}
                  </div>
                ):entry.image&&(
                  <div style={{ position:'relative',background:'#fff',padding:'8px 8px 32px',borderRadius:2,boxShadow:'0 4px 12px rgba(0,0,0,0.08)',transform:'rotate(2deg)',marginBottom:24 }}>
                    <div style={{ position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',width:64,height:24,background:'rgba(255,255,255,0.6)',borderRadius:2,zIndex:20,backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.8)' }} />
                    <img src={entry.image} alt="" style={{ width:'100%',height:192,objectFit:'cover',borderRadius:1,filter:'grayscale(20%) sepia(10%)' }} />
                  </div>
                )}
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:16,lineHeight:1.8,color:C.onBg,margin:'0 0 16px' }}>
                  <span style={{ color:C.secondary,opacity:.5,marginRight:8 }}>✦</span>{entry.text}
                </p>
                {entry.tags&&<div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{entry.tags.map(t=>(<span key={t} style={{ background:'rgba(255,255,255,0.5)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',color:C.light,borderRadius:999,padding:'6px 12px',fontSize:12,fontFamily:'Plus Jakarta Sans,sans-serif',border:'1px solid rgba(255,255,255,0.6)' }}>{t}</span>))}</div>}
              </div>
            </article>
          ))}
        </main>

        {/* Pager */}
        <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:20,padding:'12px 0' }}>
          <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} style={{ width:40,height:40,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.4)',fontSize:18,color:C.primary,cursor:'pointer',opacity:currentPage===1?.3:1 }}>←</button>
          <div style={{ background:'rgba(255,255,255,0.4)',borderRadius:20,padding:'10px 24px',border:'1px solid rgba(255,255,255,0.4)',display:'flex',alignItems:'center',gap:8,fontFamily:'EB Garamond,serif' }}>
            <span style={{ fontSize:20,fontWeight:700,color:C.primary }}>{currentPage}</span>
            <span style={{ color:C.light }}>/</span>
            <span style={{ fontSize:14,color:C.light }}>{Math.max(1,Math.ceil(records.length/2))}</span>
          </div>
          <button onClick={()=>setCurrentPage(p=>Math.min(Math.ceil(records.length/2),p+1))} disabled={currentPage>=Math.ceil(records.length/2)} style={{ width:40,height:40,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.4)',fontSize:18,color:C.primary,cursor:'pointer',opacity:currentPage>=Math.ceil(records.length/2)?.3:1 }}>→</button>
        </div>
      </div>
    </div>
  )
}
