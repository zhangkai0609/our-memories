import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
/* ===== 城市漫步冒险 - 日记详情页 ===== */

const T = {
  primary:'#7d2b1e', maroon:'#8b3a3a', brown:'#5c3d2e', text:'#4a3228',
  light:'#8b7770', bg:'#f8f5f0', grid:'rgba(180,160,150,0.12)',
  tapeBlue:'#a8c8e8', tapeGreen:'#b8d4b0',
}

export default function DiaryDetail() {
  const navigate=useNavigate()
  const [entry,setEntry]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{fetchEntry()},[])

  async function fetchEntry(){
    // TODO: 从 Supabase 加载指定ID的日记
    try{
      const rc=localStorage.getItem('room_code')
      if(rc){
        const {data}=await supabase.from('memories').select('*').eq('room_code',rc).order('created_at',{ascending:false}).limit(1)
        if(data&&data.length>0)setEntry(data[0])
      }
    }catch{}finally{setLoading(false)}
  }

  // Mock data - city exploration
  const mockEntry = {
    title:'City Exploration Adventure',
    subtitle:'城市漫步冒险',
    date:'Saturday, May 18th',
    time:'3:00 PM',
    location:'Downtown Bookstore District',
    subject:'Weekend Adventures',
    narrative:`在这个城市的小角落，我们又发现了一家很棒的书店。那里的空气里弥漫着陈旧的书香和咖啡的混合味道。我们在那里呆了一下午，只为了寻找一本特定的旧书。虽然没找到，但这个过程却成了我们美好的回忆。`,
    tags:['#小众探索','#城市漫步','#双向奔赴陈先生'],
    mainPhoto:'https://lh3.googleusercontent.com/aida-public/AB6AXuDud5H39Rkg0KV0qlKRsS2uax0KSXw3Bqwu4B9Q7YQ0lZ-Eq_QfhNoKbSJ1t3chDnMCRcbWye-RDPhM9SI-srB6lzS7FRpaUQh2TWqpuwb-qEch4D5rYq__M1dwdWygDUi_xryyNw_zoEQTQPHYVGXABG4ooMToeFqRm73Q-idOwzTYeL2xpmXU-CzPN5AfjMj43RGOe2vxbt79z6vcVvDPhGvPtzCsMez_XC9W25q0VDcsvbIfduAdlg1U-TzsgC6HiXDKn1I5PUs',
    cafePhoto:'https://lh3.googleusercontent.com/aida-public/AB6AXuBPygZfQI3dscIzvK-N7cn8AvAiwVj3VEz22GjQNUaLg02jh2t0yVNyi8mKGMJqFdx_gv7W4eY8UeDSlE5tE06w-6et6jm1XxfHUilZJVM8d4f5Rvur41bXahxAYq28oyaIB4C4lq4BmFwpC5-K8yP1otZCX2izMJHDutM21RDuaX8j7KxQAmK95AlP6-XWeJQKNcQzumtx1WgfTAqS9gF9BanAi6t84H1qFB4kNxxUvei4ImTNWE5WnJkUWpcjjkuI824NepDjriQ',
    manPhoto:'https://lh3.googleusercontent.com/aida-public/AB6AXuBhbtjIjdNiba5Xd1t4FwrOE6Ry1Ux9VKXeciczJtOTzhhuJXaFSSKtENfBIvtAsWpILMglF8XLCX0tZMctLiNFHyQDiG9mnEk_T4sjIWBGRvrajIag73tCHsrAglSSF7TlxVWF2rYnCNZkgdtYMF_b2axMsewaCArvcJ5n2Y4zFE1H3_qJ2a7b9PGhCcrWwJ4FyAlyaMG4YF4k90Ugnf52AsHd1kM0uh9uc7MwCVT955QmONTQDFYGBqMYoAM_OmKJZ3_AacHj3CY',
  }

  const e = (entry && entry.title) ? {...mockEntry, ...entry, tags: entry.tags || mockEntry.tags, image_urls: entry.image_urls || [], narrative: entry.content || mockEntry.narrative} : mockEntry

  if(loading) return <div style={{ minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.light }}>Loading...</div>

  return (
    <div style={{ minHeight:'max(884px,100dvh)',background:T.bg,display:'flex',justifyContent:'center',padding:'20px 0',position:'relative' }}>
      {/* 外边框 dotted 装饰 */}
      <div style={{ position:'fixed',inset:8,pointerEvents:'none',zIndex:0,border:'2px dashed rgba(180,160,150,0.15)',borderRadius:4 }} />

      <div style={{ width:'100%',maxWidth:460,background:'#faf9f6',position:'relative',overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.06)',borderRadius:2 }}>

        {/* ═══ 5mm 方格纸纹理 ═══ */}
        <div style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:0,
          backgroundImage:`linear-gradient(${T.grid} 1px,transparent 1px),linear-gradient(90deg,${T.grid} 1px,transparent 1px)`,
          backgroundSize:'20px 20px' }} />

        {/* ═══ 左侧金属螺旋装订 ═══ */}
        <div style={{ position:'absolute',left:-6,top:20,bottom:20,width:24,display:'flex',flexDirection:'column',gap:5,alignItems:'center',zIndex:5 }}>
          {Array.from({length:22},(_,i)=>(
            <div key={i} style={{ width:16,height:12,borderRadius:10,
              background:'linear-gradient(180deg,#c8c0b8 0%,#e8e4e0 30%,#d0c8c0 50%,#e0dcd8 70%,#b8b0a8 100%)',
              border:'1px solid #a09890',
              boxShadow:'inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 1px rgba(0,0,0,0.1)' }} />
          ))}
        </div>

        <div style={{ position:'relative',zIndex:1,padding:'24px 24px 24px 40px' }}>

          {/* ═══ HEADER 区 ═══ */}
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:20,borderBottom:'1px solid rgba(139,58,58,0.15)',paddingBottom:12 }}>
            <div style={{ display:'flex',gap:24 }}>
              {/* SUBJECT TOPIC */}
              <div>
                <div style={{ fontSize:9,fontWeight:700,color:T.light,fontFamily:'"Plus Jakarta Sans",sans-serif',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:4 }}>Subject Topic:</div>
                <div style={{ fontSize:13,fontWeight:600,color:T.maroon,fontFamily:'"Plus Jakarta Sans",sans-serif',borderBottom:'1.5px solid rgba(139,58,58,0.2)',paddingBottom:2,minWidth:100 }}>{e.subject||'Weekend Adventures'}</div>
              </div>
              {/* DATE */}
              <div>
                <div style={{ fontSize:9,fontWeight:700,color:T.light,fontFamily:'"Plus Jakarta Sans",sans-serif',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:4 }}>Date:</div>
                <div style={{ display:'flex',gap:3,fontSize:10,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.brown }}>
                  {['M','T','W','Th','F','S','Su'].map((d,i)=>(
                    <span key={i} style={{ width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:i===5?'rgba(139,58,58,0.1)':'transparent',color:i===5?T.maroon:T.light }}>{d}</span>
                  ))}
                </div>
                <div style={{ fontSize:11,color:T.maroon,fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:600,marginTop:2 }}>18th</div>
              </div>
            </div>
            {/* STICKERS 区域 */}
            <div style={{ border:'1.5px dashed rgba(139,58,58,0.25)',borderRadius:8,padding:'6px 10px',textAlign:'center',position:'relative' }}>
              <span style={{ fontSize:9,color:T.light,fontFamily:'"Plus Jakarta Sans",sans-serif',display:'block' }}>INSERT</span>
              <span style={{ fontSize:9,color:T.light,fontFamily:'"Plus Jakarta Sans",sans-serif',display:'block' }}>STICKERS</span>
              <span style={{ fontSize:9,color:T.light,fontFamily:'"Plus Jakarta Sans",sans-serif',display:'block' }}>HERE</span>
              {/* 装饰贴纸 */}
              <span style={{ position:'absolute',top:-4,right:-6,fontSize:16,transform:'rotate(15deg)',pointerEvents:'none' }}>⭐</span>
              <span style={{ position:'absolute',bottom:-4,left:-4,fontSize:12,transform:'rotate(-20deg)',pointerEvents:'none' }}>💝</span>
            </div>
          </div>

          {/* ═══ 主标题 - 手写体 maroon ═══ */}
          <h1 style={{ fontFamily:'"EB Garamond",serif',fontSize:26,fontWeight:600,fontStyle:'italic',color:T.maroon,margin:'0 0 16px',letterSpacing:'-0.01em',position:'relative' }}>
            {e.title}
            {/* 蝴蝶结贴纸 */}
            <span style={{ position:'absolute',top:-8,right:20,fontSize:22,pointerEvents:'none',transform:'rotate(12deg)' }}>🎀</span>
            {/* 小花朵 */}
            <span style={{ position:'absolute',bottom:-8,left:'60%',fontSize:14,pointerEvents:'none',opacity:.7 }}>🌸</span>
          </h1>

          {/* ═══ 照片拼贴区 ═══ */}
          <div style={{ display:'flex',gap:10,marginBottom:16,position:'relative' }}>

            {/* 左列 - 大图：女生看书 */}
            <div style={{ flex:'0 0 140px',position:'relative' }}>
              {/* "好好吃饭" 贴纸框 */}
              <div style={{ position:'absolute',top:-8,left:6,zIndex:3,background:'rgba(255,255,255,0.85)',border:`1.5px solid ${T.maroon}`,borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:600,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.maroon,transform:'rotate(-5deg)',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                好好吃饭
              </div>
              {/* 蓝色格纹胶带 */}
              <div style={{ position:'absolute',bottom:-6,left:10,zIndex:3,width:44,height:14,background:`repeating-linear-gradient(0deg,${T.tapeBlue} 0px,${T.tapeBlue} 3px,transparent 3px,transparent 4px),repeating-linear-gradient(90deg,${T.tapeBlue} 0px,${T.tapeBlue} 3px,transparent 3px,transparent 4px)`,opacity:.55,borderRadius:1,transform:'rotate(-4deg)',boxShadow:'0 1px 2px rgba(0,0,0,0.06)' }} />
              <div style={{ background:'#fff',padding:'5px 5px 18px',borderRadius:2,boxShadow:'0 3px 12px rgba(0,0,0,0.08)',transform:'rotate(-2deg)' }}>
                <div style={{ width:'100%',height:180,background:'#e8e0d8',overflow:'hidden',borderRadius:1 }}>
                  <img src={e.mainPhoto} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',filter:'sepia(8%) brightness(0.95)' }} />
                </div>
                {/* Thought bubble */}
                <div style={{ position:'absolute',top:-30,right:-20,background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:12,padding:'4px 8px',fontSize:8,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.brown,maxWidth:80,boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  A 小目标如拍到最满意的街拍照片
                  <div style={{ position:'absolute',bottom:-6,left:16,width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderTop:'6px solid #fff' }} />
                </div>
              </div>
            </div>

            {/* 右列 - 复合拼贴 */}
            <div style={{ flex:1,display:'flex',flexDirection:'column',gap:8 }}>
              {/* 顶部小图组 */}
              <div style={{ display:'flex',gap:6,alignItems:'flex-start' }}>
                {/* Cafe 小图 */}
                <div style={{ flex:1,background:'#fff',padding:'3px 3px 12px',borderRadius:2,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',transform:'rotate(3deg)' }}>
                  <div style={{ width:'100%',height:60,background:'#e8e0d8',overflow:'hidden',borderRadius:1 }}>
                    <img src={e.cafePhoto} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',filter:'sepia(5%)' }} />
                  </div>
                  <span style={{ position:'absolute',top:-6,left:'50%',transform:'translateX(-50%) skewX(-10deg)',width:20,height:8,background:'rgba(255,255,255,0.7)',borderRadius:1,zIndex:2 }} />
                  {/* 小咖啡杯 */}
                  <span style={{ position:'absolute',bottom:-4,right:-2,fontSize:12,pointerEvents:'none' }}>☕</span>
                </div>
                {/* 金星贴纸 */}
                <span style={{ fontSize:20,transform:'rotate(20deg)',flexShrink:0,pointerEvents:'none',marginTop:4 }}>⭐</span>
                {/* 街景小图 */}
                <div style={{ flex:1,background:'#fff',padding:'3px 3px 12px',borderRadius:2,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',transform:'rotate(-4deg)' }}>
                  <div style={{ width:'100%',height:55,background:'#e8e0d8',overflow:'hidden',borderRadius:1 }}>
                    <div style={{ width:'100%',height:'100%',background:'linear-gradient(135deg,#d5cfc8,#c0b8b0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>🏛</div>
                  </div>
                </div>
                {/* 心形贴纸 */}
                <span style={{ fontSize:14,transform:'rotate(-15deg)',flexShrink:0,pointerEvents:'none',marginTop:6 }}>♥</span>
              </div>

              {/* 底部 - 男人照片 + 涂鸦 */}
              <div style={{ position:'relative',background:'#fff',padding:'5px 5px 18px',borderRadius:2,boxShadow:'0 3px 12px rgba(0,0,0,0.08)',transform:'rotate(1deg)' }}>
                {/* 面部涂鸦 - 眉毛面具 + 胡子 */}
                <svg style={{ position:'absolute',top:'15%',left:'10%',width:'80%',height:'50%',zIndex:3,pointerEvents:'none' }}>
                  {/* 粗眉毛 */}
                  <path d="M 25,10 Q 30,2 35,10" stroke="#3a2010" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M 55,10 Q 60,2 65,10" stroke="#3a2010" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  {/* 八字胡 */}
                  <path d="M 30,45 Q 45,50 60,45" stroke="#3a2010" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* 下巴胡 */}
                  <path d="M 40,52 Q 45,58 50,52" stroke="#3a2010" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
                {/* 思想泡泡 */}
                <div style={{ position:'absolute',top:-25,left:6,background:'#fff',border:'1px solid rgba(0,0,0,0.06)',borderRadius:10,padding:'3px 8px',fontSize:7.5,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.brown,maxWidth:120,zIndex:4,boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
                  愿意陪我压马路的陈先生~<br/>愿意帮我看地图的陈先生~
                  <div style={{ position:'absolute',bottom:-5,left:20,width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'5px solid #fff' }} />
                </div>
                <div style={{ width:'100%',height:100,background:'#e8e0d8',overflow:'hidden',borderRadius:1 }}>
                  <img src={e.manPhoto} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',filter:'sepia(5%) brightness(0.95)' }} />
                </div>
                {/* "在线表演一口香~" */}
                <div style={{ position:'absolute',bottom:22,left:'50%',transform:'translateX(-50%)',fontSize:9,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.maroon,fontWeight:600,zIndex:2,background:'rgba(255,255,255,0.7)',padding:'2px 6px',borderRadius:6 }}>在线表演一口香~</div>
                {/* 绿色波点胶带 */}
                <div style={{ position:'absolute',bottom:-6,right:12,zIndex:3,width:38,height:12,background:`radial-gradient(circle,${T.tapeGreen} 2px,transparent 2px)`,backgroundSize:'6px 6px',opacity:.5,borderRadius:1,transform:'rotate(3deg)' }} />
              </div>
            </div>
          </div>

          {/* ═══ 叙事文字列 ═══ */}
          <div style={{ display:'flex',gap:12,marginBottom:16 }}>
            {/* 左侧装饰 - 地图别针 */}
            <span style={{ fontSize:16,opacity:.6,marginTop:4,flexShrink:0,pointerEvents:'none' }}>📍</span>
            {/* 文字 */}
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:'"EB Garamond",serif',fontSize:15,fontStyle:'italic',color:T.brown,lineHeight:1.9,margin:'0 0 10px',letterSpacing:'0.01em' }}>
                {e.narrative}
              </p>
              <p style={{ fontFamily:'"EB Garamond",serif',fontSize:13,fontStyle:'italic',color:T.primary,lineHeight:1.7,margin:'0 0 10px' }}>
                City exploration with my love ~
              </p>
              {/* Hashtags */}
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {(e.tags||[]).map(t=>(
                  <span key={t} style={{ fontSize:11,fontFamily:'"Plus Jakarta Sans",sans-serif',color:T.light,background:'rgba(139,58,58,0.05)',padding:'3px 8px',borderRadius:6 }}>{t}</span>
                ))}
              </div>
            </div>
            {/* 小照相机图标 */}
            <span style={{ fontSize:18,opacity:.5,marginTop:4,flexShrink:0,pointerEvents:'none' }}>📷</span>
          </div>

          {/* ═══ 底部装饰 ═══ */}
          <div style={{ borderTop:'1px solid rgba(139,58,58,0.1)',paddingTop:10,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div style={{ display:'flex',gap:6,alignItems:'center' }}>
              <span style={{ fontSize:10,pointerEvents:'none' }}>🌸</span>
              <span style={{ fontSize:12,pointerEvents:'none',transform:'rotate(-8deg)' }}>💝</span>
              <span style={{ fontSize:9,color:T.light,fontFamily:'"Plus Jakarta Sans",sans-serif' }}>Saved as memory</span>
            </div>
            <button onClick={()=>navigate('/gallery')} style={{
              background:'none',border:'none',color:T.maroon,cursor:'pointer',
              fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:12,fontWeight:600,
              display:'flex',alignItems:'center',gap:4,
            }}>
              ← Back to Diary
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
