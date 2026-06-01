import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppIcon from '../components/AppIcon'
import { enterRoom, getRoomPassword, saveRoomProfile, setRoomPassword } from '../lib/roomProfile'
import { supabase } from '../lib/supabase'

const T = {
  ink: '#271815',
  muted: '#6f5b57',
  primary: '#7d2b1e',
  wine: '#9c4233',
  border: 'rgba(255,255,255,0.68)',
  glass: 'rgba(255,255,255,0.52)',
  fontTitle: '"Noto Serif SC", "EB Garamond", "Songti SC", serif',
  fontBody: '"Noto Serif SC", "Plus Jakarta Sans", "Microsoft YaHei", sans-serif',
  shadow: '0 28px 70px rgba(64,80,86,0.18), inset 0 1px 0 rgba(255,255,255,0.92)',
}

const modes = [
  { id: 'couple', emoji: '♡', label: '情侣' },
  { id: 'friends', emoji: '♧', label: '朋友' },
  { id: 'besties', emoji: '✦', label: '闺蜜' },
  { id: 'family', emoji: '⌂', label: '家人' },
]

export default function Welcome() {
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('couple')
  const [myName, setMyName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [myAvatar, setMyAvatar] = useState(null)
  const [partnerAvatar, setPartnerAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const meRef = useRef(null)
  const partnerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const room = localStorage.getItem('room_code')
    if (room && localStorage.getItem('my_name')) navigate('/')
  }, [navigate])

  async function handleRoom(action) {
    const roomCode = code.trim().toLowerCase()
    if (!roomCode || roomCode.length < 2) {
      setMessage('请输入至少 2 位小屋代号')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const savedPassword = getRoomPassword(roomCode)
      const { data } = await supabase.from('memories').select('id').eq('room_code', roomCode).limit(1)
      const roomExists = Boolean(savedPassword || data?.length)
      if (action === 'login') {
        if (!roomExists) {
          localStorage.removeItem('room_code')
          setMessage('还没有找到这个小屋，可以先注册它')
          return
        }
        if (!password) {
          setMessage('请输入小屋密码')
          return
        }
        if (savedPassword && password !== savedPassword) {
          setMessage('小屋密码不正确')
          return
        }
        enterRoom(roomCode)
        navigate('/')
        return
      }

      if (!password || password.length < 4) {
        setMessage('请设置至少 4 位小屋密码')
        return
      }
      if (roomExists && savedPassword && password !== savedPassword) {
        setMessage('这个小屋已经存在，请输入正确密码登录')
        return
      }
      setRoomPassword(roomCode, password)
      enterRoom(roomCode)
      setStep('mode')
    } finally {
      setLoading(false)
    }
  }

  function handleCodeSubmit(event) {
    event.preventDefault()
    handleRoom('login')
  }

  function handleFile(event, setter) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setter(reader.result)
    reader.readAsDataURL(file)
  }

  function handleFinish() {
    localStorage.setItem('my_name', myName || '小周同学')
    localStorage.setItem('partner_name', partnerName || '另一半')
    localStorage.setItem('room_mode', mode)
    if (myAvatar) localStorage.setItem('my_avatar', myAvatar)
    if (partnerAvatar) localStorage.setItem('partner_avatar', partnerAvatar)
    saveRoomProfile({ myName: myName || '小周同学', partnerName: partnerName || '另一半', myAvatar, partnerAvatar, roomMode: mode })
    navigate('/')
  }

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        {step === 'code' && (
          <main style={loginCardStyle}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={markStyle}><AppIcon name="heart" size={28} /></div>
              <h1 style={titleStyle}>我们的记忆</h1>
              <p style={subtitleStyle}>进入属于你们的小屋</p>
            </div>

            <form onSubmit={handleCodeSubmit} style={innerCardStyle}>
              <label style={labelStyle}>小屋代号</label>
              <input
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder="输入小屋代号"
                style={inputStyle}
              />
              <label style={labelStyle}>小屋密码</label>
              <input
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="输入小屋密码"
                type="password"
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                {loading ? '进入中...' : '登录小屋'}
              </button>
              <button type="button" disabled={loading} onClick={() => handleRoom('register')} style={secondaryButtonStyle}>
                注册小屋
              </button>
              {message && <p style={messageStyle}>{message}</p>}
            </form>
          </main>
        )}

        {step === 'mode' && (
          <main style={loginCardStyle}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ ...titleStyle, fontSize: 30, lineHeight: '38px' }}>选择关系模式</h2>
              <p style={subtitleStyle}>给这个小屋一个开始的形状</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {modes.map(item => (
                <button key={item.id} onClick={() => setMode(item.id)} style={modeButtonStyle(mode === item.id)}>
                  <span style={{ fontSize: 28 }}>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('profile')} style={{ ...primaryButtonStyle, marginTop: 18 }}>继续</button>
          </main>
        )}

        {step === 'profile' && (
          <main style={loginCardStyle}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ ...titleStyle, fontSize: 30, lineHeight: '38px' }}>设置头像</h2>
              <p style={subtitleStyle}>以后也可以在小屋里修改</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: 10, alignItems: 'center' }}>
              <ProfilePicker refObj={meRef} avatar={myAvatar} name={myName} placeholder="你的名字" onFile={event => handleFile(event, setMyAvatar)} onName={setMyName} />
              <span style={{ color: T.primary, display: 'grid', placeItems: 'center' }}><AppIcon name="heart" size={22} /></span>
              <ProfilePicker refObj={partnerRef} avatar={partnerAvatar} name={partnerName} placeholder="ta的名字" onFile={event => handleFile(event, setPartnerAvatar)} onName={setPartnerName} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep('mode')} style={roundButtonStyle}><AppIcon name="back" size={22} /></button>
              <button onClick={handleFinish} style={primaryButtonStyle}>完成设置</button>
            </div>
          </main>
        )}
      </div>
      <style>{`button:active{transform:scale(.98)}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

function ProfilePicker({ refObj, avatar, name, placeholder, onFile, onName }) {
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
      <button onClick={() => refObj.current?.click()} style={avatarButtonStyle}>
        {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <AppIcon name="plus" size={25} />}
      </button>
      <input ref={refObj} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      <input value={name} onChange={event => onName(event.target.value)} placeholder={placeholder} style={nameInputStyle} />
    </div>
  )
}

const pageStyle = {
  minHeight: '100dvh',
  background: `
    radial-gradient(circle at 18% 10%, rgba(255,255,255,0.96), transparent 30%),
    radial-gradient(circle at 86% 18%, rgba(185,215,223,0.38), transparent 28%),
    radial-gradient(circle at 50% 90%, rgba(255,218,212,0.26), transparent 32%),
    linear-gradient(180deg, #fbfcfb 0%, #eef6f7 52%, #fff5f2 100%)
  `,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 18,
  fontFamily: T.fontBody,
  boxSizing: 'border-box',
}

const shellStyle = {
  width: '100%',
  maxWidth: 430,
  minHeight: 'min(760px, calc(100dvh - 36px))',
  display: 'grid',
  placeItems: 'center',
}

const loginCardStyle = {
  width: '100%',
  borderRadius: 34,
  border: `1.5px solid ${T.border}`,
  background: `linear-gradient(145deg, rgba(255,255,255,0.84), rgba(255,255,255,0.42) 56%, rgba(207,229,234,0.22)), ${T.glass}`,
  backdropFilter: 'blur(34px) saturate(1.42)',
  WebkitBackdropFilter: 'blur(34px) saturate(1.42)',
  boxShadow: T.shadow,
  padding: '38px 24px 26px',
  boxSizing: 'border-box',
  animation: 'fadeIn .4s ease-out',
}

const markStyle = {
  width: 58,
  height: 58,
  borderRadius: '50%',
  margin: '0 auto 16px',
  display: 'grid',
  placeItems: 'center',
  border: `1px solid ${T.border}`,
  background: 'linear-gradient(145deg, rgba(255,255,255,0.86), rgba(185,215,223,0.28))',
  boxShadow: '0 14px 34px rgba(64,80,86,0.14)',
  color: T.primary,
  fontSize: 28,
  fontWeight: 900,
}

const titleStyle = {
  margin: 0,
  color: T.primary,
  fontFamily: T.fontTitle,
  fontSize: 40,
  lineHeight: '48px',
  fontWeight: 760,
  letterSpacing: 0,
}

const subtitleStyle = {
  margin: '8px 0 0',
  color: T.muted,
  fontSize: 14,
  lineHeight: '20px',
  fontWeight: 750,
}

const innerCardStyle = {
  padding: 16,
  borderRadius: 26,
  background: 'rgba(255,255,255,0.36)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.62)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72), 0 14px 34px rgba(86,66,63,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const labelStyle = {
  color: T.primary,
  marginLeft: 14,
  fontSize: 12,
  fontWeight: 900,
}

const inputStyle = {
  width: '100%',
  height: 52,
  padding: '0 18px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.62)',
  border: `1px solid ${T.border}`,
  fontSize: 16,
  fontFamily: T.fontBody,
  textAlign: 'center',
  outline: 'none',
  boxSizing: 'border-box',
  color: T.ink,
  fontWeight: 800,
  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.05)',
}

const primaryButtonStyle = {
  width: '100%',
  height: 52,
  borderRadius: 999,
  background: T.primary,
  color: '#fff',
  border: 'none',
  fontFamily: T.fontBody,
  fontSize: 15,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 12px 26px rgba(125,43,30,0.24), inset 0 1px 0 rgba(255,255,255,0.18)',
}

const secondaryButtonStyle = {
  width: '100%',
  height: 48,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.52)',
  color: T.primary,
  border: '1px solid rgba(125,43,30,0.14)',
  fontFamily: T.fontBody,
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
}

const messageStyle = {
  margin: '2px 6px 0',
  textAlign: 'center',
  color: T.primary,
  fontSize: 12,
  lineHeight: '18px',
  fontWeight: 850,
}

function modeButtonStyle(active) {
  return {
    minHeight: 106,
    borderRadius: 22,
    border: `1px solid ${active ? 'rgba(125,43,30,0.32)' : T.border}`,
    background: active ? 'rgba(125,43,30,0.10)' : 'rgba(255,255,255,0.38)',
    color: active ? T.primary : T.muted,
    display: 'grid',
    placeItems: 'center',
    alignContent: 'center',
    gap: 8,
    fontFamily: T.fontBody,
    fontSize: 14,
    fontWeight: 900,
    cursor: 'pointer',
  }
}

const avatarButtonStyle = {
  width: 82,
  height: 82,
  borderRadius: '50%',
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.48)',
  color: T.primary,
  fontSize: 28,
  fontWeight: 900,
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 12px 26px rgba(64,80,86,0.12)',
}

const nameInputStyle = {
  width: '100%',
  minWidth: 0,
  height: 36,
  border: 'none',
  borderBottom: '1px solid rgba(125,43,30,0.18)',
  background: 'transparent',
  outline: 'none',
  color: T.ink,
  textAlign: 'center',
  fontFamily: T.fontBody,
  fontSize: 13,
  fontWeight: 800,
}

const roundButtonStyle = {
  width: 54,
  height: 52,
  borderRadius: '50%',
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.46)',
  color: T.primary,
  fontSize: 25,
  fontWeight: 900,
  cursor: 'pointer',
}
