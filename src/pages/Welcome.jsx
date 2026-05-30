import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/* ===== Stitch Design Token 精确映射 ===== */
const T = {
  // 来自 DESIGN.md 颜色系统
  surface:'#fff8f7', primary:'#7d2b1e', onPrimary:'#ffffff',
  primaryContainer:'#9c4233', onPrimaryContainer:'#ffcdc4',
  secondary:'#536346', onBg:'#271815', onSurfaceVariant:'#56423f',
  outline:'#89726e', outlineVariant:'#dcc0bc',
  surfaceContainerLowest:'#ffffff', pFixed:'#ffdad4',
  bg:'#fff0f3',
  // 排版 - 来自 DESIGN.md typography
  display:{fontFamily:'"EB Garamond",serif',fontSize:48,fontWeight:700,lineHeight:'56px',letterSpacing:'-0.02em'},
  headlineMobile:{fontFamily:'"EB Garamond",serif',fontSize:28,fontWeight:600,lineHeight:'36px'},
  headlineMd:{fontFamily:'"EB Garamond",serif',fontSize:24,fontWeight:600,lineHeight:'32px'},
  bodyMd:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:16,fontWeight:400,lineHeight:'24px'},
  bodySm:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:400,lineHeight:'20px'},
  label:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:14,fontWeight:600,lineHeight:'20px',letterSpacing:'0.05em'},
  accent:{fontFamily:'"EB Garamond",serif',fontSize:18,fontWeight:400,lineHeight:'26px',fontStyle:'italic'},
  // 玻璃效果
  glassMd:{backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)'},
  glassLg:{backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'},
  // 阴影
  softShadow:'0px 10px 30px rgba(86,66,63,0.08)',
  btnShadow:'0 8px 20px rgba(156,66,51,0.25), inset 0 2px 4px rgba(255,255,255,0.2)',
  dreamyGlow:'radial-gradient(circle, rgba(255,200,190,0.4) 0%, transparent 70%)',
  // 纸纹 - 来自 home_glass code.html body::before
  noiseSvg:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
}

const modes = [
  { id:'couple',emoji:'👩‍❤️‍👨',label:'Couple' },
  { id:'friends',emoji:'👯‍♀️',label:'Friends' },
  { id:'besties',emoji:'🤞',label:'Besties' },
  { id:'family',emoji:'🏡',label:'Family' },
]

