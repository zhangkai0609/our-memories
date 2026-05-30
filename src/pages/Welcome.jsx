import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#fff0f3', primary: '#7d2b1e', onPrimary: '#ffffff',
  pFixed: '#ffdad4', surface: '#fff8f7', text: '#56423f', light: '#89726e',
  border: '#dcc0bc', card: '#fcf9f2', onBg: '#271815',
}

const modes = [
  { id: 'couple', emoji: '👩‍❤️‍👨', label: 'Couple' },
  { id: 'friends', emoji: '👯‍♀️', label: 'Friends' },
  { id: 'besties', emoji: '🤞', label: 'Besties' },
  { id: 'family', emoji: '🏡', label: 'Family' },
]

const glassUnselected = {
  backgroundColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)',
}
const glassSelected = {
  backgroundColor: 'rgba(156,66,51,0.1)', backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(156,66,51,0.4)',
  boxShadow: 'inset 0 0 20px rgba(156,66,51,0.15), 0 8px 32px rgba(156,66,51,0.1)',
}

export default function Welcome() {
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState('couple')
  const [myName, setMyName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [myAvatar, setMyAvatar] = useState(null)
  const [partnerAvatar, setPartnerAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const meRef = useRef(null)
  const partnerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const existing = localStorage.getItem('room_code')
    if (existing && localStorage.getItem('my_name')) navigate('/')
  }, [])

  // ===== STEP 1: Room Code =====
  async function handleCodeSubmit(e) {
    e.preventDefault()
    const c = code.trim().toLowerCase()
    if (!c || c.length < 2) return
    localStorage.setItem('room_code', c)
    setLoading(true)
    const { data } = await supabase.from('memories').select('id').eq('room_code', c).limit(1)
    setLoading(false)
    if (data && data.length > 0) {
      if (!localStorage.getItem('my_name')) localStorage.setItem('my_name', '小周同学')
      if (!localStorage.getItem('partner_name')) localStorage.setItem('partner_name', '另一半')
      if (!localStorage.getItem('room_mode')) localStorage.setItem('room_mode', 'couple')
      navigate('/')
    } else {
      setStep('mode')
    }
  }

  // ===== STEP 2: Mode =====
  function handleModeConfirm() {
    localStorage.setItem('room_mode', mode)
    setStep('profile')
  }

  // ===== STEP 3: Profile =====
  function handleFile(e, setter) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setter(r.result)
    r.readAsDataURL(f)
  }

  function handleFinish() {
    localStorage.setItem('my_name', myName || '小周同学')
    localStorage.setItem('partner_name', partnerName || '另一半')
    if (myAvatar) localStorage.setItem('my_avatar', myAvatar)
    if (partnerAvatar) localStorage.setItem('partner_avatar', partnerAvatar)
    navigate('/')
  }

  return (
    <div style={{ minHeight: 'max(884px,100dvh)', background: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 430, minHeight: 800, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', borderRadius: 40, boxShadow: '0 20px 60px rgba(86,66,63,0.05)', border: '1px solid rgba(220,192,188,0.3)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Ambient Glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,200,190,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Floating Emojis */}
        {[{ e:'✨',t:48,l:32,d:0,s:24 },{ e:'💫',t:128,r:40,d:1,s:20 },{ e:'🌸',b:160,l:48,d:2,s:30 },{ e:'♥',t:'50%',r:24,d:1.5,s:20,cl:C.primary },{ e:'⭐',b:80,r:64,d:0.5,s:24 },{ e:'🎀',t:256,l:24,d:2.5,s:24 }].map((x,i) => (
          <span key={i} style={{ position:'absolute',top: x.t,bottom: x.b,left: x.l,right: x.r,fontSize: x.s,color: x.cl||undefined,pointerEvents:'none',zIndex:0,animation: `floatE 6s ease-in-out ${x.d}s infinite` }}>{x.e}</span>
        ))}

        <div style={{ flex:1, position:'relative',zIndex:10, padding:20, display:'flex',flexDirection:'column' }}>

          {/* ═══════ STEP 1: CodeStep ═══════ */}
          {step === 'code' && (
            <div style={{ display:'flex',flexDirection:'column',height:'100%',justifyContent:'space-between',paddingBottom:32,paddingTop:48,animation:'fadeIn .4s ease-out' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ position:'relative',width:256,height:256,margin:'0 auto',borderRadius:32,overflow:'hidden',boxShadow:'0 15px 40px rgba(86,66,63,0.12)',transform:'rotate(2deg)',border:'6px solid #fff' }}>
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWpbALArNceXkcvYhIUwXHYKwjKBVAQjGMTMM7jfo5QrP7Y2oAE2R8PA_CbSf3rYLP9koum8NWRygQim5BdnIfc_UYBCekN5JaPOTBi1B4Wv4kL-eIZfBPYUrGwyO-aBxG0uYlEnfxI6PwHAhm6WpbtSUAfSAkb_9aOYaBRdEk4ozLEJfs0zw8c8WkreSFrz6oKmMPMAPIQ__R-KPA5Wh2-lvhtXwtpsq2XPeaD2AKtloC4xPOyy7CHfGdYoBMEKylnuhSgRXsrTs" alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                </div>
                <div style={{ marginTop:24 }}>
                  <h1 style={{ fontFamily: 'EB Garamond,serif', fontSize: 48, lineHeight:'56px', fontWeight: 700, color: C.primary, letterSpacing:'-0.02em', fontStyle:'italic',margin:0 }}>Our Memories</h1>
                  <p style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 16, lineHeight:'24px', color: C.text, margin:'8px 0 0' }}>Start your digital scrapbook together.</p>
                </div>
              </div>

              <form onSubmit={handleCodeSubmit} style={{ marginTop:48, padding:24, borderRadius:24, background:'rgba(255,255,255,0.4)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.3)', boxShadow:'0 8px 32px rgba(86,66,63,0.05)', display:'flex',flexDirection:'column',gap:24 }}>
                <div>
                  <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,color:C.onBg,marginLeft:16,textTransform:'uppercase',display:'block',marginBottom:8 }}>Room Code</label>
                  <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter 6-digit code..."
                    style={{ width:'100%',height:56,padding:'0 24px',borderRadius:999,background:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.5)',fontSize:18,fontFamily:'Plus Jakarta Sans,sans-serif',textAlign:'center',letterSpacing:'0.2em',outline:'none',boxSizing:'border-box',boxShadow:'inset 0 1px 4px rgba(0,0,0,0.05)' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width:'100%',height:56,borderRadius:999,background:C.primary,color:C.onPrimary,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',border:'none',cursor:'pointer',boxShadow:'0 8px 20px rgba(156,66,51,0.25),inset 0 2px 4px rgba(255,255,255,0.2)',opacity:loading?0.7:1 }}>
                  {loading ? 'Joining...' : 'Join Scrapbook'}
                </button>
                <p style={{ textAlign:'center',fontSize:14,fontFamily:'Plus Jakarta Sans,sans-serif',color:C.text,cursor:'pointer' }}>or create a new one</p>
              </form>
            </div>
          )}

          {/* ═══════ STEP 2: ModeStep ═══════ */}
          {step === 'mode' && (
            <div style={{ display:'flex',flexDirection:'column',height:'100%',paddingTop:64,paddingBottom:32,animation:'fadeIn .4s ease-out' }}>
              <div style={{ textAlign:'center',marginBottom:48 }}>
                <h2 style={{ fontFamily:'EB Garamond,serif',fontSize:28,lineHeight:'36px',fontWeight:600,color:C.onBg,margin:'0 0 12px' }}>Select Relationship Mode</h2>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:16,color:C.text,margin:0 }}>How do you know each other?</p>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,flex:1 }}>
                {modes.map(m => {
                  const sel = mode === m.id
                  return (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      style={{ cursor:'pointer',position:'relative',borderRadius:16,padding:'24px 16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,fontFamily:'Plus Jakarta Sans,sans-serif',transition:'all .3s',...(sel?glassSelected:glassUnselected) }}>
                      {sel && <div style={{ position:'absolute',top:12,right:12,width:24,height:24,borderRadius:'50%',background:C.primary,color:C.onPrimary,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>✓</div>}
                      {!sel && <div style={{ position:'absolute',top:12,right:12,width:24,height:24,borderRadius:'50%',border:'2px solid rgba(220,192,188,0.3)',display:'flex',alignItems:'center',justifyContent:'center' }} />}
                      <span style={{ fontSize:36,transition:'transform .2s' }}>{m.emoji}</span>
                      <span style={{ fontSize:14,fontWeight:600,color:sel?C.primary:C.text }}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop:'auto',paddingTop:32 }}>
                <button onClick={handleModeConfirm}
                  style={{ width:'100%',height:56,borderRadius:999,background:C.primary,color:C.onPrimary,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',border:'none',cursor:'pointer',boxShadow:'0 8px 20px rgba(156,66,51,0.25),inset 0 2px 4px rgba(255,255,255,0.2)' }}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 3: ProfileStep ═══════ */}
          {step === 'profile' && (
            <div style={{ display:'flex',flexDirection:'column',height:'100%',paddingTop:64,paddingBottom:32,animation:'fadeIn .4s ease-out' }}>
              <div style={{ textAlign:'center',marginBottom:64 }}>
                <h2 style={{ fontFamily:'EB Garamond,serif',fontSize:28,fontWeight:600,color:C.onBg,margin:'0 0 12px' }}>Set Your Avatars</h2>
                <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:16,color:C.text,margin:0 }}>Personalize your scrapbook pages.</p>
              </div>

              <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:48,padding:'0 16px' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:24,width:'100%' }}>
                  {/* Avatar 1 */}
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
                    <button onClick={() => meRef.current?.click()} style={{ width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.5)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.6)',boxShadow:'0 10px 25px rgba(86,66,63,0.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative',overflow:'hidden' }}>
                      {myAvatar ? <img src={myAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <span style={{ fontSize:30,color:C.light }}>📷</span>}
                      <input ref={meRef} type="file" accept="image/*" onChange={e => handleFile(e, setMyAvatar)} style={{ display:'none' }} />
                    </button>
                    <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your Name"
                      style={{ width:112,textAlign:'center',background:'transparent',border:'none',borderBottom:'1px solid rgba(220,192,188,0.5)',padding:'4px 8px',fontSize:16,fontFamily:'Plus Jakarta Sans,sans-serif',color:C.onBg,outline:'none' }} />
                  </div>
                  {/* Heart */}
                  <div style={{ flexShrink:0,marginTop:-40 }}>
                    <span style={{ fontSize:24,fontWeight:600,color:C.primary,opacity:.8 }}>♥</span>
                  </div>
                  {/* Avatar 2 */}
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
                    <button onClick={() => partnerRef.current?.click()} style={{ width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.5)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.6)',boxShadow:'0 10px 25px rgba(86,66,63,0.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative',overflow:'hidden' }}>
                      {partnerAvatar ? <img src={partnerAvatar} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <span style={{ fontSize:30,color:C.light }}>📷</span>}
                      <input ref={partnerRef} type="file" accept="image/*" onChange={e => handleFile(e, setPartnerAvatar)} style={{ display:'none' }} />
                    </button>
                    <input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Their Name"
                      style={{ width:112,textAlign:'center',background:'transparent',border:'none',borderBottom:'1px solid rgba(220,192,188,0.5)',padding:'4px 8px',fontSize:16,fontFamily:'Plus Jakarta Sans,sans-serif',color:C.onBg,outline:'none' }} />
                  </div>
                </div>

                {/* Quote Card */}
                <div style={{ width:'100%',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',background:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:16,padding:24,boxShadow:'0 10px 30px rgba(86,66,63,0.05)',textAlign:'center' }}>
                  <span style={{ fontFamily:'EB Garamond,serif',fontSize:18,fontStyle:'italic',color:C.text,display:'block',marginBottom:8 }}>"Every picture tells a story."</span>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,color:C.light,margin:0 }}>You can always change these later in settings.</p>
                </div>
              </div>

              <div style={{ marginTop:'auto',paddingTop:32,display:'flex',gap:12 }}>
                <button onClick={() => setStep('mode')}
                  style={{ width:56,height:56,borderRadius:'50%',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',background:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.5)',color:C.onBg,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:20 }}>←</button>
                <button onClick={handleFinish}
                  style={{ flex:1,height:56,borderRadius:999,background:C.primary,color:C.onPrimary,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',border:'none',cursor:'pointer',boxShadow:'0 8px 20px rgba(156,66,51,0.25),inset 0 2px 4px rgba(255,255,255,0.2)' }}>
                  Finish Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{css}</style>
    </div>
  )
}

const css = `
@keyframes floatE { 0%,100%{transform:translateY(0)rotate(0deg)} 50%{transform:translateY(-15px)rotate(10deg)} }
@keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
button:active{transform:scale(.97)!important}
`