// 玻璃卡片样式（来自 code.html .glass-card-*）
const glassUnselected = { backgroundColor:'rgba(255,255,255,0.3)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.4)' }
const glassSelected = { backgroundColor:'rgba(156,66,51,0.1)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:'1px solid rgba(156,66,51,0.4)',boxShadow:'inset 0 0 20px rgba(156,66,51,0.15), 0 8px 32px rgba(156,66,51,0.1)' }

export default function Welcome() {
  const [step,setStep]=useState('code')
  const [code,setCode]=useState('')
  const [mode,setMode]=useState('couple')
  const [myName,setMyName]=useState('')
  const [partnerName,setPartnerName]=useState('')
  const [myAvatar,setMyAvatar]=useState(null)
  const [partnerAvatar,setPartnerAvatar]=useState(null)
  const [loading,setLoading]=useState(false)
  const meRef=useRef(null)
  const partnerRef=useRef(null)
  const navigate=useNavigate()

  useEffect(()=>{const c=localStorage.getItem('room_code');if(c&&localStorage.getItem('my_name'))navigate('/')},[])

  async function handleCodeSubmit(e){
    e.preventDefault();const c=code.trim().toLowerCase();if(!c||c.length<2)return
    localStorage.setItem('room_code',c);setLoading(true)
    const {data}=await supabase.from('memories').select('id').eq('room_code',c).limit(1);setLoading(false)
    if(data&&data.length>0){if(!localStorage.getItem('my_name')){localStorage.setItem('my_name','小周同学');localStorage.setItem('partner_name','另一半');localStorage.setItem('room_mode','couple')}navigate('/')}
    else setStep('mode')
  }
  function handleFile(e,setter){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setter(r.result);r.readAsDataURL(f)}
  function handleFinish(){localStorage.setItem('my_name',myName||'小周同学');localStorage.setItem('partner_name',partnerName||'另一半');if(myAvatar)localStorage.setItem('my_avatar',myAvatar);if(partnerAvatar)localStorage.setItem('partner_avatar',partnerAvatar);navigate('/')}

  // Floating emojis 数据 - 完全来自 code.html 的绝对定位
  const emojis = [
    {e:'✨',top:48,left:32,delay:0,size:24},
    {e:'💫',top:128,right:40,delay:1,size:20},
    {e:'🌸',bottom:160,left:48,delay:2,size:30},
    {e:'♥',top:'50%',right:24,delay:1.5,size:20,color:'text-primary'},
    {e:'⭐',bottom:80,right:64,delay:0.5,size:24},
    {e:'🎀',top:256,left:24,delay:2.5,size:24},
  ]

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:T.bg,display:'flex',justifyContent:'center',alignItems:'center',padding:16 }}>
      {/* 最外层移动容器 - 完全来自 code.html */}
      <div style={{
        width:'100%',maxWidth:430,minHeight:800,
        background:'rgba(255,255,255,0.4)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',
        borderRadius:40,boxShadow:'0 20px 60px rgba(86,66,63,0.05)',
        border:'1px solid rgba(220,192,188,0.3)',position:'relative',overflow:'hidden',
        display:'flex',flexDirection:'column',
      }}>
        {/* Ambient Glow - 来自 code.html glow-bg */}
        <div style={{ position:'absolute',inset:0,background:T.dreamyGlow,pointerEvents:'none' }} />

        {/* 浮动 emoji - 来自 code.html floating-emoji */}
        {emojis.map((x,i)=>(
          <span key={i} style={{
            position:'absolute',top:x.top,bottom:x.bottom,left:x.left,right:x.right,
            fontSize:x.size,color:x.color==='text-primary'?T.primary:undefined,
            pointerEvents:'none',zIndex:0,
            animation:`floatE 6s ease-in-out ${x.delay}s infinite`,
          }}>{x.e}</span>
        ))}

        {/* 主内容区 - flex-1 relative z-10 p-margin-mobile (20px) */}
        <div style={{ flex:1,position:'relative',zIndex:10,padding:20,display:'flex',flexDirection:'column' }}>

          {/* ═══ STEP 1: 小屋代号 - code.html #step1 ═══ */}
          {step==='code'&&(
            <div style={{ display:'flex',flexDirection:'column',height:'100%',justifyContent:'space-between',paddingBottom:32,paddingTop:48,animation:'fadeIn .4s ease-out' }}>
              <div style={{ textAlign:'center' }}>
                {/* Hero 图片 - w-64 h-64 rounded-[32px] rotate-2 border-[6px] */}
                <div style={{
                  width:256,height:256,margin:'0 auto',borderRadius:32,overflow:'hidden',
                  boxShadow:'0 15px 40px rgba(86,66,63,0.12)',transform:'rotate(2deg)',
                  border:'6px solid #fff',
                }}>
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWpbALArNceXkcvYhIUwXHYKwjKBVAQjGMTMM7jfo5QrP7Y2oAE2R8PA_CbSf3rYLP9koum8NWRygQim5BdnIfc_UYBCekN5JaPOTBi1B4Wv4kL-eIZfBPYUrGwyO-aBxG0uYlEnfxI6PwHAhm6WpbtSUAfSAkb_9aOYaBRdEk4ozLEJfs0zw8c8WkreSFrz6oKmMPMAPIQ__R-KPA5Wh2-lvhtXwtpsq2XPeaD2AKtloC4xPOyy7CHfGdYoBMEKylnuhSgRXsrTs" alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                </div>
                {/* 标题区 space-y-2 */}
                <div style={{ marginTop:32 }}>
                  <h1 style={{ ...T.display,color:T.primary,fontStyle:'italic',margin:0 }}>Our Memories</h1>
                  <p style={{ ...T.bodyMd,color:T.onSurfaceVariant,margin:'8px 0 0' }}>开启属于你们的数字手账。</p>
                </div>
              </div>

              {/* 玻璃面板 - space-y-6 mt-12 p-6 rounded-3xl backdrop-blur-md bg-white/40 */}
              <form onSubmit={handleCodeSubmit} style={{
                marginTop:48,padding:24,borderRadius:24,
                background:'rgba(255,255,255,0.4)',...T.glassMd,
                border:'1px solid rgba(255,255,255,0.3)',
                boxShadow:'0 8px 32px rgba(86,66,63,0.05)',
                display:'flex',flexDirection:'column',gap:24,
              }}>
                <div>
                  <label style={{ ...T.label,color:T.onBg,marginLeft:16,textTransform:'uppercase',fontSize:12,display:'block',marginBottom:8 }}>Room Code</label>
                  {/* 输入框 - h-14 rounded-full bg-white/60 border-white/50 tracking-[0.2em] body-lg text-center */}
                  <input value={code} onChange={e=>setCode(e.target.value)} placeholder="输入小屋代号..."
                    style={{ width:'100%',height:56,padding:'0 24px',borderRadius:999,
                      background:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.5)',
                      fontSize:18,fontFamily:'"Plus Jakarta Sans",sans-serif',textAlign:'center',
                      letterSpacing:'0.2em',outline:'none',boxSizing:'border-box',
                      boxShadow:'inset 0 1px 4px rgba(0,0,0,0.05)' }} />
                </div>
                {/* 主按钮 - full rounded-full primary shadow */}
                <button type="submit" disabled={loading} style={{
                  width:'100%',height:56,borderRadius:999,background:T.primary,color:T.onPrimary,
                  ...T.label,textTransform:'uppercase',letterSpacing:'0.05em',
                  border:'none',cursor:'pointer',boxShadow:T.btnShadow,opacity:loading?0.7:1 }}>
                  {loading?'进入中...':'进入小屋'}
                </button>
                <p style={{ textAlign:'center',...T.bodySm,color:T.onSurfaceVariant,cursor:'pointer' }}>或创建新的小屋</p>
              </form>
            </div>
          )}

          {/* ═══ STEP 2: 选择模式 - code.html #step2 ═══ */}
          {step==='mode'&&(
            <div style={{ display:'flex',flexDirection:'column',height:'100%',paddingTop:64,paddingBottom:32,animation:'fadeIn .4s ease-out' }}>
              <div style={{ textAlign:'center',marginBottom:48 }}>
                <h2 style={{ ...T.headlineMobile,color:T.onBg,margin:'0 0 12px' }}>选择关系模式</h2>
                <p style={{ ...T.bodyMd,color:T.onSurfaceVariant,margin:0 }}>你们是什么样的关系？</p>
              </div>
              {/* 2×2 网格 - grid grid-cols-2 gap-4 */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,flex:1 }}>
                {modes.map(m=>{const sel=mode===m.id;return(
                  <button key={m.id} onClick={()=>setMode(m.id)} style={{
                    cursor:'pointer',position:'relative',borderRadius:16,padding:'24px 16px',
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,
                    transition:'all .3s',...(sel?glassSelected:glassUnselected),
                  }}>
                    {/* 选中勾号 - from selectMode JS */}
                    {sel?<div style={{ position:'absolute',top:12,right:12,width:24,height:24,borderRadius:'50%',background:T.primary,color:T.onPrimary,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700 }}>✓</div>
                      :<div style={{ position:'absolute',top:12,right:12,width:24,height:24,borderRadius:'50%',border:'2px solid rgba(220,192,188,0.3)' }} />}
                    <span style={{ fontSize:36,transition:'transform .2s' }}>{m.emoji}</span>
                    <span style={{ ...T.label,color:sel?T.primary:T.onSurfaceVariant }}>{m.label}</span>
                  </button>
                )})}
              </div>
              <div style={{ marginTop:'auto',paddingTop:32 }}>
                <button onClick={()=>{localStorage.setItem('room_mode',mode);setStep('profile')}} style={{
                  width:'100%',height:56,borderRadius:999,background:T.primary,color:T.onPrimary,
                  ...T.label,textTransform:'uppercase',letterSpacing:'0.05em',border:'none',cursor:'pointer',boxShadow:T.btnShadow }}>
                  继续
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: 头像设置 - code.html #step3 ═══ */}
          {step==='profile'&&(
            <div style={{ display:'flex',flexDirection:'column',height:'100%',paddingTop:64,paddingBottom:32,animation:'fadeIn .4s ease-out' }}>
              <div style={{ textAlign:'center',marginBottom:64 }}>
                <h2 style={{ ...T.headlineMobile,color:T.onBg,margin:'0 0 12px' }}>设置头像</h2>
                <p style={{ ...T.bodyMd,color:T.onSurfaceVariant,margin:0 }}>让小屋更有你们的感觉</p>
              </div>
              <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:48,padding:'0 16px' }}>
                {/* 双头像行 + 心形分隔 */}
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:24,width:'100%' }}>
                  {/* 头像1 - w-20 h-20 rounded-full bg-white/50 backdrop-blur-sm */}
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
                    <button onClick={()=>meRef.current?.click()} style={{
                      width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.5)',
                      backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',
                      border:'1px solid rgba(255,255,255,0.6)',
                      boxShadow:'0 10px 25px rgba(86,66,63,0.1)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      cursor:'pointer',position:'relative',overflow:'hidden',
                    }}>
                      {myAvatar?<img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                        :<span style={{ fontSize:30,color:T.outline }}>📷</span>}
                      <input ref={meRef} type="file" accept="image/*" onChange={e=>handleFile(e,setMyAvatar)} style={{ display:'none' }} />
                    </button>
                    <input value={myName} onChange={e=>setMyName(e.target.value)} placeholder="你的名字" style={{
                      width:112,textAlign:'center',background:'transparent',border:'none',
                      borderBottom:'1px solid rgba(220,192,188,0.5)',padding:'4px 8px',
                      ...T.bodyMd,color:T.onBg,outline:'none',
                    }} />
                  </div>
                  {/* 心形 - mt-[-40px] */}
                  <div style={{ flexShrink:0,marginTop:-40 }}>
                    <span style={{ ...T.headlineMd,color:T.primary,opacity:.8 }}>♥</span>
                  </div>
                  {/* 头像2 */}
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
                    <button onClick={()=>partnerRef.current?.click()} style={{
                      width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.5)',
                      backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',
                      border:'1px solid rgba(255,255,255,0.6)',
                      boxShadow:'0 10px 25px rgba(86,66,63,0.1)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      cursor:'pointer',position:'relative',overflow:'hidden',
                    }}>
                      {partnerAvatar?<img src={partnerAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                        :<span style={{ fontSize:30,color:T.outline }}>📷</span>}
                      <input ref={partnerRef} type="file" accept="image/*" onChange={e=>handleFile(e,setPartnerAvatar)} style={{ display:'none' }} />
                    </button>
                    <input value={partnerName} onChange={e=>setPartnerName(e.target.value)} placeholder="ta的名字" style={{
                      width:112,textAlign:'center',background:'transparent',border:'none',
                      borderBottom:'1px solid rgba(220,192,188,0.5)',padding:'4px 8px',
                      ...T.bodyMd,color:T.onBg,outline:'none',
                    }} />
                  </div>
                </div>
                {/* 引用卡片 - backdrop-blur-md bg-white/40 rounded-2xl p-6 */}
                <div style={{ width:'100%',...T.glassMd,background:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:16,padding:24,boxShadow:'0 10px 30px rgba(86,66,63,0.05)',textAlign:'center' }}>
                  <span style={{ ...T.accent,color:T.onSurfaceVariant,display:'block',marginBottom:8 }}>"Every picture tells a story."</span>
                  <p style={{ ...T.bodySm,color:T.outline,margin:0 }}>You can always change these later in settings.</p>
                </div>
              </div>
              {/* 底部操作 - back + finish */}
              <div style={{ marginTop:'auto',paddingTop:32,display:'flex',gap:12 }}>
                <button onClick={()=>setStep('mode')} style={{
                  width:56,height:56,borderRadius:'50%',...T.glassMd,
                  background:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.5)',
                  color:T.onBg,display:'flex',alignItems:'center',justifyContent:'center',
                  cursor:'pointer',fontSize:20,
                }}>←</button>
                <button onClick={handleFinish} style={{
                  flex:1,height:56,borderRadius:999,background:T.primary,color:T.onPrimary,
                  ...T.label,textTransform:'uppercase',letterSpacing:'0.05em',border:'none',
                  cursor:'pointer',boxShadow:T.btnShadow,
                }}>完成设置</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 动画 CSS - 完全来自 code.html <style> */}
      <style>{`@keyframes floatE{0%,100%{transform:translateY(0)rotate(0deg)}50%{transform:translateY(-15px)rotate(10deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}button:active{transform:scale(.97)!important}`}</style>
    </div>
  )
}
